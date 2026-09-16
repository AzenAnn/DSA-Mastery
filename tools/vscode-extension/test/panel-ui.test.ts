import { expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function readPackageFile(relativePath: string): Promise<string> {
  return readFile(path.join(packageRoot, relativePath), "utf8");
}

it("program panel exposes a collapsible bounded result inspector", async () => {
  const html = await readPackageFile("src/panelHtml.ts");
  const css = await readPackageFile("media/panel.css");

  expect(html).toMatch(/class="lab-workspace/);
  expect(html).toMatch(/id="inspector-toggle"/);
  expect(html).toMatch(/data-inspector-tab="result"/);
  expect(html).toMatch(/data-inspector-tab="cases"/);
  expect(html).toMatch(/const initialInspectorOpen = Boolean\(progress\?\.lastSubmission\)/);
  expect(html).toMatch(/aria-expanded="\$\{initialOpen\}"/);
  expect(css).toMatch(/grid-template-columns:\s*minmax\(0,\s*2fr\)\s+minmax\(220px,\s*min\(34%,\s*360px\)\)/);
  expect(css).toMatch(/@media\s*\(max-width:\s*720px\)/);
  expect(css).toMatch(/min-width:\s*0/);
  expect(css).toMatch(/\.lab-inspector\.is-collapsed \.inspector-toggle-text/);
});

it("program panel keeps existing host-facing controls", async () => {
  const html = await readPackageFile("src/panelHtml.ts");

  expect(html).toMatch(/id="submit"/);
  expect(html).toMatch(/id="open-source"/);
  expect(html).toMatch(/id="history"/);
  expect(html).toMatch(/id="nav-prev"/);
  expect(html).toMatch(/id="nav-next"/);
});

it("program panel pins the action bar and reserves its viewport space", async () => {
  const html = await readPackageFile("src/panelHtml.ts");
  const css = await readPackageFile("media/panel.css");
  const actionbarBlock = css.match(/\.lab-actionbar\s*\{[\s\S]*?\n\}/)?.[0] ?? "";

  expect(actionbarBlock).toMatch(/position:\s*fixed/);
  expect(actionbarBlock).not.toMatch(/position:\s*sticky/);
  expect(actionbarBlock).toMatch(/bottom:\s*16px/);
  expect(actionbarBlock).toMatch(/padding:\s*6px/);
  expect(actionbarBlock).toMatch(/border-radius:\s*10px/);
  expect(css).toMatch(/\.lab-actionbar \.lab-button\s*\{[\s\S]*?min-height:\s*32px/);
  expect(css).toMatch(/\.program-page\s*\{[\s\S]*?--lab-actionbar-reserve/);
  expect(css).toMatch(/padding-bottom:\s*var\(--lab-actionbar-reserve\)/);
  expect(html).toMatch(/class="program-scroll-region"/);
  expect(css).toMatch(/body\.program-body[\s\S]*?overflow:\s*hidden/);
  expect(css).toMatch(/\.program-scroll-region\s*\{[\s\S]*?overflow-y:\s*auto/);
  expect(html).toMatch(/const readingSurface = document\.querySelector\("\.lab-reading-surface"\)/);
  expect(html).toMatch(/actionbar\.style\.left/);
  expect(html).toMatch(/actionbar\.style\.width/);
  expect(html).toMatch(/new ResizeObserver/);
});

it("quiz panel uses the shared WebView shell without adding sidebar navigation", async () => {
  const html = await readPackageFile("src/panelHtml.ts");

  expect(html).toMatch(/class="lab-page quiz-page"/);
  expect(html).toMatch(/class="readme"/);
  expect(html).toMatch(/class="course-quiz"/);
  expect(html).not.toMatch(/class="chapter-sidebar"/);
});

it("program and quiz panels expose the stable Lab ID in their metadata", async () => {
  const html = await readPackageFile("src/panelHtml.ts");

  expect(html).toMatch(/题号 \$\{escapeHtml\(lab\.id\)\}/);
});

it("quiz sidebar submit batches selected unanswered answers without reloading the active panel", async () => {
  const html = await readPackageFile("src/panelHtml.ts");
  const panel = await readPackageFile("src/panel.ts");
  const extension = await readPackageFile("src/extension.ts");
  const submitQuiz = panel.slice(panel.indexOf("static async submitQuiz"), panel.indexOf("private async load"));

  expect(html).toMatch(/message\.type === 'submitQuiz'/);
  expect(html).toMatch(/input:checked:not\(:disabled\)/);
  expect(html).toMatch(/type: 'quizAnswers'/);
  expect(html).toMatch(/let quizBatchInFlight = false/);
  expect(html).toMatch(/const pendingQuizQuestions = new Set\(\)/);
  expect(html).toMatch(/pendingQuizQuestions\.add\(questionId\)/);
  expect(html).toMatch(/pendingQuizQuestions\.delete\(message\.questionId\)/);
  expect(html).toMatch(/message\.type === 'quizBatchComplete'/);
  expect(submitQuiz).toMatch(/current\.panel\.webview\.postMessage\(\{ type: "submitQuiz" \}\)/);
  expect(submitQuiz).not.toMatch(/\.load\(/);
  expect(panel).toMatch(/case "quizAnswers"/);
  expect(panel).toMatch(/new Set<string>/);
  expect(panel).toMatch(/private quizBatchInProgress = false/);
  expect(panel).toMatch(/private readonly pendingQuizAnswers = new Set<string>/);
  expect(panel).toMatch(/LabPanel\.current\.submitting \|\| LabPanel\.current\.quizBatchInProgress/);
  expect(panel).toMatch(/!labName \|\| this\.submitting \|\| this\.quizBatchInProgress/);
  expect(panel).toMatch(/await this\.answerQuiz\(questionId, selected\)/);
  expect(extension).toMatch(/if \(lab\.type === "quiz"\)[\s\S]*?LabPanel\.submitQuiz/);
});

it("project panel exposes the task graph and manual pending state", async () => {
  const html = await readPackageFile("src/panelHtml.ts");

  expect(html).toMatch(/renderProjectPanelHtml/);
  expect(html).toMatch(/project-task-card/);
  expect(html).toMatch(/PENDING/);
  expect(html).toMatch(/ctest/);
  expect(html).toMatch(/openProjectFile/);
  expect(html).toMatch(/project-score-grid/);
  expect(html).toMatch(/item\.comparison/);
  expect(html).toMatch(/item\.output/);
});
