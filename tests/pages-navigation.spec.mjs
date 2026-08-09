import { expect, test } from "@playwright/test";
import { readFile, stat } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const artifactRoot = path.join(projectRoot, "dist", "pages");
const pagesBasePath = process.env.GITHUB_PAGES_BASE_PATH || "/DSA-Mastery";
const mimeTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".rsc", "application/octet-stream"],
  [".svg", "image/svg+xml"],
  [".woff2", "font/woff2"],
]);

let server;
let baseUrl;

function resolveArtifactPath(relativePath) {
  const resolvedPath = path.resolve(artifactRoot, relativePath);
  if (resolvedPath !== artifactRoot && !resolvedPath.startsWith(`${artifactRoot}${path.sep}`)) {
    throw new Error(`Refusing to serve a path outside the Pages artifact: ${relativePath}`);
  }
  return resolvedPath;
}

async function serveArtifact(request, response) {
  const url = new URL(request.url ?? "/", "http://127.0.0.1");
  if (url.pathname === pagesBasePath) {
    response.writeHead(301, { location: `${pagesBasePath}/` });
    response.end();
    return;
  }
  if (!url.pathname.startsWith(`${pagesBasePath}/`)) {
    response.writeHead(404).end("Not found");
    return;
  }

  const relativePath = decodeURIComponent(url.pathname.slice(pagesBasePath.length + 1));
  let targetPath = resolveArtifactPath(relativePath);
  try {
    if ((await stat(targetPath)).isDirectory()) targetPath = path.join(targetPath, "index.html");
    const body = await readFile(targetPath);
    response.writeHead(200, {
      "cache-control": "no-store",
      "content-type": mimeTypes.get(path.extname(targetPath)) ?? "application/octet-stream",
    });
    response.end(body);
  } catch {
    const body = await readFile(path.join(artifactRoot, "404.html"));
    response.writeHead(404, { "content-type": "text/html; charset=utf-8" });
    response.end(body);
  }
}

test.beforeAll(async () => {
  server = createServer((request, response) => {
    serveArtifact(request, response).catch((error) => {
      response.writeHead(500).end(String(error));
    });
  });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Could not start Pages test server.");
  baseUrl = `http://127.0.0.1:${address.port}${pagesBasePath}`;
});

test.afterAll(async () => {
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
});

test("lesson and Lab links use static document navigation", async ({ page }) => {
  const failures = [];
  const documentRequests = [];
  const rscRequests = [];

  page.on("pageerror", (error) => failures.push(`pageerror: ${error.message}`));
  page.on("request", (request) => {
    const requestUrl = new URL(request.url());
    if (request.resourceType() === "document") documentRequests.push(requestUrl.pathname);
    if (requestUrl.searchParams.has("_rsc")) rscRequests.push(request.url());
  });
  page.on("requestfailed", (request) => {
    const errorText = request.failure()?.errorText ?? "unknown failure";
    if (!errorText.includes("ERR_ABORTED")) failures.push(`${request.url()}: ${errorText}`);
  });
  page.on("response", (response) => {
    const request = response.request();
    const requestUrl = new URL(response.url());
    const checkedTypes = new Set(["document", "fetch", "script", "stylesheet"]);
    if (requestUrl.origin === new URL(baseUrl).origin
      && checkedTypes.has(request.resourceType())
      && response.status() >= 400) {
      failures.push(`${response.status()} ${response.url()}`);
    }
  });

  await page.goto(`${baseUrl}/`);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("学透、做实、用活");

  const lessonUrl = `${baseUrl}/learn/chapter-00-introduction/00-overview/`;
  await Promise.all([
    page.waitForURL(lessonUrl),
    page.getByRole("link", { name: /从第 0 章开始/ }).click(),
  ]);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("第 0 章 绪论");

  const labsUrl = `${baseUrl}/labs/`;
  await Promise.all([
    page.waitForURL(labsUrl),
    page.getByRole("navigation", { name: "主导航" }).getByRole("link", { name: "Labs" }).click(),
  ]);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("用实验把理解落到代码上");

  const labUrl = `${baseUrl}/labs/chapter-01/lab-01-02-linked-list/`;
  await Promise.all([
    page.waitForURL(labUrl),
    page.locator("a.labs-list-card").filter({ hasText: "Lab 01-02：实现并验证单链表" }).click(),
  ]);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Lab 01-02：实现并验证单链表");

  expect(documentRequests).toEqual(expect.arrayContaining([
    `${pagesBasePath}/learn/chapter-00-introduction/00-overview/`,
    `${pagesBasePath}/labs/`,
    `${pagesBasePath}/labs/chapter-01/lab-01-02-linked-list/`,
  ]));
  expect(rscRequests, "GitHub Pages navigation must not issue RSC requests").toEqual([]);
  expect(failures).toEqual([]);
});
