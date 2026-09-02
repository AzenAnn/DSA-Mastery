import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  NODE_MINIMUM,
  PNPM_VERSION,
  PROFILES,
  compareVersion,
  parseVersion,
  profileRequirements,
} from "../scripts/bootstrap/requirements.mjs";
import { parseSetupArgs } from "../scripts/bootstrap/options.mjs";
import {
  createStageState,
  createProgressUI,
  renderPlain,
  renderTuiFrame,
} from "../scripts/bootstrap/ui.mjs";
import {
  inspectHost,
  evaluateProfile,
  parseCommandVersion,
} from "../scripts/bootstrap/checks.mjs";
import {
  parseEnvironmentBlock,
  createMsvcEnvironment,
  isMsvcCommand,
  parseVsWherePath,
} from "../tools/lab/toolchain.mjs";
import { runCommand } from "../scripts/bootstrap/commands.mjs";
import {
  assertRepositorySafe,
  planToolchainInstall,
  resolveRepositoryDir,
  runSetup,
} from "../scripts/bootstrap/setup.mjs";

test("version helpers compare partial versions and reject malformed values", () => {
  assert.deepEqual(parseVersion("v22.13.0"), [22, 13, 0]);
  assert.deepEqual(parseVersion("Apple clang version 14.0.3"), [14, 0, 3]);
  assert.equal(parseVersion("not a version"), undefined);
  assert.equal(compareVersion([22, 13, 0], NODE_MINIMUM), true);
  assert.equal(compareVersion([22, 12, 99], NODE_MINIMUM), false);
});

test("basic and full profiles differ only by the Project CMake requirement", () => {
  assert.deepEqual(Object.keys(PROFILES), ["basic", "full"]);
  assert.equal(profileRequirements("basic").requiresCmake, false);
  assert.equal(profileRequirements("full").requiresCmake, true);
  assert.equal(PNPM_VERSION, "11.1.1");
});

test("setup arguments normalize profile, UI, and repository options", () => {
  assert.deepEqual(parseSetupArgs([
    "--profile", "full",
    "--repo-dir", "student project",
    "--repo-url=https://example.test/repo.git",
    "--check-only",
    "--ui", "plain",
    "--skip-vscode",
    "--update-repo",
  ]), {
    profile: "full",
    repoDir: "student project",
    repoUrl: "https://example.test/repo.git",
    checkOnly: true,
    ui: "plain",
    skipVscode: true,
    installVscode: false,
    updateRepo: true,
    nonInteractive: false,
    json: false,
  });
});

test("setup arguments reject unknown profile and conflicting UI modes", () => {
  assert.throws(
    () => parseSetupArgs(["--profile", "everything"]),
    (error) => error.code === "ARGUMENT_INVALID" && /profile/i.test(error.message),
  );
  assert.throws(
    () => parseSetupArgs(["--ui", "tui", "--no-ui"]),
    (error) => error.code === "ARGUMENT_INVALID" && /ui/i.test(error.message),
  );
});

test("plain bootstrap output is readable and contains no ANSI control codes", () => {
  const stages = createStageState(["preflight", "toolchain", "repository"]);
  stages[0].status = "success";
  stages[1].status = "running";
  stages[1].message = "安装 CMake";
  stages[2].status = "pending";
  const output = renderPlain({ title: "DSA Mastery 环境配置", profile: "full", stages, width: 80 });
  assert.match(output, /DSA Mastery 环境配置/);
  assert.match(output, /preflight/);
  assert.match(output, /toolchain/);
  assert.match(output, /安装 CMake/);
  assert.equal(output.includes(String.fromCharCode(27)), false);
});

test("TUI frame shows progress and clamps to the terminal width", () => {
  const stages = createStageState(["preflight", "toolchain", "repository", "dependencies"]);
  stages[0].status = "success";
  stages[1].status = "success";
  stages[2].status = "running";
  const frame = renderTuiFrame({ title: "DSA Mastery", profile: "basic", stages, width: 42 });
  assert.match(frame, /2\/4/);
  assert.match(frame, /50%/);
  assert.match(frame, /repository/);
  for (const line of frame.split("\n")) assert.ok(line.length <= 42, `line too wide: ${line}`);
});

test("progress UI falls back to stable plain output when stdout is not a TTY", () => {
  const writes = [];
  const ui = createProgressUI({
    mode: "auto",
    stdout: { isTTY: false, columns: 80, write: (value) => writes.push(value) },
    title: "DSA Mastery",
    profile: "basic",
    stageNames: ["preflight", "toolchain"],
  });
  assert.equal(ui.mode, "plain");
  ui.update("preflight", "success", "已有 Node.js");
  ui.update("toolchain", "running", "检查编译器");
  ui.finish();
  const output = writes.join("");
  assert.match(output, /DSA Mastery/);
  assert.match(output, /已有 Node\.js/);
  assert.match(output, /进度：1\/2/);
  assert.match(writes.at(-1), /进度：1\/2/);
  assert.equal(output.includes(String.fromCharCode(27)), false);
});

test("MSVC environment parsing preserves values containing equals signs", () => {
  const parsed = parseEnvironmentBlock(
    "Path=C:\\VS\\bin;C:\\Windows\\System32\nINCLUDE=C:\\SDK\\include\nLIB=C:\\SDK\\lib\nCUSTOM=a=b=c\n",
    { Path: "old-path", KEEP: "yes" },
  );
  assert.equal(parsed.Path, "C:\\VS\\bin;C:\\Windows\\System32");
  assert.equal(parsed.INCLUDE, "C:\\SDK\\include");
  assert.equal(parsed.CUSTOM, "a=b=c");
  assert.equal(parsed.KEEP, "yes");
  assert.equal(isMsvcCommand("cl"), true);
  assert.equal(isMsvcCommand("C:\\VS\\bin\\cl.exe"), true);
  assert.equal(isMsvcCommand("clang++"), false);
});

test("vswhere output resolves the first non-empty installation path", () => {
  assert.equal(
    parseVsWherePath("C:\\Program Files (x86)\\Microsoft Visual Studio\\2022\\BuildTools\r\n"),
    "C:\\Program Files (x86)\\Microsoft Visual Studio\\2022\\BuildTools",
  );
  assert.equal(parseVsWherePath("\r\n"), undefined);
});

test("MSVC environment resolver uses vswhere and imports the developer environment", async () => {
  const calls = [];
  const result = await createMsvcEnvironment({
    platform: "win32",
    env: { "ProgramFiles(x86)": "C:\\Program Files (x86)" },
    runner: async (command, args) => {
      calls.push({ command, args });
      if (command.endsWith("vswhere.exe")) {
        return { code: 0, stdout: "C:\\VS\\BuildTools\r\n", stderr: "" };
      }
      return {
        code: 0,
        stdout: "Path=C:\\VS\\bin;C:\\Windows\\System32\r\nINCLUDE=C:\\SDK\\include\r\nLIB=C:\\SDK\\lib\r\n",
        stderr: "",
      };
    },
  });
  assert.equal(result.family, "msvc");
  assert.equal(result.env.INCLUDE, "C:\\SDK\\include");
  assert.equal(result.env.LIB, "C:\\SDK\\lib");
  assert.equal(result.installationPath, "C:\\VS\\BuildTools");
  assert.equal(calls.length, 2);
  assert.match(calls[0].args.join(" "), /VC\.Tools\.x86\.x64/);
  assert.equal(calls[1].command, "cmd.exe");
  assert.match(calls[1].args.at(-1), /VsDevCmd\.bat/);
});

test("bootstrap command runner preserves arguments containing spaces without a shell", async (t) => {
  const root = await import("node:fs/promises").then(({ mkdtemp }) => mkdtemp("/tmp/dsa bootstrap command "));
  t.after(async () => import("node:fs/promises").then(({ rm }) => rm(root, { recursive: true, force: true })));
  const result = await runCommand(process.execPath, [
    "-e",
    "process.stdout.write(`${process.argv[1]}:${process.env.BOOTSTRAP_TEST}`)",
    "path with spaces",
  ], { env: { BOOTSTRAP_TEST: "ok" }, cwd: root });
  assert.equal(result.code, 0);
  assert.equal(result.stdout, "path with spaces:ok");
});

test("profile evaluation requires a compiler and only full requires CMake", () => {
  const tools = [
    { name: "Git", available: true, meetsMinimum: true, version: "2.40.0" },
    { name: "Node.js", available: true, meetsMinimum: true, version: "24.0.0" },
    { name: "pnpm", available: true, meetsMinimum: true, version: PNPM_VERSION },
    { name: "Clang", available: true, meetsMinimum: true, version: "21.0.0" },
    { name: "CMake", available: false, meetsMinimum: false },
  ];
  assert.equal(evaluateProfile("basic", tools).ok, true);
  assert.equal(evaluateProfile("full", tools).ok, false);
  assert.match(evaluateProfile("full", tools).issues.join(" "), /CMake/);
  assert.equal(parseCommandVersion("node", "v24.1.0\n"), "24.1.0");
  assert.equal(evaluateProfile("basic", tools.map((tool) => tool.name === "pnpm" ? { ...tool, version: "11.2.0" } : tool)).ok, false);
});

test("host inspection probes Git, Node, exact pnpm, compilers, and CMake", async () => {
  const outputs = new Map([
    ["git", { stdout: "git version 2.50.1", stderr: "", code: 0 }],
    [process.execPath, { stdout: "v24.1.0", stderr: "", code: 0 }],
    ["pnpm", { stdout: "11.1.1", stderr: "", code: 0 }],
    ["g++", { stdout: "Apple clang version 21.0.0", stderr: "", code: 0 }],
    ["clang++", { stdout: "Apple clang version 21.0.0", stderr: "", code: 0 }],
    ["cmake", { stdout: "cmake version 3.30.0", stderr: "", code: 0 }],
    ["make", { stdout: "GNU Make 3.81", stderr: "", code: 0 }],
    ["cl", { spawnError: { code: "ENOENT" }, code: null, stdout: "", stderr: "" }],
  ]);
  const host = await inspectHost({
    platform: "darwin",
    env: {},
    runner: async (command) => outputs.get(command) ?? { spawnError: { code: "ENOENT" }, code: null, stdout: "", stderr: "" },
  });
  assert.equal(host.tools.find((tool) => tool.name === "Git").meetsMinimum, true);
  assert.equal(host.tools.find((tool) => tool.name === "pnpm").meetsMinimum, true);
  assert.equal(host.tools.find((tool) => tool.name === "CMake").meetsMinimum, true);
  assert.equal(host.tools.find((tool) => tool.name === "GNU Make").meetsMinimum, false);
  assert.equal(host.msvc.initialized, false);
});

test("Windows host inspection accepts MSVC's nonzero no-input exit after environment setup", async () => {
  const calls = [];
  const result = await inspectHost({
    platform: "win32",
    architecture: "x64",
    nodeCommand: "node",
    env: { "ProgramFiles(x86)": "C:\\Program Files (x86)" },
    runner: async (command, args) => {
      calls.push({ command, args });
      if (command.endsWith("vswhere.exe")) return { code: 0, stdout: "C:\\VS\\BuildTools\r\n", stderr: "" };
      if (command === "cmd.exe") return { code: 0, stdout: "Path=C:\\VS\\bin\r\nINCLUDE=C:\\SDK\\include\r\nLIB=C:\\SDK\\lib\r\n", stderr: "" };
      if (command === "cl") return { code: 2, stdout: "", stderr: "Microsoft (R) C/C++ Optimizing Compiler Version 19.40.12345 for x64\r\n" };
      if (command === "node") return { code: 0, stdout: "v24.1.0\r\n", stderr: "" };
      if (command === "pnpm") return { code: 0, stdout: `${PNPM_VERSION}\r\n`, stderr: "" };
      if (command === "git") return { code: 0, stdout: "git version 2.50.1\r\n", stderr: "" };
      return { code: null, stdout: "", stderr: "", spawnError: { code: "ENOENT" } };
    },
  });
  const msvc = result.tools.find((tool) => tool.name === "MSVC");
  assert.equal(result.msvc.initialized, true);
  assert.equal(msvc.available, true);
  assert.equal(msvc.meetsMinimum, true);
  assert.equal(result.compilerReady, true);
  assert.equal(calls.some(({ command }) => command === "cmd.exe"), true);
});

test("repository paths resolve relative to the caller and preserve spaces", () => {
  assert.equal(
    resolveRepositoryDir({ cwd: "/tmp/work", repoDir: "student project" }),
    "/tmp/work/student project",
  );
  assert.equal(
    resolveRepositoryDir({ cwd: "/tmp/work", repoDir: "/Volumes/Labs/DSA Mastery" }),
    "/Volumes/Labs/DSA Mastery",
  );
});

test("system install plan is profile-aware and never makes GNU Make mandatory", () => {
  const plan = planToolchainInstall("full", {
    platform: "win32",
    packageManager: "winget",
    tools: [
      { name: "Git", meetsMinimum: false },
      { name: "Node.js", meetsMinimum: false },
      { name: "pnpm", meetsMinimum: false },
      { name: "MSVC", meetsMinimum: false },
      { name: "CMake", meetsMinimum: false },
      { name: "GNU Make", meetsMinimum: false },
    ],
  });
  assert.deepEqual(plan.map((item) => item.id), ["git", "node", "msvc", "cmake"]);
  assert.equal(plan.some((item) => item.id === "make"), false);
});

test("dirty repositories are protected from implicit updates", () => {
  assert.throws(
    () => assertRepositorySafe({ exists: true, directory: true, valid: true, dirty: true, updateRepo: true }),
    (error) => error.code === "REPOSITORY_DIRTY",
  );
  assert.doesNotThrow(() => assertRepositorySafe({ exists: true, directory: true, valid: true, dirty: true, updateRepo: false }));
});

test("native launchers are present and forward the shared coordinator", async () => {
  const macos = await readFile(new URL("../scripts/bootstrap/bootstrap-macos.sh", import.meta.url), "utf8");
  const windows = await readFile(new URL("../scripts/bootstrap/bootstrap-windows.ps1", import.meta.url), "utf8");
  assert.match(macos, /set -euo pipefail/);
  assert.match(macos, /setup\.mjs/);
  assert.match(macos, /git clone/);
  assert.match(windows, /winget/iu);
  assert.match(windows, /setup\.mjs/);
  assert.match(windows, /VisualStudio\.2022\.BuildTools/);
  assert.match(windows, /\$Json/);
});

test("check-only runs read-only probes and never installs or clones", async (t) => {
  const repo = await mkdtemp(path.join(os.tmpdir(), "dsa bootstrap check-only "));
  t.after(() => rm(repo, { recursive: true, force: true }));
  await mkdir(path.join(repo, "labs"), { recursive: true });
  await mkdir(path.join(repo, "tools", "lab"), { recursive: true });
  await writeFile(path.join(repo, "package.json"), "{}\n");
  await writeFile(path.join(repo, "pnpm-lock.yaml"), "lockfileVersion: '9.0'\n");
  await writeFile(path.join(repo, "tools", "lab", "cli.mjs"), "\n");
  const calls = [];
  const outputs = new Map([
    ["brew", { code: 0, stdout: "Homebrew 4.0.0\n", stderr: "" }],
    ["git", { code: 0, stdout: "git version 2.50.1\n", stderr: "" }],
    [process.execPath, { code: 0, stdout: "v26.0.0\n", stderr: "" }],
    ["pnpm", { code: 0, stdout: `${PNPM_VERSION}\n`, stderr: "" }],
    ["g++", { code: 0, stdout: "Apple clang version 21.0.0\n", stderr: "" }],
    ["clang++", { code: 0, stdout: "Apple clang version 21.0.0\n", stderr: "" }],
    ["cl", { code: null, stdout: "", stderr: "", spawnError: { code: "ENOENT" } }],
    ["cmake", { code: 0, stdout: "cmake version 3.30.0\n", stderr: "" }],
    ["make", { code: 0, stdout: "GNU Make 4.4\n", stderr: "" }],
  ]);
  const result = await runSetup(["--check-only", "--profile", "full", "--repo-dir", repo, "--json"], {
    platform: "darwin",
    architecture: "arm64",
    cwd: repo,
    env: { PATH: "/usr/bin", HOME: repo },
    runner: async (command, args) => {
      calls.push({ command, args });
      return outputs.get(command) ?? { code: 0, stdout: "", stderr: "" };
    },
  });
  assert.equal(result.exitCode, 0);
  assert.equal(result.report.ok, true);
  assert.equal(calls.some(({ args }) => ["install", "clone", "pull"].includes(args?.[0])), false);
  assert.equal(result.report.stages.find((stage) => stage.id === "dependencies").status, "skipped");
  assert.equal(result.report.stages.find((stage) => stage.id === "smoke").status, "skipped");
});
