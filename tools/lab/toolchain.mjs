import path from "node:path";

import { runProcess } from "./process.mjs";

export function parseEnvironmentBlock(source, baseEnvironment = {}) {
  const environment = { ...baseEnvironment };
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

export function parseVsWherePath(source) {
  return String(source ?? "").split(/\r?\n/).map((line) => line.trim()).find(Boolean);
}

function msvcError(message, details = undefined) {
  const error = new Error(message);
  error.code = "MSVC_ENV_NOT_FOUND";
  error.details = details;
  return error;
}

function vsWhereCandidates(env) {
  const candidates = [];
  if (env.VSWHERE_PATH) candidates.push(env.VSWHERE_PATH);
  if (env["ProgramFiles(x86)"]) {
    candidates.push(path.win32.join(
      env["ProgramFiles(x86)"],
      "Microsoft Visual Studio",
      "Installer",
      "vswhere.exe",
    ));
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

export async function findVisualStudioInstallation({ platform = process.platform, env = process.env, runner = runProcess } = {}) {
  if (platform !== "win32") return undefined;
  for (const command of vsWhereCandidates(env)) {
    const result = await runner(command, VSWHERE_ARGS, { env, timeMs: 10_000, outputKb: 256 });
    const installationPath = result?.code === 0 && !result.spawnError
      ? parseVsWherePath(result.stdout)
      : undefined;
    if (installationPath) return { installationPath, vswhere: command };
  }
  return undefined;
}

export async function createMsvcEnvironment({ platform = process.platform, env = process.env, runner = runProcess } = {}) {
  if (platform !== "win32") return undefined;
  const installation = await findVisualStudioInstallation({ platform, env, runner });
  if (!installation) {
    throw msvcError(
      "未找到满足 Microsoft.VisualStudio.Component.VC.Tools.x86.x64 的 Visual Studio 实例；请安装 Visual Studio 2022 Build Tools，或打开 Developer PowerShell。",
      { candidates: vsWhereCandidates(env) },
    );
  }
  const developerCommand = path.win32.join(installation.installationPath, "Common7", "Tools", "VsDevCmd.bat");
  const commandLine = `call "${developerCommand}" -arch=x64 >nul && set`;
  const result = await runner("cmd.exe", ["/d", "/s", "/c", commandLine], {
    env,
    timeMs: 30_000,
    outputKb: 4096,
  });
  if (result?.spawnError || result?.code !== 0) {
    throw msvcError(
      `Visual Studio 开发环境初始化失败：${developerCommand}`,
      { installationPath: installation.installationPath, developerCommand, result },
    );
  }
  const developerEnvironment = parseEnvironmentBlock(result.stdout, env);
  return {
    family: "msvc",
    command: "cl",
    env: developerEnvironment,
    installationPath: installation.installationPath,
    developerCommand,
  };
}

export function isMsvcCommand(command) {
  return /(?:^|[\\/])cl(?:\.exe)?$/iu.test(String(command ?? ""));
}
