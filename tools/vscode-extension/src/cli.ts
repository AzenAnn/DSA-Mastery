import { spawn } from "node:child_process";
import { access } from "node:fs/promises";
import path from "node:path";
import * as vscode from "vscode";

/** tools/lab/cli.mjs 当前输出的报告版本。不匹配时提示升级扩展，而不是静默出错。 */
const SUPPORTED_REPORT_VERSION = 1;

/** 判题内核使用的退出码，见 tools/lab/errors.mjs 的 EXIT。 */
export const EXIT = { OK: 0, SCORE_NOT_FULL: 1, TOOL_ERROR: 2 } as const;

export type Verdict = "AC" | "WA" | "TLE" | "RE" | "CE" | "OLE" | "IE";

export interface CaseResult {
  id: string;
  tags: string[];
  verdict: Verdict;
  points: number;
  maxPoints: number;
  durationMs: number;
  stderr: string;
  comparison?: {
    equal: boolean;
    difference?: {
      kind: "token" | "line";
      index?: number;
      line?: number;
      column?: number;
      expected: string;
      actual: string;
    };
  };
}

export interface ScoreResult {
  target: string;
  verdict: Verdict;
  score: number;
  maxScore: number;
  cases: CaseResult[];
  compilation: {
    ok: boolean;
    compiler?: { command: string; family: string };
    durationMs?: number;
    stdout: string;
    stderr: string;
  };
}

export interface DoctorTool {
  name: string;
  command: string;
  available: boolean;
  version?: string;
  minimum?: string;
  meetsMinimum: boolean;
  summary?: string;
}

export interface DoctorResult {
  platform: string;
  architecture: string;
  node: string;
  standard?: string;
  tools: DoctorTool[];
  makeAvailable: boolean;
  ok: boolean;
  issues: string[];
}

interface LabReport<T> {
  reportVersion: number;
  command: string;
  ok: boolean;
  lab?: { path: string; type: string; schemaVersion: number };
  error?: { code: string; message: string; details?: unknown };
  result?: T;
  environment?: DoctorResult;
}

/** CLI 调用失败：既包括工具内部错误，也包括进程本身起不来。 */
export class CliError extends Error {
  constructor(
    message: string,
    readonly code?: string,
    readonly stderr?: string,
  ) {
    super(message);
    this.name = "CliError";
  }
}

async function exists(target: string): Promise<boolean> {
  try {
    await access(target);
    return true;
  } catch {
    return false;
  }
}

/**
 * 解析用于运行判题内核的 Node 可执行文件。
 *
 * tools/lab 零第三方依赖，只需一个 Node 运行时即可判题。优先用用户配置或 PATH 中的
 * node；都不可用时回退到 VSCode 自带的 Electron，通过 ELECTRON_RUN_AS_NODE=1 让它
 * 以纯 Node 模式运行，这样 PATH 里没有 node 的学生同样能提交。
 */
async function resolveNode(): Promise<{ command: string; env?: NodeJS.ProcessEnv }> {
  const configured = vscode.workspace.getConfiguration("dsaMastery").get<string>("nodePath")?.trim();
  if (configured) return { command: configured };

  const probe = await new Promise<boolean>((resolve) => {
    const child = spawn("node", ["--version"], { shell: false });
    child.once("error", () => resolve(false));
    child.once("close", (code) => resolve(code === 0));
  });
  if (probe) return { command: "node" };

  return {
    command: process.execPath,
    env: { ...process.env, ELECTRON_RUN_AS_NODE: "1" },
  };
}

interface RunOutcome<T> {
  report: LabReport<T>;
  exitCode: number;
}

async function runCli<T>(repoRoot: string, args: string[]): Promise<RunOutcome<T>> {
  const cliPath = path.join(repoRoot, "tools", "lab", "cli.mjs");
  if (!(await exists(cliPath))) {
    throw new CliError(`未找到判题内核：${cliPath}。请确认当前工作区是 DSA Mastery 仓库根目录。`);
  }

  const node = await resolveNode();
  const { stdout, stderr, exitCode } = await new Promise<{
    stdout: string;
    stderr: string;
    exitCode: number;
  }>((resolve, reject) => {
    const child = spawn(node.command, [cliPath, ...args, "--json"], {
      cwd: repoRoot,
      shell: false,
      env: node.env ?? process.env,
    });
    let out = "";
    let err = "";
    child.stdout.on("data", (chunk) => {
      out += chunk;
    });
    child.stderr.on("data", (chunk) => {
      err += chunk;
    });
    child.once("error", (error) =>
      reject(new CliError(`无法启动判题进程：${error.message}`, "SPAWN_FAILED")),
    );
    child.once("close", (code) => resolve({ stdout: out, stderr: err, exitCode: code ?? EXIT.TOOL_ERROR }));
  });

  let report: LabReport<T>;
  try {
    report = JSON.parse(stdout) as LabReport<T>;
  } catch {
    // CLI 在 --json 下总应输出 JSON；走到这里说明进程异常退出或输出被污染。
    const detail = (stderr || stdout).trim().slice(0, 800);
    throw new CliError(
      `判题内核没有返回可解析的 JSON（退出码 ${exitCode}）。${detail ? `\n${detail}` : ""}`,
      "REPORT_UNPARSABLE",
      stderr,
    );
  }

  if (report.reportVersion !== SUPPORTED_REPORT_VERSION) {
    throw new CliError(
      `判题内核的报告版本是 ${report.reportVersion}，本扩展支持 ${SUPPORTED_REPORT_VERSION}。请更新扩展后重试。`,
      "REPORT_VERSION_MISMATCH",
    );
  }

  if (report.error) {
    throw new CliError(report.error.message, report.error.code, stderr);
  }

  return { report, exitCode };
}

/**
 * 对一道 program lab 评分。
 *
 * 用 score 而不是 run：两者共用同一套编译、运行与比较内核，但 score 在未满分时
 * 返回退出码 1，让"是否满分"有一个明确信号。WA / CE 等都是正常的判题结果，
 * 不是命令失败，因此这里只把 TOOL_ERROR 当作异常。
 */
export async function scoreLab(repoRoot: string, labRelativePath: string): Promise<ScoreResult> {
  const { report, exitCode } = await runCli<ScoreResult>(repoRoot, ["score", labRelativePath]);
  if (!report.result) {
    throw new CliError(`判题报告缺少 result 字段（退出码 ${exitCode}）。`, "REPORT_INCOMPLETE");
  }
  return report.result;
}

/** 探测本机实验环境。返回 ok: false 时 issues 里是具体缺什么。 */
export async function runDoctor(repoRoot: string, labRelativePath: string): Promise<DoctorResult> {
  const { report } = await runCli<never>(repoRoot, ["doctor", labRelativePath]);
  if (!report.environment) {
    throw new CliError("doctor 报告缺少 environment 字段。", "REPORT_INCOMPLETE");
  }
  return report.environment;
}
