#!/usr/bin/env node

import type { SetupOptions } from "./options.ts";
import type { SetupContext, SetupDependencies, SetupIo } from "./setup/context.ts";
import type { SetupReport } from "./setup/report.ts";
import type { ProgressUI, Stage, StageStatus } from "./ui/progress.ts";
import type { ProfileName } from "@dsa/lab-core";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";
import { profileRequirements, runProcess } from "@dsa/lab-core";
import { parseSetupArgs } from "./options.ts";
import { inspectContextHost, runExternal } from "./setup/context.ts";
import { installIde } from "./setup/ide.ts";
import {
  normalizeError,
  serializeHost,
  SETUP_EXIT,
  SETUP_STAGES,
  summarizeReport,
  writeFailureLog,
} from "./setup/report.ts";
import { askRepositoryUpdate, ensureRepository, resolveRepositoryDir } from "./setup/repository.ts";
import { runCheckOnly, runSmoke } from "./setup/smoke.ts";
import { detectPackageManager, ensureToolchain } from "./setup/toolchain.ts";
import { choiceSelectionSummary, createInstallSelection, promptInstallSelection } from "./ui/choices.ts";
import { createProgressUI } from "./ui/progress.ts";

async function installDependencies(context: SetupContext): Promise<void> {
  const command = context.pnpmCommand ?? "pnpm";
  await runExternal(context, command, ["install", "--frozen-lockfile"], {
    stage: "dependencies",
    cwd: context.repoDir,
    env: context.env,
    timeMs: 20 * 60_000,
    errorCode: "INSTALLER_FAILED",
    errorMessage: "项目依赖安装失败；请查看日志中的 pnpm install 输出后重试。",
  });
}

async function askInstallChoices(options: SetupOptions, io: SetupIo): Promise<SetupOptions> {
  const interactive =
    !options.checkOnly &&
    !options.nonInteractive &&
    !options.json &&
    options.ui !== "plain" &&
    Boolean(io.input?.isTTY && io.output?.isTTY);
  if (!interactive) return { ...options, profile: options.profile ?? "basic" };
  if (options.profile !== undefined) return { ...options };
  const initialSelection = createInstallSelection({
    program: true,
    project: false,
    vscode: options.installVscode,
    "cpp-extension": options.installCppExtension ?? false,
    "cmake-extension": options.installCmakeExtension ?? false,
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

function createSilentProgressUI(): ProgressUI {
  const stages: Stage[] = SETUP_STAGES.map((id) => ({ id, name: id, status: "pending", message: "" }));

  return {
    mode: "plain",
    stages,
    start() {},
    render: () => "",
    update(id, status, message = "") {
      const stage = stages.find((item) => item.id === id);
      if (!stage) throw new Error(`未知安装阶段：${id}`);
      stage.status = status;
      stage.message = message;

      return stage;
    },
    finish() {},
  };
}

async function executeStage<T>(context: SetupContext, id: string, action: () => Promise<T>): Promise<T> {
  context.currentStage = id;
  context.ui.update(id, "running", "准备中");
  const result = await action();
  const outcome = result as { status?: StageStatus; message?: string } | undefined;
  context.ui.update(id, outcome?.status ?? "success", outcome?.message ?? "完成");

  return result;
}

export interface SetupResult {
  exitCode: number;
  report: SetupReport;
  summary?: string;
  uiMode?: string;
}

export async function runSetup(argv: string[] = [], dependencies: SetupDependencies = {}): Promise<SetupResult> {
  if (process.platform === "win32") {
    try {
      process.stdout.setEncoding("utf8");
    } catch {
      /* non-TTY environments may throw */
    }
    try {
      process.stderr.setEncoding("utf8");
    } catch {
      /* non-TTY environments may throw */
    }
  }
  let options;
  try {
    options = parseSetupArgs(argv);
  } catch (error) {
    const normalized = normalizeError(error);
    return {
      exitCode: normalized.exitCode,
      report: {
        reportVersion: 1,
        command: "setup",
        ok: false,
        error: { code: normalized.code, message: normalized.message },
      },
    };
  }
  if (options.help) {
    return {
      exitCode: SETUP_EXIT.OK,
      report: {
        reportVersion: 1,
        command: "setup",
        ok: true,
        help: "node packages/bootstrap/dist/setup.js [--profile runtime|basic|full] [--check-only] [--repo-dir <path>] [--ui auto|tui|plain]",
      },
    };
  }

  const io = dependencies.io ?? { input: process.stdin, output: process.stdout };
  options = await askInstallChoices(options, io);
  if (options.cancelled === true) {
    const report = {
      reportVersion: 1,
      command: "setup",
      ok: false,
      cancelled: true,
      message: "已取消安装",
    };
    return { exitCode: SETUP_EXIT.OK, report, summary: "\nDSA Mastery 环境配置：已取消" };
  }
  const profile = profileRequirements(options.profile ?? "basic").name as ProfileName;
  const runner = dependencies.runner ?? runProcess;
  options = await askRepositoryUpdate(options, {
    io,
    cwd: dependencies.cwd ?? process.cwd(),
    runner,
    env: dependencies.env ?? process.env,
  });
  const context: SetupContext = {
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
    ui: createSilentProgressUI(),
  };
  context.packageManager = await detectPackageManager(context);
  context.ui = options.json
    ? createSilentProgressUI()
    : createProgressUI({
        mode: options.ui,
        stdout: io.output,
        title: "DSA Mastery 环境配置",
        profile,
        stageNames: SETUP_STAGES,
        nonInteractive: options.nonInteractive,
      });
  const report: SetupReport = {
    reportVersion: 1,
    command: "setup",
    ok: false,
    profile,
    platform: context.platform,
    architecture: context.architecture,
    repoDir: context.repoDir,
    selection: options.selection,
    selectionLabels: options.selection === undefined ? undefined : choiceSelectionSummary(options.selection),
    stages: SETUP_STAGES.map((id) => ({ id, status: "pending", message: "" })),
  };
  let summary = "";
  try {
    context.ui.start();
    await executeStage(context, "preflight", async () => {
      await inspectContextHost(context);
      const compilerMessage =
        profile === "runtime" ? "未选择 C++ 编译器" : `编译器${context.host!.compilerReady ? "可用" : "缺失"}`;
      return {
        message: `Node ${context.host!.tools.find((tool) => tool.name === "Node.js")?.version ?? "unknown"} · ${compilerMessage}`,
      };
    });
    if (options.checkOnly) {
      await executeStage(context, "toolchain", async () => {
        await runCheckOnly(context);
        return { message: "只读检查通过" };
      });
      await executeStage(context, "repository", async () => ({
        status: context.repository?.valid ? "success" : "warning",
        message: context.repository?.valid ? "仓库有效" : "仓库缺失",
      }));
      context.ui.update("dependencies", "skipped", "check-only 不安装依赖");
      context.ui.update("ide", "skipped", "check-only 不安装 IDE");
      context.ui.update("smoke", "skipped", "check-only 不运行 smoke");
    } else {
      await executeStage(context, "toolchain", async () => {
        await ensureToolchain(context);
        return {
          message:
            profile === "runtime" ? "Node/pnpm 已就绪" : `Node/pnpm/编译器${profile === "full" ? "/CMake" : ""} 已就绪`,
        };
      });
      await executeStage(context, "repository", async () => {
        const repository = await ensureRepository(context);
        return { message: context.options.updateRepo ? "仓库已检查并更新" : "仓库已复用或准备", repository };
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
          return {
            message: profile === "full" ? "Program + Project reference 验证通过" : "Program reference 验证通过",
          };
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
      nextAction: (error.details as { restartRequired?: boolean } | undefined)?.restartRequired
        ? "完成系统安装/重启终端后重新运行同一命令。"
        : error.code === "REPOSITORY_DIRTY"
          ? "先提交或暂存改动，再显式使用 --update-repo。"
          : error.code === "SETUP_UNSUPPORTED"
            ? "改用对应平台的手工安装指南，再重新运行 --check-only。"
            : "根据失败阶段和日志中的完整命令输出修复后重新运行。",
    };
    context.ui.update(String(context.currentStage ?? "preflight"), "failed", error.message);
    report.exitCode = error.exitCode;
  } finally {
    for (const stage of report.stages!) {
      const current = context.ui.stages?.find((item) => item.id === stage.id);
      if (current) {
        stage.status = current.status;
        stage.message = current.message;
      }
    }
    report.repository = context.repository
      ? {
          path: context.repository.path,
          valid: context.repository.valid,
          dirty: context.repository.dirty,
          remote: context.repository.remote,
        }
      : undefined;
    report.host = serializeHost(context.host);
    report.evaluation = context.evaluation;
    report.smoke = context.smoke?.map((item) => ({ label: item.label, ok: (item.report as { ok?: boolean }).ok }));
    if (!report.ok && !options.checkOnly) {
      try {
        report.logPath = await writeFailureLog(context, report);
      } catch (error) {
        report.logError = (error as Error).message;
      }
    }
    summary = summarizeReport(report);
    context.ui.finish({ ok: report.ok, summary });
  }
  report.exitCode ??= report.ok ? SETUP_EXIT.OK : SETUP_EXIT.INSTALLER;
  return { exitCode: report.exitCode, report, summary, uiMode: context.ui.mode };
}

function printSuccessBanner() {
  const reset = "\x1B[0m";
  const bold = "\x1B[1m";
  // Gradient: blue -> cyan -> green
  const colors = ["\x1B[38;5;27m", "\x1B[38;5;33m", "\x1B[38;5;39m", "\x1B[38;5;42m", "\x1B[38;5;46m"];
  const lines = [
    "  ____  ____   _    __  __           __  __           _             ",
    " |  _ \\/ ___| / \\  |  \\/  |         |  \\/  | __ _ ___| |_ ___ _ __  ",
    " | | | \\___ \\/ _ \\ | |\\/| |  _____  | |\\/| |/ _` / __| __/ _ \\ '__| ",
    " | |_| |___) / ___ \\| |  | | |_____| | |  | | (_| \\__ \\ ||  __/ |    ",
    " |____/|____/_/   \\_\\_|  |_|         |_|  |_|\\__,_|___/\\__\\___|_|    ",
  ];
  let output = "\n";
  lines.forEach((line, i) => {
    output += `${colors[i % colors.length] + bold + line + reset}\n`;
  });
  output += "\n";
  return output;
}

async function main() {
  const result = await runSetup(process.argv.slice(2));
  if (result.report.help !== undefined) console.log(result.report.help);
  else if (result.report.command === "setup" && result.report.error === undefined && process.argv.includes("--json"))
    console.log(JSON.stringify(result.report, null, 2));
  else if (process.argv.includes("--json")) console.log(JSON.stringify(result.report, null, 2));
  else if (result.summary !== undefined && result.uiMode !== "tui") console.log(result.summary);
  if (result.report.ok && !process.argv.includes("--json") && result.uiMode !== "tui") {
    process.stdout.write(printSuccessBanner());
  }
  process.exitCode = result.exitCode;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) await main();
