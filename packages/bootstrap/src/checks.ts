import type { Runner, Version } from "@dsa/lab-core";
import type { MsvcEnvironment } from "@dsa/lab-runner";
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import {
  compareVersion,
  findRepoRoot,
  formatVersion,
  MINIMUMS,
  parseVersion,
  profileRequirements,
  runProcess,
} from "@dsa/lab-core";
import { createMsvcEnvironment, findVisualStudioInstallation } from "@dsa/lab-runner";

/**
 * 学生要装的 pnpm 直接取自仓库的 packageManager —— 再抄一份常量必然会漂移。
 * setup.js 总是在克隆好的仓库里运行（见 scripts/bootstrap-*.sh），这个文件一定读得到。
 */
async function readPnpmVersion(): Promise<string> {
  const root = await findRepoRoot(import.meta.dirname);
  if (root === undefined) throw new Error("找不到仓库根目录，无法确定要安装的 pnpm 版本。");
  const manifest = JSON.parse(await readFile(path.join(root, "package.json"), "utf8")) as {
    packageManager?: string;
  };
  const version = manifest.packageManager?.match(/^pnpm@([^+]+)/u)?.[1];
  if (version === undefined) {
    throw new Error(`package.json 的 packageManager 不是 pnpm@<版本>：${manifest.packageManager}`);
  }

  return version;
}

export const PNPM_VERSION = await readPnpmVersion();

export interface ToolStatus {
  name: string;
  command: string;
  available: boolean;
  version: string;
  minimum: string;
  meetsMinimum: boolean;
  summary?: string;
  error?: string;
}

export interface ProfileEvaluation {
  profile: string;
  ok: boolean;
  issues: string[];
  compilerReady: boolean;
  cmakeReady: boolean;
}

export interface HostReport {
  platform: NodeJS.Platform;
  architecture: string;
  tools: ToolStatus[];
  compilerReady: boolean;
  cmakeReady: boolean;
  runtimeReady: boolean;
  msvc: {
    initialized: boolean;
    installationPath?: string;
    developerCommand?: string;
    environment?: NodeJS.ProcessEnv;
    error?: string;
    fallbackDetected: boolean;
  };
}

export function parseCommandVersion(output: string): string {
  return formatVersion(parseVersion(output));
}

function hasTool(tools: ToolStatus[], names: string[]): boolean {
  return tools.some((tool) => names.includes(tool.name) && tool.available && tool.meetsMinimum);
}

export function evaluateProfile(profile: string, tools: ToolStatus[] = []): ProfileEvaluation {
  const requirement = profileRequirements(profile);
  const issues: string[] = [];
  const git = tools.find((tool) => tool.name === "Git");
  const node = tools.find((tool) => tool.name === "Node.js");
  const pnpm = tools.find((tool) => tool.name === "pnpm");
  if (!git?.available || !git.meetsMinimum) issues.push("Git");
  if (!node?.available || !node.meetsMinimum) issues.push(`Node.js >= ${formatVersion(MINIMUMS.node)}`);
  if (!pnpm?.available || !pnpm.meetsMinimum || pnpm.version !== PNPM_VERSION) issues.push(`pnpm ${PNPM_VERSION}`);
  const compilerReady = hasTool(tools, ["GCC", "Clang", "Clang (g++ driver)", "MSVC"]);
  if (requirement.requiresCompiler && !compilerReady) issues.push("GCC >= 11、Clang >= 14 或 MSVC >= 19.30 之一");
  const cmake = tools.find((tool) => tool.name === "CMake");
  const cmakeReady = Boolean(cmake?.available && cmake.meetsMinimum);
  if (requirement.requiresCmake && !cmakeReady) issues.push(`CMake >= ${formatVersion(MINIMUMS.cmake)}`);

  return { profile, ok: issues.length === 0, issues, compilerReady, cmakeReady };
}

interface ProbeOptions {
  env?: NodeJS.ProcessEnv;
  cwd?: string;
  runner?: Runner;
  timeMs?: number;
  pattern?: RegExp;
  allowNonzero?: boolean;
  exactVersion?: string;
}

async function probeTool(
  name: string,
  command: string,
  args: string[],
  minimum: Version,
  options: ProbeOptions = {},
): Promise<ToolStatus> {
  const result = await (options.runner ?? runProcess)(command, args, {
    env: options.env,
    cwd: options.cwd,
    timeMs: options.timeMs ?? 5000,
    outputKb: 256,
  });
  const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`.trim();
  const version = parseVersion(output, options.pattern);
  const available = !result.spawnError && (result.code === 0 || Boolean(options.allowNonzero));

  return {
    name,
    command,
    available,
    version: formatVersion(version),
    minimum: formatVersion(minimum),
    meetsMinimum:
      available &&
      (options.exactVersion === undefined
        ? compareVersion(version, minimum)
        : formatVersion(version) === options.exactVersion),
    summary: output
      .split(/\r?\n/)
      .find((line) => line !== "")
      ?.trim(),
    error: result.spawnError?.code ?? result.spawnError?.message,
  };
}

export interface InspectHostOptions {
  platform?: NodeJS.Platform;
  architecture?: string;
  env?: NodeJS.ProcessEnv;
  runner?: Runner;
  nodeCommand?: string;
}

export async function inspectHost({
  platform = process.platform,
  architecture = process.arch,
  env = process.env,
  runner = runProcess,
  nodeCommand = process.execPath,
}: InspectHostOptions = {}): Promise<HostReport> {
  let msvcEnvironment: MsvcEnvironment | undefined;
  let msvcError: Error | undefined;
  let msvcFallbackPath: string | undefined;
  if (platform === "win32") {
    try {
      msvcEnvironment = await createMsvcEnvironment({ platform, env, runner });
    } catch (error) {
      msvcError = error as Error;
      // VsDevCmd 初始化失败时直接探测 vswhere，至少能告诉学生 VS 装在哪。
      const found = await findVisualStudioInstallation({ platform, env, runner }).catch(() => undefined);
      msvcFallbackPath = found?.installationPath;
    }
  }
  const tools = await Promise.all([
    probeTool("Git", "git", ["--version"], [0, 0, 0], { env, runner }),
    probeTool("Node.js", nodeCommand, ["--version"], MINIMUMS.node, { env, runner }),
    probeTool("pnpm", "pnpm", ["--version"], parseVersion(PNPM_VERSION)!, { env, runner, exactVersion: PNPM_VERSION }),
    probeTool("GCC", "g++", ["--version"], MINIMUMS.gcc, { env, runner }),
    probeTool("Clang", "clang++", ["--version"], MINIMUMS.clang, { env, runner }),
    probeTool("MSVC", "cl", [], MINIMUMS.msvc, {
      env: msvcEnvironment?.env,
      runner,
      pattern: /Version\s+(\d+)\.(\d+)(?:\.(\d+))?/i,
      allowNonzero: true,
    }),
    probeTool("CMake", "cmake", ["--version"], MINIMUMS.cmake, { env, runner }),
    probeTool("GNU Make", "make", ["--version"], MINIMUMS.make, { env, runner }),
  ]);
  const node = tools.find((tool) => tool.name === "Node.js");
  const pnpm = tools.find((tool) => tool.name === "pnpm");
  const cmake = tools.find((tool) => tool.name === "CMake");

  return {
    platform,
    architecture,
    tools,
    compilerReady: tools.some((tool) => ["GCC", "Clang", "MSVC"].includes(tool.name) && tool.meetsMinimum),
    cmakeReady: Boolean(cmake?.meetsMinimum),
    runtimeReady: Boolean(node?.meetsMinimum && pnpm?.meetsMinimum),
    msvc: {
      initialized: Boolean(msvcEnvironment),
      installationPath: msvcEnvironment?.installationPath ?? msvcFallbackPath,
      developerCommand: msvcEnvironment?.developerCommand,
      environment: msvcEnvironment?.env,
      error: msvcError?.message,
      fallbackDetected: Boolean(msvcFallbackPath),
    },
  };
}
