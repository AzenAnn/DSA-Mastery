import path from "node:path";
import * as vscode from "vscode";
import type { Chapter } from "./labIndex";
import { projectProgressPassed } from "./projectProgress";
import type { ProgressTracker } from "./progress";
import { buildChapterBars } from "./stats";
import { renderStatsDocument } from "./statsView";

function nonce(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/** 统计面板:单例 webview,与题目面板各自独立。 */
export class StatsPanel {
  private static current: StatsPanel | undefined;

  static show(
    context: vscode.ExtensionContext,
    progress: ProgressTracker,
    chapters: readonly Chapter[],
  ): void {
    if (!StatsPanel.current) StatsPanel.current = new StatsPanel(context);
    const panel = StatsPanel.current;
    panel.render(progress, chapters);
    panel.panel.reveal(vscode.ViewColumn.One);
  }

  private readonly panel: vscode.WebviewPanel;

  private constructor(private readonly context: vscode.ExtensionContext) {
    this.panel = vscode.window.createWebviewPanel(
      "dsaMastery.stats",
      "做题统计",
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, "media"))],
      },
    );
    this.panel.onDidDispose(() => {
      StatsPanel.current = undefined;
    });
  }

  private render(progress: ProgressTracker, chapters: readonly Chapter[]): void {
    const events = progress.events();
    const bars = buildChapterBars(chapters, (id, type) =>
      type === "quiz"
        ? !!progress.getQuiz(id)?.passed
        : type === "project"
          ? projectProgressPassed(progress.getProject(id) ?? { automatedFull: false, manualPending: 0, internalError: false })
          : !!progress.get(id)?.passed,
    );
    const styleUri = this.panel.webview.asWebviewUri(
      vscode.Uri.file(path.join(this.context.extensionPath, "media", "panel.css")),
    );

    this.panel.webview.html = renderStatsDocument({ events, bars }, {
      cspSource: this.panel.webview.cspSource,
      styleUri: styleUri.toString(),
      nonce: nonce(),
    });
  }
}
