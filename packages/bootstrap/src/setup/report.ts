import type { HostReport } from "../checks.ts";
import type { SetupContext } from "./context.ts";
import type { ProfileName } from "@dsa/lab-core";
import { mkdir, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { commandText } from "../commands.ts";

interface ReportStage {
  id: string;
  status: string;
  message: string;
}

export interface SetupReport {
  reportVersion: number;
  command: string;
  ok: boolean;
  cancelled?: boolean;
  message?: string;
  help?: string;
  profile?: ProfileName;
  platform?: NodeJS.Platform;
  architecture?: string;
  repoDir?: string;
  selection?: string[];
  selectionLabels?: string[];
  stages?: ReportStage[];
  repository?: { path: string; valid: boolean; dirty: boolean; remote?: string };
  host?: unknown;
  evaluation?: unknown;
  smoke?: { label: string; ok?: boolean }[];
  logPath?: string;
  logError?: string;
  exitCode?: number;
  error?: { code?: string; message?: string; details?: unknown; nextAction?: string };
}

export const SETUP_EXIT = {
  OK: 0,
  UNSUPPORTED: 10,
  INSTALLER: 11,
  USER_ACTION: 12,
  REPOSITORY: 13,
  ENVIRONMENT: 14,
  SMOKE: 15,
  ARGUMENT: 2,
} as const;

export const SETUP_STAGES = ["preflight", "toolchain", "repository", "dependencies", "ide", "smoke"] as const;

export class SetupError extends Error {
  readonly code: string;
  readonly details: unknown;
  readonly exitCode: number;

  constructor(code: string, message: string, details?: unknown, exitCode?: number) {
    super(message);
    this.name = "SetupError";
    this.code = code;
    this.details = details;
    this.exitCode = exitCode ?? exitCodeFor(code);
  }
}

function exitCodeFor(code: string): number {
  return (
    {
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
    }[code] ?? SETUP_EXIT.INSTALLER
  );
}

export function setupError(code: string, message: string, details?: unknown): SetupError {
  return new SetupError(code, message, details);
}

export function serializeHost(host: HostReport | undefined) {
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

export function summarizeReport(report: SetupReport): string {
  const lines = [
    "",
    `DSA Mastery 环境配置：${report.ok ? "成功" : "未完成"}`,
    `Profile：${report.profile} · 平台：${report.platform}/${report.architecture}`,
  ];
  if (report.selectionLabels !== undefined && report.selectionLabels.length > 0)
    lines.push(`已选择：${report.selectionLabels.join("、")}`);
  for (const stage of report.stages ?? []) {
    lines.push(
      `${stage.status === "success" ? "✓" : stage.status === "warning" ? "⚠" : stage.status === "skipped" ? "–" : stage.status === "failed" ? "✗" : "·"} ${stage.id}：${stage.message ?? ""}`,
    );
  }
  if (report.repository !== undefined) lines.push(`仓库：${report.repository.path}`);
  if (report.logPath !== undefined) lines.push(`日志：${report.logPath}`);
  if (report.error?.nextAction !== undefined) lines.push(`下一步：${report.error.nextAction}`);
  return lines.join("\n");
}

export async function writeFailureLog(context: SetupContext, report: SetupReport): Promise<string | undefined> {
  if (context.options.checkOnly) return undefined;
  const home = context.env.HOME ?? context.env.USERPROFILE ?? os.homedir();
  const directory =
    context.platform === "darwin"
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

export function normalizeError(rawError: unknown): SetupError {
  if (rawError instanceof SetupError) return rawError;
  const error = rawError as { code?: string; message?: string; stack?: string } | undefined;
  const code = error?.code === "ARGUMENT_INVALID" ? "ARGUMENT_INVALID" : "INSTALLER_FAILED";

  return setupError(code, error?.message ?? String(rawError), { cause: error?.stack });
}
