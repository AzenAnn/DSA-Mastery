import { copyFile, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import * as vscode from "vscode";
import type { CaseResult, ScoreResult, Verdict } from "./cli";
import { studentSourcePath, type ProgramLab } from "./labIndex";
import type { QuizQuestion } from "./quiz";
import { backfillEvents } from "./stats";

const STATE_KEY = "dsaMastery.progress.v1";
const SCHEMA_VERSION = 2;

/**
 * 活动日志上限。每条约 100 字节,20000 条约 2MB —— globalState 启动时整份读入内存,
 * 所以要有上限;但这个数远大于 historyLimit,正常使用不会触及。
 */
const EVENT_LIMIT = 20000;

/**
 * 一次活动记录。heatmap 和历史趋势的唯一数据源。
 *
 * 为什么不复用 history:history 有 historyLimit(默认 50)上限,pruneHistory 会把
 * 超出的旧记录连快照一起删,提交越多丢的日期越多 —— 拿它画 heatmap 会缺格子,
 * 而且缺得看不出来。选择题更没有 history,只有一个会被覆盖的 answeredAt。
 *
 * submit 和 pass 分开记两条:两个 heatmap 面板要各自独立计数,不靠推断。
 */
export interface ActivityEvent {
  /** ISO 时间戳。分桶到某一天时必须按本地时区算,不能截 ISO 字符串前 10 位。 */
  at: string;
  kind: "submit" | "pass";
  labName: string;
  labType: "program" | "quiz";
}

export interface SubmissionCase {
  id: string;
  verdict: Verdict;
  points: number;
  maxPoints: number;
  durationMs: number;
}

export interface HistoryEntry {
  /** 快照目录名，形如 20260828-111530-a1b2。 */
  id: string;
  at: string;
  verdict: Verdict;
  score: number;
  maxScore: number;
  /** 相对 globalStorage 的源码快照路径。 */
  snapshot: string;
}

export interface LabProgress {
  /** 一旦为 true 永不回退 —— 通过一次即永久绿勾。 */
  passed: boolean;
  firstPassedAt?: string;
  bestScore: number;
  maxScore: number;
  submissionCount: number;
  /** 最近一次提交，可能低于最好成绩；仅用于展示，不影响 passed。 */
  lastSubmission?: {
    at: string;
    verdict: Verdict;
    score: number;
    maxScore: number;
    cases: SubmissionCase[];
  };
  history: HistoryEntry[];
}

export interface QuizAnswerState {
  selected: number;
  correct: boolean;
  attempts: number;
  answeredAt: string;
}

export interface QuizProgress {
  passed: boolean;
  bestScore: number;
  maxScore: number;
  answers: Record<string, QuizAnswerState>;
}

interface ProgressStore {
  schemaVersion: number;
  labs: Record<string, LabProgress>;
  quizzes: Record<string, QuizProgress>;
  /** 追加型活动日志,按时间升序。只增不改,唯一的裁剪是超过 EVENT_LIMIT 时丢最老的。 */
  events: ActivityEvent[];
}

function emptyStore(): ProgressStore {
  return { schemaVersion: SCHEMA_VERSION, labs: {}, quizzes: {}, events: [] };
}

/**
 * v1 → v2:保留 labs/quizzes,用现存的代码题 history 回填 events。
 *
 * 能回填多少取决于 history 还剩多少 —— pruneHistory 删掉的旧记录无法恢复,
 * 所以 heatmap 早期可能偏少。选择题完全无法回填:只有一个会被覆盖的 answeredAt,
 * 重答一次就丢了上一次的时间,回填出来的数只会误导人,不如从这次更新开始重新记。
 */
function migrateV1ToV2(raw: ProgressStore): ProgressStore {
  const labs = raw.labs ?? {};
  // 回填逻辑在 stats.ts 里 —— 那边没有 vscode 依赖,能跑单测。
  const events = backfillEvents(labs);

  return {
    schemaVersion: SCHEMA_VERSION,
    labs,
    quizzes: raw.quizzes ?? {},
    events: events.slice(-EVENT_LIMIT),
  };
}

function snapshotId(when: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  const stamp =
    `${when.getFullYear()}${pad(when.getMonth() + 1)}${pad(when.getDate())}` +
    `-${pad(when.getHours())}${pad(when.getMinutes())}${pad(when.getSeconds())}`;
  const random = Math.random().toString(36).slice(2, 6);
  return `${stamp}-${random}`;
}

/**
 * 做题进度。
 *
 * 轻量索引存 globalState，源码快照存 globalStorageUri 下的文件 —— globalState 在
 * VSCode 启动时会整份读入内存，不适合堆放源码。两者都位于用户数据目录，不进仓库，
 * 也不会被 lab:clean 删除（后者只清理各 lab 的 .lab-cache/）。
 */
export class ProgressTracker {
  private store: ProgressStore;

  constructor(private readonly context: vscode.ExtensionContext) {
    this.store = this.load();
  }

  private load(): ProgressStore {
    const raw = this.context.globalState.get<ProgressStore>(STATE_KEY);
    if (!raw || typeof raw !== "object") return emptyStore();

    if (raw.schemaVersion === SCHEMA_VERSION) {
      return {
        schemaVersion: raw.schemaVersion,
        labs: raw.labs ?? {},
        quizzes: raw.quizzes ?? {},
        events: raw.events ?? [],
      };
    }

    // v1 → v2:只是多了 events 字段,labs/quizzes 结构没变,所以必须保留式迁移。
    // 这里如果走重置,用户积累的全部进度显示会瞬间清空 —— 迁移前先备份一份,
    // 因为进度是唯一副本,迁移逻辑万一有 bug 就不可恢复。
    if (raw.schemaVersion === 1) {
      void this.context.globalState.update(`${STATE_KEY}.backup.v1.${Date.now()}`, raw);
      return migrateV1ToV2(raw);
    }

    // 未知版本:结构不可知,保守重置,但留下原始数据。
    void this.context.globalState.update(`${STATE_KEY}.backup.${Date.now()}`, raw);
    return emptyStore();
  }

  private async persist(): Promise<void> {
    await this.context.globalState.update(STATE_KEY, this.store);
  }

  /**
   * 追加一条活动记录。不落盘 —— 调用方随后一定会 persist()。
   *
   * 超上限时丢最老的:heatmap 只看最近一年,丢掉一年前的记录不影响显示,
   * 而无上限增长会让 globalState 越来越大(启动时整份读入内存)。
   */
  private appendEvent(event: ActivityEvent): void {
    this.store.events.push(event);
    if (this.store.events.length > EVENT_LIMIT) {
      this.store.events = this.store.events.slice(-EVENT_LIMIT);
    }
  }

  /** 活动日志,按时间升序。统计面板的数据源。 */
  events(): readonly ActivityEvent[] {
    return this.store.events;
  }

  private submissionsRoot(): string {
    return path.join(this.context.globalStorageUri.fsPath, "submissions");
  }

  get(labName: string): LabProgress | undefined {
    return this.store.labs[labName];
  }

  getQuiz(labName: string): QuizProgress | undefined {
    return this.store.quizzes[labName];
  }

  async recordQuizAnswer(
    labName: string,
    questions: QuizQuestion[],
    questionId: string,
    selected: number,
  ): Promise<QuizProgress> {
    const question = questions.find((item) => item.id === questionId);
    if (!question) throw new Error(`找不到选择题：${questionId}`);
    const existing = this.store.quizzes[labName] ?? {
      passed: false,
      bestScore: 0,
      maxScore: questions.reduce((total, item) => total + item.points, 0),
      answers: {},
    };
    const previous = existing.answers[questionId];
    existing.answers[questionId] = {
      selected,
      correct: selected === question.answer,
      attempts: (previous?.attempts ?? 0) + 1,
      answeredAt: new Date().toISOString(),
    };
    existing.maxScore = questions.reduce((total, item) => total + item.points, 0);
    existing.bestScore = questions.reduce(
      (total, item) => total + (existing.answers[item.id]?.correct ? item.points : 0),
      0,
    );

    const wasPassed = existing.passed;
    if (questions.length > 0 && questions.every((item) => existing.answers[item.id]?.correct)) {
      existing.passed = true;
    }

    // 每答一小题记一条 submit —— 选择题没有「整题提交」动作,作答就是提交。
    // pass 只在 false → true 那一刻记一条,否则之后每答一题都会重复记 pass。
    const at = new Date().toISOString();
    this.appendEvent({ at, kind: "submit", labName, labType: "quiz" });
    if (!wasPassed && existing.passed) {
      this.appendEvent({ at, kind: "pass", labName, labType: "quiz" });
    }

    this.store.quizzes[labName] = existing;
    await this.persist();
    return existing;
  }

  /**
   * 章节头部显示的「已通过/总数」。
   *
   * 必须收 lab 对象而不是名字 —— 代码题和选择题的进度存在两张表里,
   * 只有 `type` 能决定去哪张表查。收名字的版本会把选择题全算成未通过。
   */
  countPassed(labs: ProgramLab[]): number {
    return labs.filter((lab) =>
      lab.type === "quiz" ? this.store.quizzes[lab.name]?.passed : this.store.labs[lab.name]?.passed,
    ).length;
  }

  /**
   * 记录一次提交：保存源码快照、追加历史、更新最好成绩。
   *
   * 只在用户点击提交时调用 —— 编辑器里改代码不会触发任何状态更新。
   * passed 一旦置位就不再回退，即使本次提交分数更低。
   */
  async recordSubmission(lab: ProgramLab, result: ScoreResult): Promise<LabProgress> {
    const now = new Date();
    const id = snapshotId(now);
    const at = now.toISOString();

    const existing = this.store.labs[lab.name];
    const progress: LabProgress = existing ?? {
      passed: false,
      bestScore: 0,
      maxScore: result.maxScore,
      submissionCount: 0,
      history: [],
    };

    const snapshotRelative = await this.saveSnapshot(lab, id);

    progress.submissionCount += 1;
    progress.maxScore = result.maxScore || progress.maxScore;
    progress.bestScore = Math.max(progress.bestScore, result.score);
    progress.lastSubmission = {
      at,
      verdict: result.verdict,
      score: result.score,
      maxScore: result.maxScore,
      cases: result.cases.map(toSubmissionCase),
    };

    // 满分即通过。CE 时 cases 为空、score 为 0，不会误判为通过。
    const fullScore = result.maxScore > 0 && result.score === result.maxScore;
    if (fullScore && !progress.passed) {
      progress.passed = true;
      progress.firstPassedAt = at;
    }

    // 活动日志:每次提交都记 submit;本次满分就再记一条 pass。
    // 两条共用同一个 at,所以在 heatmap 上必然落进同一格。
    // 这里记的是「本次通过」而非「首次通过」—— 重复通过也该在 heatmap 上留痕,
    // 否则复习性质的重做会显示成没做。
    this.appendEvent({ at, kind: "submit", labName: lab.name, labType: "program" });
    if (fullScore) {
      this.appendEvent({ at, kind: "pass", labName: lab.name, labType: "program" });
    }

    progress.history.unshift({
      id,
      at,
      verdict: result.verdict,
      score: result.score,
      maxScore: result.maxScore,
      snapshot: snapshotRelative,
    });

    this.store.labs[lab.name] = progress;
    await this.pruneHistory(lab.name, progress);
    await this.persist();
    return progress;
  }

  /** 把当前 student 源码复制到快照目录，返回相对 globalStorage 的路径。 */
  private async saveSnapshot(lab: ProgramLab, id: string): Promise<string> {
    const relativeDir = path.join("submissions", lab.name, id);
    const absoluteDir = path.join(this.context.globalStorageUri.fsPath, relativeDir);
    await mkdir(absoluteDir, { recursive: true });

    const source = studentSourcePath(lab);
    const fileName = path.basename(source);
    await copyFile(source, path.join(absoluteDir, fileName));
    return path.join(relativeDir, fileName);
  }

  /** 超出 historyLimit 的旧快照连同其目录一起删除。 */
  private async pruneHistory(labName: string, progress: LabProgress): Promise<void> {
    const limit = vscode.workspace.getConfiguration("dsaMastery").get<number>("historyLimit") ?? 50;
    if (progress.history.length <= limit) return;

    const dropped = progress.history.splice(limit);
    await Promise.all(
      dropped.map((entry) =>
        rm(path.join(this.submissionsRoot(), labName, entry.id), { recursive: true, force: true }),
      ),
    );
  }

  /** 某次提交的源码快照绝对路径。 */
  snapshotPath(entry: HistoryEntry): string {
    return path.join(this.context.globalStorageUri.fsPath, entry.snapshot);
  }

  async resetAll(): Promise<void> {
    this.store = emptyStore();
    await this.persist();
    await rm(this.submissionsRoot(), { recursive: true, force: true });
  }
}

function toSubmissionCase(item: CaseResult): SubmissionCase {
  return {
    id: item.id,
    verdict: item.verdict,
    points: item.points,
    maxPoints: item.maxPoints,
    durationMs: item.durationMs,
  };
}
