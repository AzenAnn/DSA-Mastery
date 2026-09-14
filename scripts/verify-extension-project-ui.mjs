import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { cp, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { DatabaseSync } from "node:sqlite";
import { chromium } from "@playwright/test";

const stage = process.argv[2] ?? "new";
const repo = path.resolve(import.meta.dirname, "..");
const root = path.join(repo, ".lab-cache", "extension-review");
const workspace = path.join(root, "workspace with spaces");
const bridge = path.join(root, `bridge-${stage}-${Date.now()}`);
const userData = path.join(root, "upgrade-user-data");
const extensions = path.join(root, "upgrade-extensions");
const projectRelative = "labs/chapter-02/project/P-02-04-expression-evaluator";
const project = path.join(workspace, projectRelative);
assert(["old", "new", "reload", "rollback"].includes(stage));
const version = ["new", "reload"].includes(stage) ? "0.1.13" : "0.1.12";
const extension = (await readdir(extensions)).find((name) => name.startsWith(`dsa-mastery.dsa-mastery-labs-${version}`));
assert(extension, `Install ${version} into ${extensions} first`);
const code = process.env.DSA_CODE_EXE ?? "C:/Microsoft VS Code/Code.exe";
const port = Number(process.env.DSA_CODE_DEBUG_PORT ?? 9338);
await mkdir(bridge, { recursive: true });
await mkdir(workspace, { recursive: true });
const helper = path.join(extensions, "dsa-test.host-driver-0.0.1");
await mkdir(helper, { recursive: true });
await cp(path.join(repo, "tools/vscode-extension/test/host/driver.cjs"), path.join(helper, "driver.cjs"));
await writeFile(path.join(helper, "package.json"), JSON.stringify({ name: "host-driver", publisher: "dsa-test", version: "0.0.1", engines: { vscode: "^1.90.0" },
  main: "driver.cjs", activationEvents: ["onStartupFinished"], capabilities: { untrustedWorkspaces: { supported: true } } }));
if (stage === "old") {
  for (const relative of ["tools/lab", "schemas", projectRelative, "labs/chapter-01/theory/T-01-01-sequential-list-quiz", "labs/chapter-01/exercise/E-01-01-sequential-list-deduplication"]) {
    await cp(path.join(repo, relative), path.join(workspace, relative), { recursive: true, filter: (file) => !file.split(path.sep).includes(".lab-cache") });
  }
  await writeFile(path.join(workspace, "labs/index.md"), "# Isolated extension fixture\n");
}
if (stage === "new") {
  await cp(path.join(repo, projectRelative, "tasks/task-01-stack/student/stack.cpp"), path.join(project, "tasks/task-01-stack/student/stack.cpp"));
  await cp(path.join(repo, "tools/lab"), path.join(workspace, "tools/lab"), { recursive: true });
}
let sequence = 0;
async function waitFor(operation, label, timeout = 60_000) {
  const start = Date.now();
  let last;
  while (Date.now() - start < timeout) {
    try { const result = await operation(); if (result) return result; } catch (error) { last = error; }
    await delay(200);
  }
  throw new Error(`Timed out: ${label}${last ? ` (${last.message})` : ""}`);
}
async function command(request, timeout = 120_000) {
  const id = `${stage}-${++sequence}`;
  await writeFile(path.join(bridge, "request.json"), JSON.stringify({ id, ...request }));
  return waitFor(async () => {
    const response = JSON.parse(await readFile(path.join(bridge, "response.json"), "utf8"));
    if (response.id !== id) return undefined;
    assert.equal(response.ok, true, response.error);
    return response;
  }, `host ${request.action} ${request.command ?? ""}`, timeout);
}
const child = spawn(code, ["--new-window", "--skip-welcome", "--skip-release-notes", "--disable-updates",
  "--user-data-dir", userData, "--extensions-dir", extensions,
  `--extensionDevelopmentPath=${helper}`,
  `--remote-debugging-port=${port}`, workspace],
{ env: { ...process.env, DSA_HOST_BRIDGE: bridge }, windowsHide: true, stdio: ["ignore", "pipe", "pipe"] });
let processLog = "";
child.stdout.on("data", (data) => { processLog += data; });
child.stderr.on("data", (data) => { processLog += data; });
let browser;
let page;
try {
  console.log(`Starting isolated installed VSIX ${version}, stage ${stage}`);
  browser = await waitFor(() => chromium.connectOverCDP(`http://127.0.0.1:${port}`), "VS Code CDP");
  page = await waitFor(() => browser.contexts()[0]?.pages().find((candidate) => candidate.url().includes("workbench")), "workbench");
  const trust = page.getByRole("button", { name: /Yes, I trust the authors/ });
  await trust.waitFor({ timeout: 15_000 }).then(() => trust.click()).catch(() => {});
  await waitFor(async () => JSON.parse(await readFile(path.join(bridge, "ready.json"), "utf8")), "extension test host");
  let inspected = await command({ action: "inspect" });
  assert.equal(inspected.result.extension, version);
  if (!inspected.result.trusted) {
    await command({ action: "command", command: "workbench.trust.manage" });
    await page.getByRole("button", { name: /^Trust$/ }).click();
    inspected = await command({ action: "inspect" });
  }
  assert.equal(inspected.result.trusted, true);
  await command({ action: "command", command: "workbench.action.closeAuxiliaryBar" });
  console.log(JSON.stringify(inspected.result));
  await command({ action: "command", command: "dsaMastery.openLab", args: ["02P04"] });
  const frame = await waitFor(() => page.frames().find((candidate) => candidate.url().includes("vscode-webview") && candidate.name() !== ""), "Project webview");
  // The actual document may be nested below VS Code's webview bootstrap frame.
  const content = await waitFor(async () => {
    for (const candidate of page.frames()) if (await candidate.locator(".project-body").count()) return candidate;
    return undefined;
  }, `Project content (${frame.url()})`);
  if (stage === "old") {
    await command({ action: "command", command: "dsaMastery.submit", args: ["02P04"] });
    await command({ action: "command", command: "dsaMastery.submit", args: ["01E01"] });
    await page.screenshot({ path: path.join(root, "old-version-progress.png") });
    console.log("PASS: old installed version discovered Project and recorded Project/Program submissions");
  } else if (stage === "new") {
    await content.locator('[data-project-readme]').first().click();
    await command({ action: "command", command: "workbench.action.closeActiveEditor" });
    await command({ action: "command", command: "dsaMastery.openLab", args: ["02P04"] });
    await waitFor(() => content.isDetached(), "previous Project frame unloaded");
    const currentFrame = await waitFor(async () => {
      for (const candidate of page.frames()) if (await candidate.locator('[data-current-task="stack"]').count()) return candidate;
    }, "current task table");
    await currentFrame.locator('[data-project-file="tasks/task-01-stack/student/stack.cpp"]').click();
    await waitFor(async () => /stack\.cpp$/.test((await command({ action: "inspect" })).result.activeFile ?? ""), "student editor opened");
    await command({ action: "command", command: "workbench.action.closeSidebar" });
    await currentFrame.locator('[data-current-task="stack"] [data-task-submit]').click();
    await waitFor(async () => await currentFrame.locator('[data-current-task="stack"]').getAttribute("data-status") === "WA", "stack failure feedback");
    await waitFor(async () => !(await currentFrame.locator("#submit").isDisabled()), "single task completion");
    const saved = JSON.parse(await readFile(path.join(project, ".lab-cache/project-results-student.json"), "utf8"));
    assert.equal(saved.tasks.stack.result.status, "WA");
    assert(await currentFrame.locator("#project-result").innerText().then((text) => text.includes("stack-lifo")));
    await page.screenshot({ path: path.join(root, "project-failure-desktop.png") });
    const stack = path.join(project, "tasks/task-01-stack/student/stack.cpp");
    const reference = await readFile(path.join(project, "tasks/task-01-stack/solution/stack.cpp"), "utf8");
    await command({ action: "editor", file: stack, text: reference, save: false });
    await waitFor(async () => await currentFrame.locator('[data-current-task="stack"]').getAttribute("data-status") === "STALE", "unsaved upstream invalidation");
    await currentFrame.locator('[data-current-task="stack"] [data-task-submit]').click();
    await waitFor(async () => await currentFrame.locator('[data-current-task="stack"]').getAttribute("data-status") === "AC", "save and retry stack pass");
    await waitFor(async () => !(await currentFrame.locator("#submit").isDisabled()), "retry completion");
    assert.equal((await command({ action: "inspect" })).result.documents.find((document) => path.normalize(document.file).toLowerCase() === stack.toLowerCase())?.dirty, false);
    await currentFrame.locator("#submit").click();
    await waitFor(async () => !(await currentFrame.locator("#submit").isDisabled()) && (await currentFrame.locator("#project-result").innerText()).includes("整个 Project"), "whole project completion");
    assert.equal(await currentFrame.locator('[data-current-task="final"]').getAttribute("data-status"), "WA");
    await page.screenshot({ path: path.join(root, "project-retry-desktop.png") });
    console.log("PASS: task README/files, single score failure, unsaved invalidation, save-and-retry AC, whole Project WA");
  } else {
    await page.screenshot({ path: path.join(root, "rollback-version-progress.png") });
    console.log(`PASS: ${stage} version opens Project with retained historical submission`);
  }
  await writeFile(path.join(root, `${stage}-ui-verification.json`), JSON.stringify({ stage, version, ok: true, bridge, workspace, inspected: inspected.result }, null, 2));
} catch (error) {
  if (page) {
    await page.screenshot({ path: path.join(root, `${stage}-failure.png`) }).catch(() => {});
    console.error((await page.locator("body").innerText().catch(() => "")).slice(-8000));
    console.error(page.frames().map((candidate) => candidate.url()));
  }
  throw error;
} finally {
  await writeFile(path.join(root, `${stage}-host.log`), processLog);
  await writeFile(path.join(bridge, "request.json"), JSON.stringify({ id: `${stage}-quit`, action: "command", command: "workbench.action.quit" }));
  await delay(3000);
  if (browser) await browser.close().catch(() => {});
  if (child.exitCode === null) child.kill();
}

const database = new DatabaseSync(path.join(userData, "User/globalStorage/state.vscdb"), { readOnly: true });
const persisted = JSON.parse(database.prepare("SELECT value FROM ItemTable WHERE key = ?").get("dsa-mastery.dsa-mastery-labs").value);
database.close();
assert(persisted["dsaMastery.progress.v1"].labs["01E01"].history.length > 0);
assert(persisted["dsaMastery.projectProgress.v1"].projects["02P04"].submissionCount > 0);
if (stage !== "old") {
  const previous = JSON.parse(await readFile(path.join(root, `${stage === "new" ? "old" : "new"}-persisted-progress.json`), "utf8"));
  assert.deepEqual(persisted["dsaMastery.progress.v1"].labs["01E01"], previous["dsaMastery.progress.v1"].labs["01E01"]);
  assert(persisted["dsaMastery.projectProgress.v1"].projects["02P04"].submissionCount >= previous["dsaMastery.projectProgress.v1"].projects["02P04"].submissionCount);
  if (stage !== "new") assert.deepEqual(persisted["dsaMastery.projectProgress.v1"], previous["dsaMastery.projectProgress.v1"]);
}
await writeFile(path.join(root, `${stage}-persisted-progress.json`), JSON.stringify(persisted, null, 2));
console.log("PASS: real SQLite Project progress and Program history persisted; existing Program records unchanged");
