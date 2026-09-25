import type { Runner } from "@dsa/lab-core";
import path from "node:path";
import process from "node:process";
import { LabError, runProcess } from "@dsa/lab-core";

export interface ToolchainProbeOptions {
  platform?: NodeJS.Platform;
  env?: NodeJS.ProcessEnv;
  runner?: Runner;
}

export interface VisualStudioInstallation {
  installationPath: string;
  vswhere: string;
}

export interface MsvcEnvironment {
  family: "msvc";
  command: "cl";
  env: NodeJS.ProcessEnv;
  installationPath: string;
  developerCommand: string;
}

export interface MinGwEnvironment {
  family: "mingw";
  command: "g++";
  env: NodeJS.ProcessEnv;
}

export type ProjectEnvironment = MsvcEnvironment | MinGwEnvironment;

export function parseEnvironmentBlock(source: unknown, baseEnvironment: NodeJS.ProcessEnv = {}): NodeJS.ProcessEnv {
  const environment: NodeJS.ProcessEnv = { ...baseEnvironment };
  for (const rawLine of String(source ?? "").split(/\r?\n/)) {
    const line = rawLine.trimEnd();
    const separator = line.indexOf("=");
    if (separator <= 0) continue;
    const key = line.slice(0, separator).trim();
    if (!key) continue;
    environment[key] = line.slice(separator + 1);
  }

  return environment;
}

export function parseVsWherePath(source: unknown): string | undefined {
  return String(source ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean);
}

function vsWhereCandidates(env: NodeJS.ProcessEnv): string[] {
  const candidates: string[] = [];
  if (env["VSWHERE_PATH"] !== undefined && env["VSWHERE_PATH"] !== "") candidates.push(env["VSWHERE_PATH"]);
  if (env["ProgramFiles(x86)"] !== undefined) {
    candidates.push(path.win32.join(env["ProgramFiles(x86)"], "Microsoft Visual Studio", "Installer", "vswhere.exe"));
  }
  candidates.push("vswhere.exe");

  return [...new Set(candidates)];
}

const VSWHERE_ARGS = [
  "-latest",
  "-products",
  "*",
  "-requires",
  "Microsoft.VisualStudio.Component.VC.Tools.x86.x64",
  "-property",
  "installationPath",
];

export async function findVisualStudioInstallation({
  platform = process.platform,
  env = process.env,
  runner = runProcess,
}: ToolchainProbeOptions = {}): Promise<VisualStudioInstallation | undefined> {
  if (platform !== "win32") return undefined;
  for (const command of vsWhereCandidates(env)) {
    const result = await runner(command, VSWHERE_ARGS, { env, timeMs: 10_000, outputKb: 256 });
    const installationPath = result?.code === 0 && !result.spawnError ? parseVsWherePath(result.stdout) : undefined;
    if (installationPath !== undefined && installationPath !== "") return { installationPath, vswhere: command };
  }

  return undefined;
}

export async function createMsvcEnvironment({
  platform = process.platform,
  env = process.env,
  runner = runProcess,
}: ToolchainProbeOptions = {}): Promise<MsvcEnvironment | undefined> {
  if (platform !== "win32") return undefined;
  const installation = await findVisualStudioInstallation({ platform, env, runner });
  if (!installation) {
    throw new LabError(
      "MSVC_ENV_NOT_FOUND",
      "未找到满足 Microsoft.VisualStudio.Component.VC.Tools.x86.x64 的 Visual Studio 实例；请安装 Visual Studio 2022 Build Tools，或打开 Developer PowerShell。",
      { candidates: vsWhereCandidates(env) },
    );
  }
  const developerCommand = path.win32.join(installation.installationPath, "Common7", "Tools", "VsDevCmd.bat");
  const commandLine = `call "${developerCommand}" -arch=x64 >nul 2>&1 && set`;
  const result = await runner("cmd.exe", ["/d", "/s", "/c", commandLine], { env, timeMs: 60_000, outputKb: 4096 });
  if (result?.spawnError || result?.code !== 0) {
    throw new LabError("MSVC_ENV_NOT_FOUND", `Visual Studio 开发环境初始化失败：${developerCommand}`, {
      installationPath: installation.installationPath,
      developerCommand,
      result,
    });
  }

  return {
    family: "msvc",
    command: "cl",
    env: parseEnvironmentBlock(result.stdout, env),
    installationPath: installation.installationPath,
    developerCommand,
  };
}

/**
 * 没装 Visual Studio 但有 MinGW 的 Windows 机器的退路。
 *
 * CMake 默认挑 MSVC 生成器，探不到就直接失败；显式换成 MinGW Makefiles 才能把 Project Lab 跑起来。
 */
export async function createMinGwEnvironment({
  platform = process.platform,
  env = process.env,
  runner = runProcess,
}: ToolchainProbeOptions = {}): Promise<MinGwEnvironment | undefined> {
  if (platform !== "win32" || (env["CMAKE_GENERATOR"] ?? "") !== "") return undefined;
  if (env["CXX"] !== undefined && !/g\+\+|mingw|gcc/iu.test(env["CXX"])) return undefined;
  const probe = await runner("g++", ["--version"], { env, timeMs: 10_000, outputKb: 256 });
  if (probe.spawnError || probe.code !== 0) return undefined;

  return {
    family: "mingw",
    command: "g++",
    env: { ...env, CMAKE_GENERATOR: "MinGW Makefiles", CXX: env["CXX"] ?? "g++" },
  };
}

export function isMsvcCommand(command: unknown): boolean {
  return /(?:^|[\\/])cl(?:\.exe)?$/iu.test(String(command ?? ""));
}
