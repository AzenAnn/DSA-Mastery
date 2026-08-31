import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import * as vscode from "vscode";
import { CliError, scoreLab, type ScoreResult } from "./cli";
import type { EnvironmentGuard } from "./doctor";
import { loadTestCases, studentSourcePath, type ProgramLab } from "./labIndex";
import { renderMarkdownFragment, renderReadme } from "./markdown";
import type { ProgressTracker } from "./progress";
import { renderPanelHtml, renderQuizFeedbackHtml, renderQuizPanelHtml, renderResultHtml, type PanelNav, type QuizQuestionView } from "./panelHtml";

type LoadedCase = Awaited<ReturnType<typeof loadTestCases>>[number];

interface PanelDeps {
  context: vscode.ExtensionContext;
  repoRoot: string;
  progress: ProgressTracker;
  guard: EnvironmentGuard;
  onSubmitted: () => void;
  /** 全部题目,顺序与树视图一致(章号 → order → name)。上/下一题按它取邻居。 */
  siblings: () => ProgramLab[];
}

/** 题目面板：单例 webview，切换题目时复用同一个面板。 */
export class LabPanel {
  private static current: LabPanel | undefined;

  private readonly panel: vscode.WebviewPanel;
  private readonly disposables: vscode.Disposable[] = [];
  private lab!: ProgramLab;
  private cases: LoadedCase[] = [];
  /** quiz 题目的渲染结果，提交后回填反馈区时复用。 */
  private quizViews: QuizQuestionView[] = [];
  private submitting = false;

  private constructor(private readonly deps: PanelDeps) {
    this.panel = vscode.window.createWebviewPanel(
      "dsaMastery.lab",
      "DSA Mastery",
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
          vscode.Uri.file(path.join(deps.repoRoot, "labs")),
          vscode.Uri.file(path.join(deps.context.extensionPath, "media")),
        ],
      },
    );

    this.panel.onDidDispose(() => this.dispose(), undefined, this.disposables);
    this.panel.webview.onDidReceiveMessage(
      (message) => void this.handleMessage(message),
      undefined,
      this.disposables,
    );
  }

  static async show(lab: ProgramLab, deps: PanelDeps): Promise<void> {
    if (!LabPanel.current) LabPanel.current = new LabPanel(deps);
    await LabPanel.current.load(lab);
    LabPanel.current.panel.reveal(vscode.ViewColumn.One);
  }

  /** 当前面板正在显示的题目，供「提交当前题目」命令使用。 */
  static activeLab(): ProgramLab | undefined {
    return LabPanel.current?.lab;
  }

  static async submitActive(): Promise<void> {
    await LabPanel.current?.submit();
  }

  private async load(lab: ProgramLab): Promise<void> {
    this.lab = lab;
    this.panel.title = lab.title;

    const [readme, cases] = await Promise.all([
      renderReadme(lab, this.panel.webview),
      loadTestCases(lab),
    ]);
    this.cases = cases;

    // 渲染结果存下来：提交某一题后要用同一份 HTML 回填反馈区，
    // 否则题解会退化成纯文本（Markdown 和公式都不生效）。
    this.quizViews = (lab.quizQuestions ?? []).map((question) => ({
      ...question,
      stemHtml: renderMarkdownFragment(question.stem, lab, this.panel.webview),
      optionHtml: question.options.map((option) => renderMarkdownFragment(option, lab, this.panel.webview)),
      hintHtml: question.hint ? renderMarkdownFragment(question.hint, lab, this.panel.webview) : undefined,
      explanationHtml: renderMarkdownFragment(question.explanation, lab, this.panel.webview),
    }));

    this.panel.webview.html = lab.type === "quiz"
      ? renderQuizPanelHtml({
          webview: this.panel.webview,
          extensionPath: this.deps.context.extensionPath,
          lab,
          readmeHtml: readme.html,
          questions: this.quizViews,
          quizProgress: this.deps.progress.getQuiz(lab.id),
        })
      : renderPanelHtml({
          webview: this.panel.webview,
          extensionPath: this.deps.context.extensionPath,
          lab,
          readmeHtml: readme.html,
          cases,
          progress: this.deps.progress.get(lab.id),
          nav: this.navFor(lab),
        });
  }

  /**
   * 取代码题序列里的前后邻居。
   *
   * 只在 program 之间走 —— 跳到选择题的话那一页没有这两个按钮,用户就回不来了,
   * 等于把人送进死路。所以这里先过滤掉 quiz 再找邻居。
   */
  private navFor(lab: ProgramLab): PanelNav {
    if (lab.type !== "program") return {};
    const programs = this.deps.siblings().filter((item) => item.type === "program");
    const index = programs.findIndex((item) => item.id === lab.id);
    if (index < 0) return {};

    const at = (offset: number) => {
      const target = programs[index + offset];
      return target ? { name: target.id, title: target.title } : undefined;
    };
    return { prev: at(-1), next: at(1) };
  }

  private async handleMessage(message: { type: string; questionId?: string; selected?: number; labName?: string }): Promise<void> {
    switch (message.type) {
      case "submit":
        await this.submit();
        return;
      case "navigate":
        await this.navigate(message.labName);
        return;
      case "openSource":
        await this.openSource();
        return;
      case "showHistory":
        await vscode.commands.executeCommand("dsaMastery.showHistory", this.lab.id);
        return;
      case "quizAnswer":
        await this.answerQuiz(message.questionId, message.selected);
        return;
      default:
        return;
    }
  }

  private async answerQuiz(questionId?: string, selected?: number): Promise<void> {
    if (this.lab.type !== "quiz" || !questionId || selected === undefined || !Number.isInteger(selected)) return;
    const progress = await this.deps.progress.recordQuizAnswer(
      this.lab.id,
      this.lab.quizQuestions ?? [],
      questionId,
      selected,
    );
    const state = progress.answers[questionId];
    const question = this.quizViews.find((item) => item.id === questionId);
    void this.panel.webview.postMessage({
      type: "quizResult",
      questionId,
      // 带上 answer：前端要靠它给正确项标 is-answer。
      state: {
        ...state,
        answer: question?.answer,
        html: question ? renderQuizFeedbackHtml(question, selected) : "",
      },
      completed: progress.passed,
    });
    this.deps.onSubmitted();
  }

  /** 切到相邻题目。复用同一个面板,不新开 webview。 */
  private async navigate(labName?: string): Promise<void> {
    if (!labName || this.submitting) return;
    const target = this.deps.siblings().find((item) => item.id === labName || item.name === labName);
    if (!target) return;
    await this.load(target);
  }

  private async openSource(): Promise<void> {
    const document = await vscode.workspace.openTextDocument(studentSourcePath(this.lab));
    await vscode.window.showTextDocument(document, vscode.ViewColumn.Beside);
  }

  /**
   * 编译并评分当前题目，然后记录状态。
   *
   * 提交是状态唯一的写入时机 —— 只改代码不提交不会影响任何进度显示。
   */
  private async submit(): Promise<void> {
    if (this.submitting) return;
    this.submitting = true;
    void this.panel.webview.postMessage({ type: "submitting" });

    try {
      // 先保存未落盘的改动，否则判的是旧代码。
      const sourcePath = studentSourcePath(this.lab);
      const open = vscode.workspace.textDocuments.find((doc) => doc.fileName === sourcePath);
      if (open?.isDirty) await open.save();

      if (!(await this.deps.guard.ensureReady(this.lab))) {
        void this.panel.webview.postMessage({ type: "submitAborted" });
        return;
      }

      const result = await scoreLab(this.deps.repoRoot, this.lab.relativePath);
      const progress = await this.deps.progress.recordSubmission(this.lab, result);

      void this.panel.webview.postMessage({
        type: "result",
        html: renderResultHtml(result, progress),
      });
      this.deps.onSubmitted();
      // 不 await：通知要等用户点击或自动消失才 resolve，
      // 挂在这里会让 submitting 锁迟迟不释放，后续提交全部被挡掉。
      void this.notify(result);
    } catch (error) {
      const message = error instanceof CliError ? error.message : String(error);
      void this.panel.webview.postMessage({ type: "submitFailed", message });
      void vscode.window.showErrorMessage(`提交失败：${message}`);
    } finally {
      this.submitting = false;
    }
  }

  /** 判题结果通知。WA 时提供并排查看完整输出的入口。 */
  private async notify(result: ScoreResult): Promise<void> {
    if (result.verdict === "AC" && result.score === result.maxScore) {
      void vscode.window.showInformationMessage(
        `通过：${this.lab.title}（${result.score}/${result.maxScore}）`,
      );
      return;
    }

    const failed = result.cases.find((item) => item.verdict !== "AC");
    const actions = failed ? ["并排查看完整输出"] : [];
    const choice = await vscode.window.showWarningMessage(
      `未满分：${result.verdict} ${result.score}/${result.maxScore}`,
      ...actions,
    );
    if (choice && failed) await this.openDiff(failed.id);
  }

  /**
   * 用 VSCode 原生 diff 并排显示实际输出与期望输出。
   *
   * score 报告只带首处差异，要看完整输出得重新跑一次这个用例并把 stdout 落到
   * 临时文件。这里用 run --case 单独跑，避免重跑全部用例。
   */
  private async openDiff(caseId: string): Promise<void> {
    const testCase = this.cases.find((item) => item.id === caseId);
    if (!testCase) return;

    try {
      const actual = await this.captureOutput(testCase);
      const dir = await mkdtemp(path.join(tmpdir(), "dsa-lab-"));
      const actualPath = path.join(dir, `${caseId}.actual.txt`);
      await writeFile(actualPath, actual, "utf8");

      await vscode.commands.executeCommand(
        "vscode.diff",
        vscode.Uri.file(actualPath),
        vscode.Uri.file(path.join(this.lab.labPath, testCase.expected)),
        `${caseId}：实际输出 ↔ 期望输出`,
        { preview: true },
      );
    } catch (error) {
      const message = error instanceof CliError ? error.message : String(error);
      await vscode.window.showErrorMessage(`无法生成输出对比：${message}`);
    }
  }

  /** 直接运行已编译的可执行文件取得完整 stdout。 */
  private async captureOutput(testCase: LoadedCase): Promise<string> {
    const { spawn } = await import("node:child_process");
    const executable = path.join(
      this.lab.labPath,
      ".lab-cache",
      "bin",
      process.platform === "win32" ? "student.exe" : "student",
    );

    return new Promise<string>((resolve, reject) => {
      const child = spawn(executable, [], { cwd: this.lab.labPath, shell: false });
      let stdout = "";
      const timer = setTimeout(() => {
        child.kill();
        reject(new CliError("运行超时，无法取得完整输出。"));
      }, 5000);

      child.stdout.on("data", (chunk) => {
        stdout += chunk;
      });
      child.once("error", (error) => {
        clearTimeout(timer);
        reject(new CliError(`无法运行已编译程序：${error.message}`));
      });
      child.once("close", () => {
        clearTimeout(timer);
        resolve(stdout);
      });

      child.stdin.end(testCase.inputText);
    });
  }

  private dispose(): void {
    LabPanel.current = undefined;
    for (const item of this.disposables) item.dispose();
    this.panel.dispose();
  }
}
