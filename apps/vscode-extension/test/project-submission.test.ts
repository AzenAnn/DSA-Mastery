import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";
import { expect, it } from "vitest";

// vitest 从仓库根运行，路径不能再相对 cwd 解析。
const extensionRoot = path.resolve(fileURLToPath(new URL(".", import.meta.url)), "..");

it("Project submission captures identity, saves scoped inputs, rejects failed saves and serializes requests", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "dsa-project-submit-"));
  try {
    const messages: unknown[] = [];
    const documents: Array<{ fileName: string; isDirty: boolean; save: () => Promise<boolean> }> = [];
    const submissions: Array<{ lab: string; result: unknown }> = [];
    let calls = 0;
    let release: (() => void) | undefined;
    // scoreProject 进入阻塞后才会赋值 release，用一个 deferred 等它，不要轮询。
    let scoring!: () => void;
    const scoringStarted = new Promise<void>((resolve) => (scoring = resolve));
    const current = {
      target: "student",
      tasks: [],
      complete: false,
      automatedScore: 0,
      automatedMax: 100,
      manualPending: 0,
      provisionalTotal: 0,
      total: 100,
      automatedFull: false,
      internalError: false,
    };
    const disposable = { dispose() {} };
    const fake = {
      vscode: {
        ViewColumn: { One: 1, Beside: 2 },
        Uri: { file: (file: string) => ({ fsPath: file, toString: () => file }) },
        workspace: { isTrusted: true, textDocuments: documents },
        window: {
          createWebviewPanel: () => ({
            webview: {
              html: "",
              postMessage: (message: unknown) => {
                messages.push(message);
              },
              onDidReceiveMessage: () => disposable,
            },
            onDidDispose: () => disposable,
            reveal() {},
            dispose() {},
          }),
          showInformationMessage() {},
          showWarningMessage() {},
          showErrorMessage() {},
        },
      },
      cli: {
        CliError: class extends Error {
          code?: string;
          constructor(message: string, code?: string) {
            super(message);
            this.code = code;
          }
        },
        readProjectCurrent: async () => current,
        scoreProject: async () => {
          calls += 1;
          await new Promise<void>((resolve) => {
            release = resolve;
            scoring();
          });
          return { ...current, current };
        },
      },
    };
    (globalThis as unknown as { projectFixture: unknown }).projectFixture = fake;
    const output = path.join(root, "panel.cjs");
    await build({
      entryPoints: [path.join(extensionRoot, "src/views/panel.ts")],
      outfile: output,
      bundle: true,
      platform: "node",
      format: "cjs",
      plugins: [
        {
          name: "project-fixture",
          setup(builder) {
            builder.onResolve({ filter: /^vscode$|^\.\.\/cli\/client$|^\.\/markdown$|^\.\/panel-html$/ }, (args) => ({
              path: args.path,
              namespace: "fixture",
            }));
            builder.onLoad({ filter: /.*/, namespace: "fixture" }, (args) => {
              if (args.path === "vscode") return { contents: "module.exports = globalThis.projectFixture.vscode;" };
              if (args.path === "../cli/client") return { contents: "module.exports = globalThis.projectFixture.cli;" };
              if (args.path === "./markdown")
                return { contents: "exports.renderReadme = async () => ({ html: 'readme' });" };
              return {
                contents:
                  "for (const name of ['renderCurrentDetails','renderPanelHtml','renderProjectCurrentHtml','renderProjectHeader','renderProjectPanelHtml','renderProjectResultHtml','renderQuizFeedbackHtml','renderQuizPanelHtml','renderResultHtml']) exports[name] = () => 'rendered';",
              };
            });
          },
        },
      ],
    });
    // 打包产物只被这个用例按下面这组静态成员驱动，替身也只实现到这个程度。
    const { LabPanel } = createRequire(import.meta.url)(output) as {
      LabPanel: {
        show: (lab: object, deps: object) => Promise<void>;
        submitActive: (taskId: string) => Promise<void>;
        activeLab: () => { id: string };
        current: { dispose: () => void };
      };
    };
    const lab = {
      id: "02P04",
      title: "Expression",
      labPath: root,
      relativePath: ".",
      type: "project",
      tasks: [{ id: "stack", kind: "ctest" }],
      studentFiles: [],
    };
    await mkdir(path.join(root, "contracts"));
    await writeFile(path.join(root, "contracts", "api.hpp"), "// initial");
    const saved: string[] = [];
    let allowSave = false;
    documents.push({
      fileName: path.join(root, "contracts", "api.hpp"),
      isDirty: true,
      async save() {
        saved.push(this.fileName);
        if (allowSave) this.isDirty = false;
        return allowSave;
      },
    });
    documents.push({
      fileName: path.join(root, "..", "unrelated.cpp"),
      isDirty: true,
      async save() {
        throw new Error("Unrelated document was saved");
      },
    });
    const progress = {
      getProject: () => undefined,
      setProjectCurrent() {},
      invalidateProjectCurrent() {},
      async recordProjectSubmission(item: { id: string }, result: unknown) {
        submissions.push({ lab: item.id, result });
        return { submissionCount: submissions.length };
      },
    };
    const deps = {
      context: { extensionPath: root },
      repoRoot: root,
      progress,
      guard: { ensureReady: async () => true },
      siblings: () => [lab],
      onSubmitted() {},
    };
    await LabPanel.show(lab, deps);
    await LabPanel.submitActive("stack");
    expect(calls, "failed save must not grade").toBe(0);
    expect(messages.some((message) => (message as { type: string }).type === "projectSubmitFailed")).toBeTruthy();
    allowSave = true;
    const pending = LabPanel.submitActive("stack");
    await scoringStarted;
    await LabPanel.show({ ...lab, id: "other", labPath: path.join(root, "other") }, deps);
    await LabPanel.submitActive("stack");
    expect(LabPanel.activeLab().id).toBe("02P04");
    expect(calls, "duplicate submit must not grade twice").toBe(1);
    release!();
    await pending;
    expect(submissions.map((item) => item.lab)).toStrictEqual(["02P04"]);
    expect(saved.every((file) => file.endsWith("api.hpp"))).toBeTruthy();
    LabPanel.current.dispose();
  } finally {
    delete (globalThis as unknown as { projectFixture?: unknown }).projectFixture;
    await rm(root, { recursive: true, force: true });
  }
});
