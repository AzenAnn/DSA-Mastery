import path from "node:path";
import * as vscode from "vscode";
import type { ProjectScoreResult, ScoreResult } from "./cli";
import type { LoadedTestCase, ProjectLab, ProjectTask, ProgramLab, QuizLab } from "./labIndex";
import type { LabProgress } from "./progress";
import type { QuizProgress } from "./progress";
import { projectProgressPassed, type ProjectProgress, type ProjectSubmissionSummary, type ProjectTaskSubmissionSummary } from "./projectProgress";
import type { QuizQuestion } from "./quiz";

export type QuizQuestionView = QuizQuestion & {
  stemHtml: string;
  optionHtml: string[];
  hintHtml?: string;
  explanationHtml: string;
};

type LoadedCase = LoadedTestCase;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function nonce(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function renderQuizPanelHtml(
  // 排除 nav:上/下一题只在代码题里出现,选择题面板不接这个字段。
  options: { webview: vscode.Webview; extensionPath: string; lab: QuizLab; readmeHtml: string; questions: QuizQuestionView[]; quizProgress?: QuizProgress },
): string {
  const { webview, extensionPath, lab, readmeHtml, questions, quizProgress } = options;
  const cspNonce = nonce();
  const styleUri = webview.asWebviewUri(vscode.Uri.file(path.join(extensionPath, "media", "panel.css")));
  const katexCssUri = webview.asWebviewUri(vscode.Uri.file(path.join(extensionPath, "media", "katex", "katex.min.css")));
  // 注入 answer 与已渲染的反馈 HTML：恢复进度时前端要靠它们复原选项状态与题解，
  // 否则重启 VSCode 后已答的题会丢掉标记和解析。
  const restored: Record<string, unknown> = {};
  for (const question of questions) {
    const state = quizProgress?.answers[question.id];
    if (!state) continue;
    restored[question.id] = {
      ...state,
      answer: question.answer,
      html: renderFeedbackBody(question, state.correct),
    };
  }
  const answers = JSON.stringify(restored).replace(/</g, "\\u003c");
  const questionHtml = questions.map((question, index) => renderQuizQuestion(question, index, quizProgress?.answers[question.id])).join("\n");
  return `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8" />
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} data:; style-src ${webview.cspSource}; font-src ${webview.cspSource}; script-src 'nonce-${cspNonce}';" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<link rel="stylesheet" href="${katexCssUri}" /><link rel="stylesheet" href="${styleUri}" /></head><body>
<div class="lab-page quiz-page">
<header class="lab-header"><div class="title-row"><h1>${escapeHtml(lab.title)}</h1><span id="quiz-badge" class="badge ${quizProgress?.passed ? "passed" : "fresh"}">${quizProgress?.passed ? "已完成" : "选择题"}</span></div>
<p class="meta">题号 ${escapeHtml(lab.id)} · 第 ${lab.chapter} 章 · ${escapeHtml(lab.chapterTitle)}</p></header>
<main class="lab-reading-surface quiz-reading-surface">
<article class="readme">${readmeHtml}</article>
<section class="course-quiz">
<div class="course-quiz-summary" aria-live="polite"><strong>答题进度</strong><span id="quiz-progress"></span><span id="quiz-score"></span></div>
${questionHtml}
</section>
</main>
</div>
<script nonce="${cspNonce}">
const api = acquireVsCodeApi(); const answers = ${answers};
const questions = ${JSON.stringify(questions.map((q) => ({ id: q.id, points: q.points })))};
function updateSummary() {
  const answered = questions.filter(q => answers[q.id] !== undefined).length;
  const correct = questions.filter(q => answers[q.id] && answers[q.id].correct).length;
  document.getElementById('quiz-progress').textContent = '已答 ' + answered + '/' + questions.length;
  document.getElementById('quiz-score').textContent = '正确 ' + correct;
}
// 已提交状态：正确项标 is-answer，选错的那项标 is-wrong-pick，锁定输入。
function markSubmitted(box, state) {
  box.querySelectorAll('.course-quiz-option').forEach(label => {
    const input = label.querySelector('input');
    const value = Number(input.value);
    input.checked = value === state.selected;
    input.disabled = true;
    label.classList.toggle('is-answer', value === state.answer);
    label.classList.toggle('is-wrong-pick', value === state.selected && value !== state.answer);
  });
  box.querySelector('.course-quiz-options').classList.add('is-submitted');
  box.querySelector('.course-quiz-submit').hidden = true;
  box.querySelector('.course-quiz-retry').hidden = false;
  // 已经知道答案了，提示没必要再占位置。
  const hintSlot = box.querySelector('.course-quiz-hint-slot');
  if (hintSlot) hintSlot.hidden = true;
  const feedback = box.querySelector('.course-quiz-feedback');
  feedback.hidden = false;
  feedback.className = 'course-quiz-feedback ' + (state.correct ? 'is-correct' : 'is-wrong');
  if (state.html) feedback.innerHTML = state.html;
}

function refreshQuestion(id, state) {
  const box = document.querySelector('[data-question="' + id + '"]');
  if (box) markSubmitted(box, state);
}

document.querySelectorAll('.course-quiz-submit').forEach(button => button.addEventListener('click', () => {
  const box = button.closest('[data-question]');
  const input = box.querySelector('input:checked');
  if (!input) return;
  api.postMessage({ type: 'quizAnswer', questionId: box.dataset.question, selected: Number(input.value) });
}));

document.querySelectorAll('.course-quiz-retry').forEach(button => button.addEventListener('click', () => {
  const box = button.closest('[data-question]');
  box.querySelectorAll('.course-quiz-option').forEach(label => {
    const input = label.querySelector('input');
    input.disabled = false;
    input.checked = false;
    label.classList.remove('is-answer', 'is-wrong-pick');
  });
  box.querySelector('.course-quiz-options').classList.remove('is-submitted');
  box.querySelector('.course-quiz-submit').hidden = false;
  button.hidden = true;
  const hintSlot = box.querySelector('.course-quiz-hint-slot');
  if (hintSlot) hintSlot.hidden = false;
  box.querySelector('.course-quiz-feedback').hidden = true;
}));
window.addEventListener('message', event => { if (event.data.type === 'quizResult') { answers[event.data.questionId] = event.data.state; refreshQuestion(event.data.questionId, event.data.state); updateSummary(); if (event.data.completed) { document.getElementById('quiz-badge').textContent = '已完成'; document.getElementById('quiz-badge').className = 'badge passed'; } } });
Object.entries(answers).forEach(([id, state]) => refreshQuestion(id, state)); updateSummary();
</script></body></html>`;
}

/** 选项字母：0 → A、1 → B…… 与网页版 optionLabel 一致。 */
function optionLabel(index: number): string {
  return String.fromCharCode(65 + index);
}

/**
 * 渲染一道题。
 *
 * 类名与结构对齐 .vitepress/theme/components/QuizSet.vue，这样两端的视觉语言
 * 一致：已提交后正确项标 is-answer，选错的那项标 is-wrong-pick。
 */
function renderQuizQuestion(
  question: QuizQuestionView,
  index: number,
  state?: QuizProgress["answers"][string],
): string {
  const submitted = Boolean(state);

  const options = question.options
    .map((_, optionIndex) => {
      const classes = ["course-quiz-option"];
      if (submitted) {
        if (optionIndex === question.answer) classes.push("is-answer");
        else if (optionIndex === state?.selected) classes.push("is-wrong-pick");
      }
      const checked = state?.selected === optionIndex ? " checked" : "";
      return `<div class="course-quiz-option-row"><label class="${classes.join(" ")}">
<input type="radio" name="${escapeHtml(question.id)}" value="${optionIndex}"${checked}${submitted ? " disabled" : ""} />
<span class="course-quiz-option-mark" aria-hidden="true">${optionLabel(optionIndex)}</span>
<span class="course-quiz-option-text course-quiz-rich">${question.optionHtml[optionIndex]}</span>
</label></div>`;
    })
    .join("\n");

  const code = question.code
    ? `<div class="course-quiz-code"><div class="course-quiz-code-bar" aria-hidden="true"><span></span><span></span><span></span></div><div class="course-quiz-code-body"><pre><code>${escapeHtml(question.code)}</code></pre></div></div>`
    : "";

  // 提示只在未提交时显示，和网页版一致 —— 已经知道答案了就没必要再给提示。
  const hint = question.hintHtml && !submitted
    ? `<details class="course-quiz-hint"><summary>查看提示</summary><div class="course-quiz-rich">${question.hintHtml}</div></details>`
    : "";

  const points = question.points ? `<span class="course-quiz-meta">${question.points} 分</span>` : "";

  return `<article class="course-quiz-question" data-question="${escapeHtml(question.id)}">
<header class="course-quiz-heading">
<span class="course-quiz-number">第 ${index + 1} 题</span>
<div class="course-quiz-heading-content">${points}
<div class="course-quiz-stem course-quiz-rich">${question.stemHtml}</div>
</div>
</header>
${code}
<div class="course-quiz-hint-slot">${hint}</div>
<fieldset class="course-quiz-options${submitted ? " is-submitted" : ""}">
<legend class="course-sr-only">请选择一个答案</legend>
${options}
</fieldset>
<div class="course-quiz-actions">
<button type="button" class="course-button course-button-primary course-quiz-submit"${submitted ? " hidden" : ""}>提交本题</button>
<button type="button" class="course-button course-button-secondary course-quiz-retry"${submitted ? "" : " hidden"}>重新作答</button>
</div>
<div class="course-quiz-feedback ${state?.correct ? "is-correct" : "is-wrong"}"${submitted ? "" : " hidden"}>${
    state ? renderFeedbackBody(question, state.correct) : ""
  }</div>
</article>`;
}

/** 反馈区正文：判定 + 正确答案 + 题解。提交后由脚本替换，所以单独抽出来。 */
function renderFeedbackBody(question: QuizQuestionView, correct: boolean): string {
  return `<p class="course-quiz-feedback-heading">${correct ? "回答正确" : "回答错误"}</p>
<p class="course-quiz-answer">正确答案：<strong>${optionLabel(question.answer)}</strong> <span class="course-quiz-rich">${question.optionHtml[question.answer]}</span></p>
<div class="course-quiz-explanation"><strong class="course-quiz-explanation-title">题解</strong><div class="course-quiz-rich">${question.explanationHtml}</div></div>`;
}

/**
 * 提交一题后回填反馈区的 HTML。
 *
 * 收的是已渲染的视图而不是原始 question —— 题解和选项里可能有 Markdown 与公式，
 * 用原始文本会退化成纯文本。
 */
export function renderQuizFeedbackHtml(question: QuizQuestionView, selected: number): string {
  return renderFeedbackBody(question, selected === question.answer);
}

/** 上/下一题的跳转目标。序列两端时对应字段为 undefined,按钮置灰。 */
export interface PanelNav {
  prev?: { name: string; title: string };
  next?: { name: string; title: string };
}

interface PanelOptions {
  webview: vscode.Webview;
  extensionPath: string;
  lab: ProgramLab;
  readmeHtml: string;
  cases: LoadedCase[];
  progress: LabProgress | undefined;
  nav: PanelNav;
}

export function renderPanelHtml(options: PanelOptions): string {
  const { webview, extensionPath, lab, readmeHtml, cases, progress, nav } = options;
  const cspNonce = nonce();
  const initialInspectorOpen = Boolean(progress?.lastSubmission);
  const initialInspectorTab = initialInspectorOpen ? "result" : "cases";

  const styleUri = webview.asWebviewUri(
    vscode.Uri.file(path.join(extensionPath, "media", "panel.css")),
  );
  // KaTeX 样式与字体已复制到 media/，这样打包后不依赖 node_modules。
  const katexCssUri = webview.asWebviewUri(
    vscode.Uri.file(path.join(extensionPath, "media", "katex", "katex.min.css")),
  );

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8" />
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} data:; style-src ${webview.cspSource}; font-src ${webview.cspSource}; script-src 'nonce-${cspNonce}';" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<link rel="stylesheet" href="${katexCssUri}" />
<link rel="stylesheet" href="${styleUri}" />
<title>${escapeHtml(lab.title)}</title>
</head>
<body class="program-body">
<div class="lab-page program-page">
<div class="program-scroll-region">
${renderHeader(lab, progress)}
<div class="lab-workspace${initialInspectorOpen ? "" : " is-inspector-collapsed"}">
  <main class="lab-reading-surface" aria-label="题面">
    <article class="readme">${readmeHtml}</article>
  </main>
  ${renderInspector(cases, progress, initialInspectorOpen, initialInspectorTab)}
</div>
</div>
${renderToolbar(nav)}
</div>
<script nonce="${cspNonce}">
const vscodeApi = acquireVsCodeApi();
const submitButton = document.getElementById("submit");
const result = document.getElementById("result");
const workspace = document.querySelector(".lab-workspace");
const inspector = document.getElementById("inspector");
const inspectorContent = document.getElementById("inspector-content");
const inspectorToggle = document.getElementById("inspector-toggle");
const inspectorToggleText = document.querySelector(".inspector-toggle-text");
const inspectorTabs = Array.from(document.querySelectorAll("[data-inspector-tab]"));
const inspectorPanes = Array.from(document.querySelectorAll("[data-inspector-pane]"));
const actionbar = document.querySelector(".lab-actionbar");
const programPage = document.querySelector(".program-page");
const readingSurface = document.querySelector(".lab-reading-surface");
const initialInspectorOpen = ${initialInspectorOpen};
const initialInspectorTab = "${initialInspectorTab}";

function post(type) { vscodeApi.postMessage({ type }); }

function syncActionbarLayout() {
  if (!actionbar || !programPage || !readingSurface) return;
  const surfaceRect = readingSurface.getBoundingClientRect();
  const horizontalInset = Math.min(14, Math.max(10, surfaceRect.width * 0.025));
  actionbar.style.left = \`\${surfaceRect.left + horizontalInset}px\`;
  actionbar.style.right = "auto";
  actionbar.style.width = \`\${Math.max(0, surfaceRect.width - horizontalInset * 2)}px\`;
  const reserve = Math.ceil(actionbar.getBoundingClientRect().height + 32);
  programPage.style.setProperty("--lab-actionbar-reserve", \`\${reserve}px\`);
}

if (actionbar && programPage && readingSurface) {
  syncActionbarLayout();
  if (typeof ResizeObserver !== "undefined") {
    const actionbarObserver = new ResizeObserver(syncActionbarLayout);
    actionbarObserver.observe(actionbar);
    actionbarObserver.observe(readingSurface);
  } else {
    window.addEventListener("resize", syncActionbarLayout);
  }
}

function setInspectorOpen(open) {
  if (!inspector || !inspectorContent || !inspectorToggle) return;
  inspector.classList.toggle("is-collapsed", !open);
  if (workspace) workspace.classList.toggle("is-inspector-collapsed", !open);
  inspectorContent.hidden = !open;
  inspectorToggle.setAttribute("aria-expanded", String(open));
  inspectorToggle.setAttribute("aria-label", open ? "收起结果与测试用例" : "展开结果与测试用例");
  if (inspectorToggleText) inspectorToggleText.textContent = open ? "收起" : "展开";
}

function setInspectorTab(tab) {
  const activeTab = tab === "cases" ? "cases" : "result";
  inspectorTabs.forEach(button => {
    const selected = button.dataset.inspectorTab === activeTab;
    button.classList.toggle("is-active", selected);
    button.setAttribute("aria-selected", String(selected));
    button.tabIndex = selected ? 0 : -1;
  });
  inspectorPanes.forEach(pane => {
    pane.hidden = pane.dataset.inspectorPane !== activeTab;
  });
}

if (inspectorToggle) {
  inspectorToggle.addEventListener("click", () => {
    setInspectorOpen(inspectorToggle.getAttribute("aria-expanded") !== "true");
  });
}

inspectorTabs.forEach((button, index) => {
  button.addEventListener("click", () => {
    setInspectorTab(button.dataset.inspectorTab);
  });
  button.addEventListener("keydown", event => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const offset = event.key === "ArrowLeft" ? -1 : event.key === "ArrowRight" ? 1 : 0;
    const nextIndex = event.key === "Home" ? 0 : event.key === "End" ? inspectorTabs.length - 1 : (index + offset + inspectorTabs.length) % inspectorTabs.length;
    const nextTab = inspectorTabs[nextIndex];
    setInspectorTab(nextTab.dataset.inspectorTab);
    nextTab.focus();
  });
});

setInspectorTab(initialInspectorTab);
setInspectorOpen(initialInspectorOpen);

submitButton.addEventListener("click", () => post("submit"));
document.getElementById("open-source").addEventListener("click", () => post("openSource"));
document.getElementById("history").addEventListener("click", () => post("showHistory"));

// 上/下一题:disabled 的按钮不发消息,data-target 是目标 lab 的目录名。
for (const id of ["nav-prev", "nav-next"]) {
  const button = document.getElementById(id);
  if (!button) continue;
  button.addEventListener("click", () => {
    if (button.disabled || !button.dataset.target) return;
    vscodeApi.postMessage({ type: "navigate", labName: button.dataset.target });
  });
}

window.addEventListener("message", (event) => {
  const message = event.data;
  if (message.type === "submitting") {
    setInspectorTab("result");
    setInspectorOpen(true);
    submitButton.disabled = true;
    submitButton.textContent = "判题中…";
    result.innerHTML = '<p class="pending">正在编译并运行测试用例…</p>';
    return;
  }
  if (message.type === "result") {
    setInspectorTab("result");
    setInspectorOpen(true);
    submitButton.disabled = false;
    submitButton.textContent = "提交";
    result.innerHTML = message.html;
    const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
    result.scrollIntoView({ behavior, block: "nearest" });
    return;
  }
  if (message.type === "submitFailed") {
    setInspectorTab("result");
    setInspectorOpen(true);
    submitButton.disabled = false;
    submitButton.textContent = "提交";
    result.innerHTML = '<p class="error">提交失败：' + message.message + '</p>';
    return;
  }
  if (message.type === "submitAborted") {
    submitButton.disabled = false;
    submitButton.textContent = "提交";
    result.innerHTML = "";
  }
});
</script>
</body>
</html>`;
}

interface ProjectPanelOptions {
  webview: vscode.Webview;
  extensionPath: string;
  lab: ProjectLab;
  readmeHtml: string;
  progress: ProjectProgress | undefined;
  nav: PanelNav;
}

/** Project 面板：题面、task 图和自动判题结果各自保留层级，不压平成 program 表格。 */
export function renderProjectPanelHtml(options: ProjectPanelOptions): string {
  const { webview, extensionPath, lab, readmeHtml, progress, nav } = options;
  const cspNonce = nonce();
  const initialInspectorOpen = Boolean(progress?.lastSubmission);
  const styleUri = webview.asWebviewUri(
    vscode.Uri.file(path.join(extensionPath, "media", "panel.css")),
  );
  const katexCssUri = webview.asWebviewUri(
    vscode.Uri.file(path.join(extensionPath, "media", "katex", "katex.min.css")),
  );
  const taskHtml = lab.tasks
    .map((task) => renderProjectTask(task, lab.studentFiles.filter((file) => file.taskId === task.id)))
    .join("\n");
  const resultHtml = progress?.lastSubmission
    ? renderStoredProjectResult(progress.lastSubmission)
    : '<p class="inspector-empty">提交后，Project 的自动判题结果会按 task、case 和 CTest 展示在这里。</p>';

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8" />
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} data:; style-src ${webview.cspSource}; font-src ${webview.cspSource}; script-src 'nonce-${cspNonce}';" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<link rel="stylesheet" href="${katexCssUri}" />
<link rel="stylesheet" href="${styleUri}" />
<title>${escapeHtml(lab.title)}</title>
</head>
<body class="project-body">
<div class="lab-page project-page">
<div class="project-scroll-region">
${renderProjectHeader(lab, progress)}
<div class="lab-workspace project-workspace${initialInspectorOpen ? "" : " is-inspector-collapsed"}">
  <main class="lab-reading-surface" aria-label="Project 题面与任务">
    <article class="readme">${readmeHtml}</article>
    <section class="project-task-overview" aria-labelledby="project-task-title">
      <div class="project-section-heading"><span class="project-eyebrow">PROJECT TASK GRAPH</span><h2 id="project-task-title">任务与学生文件</h2></div>
      ${taskHtml}
    </section>
  </main>
  ${renderProjectInspector(resultHtml, initialInspectorOpen)}
</div>
</div>
${renderProjectToolbar(nav)}
</div>
<script nonce="${cspNonce}">
const vscodeApi = acquireVsCodeApi();
const submitButton = document.getElementById("submit");
const result = document.getElementById("project-result");
const workspace = document.querySelector(".project-workspace");
const inspector = document.getElementById("project-inspector");
const inspectorContent = document.getElementById("project-inspector-content");
const inspectorToggle = document.getElementById("project-inspector-toggle");
const actionbar = document.querySelector(".lab-actionbar");
const projectPage = document.querySelector(".project-page");
const readingSurface = document.querySelector(".lab-reading-surface");

function syncActionbarLayout() {
  if (!actionbar || !projectPage || !readingSurface) return;
  const surfaceRect = readingSurface.getBoundingClientRect();
  const horizontalInset = Math.min(14, Math.max(10, surfaceRect.width * 0.025));
  actionbar.style.left = \`\${surfaceRect.left + horizontalInset}px\`;
  actionbar.style.right = "auto";
  actionbar.style.width = \`\${Math.max(0, surfaceRect.width - horizontalInset * 2)}px\`;
  projectPage.style.setProperty("--lab-actionbar-reserve", \`\${Math.ceil(actionbar.getBoundingClientRect().height + 32)}px\`);
}

function setInspectorOpen(open) {
  if (!inspector || !inspectorContent || !inspectorToggle) return;
  inspector.classList.toggle("is-collapsed", !open);
  if (workspace) workspace.classList.toggle("is-inspector-collapsed", !open);
  inspectorContent.hidden = !open;
  inspectorToggle.setAttribute("aria-expanded", String(open));
  inspectorToggle.setAttribute("aria-label", open ? "收起自动判题结果" : "展开自动判题结果");
  inspectorToggle.querySelector(".inspector-toggle-text").textContent = open ? "收起" : "展开";
}

if (actionbar && projectPage && readingSurface) {
  syncActionbarLayout();
  if (typeof ResizeObserver !== "undefined") {
    const observer = new ResizeObserver(syncActionbarLayout);
    observer.observe(actionbar);
    observer.observe(readingSurface);
  } else {
    window.addEventListener("resize", syncActionbarLayout);
  }
}

submitButton.addEventListener("click", () => vscodeApi.postMessage({ type: "submit" }));
document.getElementById("open-source").addEventListener("click", () => vscodeApi.postMessage({ type: "openSource" }));
document.querySelectorAll("[data-project-file]").forEach(button => button.addEventListener("click", () => {
  vscodeApi.postMessage({ type: "openProjectFile", filePath: button.dataset.projectFile });
}));
if (inspectorToggle) inspectorToggle.addEventListener("click", () => {
  setInspectorOpen(inspectorToggle.getAttribute("aria-expanded") !== "true");
});
for (const id of ["nav-prev", "nav-next"]) {
  const button = document.getElementById(id);
  if (!button) continue;
  button.addEventListener("click", () => {
    if (button.disabled || !button.dataset.target) return;
    vscodeApi.postMessage({ type: "navigate", labName: button.dataset.target });
  });
}

window.addEventListener("message", event => {
  const message = event.data;
  if (message.type === "submitting") {
    setInspectorOpen(true);
    submitButton.disabled = true;
    submitButton.textContent = "判题中…";
    result.innerHTML = '<p class="pending">正在保存学生文件，并运行 Project 的自动任务…</p>';
  } else if (message.type === "projectResult") {
    setInspectorOpen(true);
    submitButton.disabled = false;
    submitButton.textContent = "提交 Project";
    result.innerHTML = message.html;
    result.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "nearest" });
  } else if (message.type === "projectSubmitFailed") {
    setInspectorOpen(true);
    submitButton.disabled = false;
    submitButton.textContent = "提交 Project";
    result.innerHTML = '<p class="error">提交失败：' + message.message + '</p>';
  } else if (message.type === "projectSubmitAborted") {
    submitButton.disabled = false;
    submitButton.textContent = "提交 Project";
  }
});
setInspectorOpen(${initialInspectorOpen});
</script>
</body>
</html>`;
}

function renderProjectHeader(lab: ProjectLab, progress: ProjectProgress | undefined): string {
  const meta = [
    lab.difficulty && `难度 ${escapeHtml(lab.difficulty)}`,
    lab.duration && `预计 ${escapeHtml(lab.duration)}`,
    `题号 ${escapeHtml(lab.id)}`,
    `第 ${lab.chapter} 章 · ${escapeHtml(lab.chapterTitle)}`,
  ].filter(Boolean).join(" · ");
  const badge = !progress || progress.submissionCount === 0
    ? '<span class="badge fresh">Project · 未提交</span>'
    : progress.internalError
      ? '<span class="badge attempted">评测内部错误</span>'
      : projectProgressPassed(progress)
      ? '<span class="badge passed">已完成</span>'
      : progress.automatedFull && progress.manualPending > 0
        ? '<span class="badge attempted">自动通过 · 待人工</span>'
        : `<span class="badge attempted">自动 ${formatNumber(progress.automatedScore)}/${formatNumber(progress.automatedMax)}</span>`;
  return `<header class="lab-header"><div class="title-row"><h1>${escapeHtml(lab.title)}</h1>${badge}</div><p class="meta">${meta}</p></header>`;
}

function renderProjectTask(task: ProjectTask, files: ProjectLab["studentFiles"]): string {
  const kindLabel = task.kind === "stdio" ? "stdio 自动判题" : task.kind === "ctest" ? "CTest 自动判题" : "人工评审";
  const dependencies = task.dependsOn.length ? task.dependsOn.map((id) => `<code>${escapeHtml(id)}</code>`).join("、") : "无";
  const fileHtml = files.length === 0
    ? '<span class="project-empty">暂无学生文件</span>'
    : files.map((file) => `<button type="button" class="project-file-button" data-project-file="${escapeHtml(file.relativePath)}"><code>${escapeHtml(file.relativePath)}</code><span>打开</span></button>`).join("");
  let details = "";
  if (task.kind === "stdio") {
    const cases = task.cases ?? [];
    details = cases.length === 0
      ? '<p class="project-empty">没有可展示的公开 case。</p>'
      : `<div class="project-task-cases"><h4>公开 case（${cases.length} 个）</h4>${cases.map(renderProjectCase).join("")}</div>`;
  } else if (task.kind === "ctest") {
    const tests = task.ctestTests ?? [];
    details = `<div class="project-task-tests"><h4>CTest 测试（${tests.length} 个）</h4><div class="project-test-list">${tests.map((test) => `<span class="project-test-chip"><code>${escapeHtml(test.name)}</code><span>${formatNumber(test.points)} 分</span></span>`).join("")}</div></div>`;
  } else {
    const checklist = task.checklist ?? [];
    details = `<div class="project-manual"><span class="project-pending">PENDING · 待人工</span><ul>${checklist.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></div>`;
  }

  return `<article class="project-task-card project-task-${task.kind}">
  <header class="project-task-header"><div><span class="project-task-id">${escapeHtml(task.id)}</span><span class="project-task-kind">${kindLabel}</span></div><strong>${formatNumber(task.weight)} 分</strong></header>
  <dl class="project-task-meta"><div><dt>路径</dt><dd><code>${escapeHtml(task.relativePath)}</code></dd></div><div><dt>依赖</dt><dd>${dependencies}</dd></div></dl>
  <div class="project-task-files"><h4>学生文件</h4>${fileHtml}</div>
  ${details}
</article>`;
}

function renderProjectCase(testCase: LoadedCase): string {
  return `<details class="case project-case"${testCase.tags?.includes("sample") ? " open" : ""}><summary><code>${escapeHtml(testCase.id)}</code><span class="points">${formatNumber(testCase.points)} 分</span></summary><div class="io"><div><h5>输入</h5><pre>${escapeHtml(testCase.inputText)}</pre></div><div><h5>期望输出</h5><pre>${escapeHtml(testCase.expectedText)}</pre></div></div></details>`;
}

function renderProjectInspector(resultHtml: string, initialOpen: boolean): string {
  return `<aside id="project-inspector" class="lab-inspector${initialOpen ? "" : " is-collapsed"}" aria-label="自动判题结果"><div class="inspector-header"><div class="inspector-title-group"><span class="inspector-eyebrow">检查器</span><h2 class="inspector-title">自动判题结果</h2></div><button id="project-inspector-toggle" class="inspector-toggle" type="button" aria-expanded="${initialOpen}" aria-controls="project-inspector-content" aria-label="${initialOpen ? "收起自动判题结果" : "展开自动判题结果"}"><span class="inspector-toggle-glyph" aria-hidden="true"></span><span class="inspector-toggle-text">${initialOpen ? "收起" : "展开"}</span></button></div><div id="project-inspector-content" class="inspector-content"${initialOpen ? "" : " hidden"}><div id="project-result" class="result" aria-live="polite">${resultHtml}</div></div></aside>`;
}

function renderProjectToolbar(nav: PanelNav): string {
  const prev = nav.prev
    ? `<button id="nav-prev" class="lab-button lab-button-secondary lab-button-nav" type="button" data-target="${escapeHtml(nav.prev.name)}" title="${escapeHtml(nav.prev.title)}">上一题</button>`
    : '<button id="nav-prev" class="lab-button lab-button-secondary lab-button-nav" type="button" disabled title="已经是第一题">上一题</button>';
  const next = nav.next
    ? `<button id="nav-next" class="lab-button lab-button-secondary lab-button-nav" type="button" data-target="${escapeHtml(nav.next.name)}" title="${escapeHtml(nav.next.title)}">下一题</button>`
    : '<button id="nav-next" class="lab-button lab-button-secondary lab-button-nav" type="button" disabled title="已经是最后一题">下一题</button>';
  return `<nav class="lab-actionbar" aria-label="Project 操作"><div class="lab-actionbar-main"><button id="submit" class="lab-button lab-button-primary" type="button">提交 Project</button><button id="open-source" class="lab-button lab-button-secondary" type="button">选择学生文件</button></div><div class="lab-actionbar-nav">${prev}${next}</div></nav>`;
}

function renderProjectResultTask(task: ProjectTaskSubmissionSummary): string {
  const score = task.kind === "manual"
    ? `<span class="project-pending">PENDING · ${formatNumber(task.weight)} 分待人工</span>`
    : `<span>${verdictLabel(task.status)} · ${formatNumber(task.score ?? 0)}/${formatNumber(task.maxScore ?? 0)} · 加权 ${formatNumber(task.weightedScore)}/${formatNumber(task.weight)}</span>`;
  let nested = "";
  if (task.kind === "stdio") {
    const rows = (task.cases ?? []).map((item) => {
      const difference = item.comparison?.difference;
      const detail = difference && !item.comparison?.equal
        ? `<tr class="difference"><td colspan="4">首处差异：${difference.kind === "token" ? `第 ${difference.index} 个 token` : `第 ${difference.line} 行第 ${difference.column} 列`} · 期望 <code>${escapeHtml(JSON.stringify(difference.expected))}</code> · 实际 <code>${escapeHtml(JSON.stringify(difference.actual))}</code></td></tr>`
        : "";
      const stderr = item.stderr?.trim()
        ? `<tr class="stderr-row"><td colspan="4"><details><summary>stderr</summary><pre>${escapeHtml(item.stderr.trim().slice(0, 1000))}</pre></details></td></tr>`
        : "";
      return `<tr class="verdict-${item.verdict}"><td><code>${escapeHtml(item.id)}</code></td><td class="verdict">${item.verdict}</td><td class="num">${Math.round(item.durationMs)} ms</td><td class="num">${formatNumber(item.points)}/${formatNumber(item.maxPoints)}</td></tr>${detail}${stderr}`;
    }).join("");
    const diagnostic = task.diagnostic?.trim()
      ? `<pre class="diagnostic project-diagnostic">${escapeHtml(task.diagnostic.trim().slice(0, 4000))}</pre>`
      : "";
    nested = `${diagnostic}${rows ? `<table class="cases-table project-result-table"><thead><tr><th>case</th><th>结果</th><th>耗时</th><th>得分</th></tr></thead><tbody>${rows}</tbody></table>` : ""}`;
  } else if (task.kind === "ctest") {
    const rows = (task.tests ?? []).map((item) => {
      const output = item.output?.trim()
        ? `<tr class="stderr-row"><td colspan="4"><details><summary>CTest output</summary><pre>${escapeHtml(item.output.trim().slice(0, 2000))}</pre></details></td></tr>`
        : "";
      return `<tr class="verdict-${item.verdict}"><td><code>${escapeHtml(item.name)}</code></td><td class="verdict">${item.verdict}</td><td class="num">${Math.round(item.durationMs)} ms</td><td class="num">${formatNumber(item.points)}/${formatNumber(item.maxPoints)}</td></tr>${output}`;
    }).join("");
    const build = task.buildFailed
      ? `<p class="project-build-status">构建失败（${task.buildPhase === "configure" ? "配置" : "编译"}），CTest 未运行。</p>`
      : "";
    nested = `${build}${rows ? `<table class="cases-table project-result-table"><thead><tr><th>CTest</th><th>结果</th><th>耗时</th><th>得分</th></tr></thead><tbody>${rows}</tbody></table>` : ""}`;
  } else {
    nested = `<ul class="project-result-checklist">${(task.checklist ?? []).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
  }
  return `<section class="project-task-result"><div class="project-task-result-heading"><code>${escapeHtml(task.id)}</code>${score}</div>${nested}</section>`;
}

function renderProjectResultSummary(
  summary: Pick<ProjectSubmissionSummary, "at" | "automatedScore" | "automatedMax" | "manualPending" | "provisionalTotal" | "total" | "automatedFull" | "internalError" | "tasks">,
  submissionCount?: number,
): string {
  const finalPassed = projectProgressPassed(summary);
  const pendingManual = summary.manualPending > 0;
  const className = finalPassed ? "passed" : summary.internalError ? "failed" : "pending";
  const headline = summary.internalError
    ? "评测内部错误"
    : finalPassed
      ? "Project 完成"
      : summary.automatedFull && pendingManual
        ? "自动通过 · 待人工"
        : "自动部分未满";
  return `<div class="summary ${className}"><h3>${headline}</h3><div class="project-score-grid"><span><strong>Automated</strong>${formatNumber(summary.automatedScore)}/${formatNumber(summary.automatedMax)}</span><span><strong>Manual pending</strong>${formatNumber(summary.manualPending)}</span><span><strong>Provisional total</strong>${formatNumber(summary.provisionalTotal)}/${formatNumber(summary.total)}</span></div><p>${submissionCount ? `第 ${submissionCount} 次提交 · ` : ""}${escapeHtml(new Date(summary.at).toLocaleString())}</p>${summary.tasks.map(renderProjectResultTask).join("")}</div>`;
}

function renderStoredProjectResult(summary: ProjectSubmissionSummary): string {
  return renderProjectResultSummary(summary, undefined);
}

/** 一次 Project 提交的完整嵌套结果。 */
export function renderProjectResultHtml(result: ProjectScoreResult, progress: ProjectProgress): string {
  return renderProjectResultSummary({ ...result, at: new Date().toISOString(), tasks: result.tasks.map((task) => {
    if (task.kind === "manual") return { ...task, checklist: [...task.checklist] };
    if (task.kind === "stdio") return {
      ...task,
      cases: task.judge.cases.map((item) => ({ id: item.id, verdict: item.verdict, points: item.points, maxPoints: item.maxPoints, durationMs: item.durationMs, stderr: item.stderr, comparison: item.comparison })),
      diagnostic: (task.judge.compilation.stderr || task.judge.compilation.stdout).trim() || undefined,
    };
    return {
      ...task,
      tests: task.tests.map((item) => ({ name: item.name, verdict: item.verdict, points: item.points, maxPoints: item.maxPoints, durationMs: item.durationMs, output: item.output })),
      buildFailed: task.build ? !task.build.ok : undefined,
      buildPhase: task.build?.phase,
    };
  }) }, progress.submissionCount);
}

function formatNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}

function renderHeader(lab: ProgramLab, progress: LabProgress | undefined): string {
  const meta = [
    lab.difficulty && `难度 ${escapeHtml(lab.difficulty)}`,
    lab.duration && `预计 ${escapeHtml(lab.duration)}`,
    `题号 ${escapeHtml(lab.id)}`,
    `第 ${lab.chapter} 章 · ${escapeHtml(lab.chapterTitle)}`,
  ]
    .filter(Boolean)
    .join(" · ");

  const badge = progress?.passed
    ? '<span class="badge passed">已通过</span>'
    : progress && progress.submissionCount > 0
      ? `<span class="badge attempted">最好 ${progress.bestScore}/${progress.maxScore}</span>`
      : '<span class="badge fresh">未提交</span>';

  return `<header class="lab-header">
  <div class="title-row"><h1>${escapeHtml(lab.title)}</h1>${badge}</div>
  <p class="meta">${meta}</p>
</header>`;
}

function renderInspector(
  cases: LoadedCase[],
  progress: LabProgress | undefined,
  initialOpen: boolean,
  initialTab: "result" | "cases",
): string {
  const resultHtml = progress?.lastSubmission
    ? renderStoredResult(progress)
    : '<p class="inspector-empty">提交后，判题状态和得分会显示在这里。</p>';
  const casesHtml = renderCases(cases);
  const resultSelected = initialTab === "result";

  return `<aside id="inspector" class="lab-inspector${initialOpen ? "" : " is-collapsed"}" aria-label="结果与测试用例">
  <div class="inspector-header">
    <div class="inspector-title-group">
      <span class="inspector-eyebrow">检查器</span>
      <h2 class="inspector-title">结果与测试用例</h2>
    </div>
    <button id="inspector-toggle" class="inspector-toggle" type="button" aria-expanded="${initialOpen}" aria-controls="inspector-content" aria-label="${initialOpen ? "收起结果与测试用例" : "展开结果与测试用例"}">
      <span class="inspector-toggle-glyph" aria-hidden="true"></span><span class="inspector-toggle-text">${initialOpen ? "收起" : "展开"}</span>
    </button>
  </div>
  <div id="inspector-content" class="inspector-content"${initialOpen ? "" : " hidden"}>
    <div class="inspector-tabs" role="tablist" aria-label="检查器内容">
      <button id="inspector-tab-result" class="inspector-tab${resultSelected ? " is-active" : ""}" type="button" role="tab" aria-selected="${resultSelected}" aria-controls="inspector-result-panel" data-inspector-tab="result" tabindex="${resultSelected ? "0" : "-1"}">结果</button>
      <button id="inspector-tab-cases" class="inspector-tab${resultSelected ? "" : " is-active"}" type="button" role="tab" aria-selected="${!resultSelected}" aria-controls="inspector-cases-panel" data-inspector-tab="cases" tabindex="${resultSelected ? "-1" : "0"}">测试用例</button>
    </div>
    <section id="inspector-result-panel" class="inspector-pane" role="tabpanel" aria-labelledby="inspector-tab-result" data-inspector-pane="result"${resultSelected ? "" : " hidden"}>
      <div id="result" class="result" aria-live="polite">${resultHtml}</div>
    </section>
    <section id="inspector-cases-panel" class="inspector-pane" role="tabpanel" aria-labelledby="inspector-tab-cases" data-inspector-pane="cases"${resultSelected ? " hidden" : ""}>
      ${casesHtml}
    </section>
  </div>
</aside>`;
}

/**
 * 操作栏。只有代码题会调到这里 —— 选择题走 renderQuizPanelHtml,
 * 所以上/下一题按钮天然不会出现在选择题面板上。
 *
 * 序列端点上对应按钮 disabled,并把目标题目的标题放进 title 属性,
 * 这样悬停就能看到要跳去哪一题,不用先点进去。
 */
function renderToolbar(nav: PanelNav): string {
  const prev = nav.prev
    ? `<button id="nav-prev" class="lab-button lab-button-secondary lab-button-nav" type="button" data-target="${escapeHtml(nav.prev.name)}" title="${escapeHtml(nav.prev.title)}">上一题</button>`
    : `<button id="nav-prev" class="lab-button lab-button-secondary lab-button-nav" type="button" disabled title="已经是第一题">上一题</button>`;
  const next = nav.next
    ? `<button id="nav-next" class="lab-button lab-button-secondary lab-button-nav" type="button" data-target="${escapeHtml(nav.next.name)}" title="${escapeHtml(nav.next.title)}">下一题</button>`
    : `<button id="nav-next" class="lab-button lab-button-secondary lab-button-nav" type="button" disabled title="已经是最后一题">下一题</button>`;

  return `<nav class="lab-actionbar" aria-label="题目操作">
  <div class="lab-actionbar-main">
    <button id="submit" class="lab-button lab-button-primary" type="button">提交</button>
    <button id="open-source" class="lab-button lab-button-secondary" type="button">打开答题文件</button>
    <button id="history" class="lab-button lab-button-secondary" type="button">提交历史</button>
  </div>
  <div class="lab-actionbar-nav">${prev}${next}</div>
</nav>`;
}

/** 公开用例。schema 中没有 hidden 字段，因此全部用例都可以展示。 */
function renderCases(cases: LoadedCase[]): string {
  if (cases.length === 0) {
    return `<section class="cases">
  <h2>测试用例</h2>
  <p class="inspector-empty">当前题目没有公开测试用例。</p>
</section>`;
  }

  const items = cases
    .map((item) => {
      const tags = (item.tags ?? []).map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("");
      return `<details class="case"${item.tags?.includes("sample") ? " open" : ""}>
  <summary><code>${escapeHtml(item.id)}</code> ${tags}<span class="points">${item.points} 分</span></summary>
  <div class="io">
    <div><h4>输入</h4><pre>${escapeHtml(item.inputText)}</pre></div>
    <div><h4>期望输出</h4><pre>${escapeHtml(item.expectedText)}</pre></div>
  </div>
</details>`;
    })
    .join("\n");

  return `<section class="cases">
  <h2>测试用例（${cases.length} 个，全部公开）</h2>
  ${items}
</section>`;
}

function verdictLabel(verdict: string): string {
  const labels: Record<string, string> = {
    AC: "通过",
    WA: "答案错误",
    TLE: "超时",
    RE: "运行错误",
    CE: "编译错误",
    OLE: "输出超限",
    IE: "评测内部错误",
  };
  return labels[verdict] ?? verdict;
}

/** 重新打开面板时显示上次提交结果，避免面板看起来像没做过。 */
function renderStoredResult(progress: LabProgress): string {
  const last = progress.lastSubmission;
  if (!last) return "";

  const rows = last.cases
    .map(
      (item) => `<tr class="verdict-${item.verdict}">
  <td><code>${escapeHtml(item.id)}</code></td>
  <td class="verdict">${item.verdict}</td>
  <td class="num">${Math.round(item.durationMs)} ms</td>
  <td class="num">${item.points}/${item.maxPoints}</td>
</tr>`,
    )
    .join("\n");

  return `<div class="summary stale">
  <h3>上次提交 · ${escapeHtml(new Date(last.at).toLocaleString())}</h3>
  <p>${verdictLabel(last.verdict)} · ${last.score}/${last.maxScore}${
    progress.passed ? " · 本题已通过" : ""
  }</p>
  ${rows ? `<table class="cases-table"><tbody>${rows}</tbody></table>` : ""}
</div>`;
}

/** 一次提交的完整结果面板。 */
export function renderResultHtml(result: ScoreResult, progress: LabProgress): string {
  if (result.verdict === "CE") {
    const diagnostic = (result.compilation.stderr || result.compilation.stdout).trim();
    return `<div class="summary failed">
  <h3>编译错误</h3>
  <pre class="diagnostic">${escapeHtml(diagnostic.slice(0, 4000))}</pre>
</div>`;
  }

  const rows = result.cases
    .map((item) => {
      const difference = item.comparison?.difference;
      const detail =
        difference && !item.comparison?.equal
          ? `<tr class="difference"><td colspan="4">
  首处差异：${
    difference.kind === "token"
      ? `第 ${difference.index} 个 token`
      : `第 ${difference.line} 行第 ${difference.column} 列`
  }
  · 期望 <code>${escapeHtml(JSON.stringify(difference.expected))}</code>
  · 实际 <code>${escapeHtml(JSON.stringify(difference.actual))}</code>
</td></tr>`
          : "";
      const stderr = item.stderr?.trim()
        ? `<tr class="stderr-row"><td colspan="4"><details><summary>stderr</summary><pre>${escapeHtml(
            item.stderr.trim().slice(0, 1000),
          )}</pre></details></td></tr>`
        : "";

      return `<tr class="verdict-${item.verdict}">
  <td><code>${escapeHtml(item.id)}</code></td>
  <td class="verdict">${item.verdict}</td>
  <td class="num">${Math.round(item.durationMs)} ms</td>
  <td class="num">${item.points}/${item.maxPoints}</td>
</tr>${detail}${stderr}`;
    })
    .join("\n");

  const passedCount = result.cases.filter((item) => item.verdict === "AC").length;
  const full = result.maxScore > 0 && result.score === result.maxScore;

  // 已经拿过绿勾但本次未满分时说明清楚，避免看起来像丢了成绩。
  const note =
    !full && progress.passed
      ? `<p class="note">本题此前已通过（最好成绩 ${progress.bestScore}/${progress.maxScore}），通过记录保留。</p>`
      : "";

  return `<div class="summary ${full ? "passed" : "failed"}">
  <h3>${full ? "通过" : verdictLabel(result.verdict)} · ${result.score}/${result.maxScore}</h3>
  <p>${passedCount}/${result.cases.length} 个用例通过 · 第 ${progress.submissionCount} 次提交</p>
  ${note}
  <table class="cases-table">
    <thead><tr><th>用例</th><th>结果</th><th>耗时</th><th>得分</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
</div>`;
}
