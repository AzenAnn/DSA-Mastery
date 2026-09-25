import type { HostReport, ProfileEvaluation, ToolStatus } from "../checks.ts";
import type { SetupOptions } from "../options.ts";
import type { ProgressUI } from "../ui/progress.ts";
import type { InputStream, OutputStream } from "../ui/terminal.ts";
import type { RepositoryState } from "./repository.ts";
import type { PackageManager } from "./toolchain.ts";
import type { CaptureResult, ProfileName, Runner } from "@dsa/lab-core";
import { access } from "node:fs/promises";
import path from "node:path";
import { inspectHost } from "../checks.ts";
import { commandText } from "../commands.ts";
import { setupError } from "./report.ts";

export interface SetupIo {
  input?: InputStream | undefined;
  output?: OutputStream | undefined;
}

export interface SetupDependencies {
  io?: SetupIo | undefined;
  runner?: Runner | undefined;
  cwd?: string | undefined;
  commandCwd?: string | undefined;
  env?: NodeJS.ProcessEnv | undefined;
  platform?: NodeJS.Platform | undefined;
  architecture?: string | undefined;
  nodeCommand?: string | undefined;
}

interface RecordedCommand {
  command: string;
  args: string[];
  code: number | null;
  stdout: string;
  stderr: string;
  timedOut: boolean;
  outputExceeded: boolean;
}

export interface SetupContext {
  platform: NodeJS.Platform;
  architecture: string;
  env: NodeJS.ProcessEnv;
  runner: Runner;
  repoDir: string;
  commandCwd?: string | undefined;
  options: SetupOptions;
  profile: ProfileName;
  ui: ProgressUI;
  commands: RecordedCommand[];
  host?: HostReport | undefined;
  packageManager?: PackageManager | undefined;
  pnpmCommand?: string | undefined;
  nodeCommand?: string | undefined;
  repository?: RepositoryState | undefined;
  evaluation?: ProfileEvaluation | undefined;
  smoke?: { label: string; report: unknown }[] | undefined;
  ide?: unknown;
  [key: string]: unknown;
}

export interface RunOverrides {
  cwd?: string | undefined;
  env?: NodeJS.ProcessEnv | undefined;
  timeoutMs?: number | undefined;
  timeMs?: number | undefined;
  outputLimitKb?: number | undefined;
  outputKb?: number | undefined;
  inherit?: boolean | undefined;
  errorCode?: string | undefined;
  errorMessage?: string | undefined;
  stage?: string | undefined;
}

export const HOMEBREW_INSTALLER = "https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh";

export async function pathExists(target: string): Promise<boolean> {
  try {
    await access(target);
    return true;
  } catch {
    return false;
  }
}

export function resultOutput(result: Partial<CaptureResult> | undefined): string {
  return `${result?.stdout ?? ""}\n${result?.stderr ?? ""}`.trim();
}

export function resultFailed(result: Partial<CaptureResult> | undefined): boolean {
  return (
    Boolean(result?.spawnError) || result?.code !== 0 || Boolean(result?.timedOut) || Boolean(result?.outputExceeded)
  );
}

export function firstOutputLine(result: Partial<CaptureResult> | undefined): string | undefined {
  return resultOutput(result).split(/\r?\n/).find(Boolean)?.trim();
}

export function prependPath(currentPath: string | undefined, additions: string[], delimiter: string): string {
  const values = [...additions, ...String(currentPath ?? "").split(delimiter)].filter(Boolean);
  return [...new Set(values)].join(delimiter);
}

function hostTool(host: Partial<HostReport> | undefined, name: string): ToolStatus | undefined {
  return host?.tools?.find((tool) => tool.name === name);
}

export function hasTool(host: Partial<HostReport> | undefined, name: string): boolean {
  return Boolean(hostTool(host, name)?.meetsMinimum);
}

export async function runWithRunner(
  context: SetupContext,
  command: string,
  args: string[] = [],
  options: RunOverrides = {},
): Promise<CaptureResult> {
  try {
    return await context.runner(command, args, {
      cwd: options.cwd ?? context.commandCwd ?? context.repoDir,
      env: options.env ?? context.env,
      timeMs: options.timeoutMs ?? options.timeMs ?? 30_000,
      outputKb: options.outputLimitKb ?? options.outputKb ?? 4096,
      inherit: options.inherit ?? false,
    });
  } catch (error) {
    return { code: null, spawnError: error as NodeJS.ErrnoException, stdout: "", stderr: "" } as CaptureResult;
  }
}

export async function commandAvailable(
  context: SetupContext,
  command: string,
  args: string[] = ["--version"],
): Promise<CaptureResult | undefined> {
  const result = await runWithRunner(context, command, args, { timeMs: 5000, outputKb: 256 });
  return !resultFailed(result) ? result : undefined;
}

export async function refreshPlatformEnvironment(context: SetupContext): Promise<NodeJS.ProcessEnv> {
  if (context.platform === "darwin" && context.packageManager?.kind === "brew") {
    const prefixResult = await runWithRunner(context, context.packageManager.command, ["--prefix"], {
      timeMs: 5000,
      outputKb: 256,
    });
    const prefix = firstOutputLine(prefixResult);
    if (prefix !== undefined && prefix !== "") {
      context.env["PATH"] = prependPath(
        context.env["PATH"],
        [path.join(prefix, "bin"), path.join(prefix, "sbin")],
        ":",
      );
    }
  }
  if (context.platform === "win32") {
    const pathResult = await runWithRunner(
      context,
      "powershell.exe",
      [
        "-NoProfile",
        "-NonInteractive",
        "-Command",
        "[Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [Environment]::GetEnvironmentVariable('Path','User')",
      ],
      { timeMs: 10_000, outputKb: 4096 },
    );
    if (!resultFailed(pathResult) && pathResult.stdout?.trim()) context.env["PATH"] = pathResult.stdout.trim();
  }
  return context.env;
}

export async function resolveExecutable(context: SetupContext, command: string): Promise<string> {
  if (path.isAbsolute(command)) return command;
  const resolver = context.platform === "win32" ? "where.exe" : "which";
  const result = await runWithRunner(context, resolver, [command], { timeMs: 5000, outputKb: 256 });
  return firstOutputLine(result) ?? command;
}

export function recordCommand(
  context: SetupContext,
  command: string,
  args: string[],
  result: Partial<CaptureResult> | undefined,
): void {
  context.commands.push({
    command,
    args,
    code: result?.code ?? null,
    stdout: result?.stdout ?? "",
    stderr: result?.stderr ?? "",
    timedOut: Boolean(result?.timedOut),
    outputExceeded: Boolean(result?.outputExceeded),
  });
}

export async function runExternal(
  context: SetupContext,
  command: string,
  args: string[],
  options: RunOverrides = {},
): Promise<CaptureResult> {
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

export async function inspectContextHost(context: SetupContext): Promise<HostReport> {
  context.host = await inspectHost({
    platform: context.platform,
    architecture: context.architecture,
    env: context.env,
    nodeCommand: context.nodeCommand,
    runner: context.runner,
  });
  return context.host;
}
