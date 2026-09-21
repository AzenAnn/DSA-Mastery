import type { HostReport, ProfileEvaluation } from "../checks.ts";
import type { SetupContext } from "./context.ts";
import { mkdir, mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { profileRequirements } from "@dsa/lab-core";
import { evaluateProfile, PNPM_VERSION } from "../checks.ts";
import { commandText } from "../commands.ts";
import {
  commandAvailable,
  firstOutputLine,
  hasTool,
  HOMEBREW_INSTALLER,
  inspectContextHost,
  prependPath,
  recordCommand,
  refreshPlatformEnvironment,
  resolveExecutable,
  resultFailed,
  resultOutput,
  runExternal,
  runWithRunner,
} from "./context.ts";
import { serializeHost, setupError } from "./report.ts";

export interface PackageManager {
  kind: "brew" | "winget";
  command: string;
}

export interface ToolchainAction {
  id: string;
  description: string;
  command: string;
  args: string[];
  requiresUserAction?: boolean;
}

export function wingetInstall(id: string, extra: string[] = []): { command: string; args: string[] } {
  return {
    command: "winget",
    args: [
      "install",
      "--id",
      id,
      "--exact",
      "--source",
      "winget",
      "--accept-source-agreements",
      "--accept-package-agreements",
      ...extra,
    ],
  };
}

const VS_BUILDTOOLS_INSTALLER_URL = "https://aka.ms/vs/17/release/vs_buildtools.exe";
const VC_TOOLS_COMPONENT = "Microsoft.VisualStudio.Component.VC.Tools.x86.x64";

async function findVisualStudioViaVsWhere(context: SetupContext) {
  const candidates: string[] = [];
  if (context.env["ProgramFiles(x86)"] !== undefined) {
    candidates.push(path.join(context.env["ProgramFiles(x86)"], "Microsoft Visual Studio", "Installer", "vswhere.exe"));
  }
  candidates.push("vswhere.exe");
  for (const command of [...new Set(candidates)]) {
    const result = await runWithRunner(
      context,
      command,
      ["-latest", "-products", "*", "-requires", VC_TOOLS_COMPONENT, "-property", "installationPath"],
      { timeMs: 10_000, outputKb: 256 },
    );
    if (!resultFailed(result)) {
      const installationPath = resultOutput(result).split(/\r?\n/).find(Boolean)?.trim();
      if (installationPath !== undefined && installationPath !== "") return { installationPath, vswhere: command };
    }
  }
  return undefined;
}

async function downloadFileWithPowershell(context: SetupContext, url: string, destination: string): Promise<string> {
  const result = await runWithRunner(
    context,
    "powershell.exe",
    [
      "-NoProfile",
      "-NonInteractive",
      "-Command",
      `[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri '${url}' -OutFile '${destination}' -UseBasicParsing`,
    ],
    { timeMs: 10 * 60_000, outputKb: 4096 },
  );
  if (resultFailed(result)) {
    throw setupError("INSTALLER_FAILED", `下载失败：${url}`, { command: "powershell.exe", result });
  }
  return destination;
}

async function installVisualStudioBuildTools(context: SetupContext) {
  const existing = await findVisualStudioViaVsWhere(context);
  if (existing) {
    context.ui.update("toolchain", "running", `检测到已安装 Visual Studio C++ 工具：${existing.installationPath}`);
    return { skipped: true, reason: "already-installed", installationPath: existing.installationPath };
  }

  if (context.packageManager?.kind === "winget") {
    const install = wingetInstall("Microsoft.VisualStudio.2022.BuildTools", [
      "--wait",
      "--override",
      "--passive --norestart --add Microsoft.VisualStudio.Workload.VCTools --includeRecommended",
    ]);
    try {
      context.ui.update("toolchain", "running", "通过 winget 安装 Visual Studio C++ Build Tools");
      await runExternal(context, install.command, install.args, {
        inherit: true,
        timeMs: 45 * 60_000,
        errorMessage: "winget 安装 Visual Studio C++ Build Tools 失败",
      });
      return { method: "winget" };
    } catch {
      context.ui.update("toolchain", "running", "winget 安装未成功，回退到官方安装程序");
    }
  }

  const tempDir = await mkdtemp(path.join(os.tmpdir(), "dsa-mastery-vs-"));
  const installer = path.join(tempDir, "vs_buildtools.exe");
  try {
    context.ui.update("toolchain", "running", "下载 Visual Studio Build Tools 官方安装程序");
    await downloadFileWithPowershell(context, VS_BUILDTOOLS_INSTALLER_URL, installer);
    context.ui.update("toolchain", "running", "运行官方安装程序（可能需要 10-30 分钟）");
    await runExternal(
      context,
      installer,
      [
        "--wait",
        "--passive",
        "--norestart",
        "--add",
        "Microsoft.VisualStudio.Workload.VCTools",
        "--includeRecommended",
      ],
      {
        inherit: true,
        timeMs: 90 * 60_000,
        errorMessage: "官方安装程序安装 Visual Studio C++ Build Tools 失败",
      },
    );
    return { method: "official-installer" };
  } finally {
    await rm(tempDir, { recursive: true, force: true }).catch(() => {});
  }
}

export function planToolchainInstall(
  profile: string,
  host: Partial<HostReport> & { packageManager?: PackageManager } = {},
): ToolchainAction[] {
  const requirement = profileRequirements(profile);
  const plan: ToolchainAction[] = [];
  const platform = host.platform ?? process.platform;
  const packageManager = host.packageManager?.command ?? (platform === "win32" ? "winget" : "brew");
  const missing = (name: string): boolean => !hasTool(host, name);
  const add = (
    id: string,
    description: string,
    install: { command: string; args: string[] },
    extra: Partial<ToolchainAction> = {},
  ): void => {
    plan.push({ id, description, ...install, ...extra });
  };

  if (platform === "darwin") {
    if (missing("Git")) add("git", "安装 Git", { command: packageManager, args: ["install", "git"] });
    if (missing("Node.js")) add("node", "安装 Node.js", { command: packageManager, args: ["install", "node"] });
    if (requirement.requiresCompiler && !hasTool(host, "Clang") && !hasTool(host, "GCC")) {
      add(
        "compiler",
        "安装 Xcode Command Line Tools",
        { command: "xcode-select", args: ["--install"] },
        { requiresUserAction: true },
      );
    }
    if (requirement.requiresCmake && missing("CMake"))
      add("cmake", "安装 CMake", { command: packageManager, args: ["install", "cmake"] });
    return plan;
  }

  if (platform === "win32") {
    if (missing("Git")) add("git", "安装 Git", wingetInstall("Git.Git"));
    if (missing("Node.js")) add("node", "安装 Node.js LTS", wingetInstall("OpenJS.NodeJS.LTS"));
    const hasAnyCompiler = hasTool(host, "MSVC") || hasTool(host, "GCC") || hasTool(host, "Clang");
    if (requirement.requiresCompiler && !hasAnyCompiler) {
      add(
        "msvc",
        "安装 Visual Studio C++ Build Tools",
        wingetInstall("Microsoft.VisualStudio.2022.BuildTools", [
          "--wait",
          "--override",
          "--passive --norestart --add Microsoft.VisualStudio.Workload.VCTools --includeRecommended",
        ]),
      );
    }
    if (requirement.requiresCmake && missing("CMake")) add("cmake", "安装 CMake", wingetInstall("Kitware.CMake"));
    return plan;
  }

  throw setupError("SETUP_UNSUPPORTED", `暂不支持自动配置平台：${platform}`);
}

export async function detectPackageManager(context: SetupContext): Promise<PackageManager | undefined> {
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

export async function ensureHomebrew(context: SetupContext): Promise<PackageManager> {
  context.packageManager = await detectPackageManager(context);
  if (context.packageManager) return context.packageManager;
  if (!(await commandAvailable(context, "curl", ["--version"]))) {
    throw setupError(
      "SETUP_UNSUPPORTED",
      "未找到 Homebrew 或 curl，无法自动安装 macOS 工具；请按 macOS 手工指南安装 Homebrew。",
      { fallback: "docs/MACOS_STUDENT_SETUP_GUIDE.md" },
    );
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
  if (!context.packageManager) {
    throw setupError("INSTALLER_FAILED", "Homebrew 安装命令已结束，但当前进程仍找不到 brew；请打开新终端后重试。", {
      restartRequired: true,
    });
  }
  return context.packageManager;
}

async function ensurePnpm(context: SetupContext): Promise<string> {
  const current = await runWithRunner(context, "pnpm", ["--version"], { timeMs: 5000, outputKb: 256 });
  if (!resultFailed(current) && firstOutputLine(current) === PNPM_VERSION) {
    context.pnpmCommand = "pnpm";
    return context.pnpmCommand;
  }

  const corepack = await commandAvailable(context, "corepack", ["--version"]);
  if (corepack) {
    const enabled = await runWithRunner(context, "corepack", ["enable", "pnpm"], { timeMs: 30_000, outputKb: 512 });
    recordCommand(context, "corepack", ["enable", "pnpm"], enabled);
    const installed = await runWithRunner(context, "corepack", ["install", "--global", `pnpm@${PNPM_VERSION}`], {
      timeMs: 60_000,
      outputKb: 1024,
    });
    recordCommand(context, "corepack", ["install", "--global", `pnpm@${PNPM_VERSION}`], installed);
    const afterCorepack = await runWithRunner(context, "pnpm", ["--version"], { timeMs: 5000, outputKb: 256 });
    if (!resultFailed(afterCorepack) && firstOutputLine(afterCorepack) === PNPM_VERSION) {
      context.pnpmCommand = "pnpm";
      return context.pnpmCommand;
    }
  }

  const npm = await commandAvailable(context, "npm", ["--version"]);
  if (!npm) {
    throw setupError("INSTALLER_FAILED", "未找到 npm，无法准备固定版本 pnpm。请安装满足要求的 Node.js 后重试。", {
      required: `pnpm ${PNPM_VERSION}`,
    });
  }
  const globalInstall = await runWithRunner(context, "npm", ["install", "--global", `pnpm@${PNPM_VERSION}`], {
    timeMs: 120_000,
    outputKb: 2048,
  });
  recordCommand(context, "npm", ["install", "--global", `pnpm@${PNPM_VERSION}`], globalInstall);
  const afterGlobal = await runWithRunner(context, "pnpm", ["--version"], { timeMs: 5000, outputKb: 256 });
  if (!resultFailed(afterGlobal) && firstOutputLine(afterGlobal) === PNPM_VERSION) {
    context.pnpmCommand = "pnpm";
    return context.pnpmCommand;
  }

  const base =
    context.platform === "win32"
      ? path.join(context.env.LOCALAPPDATA ?? context.env.USERPROFILE ?? os.homedir(), "DSA-Mastery", "tools")
      : path.join(
          context.env.XDG_DATA_HOME ?? path.join(context.env.HOME ?? os.homedir(), ".local", "share"),
          "DSA-Mastery",
          "tools",
        );
  await mkdir(base, { recursive: true });
  const localInstall = await runWithRunner(
    context,
    "npm",
    ["install", "--global", "--prefix", base, `pnpm@${PNPM_VERSION}`],
    { timeMs: 120_000, outputKb: 2048 },
  );
  recordCommand(context, "npm", ["install", "--global", "--prefix", base, `pnpm@${PNPM_VERSION}`], localInstall);
  const bin = context.platform === "win32" ? base : path.join(base, "bin");
  context.env.PATH = prependPath(context.env.PATH, [bin], context.platform === "win32" ? ";" : ":");
  const candidates =
    context.platform === "win32"
      ? [path.join(base, "pnpm.cmd"), path.join(base, "node_modules", ".bin", "pnpm.cmd")]
      : [path.join(bin, "pnpm")];
  for (const candidate of candidates) {
    const afterLocal = await runWithRunner(context, candidate, ["--version"], { timeMs: 5000, outputKb: 256 });
    if (!resultFailed(afterLocal) && firstOutputLine(afterLocal) === PNPM_VERSION) {
      context.pnpmCommand = candidate;
      return context.pnpmCommand;
    }
  }
  throw setupError("INSTALLER_FAILED", `无法准备 pnpm ${PNPM_VERSION}；请按安装指南手工安装并重新运行。`, {
    required: `pnpm ${PNPM_VERSION}`,
  });
}

async function installSystemTools(context: SetupContext): Promise<ToolchainAction[]> {
  const plan = planToolchainInstall(context.profile, { ...context.host, packageManager: context.packageManager });
  if (!plan.length) return plan;
  if (context.platform === "darwin") await ensureHomebrew(context);
  if (context.platform === "win32" && !context.packageManager) {
    context.packageManager = await detectPackageManager(context);
    if (!context.packageManager) {
      throw setupError(
        "SETUP_UNSUPPORTED",
        "未找到 winget，无法自动安装 Windows 工具；请按 Windows 手工指南安装 Git、Node、Build Tools 和 CMake。",
        { fallback: "docs/WINDOWS_STUDENT_SETUP_GUIDE.md" },
      );
    }
  }
  for (const action of plan) {
    if (action.requiresUserAction) {
      await runExternal(context, action.command, action.args, { inherit: true, errorCode: "NEEDS_USER_ACTION" });
      throw setupError("NEEDS_USER_ACTION", "Xcode Command Line Tools 安装窗口已打开；请完成安装后重新运行此脚本。", {
        restartRequired: true,
      });
    }
    if (action.id === "msvc" && context.platform === "win32") {
      await installVisualStudioBuildTools(context);
      context.ui.update("toolchain", "running", "Visual Studio 安装完成，准备捕获开发环境");
      continue;
    }
    const command = action.command === "brew" ? context.packageManager!.command : action.command;
    await runExternal(context, command, action.args, {
      inherit: true,
      timeMs: 20 * 60_000,
      errorMessage: `${action.description}失败：${commandText(command, action.args)}`,
    });
  }
  await refreshPlatformEnvironment(context);
  context.nodeCommand = await resolveExecutable(context, "node");
  return plan;
}

export async function ensureToolchain(context: SetupContext): Promise<ProfileEvaluation> {
  await installSystemTools(context);
  await ensurePnpm(context);
  await refreshPlatformEnvironment(context);
  await inspectContextHost(context);
  const evaluation = evaluateProfile(context.profile, context.host!.tools);
  context.evaluation = evaluation;
  if (!evaluation.ok) {
    throw setupError(
      "ENVIRONMENT_NOT_READY",
      `环境检查未通过：${evaluation.issues.join("；")}。请根据提示补齐工具后重试。`,
      { evaluation, host: serializeHost(context.host) },
    );
  }
  return evaluation;
}
