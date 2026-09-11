import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { build } from "esbuild";
import test from "node:test";

test("Project submission captures identity, saves scoped inputs, rejects failed saves and serializes requests", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "dsa-project-submit-"));
  try {
    const messages: unknown[] = [];
    const documents: Array<{ fileName: string; isDirty: boolean; save(): Promise<boolean> }> = [];
    const submissions: Array<{ lab: string; result: unknown }> = [];
    let calls = 0;
    let release: (() => void) | undefined;
    const current = { target: "student", tasks: [], complete: false, automatedScore: 0, automatedMax: 100, manualPending: 0, provisionalTotal: 0, total: 100, automatedFull: false, internalError: false };
    const disposable = { dispose() {} };
    const fake = {
      vscode: {
        ViewColumn: { One: 1, Beside: 2 }, Uri: { file: (file: string) => ({ fsPath: file, toString: () => file }) },
        workspace: { isTrusted: true, textDocuments: documents },
        window: {
          createWebviewPanel: () => ({ webview: { html: "", postMessage: (message: unknown) => { messages.push(message); }, onDidReceiveMessage: () => disposable }, onDidDispose: () => disposable, reveal() {}, dispose() {} }),
          showInformationMessage() {}, showWarningMessage() {}, showErrorMessage() {},
        },
      },
      cli: {
        CliError: class extends Error { code?: string; constructor(message: string, code?: string) { super(message); this.code = code; } },
        readProjectCurrent: async () => current,
        scoreProject: async () => { calls += 1; await new Promise<void>((resolve) => { release = resolve; }); return { ...current, current }; },
      },
    };
    (globalThis as unknown as { projectFixture: unknown }).projectFixture = fake;
    const output = path.join(root, "panel.cjs");
    await build({ entryPoints: [path.resolve("src/panel.ts")], outfile: output, bundle: true, platform: "node", format: "cjs", plugins: [{ name: "project-fixture", setup(builder) {
      builder.onResolve({ filter: /^vscode$|^\.\/cli$|^\.\/markdown$|^\.\/panelHtml$/ }, (args) => ({ path: args.path, namespace: "fixture" }));
      builder.onLoad({ filter: /.*/, namespace: "fixture" }, (args) => {
        if (args.path === "vscode") return { contents: "module.exports = globalThis.projectFixture.vscode;" };
        if (args.path === "./cli") return { contents: "module.exports = globalThis.projectFixture.cli;" };
        if (args.path === "./markdown") return { contents: "exports.renderReadme = async () => ({ html: 'readme' });" };
        return { contents: "for (const name of ['renderCurrentDetails','renderPanelHtml','renderProjectCurrentHtml','renderProjectHeader','renderProjectPanelHtml','renderProjectResultHtml','renderQuizFeedbackHtml','renderQuizPanelHtml','renderResultHtml']) exports[name] = () => 'rendered';" };
      });
    } }] });
    const { LabPanel } = createRequire(import.meta.url)(output);
    const lab = { id: "02P04", title: "Expression", labPath: root, relativePath: ".", type: "project", tasks: [{ id: "stack", kind: "ctest" }], studentFiles: [] };
    await mkdir(path.join(root, "contracts"));
    await writeFile(path.join(root, "contracts", "api.hpp"), "// initial");
    const saved: string[] = [];
    let allowSave = false;
    documents.push({ fileName: path.join(root, "contracts", "api.hpp"), isDirty: true, async save() { saved.push(this.fileName); if (allowSave) this.isDirty = false; return allowSave; } });
    documents.push({ fileName: path.join(root, "..", "unrelated.cpp"), isDirty: true, async save() { throw new Error("Unrelated document was saved"); } });
    const progress = { getProject: () => undefined, setProjectCurrent() {}, invalidateProjectCurrent() {}, async recordProjectSubmission(item: { id: string }, result: unknown) { submissions.push({ lab: item.id, result }); return { submissionCount: submissions.length }; } };
    const deps = { context: { extensionPath: root }, repoRoot: root, progress, guard: { ensureReady: async () => true }, siblings: () => [lab], onSubmitted() {} };
    await LabPanel.show(lab, deps);
    await LabPanel.submitActive("stack");
    assert.equal(calls, 0, "failed save must not grade");
    assert(messages.some((message) => (message as { type: string }).type === "projectSubmitFailed"));
    allowSave = true;
    const pending = LabPanel.submitActive("stack");
    while (!release) await new Promise((resolve) => setTimeout(resolve, 10));
    await LabPanel.show({ ...lab, id: "other", labPath: path.join(root, "other") }, deps);
    await LabPanel.submitActive("stack");
    assert.equal(LabPanel.activeLab().id, "02P04");
    assert.equal(calls, 1, "duplicate submit must not grade twice");
    release();
    await pending;
    assert.deepEqual(submissions.map((item) => item.lab), ["02P04"]);
    assert(saved.every((file) => file.endsWith("api.hpp")));
    LabPanel.current.dispose();
  } finally {
    delete (globalThis as unknown as { projectFixture?: unknown }).projectFixture;
    await rm(root, { recursive: true, force: true });
  }
});
