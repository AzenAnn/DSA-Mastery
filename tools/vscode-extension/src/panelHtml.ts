import path from "node:path";
import * as vscode from "vscode";
import type { ScoreResult } from "./cli";
import type { ProgramLab, TestCase } from "./labIndex";
import type { LabProgress } from "./progress";

type LoadedCase = TestCase & { inputText: string; expectedText: string };

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

interface PanelOptions {
  webview: vscode.Webview;
  extensionPath: string;
  lab: ProgramLab;
  readmeHtml: string;
  cases: LoadedCase[];
  progress: LabProgress | undefined;
}

export function renderPanelHtml(options: PanelOptions): string {
  const { webview, extensionPath, lab, readmeHtml, cases, progress } = options;
  const cspNonce = nonce();

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
<body>
${renderHeader(lab, progress)}
${renderToolbar()}
<section id="result" class="result" aria-live="polite">${
    progress?.lastSubmission ? renderStoredResult(progress) : ""
  }</section>
<article class="readme">${readmeHtml}</article>
${renderCases(cases)}
<script nonce="${cspNonce}">
const vscodeApi = acquireVsCodeApi();
const submitButton = document.getElementById("submit");
const result = document.getElementById("result");

function post(type) { vscodeApi.postMessage({ type }); }

submitButton.addEventListener("click", () => post("submit"));
document.getElementById("open-source").addEventListener("click", () => post("openSource"));
document.getElementById("history").addEventListener("click", () => post("showHistory"));

window.addEventListener("message", (event) => {
  const message = event.data;
  if (message.type === "submitting") {
    submitButton.disabled = true;
    submitButton.textContent = "判题中…";
    result.innerHTML = '<p class="pending">正在编译并运行测试用例…</p>';
    return;
  }
  if (message.type === "result") {
    submitButton.disabled = false;
    submitButton.textContent = "提交";
    result.innerHTML = message.html;
    result.scrollIntoView({ behavior: "smooth", block: "nearest" });
    return;
  }
  if (message.type === "submitFailed") {
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

function renderHeader(lab: ProgramLab, progress: LabProgress | undefined): string {
  const meta = [
    lab.difficulty && `难度 ${escapeHtml(lab.difficulty)}`,
    lab.duration && `预计 ${escapeHtml(lab.duration)}`,
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

function renderToolbar(): string {
  return `<nav class="toolbar">
  <button id="submit" class="primary">提交</button>
  <button id="open-source">打开答题文件</button>
  <button id="history">提交历史</button>
</nav>`;
}

/** 公开用例。schema 中没有 hidden 字段，因此全部用例都可以展示。 */
function renderCases(cases: LoadedCase[]): string {
  if (cases.length === 0) return "";

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
