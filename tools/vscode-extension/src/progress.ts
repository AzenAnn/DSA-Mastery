import { copyFile, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import * as vscode from "vscode";
import type { CaseResult, ScoreResult, Verdict } from "./cli";
import { studentSourcePath, type ProgramLab } from "./labIndex";
import type { QuizQuestion } from "./quiz";

const STATE_KEY = "dsaMastery.progress.v1";
const SCHEMA_VERSION = 1;

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
}

function emptyStore(): ProgressStore {
  return { schemaVersion: SCHEMA_VERSION, labs: {}, quizzes: {} };
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
    if (raw.schemaVersion !== SCHEMA_VERSION) {
      // 未来出现新版本时在此迁移。当前只有 v1，遇到未知版本保守重置，
      // 但保留原始数据以免真的丢东西。
      void this.context.globalState.update(`${STATE_KEY}.backup.${Date.now()}`, raw);
      return emptyStore();
    }
    return { schemaVersion: raw.schemaVersion, labs: raw.labs ?? {}, quizzes: raw.quizzes ?? {} };
  }

  private async persist(): Promise<void> {
    await this.context.globalState.update(STATE_KEY, this.store);
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
    if (questions.length > 0 && questions.every((item) => existing.answers[item.id]?.correct)) {
      existing.passed = true;
    }
    this.store.quizzes[labName] = existing;
    await this.persist();
    return existing;
  }

  /** 章节头部显示的「已通过/总数」。 */
  countPassed(labNames: string[]): number {
    return labNames.filter((name) => this.store.labs[name]?.passed).length;
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
