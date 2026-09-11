import { access, rm } from "node:fs/promises";
import path from "node:path";
import * as vscode from "vscode";
import { CliError, readProjectCurrent } from "./cli";
import { EnvironmentGuard } from "./doctor";
import type { LabEntry } from "./labIndex";
import { LabPanel, projectDirtyFiles } from "./panel";
import { ProgressTracker, type HistoryEntry } from "./progress";
import { StatsPanel } from "./statsPanel";
import { LabTreeProvider, type TreeNode } from "./tree";

/** 找到包含 labs/ 的工作区目录。多根工作区时取第一个匹配的。 */
async function findRepoRoot(): Promise<string | undefined> {
  for (const folder of vscode.workspace.workspaceFolders ?? []) {
    const candidate = folder.uri.fsPath;
    try {
      await access(path.join(candidate, "labs"));
      await access(path.join(candidate, "tools", "lab", "cli.mjs"));
      return candidate;
    } catch {
      continue;
    }
  }
  return undefined;
}

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  const repoRoot = await findRepoRoot();
  if (!repoRoot) {
    // 不是 DSA Mastery 仓库，静默退出 —— viewsWelcome 已经解释了原因。
    return;
  }

  const progress = new ProgressTracker(context);
  const guard = new EnvironmentGuard(repoRoot);
  const tree = new LabTreeProvider(repoRoot, progress);

  const view = vscode.window.createTreeView("dsaMastery.labs", {
    treeDataProvider: tree,
    showCollapseAll: true,
  });
  context.subscriptions.push(view);

  const panelDeps = {
    context,
    repoRoot,
    progress,
    guard,
    onSubmitted: () => tree.refreshDecorations(),
    // 用树视图的同一份顺序,保证面板里的上/下一题和左侧树的上下顺序一致。
    siblings: () => tree.allLabs(),
  };

  /** 解析命令参数：可能是树节点、lab 名，或什么都没有（用当前面板/当前文件）。 */
  const resolveLab = async (argument?: unknown): Promise<LabEntry | undefined> => {
    if (typeof argument === "string") return tree.findLab(argument);

    const node = argument as TreeNode | undefined;
    if (node && typeof node === "object" && "kind" in node && node.kind === "lab") return node.lab;

    const active = LabPanel.activeLab();
    if (active) return active;

    // 退化到当前编辑器所在的 lab。
    const file = vscode.window.activeTextEditor?.document.fileName;
    if (!file) return undefined;
    return tree.allLabs().find((lab) => isWithinDirectory(lab.labPath, file));
  };

  context.subscriptions.push(
    vscode.commands.registerCommand("dsaMastery.openLab", async (argument?: unknown) => {
      const lab = await resolveLab(argument);
      if (!lab) {
        await vscode.window.showWarningMessage("没有找到对应的题目。请在题目列表中选择一道题。");
        return;
      }
      await LabPanel.show(lab, panelDeps);
    }),

    vscode.commands.registerCommand("dsaMastery.submit", async (argument?: unknown, taskId?: string) => {
      const lab = await resolveLab(argument);
      if (!lab) {
        await vscode.window.showWarningMessage("没有可提交的题目。请先打开一道题。");
        return;
      }
      // 统一走面板提交，保证结果有地方显示。
      await LabPanel.show(lab, panelDeps);
      if (LabPanel.activeLab()?.id === lab.id) await LabPanel.submitActive(taskId);
    }),

    vscode.commands.registerCommand("dsaMastery.refreshTree", async () => {
      await tree.refresh();
    }),

    vscode.commands.registerCommand("dsaMastery.showStats", async () => {
      // 章节分布要用树的数据;树可能还没扫过盘,先确保加载。
      if (tree.allLabs().length === 0) await tree.refresh();
      StatsPanel.show(context, progress, tree.chapterList());
    }),

    vscode.commands.registerCommand("dsaMastery.showHistory", async (argument?: unknown) => {
      const lab = await resolveLab(argument);
      if (lab) await showHistory(lab, progress);
    }),

    vscode.commands.registerCommand("dsaMastery.runDoctor", async (argument?: unknown) => {
      const lab = (await resolveLab(argument)) ?? tree.allLabs()[0];
      if (!lab) {
        await vscode.window.showWarningMessage("没有找到可用于环境检测的题目。");
        return;
      }
      try {
        await guard.inspect(lab);
      } catch (error) {
        const message = error instanceof CliError ? error.message : String(error);
        await vscode.window.showErrorMessage(`环境检测失败：${message}`);
      }
    }),

    vscode.commands.registerCommand("dsaMastery.resetProgress", async () => {
      const choice = await vscode.window.showWarningMessage(
        "确定要清空全部做题进度吗？所有通过记录和提交历史（含保存的答案快照）都会被删除，无法恢复。",
        { modal: true },
        "清空",
      );
      if (choice !== "清空") return;
      await progress.resetAll();
      for (const lab of tree.allLabs().filter((entry) => entry.type === "project")) {
        await rm(path.join(lab.labPath, ".lab-cache", "project-results-student.json"), { force: true });
      }
      tree.refreshDecorations();
      await vscode.window.showInformationMessage("做题进度已清空。");
    }),
  );

  await tree.refresh();
  const revisions = new Map<string, number>();
  const timers = new Map<string, ReturnType<typeof setTimeout>>();
  const refreshProject = (lab: LabEntry) => {
    if (lab.type !== "project") return;
    const revision = (revisions.get(lab.id) ?? 0) + 1;
    revisions.set(lab.id, revision);
    progress.invalidateProjectCurrent(lab.id);
    tree.refreshDecorations();
    LabPanel.refreshCurrent(lab.id);
    clearTimeout(timers.get(lab.id));
    timers.set(lab.id, setTimeout(async () => {
      timers.delete(lab.id);
      if (!vscode.workspace.isTrusted) return;
      try {
        const current = await readProjectCurrent(repoRoot, lab.relativePath, projectDirtyFiles(lab));
        if (revisions.get(lab.id) !== revision) return;
        progress.setProjectCurrent(lab.id, current);
        tree.refreshDecorations();
        LabPanel.refreshCurrent(lab.id);
      } catch { /* Keep historical results, but never count an unchecked current pass. */ }
    }, 250));
  };
  const changed = (uri: vscode.Uri) => {
    const relative = path.relative(repoRoot, uri.fsPath).split(path.sep).join("/");
    if (relative.split("/").some((part) => ["solution", "node_modules", ".git"].includes(part))) return;
    if (relative.includes("/.lab-cache/") && !relative.endsWith("/project-results-student.json")) return;
    for (const lab of tree.allLabs()) {
      if (isWithinDirectory(lab.labPath, uri.fsPath) || relative.startsWith("tools/lab/") || relative.startsWith("schemas/")) refreshProject(lab);
    }
  };
  const watcher = vscode.workspace.createFileSystemWatcher(new vscode.RelativePattern(repoRoot, "**/*"));
  context.subscriptions.push(watcher, watcher.onDidChange(changed), watcher.onDidCreate(changed), watcher.onDidDelete(changed),
    vscode.workspace.onDidChangeTextDocument((event) => changed(event.document.uri)),
    vscode.workspace.onDidSaveTextDocument((document) => changed(document.uri)),
    vscode.workspace.onDidGrantWorkspaceTrust(() => tree.allLabs().forEach(refreshProject)),
    { dispose: () => { for (const timer of timers.values()) clearTimeout(timer); } });
  tree.allLabs().forEach(refreshProject);
}

/** 列出某题的提交历史，可打开任一次提交的源码快照，或与当前代码对比。 */
async function showHistory(lab: LabEntry, progress: ProgressTracker): Promise<void> {
  if (lab.type !== "program") {
    await vscode.window.showInformationMessage(
      lab.type === "project"
        ? "Project 暂不支持多文件提交历史；当前仅保留最近一次自动判题摘要。"
        : "选择题没有代码提交历史。",
    );
    return;
  }
  const state = progress.get(lab.id);
  if (!state || state.history.length === 0) {
    await vscode.window.showInformationMessage(`${lab.title} 还没有提交记录。`);
    return;
  }

  interface Item extends vscode.QuickPickItem {
    entry: HistoryEntry;
  }

  const items: Item[] = state.history.map((entry, index) => ({
    label: `${entry.verdict === "AC" ? "$(pass-filled)" : "$(error)"} ${entry.verdict} ${entry.score}/${entry.maxScore}`,
    description: new Date(entry.at).toLocaleString(),
    detail: index === 0 ? "最近一次提交" : undefined,
    entry,
  }));

  const picked = await vscode.window.showQuickPick(items, {
    title: `${lab.title} · 共 ${state.submissionCount} 次提交`,
    placeHolder: "选择一次提交查看当时的答案",
  });
  if (!picked) return;

  const snapshot = vscode.Uri.file(progress.snapshotPath(picked.entry));
  const action = await vscode.window.showQuickPick(["打开当时的答案", "与当前代码对比"], {
    placeHolder: "要怎么查看这次提交？",
  });
  if (!action) return;

  if (action === "打开当时的答案") {
    const document = await vscode.workspace.openTextDocument(snapshot);
    await vscode.window.showTextDocument(document, { preview: true });
    return;
  }

  const current = vscode.Uri.file(path.join(lab.labPath, lab.studentSources[0]));
  await vscode.commands.executeCommand(
    "vscode.diff",
    snapshot,
    current,
    `${picked.entry.verdict} ${new Date(picked.entry.at).toLocaleString()} ↔ 当前代码`,
    { preview: true },
  );
}

export function deactivate(): void {
  // 状态在每次提交时已落盘，无需在此处理。
}

function isWithinDirectory(root: string, target: string): boolean {
  const relative = path.relative(path.resolve(root), path.resolve(target));
  return relative !== "" && relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
}
