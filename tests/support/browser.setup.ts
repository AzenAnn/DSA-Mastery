import type { Buffer } from "node:buffer";
import type { IncomingMessage, Server, ServerResponse } from "node:http";
import type { Browser, Page } from "playwright";
import { readFile, stat } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import process from "node:process";
import { chromium } from "playwright";
import { onTestFailed, onTestFinished } from "vitest";
import { siteArtifact } from "./site-artifact.ts";

const MIME_TYPES = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".mjs", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".woff", "font/woff"],
  [".woff2", "font/woff2"],
  [".xml", "application/xml; charset=utf-8"],
]);

// 整个 worker 复用一个 Chromium 和一个静态服务器；site-e2e 关掉了 isolate，模块状态跨文件存活。
let browser: Browser | undefined;
let server: Server | undefined;
let baseUrl: string | undefined;

async function readPage(file: string): Promise<{ path: string; body: Buffer }> {
  const target = (await stat(file)).isDirectory() ? path.join(file, "index.html") : file;

  return { path: target, body: await readFile(target) };
}

function serve(artifactRoot: string, basePath: string) {
  return async (request: IncomingMessage, response: ServerResponse): Promise<void> => {
    const url = new URL(request.url ?? "/", "http://127.0.0.1");
    if (url.pathname === basePath) {
      response.writeHead(301, { location: `${basePath}/` });
      response.end();

      return;
    }
    if (basePath && !url.pathname.startsWith(`${basePath}/`)) {
      response.writeHead(404).end("Not found");

      return;
    }
    const relativePath = decodeURIComponent(url.pathname.slice(basePath ? basePath.length + 1 : 1));
    // 响应体读到手再写 header：反过来的话读失败就留下一个永不结束的响应，浏览器只能等到超时。
    let status = 200;
    let file;
    try {
      file = await readPage(path.join(artifactRoot, relativePath || "index.html"));
    } catch {
      status = 404;
      file = await readPage(path.join(artifactRoot, "404.html"));
    }
    response.writeHead(status, {
      "cache-control": "no-store",
      "content-type": MIME_TYPES.get(path.extname(file.path)) ?? "application/octet-stream",
    });
    response.end(file.body);
  };
}

export async function pagesBaseUrl(): Promise<string> {
  if (baseUrl !== undefined) return baseUrl;
  const artifact = await siteArtifact();
  const basePath = artifact.base === "/" ? "" : artifact.base.replace(/\/$/, "");
  const handler = serve(artifact.root, basePath);
  server = createServer((request, response) => {
    handler(request, response).catch((error) => {
      if (!response.headersSent) response.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
      response.end(String(error));
    });
  });
  await new Promise<void>((resolve, reject) => {
    server!.once("error", reject);
    server!.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  if (address === null || typeof address === "string") throw new Error("无法启动 Pages 测试服务器。");
  baseUrl = `http://127.0.0.1:${address.port}${basePath}`;

  return baseUrl;
}

export async function newPage(viewport = { width: 1280, height: 800 }): Promise<Page> {
  // 完整 Chromium：headless shell 的排版与原 Playwright 配置不一致，几何断言会失真。
  browser ??= await chromium.launch({ channel: "chromium" });
  const context = await browser.newContext({ viewport, permissions: ["clipboard-read", "clipboard-write"] });
  const page = await context.newPage();
  // Playwright 的 trace/video 是 @playwright/test 专属，这里用失败截图补回最常用的那部分。
  onTestFailed(async ({ task }) => {
    const name = task.name.replace(/[^\w\u4E00-\u9FA5-]+/gu, "-").slice(0, 80);
    await page.screenshot({ path: path.join("test-results", `${name}.png`), fullPage: true }).catch(() => {});
  });
  onTestFinished(() => context.close());

  return page;
}

/** 收集页面错误、控制台报错和失败请求，用例结束时一并断言。 */
export function monitorPage(page: Page): string[] {
  const failures: string[] = [];
  const origin = new URL(baseUrl!).origin;
  page.on("pageerror", (error) => failures.push(`pageerror: ${error.stack ?? error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") failures.push(`console: ${message.text()}`);
  });
  page.on("requestfailed", (request) => {
    const errorText = request.failure()?.errorText ?? "unknown failure";
    if (!errorText.includes("ERR_ABORTED")) failures.push(`${request.url()}: ${errorText}`);
  });
  page.on("response", (response) => {
    if (new URL(response.url()).origin === origin && response.status() >= 400) {
      failures.push(`${response.status()} ${response.url()}`);
    }
  });

  return failures;
}

process.on("beforeExit", () => {
  void browser?.close();
  server?.close();
});
