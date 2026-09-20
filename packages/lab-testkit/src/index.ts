import type {
  CaptureResult,
  ExecutableLab,
  LoadedProgramLab,
  LoadedProjectLab,
  LoadedQuizLab,
  RunOptions,
  Runner,
} from "@dsa/lab-core";
import { cp, mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { isProgramLab, isProjectLab, isQuizLab, loadLab } from "@dsa/lab-core";

export const REPO_ROOT = path.resolve(fileURLToPath(new URL(".", import.meta.url)), "../../..");
export const LAB_CLI = path.join(REPO_ROOT, "packages", "lab-cli", "dist", "cli.js");

/** GNU make 的 include 无法表达含空格的路径，物化前先确认仓库路径安全。 */
const MAKE_SAFE_PATH = /^\S+$/;

export interface MaterializedLab {
  root: string;
  parent: string;
  cleanup: () => Promise<void>;
}

/**
 * 把仓库里的 Lab 复制到临时目录再跑判题。
 *
 * `.lab-cache` 被烤进 CMakePresets，编译产物、学生包和 PID 锁都以 Lab 根为基准，
 * 所以并行安全的唯一办法是换一个 Lab 根，而不是重定向缓存目录。
 *
 * 副本保持 `labs/chapter-NN/<category>/<lab>` 的原始深度，并在临时根补上两个转发文件，
 * 这样 Lab 自己那份逐字节校验的薄 Makefile 不用改写也能跑通 make。
 */
export async function materializeLab(repoRelativeLab: string): Promise<MaterializedLab> {
  if (!MAKE_SAFE_PATH.test(REPO_ROOT)) {
    throw new Error(`仓库路径含空白字符，GNU make 的 include 无法寻址：${REPO_ROOT}`);
  }
  const parent = await mkdtemp(path.join(tmpdir(), "dsa-lab-"));
  const root = path.join(parent, repoRelativeLab);
  await cp(path.join(REPO_ROOT, repoRelativeLab), root, {
    recursive: true,
    // 不继承开发机上的陈旧缓存，否则判题会拿到别的编译产物。
    filter: (source) => !source.split(path.sep).includes(".lab-cache"),
  });

  await cp(path.join(REPO_ROOT, "schemas"), path.join(parent, "schemas"), { recursive: true });
  const toolDir = path.join(parent, "packages", "lab-cli");
  await mkdir(path.join(toolDir, "dist"), { recursive: true });
  await writeFile(path.join(toolDir, "lab.mk"), `include ${REPO_ROOT}/packages/lab-cli/lab.mk\n`, "utf8");
  await writeFile(path.join(toolDir, "dist", "cli.js"), `import "${LAB_CLI}";\n`, "utf8");

  return { root, parent, cleanup: () => rm(parent, { recursive: true, force: true }) };
}

/** `--json` 报告的松散形状：测试只断言其中一部分字段，不把 CLI 的完整契约复制一遍。 */
export interface CliCaseReport {
  id: string;
  verdict: string;
  points: number;
  maxPoints: number;
}

export interface CliTaskReport {
  id: string;
  status?: string;
  build?: { ok: boolean };
}

export interface CliReport {
  ok: boolean;
  lab: { id?: string; path: string; type: string; schemaVersion: number };
  result: {
    verdict?: string;
    score?: number;
    maxScore?: number;
    cases?: CliCaseReport[];
    tasks?: CliTaskReport[];
    automatedScore?: number;
    automatedMax?: number;
    automatedFull?: boolean;
    manualPending?: number;
    compilation?: { ok: boolean };
  };
  package?: { packageRoot: string };
  refresh?: { changed: number };
  quizResult?: { count: number; totalPoints: number };
}

export interface CliRun {
  code: number;
  stdout: string;
  stderr: string;
}

/** 跑打包后的 CLI；测试要验证的是学生实际执行的那个产物。 */
export async function runLabCli(
  args: string[],
  options: { cwd?: string; env?: NodeJS.ProcessEnv } = {},
): Promise<CliRun> {
  const { spawn } = await import("node:child_process");

  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [LAB_CLI, ...args], {
      cwd: options.cwd ?? REPO_ROOT,
      env: { ...process.env, ...options.env },
      shell: false,
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => (stdout += chunk));
    child.stderr.on("data", (chunk) => (stderr += chunk));
    child.once("error", reject);
    child.once("close", (code) => resolve({ code: code ?? 1, stdout, stderr }));
  });
}

export async function runLabCliJson<T = Record<string, unknown>>(
  args: string[],
  options: { cwd?: string; env?: NodeJS.ProcessEnv } = {},
): Promise<{ report: T } & CliRun> {
  const result = await runLabCli([...args, "--json", "--no-color"], options);
  try {
    return { ...result, report: JSON.parse(result.stdout) as T };
  } catch {
    throw new Error(`CLI 未返回 JSON 报告：\n${result.stdout}\n${result.stderr}`);
  }
}

/** 判题接口按 Lab 类型收窄，测试用这三个加载器省掉每个调用点一次守卫。 */
export async function loadQuizLab(labRoot: string): Promise<LoadedQuizLab> {
  const lab = await loadLab(labRoot);
  if (!isQuizLab(lab)) throw new Error(`${labRoot} 不是 quiz 类型的 Lab`);

  return lab;
}

export async function loadProgramLab(labRoot: string): Promise<LoadedProgramLab> {
  const lab = await loadLab(labRoot);
  if (!isProgramLab(lab)) throw new Error(`${labRoot} 不是 program 类型的 Lab`);

  return lab;
}

export async function loadProjectLab(labRoot: string): Promise<LoadedProjectLab> {
  const lab = await loadLab(labRoot);
  if (!isProjectLab(lab)) throw new Error(`${labRoot} 不是 project 类型的 Lab`);

  return lab;
}

export async function loadExecutableLab(labRoot: string): Promise<ExecutableLab> {
  const lab = await loadLab(labRoot);
  if (!isProgramLab(lab) && !isProjectLab(lab)) throw new Error(`${labRoot} 不是可执行类型的 Lab`);

  return lab;
}

/** 进程替身只关心 code/stdout/stderr，其余字段补成 runProcess 的默认值。 */
export function capture(result: Partial<CaptureResult> = {}): CaptureResult {
  return {
    code: 0,
    signal: null,
    durationMs: 0,
    timedOut: false,
    outputExceeded: false,
    stdout: "",
    stderr: "",
    stdoutBytes: 0,
    stderrBytes: 0,
    ...result,
  };
}

/** spawn 失败的替身：判题内核只读 code，但类型上它就是一个 Error。 */
export function spawnFailure(code: string): NodeJS.ErrnoException {
  return Object.assign(new Error(code), { code });
}

export function stubRunner(
  probe: (
    command: string,
    args: string[],
    options?: RunOptions,
  ) => Partial<CaptureResult> | Promise<Partial<CaptureResult>>,
): Runner {
  return async (command, args, options) => capture(await probe(command, args, options));
}
