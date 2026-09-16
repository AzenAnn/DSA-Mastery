import { EventEmitter } from "node:events";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { expect, it, onTestFinished } from "vitest";

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
  displayWidth,
  renderPlain,
  renderPixelBanner,
  renderTuiSummary,
  createInstallSelection,
  decodeChoiceInput,
  handleChoiceKey,
  promptInstallSelection,
  renderChoiceMenu,
  selectionToOptions,
  stripAnsi,
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
  planIdeExtensions,
  resolveRepositoryDir,
  runSetup,
} from "../scripts/bootstrap/setup.mjs";

it("version helpers compare partial versions and reject malformed values", () => {
  expect(parseVersion("v22.13.0")).toStrictEqual([22, 13, 0]);
  expect(parseVersion("Apple clang version 14.0.3")).toStrictEqual([14, 0, 3]);
  expect(parseVersion("not a version")).toBe(undefined);
  expect(compareVersion([22, 13, 0], NODE_MINIMUM)).toBe(true);
  expect(compareVersion([22, 12, 99], NODE_MINIMUM)).toBe(false);
});

it("runtime, basic, and full profiles describe progressively larger installs", () => {
  expect(Object.keys(PROFILES)).toStrictEqual(["runtime", "basic", "full"]);
  expect(profileRequirements("runtime").requiresCompiler).toBe(false);
  expect(profileRequirements("runtime").requiresCmake).toBe(false);
  expect(profileRequirements("basic").requiresCmake).toBe(false);
  expect(profileRequirements("full").requiresCmake).toBe(true);
  expect(PNPM_VERSION).toBe("11.1.1");
});

it("setup arguments normalize profile, UI, and repository options", () => {
  expect(parseSetupArgs([
    "--profile", "full",
    "--repo-dir", "student project",
    "--repo-url=https://example.test/repo.git",
    "--check-only",
    "--ui", "plain",
    "--skip-vscode",
    "--update-repo",
  ])).toStrictEqual({
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

it("setup arguments reject unknown profile and conflicting UI modes", () => {
  expect(() => parseSetupArgs(["--profile", "everything"])).toThrow(
    expect.objectContaining({ code: "ARGUMENT_INVALID", message: expect.stringMatching(/profile/i) }),
  );
  expect(() => parseSetupArgs(["--ui", "tui", "--no-ui"])).toThrow(
    expect.objectContaining({ code: "ARGUMENT_INVALID", message: expect.stringMatching(/ui/i) }),
  );
});

it("plain bootstrap output is readable and contains no ANSI control codes", () => {
  const stages = createStageState(["preflight", "toolchain", "repository"]);
  stages[0].status = "success";
  stages[1].status = "running";
  stages[1].message = "安装 CMake";
  stages[2].status = "pending";
  const output = renderPlain({ title: "DSA Mastery 环境配置", profile: "full", stages, width: 80 });
  expect(output).toMatch(/DSA Mastery 环境配置/);
  expect(output).toMatch(/preflight/);
  expect(output).toMatch(/toolchain/);
  expect(output).toMatch(/安装 CMake/);
  expect(output.includes(String.fromCharCode(27))).toBe(false);
});

it("TUI frame shows progress and clamps to the terminal width", () => {
  const stages = createStageState(["preflight", "toolchain", "repository", "dependencies"]);
  stages[0].status = "success";
  stages[1].status = "success";
  stages[2].status = "running";
  const frame = renderTuiFrame({ title: "DSA Mastery", profile: "basic", stages, width: 42 });
  expect(frame).toMatch(/2\/4/);
  expect(frame).toMatch(/50%/);
  expect(frame).toMatch(/repository/);
  for (const line of frame.split("\n")) expect(line.length <= 42, `line too wide: ${line}`).toBeTruthy();
});

it("colored TUI adds a banner and semantic status colors without changing layout", () => {
  const stages = createStageState(["preflight", "toolchain"]);
  stages[0].status = "success";
  stages[1].status = "running";
  const plain = renderTuiFrame({ title: "DSA Mastery", profile: "basic", stages, width: 52, color: false });
  const colored = renderTuiFrame({ title: "DSA Mastery", profile: "basic", stages, width: 52, color: true });
  expect(colored).toMatch(/DSA MASTERY/);
  expect(colored.includes(`${String.fromCharCode(27)}[`)).toBe(true);
  expect(stripAnsi(colored)).toBe(plain);
});

it("pixel completion banner keeps a fixed-width block layout and colors DSA", () => {
  const plain = renderPixelBanner({ width: 80, color: false });
  const colored = renderPixelBanner({ width: 80, color: true });
  const lines = plain.split("\n");
  expect(lines.length).toBe(7);
  expect(new Set(lines.map(displayWidth)).size).toBe(1);
  expect(colored.includes("\u001b[91m")).toBe(true);
  expect(colored.includes("\u001b[93m")).toBe(true);
  expect(colored.includes("\u001b[94m")).toBe(true);
  expect(stripAnsi(colored)).toBe(plain);
});

it("TUI completion summary groups metadata, stages, and result details", () => {
  const summary = [
    "DSA Mastery 环境配置：成功",
    "Profile：basic · 平台：darwin/arm64",
    "已选择：基础运行环境、Program Lab C++ 环境",
    "✓ preflight：Node 26.0.0 · 编译器可用",
    "✓ toolchain：Node/pnpm/编译器 已就绪",
    "– ide：未选择 VS Code",
    "✓ smoke：Program reference 验证通过",
    "仓库：/Users/shuoyuchen/code/DSA-Mastery",
  ].join("\n");
  const plain = renderTuiSummary({ summary, width: 72, color: false });
  const colored = renderTuiSummary({ summary, width: 72, color: true });
  expect(plain).toMatch(/配置结果/);
  expect(plain).toMatch(/执行阶段/);
  expect(plain).toMatch(/仓库\s+\/Users\/shuoyuchen\/code\/DSA-Mastery/);
  expect(stripAnsi(colored)).toBe(plain);
  for (const line of plain.split("\n")) {
    if (line.startsWith("╭") || line.startsWith("╰") || line.startsWith("├") || line.startsWith("│")) {
      expect(displayWidth(line), `misaligned line: ${line}`).toBe(72);
    }
  }
});

it("progress UI falls back to stable plain output when stdout is not a TTY", () => {
  const writes = [];
  const ui = createProgressUI({
    mode: "auto",
    stdout: { isTTY: false, columns: 80, write: (value) => writes.push(value) },
    title: "DSA Mastery",
    profile: "basic",
    stageNames: ["preflight", "toolchain"],
  });
  expect(ui.mode).toBe("plain");
  ui.update("preflight", "success", "已有 Node.js");
  ui.update("toolchain", "running", "检查编译器");
  ui.finish({ ok: true });
  const output = writes.join("");
  expect(output).toMatch(/DSA Mastery/);
  expect(output).toMatch(/已有 Node\.js/);
  expect(output).toMatch(/进度：1\/2/);
  expect(writes.at(-1)).toMatch(/进度：1\/2/);
  expect(output.includes(String.fromCharCode(27))).toBe(false);
  expect(output.includes("███")).toBe(false);
});

it("TUI completion renders the summary card and pixel banner together", () => {
  const previousNoColor = process.env.NO_COLOR;
  const previousTerm = process.env.TERM;
  delete process.env.NO_COLOR;
  process.env.TERM = "xterm";
  const writes = [];
  try {
    const ui = createProgressUI({
      mode: "tui",
      stdout: { isTTY: true, columns: 80, write: (value) => writes.push(value) },
      title: "DSA Mastery 环境配置",
      profile: "basic",
      stageNames: ["preflight"],
      spinner: false,
    });
    ui.finish({
      ok: true,
      summary: "DSA Mastery 环境配置：成功\nProfile：basic\n✓ preflight：完成",
    });
    const output = writes.join("");
    expect(ui.mode).toBe("tui");
    expect(output).toMatch(/配置结果/);
    expect(output).toMatch(/执行阶段/);
    expect(output).toMatch(/配置结果 · 成功/);
    expect(output).toMatch(/███/);
  } finally {
    if (previousNoColor === undefined) delete process.env.NO_COLOR;
    else process.env.NO_COLOR = previousNoColor;
    if (previousTerm === undefined) delete process.env.TERM;
    else process.env.TERM = previousTerm;
  }
});

it("install wizard defaults to Program and derives profile from selected bundles", () => {
  const defaults = createInstallSelection();
  expect(selectionToOptions(defaults)).toStrictEqual({
    profile: "basic",
    installVscode: false,
    skipVscode: true,
    installCppExtension: false,
    installCmakeExtension: false,
    selection: ["runtime", "program"],
  });
  const runtime = selectionToOptions(new Set());
  expect(runtime.profile).toBe("runtime");
  expect(runtime.selection).toStrictEqual(["runtime"]);
  const full = selectionToOptions(new Set(["project", "cmake-extension"]));
  expect(full.profile).toBe("full");
  expect(full.installVscode).toBe(true);
  expect(full.installCmakeExtension).toBe(true);
  expect(full.selection).toStrictEqual(["runtime", "program", "project", "vscode", "cmake-extension"]);
});

it("install wizard keeps dependencies consistent when a parent is toggled", () => {
  const selected = new Set(["runtime", "program", "vscode", "cpp-extension"]);
  const removedParent = handleChoiceKey("space", 3, selected);
  expect(removedParent.action).toBe("toggle");
  expect(removedParent.selection.has("vscode")).toBe(false);
  expect(removedParent.selection.has("cpp-extension")).toBe(false);
  const addedChild = handleChoiceKey("space", 5, new Set(["runtime"]));
  expect(addedChild.selection.has("project")).toBe(true);
  expect(addedChild.selection.has("program")).toBe(true);
  expect(addedChild.selection.has("vscode")).toBe(true);
  expect(addedChild.selection.has("cmake-extension")).toBe(true);
  const removedProgram = handleChoiceKey("space", 1, addedChild.selection);
  expect(removedProgram.selection.has("program")).toBe(false);
  expect(removedProgram.selection.has("project")).toBe(false);
  expect(removedProgram.selection.has("cmake-extension")).toBe(false);
});

it("install wizard renders actionable checkboxes and keyboard help", () => {
  const menu = renderChoiceMenu({ selection: createInstallSelection(), cursor: 0, width: 60 });
  expect(menu).toMatch(/☑ 基础运行环境/);
  expect(menu).toMatch(/☑ Program Lab/);
  expect(menu).toMatch(/☐ Project Lab/);
  expect(menu).toMatch(/当前方案：basic/);
  expect(menu).toMatch(/空格 选择\/取消/);
  for (const line of menu.split("\n")) expect(line.length <= 60, `line too wide: ${line}`).toBeTruthy();
});

it("colored install wizard adds a banner and grouped sections", () => {
  const plain = renderChoiceMenu({ selection: createInstallSelection(), cursor: 0, width: 72, color: false });
  const colored = renderChoiceMenu({ selection: createInstallSelection(), cursor: 0, width: 72, color: true });
  expect(colored).toMatch(/DSA MASTERY/);
  expect(colored).toMatch(/基础运行环境/);
  expect(colored).toMatch(/编辑器与扩展/);
  expect(colored.includes(`${String.fromCharCode(27)}[`)).toBe(true);
  expect(stripAnsi(colored)).toBe(plain);
});

it("TUI layout accounts for wide CJK characters when padding and truncating", () => {
  const menu = renderChoiceMenu({ width: 42, color: false });
  const frame = renderTuiFrame({
    title: "DSA Mastery 环境配置",
    profile: "basic",
    stages: createStageState(["依赖安装"]),
    width: 42,
    color: false,
  });
  for (const line of [...menu.split("\n"), ...frame.split("\n")]) {
    if (line.startsWith("╭") || line.startsWith("╰") || line.startsWith("├") || line.startsWith("│")) {
      expect(displayWidth(line), `misaligned line: ${line}`).toBe(42);
    }
  }
});

it("install wizard decodes combined arrow, space, and enter input", () => {
  expect(decodeChoiceInput("\u001b[B\u001b[B \r")).toStrictEqual(["down", "down", "space", "enter"]);
});

it("interactive install wizard accepts keyboard choices and restores terminal mode", async () => {
  const input = new EventEmitter();
  input.isTTY = true;
  input.isRaw = false;
  input.setRawMode = (value) => { input.isRaw = value; };
  input.resume = () => {};
  input.pause = () => {};
  const writes = [];
  const output = { isTTY: true, columns: 80, write: (value) => writes.push(value) };
  const pending = promptInstallSelection({ input, output });
  setImmediate(() => input.emit("data", "\u001b[B \r"));
  const result = await pending;
  expect(result.cancelled).toBe(false);
  expect(result.profile).toBe("full");
  expect(result.installCmakeExtension).toBe(false);
  expect(input.isRaw).toBe(false);
  expect(writes.join("")).toMatch(/当前方案：basic（Program）/);
  expect(writes.join("")).toMatch(/当前方案：full（Program \+ Project）/);
});

it("MSVC environment parsing preserves values containing equals signs", () => {
  const parsed = parseEnvironmentBlock(
    "Path=C:\\VS\\bin;C:\\Windows\\System32\nINCLUDE=C:\\SDK\\include\nLIB=C:\\SDK\\lib\nCUSTOM=a=b=c\n",
    { Path: "old-path", KEEP: "yes" },
  );
  expect(parsed.Path).toBe("C:\\VS\\bin;C:\\Windows\\System32");
  expect(parsed.INCLUDE).toBe("C:\\SDK\\include");
  expect(parsed.CUSTOM).toBe("a=b=c");
  expect(parsed.KEEP).toBe("yes");
  expect(isMsvcCommand("cl")).toBe(true);
  expect(isMsvcCommand("C:\\VS\\bin\\cl.exe")).toBe(true);
  expect(isMsvcCommand("clang++")).toBe(false);
});

it("vswhere output resolves the first non-empty installation path", () => {
  expect(parseVsWherePath("C:\\Program Files (x86)\\Microsoft Visual Studio\\2022\\BuildTools\r\n")).toBe("C:\\Program Files (x86)\\Microsoft Visual Studio\\2022\\BuildTools");
  expect(parseVsWherePath("\r\n")).toBe(undefined);
});

it("MSVC environment resolver uses vswhere and imports the developer environment", async () => {
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
  expect(result.family).toBe("msvc");
  expect(result.env.INCLUDE).toBe("C:\\SDK\\include");
  expect(result.env.LIB).toBe("C:\\SDK\\lib");
  expect(result.installationPath).toBe("C:\\VS\\BuildTools");
  expect(calls.length).toBe(2);
  expect(calls[0].args.join(" ")).toMatch(/VC\.Tools\.x86\.x64/);
  expect(calls[1].command).toBe("cmd.exe");
  expect(calls[1].args.at(-1)).toMatch(/VsDevCmd\.bat/);
});

it("bootstrap command runner preserves arguments containing spaces without a shell", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "dsa bootstrap command "));
  onTestFinished(async () => rm(root, { recursive: true, force: true }));
  const result = await runCommand(process.execPath, [
    "-e",
    "process.stdout.write(`${process.argv[1]}:${process.env.BOOTSTRAP_TEST}`)",
    "path with spaces",
  ], { env: { BOOTSTRAP_TEST: "ok" }, cwd: root });
  expect(result.code).toBe(0);
  expect(result.stdout).toBe("path with spaces:ok");
});

it("profile evaluation requires a compiler and only full requires CMake", () => {
  const tools = [
    { name: "Git", available: true, meetsMinimum: true, version: "2.40.0" },
    { name: "Node.js", available: true, meetsMinimum: true, version: "24.0.0" },
    { name: "pnpm", available: true, meetsMinimum: true, version: PNPM_VERSION },
    { name: "Clang", available: true, meetsMinimum: true, version: "21.0.0" },
    { name: "CMake", available: false, meetsMinimum: false },
  ];
  expect(evaluateProfile("basic", tools).ok).toBe(true);
  expect(evaluateProfile("full", tools).ok).toBe(false);
  expect(evaluateProfile("full", tools).issues.join(" ")).toMatch(/CMake/);
  expect(parseCommandVersion("node", "v24.1.0\n")).toBe("24.1.0");
  expect(evaluateProfile("basic", tools.map((tool) => tool.name === "pnpm" ? { ...tool, version: "11.2.0" } : tool)).ok).toBe(false);
});

it("host inspection probes Git, Node, exact pnpm, compilers, and CMake", async () => {
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
  expect(host.tools.find((tool) => tool.name === "Git").meetsMinimum).toBe(true);
  expect(host.tools.find((tool) => tool.name === "pnpm").meetsMinimum).toBe(true);
  expect(host.tools.find((tool) => tool.name === "CMake").meetsMinimum).toBe(true);
  expect(host.tools.find((tool) => tool.name === "GNU Make").meetsMinimum).toBe(false);
  expect(host.msvc.initialized).toBe(false);
});

it("Windows host inspection accepts MSVC's nonzero no-input exit after environment setup", async () => {
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
  expect(result.msvc.initialized).toBe(true);
  expect(msvc.available).toBe(true);
  expect(msvc.meetsMinimum).toBe(true);
  expect(result.compilerReady).toBe(true);
  expect(calls.some(({ command }) => command === "cmd.exe")).toBe(true);
});

it("repository paths resolve relative to the caller and preserve spaces", () => {
  const callerDirectory = path.join(os.tmpdir(), "work");
  expect(resolveRepositoryDir({ cwd: callerDirectory, repoDir: "student project" })).toBe(path.resolve(callerDirectory, "student project"));
  const absoluteRepository = path.resolve(os.tmpdir(), "DSA Mastery");
  expect(resolveRepositoryDir({ cwd: callerDirectory, repoDir: absoluteRepository })).toBe(absoluteRepository);
});

it("system install plan is profile-aware and never makes GNU Make mandatory", () => {
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
  expect(plan.map((item) => item.id)).toStrictEqual(["git", "node", "msvc", "cmake"]);
  expect(plan.some((item) => item.id === "make")).toBe(false);
});

it("runtime install plan keeps compiler and CMake optional", () => {
  const plan = planToolchainInstall("runtime", {
    platform: "darwin",
    packageManager: { kind: "brew", command: "brew" },
    tools: [
      { name: "Git", meetsMinimum: false },
      { name: "Node.js", meetsMinimum: false },
      { name: "Clang", meetsMinimum: false },
      { name: "GCC", meetsMinimum: false },
      { name: "CMake", meetsMinimum: false },
    ],
  });
  expect(plan.map((item) => item.id)).toStrictEqual(["git", "node"]);
});

it("IDE extension plan follows interactive selections and preserves legacy profiles", () => {
  expect(planIdeExtensions({ selection: ["runtime", "program", "vscode"] }, "basic")).toStrictEqual([]);
  expect(planIdeExtensions({ selection: ["runtime", "program", "project", "vscode", "cpp-extension", "cmake-extension"], installCppExtension: true, installCmakeExtension: true }, "full")).toStrictEqual(["ms-vscode.cpptools", "ms-vscode.cmake-tools"]);
  expect(planIdeExtensions({}, "runtime")).toStrictEqual([]);
  expect(planIdeExtensions({}, "full")).toStrictEqual(["ms-vscode.cpptools", "ms-vscode.cmake-tools"]);
});

it("dirty repositories are protected from implicit updates", () => {
  expect(() => assertRepositorySafe({ exists: true, directory: true, valid: true, dirty: true, updateRepo: true })).toThrow(expect.objectContaining({ code: "REPOSITORY_DIRTY" }));
  expect(() => assertRepositorySafe({ exists: true, directory: true, valid: true, dirty: true, updateRepo: false })).not.toThrow();
});

it("native launchers are present and forward the shared coordinator", async () => {
  const macos = await readFile(new URL("../scripts/bootstrap/bootstrap-macos.sh", import.meta.url), "utf8");
  const windows = await readFile(new URL("../scripts/bootstrap/bootstrap-windows.ps1", import.meta.url), "utf8");
  expect(macos).toMatch(/set -euo pipefail/);
  expect(macos).toMatch(/setup\.mjs/);
  expect(macos).toMatch(/git clone/);
  expect(windows).toMatch(/winget/iu);
  expect(windows).toMatch(/setup\.mjs/);
  expect(windows).toMatch(/VisualStudio\.2022\.BuildTools/);
  expect(windows).toMatch(/\$Json/);
});

it("check-only runs read-only probes and never installs or clones", async () => {
  const repo = await mkdtemp(path.join(os.tmpdir(), "dsa bootstrap check-only "));
  onTestFinished(() => rm(repo, { recursive: true, force: true }));
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
  expect(result.exitCode).toBe(0);
  expect(result.report.ok).toBe(true);
  expect(calls.some(({ args }) => ["install", "clone", "pull"].includes(args?.[0]))).toBe(false);
  expect(result.report.stages.find((stage) => stage.id === "dependencies").status).toBe("skipped");
  expect(result.report.stages.find((stage) => stage.id === "smoke").status).toBe("skipped");
});

it("check-only and plain UI never open the interactive install wizard", async () => {
  const input = new EventEmitter();
  input.isTTY = true;
  const output = { isTTY: true, columns: 80, write: () => {} };
  const checkOnly = await runSetup(["--check-only", "--repo-dir", "/tmp/missing-check-only"], {
    io: { input, output },
    cwd: "/tmp",
    env: { PATH: "/usr/bin", HOME: "/tmp" },
    runner: async () => ({ code: null, stdout: "", stderr: "", spawnError: { code: "ENOENT" } }),
  });
  expect(checkOnly.report.error?.code).toBe("ENVIRONMENT_NOT_READY");
  expect(checkOnly.report.cancelled).toBe(undefined);
});

it("canceling the interactive install wizard stops before any command runs", async () => {
  const input = new EventEmitter();
  input.isTTY = true;
  input.isRaw = false;
  input.setRawMode = () => {};
  input.resume = () => {};
  input.pause = () => {};
  const output = { isTTY: true, columns: 80, write: () => {} };
  let ran = false;
  const pending = runSetup([], {
    io: { input, output },
    runner: async () => {
      ran = true;
      return { code: 0, stdout: "", stderr: "" };
    },
  });
  setImmediate(() => input.emit("data", "q"));
  const result = await pending;
  expect(result.exitCode).toBe(0);
  expect(result.report.cancelled).toBe(true);
  expect(ran).toBe(false);
});

it("toolchain probes use the caller directory before cloning a new repository", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "dsa bootstrap command cwd "));
  onTestFinished(() => rm(root, { recursive: true, force: true }));
  const missingRepo = path.join(root, "future-repository");
  const calls = [];
  let pnpmChecks = 0;
  const result = await runSetup(["--profile", "basic", "--repo-dir", missingRepo, "--non-interactive", "--ui", "plain"], {
    platform: "darwin",
    architecture: "arm64",
    cwd: root,
    env: { PATH: "/usr/bin", HOME: root },
    io: {
      input: { isTTY: false },
      output: { isTTY: false, write: () => {} },
    },
    runner: async (command, args, options = {}) => {
      calls.push({ command, args, cwd: options.cwd });
      if (command === "brew") return { code: 0, stdout: "Homebrew 4.0.0\n", stderr: "" };
      if (command === "git") return { code: 0, stdout: "git version 2.50.1\n", stderr: "" };
      if (command === process.execPath) return { code: 0, stdout: "v26.0.0\n", stderr: "" };
      if (command === "pnpm") {
        pnpmChecks += 1;
        return { code: 0, stdout: `${pnpmChecks <= 2 ? "10.0.0" : PNPM_VERSION}\n`, stderr: "" };
      }
      if (command === "corepack") return { code: null, spawnError: { code: "ENOENT" }, stdout: "", stderr: "" };
      if (command === "npm") return { code: 0, stdout: "11.0.0\n", stderr: "" };
      if (command === "g++" || command === "clang++") return { code: 0, stdout: "Apple clang version 21.0.0\n", stderr: "" };
      if (command === "cl") return { code: null, spawnError: { code: "ENOENT" }, stdout: "", stderr: "" };
      if (command === "cmake") return { code: 0, stdout: "cmake version 3.30.0\n", stderr: "" };
      if (command === "make") return { code: 0, stdout: "GNU Make 4.4\n", stderr: "" };
      return { code: 0, stdout: "", stderr: "" };
    },
  });
  expect(result.exitCode).toBe(13);
  expect(result.report.error.message).toMatch(/clone 完成/);
  expect(calls.some(({ command, args, cwd }) => command === "npm" && args?.[0] === "install" && cwd === root)).toBeTruthy();
  expect(calls.some(({ command, args, cwd }) => command === "git" && args?.[0] === "clone" && cwd === root)).toBeTruthy();
  expect(calls.some(({ cwd }) => cwd === missingRepo)).toBe(false);
});

it("runtime setup installs only course tooling and skips C++ smoke", async () => {
  const repo = await mkdtemp(path.join(os.tmpdir(), "dsa bootstrap runtime "));
  onTestFinished(() => rm(repo, { recursive: true, force: true }));
  await mkdir(path.join(repo, "labs"), { recursive: true });
  await mkdir(path.join(repo, "tools", "lab"), { recursive: true });
  await writeFile(path.join(repo, "package.json"), "{}\n");
  await writeFile(path.join(repo, "pnpm-lock.yaml"), "lockfileVersion: '9.0'\n");
  await writeFile(path.join(repo, "tools", "lab", "cli.mjs"), "\n");
  const calls = [];
  const result = await runSetup(["--profile", "runtime", "--repo-dir", repo, "--non-interactive", "--ui", "plain"], {
    platform: "darwin",
    architecture: "arm64",
    cwd: repo,
    env: { PATH: "/usr/bin", HOME: repo },
    io: {
      input: { isTTY: false },
      output: { isTTY: false, write: () => {} },
    },
    runner: async (command, args) => {
      calls.push({ command, args });
      if (command === "brew") return { code: 0, stdout: "Homebrew 4.0.0\n", stderr: "" };
      if (command === "git") return { code: 0, stdout: "git version 2.50.1\n", stderr: "" };
      if (command === process.execPath) return { code: 0, stdout: "v26.0.0\n", stderr: "" };
      if (command === "pnpm") return { code: 0, stdout: `${PNPM_VERSION}\n`, stderr: "" };
      if (command === "g++" || command === "clang++") return { code: 0, stdout: "Apple clang version 21.0.0\n", stderr: "" };
      if (command === "cl") return { code: null, spawnError: { code: "ENOENT" }, stdout: "", stderr: "" };
      if (command === "cmake") return { code: null, spawnError: { code: "ENOENT" }, stdout: "", stderr: "" };
      if (command === "make") return { code: 0, stdout: "GNU Make 4.4\n", stderr: "" };
      return { code: 0, stdout: "", stderr: "" };
    },
  });
  expect(result.exitCode).toBe(0);
  expect(result.report.ok).toBe(true);
  expect(result.report.profile).toBe("runtime");
  expect(result.report.stages.find((stage) => stage.id === "smoke").status).toBe("skipped");
  expect(calls.some(({ command, args }) => command === "pnpm" && args?.[0] === "install")).toBe(true);
  expect(calls.some(({ command, args }) => command === "xcode-select" || (command === "brew" && args?.[0] === "install" && args?.[1] === "cmake"))).toBe(false);
  expect(calls.some(({ command, args }) => command === process.execPath && args?.[0] === "tools/lab/cli.mjs")).toBe(false);
});
