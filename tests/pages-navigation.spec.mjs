import { expect, test } from "@playwright/test";
import { readFile, stat } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const artifactRoot = path.join(projectRoot, "dist", "pages");
const cleanedBase = (process.env.GITHUB_PAGES_BASE_PATH || "/DSA-Mastery")
  .trim()
  .replace(/^\/+|\/+$/g, "");
const pagesBasePath = cleanedBase ? `/${cleanedBase}` : "";
const mimeTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".woff", "font/woff"],
  [".woff2", "font/woff2"],
  [".xml", "application/xml; charset=utf-8"],
]);

let server;
let baseUrl;

test.use({
  viewport: { width: 1280, height: 800 },
  permissions: ["clipboard-read", "clipboard-write"],
});

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
  if (pagesBasePath && !url.pathname.startsWith(`${pagesBasePath}/`)) {
    response.writeHead(404).end("Not found");
    return;
  }

  const start = pagesBasePath ? pagesBasePath.length + 1 : 1;
  const relativePath = decodeURIComponent(url.pathname.slice(start));
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

function monitorPage(page) {
  const failures = [];
  const origin = new URL(baseUrl).origin;
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

test.beforeAll(async () => {
  server = createServer((request, response) => {
    serveArtifact(request, response).catch((error) => response.writeHead(500).end(String(error)));
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
  await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
});

test("clicks through the learner journey beneath the Pages base", async ({ page }) => {
  const failures = monitorPage(page);
  await page.goto(`${baseUrl}/`);
  await expect(page).toHaveTitle(/数据结构与算法理论与实验教程 · DSA Mastery/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("学透、做实、用活");
  await expect(page.locator(".course-hero-stats")).toContainText("7");
  await expect(page.locator(".course-hero-stats")).toContainText("4");

  await page.getByRole("link", { name: /从第 0 章开始/ }).click();
  await expect(page).toHaveURL(`${baseUrl}/learn/chapter-00-introduction/00-overview/`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("第 0 章 绪论");
  await expect(page.locator(".course-document-meta")).toContainText("draft");
  await expect(page.locator(".VPSidebar")).toBeVisible();
  await expect(page.locator(".VPDocAsideOutline")).toBeVisible();
  await expect(page.locator(".vp-doc h1")).toHaveCount(0);
  await expect(page.locator(".course-document-header h1")).toHaveCount(1);
  expect(failures, "home → lesson navigation").toEqual([]);

  await page.locator(".vp-doc").getByRole("link", { name: "主动输出式学习" }).click();
  await expect(page).toHaveURL(`${baseUrl}/learn/chapter-00-introduction/01-active-output/`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("0.1 主动输出式学习");
  expect(failures, "lesson → lesson navigation").toEqual([]);

  await page.locator(".VPNavBarMenu").getByRole("link", { name: "Labs" }).click();
  await expect(page).toHaveURL(`${baseUrl}/labs/`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("用实验把理解落到代码上");
  expect(failures, "lesson → Labs index navigation").toEqual([]);

  await page.locator("a.course-labs-list-card").filter({ hasText: "Lab 01-02：实现并验证单链表" }).click();
  await expect(page).toHaveURL(`${baseUrl}/labs/chapter-01/lab-01-02-linked-list/`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Lab 01-02：实现并验证单链表");
  await expect(page.locator('.vp-doc input[type="checkbox"]')).toHaveCount(5);
  await expect(page.locator('.vp-doc input[type="checkbox"]').first()).toBeDisabled();

  expect(failures).toEqual([]);
});

test("local Chinese search finds lessons and Labs", async ({ page }) => {
  const failures = monitorPage(page);
  await page.goto(`${baseUrl}/`);
  await page.locator("#local-search button").click();
  const input = page.getByRole("searchbox");
  await expect(input).toBeVisible();
  const results = page.getByRole("listbox");
  await input.fill("存储模型");
  await expect(results.locator('a[href*="/learn/chapter-01-linear-list/03-linked-list/"]')).toBeVisible();
  await input.fill("实现并验证单链表");
  const labResult = results.locator('a[href*="/labs/chapter-01/lab-01-02-linked-list/"]').first();
  await expect(labResult).toBeVisible();
  await labResult.click();
  await expect(page).toHaveURL(
    (url) => url.pathname === `${pagesBasePath}/labs/chapter-01/lab-01-02-linked-list/`,
  );
  expect(failures).toEqual([]);
});

test("appearance, code copy, tables, and metadata remain functional", async ({ page }) => {
  const failures = monitorPage(page);
  await page.goto(`${baseUrl}/learn/chapter-01-linear-list/03-linked-list/`);
  const appearance = page.locator(".VPNavBarAppearance .VPSwitchAppearance");
  await appearance.click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.reload();
  await expect(page.locator("html")).toHaveClass(/dark/);

  const codeBlock = page.locator('.vp-doc div[class*="language-"]').first();
  await expect(codeBlock).toBeVisible();
  const copyButton = codeBlock.locator("button.copy");
  await copyButton.click();
  await expect(copyButton).toHaveClass(/copied/);
  await expect(page.getByRole("link", { name: "在 GitHub 上编辑此页" })).toHaveAttribute(
    "href",
    /content\/chapter-01-linear-list\/03-linked-list\.md$/,
  );

  await page.goto(`${baseUrl}/learn/chapter-00-introduction/00-overview/`);
  await expect(page.locator(".vp-doc table")).toBeVisible();
  await expect(page.locator('link[rel="icon"]')).toHaveAttribute("href", `${pagesBasePath}/favicon.svg`);
  expect(failures).toEqual([]);
});

test("mobile navigation exposes the course sidebar and top-level links", async ({ page }) => {
  const failures = monitorPage(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseUrl}/learn/chapter-01-linear-list/00-overview/`);
  await expect(page.locator(".VPLocalNav .menu")).toBeVisible();
  await page.locator(".VPLocalNav .menu").click();
  await expect(page.locator(".VPSidebar.open")).toBeVisible();
  await expect(page.locator(".VPSidebar.open")).toContainText("1.2 顺序表");
  await page.keyboard.press("Escape");

  await page.locator(".VPNavBarHamburger").click();
  await expect(page.locator(".VPNavScreen")).toBeVisible();
  await expect(page.locator(".VPNavScreen")).toContainText("Labs");
  expect(failures).toEqual([]);
});

test("lesson navigation keeps the pre-migration hierarchy at responsive widths", async ({ page }) => {
  const failures = monitorPage(page);
  const route = `${baseUrl}/learn/chapter-00-introduction/02-complexity-basics/`;

  for (const width of [1440, 1024, 980, 768, 375]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(route);

    const metrics = await page.evaluate(() => {
      const doc = globalThis.document;
      const win = globalThis.window;
      const getStyle = globalThis.getComputedStyle;
      const root = doc.documentElement;
      const sidebarText = doc.querySelector(".VPSidebarItem .text");
      const outlineLink = doc.querySelector(".VPDocAsideOutline .outline-link");
      const nestedItems = [...doc.querySelectorAll(".VPSidebarItem .items")].find(
        (element) => getStyle(element).borderLeftStyle !== "none",
      );
      const visibleIndicators = [...doc.querySelectorAll(".VPSidebarItem .indicator")].filter(
        (element) => getStyle(element).backgroundColor !== "rgba(0, 0, 0, 0)",
      );
      const readPixels = (element) => {
        if (!element) return null;
        const style = getStyle(element);
        return { fontSize: Number.parseFloat(style.fontSize), lineHeight: Number.parseFloat(style.lineHeight) };
      };

      return {
        rootOverflow: root.scrollWidth - win.innerWidth,
        sidebarText: readPixels(sidebarText),
        outlineLink: readPixels(outlineLink),
        nestedBorder: nestedItems
          ? { style: getStyle(nestedItems).borderLeftStyle, width: getStyle(nestedItems).borderLeftWidth }
          : null,
        visibleIndicators: visibleIndicators.length,
      };
    });

    expect(metrics.rootOverflow, `root overflow at ${width}px`).toBeLessThanOrEqual(0);
    expect(metrics.visibleIndicators, `colored sidebar indicators at ${width}px`).toBe(0);
    expect(metrics.sidebarText?.fontSize, `sidebar font size at ${width}px`).toBeGreaterThanOrEqual(12);
    expect(metrics.sidebarText?.lineHeight, `sidebar line height at ${width}px`).toBeGreaterThanOrEqual(20);

    if (width >= 981) {
      await expect(page.locator(".VPDocAsideOutline")).toBeVisible();
      expect(metrics.outlineLink?.fontSize, `outline font size at ${width}px`).toBeGreaterThanOrEqual(12);
      expect(metrics.outlineLink?.lineHeight, `outline line height at ${width}px`).toBeGreaterThanOrEqual(20);
      expect(metrics.nestedBorder?.style, `sidebar hierarchy border at ${width}px`).toBe("solid");
      expect(metrics.nestedBorder?.width, `sidebar hierarchy border width at ${width}px`).toBe("1px");
    } else {
      await expect(page.locator(".VPDocAsideOutline")).toBeHidden();
      await expect(page.locator(".VPLocalNav .menu")).toBeVisible();
    }
  }

  expect(failures).toEqual([]);
});

test("unknown course routes render the branded 404", async ({ page }) => {
  const response = await page.goto(`${baseUrl}/learn/chapter-99-missing/00-overview/`);
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("PAGE NOT FOUND");
  await expect(page.getByRole("link", { name: /go to home|返回首页/ })).toBeVisible();
});
