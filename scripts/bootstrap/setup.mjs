#!/usr/bin/env node

import { access, mkdir, mkdtemp, readdir, rm, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { createInterface } from "node:readline/promises";
import { pathToFileURL } from "node:url";

import { runCommand, commandText } from "./commands.mjs";
import { inspectHost, evaluateProfile } from "./checks.mjs";
import { parseSetupArgs } from "./options.mjs";
import { PNPM_VERSION, profileRequirements } from "./requirements.mjs";
import { choiceSelectionSummary, createInstallSelection, createProgressUI, promptInstallSelection } from "./ui.mjs";

export const SETUP_EXIT = Object.freeze({
  OK: 0,
  UNSUPPORTED: 10,
  INSTALLER: 11,
  USER_ACTION: 12,
  REPOSITORY: 13,
  ENVIRONMENT: 14,
  SMOKE: 15,
  ARGUMENT: 2,
});

export const SETUP_STAGES = Object.freeze([
  "preflight",
  "toolchain",
  "repository",
  "dependencies",
  "ide",
  "smoke",
]);

const HOMEBREW_INSTALLER = "https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh";

export class SetupError extends Error {
  constructor(code, message, details = undefined, exitCode = undefined) {
    super(message);
    this.name = "SetupError";
    this.code = code;
    this.details = details;
    this.exitCode = exitCode ?? exitCodeFor(code);
  }
}

function exitCodeFor(code) {
  return {
    SETUP_UNSUPPORTED: SETUP_EXIT.UNSUPPORTED,
    INSTALLER_FAILED: SETUP_EXIT.INSTALLER,
    NEEDS_USER_ACTION: SETUP_EXIT.USER_ACTION,
    REPOSITORY_DIRTY: SETUP_EXIT.REPOSITORY,
    REPOSITORY_INVALID: SETUP_EXIT.REPOSITORY,
    REPOSITORY_MISSING: SETUP_EXIT.REPOSITORY,
    REPOSITORY_UPDATE_FAILED: SETUP_EXIT.REPOSITORY,
    ENVIRONMENT_NOT_READY: SETUP_EXIT.ENVIRONMENT,
    SMOKE_FAILED: SETUP_EXIT.SMOKE,
    ARGUMENT_INVALID: SETUP_EXIT.ARGUMENT,
  }[code] ?? SETUP_EXIT.INSTALLER;
}

function setupError(code, message, details = undefined) {
  return new SetupError(code, message, details);
}

async function pathExists(target) {
  try {
    await access(target);
    return true;
  } catch {
    return false;
  }
}

function resultOutput(result) {
  return `${result?.stdout ?? ""}\n${result?.stderr ?? ""}`.trim();
}

function resultFailed(result) {
  return Boolean(result?.spawnError) || result?.code !== 0 || result?.timedOut || result?.outputExceeded;
}

function firstOutputLine(result) {
  return resultOutput(result).split(/\r?\n/).find(Boolean)?.trim();
}

function prependPath(currentPath, additions, delimiter) {
  const values = [...additions, ...(String(currentPath ?? "").split(delimiter))].filter(Boolean);
  return [...new Set(values)].join(delimiter);
}

function hostTool(host, name) {
  return host?.tools?.find((tool) => tool.name === name);
}

function hasTool(host, name) {
  return Boolean(hostTool(host, name)?.meetsMinimum);
}

export function resolveRepositoryDir({ cwd = process.cwd(), repoDir = undefined } = {}) {
  return path.resolve(cwd, repoDir ?? ".");
}

export async function inspectRepository(repositoryDir, { runner = runCommand, env = process.env } = {}) {
  const state = {
    path: repositoryDir,
    exists: false,
    directory: false,
    empty: false,
    valid: false,
    git: false,
    dirty: false,
    remote: undefined,
  };
  try {
    const repositoryStat = await stat(repositoryDir);
    state.exists = true;
    state.directory = repositoryStat.isDirectory();
  } catch (error) {
    if (error.code === "ENOENT") return state;
    throw error;
  }
  if (!state.directory) return state;
  state.empty = (await readdir(repositoryDir)).length === 0;
  state.valid = await Promise.all([
    pathExists(path.join(repositoryDir, "package.json")),
    pathExists(path.join(repositoryDir, "pnpm-lock.yaml")),
    pathExists(path.join(repositoryDir, "labs")),
    pathExists(path.join(repositoryDir, "tools", "lab", "cli.mjs")),
  ]).then((items) => items.every(Boolean));
  state.git = await pathExists(path.join(repositoryDir, ".git"));
  if (state.git) {
    const status = await runner("git", ["status", "--short"], { cwd: repositoryDir, env, timeoutMs: 10_000, timeMs: 10_000, outputLimitKb: 256, outputKb: 256 });
    state.dirty = !resultFailed(status) && Boolean(status.stdout?.trim());
    const remote = await runner("git", ["remote", "get-url", "origin"], { cwd: repositoryDir, env, timeoutMs: 10_000, timeMs: 10_000, outputLimitKb: 256, outputKb: 256 });
    if (!resultFailed(remote)) state.remote = firstOutputLine(remote);
  }
  return state;
}

export function assertRepositorySafe(state) {
  if (state.exists && !state.directory) {
    throw setupError("REPOSITORY_INVALID", `仓库目标不是目录：${state.path}`);
  }
  if (state.exists && !state.valid && !state.empty) {
    throw setupError("REPOSITORY_INVALID", `目标目录不是 DSA Mastery 仓库且不为空，不会覆盖：${state.path}`);
  }
  if (state.dirty && state.updateRepo) {
    throw setupError("REPOSITORY_DIRTY", `仓库存在未提交改动，已阻止更新：${state.path}；请提交/暂存改动后再使用 --update-repo。`);
  }
  return state;
}

function wingetInstall(id, extra = []) {
  return {
    command: "winget",
    args: ["install", "--id", id, "--exact", "--source", "winget", "--accept-source-agreements", "--accept-package-agreements", ...extra],
  };
}

export function planToolchainInstall(profile, host = {}) {
  const requirement = profileRequirements(profile);
  const plan = [];
  const platform = host.platform ?? process.platform;
  const packageManager = host.packageManager?.command ?? (platform === "win32" ? "winget" : "brew");
  const missing = (name) => !hasTool(host, name);
  const add = (id, description, command, args, extra = {}) => plan.push({ id, description, command, args, ...extra });

  if (platform === "darwin") {
    if (missing("Git")) add("git", "安装 Git", packageManager, ["install", "git"]);
    if (missing("Node.js")) add("node", "安装 Node.js", packageManager, ["install", "node"]);
    if (requirement.requiresCompiler && !hasTool(host, "Clang") && !hasTool(host, "GCC")) {
      add("compiler", "安装 Xcode Command Line Tools", "xcode-select", ["--install"], { requiresUserAction: true });
    }
    if (requirement.requiresCmake && missing("CMake")) add("cmake", "安装 CMake", packageManager, ["install", "cmake"]);
    return plan;
  }

  if (platform === "win32") {
    if (missing("Git")) add("git", "安装 Git", ...Object.values(wingetInstall("Git.Git")));
    if (missing("Node.js")) add("node", "安装 Node.js LTS", ...Object.values(wingetInstall("OpenJS.NodeJS.LTS")));
    if (requirement.requiresCompiler && !hasTool(host, "MSVC")) {
      add("msvc", "安装 Visual Studio C++ Build Tools", ...Object.values(wingetInstall("Microsoft.VisualStudio.2022.BuildTools", [
        "--override",
        "--wait --passive --add Microsoft.VisualStudio.Workload.VCTools --includeRecommended",
      ])));
    }
    if (requirement.requiresCmake && missing("CMake")) add("cmake", "安装 CMake", ...Object.values(wingetInstall("Kitware.CMake")));
    return plan;
  }

  throw setupError("SETUP_UNSUPPORTED", `暂不支持自动配置平台：${platform}`);
}

export function planIdeExtensions(options = {}, profile = "basic") {
  if (options.selection) {
    return [
      ...(options.installCppExtension ? ["ms-vscode.cpptools"] : []),
      ...(options.installCmakeExtension ? ["ms-vscode.cmake-tools"] : []),
    ];
  }
  return [
    ...(profile === "runtime" ? [] : ["ms-vscode.cpptools"]),
    ...(profile === "full" ? ["ms-vscode.cmake-tools"] : []),
  ];
}

async function runWithRunner(context, command, args = [], options = {}) {
  try {
    return await context.runner(command, args, {
      cwd: options.cwd ?? context.commandCwd ?? context.repoDir,
      env: options.env ?? context.env,
      timeoutMs: options.timeoutMs ?? options.timeMs ?? 30_000,
      timeMs: options.timeMs ?? options.timeoutMs ?? 30_000,
      outputLimitKb: options.outputLimitKb ?? options.outputKb ?? 4096,
      outputKb: options.outputKb ?? options.outputLimitKb ?? 4096,
      inherit: options.inherit ?? false,
    });
  } catch (error) {
    return { code: null, spawnError: error, stdout: "", stderr: "" };
  }
}

async function commandAvailable(context, command, args = ["--version"]) {
  const result = await runWithRunner(context, command, args, { timeoutMs: 5000, outputLimitKb: 256 });
  return !resultFailed(result) ? result : undefined;
}

async function detectPackageManager(context) {
  if (context.platform === "darwin") {
    const candidates = ["brew", "/opt/homebrew/bin/brew", "/usr/local/bin/brew"];
    for (const command of candidates) {
      const result = await commandAvailable(context, command);
      if (result) return { kind: "brew", command };
    }
    return undefined;
  }
  if (context.platform === "win32") {
    const result = await commandAvailable(context, "winget");
    return result ? { kind: "winget", command: "winget" } : undefined;
  }
  return undefined;
}

async function refreshPlatformEnvironment(context) {
  if (context.platform === "darwin" && context.packageManager?.kind === "brew") {
    const prefixResult = await runWithRunner(context, context.packageManager.command, ["--prefix"], { timeoutMs: 5000, outputLimitKb: 256 });
    const prefix = firstOutputLine(prefixResult);
    if (prefix) context.env.PATH = prependPath(context.env.PATH, [path.join(prefix, "bin"), path.join(prefix, "sbin")], ":");
  }
  if (context.platform === "win32") {
    const pathResult = await runWithRunner(context, "powershell.exe", [
      "-NoProfile",
      "-NonInteractive",
      "-Command",
      "[Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [Environment]::GetEnvironmentVariable('Path','User')",
    ], { timeoutMs: 10_000, outputLimitKb: 4096 });
    if (!resultFailed(pathResult) && pathResult.stdout?.trim()) context.env.PATH = pathResult.stdout.trim();
  }
  return context.env;
}

async function resolveExecutable(context, command) {
  if (path.isAbsolute(command)) return command;
  const resolver = context.platform === "win32" ? "where.exe" : "which";
  const result = await runWithRunner(context, resolver, [command], { timeoutMs: 5000, outputLimitKb: 256 });
  return firstOutputLine(result) ?? command;
}

function recordCommand(context, command, args, result) {
  context.commands.push({
    command,
    args,
    code: result?.code,
    stdout: result?.stdout ?? "",
    stderr: result?.stderr ?? "",
    timedOut: Boolean(result?.timedOut),
    outputExceeded: Boolean(result?.outputExceeded),
  });
}

async function runExternal(context, command, args, options = {}) {
  const result = await runWithRunner(context, command, args, options);
  recordCommand(context, command, args, result);
  if (resultFailed(result)) {
    throw setupError(
      options.errorCode ?? "INSTALLER_FAILED",
      options.errorMessage ?? `命令执行失败：${commandText(command, args)}`,
      { command, args, result },
    );
  }
  return result;
}

async function ensureHomebrew(context) {
  context.packageManager = await detectPackageManager(context);
  if (context.packageManager) return context.packageManager;
  if (!(await commandAvailable(context, "curl", ["--version"]))) {
    throw setupError("SETUP_UNSUPPORTED", "未找到 Homebrew 或 curl，无法自动安装 macOS 工具；请按 macOS 手工指南安装 Homebrew。", { fallback: "docs/MACOS_STUDENT_SETUP_GUIDE.md" });
  }
  const temporaryDirectory = await mkdtemp(path.join(os.tmpdir(), "dsa-mastery-brew-"));
  const installer = path.join(temporaryDirectory, "install-homebrew.sh");
  try {
    context.ui.update("toolchain", "running", "下载 Homebrew 官方安装脚本");
    await runExternal(context, "curl", ["-fsSL", HOMEBREW_INSTALLER, "-o", installer], { inherit: true });
    await runExternal(context, "/bin/bash", [installer], { inherit: true });
  } finally {
    await rm(temporaryDirectory, { recursive: true, force: true });
  }
  await refreshPlatformEnvironment(context);
  context.packageManager = await detectPackageManager(context);
  if (!context.packageManager) throw setupError("INSTALLER_FAILED", "Homebrew 安装命令已结束，但当前进程仍找不到 brew；请打开新终端后重试。", { restartRequired: true });
  return context.packageManager;
}

async function ensurePnpm(context) {
  const current = await runWithRunner(context, "pnpm", ["--version"], { timeoutMs: 5000, outputLimitKb: 256 });
  if (!resultFailed(current) && firstOutputLine(current) === PNPM_VERSION) {
    context.pnpmCommand = "pnpm";
    return context.pnpmCommand;
  }

  const corepack = await commandAvailable(context, "corepack", ["--version"]);
  if (corepack) {
    const enabled = await runWithRunner(context, "corepack", ["enable", "pnpm"], { timeoutMs: 30_000, outputLimitKb: 512 });
    recordCommand(context, "corepack", ["enable", "pnpm"], enabled);
    const installed = await runWithRunner(context, "corepack", ["install", "--global", `pnpm@${PNPM_VERSION}`], { timeoutMs: 60_000, outputLimitKb: 1024 });
    recordCommand(context, "corepack", ["install", "--global", `pnpm@${PNPM_VERSION}`], installed);
    const afterCorepack = await runWithRunner(context, "pnpm", ["--version"], { timeoutMs: 5000, outputLimitKb: 256 });
    if (!resultFailed(afterCorepack) && firstOutputLine(afterCorepack) === PNPM_VERSION) {
      context.pnpmCommand = "pnpm";
      return context.pnpmCommand;
    }
  }

  const npm = await commandAvailable(context, "npm", ["--version"]);
  if (!npm) throw setupError("INSTALLER_FAILED", "未找到 npm，无法准备固定版本 pnpm。请安装满足要求的 Node.js 后重试。", { required: `pnpm ${PNPM_VERSION}` });
  const globalInstall = await runWithRunner(context, "npm", ["install", "--global", `pnpm@${PNPM_VERSION}`], { timeoutMs: 120_000, outputLimitKb: 2048 });
  recordCommand(context, "npm", ["install", "--global", `pnpm@${PNPM_VERSION}`], globalInstall);
  const afterGlobal = await runWithRunner(context, "pnpm", ["--version"], { timeoutMs: 5000, outputLimitKb: 256 });
  if (!resultFailed(afterGlobal) && firstOutputLine(afterGlobal) === PNPM_VERSION) {
    context.pnpmCommand = "pnpm";
    return context.pnpmCommand;
  }

  const base = context.platform === "win32"
    ? path.join(context.env.LOCALAPPDATA ?? context.env.USERPROFILE ?? os.homedir(), "DSA-Mastery", "tools")
    : path.join(context.env.XDG_DATA_HOME ?? path.join(context.env.HOME ?? os.homedir(), ".local", "share"), "DSA-Mastery", "tools");
  await mkdir(base, { recursive: true });
  const localInstall = await runWithRunner(context, "npm", ["install", "--global", "--prefix", base, `pnpm@${PNPM_VERSION}`], { timeoutMs: 120_000, outputLimitKb: 2048 });
  recordCommand(context, "npm", ["install", "--global", "--prefix", base, `pnpm@${PNPM_VERSION}`], localInstall);
  const bin = context.platform === "win32" ? base : path.join(base, "bin");
  context.env.PATH = prependPath(context.env.PATH, [bin], context.platform === "win32" ? ";" : ":");
  const candidates = context.platform === "win32"
    ? [path.join(base, "pnpm.cmd"), path.join(base, "node_modules", ".bin", "pnpm.cmd")]
    : [path.join(bin, "pnpm")];
  for (const candidate of candidates) {
    const afterLocal = await runWithRunner(context, candidate, ["--version"], { timeoutMs: 5000, outputLimitKb: 256 });
    if (!resultFailed(afterLocal) && firstOutputLine(afterLocal) === PNPM_VERSION) {
      context.pnpmCommand = candidate;
      return context.pnpmCommand;
    }
  }
  throw setupError("INSTALLER_FAILED", `无法准备 pnpm ${PNPM_VERSION}；请按安装指南手工安装并重新运行。`, { required: `pnpm ${PNPM_VERSION}` });
}

async function installSystemTools(context) {
  const plan = planToolchainInstall(context.profile, { ...context.host, packageManager: context.packageManager });
  if (!plan.length) return plan;
  if (context.platform === "darwin") await ensureHomebrew(context);
  if (context.platform === "win32" && !context.packageManager) {
    context.packageManager = await detectPackageManager(context);
    if (!context.packageManager) throw setupError("SETUP_UNSUPPORTED", "未找到 winget，无法自动安装 Windows 工具；请按 Windows 手工指南安装 Git、Node、Build Tools 和 CMake。", { fallback: "docs/WINDOWS_STUDENT_SETUP_GUIDE.md" });
  }
  for (const action of plan) {
    if (action.requiresUserAction) {
      await runExternal(context, action.command, action.args, { inherit: true, errorCode: "NEEDS_USER_ACTION" });
      throw setupError("NEEDS_USER_ACTION", "Xcode Command Line Tools 安装窗口已打开；请完成安装后重新运行此脚本。", { restartRequired: true });
    }
    const command = action.command === "brew" ? context.packageManager.command : action.command;
    await runExternal(context, command, action.args, {
      inherit: true,
      timeoutMs: 20 * 60_000,
      errorMessage: `${action.description}失败：${commandText(command, action.args)}`,
    });
    if (action.id === "msvc") context.ui.update("toolchain", "running", "Visual Studio 安装完成，准备捕获开发环境");
  }
  await refreshPlatformEnvironment(context);
  context.nodeCommand = await resolveExecutable(context, "node");
  return plan;
}

async function inspectContextHost(context) {
  context.host = await inspectHost({
    platform: context.platform,
    architecture: context.architecture,
    env: context.env,
    nodeCommand: context.nodeCommand,
    runner: context.runner,
  });
  return context.host;
}

async function ensureToolchain(context) {
  await installSystemTools(context);
  await ensurePnpm(context);
  await refreshPlatformEnvironment(context);
  await inspectContextHost(context);
  const evaluation = evaluateProfile(context.profile, context.host.tools);
  context.evaluation = evaluation;
  if (!evaluation.ok) {
    throw setupError("ENVIRONMENT_NOT_READY", `环境检查未通过：${evaluation.issues.join("；")}。请根据提示补齐工具后重试。`, { evaluation, host: serializeHost(context.host) });
  }
  return evaluation;
}

async function ensureRepository(context) {
  let state = await inspectRepository(context.repoDir, { runner: context.runner, env: context.env });
  state.updateRepo = context.options.updateRepo;
  assertRepositorySafe(state);
  if (state.valid) {
    if (context.options.updateRepo) {
      if (!state.git) throw setupError("REPOSITORY_INVALID", "--update-repo 要求目标是 Git 仓库；当前目录缺少 .git。", { path: context.repoDir });
      await runExternal(context, "git", ["pull", "--ff-only"], { stage: "repository", timeoutMs: 120_000, errorCode: "REPOSITORY_UPDATE_FAILED", errorMessage: "仓库更新失败；未执行强制覆盖，请检查网络和远端分支。" });
      state = await inspectRepository(context.repoDir, { runner: context.runner, env: context.env });
    }
    context.repository = state;
    return state;
  }
  if (context.options.checkOnly) {
    throw setupError("REPOSITORY_MISSING", `未找到有效的 DSA Mastery 仓库：${context.repoDir}`, { path: context.repoDir });
  }
  await mkdir(path.dirname(context.repoDir), { recursive: true });
  await runExternal(context, "git", ["clone", context.options.repoUrl, context.repoDir], { stage: "repository", timeoutMs: 20 * 60_000, errorCode: "REPOSITORY_UPDATE_FAILED", errorMessage: `仓库 clone 失败：${context.options.repoUrl}` });
  state = await inspectRepository(context.repoDir, { runner: context.runner, env: context.env });
  if (!state.valid) throw setupError("REPOSITORY_INVALID", `clone 完成但目标不是有效的 DSA Mastery 仓库：${context.repoDir}`);
  context.repository = state;
  return state;
}

async function installDependencies(context) {
  const command = context.pnpmCommand ?? "pnpm";
  await runExternal(context, command, ["install", "--frozen-lockfile"], {
    stage: "dependencies",
    cwd: context.repoDir,
    env: context.env,
    timeoutMs: 20 * 60_000,
    errorCode: "INSTALLER_FAILED",
    errorMessage: "项目依赖安装失败；请查看日志中的 pnpm install 输出后重试。",
  });
}

async function askInstallChoices(options, io) {
  const interactive = !options.checkOnly && !options.nonInteractive && !options.json && options.ui !== "plain" && Boolean(io.input?.isTTY && io.output?.isTTY);
  if (!interactive) return { ...options, profile: options.profile ?? "basic" };
  if (options.profile) return { ...options };
  const initialSelection = createInstallSelection({
    program: true,
    project: false,
    vscode: options.installVscode,
    "cpp-extension": options.installCppExtension,
    "cmake-extension": options.installCmakeExtension,
  });
  const selected = await promptInstallSelection({
    input: io.input,
    output: io.output,
    initialSelection,
    title: "配置 DSA Mastery · 选择要安装的内容",
  });
  if (selected.cancelled) return { ...options, cancelled: true };
  return { ...options, ...selected };
}

async function askRepositoryUpdate(options, { io, cwd, runner, env }) {
  const interactive = !options.nonInteractive && !options.json && !options.checkOnly && options.ui !== "plain" && Boolean(io.input?.isTTY && io.output?.isTTY);
  if (!interactive || options.updateRepo) return options;
  const repositoryDir = resolveRepositoryDir({ cwd, repoDir: options.repoDir });
  const state = await inspectRepository(repositoryDir, { runner, env });
  if (!state.valid || !state.git || state.dirty) return options;
  const readline = createInterface({ input: io.input, output: io.output });
  try {
    const answer = (await readline.question(`发现已有干净仓库 ${repositoryDir}，是否执行 git pull --ff-only？[y/N]：`)).trim().toLowerCase();
    if (["y", "yes", "是"].includes(answer)) return { ...options, updateRepo: true };
  } finally {
    readline.close();
  }
  return options;
}

async function runLabJson(context, args, label) {
  const result = await runWithRunner(context, context.nodeCommand ?? process.execPath, ["tools/lab/cli.mjs", ...args, "--json", "--no-color"], {
    cwd: context.repoDir,
    timeoutMs: 10 * 60_000,
    outputLimitKb: 8192,
  });
  recordCommand(context, context.nodeCommand ?? process.execPath, ["tools/lab/cli.mjs", ...args, "--json", "--no-color"], result);
  let report;
  try {
    report = JSON.parse(result.stdout);
  } catch {
    throw setupError("SMOKE_FAILED", `${label} 未返回可解析的 JSON 报告。`, { result });
  }
  if (resultFailed(result) || report.ok !== true) {
    throw setupError("SMOKE_FAILED", `${label} 未通过；请查看报告或日志中的诊断。`, { report, result });
  }
  return report;
}

async function runSmoke(context) {
  if (context.profile === "runtime") {
    context.smoke = [];
    return context.smoke;
  }
  const program = path.join(context.repoDir, "labs", "chapter-01", "exercise", "E-01-01-sequential-list-deduplication");
  const results = [{
    label: "Program doctor",
    report: await runLabJson(context, ["doctor", program], "Program doctor"),
  }, {
    label: "Program reference sample",
    report: await runLabJson(context, ["run", program, "--target", "solution", "--case", "001-sample"], "Program reference sample"),
  }];
  if (context.profile === "full") {
    const project = path.join(context.repoDir, "labs", "chapter-08", "project", "P-08-01-avl-tree-rotations");
    results.push({ label: "Project doctor", report: await runLabJson(context, ["doctor", project], "Project doctor") });
    results.push({ label: "Project reference CTest", report: await runLabJson(context, ["run", project, "--target", "solution", "--task", "avl"], "Project reference CTest") });
  }
  context.smoke = results;
  return results;
}

async function installIde(context) {
  if (context.options.skipVscode || !context.options.installVscode) return { status: "skipped", message: "未选择 VS Code" };
  let code = await commandAvailable(context, "code", ["--version"]);
  if (!code) {
    if (context.platform === "darwin") {
      await ensureHomebrew(context);
      await runExternal(context, context.packageManager.command, ["install", "--cask", "visual-studio-code"], { stage: "ide", inherit: true, timeoutMs: 20 * 60_000 });
    } else if (context.platform === "win32") {
      if (!context.packageManager) context.packageManager = await detectPackageManager(context);
      if (!context.packageManager) return { status: "warning", message: "未找到 winget，跳过 VS Code" };
      const install = wingetInstall("Microsoft.VisualStudioCode");
      await runExternal(context, install.command, install.args, { stage: "ide", inherit: true, timeoutMs: 20 * 60_000 });
    }
    await refreshPlatformEnvironment(context);
    code = await commandAvailable(context, "code", ["--version"]);
  }
  if (!code) return { status: "warning", message: "VS Code 安装后当前终端仍找不到 code，请打开新终端" };
  const extensions = planIdeExtensions(context.options, context.profile);
  const failures = [];
  for (const extension of extensions) {
    const result = await runWithRunner(context, "code", ["--install-extension", extension, "--force"], { timeoutMs: 120_000, outputLimitKb: 2048 });
    recordCommand(context, "code", ["--install-extension", extension, "--force"], result);
    if (resultFailed(result)) failures.push(extension);
  }
  return failures.length ? { status: "warning", message: `扩展安装失败：${failures.join(", ")}` } : { status: "success", message: extensions.length ? "VS Code 与所选扩展已准备" : "VS Code 已准备" };
}

function serializeHost(host) {
  if (!host) return undefined;
  return {
    platform: host.platform,
    architecture: host.architecture,
    compilerReady: host.compilerReady,
    cmakeReady: host.cmakeReady,
    runtimeReady: host.runtimeReady,
    tools: host.tools,
    msvc: {
      initialized: host.msvc?.initialized,
      installationPath: host.msvc?.installationPath,
      developerCommand: host.msvc?.developerCommand,
      error: host.msvc?.error,
    },
  };
}

function summarizeReport(report) {
  const lines = [
    "",
    `DSA Mastery 环境配置：${report.ok ? "成功" : "未完成"}`,
    `Profile：${report.profile} · 平台：${report.platform}/${report.architecture}`,
  ];
  if (report.selectionLabels?.length) lines.push(`已选择：${report.selectionLabels.join("、")}`);
  for (const stage of report.stages ?? []) lines.push(`${stage.status === "success" ? "✓" : stage.status === "warning" ? "⚠" : stage.status === "skipped" ? "–" : stage.status === "failed" ? "✗" : "·"} ${stage.id}：${stage.message ?? ""}`);
  if (report.repository?.path) lines.push(`仓库：${report.repository.path}`);
  if (report.logPath) lines.push(`日志：${report.logPath}`);
  if (report.error?.nextAction) lines.push(`下一步：${report.error.nextAction}`);
  return lines.join("\n");
}

function createSilentProgressUI() {
  const stages = SETUP_STAGES.map((id) => ({ id, name: id, status: "pending", message: "" }));
  return {
    stages,
    start() {},
    update(id, status, message = "") {
      const stage = stages.find((item) => item.id === id);
      if (stage) {
        stage.status = status;
        stage.message = message;
      }
    },
    finish() {},
  };
}

async function writeFailureLog(context, report) {
  if (context.options.checkOnly) return undefined;
  const home = context.env.HOME ?? context.env.USERPROFILE ?? os.homedir();
  const directory = context.platform === "darwin"
    ? path.join(home, "Library", "Logs", "DSA-Mastery", "setup")
    : context.platform === "win32"
      ? path.join(context.env.LOCALAPPDATA ?? path.join(home, "AppData", "Local"), "DSA-Mastery", "setup")
      : path.join(home, ".local", "state", "DSA-Mastery", "setup");
  await mkdir(directory, { recursive: true });
  const file = path.join(directory, `setup-${new Date().toISOString().replace(/[:.]/g, "-")}.log`);
  const lines = [
    `DSA Mastery setup ${new Date().toISOString()}`,
    `profile=${context.profile}`,
    `platform=${context.platform}/${context.architecture}`,
    `repo=${context.repoDir}`,
    `error=${report.error?.code ?? "unknown"}: ${report.error?.message ?? "unknown"}`,
    "",
  ];
  for (const command of context.commands) {
    lines.push(`$ ${commandText(command.command, command.args)}`);
    if (command.stdout) lines.push(command.stdout.trimEnd());
    if (command.stderr) lines.push(command.stderr.trimEnd());
    lines.push("");
  }
  await writeFile(file, `${lines.join("\n")}\n`, "utf8");
  return file;
}

async function runCheckOnly(context) {
  const evaluation = evaluateProfile(context.profile, context.host.tools);
  context.evaluation = evaluation;
  const repository = await inspectRepository(context.repoDir, { runner: context.runner, env: context.env });
  context.repository = repository;
  const issues = [...evaluation.issues];
  if (!repository.valid) issues.push(`有效仓库：${context.repoDir}`);
  if (issues.length) {
    evaluation.ok = false;
    evaluation.issues = issues;
    throw setupError("ENVIRONMENT_NOT_READY", `只读检查未通过：${issues.join("；")}`, { evaluation, host: serializeHost(context.host), repository });
  }
  return { evaluation, repository };
}

async function executeStage(context, id, action) {
  context.currentStage = id;
  context.ui.update(id, "running", "准备中");
  const result = await action();
  const status = result?.status ?? "success";
  context.ui.update(id, status, result?.message ?? "完成");
  return result;
}

function normalizeError(rawError) {
  if (rawError instanceof SetupError) return rawError;
  const code = rawError?.code === "ARGUMENT_INVALID" ? "ARGUMENT_INVALID" : "INSTALLER_FAILED";
  return setupError(code, rawError?.message ?? String(rawError), { cause: rawError?.stack });
}

export async function runSetup(argv = [], dependencies = {}) {
  let options;
  try {
    options = parseSetupArgs(argv);
  } catch (error) {
    const normalized = normalizeError(error);
    return {
      exitCode: normalized.exitCode,
      report: { reportVersion: 1, command: "setup", ok: false, error: { code: normalized.code, message: normalized.message } },
    };
  }
  if (options.help) {
    return {
      exitCode: SETUP_EXIT.OK,
      report: { reportVersion: 1, command: "setup", ok: true, help: "node scripts/bootstrap/setup.mjs [--profile runtime|basic|full] [--check-only] [--repo-dir <path>] [--ui auto|tui|plain]" },
    };
  }

  const io = dependencies.io ?? { input: process.stdin, output: process.stdout };
  options = await askInstallChoices(options, io);
  if (options.cancelled) {
    const report = {
      reportVersion: 1,
      command: "setup",
      ok: false,
      cancelled: true,
      message: "已取消安装",
    };
    return { exitCode: SETUP_EXIT.OK, report, summary: "\nDSA Mastery 环境配置：已取消" };
  }
  const profile = profileRequirements(options.profile).name;
  const runner = dependencies.runner ?? runCommand;
  options = await askRepositoryUpdate(options, {
    io,
    cwd: dependencies.cwd ?? process.cwd(),
    runner,
    env: dependencies.env ?? process.env,
  });
  const context = {
    options,
    profile,
    platform: dependencies.platform ?? process.platform,
    architecture: dependencies.architecture ?? process.arch,
    env: { ...(dependencies.env ?? process.env) },
    runner,
    commandCwd: dependencies.commandCwd ?? dependencies.cwd ?? process.cwd(),
    repoDir: resolveRepositoryDir({ cwd: dependencies.cwd ?? process.cwd(), repoDir: options.repoDir }),
    nodeCommand: dependencies.nodeCommand ?? process.execPath,
    commands: [],
    stages: SETUP_STAGES,
    ui: undefined,
  };
  context.packageManager = await detectPackageManager(context);
  context.ui = options.json
    ? createSilentProgressUI()
    : createProgressUI({ mode: options.ui, stdout: io.output, title: "DSA Mastery 环境配置", profile, stageNames: SETUP_STAGES, nonInteractive: options.nonInteractive });
  const report = {
    reportVersion: 1,
    command: "setup",
    ok: false,
    profile,
    platform: context.platform,
    architecture: context.architecture,
    repoDir: context.repoDir,
    selection: options.selection,
    selectionLabels: options.selection ? choiceSelectionSummary(options.selection) : undefined,
    stages: SETUP_STAGES.map((id) => ({ id, status: "pending", message: "" })),
  };
  try {
    context.ui.start();
    await executeStage(context, "preflight", async () => {
      await inspectContextHost(context);
      const compilerMessage = profile === "runtime"
        ? "未选择 C++ 编译器"
        : `编译器${context.host.compilerReady ? "可用" : "缺失"}`;
      return { message: `Node ${context.host.tools.find((tool) => tool.name === "Node.js")?.version ?? "unknown"} · ${compilerMessage}` };
    });
    if (options.checkOnly) {
      await executeStage(context, "toolchain", async () => {
        await runCheckOnly(context);
        return { message: "只读检查通过" };
      });
      await executeStage(context, "repository", async () => ({ status: context.repository?.valid ? "success" : "warning", message: context.repository?.valid ? "仓库有效" : "仓库缺失" }));
      context.ui.update("dependencies", "skipped", "check-only 不安装依赖");
      context.ui.update("ide", "skipped", "check-only 不安装 IDE");
      context.ui.update("smoke", "skipped", "check-only 不运行 smoke");
    } else {
      await executeStage(context, "toolchain", async () => {
        await ensureToolchain(context);
        return { message: profile === "runtime" ? "Node/pnpm 已就绪" : `Node/pnpm/编译器${profile === "full" ? "/CMake" : ""} 已就绪` };
      });
      await executeStage(context, "repository", async () => {
        const repository = await ensureRepository(context);
        return { message: context.options.updateRepo ? "仓库已检查并更新" : "仓库已复用或准备" , repository };
      });
      await executeStage(context, "dependencies", async () => {
        await installDependencies(context);
        return { message: "pnpm install --frozen-lockfile 完成" };
      });
      await executeStage(context, "ide", async () => installIde(context));
      if (profile === "runtime") {
        context.ui.update("smoke", "skipped", "runtime 方案不运行 C++ smoke");
      } else {
        await executeStage(context, "smoke", async () => {
          await runSmoke(context);
          return { message: profile === "full" ? "Program + Project reference 验证通过" : "Program reference 验证通过" };
        });
      }
    }
    report.ok = true;
  } catch (rawError) {
    const error = normalizeError(rawError);
    report.error = {
      code: error.code,
      message: error.message,
      details: error.details,
      nextAction: error.details?.restartRequired
        ? "完成系统安装/重启终端后重新运行同一命令。"
        : error.code === "REPOSITORY_DIRTY"
          ? "先提交或暂存改动，再显式使用 --update-repo。"
          : error.code === "SETUP_UNSUPPORTED"
            ? "改用对应平台的手工安装指南，再重新运行 --check-only。"
            : "根据失败阶段和日志中的完整命令输出修复后重新运行。",
    };
    context.ui.update(context.currentStage ?? "preflight", "failed", error.message);
    report.exitCode = error.exitCode;
  } finally {
    for (const stage of report.stages) {
      const current = context.ui.stages?.find((item) => item.id === stage.id);
      if (current) {
        stage.status = current.status;
        stage.message = current.message;
      }
    }
    report.repository = context.repository ? { path: context.repository.path, valid: context.repository.valid, dirty: context.repository.dirty, remote: context.repository.remote } : undefined;
    report.host = serializeHost(context.host);
    report.evaluation = context.evaluation;
    report.smoke = context.smoke?.map((item) => ({ label: item.label, ok: item.report.ok }));
    if (!report.ok && !options.checkOnly) {
      try {
        report.logPath = await writeFailureLog(context, report);
      } catch (error) {
        report.logError = error.message;
      }
    }
    context.ui.finish({ ok: report.ok });
  }
  report.exitCode ??= report.ok ? SETUP_EXIT.OK : SETUP_EXIT.INSTALLER;
  return { exitCode: report.exitCode, report, summary: summarizeReport(report) };
}

async function main() {
  const result = await runSetup(process.argv.slice(2));
  if (result.report.help) console.log(result.report.help);
  else if (result.report.command === "setup" && !result.report.error && process.argv.includes("--json")) console.log(JSON.stringify(result.report, null, 2));
  else if (process.argv.includes("--json")) console.log(JSON.stringify(result.report, null, 2));
  else if (result.summary) console.log(result.summary);
  process.exitCode = result.exitCode;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) await main();
