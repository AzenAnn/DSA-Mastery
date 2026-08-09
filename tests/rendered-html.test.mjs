import assert from "node:assert/strict";
import test from "node:test";

async function render(pathname) {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${Math.random()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${pathname}`, { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("renders the DSA Lab home instead of the starter", async () => {
  const response = await render("/");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /DSA Lab/);
  assert.match(html, /可以被检验的作品/);
  assert.match(html, /Markdown/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|react-loading-skeleton/i);
});

test("renders discovered lesson and lab routes", async () => {
  const lesson = await render("/learn/chapter-01-linear-list/02-sequential-list");
  assert.equal(lesson.status, 200);
  assert.match(await lesson.text(), /顺序表/);

  const lab = await render("/labs/chapter-01/lab-01-01-sequence-list");
  assert.equal(lab.status, 200);
  assert.match(await lab.text(), /动态顺序表/);
});

test("returns 404 for content that is not in the Markdown registry", async () => {
  const response = await render("/learn/chapter-99-missing/00-overview");
  assert.equal(response.status, 404);
});
