import * as vscode from "vscode";
import { discoverProgramLabs, type Chapter, type ProgramLab } from "./labIndex";
import type { LabProgress, ProgressTracker } from "./progress";

export class ChapterNode {
  readonly kind = "chapter" as const;
  constructor(readonly chapter: Chapter) {}
}

export class LabNode {
  readonly kind = "lab" as const;
  constructor(readonly lab: ProgramLab) {}
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
    this.loaded = true;
    this.emitter.fire(undefined);
  }

  /** 只刷新状态显示，不重扫磁盘。提交完成后调用。 */
  refreshDecorations(): void {
    this.emitter.fire(undefined);
  }

  allLabs(): ProgramLab[] {
    return this.chapters.flatMap((chapter) => chapter.labs);
  }

  findLab(name: string): ProgramLab | undefined {
    return this.allLabs().find((lab) => lab.name === name);
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
    const passed = this.progress.countPassed(chapter.labs.map((lab) => lab.name));
    item.description = `${passed}/${chapter.labs.length}`;
    item.iconPath = new vscode.ThemeIcon("folder");
    item.contextValue = "dsaMasteryChapter";
    return item;
  }

  private labItem(node: LabNode): vscode.TreeItem {
    const { lab } = node;
    const state = this.progress.get(lab.name);
    const item = new vscode.TreeItem(lab.title, vscode.TreeItemCollapsibleState.None);

    item.description = describeState(state);
    item.iconPath = stateIcon(state);
    item.tooltip = buildTooltip(lab, state);
    item.contextValue = "dsaMasteryLab";
    item.command = {
      command: "dsaMastery.openLab",
      title: "打开题目",
      arguments: [lab.name],
    };
    return item;
  }
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

function buildTooltip(lab: ProgramLab, state: LabProgress | undefined): vscode.MarkdownString {
  const lines = [`**${lab.title}**`, ""];
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

function formatTime(iso: string): string {
  const when = new Date(iso);
  return Number.isNaN(when.getTime()) ? iso : when.toLocaleString();
}
