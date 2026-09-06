import * as vscode from "vscode";
import { shortLabTitle } from "./labIdentity";
import { discoverProgramLabs, type Chapter, type LabEntry, type ProjectLab } from "./labIndex";
import { quizIconState } from "./quiz";
import { projectProgressPassed, type ProjectProgress } from "./projectProgress";
import type { LabProgress, ProgressTracker, QuizProgress } from "./progress";

export class ChapterNode {
  readonly kind = "chapter" as const;
  constructor(readonly chapter: Chapter) {}
}

export class LabNode {
  readonly kind = "lab" as const;
  constructor(readonly lab: LabEntry) {}
}

export type TreeNode = ChapterNode | LabNode;

export class LabTreeProvider implements vscode.TreeDataProvider<TreeNode> {
  private readonly emitter = new vscode.EventEmitter<TreeNode | undefined>();
  readonly onDidChangeTreeData = this.emitter.event;

  private chapters: Chapter[] = [];
  private loaded = false;

  constructor(
    private readonly repoRoot: string,
    private readonly progress: ProgressTracker,
  ) {}

  /** 重新扫描 labs/ 并刷新整棵树。 */
  async refresh(): Promise<void> {
    this.chapters = await discoverProgramLabs(this.repoRoot);
    await this.progress.migrateLabKeys(this.allLabs());
    this.loaded = true;
    this.emitter.fire(undefined);
  }

  /** 只刷新状态显示，不重扫磁盘。提交完成后调用。 */
  refreshDecorations(): void {
    this.emitter.fire(undefined);
  }

  allLabs(): LabEntry[] {
    return this.chapters.flatMap((chapter) => chapter.labs);
  }

  /** 章节列表,供统计面板算章节分布。 */
  chapterList(): readonly Chapter[] {
    return this.chapters;
  }

  findLab(identifier: string): LabEntry | undefined {
    return this.allLabs().find(
      (lab) => lab.id === identifier || lab.name === identifier || lab.legacyNames.includes(identifier),
    );
  }

  async getChildren(element?: TreeNode): Promise<TreeNode[]> {
    if (!this.loaded) await this.refresh();
    if (!element) return this.chapters.map((chapter) => new ChapterNode(chapter));
    if (element.kind === "chapter") return element.chapter.labs.map((lab) => new LabNode(lab));
    return [];
  }

  getTreeItem(element: TreeNode): vscode.TreeItem {
    return element.kind === "chapter" ? this.chapterItem(element) : this.labItem(element);
  }

  private chapterItem(node: ChapterNode): vscode.TreeItem {
    const { chapter } = node;
    const item = new vscode.TreeItem(
      `第 ${chapter.chapter} 章 · ${chapter.chapterTitle}`,
      vscode.TreeItemCollapsibleState.Collapsed,
    );
    item.description = `${this.progress.countPassed(chapter.labs)}/${chapter.labs.length}`;
    item.iconPath = new vscode.ThemeIcon("folder");
    item.contextValue = "dsaMasteryChapter";
    return item;
  }

  private labItem(node: LabNode): vscode.TreeItem {
    const { lab } = node;
    const quizState = lab.type === "quiz" ? this.progress.getQuiz(lab.id) : undefined;
    const programState = lab.type === "program" ? this.progress.get(lab.id) : undefined;
    const projectState = lab.type === "project" ? this.progress.getProject(lab.id) : undefined;
    const item = new vscode.TreeItem(`${lab.id} · ${shortLabTitle(lab.title)}`, vscode.TreeItemCollapsibleState.None);

    if (lab.type === "quiz") {
      item.description = describeQuizState(quizState);
      item.iconPath = quizStateIcon(quizState);
      item.tooltip = buildQuizTooltip(lab, quizState);
      item.contextValue = "dsaMasteryLab";
    } else if (lab.type === "project") {
      item.description = describeProjectState(projectState);
      item.iconPath = projectStateIcon(projectState);
      item.tooltip = buildProjectTooltip(lab, projectState);
      item.contextValue = "dsaMasteryProject";
    } else {
      item.description = describeState(programState);
      item.iconPath = stateIcon(programState);
      item.tooltip = buildTooltip(lab, programState);
      item.contextValue = "dsaMasteryLab";
    }
    item.command = {
      command: "dsaMastery.openLab",
      title: "打开题目",
      arguments: [lab.id],
    };
    return item;
  }
}

/**
 * 选择题状态图标。问号形状贯穿未完成的两个状态 —— 只用颜色区分「没动过」和
 * 「答过但没全对」,这样图标始终标明这是选择题,不会跟代码题的中间态撞脸。
 * 全对后换绿勾,与代码题共用同一套「完成」视觉语言。
 */
function quizStateIcon(state: QuizProgress | undefined): vscode.ThemeIcon {
  const answered = state ? Object.keys(state.answers).length : 0;
  switch (quizIconState(state?.passed ?? false, answered)) {
    case "passed":
      return new vscode.ThemeIcon("pass-filled", new vscode.ThemeColor("testing.iconPassed"));
    case "in-progress":
      return new vscode.ThemeIcon("question", new vscode.ThemeColor("testing.iconQueued"));
    default:
      return new vscode.ThemeIcon("question");
  }
}

function describeQuizState(state: QuizProgress | undefined): string {
  if (!state) return "";
  const answered = Object.keys(state.answers).length;
  const correct = Object.values(state.answers).filter((answer) => answer.correct).length;
  return state.passed ? `${correct}/${correct} · 已完成` : `${correct} 正确 · 已答 ${answered}`;
}

function buildQuizTooltip(lab: Extract<LabEntry, { type: "quiz" }>, state: QuizProgress | undefined): vscode.MarkdownString {
  const tooltip = new vscode.MarkdownString(`**${lab.id} · ${lab.title}**\n\n${state?.passed ? "✅ 已完成" : "选择题"}\n\n已答：${state ? Object.keys(state.answers).length : 0}/${lab.quizQuestions?.length ?? 0}`);
  tooltip.supportThemeIcons = true;
  return tooltip;
}

/**
 * 状态图标。绿勾一旦拿到就永久保留 —— 后续低分提交不会把它拿掉，
 * 这与传统 OJ 的心智模型一致。
 */
function stateIcon(state: LabProgress | undefined): vscode.ThemeIcon {
  if (state?.passed) {
    return new vscode.ThemeIcon("pass-filled", new vscode.ThemeColor("testing.iconPassed"));
  }
  if (state && state.submissionCount > 0) {
    return new vscode.ThemeIcon("circle-large-outline", new vscode.ThemeColor("testing.iconQueued"));
  }
  return new vscode.ThemeIcon("circle-large-outline");
}

function describeState(state: LabProgress | undefined): string {
  if (!state || state.submissionCount === 0) return "";
  if (state.passed && state.bestScore === state.maxScore) return `${state.bestScore}/${state.maxScore}`;
  return `${state.bestScore}/${state.maxScore} · ${state.lastSubmission?.verdict ?? ""}`.trim();
}

function buildTooltip(lab: Extract<LabEntry, { type: "program" }>, state: LabProgress | undefined): vscode.MarkdownString {
  const lines = [`**${lab.id} · ${lab.title}**`, ""];
  if (lab.description) lines.push(lab.description, "");

  const meta = [lab.difficulty && `难度：${lab.difficulty}`, lab.duration && `预计：${lab.duration}`]
    .filter(Boolean)
    .join(" · ");
  if (meta) lines.push(meta, "");

  if (!state || state.submissionCount === 0) {
    lines.push("尚未提交");
  } else {
    lines.push(
      state.passed ? "✅ 已通过" : `未满分 · 最好成绩 ${state.bestScore}/${state.maxScore}`,
      `提交次数：${state.submissionCount}`,
    );
    if (state.lastSubmission) {
      const last = state.lastSubmission;
      lines.push(
        `最近一次：${last.verdict} ${last.score}/${last.maxScore}（${formatTime(last.at)}）`,
      );
    }
  }

  const tooltip = new vscode.MarkdownString(lines.join("\n\n"));
  tooltip.supportThemeIcons = true;
  return tooltip;
}

function projectStateIcon(state: ProjectProgress | undefined): vscode.ThemeIcon {
  if (state && projectProgressPassed(state)) {
    return new vscode.ThemeIcon("pass-filled", new vscode.ThemeColor("testing.iconPassed"));
  }
  if (state && state.submissionCount > 0) {
    return new vscode.ThemeIcon("symbol-misc", new vscode.ThemeColor("testing.iconQueued"));
  }
  return new vscode.ThemeIcon("symbol-misc");
}

function describeProjectState(state: ProjectProgress | undefined): string {
  if (!state || state.submissionCount === 0) return "";
  if (state.internalError) return "评测内部错误";
  if (projectProgressPassed(state)) return `${formatScore(state.automatedScore)}/${formatScore(state.automatedMax)}`;
  if (state.automatedFull && state.manualPending > 0) return "自动通过 · 待人工";
  return `${formatScore(state.automatedScore)}/${formatScore(state.automatedMax)} · 待人工 ${formatScore(state.manualPending)}`;
}

function buildProjectTooltip(lab: ProjectLab, state: ProjectProgress | undefined): vscode.MarkdownString {
  const lines = [`**${lab.id} · ${lab.title}**`, ""];
  if (lab.description) lines.push(lab.description, "");
  lines.push(`任务：${lab.tasks.length} 个`, `学生文件：${lab.studentFiles.length} 个`);

  if (!state || state.submissionCount === 0) {
    lines.push("尚未提交");
  } else {
    const status = state.internalError
      ? "评测内部错误"
      : projectProgressPassed(state)
      ? "✅ 已完成"
      : state.automatedFull && state.manualPending > 0
        ? "自动通过 · 待人工"
        : "自动部分未满";
    lines.push(status, `自动得分：${formatScore(state.automatedScore)}/${formatScore(state.automatedMax)}`, `待人工：${formatScore(state.manualPending)}`, `提交次数：${state.submissionCount}`);
    if (state.lastSubmission) lines.push(`最近一次：${new Date(state.lastSubmission.at).toLocaleString()}`);
  }

  const tooltip = new vscode.MarkdownString(lines.join("\n\n"));
  tooltip.supportThemeIcons = true;
  return tooltip;
}

function formatScore(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}

function formatTime(iso: string): string {
  const when = new Date(iso);
  return Number.isNaN(when.getTime()) ? iso : when.toLocaleString();
}
