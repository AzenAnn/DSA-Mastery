import { expect, test } from "@playwright/test";
import { readFile, readdir, stat } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const artifactRoot = path.join(projectRoot, "dist", "pages");
// 与 .vitepress/config.ts 的 normalizePagesBase 保持一致：默认根路径，仅 CI 显式设置前缀
const cleanedBase = (process.env.GITHUB_PAGES_BASE_PATH ?? "")
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
let expectedStats;

test.use({
  viewport: { width: 1280, height: 800 },
  permissions: ["clipboard-read", "clipboard-write"],
});

// 与 .vitepress/content-index.ts 的扫描规则保持一致，从仓库内容推导首页统计数字
const chapterDirectoryPattern = /^(?:chapter-\d{2}-[a-z0-9-]+|chapter-preface)$/;
const labDirectoryPattern = /^[TEP]-\d{2}-\d{2,}-[a-z0-9]+(?:-[a-z0-9]+)*$/;
const labCategories = ["theory", "exercise", "project"];

function labSidebarTitle(title) {
  return title.replace(/^Lab\s+\d{2}-[TEP]-\d{2,}[：:]\s*/, "");
}

async function computeCourseStats() {
  const contentRoot = path.join(projectRoot, "content");
  const labsRoot = path.join(projectRoot, "labs");
  const chapterEntries = (await readdir(contentRoot, { withFileTypes: true })).filter(
    (entry) => entry.isDirectory() && chapterDirectoryPattern.test(entry.name),
  );
  let lessons = 0;
  let labs = 0;
  for (const chapter of chapterEntries) {
    const files = await readdir(path.join(contentRoot, chapter.name), { withFileTypes: true });
    lessons += files.filter(
      (file) => file.isFile() && file.name.endsWith(".md") && file.name.toLowerCase() !== "readme.md",
    ).length;
  }
  const chapterLabEntries = (await readdir(labsRoot, { withFileTypes: true })).filter(
    (entry) => entry.isDirectory() && /^chapter-\d{2}$/.test(entry.name),
  );
  for (const chapter of chapterLabEntries) {
    for (const category of labCategories) {
      const labEntries = await readdir(
        path.join(labsRoot, chapter.name, category),
        { withFileTypes: true },
      );
      labs += labEntries.filter(
        (entry) => entry.isDirectory() && labDirectoryPattern.test(entry.name),
      ).length;
    }
  }
  return { chapters: chapterEntries.length, lessons, labs };
}

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
  expectedStats = await computeCourseStats();
});

test.afterAll(async () => {
  await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
});

test("publishes only categorized Lab routes and retires flat Lab URLs", async ({ request }) => {
  for (const route of [
    "/labs/chapter-01/theory/T-01-01-sequential-list-quiz/",
    "/labs/chapter-01/exercise/E-01-01-sequential-list-deduplication/",
    "/labs/chapter-01/project/P-01-01-list-workload-analyzer/",
  ]) {
    const response = await request.get(`${baseUrl}${route}`);
    expect(response.status(), `new Lab route should exist: ${route}`).toBe(200);
  }

  for (const route of [
    "/labs/chapter-01/lab-01-01-sequential-list-quiz/",
    "/labs/chapter-01/lab-01-06-sequential-list-deduplication/",
    "/labs/chapter-01/lab-01-21-list-workload-analyzer/",
  ]) {
    const response = await request.get(`${baseUrl}${route}`);
    expect(response.status(), `legacy Lab route should be retired: ${route}`).toBe(404);
  }
});

test("clicks through the learner journey beneath the Pages base", async ({ page }) => {
  const failures = monitorPage(page);
  await page.goto(`${baseUrl}/`);
  await expect(page).toHaveTitle(/数据结构与算法理论与实验教程 · DSA Mastery/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("学透、做实、用活");
  await expect(page.locator(".course-hero-stats")).toContainText("17");
  await expect(page.locator(".course-hero-stats")).toContainText(String(expectedStats.lessons));
  await expect(page.locator(".course-hero-stats")).toContainText(String(expectedStats.labs));

  await page.getByRole("link", { name: /从第 0 章开始/ }).click();
  await expect(page).toHaveURL(`${baseUrl}/learn/`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("课程总目录");
  await page.locator(".course-curriculum-chapters").getByRole("link", { name: /Ch\.0 内存基础/ }).click();
  await expect(page).toHaveURL(`${baseUrl}/learn/outline/chapter-00-memory-foundations/`);
  await expect(
    page.locator('.VPSidebar a[href*="/labs/chapter-00/theory/T-00-01-learning-map/"]'),
  ).toHaveText("00T01 · 制作个人 DSA 学习地图");
  await expect(
    page.locator('.VPSidebar a[href*="/labs/chapter-00/exercise/E-00-01-operation-counter/"]'),
  ).toHaveText("00E01 · 用操作计数观察增长趋势");
  await expect(page.locator(".VPSidebar")).not.toContainText("Lab 00-01");
  await page.locator(".course-curriculum-resource-list").getByRole("link", { name: /0\.1 数据结构基础概念/ }).click();
  await expect(page).toHaveURL(`${baseUrl}/learn/chapter-00-introduction/01-data-structure-basics/`);
  await page.locator(".VPNavBarMenu").getByRole("link", { name: "教材" }).click();
  await expect(page).toHaveURL(`${baseUrl}/learn/`);
  await page.locator(".VPSidebar").getByRole("link", { name: /0\.2 时间与空间复杂度概论/ }).click();
  await expect(page).toHaveURL(`${baseUrl}/learn/chapter-00-introduction/02-time-and-space-complexity/`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("0.2 时间与空间复杂度概论");
  await expect(page.locator(".course-document-meta")).toContainText("draft");
  await expect(page.locator(".VPSidebar")).toBeVisible();
  await expect(page.locator(".VPDocAsideOutline")).toBeVisible();
  await expect(page.locator(".vp-doc h1")).toHaveCount(0);
  await expect(page.locator(".course-document-header h1")).toHaveCount(1);
  expect(failures, "home → lesson navigation").toEqual([]);

  await page.locator(".course-breadcrumbs").getByRole("link", { name: "第 0 章" }).click();
  await expect(page).toHaveURL(`${baseUrl}/learn/chapter-00-introduction/00-overview/`);
  await page.locator(".vp-doc table").getByRole("link", { name: "0.1 数据结构基础概念" }).click();
  await expect(page).toHaveURL(`${baseUrl}/learn/chapter-00-introduction/01-data-structure-basics/`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("0.1 数据结构基础概念");
  expect(failures, "lesson → lesson navigation").toEqual([]);

  await page.locator(".VPNavBarMenu").getByRole("link", { name: "Labs" }).click();
  await expect(page).toHaveURL(`${baseUrl}/labs/`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("用实验把理解落到代码上");
  expect(failures, "lesson → Labs index navigation").toEqual([]);

  await page.locator("a.course-labs-list-card").filter({ hasText: "Lab 01-E-01：有序顺序表去重" }).click();
  await expect(page).toHaveURL(`${baseUrl}/labs/chapter-01/exercise/E-01-01-sequential-list-deduplication/`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Lab 01-E-01：有序顺序表去重");
  await expect(page.locator('.vp-doc input[type="checkbox"]')).toHaveCount(4);
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
  await input.fill("哨兵节点");
  await expect(
    results.locator('a[href*="/learn/chapter-01-linear-list/03-linked-list/"]').first(),
  ).toBeVisible();
  await input.fill("比较与权衡");
  await expect(
    results.locator('a[href*="/learn/chapter-01-linear-list/04-comparison-and-selection/"]').first(),
  ).toBeVisible();
  await input.fill("静态链表选择题精练");
  await expect(
    results.locator('a[href*="/labs/chapter-01/theory/T-01-05-static-linked-list-quiz/"]').first(),
  ).toBeVisible();
  await input.fill("时间与空间复杂度");
  await expect(
    results.locator('a[href*="/learn/chapter-00-introduction/02-time-and-space-complexity/"]').first(),
  ).toBeVisible();
  await input.fill("理论环境展示");
  await expect(
    results.locator('a[href*="/learn/chapter-preface/00-theory-environments/"]').first(),
  ).toBeVisible();
  await input.fill("Lab 更新与测试指南");
  await expect(
    results.locator('a[href*="/learn/chapter-preface/01-lab-authoring-guide/"]').first(),
  ).toBeVisible();
  await input.fill("Lab 命令与接口使用指南");
  await expect(
    results.locator('a[href*="/learn/chapter-preface/03-lab-cli-command-guide/"]').first(),
  ).toBeVisible();
  await input.fill("Graphviz 图示作者指南");
  await expect(
    results.locator('a[href*="/learn/chapter-preface/04-graphviz-authoring-guide/"]').first(),
  ).toBeVisible();
  await input.fill("macOS 学生实验环境安装指南");
  await expect(
    results.locator('a[href*="/learn/chapter-preface/05-macos-student-setup/"]').first(),
  ).toBeVisible();
  await input.fill("单链表选择题精练");
  const labResult = results.locator('a[href*="/labs/chapter-01/theory/T-01-02-singly-linked-list-quiz/"]').first();
  await expect(labResult).toBeVisible();
  await labResult.click();
  await expect(page).toHaveURL(
    (url) => url.pathname === `${pagesBasePath}/labs/chapter-01/theory/T-01-02-singly-linked-list-quiz/`,
  );
  expect(failures).toEqual([]);
});

test("curriculum exposes every Part and the required search, sorting, and algorithm chapters", async ({ page }) => {
  const failures = monitorPage(page);
  await page.goto(`${baseUrl}/learn/`);

  for (const part of [
    "Part I · 线性结构",
    "Part II · 树形结构",
    "Part III · 图结构",
    "Part IV · 查找与索引",
    "Part V · 排序",
    "Part VI · 算法思想",
  ]) {
    await expect(page.locator("#VPContent").getByRole("heading", { level: 2, name: part })).toBeVisible();
  }

  for (const chapter of [
    "Ch.8 基础查找与树形查找",
    "Ch.9 散列与索引结构",
    "Ch.10 基础排序算法",
    "Ch.11 高效排序与外部排序",
    "Ch.12 分治与递归",
    "Ch.13 贪心算法",
    "Ch.14 动态规划",
    "Ch.15 回溯与搜索",
  ]) {
    await expect(page.getByRole("link", { name: new RegExp(chapter.replace(".", "\\.")) }).first()).toBeVisible();
  }

  await page.getByRole("link", { name: /Ch\.8 基础查找与树形查找/ }).first().click();
  await expect(page).toHaveURL(`${baseUrl}/learn/outline/chapter-08-basic-tree-search/`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("基础查找与树形查找");
  await expect(page.locator(".course-curriculum-resource-list")).toContainText(
    "8.1 基础查找与折半查找",
  );
  await expect(page.locator(".course-curriculum-resource-list")).toContainText(
    "Lab 08-T-01：查找理论选择题精练",
  );
  await expect(page.locator(".course-curriculum-resource-list")).toContainText(
    "Lab 08-E-01：BST 增删查与边界测试",
  );

  await page.goto(`${baseUrl}/learn/outline/chapter-12-divide-conquer-recursion/`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("分治与递归");
  await expect(page.locator(".course-curriculum-empty")).toContainText("后续迭代中完善");

  await page.goto(`${baseUrl}/learn/chapter-08-search/02-binary-search-tree/`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("8.2 二叉排序树");
  await page.goto(`${baseUrl}/learn/chapter-08-search/04-b-tree-and-b-plus-tree/`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("8.4 B 树与 B+ 树");
  await page.goto(`${baseUrl}/labs/chapter-09/exercise/E-09-01-hash-table/`);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("散列表");
  expect(failures).toEqual([]);
});

test("preface is the first author-guide chapter and exposes all complete guides", async ({ page }) => {
  const failures = monitorPage(page);
  const outlineRoute = `${baseUrl}/learn/outline/chapter-preface/`;
  const showcaseRoute = `${baseUrl}/learn/chapter-preface/00-theory-environments/`;
  const labGuideRoute = `${baseUrl}/learn/chapter-preface/01-lab-authoring-guide/`;
  const windowsStudentGuideRoute = `${baseUrl}/learn/chapter-preface/02-windows-student-setup/`;
  const labCommandGuideRoute = `${baseUrl}/learn/chapter-preface/03-lab-cli-command-guide/`;
  const graphvizGuideRoute = `${baseUrl}/learn/chapter-preface/04-graphviz-authoring-guide/`;
  const macosStudentGuideRoute = `${baseUrl}/learn/chapter-preface/05-macos-student-setup/`;

  await page.goto(`${baseUrl}/learn/`);
  const foundationChapters = page.locator(".course-curriculum-chapters > a");
  await expect(foundationChapters.first()).toContainText("前言");
  await expect(foundationChapters.first()).toContainText("课程作者指南");
  await expect(foundationChapters.nth(1)).toContainText("Ch.0");
  await foundationChapters.first().click();

  await expect(page).toHaveURL(outlineRoute);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("课程作者指南");
  const resources = page.locator(".course-curriculum-resource-list");
  await expect(resources).toContainText("前言 · 理论环境展示");
  const windowsStudentGuideEntry = resources.getByRole("link", { name: /Windows 学生实验环境安装指南/ });
  await expect(windowsStudentGuideEntry).toBeVisible();
  await windowsStudentGuideEntry.click();
  await expect(page).toHaveURL(windowsStudentGuideRoute);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Windows 学生实验环境安装指南");
  await expect(page.locator(".vp-doc")).toContainText("Visual Studio C++ Build Tools");
  await expect(page.locator(".VPSidebar").getByRole("link", { name: "Windows 学生实验环境安装指南", exact: true })).toBeVisible();

  await page.goto(outlineRoute);
  const macosStudentGuideEntry = page.locator(".course-curriculum-resource-list").getByRole("link", { name: /macOS 学生实验环境安装指南/ });
  await expect(macosStudentGuideEntry).toBeVisible();
  await macosStudentGuideEntry.click();
  await expect(page).toHaveURL(macosStudentGuideRoute);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("macOS 学生实验环境安装指南");
  await expect(page.locator(".vp-doc")).toContainText("Xcode Command Line Tools");
  await expect(page.locator(".vp-doc")).toContainText("pnpm@11.1.1");
  await expect(page.locator(".VPSidebar").getByRole("link", { name: "macOS 学生实验环境安装指南", exact: true })).toBeVisible();
  const macosGuideImages = page.locator(".vp-doc img");
  await expect(macosGuideImages.first()).toBeVisible();
  expect(await macosGuideImages.count()).toBeGreaterThan(0);
  for (const image of await macosGuideImages.all()) {
    await image.scrollIntoViewIfNeeded();
    await expect
      .poll(() => image.evaluate((element) => element.complete && element.naturalWidth > 0))
      .toBe(true);
  }

  await page.goto(outlineRoute);
  const outlineResources = page.locator(".course-curriculum-resource-list");
  const labGuideEntry = outlineResources.getByRole("link", { name: /Lab 更新与测试指南/ });
  await expect(labGuideEntry).toBeVisible();
  await labGuideEntry.click();

  await expect(page).toHaveURL(labGuideRoute);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Lab 更新与测试指南");
  await expect(page.getByRole("heading", { level: 2, name: /先选对 Lab 类型/ })).toBeVisible();
  await expect(page.locator(".vp-doc")).toContainText("Golden Project");
  await expect(page.locator(".VPSidebar").getByRole("link", { name: "Lab 更新与测试指南", exact: true })).toBeVisible();

  await page.goto(outlineRoute);
  const commandGuideEntry = page.locator(".course-curriculum-resource-list").getByRole("link", { name: /Lab 命令与接口使用指南/ });
  await expect(commandGuideEntry).toBeVisible();
  await commandGuideEntry.click();

  await expect(page).toHaveURL(labCommandGuideRoute);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Lab 命令与接口使用指南");
  await expect(page.getByRole("heading", { level: 2, name: /30 秒选择入口/ })).toBeVisible();
  await expect(page.locator(".vp-doc")).toContainText("一套评分内核，两种命令外壳");
  await expect(page.locator(".vp-doc")).toContainText("pnpm lab:run");
  await expect(page.locator(".vp-doc")).toContainText("make run");
  await expect(page.locator(".VPSidebar").getByRole("link", { name: "Lab 命令与接口使用指南", exact: true })).toBeVisible();
  await expect(page.locator(".vp-code-group").first()).toBeVisible();

  await page.goto(outlineRoute);
  const graphvizGuideEntry = page.locator(".course-curriculum-resource-list").getByRole("link", { name: /Graphviz 图示作者指南/ });
  await expect(graphvizGuideEntry).toBeVisible();
  await graphvizGuideEntry.click();
  await expect(page).toHaveURL(graphvizGuideRoute);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Graphviz 图示作者指南");
  await expect(page.locator(".vp-doc")).toContainText("Graphviz Online");
  await expect(page.locator(".vp-doc")).toContainText("KROKI_SERVER_URL");
  await expect(page.locator(".VPSidebar").getByRole("link", { name: "Graphviz 图示作者指南", exact: true })).toBeVisible();

  const assertCommandGuideOverflow = async (theme) => {
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(labCommandGuideRoute);
      const overflow = await page.evaluate(() =>
        globalThis.document.documentElement.scrollWidth - globalThis.window.innerWidth,
      );
      expect(overflow, `Lab command guide root overflow in ${theme} theme at ${width}px`).toBeLessThanOrEqual(0);
    }
  };
  await assertCommandGuideOverflow("light");
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(labCommandGuideRoute);
  await page.locator(".VPNavBarAppearance .VPSwitchAppearance").click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await assertCommandGuideOverflow("dark");

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(showcaseRoute);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("前言 · 理论环境展示");
  await expect(page.locator(".course-breadcrumbs").getByRole("link", { name: "前言" })).toBeVisible();
  await expect(page.locator(".course-eyebrow")).toHaveText("前言 · 课程作者指南");
  await expect(page.locator("body")).not.toContainText("第 preface 章");
  await expect(page.locator(".VPSidebar").getByRole("link", { name: "前言", exact: true })).toBeVisible();

  for (const kind of [
    "definition",
    "theorem",
    "lemma",
    "corollary",
    "property",
    "proof",
    "intuition",
    "example",
    "counterexample",
    "complexity",
    "pitfall",
  ]) {
    await expect(page.locator(`.vp-doc .dsa-theory-block--${kind}`)).toHaveCount(1);
  }

  const authorGuide = page.getByRole("link", { name: "docs/THEORY_DOC_STYLE_GUIDE.md" }).first();
  await expect(authorGuide).toBeVisible();
  await expect(authorGuide).toHaveAttribute(
    "href",
    "https://github.com/AzenAnn/DSA-Mastery/blob/main/docs/THEORY_DOC_STYLE_GUIDE.md",
  );
  await expect(page.locator(".vp-doc mark").first()).toContainText("逻辑结构不等于存储结构");
  await expect(page.locator(".vp-doc dfn")).toHaveText("抽象数据类型");
  await expect(page.locator(".vp-doc kbd")).toHaveCount(2);
  await expect(page.locator(".vp-doc .dsa-code-title").first()).toContainText("theory-environment-demo.cpp");
  await expect(page.locator(".vp-doc .has-focused-lines")).toHaveCount(1);
  await expect(page.locator(".vp-doc code .diff.add")).toHaveCount(1);
  await expect(page.locator(".vp-doc code .diff.remove")).toHaveCount(1);
  await expect(page.locator(".vp-doc code .highlighted.warning")).toHaveCount(1);
  await expect(page.locator(".vp-doc code .highlighted.error")).toHaveCount(1);

  const copyButton = page.locator(".dsa-code-block--titled > button.copy").first();
  await copyButton.click();
  await expect(copyButton).toHaveClass(/copied/);
  const copiedCode = await page.evaluate(() => navigator.clipboard.readText());
  expect(copiedCode).toContain("#include <vector>");
  expect(copiedCode).not.toContain("theory-environment-demo.cpp");
  const codeGroup = page.locator(".vp-code-group");
  await expect(codeGroup).toBeVisible();
  await expect(codeGroup.locator(".tabs label")).toHaveCount(2);
  await codeGroup.locator(".tabs label").nth(1).click();
  await expect(codeGroup.locator("input").nth(1)).toBeChecked();

  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(showcaseRoute);
    const overflow = await page.evaluate(() =>
      globalThis.document.documentElement.scrollWidth - globalThis.window.innerWidth,
    );
    expect(overflow, `preface root overflow at ${width}px`).toBeLessThanOrEqual(0);
  }
  expect(failures).toEqual([]);
});

test("chapter 0 code contrast, math, copy, tables, and metadata remain functional", async ({ page }) => {
  const failures = monitorPage(page);
  await page.goto(`${baseUrl}/learn/chapter-00-introduction/02-time-and-space-complexity/`);
  const codeContrast = async () =>
    page.locator('.vp-doc div[class*="language-"]').first().evaluate((block) => {
      const parseColor = (value) => {
        const channels = value.match(/[\d.]+/g)?.map(Number) ?? [];
        return {
          red: channels[0] ?? 0,
          green: channels[1] ?? 0,
          blue: channels[2] ?? 0,
          alpha: channels[3] ?? 1,
        };
      };
      const luminance = (color) => {
        const linear = [color.red, color.green, color.blue].map((channel) => {
          const normalized = channel / 255;
          return normalized <= 0.04045
            ? normalized / 12.92
            : ((normalized + 0.055) / 1.055) ** 2.4;
        });
        return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
      };
      const contrast = (foreground, background) => {
        const brighter = Math.max(luminance(foreground), luminance(background));
        const darker = Math.min(luminance(foreground), luminance(background));
        return (brighter + 0.05) / (darker + 0.05);
      };

      const blockBackground = parseColor(globalThis.getComputedStyle(block).backgroundColor);
      const tokenContrasts = [...block.querySelectorAll("code span[style]")]
        .filter((token) => token.textContent?.trim())
        .map((token) => {
          const foreground = parseColor(globalThis.getComputedStyle(token).color);
          return contrast(foreground, blockBackground);
        });
      const pre = block.querySelector("pre");

      return {
        minimumTokenContrast: Math.min(...tokenContrasts),
        codeFontSize: Number.parseFloat(globalThis.getComputedStyle(block.querySelector("code")).fontSize),
        overflowX: globalThis.getComputedStyle(pre).overflowX,
        overflowY: globalThis.getComputedStyle(pre).overflowY,
      };
    });

  const lightCodeContrast = await codeContrast();
  expect(lightCodeContrast.minimumTokenContrast).toBeGreaterThanOrEqual(4.5);
  expect(lightCodeContrast.codeFontSize).toBeGreaterThanOrEqual(13);
  expect(lightCodeContrast.overflowX).toBe("auto");
  expect(lightCodeContrast.overflowY).toBe("hidden");
  const appearance = page.locator(".VPNavBarAppearance .VPSwitchAppearance");
  await appearance.click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.reload();
  await expect(page.locator("html")).toHaveClass(/dark/);
  const darkCodeContrast = await codeContrast();
  expect(darkCodeContrast.minimumTokenContrast).toBeGreaterThanOrEqual(4.5);

  const codeBlock = page.locator('.vp-doc div[class*="language-"]').first();
  await expect(codeBlock).toBeVisible();
  const copyButton = codeBlock.locator("button.copy");
  await copyButton.click();
  await expect(copyButton).toHaveClass(/copied/);
  await expect(page.getByRole("link", { name: "在 GitHub 上编辑此页" })).toHaveAttribute(
    "href",
    /content\/chapter-00-introduction\/02-time-and-space-complexity\.md$/,
  );
  await expect(page.locator(".vp-doc mjx-container").first()).toBeVisible();
  await expect(page.locator(".vp-doc table").first()).toBeVisible();
  await expect(page.locator('link[rel="icon"]')).toHaveAttribute("href", `${pagesBasePath}/favicon.svg`);
  expect(failures).toEqual([]);
});

test("theory syntax and code workbench stay accessible at desktop and mobile widths", async ({ page }) => {
  const failures = monitorPage(page);
  const route = `${baseUrl}/learn/chapter-00-introduction/01-data-structure-basics/`;

  const readContrast = (selector) => page.locator(selector).first().evaluate((element) => {
    const parseColor = (value) => {
      const channels = value.match(/[\d.]+/g)?.map(Number) ?? [];
      const scale = value.startsWith("color(srgb") ? 255 : 1;
      return {
        red: (channels[0] ?? 0) * scale,
        green: (channels[1] ?? 0) * scale,
        blue: (channels[2] ?? 0) * scale,
      };
    };
    const luminance = (color) => {
      const linear = [color.red, color.green, color.blue].map((channel) => {
        const normalized = channel / 255;
        return normalized <= 0.04045
          ? normalized / 12.92
          : ((normalized + 0.055) / 1.055) ** 2.4;
      });
      return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
    };
    const ratio = (first, second) => {
      const brighter = Math.max(luminance(first), luminance(second));
      const darker = Math.min(luminance(first), luminance(second));
      return (brighter + 0.05) / (darker + 0.05);
    };
    const style = globalThis.getComputedStyle(element);
    const foreground = parseColor(style.color);
    const background = parseColor(style.backgroundColor);
    const rail = parseColor(style.borderLeftColor);
    return {
      text: ratio(foreground, background),
      rail: ratio(rail, background),
    };
  });

  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(route);
    await expect(page.locator(".dsa-theory-block--definition")).toHaveCount(2);
    await expect(page.locator(".dsa-theory-block--intuition")).toHaveCount(1);
    await expect(page.locator(".vp-doc mark").first()).toBeVisible();
    await expect(page.locator(".vp-doc dfn").first()).toHaveText("抽象数据类型");
    await expect(page.locator(".vp-doc .dsa-code-title")).toContainText("student-list-interface.cpp");
    await expect(page.locator(".vp-doc .vp-code-group")).toBeVisible();
    const overflow = await page.evaluate(() =>
      globalThis.document.documentElement.scrollWidth - globalThis.window.innerWidth,
    );
    expect(overflow, `theory page root overflow at ${width}px`).toBeLessThanOrEqual(0);
  }

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(route);
  const lightContrast = await readContrast(".dsa-theory-block--definition");
  expect(lightContrast.text).toBeGreaterThanOrEqual(4.5);
  expect(lightContrast.rail).toBeGreaterThanOrEqual(3);

  const copyButton = page.locator(".dsa-code-block--titled > button.copy").first();
  await copyButton.focus();
  await expect(copyButton).toBeFocused();
  expect(await copyButton.evaluate((button) => globalThis.getComputedStyle(button).outlineStyle)).toBe("solid");

  const firstCodeGroupInput = page.locator(".vp-code-group input").first();
  await firstCodeGroupInput.focus();
  const focusedTabOutline = await firstCodeGroupInput.evaluate((input) =>
    globalThis.getComputedStyle(input.nextElementSibling).outlineStyle,
  );
  expect(focusedTabOutline).toBe("solid");
  const secondCodeGroupTab = page.locator(".vp-code-group .tabs label").nth(1);
  await secondCodeGroupTab.hover();
  await secondCodeGroupTab.click();
  await expect(page.locator(".vp-code-group input").nth(1)).toBeChecked();

  await page.locator(".VPNavBarAppearance .VPSwitchAppearance").click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  const darkContrast = await readContrast(".dsa-theory-block--definition");
  expect(darkContrast.text).toBeGreaterThanOrEqual(4.5);
  expect(darkContrast.rail).toBeGreaterThanOrEqual(3);
  expect(failures).toEqual([]);
});

test("mobile navigation exposes the course sidebar and top-level links", async ({ page }) => {
  const failures = monitorPage(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseUrl}/learn/chapter-01-linear-list/00-overview/`);
  await expect(page.locator(".VPLocalNav .menu")).toBeVisible();

  const closedSidebar = await page.locator(".VPSidebar").evaluate((sidebar) => {
    const firstLink = sidebar.querySelector("a");
    firstLink?.focus();
    const style = globalThis.getComputedStyle(sidebar);
    return {
      activeInsideSidebar: globalThis.document.activeElement?.closest(".VPSidebar") === sidebar,
      pointerEvents: style.pointerEvents,
      visibility: style.visibility,
    };
  });
  expect(closedSidebar.activeInsideSidebar, "closed mobile sidebar should not accept focus").toBe(false);
  expect(closedSidebar.pointerEvents, "closed mobile sidebar should not accept pointer input").toBe("none");
  expect(closedSidebar.visibility, "closed mobile sidebar should be hidden").toBe("hidden");

  await page.locator(".VPLocalNav .menu").click();
  await expect(page.locator(".VPSidebar.open")).toBeVisible();
  await expect(page.locator(".VPSidebar.open")).toContainText("1.2 第一种实现——顺序表 (动态数组)");
  await expect(page.locator(".VPSidebar.open")).toContainText("1.3 第二种实现——链表与演进设计");
  await expect(page.locator(".VPSidebar.open")).toContainText("1.4 比较与权衡");
  await expect(page.locator(".VPSidebar.open")).toContainText("本章 Labs");
  await expect(page.locator(".VPSidebar.open")).toContainText("理论 Theory");
  await expect(page.locator(".VPSidebar.open")).toContainText("实验 Exercise");
  await expect(page.locator(".VPSidebar.open")).toContainText("工程 Project");
  await expect(page.locator(".VPSidebar.open")).toContainText(
    "01P01 · 线性表双实现与工作负载评测器",
  );
  await expect(page.locator(".VPSidebar.open")).not.toContainText("Lab 01-21");
  const mobileLayout = await page.evaluate(() => ({
    clientWidth: globalThis.document.documentElement.clientWidth,
    scrollWidth: globalThis.document.documentElement.scrollWidth,
  }));
  expect(mobileLayout.scrollWidth).toBeLessThanOrEqual(mobileLayout.clientWidth);
  await page.keyboard.press("Escape");
  await expect(page.locator(".VPSidebar")).toBeHidden();

  await page.goto(`${baseUrl}/learn/chapter-01-linear-list/03-linked-list/`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("1.3 第二种实现——链表与演进设计");
  await expect(page.locator('.VPDocFooter a.pager-link.next')).toContainText("1.4 比较与权衡");

  await page.goto(`${baseUrl}/learn/chapter-01-linear-list/04-comparison-and-selection/`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("1.4 比较与权衡");
  await expect(page.locator(".vp-doc table").first()).toBeVisible();
  await expect(page.locator('.vp-doc div[class*="language-"]').first()).toBeVisible();
  await expect(page.locator(".vp-doc details").first()).toBeVisible();

  await page.locator(".VPNavBarHamburger").click();
  await expect(page.locator(".VPNavScreen")).toBeVisible();
  await expect(page.locator(".VPNavScreen")).toContainText("Labs");
  expect(failures).toEqual([]);
});

test("home and lesson navbar share the same horizontal rail", async ({ page }) => {
  const failures = monitorPage(page);
  const widths = [1024, 1440, 2048];
  const route = `${baseUrl}/learn/chapter-00-introduction/02-time-and-space-complexity/`;

  for (const width of widths) {
    await page.setViewportSize({ width, height: 700 });
    await page.goto(`${baseUrl}/`);
    const homeRail = await page.evaluate(() => {
      const container = globalThis.document.querySelector(".VPNavBar .wrapper > .container");
      const brand = globalThis.document.querySelector(".course-brand-mark");
      const containerRect = container?.getBoundingClientRect();
      const brandRect = brand?.getBoundingClientRect();
      return {
        brandLeft: brandRect?.left ?? Number.NaN,
        containerLeft: containerRect?.left ?? Number.NaN,
        containerRight: containerRect?.right ?? Number.NaN,
      };
    });

    await page.goto(route);
    const lessonRail = await page.evaluate(() => {
      const brand = globalThis.document.querySelector(".course-brand-mark");
      const contentBody = globalThis.document.querySelector(".VPNavBar .content-body");
      const brandRect = brand?.getBoundingClientRect();
      const contentRect = contentBody?.getBoundingClientRect();
      return {
        brandLeft: brandRect?.left ?? Number.NaN,
        contentRight: contentRect?.right ?? Number.NaN,
      };
    });

    expect(lessonRail.brandLeft, `lesson brand rail at ${width}px`).toBeCloseTo(homeRail.brandLeft, 1);
    expect(lessonRail.contentRight, `lesson content rail at ${width}px`).toBeCloseTo(homeRail.containerRight, 1);
  }

  expect(failures).toEqual([]);
});

test("navbar brand subtitle stays contained and appearance icon stays centered", async ({ page }) => {
  const failures = monitorPage(page);

  for (const width of [1440, 1024]) {
    await page.setViewportSize({ width, height: 700 });
    await page.goto(`${baseUrl}/`);
    if (width === 1024) {
      await page.locator(".VPNavBarExtra .button").first().click();
      await expect(page.locator(".VPNavBarExtra .VPSwitchAppearance")).toBeVisible();
    } else {
      await expect(page.locator(".VPNavBarAppearance .VPSwitchAppearance")).toBeVisible();
    }

    const metrics = await page.evaluate(() => {
      const doc = globalThis.document;
      const title = doc.querySelector(".VPNavBarTitle .title");
      const brandMark = doc.querySelector(".course-brand-mark");
      const subtitle = doc.querySelector(".course-brand-subtitle");
      const appearance = [...doc.querySelectorAll(".VPSwitchAppearance")].find(
        (element) => element.getBoundingClientRect().width > 0,
      );
      const icon = appearance?.querySelector(".icon");
      const titleRect = title?.getBoundingClientRect();
      const brandMarkRect = brandMark?.getBoundingClientRect();
      const subtitleRect = subtitle?.getBoundingClientRect();
      const appearanceRect = appearance?.getBoundingClientRect();
      const iconRect = icon?.getBoundingClientRect();

      return {
        subtitleContained:
          Boolean(titleRect && subtitleRect) &&
          subtitleRect.left >= titleRect.left &&
          subtitleRect.right <= titleRect.right + 0.5 &&
          subtitleRect.top >= titleRect.top &&
          subtitleRect.bottom <= titleRect.bottom + 0.5 &&
          subtitle.scrollWidth === subtitle.clientWidth,
        brandMarkCentered:
          Boolean(titleRect && brandMarkRect) &&
          Math.abs(brandMarkRect.top + brandMarkRect.height / 2 - (titleRect.top + titleRect.height / 2)) <= 1,
        iconCentered:
          Boolean(appearanceRect && iconRect) &&
          Math.abs(iconRect.left + iconRect.width / 2 - (appearanceRect.left + appearanceRect.width / 2)) <= 1 &&
          Math.abs(iconRect.top + iconRect.height / 2 - (appearanceRect.top + appearanceRect.height / 2)) <= 1,
        rootOverflow: doc.documentElement.scrollWidth - globalThis.window.innerWidth,
      };
    });

    expect(metrics.subtitleContained, `brand subtitle containment at ${width}px`).toBe(true);
    expect(metrics.brandMarkCentered, `brand mark centering at ${width}px`).toBe(true);
    expect(metrics.iconCentered, `appearance icon centering at ${width}px`).toBe(true);
    expect(metrics.rootOverflow, `root overflow at ${width}px`).toBeLessThanOrEqual(0);
  }

  await page.setViewportSize({ width: 980, height: 700 });
  await page.goto(`${baseUrl}/`);
  await expect(page.locator(".course-brand-subtitle")).toBeHidden();
  expect(failures).toEqual([]);
});

test("lesson navigation keeps the pre-migration hierarchy at responsive widths", async ({ page }) => {
  const failures = monitorPage(page);
  const route = `${baseUrl}/learn/chapter-00-introduction/02-time-and-space-complexity/`;

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

test("complexity quiz submits answers with immediate feedback", async ({ page }) => {
  const failures = monitorPage(page);
  await page.goto(`${baseUrl}/labs/chapter-00/theory/T-00-02-complexity-quiz/`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Lab 00-T-02：复杂度计算自测");
  const questions = page.locator(".course-quiz-question");
  await expect(questions).toHaveCount(19);
  await expect(page.locator(".course-quiz-summary")).toContainText("已答 0/19");

  // 右侧答题进度导航：19 个圈，初始全部未作答
  const navigator = page.locator(".course-quiz-nav");
  await expect(navigator).toBeVisible();
  await expect(navigator.locator("li")).toHaveCount(19);
  await expect(navigator.locator("li.is-pending")).toHaveCount(19);

  // 第 1 题故意选错：立即出现错误反馈、正确答案与题解，导航第 1 圈变红
  const first = questions.first();
  await expect(first.locator(".course-quiz-hint")).toBeVisible();
  await first.locator(".course-quiz-hint > summary").click();
  await expect(first.locator(".course-quiz-hint")).toContainText("2、4、8、16");
  await first.locator(".course-quiz-option").nth(1).click();
  await expect(first.getByRole("radio").nth(1)).toBeChecked();
  await first.getByRole("button", { name: "提交答案" }).click();
  await expect(first.locator(".course-quiz-feedback")).toContainText("回答错误");
  await expect(first.locator(".course-quiz-feedback")).toContainText("正确答案：A. O(log n)");
  await expect(first.locator(".course-quiz-explanation")).toContainText("翻倍");
  await expect(first.locator(".course-quiz-options")).toHaveClass(/is-submitted/);
  await expect(first.getByRole("radio").first()).toBeDisabled();
  await expect(navigator.locator("li").first()).toHaveClass(/is-wrong/);
  await expect(page.locator(".course-quiz-summary")).toContainText("已答 1/19");

  // 第 2 题选对：正确反馈，导航第 2 圈变绿；重新作答后回到未作答状态
  const second = questions.nth(1);
  await second.locator(".course-quiz-option").nth(1).click();
  await second.getByRole("button", { name: "提交答案" }).click();
  await expect(second.locator(".course-quiz-feedback")).toContainText("回答正确");
  await expect(navigator.locator("li").nth(1)).toHaveClass(/is-correct/);
  await expect(page.locator(".course-quiz-summary")).toContainText("正确 1");
  await second.getByRole("button", { name: "重新作答" }).click();
  await expect(second.locator(".course-quiz-feedback")).toHaveCount(0);
  await expect(second.getByRole("radio").nth(1)).toBeEnabled();
  await expect(navigator.locator("li").nth(1)).toHaveClass(/is-pending/);

  // 点击导航第 3 个圈应跳转到第 3 题卡片
  await navigator.locator("li").nth(2).getByRole("button").click();
  await expect(questions.nth(2)).toBeInViewport();

  expect(failures).toEqual([]);
});

test("the deduplication Golden Program renders the standard problem sections", async ({ page }) => {
  const failures = monitorPage(page);
  await page.goto(`${baseUrl}/labs/chapter-01/exercise/E-01-01-sequential-list-deduplication/`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Lab 01-E-01：有序顺序表去重");

  // 题面 7 要素全部渲染
  for (const heading of ["题目", "输入格式", "输出格式", "数据范围与限制", "样例", "如何验证"]) {
    await expect(page.locator(".vp-doc h2").filter({ hasText: heading })).toHaveCount(1);
  }
  // 「任务要求」属于「题目」小节下的 h3
  await expect(page.locator(".vp-doc h3").filter({ hasText: "任务要求" })).toHaveCount(1);

  // 样例输入与输出代码块
  const sampleInput = page.locator(".vp-doc pre").filter({ hasText: "1 1 2 2 3 4 4 5" });
  await expect(sampleInput).toBeVisible();
  await expect(page.locator(".vp-doc pre").filter({ hasText: "1 2 3 4 5" })).toBeVisible();

  // 数据范围表格与样例解释表格
  await expect(page.locator(".vp-doc table")).toHaveCount(2);

  // 验证清单的 checkbox 渲染
  await expect(page.locator('.vp-doc input[type="checkbox"]')).toHaveCount(4);

  // 页内链接到该 Lab 的入口在 Labs 索引中存在
  await page.goto(`${baseUrl}/labs/`);
  await expect(
    page.locator("a.course-labs-list-card").filter({ hasText: "Lab 01-E-01：有序顺序表去重" }),
  ).toBeVisible();

  expect(failures).toEqual([]);
});

test("linear-list quiz Labs are interactive and complete in the chapter sidebar", async ({ page }) => {
  const failures = monitorPage(page);
  const quizLabs = [
    {
      slug: "theory/T-01-01-sequential-list-quiz",
      title: "Lab 01-T-01：顺序表选择题精练",
      questions: 10,
    },
    {
      slug: "theory/T-01-02-singly-linked-list-quiz",
      title: "Lab 01-T-02：单链表选择题精练",
      questions: 10,
    },
    {
      slug: "theory/T-01-03-doubly-linked-list-quiz",
      title: "Lab 01-T-03：双链表选择题精练",
      questions: 10,
    },
    {
      slug: "theory/T-01-04-circular-linked-list-quiz",
      title: "Lab 01-T-04：循环链表选择题精练",
      questions: 2,
    },
    {
      slug: "theory/T-01-05-static-linked-list-quiz",
      title: "Lab 01-T-05：静态链表选择题精练",
      questions: 4,
    },
  ];

  await page.goto(`${baseUrl}/labs/`);
  for (const quiz of quizLabs) {
    await expect(page.locator("a.course-labs-list-card").filter({ hasText: quiz.title })).toBeVisible();
  }

  for (const quiz of quizLabs) {
    await page.goto(`${baseUrl}/labs/chapter-01/${quiz.slug}/`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(quiz.title);
    const questions = page.locator(".course-quiz-question");
    await expect(questions).toHaveCount(quiz.questions);
    await expect(page.locator(".course-quiz-nav li")).toHaveCount(quiz.questions);
    await expect(page.locator(".course-quiz-option")).toHaveCount(quiz.questions * 4);
    await expect(page.getByRole("button", { name: "提交答案" })).toHaveCount(quiz.questions);
    await expect(page.locator(".course-quiz-meta")).toHaveCount(quiz.questions);
    await expect(page.locator(".vp-doc")).not.toContainText(
      /查看原始页面|看交互可视化|答案来源说明|答案来源：Codex/,
    );

    await expect(
      page.locator(".vp-doc details > summary").filter({ hasText: "查看答案与解析" }),
    ).toHaveCount(0);
    await expect(page.locator(".course-quiz-answer-overview > summary")).toHaveCount(1);

    const firstQuestion = questions.first();
    await expect(firstQuestion.locator(".course-quiz-feedback")).toHaveCount(0);
    await firstQuestion.locator(".course-quiz-option").first().click();
    await firstQuestion.getByRole("button", { name: "提交答案" }).click();
    await expect(firstQuestion.locator(".course-quiz-feedback")).toBeVisible();
    await expect(firstQuestion.locator(".course-quiz-feedback")).toContainText("正确答案");
    await expect(firstQuestion.getByRole("button", { name: "重新作答" })).toBeVisible();

    const layout = await page.evaluate(() => ({
      clientWidth: globalThis.document.documentElement.clientWidth,
      scrollWidth: globalThis.document.documentElement.scrollWidth,
    }));
    expect(layout.scrollWidth, `${quiz.slug} should not overflow horizontally`).toBeLessThanOrEqual(
      layout.clientWidth,
    );
  }

  await page.goto(`${baseUrl}/labs/chapter-01/theory/T-01-01-sequential-list-quiz/`);
  const chapterSidebar = page.locator(
    '.VPSidebarItem:has(> .item a[href*="/learn/outline/chapter-01-linear-list/"])',
  );
  const theorySidebarGroup = chapterSidebar.locator(
    ".VPSidebarItem:has(> .item > .text > .course-lab-category--theory)",
  );
  await expect(theorySidebarGroup).not.toHaveClass(/collapsed/);
  for (const quiz of quizLabs) {
    await expect(theorySidebarGroup.getByRole("link", { name: labSidebarTitle(quiz.title) })).toHaveCount(
      1,
    );
  }
  await expect(theorySidebarGroup.locator(":scope > .items a").first()).toHaveText(
    "01T01 · 顺序表选择题精练",
  );
  await expect(page.locator(".course-quiz-stem mjx-container").first()).toBeVisible();

  await page.goto(`${baseUrl}/labs/chapter-01/theory/T-01-02-singly-linked-list-quiz/`);
  await expect(page.locator(".course-quiz-question").nth(1).locator("table")).toBeVisible();

  expect(failures).toEqual([]);
});

test("chapter 1 Lab sidebar groups remain native, categorized, and visually distinct", async ({ page }) => {
  const failures = monitorPage(page);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(`${baseUrl}/learn/outline/chapter-01-linear-list/`);

  const sidebar = page.locator(".VPSidebar");
  const chapterGroup = sidebar.locator(
    '.VPSidebarItem:has(> .item a[href*="/learn/outline/chapter-01-linear-list/"])',
  );
  const labGroup = chapterGroup.locator(
    ".VPSidebarItem:has(> .item > .text > .course-lab-nav__title)",
  );
  await expect(chapterGroup).toHaveCount(1);
  await expect(labGroup).toHaveCount(1);
  await expect(labGroup).not.toHaveClass(/collapsed/);

  const theoryGroup = chapterGroup.locator(
    ".VPSidebarItem:has(> .item > .text > .course-lab-category--theory)",
  );
  const exerciseGroup = chapterGroup.locator(
    ".VPSidebarItem:has(> .item > .text > .course-lab-category--exercise)",
  );
  const projectGroup = chapterGroup.locator(
    ".VPSidebarItem:has(> .item > .text > .course-lab-category--project)",
  );
  await expect(theoryGroup).toHaveClass(/collapsed/);
  await expect(exerciseGroup).toHaveClass(/collapsed/);
  await expect(projectGroup).not.toHaveClass(/collapsed/);
  await expect(projectGroup.locator(".course-lab-category__empty")).toHaveCount(0);
  const projectLink = projectGroup.getByRole("link", {
    name: "01P01 · 线性表双实现与工作负载评测器",
    exact: true,
  });
  await expect(projectLink).toHaveCount(1);
  await expect(projectLink).toHaveAttribute(
    "href",
    /\/labs\/chapter-01\/project\/P-01-01-list-workload-analyzer\/$/,
  );

  for (const group of [theoryGroup, exerciseGroup, projectGroup]) {
    const icon = group.locator(":scope > .item svg.lucide");
    await expect(icon).toHaveCount(1);
    await expect(icon).toHaveAttribute("aria-hidden", "true");
  }

  await theoryGroup.locator(":scope > .item").focus();
  await page.keyboard.press("Enter");
  await expect(theoryGroup).not.toHaveClass(/collapsed/);
  await expect(theoryGroup.locator(":scope > .items a")).toHaveCount(5);

  await exerciseGroup.locator(":scope > .item").focus();
  await page.keyboard.press("Enter");
  await expect(exerciseGroup).not.toHaveClass(/collapsed/);
  await expect(exerciseGroup.locator(":scope > .items a")).toHaveCount(15);
  await expect(projectGroup.locator(":scope > .items a")).toHaveCount(1);

  await projectGroup.locator(":scope > .item").focus();
  await page.keyboard.press("Enter");
  await expect(projectGroup).toHaveClass(/collapsed/);
  await page.keyboard.press("Enter");
  await expect(projectGroup).not.toHaveClass(/collapsed/);

  const readLabNavVisual = () => page.evaluate(() => {
    const root = globalThis.document.querySelector(
      ".VPSidebarItem:has(> .item > .text > .course-lab-nav__title)",
    );
    const colors = ["theory", "exercise", "project"].map((category) => {
      const label = globalThis.document.querySelector(`.course-lab-category--${category}`);
      return label ? globalThis.getComputedStyle(label).color : "";
    });
    const style = root ? globalThis.getComputedStyle(root) : undefined;
    const parseColor = (color) => {
      const channels = (color.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);
      return color.startsWith("color(srgb") ? channels : channels.map((channel) => channel / 255);
    };
    const luminance = (color) => {
      const channels = parseColor(color).map((normalized) => {
        return normalized <= 0.04045
          ? normalized / 12.92
          : ((normalized + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
    };
    const background = style?.backgroundColor ?? "rgb(255, 255, 255)";
    const contrasts = colors.map((color) => {
      const first = luminance(color);
      const second = luminance(background);
      return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
    });
    return {
      colors,
      contrasts,
      borderStyle: style?.borderTopStyle,
      borderRadius: Number.parseFloat(style?.borderTopLeftRadius ?? "0"),
      backgroundColor: style?.backgroundColor,
    };
  });

  const lightVisual = await readLabNavVisual();
  expect(new Set(lightVisual.colors).size).toBe(3);
  expect(
    lightVisual.contrasts.every((contrast) => contrast >= 4.5),
    JSON.stringify(lightVisual),
  ).toBe(true);
  expect(lightVisual.borderStyle).toBe("solid");
  expect(lightVisual.borderRadius).toBeGreaterThan(0);
  expect(lightVisual.backgroundColor).not.toBe("rgba(0, 0, 0, 0)");

  await page.locator(".VPNavBarAppearance .VPSwitchAppearance").click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  const darkVisual = await readLabNavVisual();
  expect(new Set(darkVisual.colors).size).toBe(3);
  expect(
    darkVisual.contrasts.every((contrast) => contrast >= 4.5),
    JSON.stringify(darkVisual),
  ).toBe(true);

  await labGroup.locator(":scope > .item").focus();
  await page.keyboard.press("Enter");
  await expect(labGroup).toHaveClass(/collapsed/);
  await page.keyboard.press("Enter");
  await expect(labGroup).not.toHaveClass(/collapsed/);

  expect(failures).toEqual([]);
});

test("chapter 2 Lab sidebar groups labs into categorized 本章 Labs", async ({ page }) => {
  const failures = monitorPage(page);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(`${baseUrl}/learn/outline/chapter-02-stack-queue/`);

  const chapterGroup = page.locator(
    '.VPSidebarItem:has(> .item a[href*="/learn/outline/chapter-02-stack-queue/"])',
  );
  const labGroup = chapterGroup.locator(
    ".VPSidebarItem:has(> .item > .text > .course-lab-nav__title)",
  );
  await expect(chapterGroup).toHaveCount(1);
  await expect(labGroup).toHaveCount(1);
  await expect(labGroup).not.toHaveClass(/collapsed/);
  await expect(chapterGroup).not.toContainText("相关 Labs");

  const theoryGroup = chapterGroup.locator(
    ".VPSidebarItem:has(> .item > .text > .course-lab-category--theory)",
  );
  const exerciseGroup = chapterGroup.locator(
    ".VPSidebarItem:has(> .item > .text > .course-lab-category--exercise)",
  );
  const projectGroup = chapterGroup.locator(
    ".VPSidebarItem:has(> .item > .text > .course-lab-category--project)",
  );
  await expect(theoryGroup).toHaveClass(/collapsed/);
  await expect(exerciseGroup).toHaveClass(/collapsed/);
  await expect(projectGroup).not.toHaveClass(/collapsed/);

  await theoryGroup.locator(":scope > .item").focus();
  await page.keyboard.press("Enter");
  await expect(theoryGroup).not.toHaveClass(/collapsed/);
  await expect(theoryGroup.locator(":scope > .items a")).toHaveCount(2);
  await expect(
    theoryGroup.getByRole("link", { name: "02T01 · 栈选择题精练", exact: true }),
  ).toHaveCount(1);
  await expect(
    theoryGroup.getByRole("link", { name: "02T02 · 队列选择题精练", exact: true }),
  ).toHaveCount(1);

  await exerciseGroup.locator(":scope > .item").focus();
  await page.keyboard.press("Enter");
  await expect(exerciseGroup).not.toHaveClass(/collapsed/);
  await expect(exerciseGroup.locator(".course-lab-category__empty")).toHaveCount(0);
  await expect(exerciseGroup.locator(":scope > .items a")).toHaveCount(8);
  const exerciseLabs = [
    { title: "Lab 02-E-01：验证栈序列", slug: "exercise/E-02-01-validate-stack-sequences" },
    { title: "Lab 02-E-02：最小栈", slug: "exercise/E-02-02-min-stack" },
    { title: "Lab 02-E-03：最近请求计数器", slug: "exercise/E-02-03-recent-counter" },
    { title: "Lab 02-E-04：设计循环队列", slug: "exercise/E-02-04-circular-queue" },
    { title: "Lab 02-E-05：用栈实现队列", slug: "exercise/E-02-05-queue-using-stacks" },
    { title: "Lab 02-E-06：设计循环双端队列", slug: "exercise/E-02-06-circular-deque" },
    { title: "Lab 02-E-07：滑动窗口最大值", slug: "exercise/E-02-07-sliding-window-maximum" },
    {
      title: "Lab 02-E-08：柱状图中最大的矩形",
      slug: "exercise/E-02-08-largest-rectangle-histogram",
    },
  ];
  for (const { title, slug } of exerciseLabs) {
    const link = exerciseGroup.getByRole("link", { name: labSidebarTitle(title) });
    await expect(link).toHaveCount(1);
    await expect(link).toHaveAttribute("href", new RegExp(`/labs/chapter-02/${slug}/$`));
  }

  await expect(projectGroup.locator(":scope > .items a")).toHaveCount(3);
  for (const title of [
    "Lab 02-P-01：可撤销浏览器——栈的超级大综合",
    "Lab 02-P-02：超市收银模拟——队列的大综合",
    "Lab 02-P-03：停车场管理——栈与队列的大综合",
  ]) {
    await expect(projectGroup.getByRole("link", { name: labSidebarTitle(title) })).toHaveCount(1);
  }
  await expect(exerciseGroup.locator(":scope > .items a").first()).toContainText("02E01");
  await expect(projectGroup.locator(":scope > .items a").first()).toContainText("02P01");

  for (const { title, slug } of exerciseLabs) {
    await page.goto(`${baseUrl}/labs/chapter-02/${slug}/`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);
    await expect(page.getByRole("heading", { level: 2, name: /^输入格式/ })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: /^输出格式/ })).toBeVisible();
    const layout = await page.evaluate(() => ({
      clientWidth: globalThis.document.documentElement.clientWidth,
      scrollWidth: globalThis.document.documentElement.scrollWidth,
    }));
    expect(layout.scrollWidth, `${slug} should not overflow horizontally`).toBeLessThanOrEqual(
      layout.clientWidth,
    );
  }

  expect(failures).toEqual([]);
});

test("chapter 3 Lab sidebar groups labs into categorized 本章 Labs", async ({ page }) => {
  const failures = monitorPage(page);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(`${baseUrl}/learn/outline/chapter-03-string-array-matrix/`);

  const sidebar = page.locator(".VPSidebar");
  const chapterGroup = sidebar.locator(
    '.VPSidebarItem:has(> .item a[href*="/learn/outline/chapter-03-string-array-matrix/"])',
  );
  const labGroup = chapterGroup.locator(
    ".VPSidebarItem:has(> .item > .text > .course-lab-nav__title)",
  );
  await expect(chapterGroup).toHaveCount(1);
  await expect(labGroup).toHaveCount(1);
  await expect(labGroup).not.toHaveClass(/collapsed/);

  const theoryGroup = chapterGroup.locator(
    ".VPSidebarItem:has(> .item > .text > .course-lab-category--theory)",
  );
  const exerciseGroup = chapterGroup.locator(
    ".VPSidebarItem:has(> .item > .text > .course-lab-category--exercise)",
  );
  const projectGroup = chapterGroup.locator(
    ".VPSidebarItem:has(> .item > .text > .course-lab-category--project)",
  );
  await expect(theoryGroup).toHaveClass(/collapsed/);
  await expect(exerciseGroup).toHaveClass(/collapsed/);
  await expect(projectGroup).not.toHaveClass(/collapsed/);

  await theoryGroup.locator(":scope > .item").focus();
  await page.keyboard.press("Enter");
  await expect(theoryGroup).not.toHaveClass(/collapsed/);
  await expect(theoryGroup.locator(":scope > .items a")).toHaveCount(4);
  await expect(
    theoryGroup.getByRole("link", { name: "03T01 · 串的基础选择题精练", exact: true }),
  ).toHaveCount(1);
  await expect(
    theoryGroup.getByRole("link", { name: "03T02 · 模式匹配选择题精练", exact: true }),
  ).toHaveCount(1);
  await expect(
    theoryGroup.getByRole("link", { name: "03T03 · 数组与矩阵选择题精练", exact: true }),
  ).toHaveCount(1);
  await expect(
    theoryGroup.getByRole("link", { name: "03T04 · 广义表选择题精练", exact: true }),
  ).toHaveCount(1);

  await exerciseGroup.locator(":scope > .item").focus();
  await page.keyboard.press("Enter");
  await expect(exerciseGroup).not.toHaveClass(/collapsed/);
  await expect(exerciseGroup.locator(":scope > .items a")).toHaveCount(9);
  for (const title of [
    "Lab 03-E-01：KMP 模式匹配（首次出现位置）",
    "Lab 03-E-02：next 与 nextval 数组推导",
    "Lab 03-E-03：朴素匹配与 KMP 比较次数",
    "Lab 03-E-04：串的非重叠替换 Replace",
    "Lab 03-E-05：UTF-8 串长与字符数",
    "Lab 03-E-06：广义表的表头与表尾",
    "Lab 03-E-07：广义表的深度",
    "Lab 03-E-08：三对角矩阵压缩与取值",
    "Lab 03-E-09：多维数组行优先寻址",
  ]) {
    await expect(exerciseGroup.getByRole("link", { name: labSidebarTitle(title) })).toHaveCount(1);
  }
  await expect(projectGroup.locator(":scope > .items a")).toHaveCount(2);
  for (const title of [
    "Lab 03-P-01：串匹配与文本处理引擎",
    "Lab 03-P-02：稀疏矩阵运算库",
  ]) {
    await expect(projectGroup.getByRole("link", { name: labSidebarTitle(title) })).toHaveCount(1);
  }
  await expect(exerciseGroup.locator(":scope > .items a").first()).toContainText("03E01");
  await expect(projectGroup.locator(":scope > .items a").first()).toContainText("03P01");

  expect(failures).toEqual([]);
});

test("chapter 5 exposes five Theory Labs, seventeen Exercise Labs, and an empty Project slot", async ({ page }) => {
  const failures = monitorPage(page);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(`${baseUrl}/learn/outline/chapter-05-tree-applications/`);

  const chapterGroup = page.locator(
    '.VPSidebarItem:has(> .item a[href*="/learn/outline/chapter-05-tree-applications/"])',
  );
  const labGroup = chapterGroup.locator(
    ".VPSidebarItem:has(> .item > .text > .course-lab-nav__title)",
  );
  await expect(chapterGroup).toHaveCount(1);
  await expect(labGroup).toHaveCount(1);
  await expect(labGroup).not.toHaveClass(/collapsed/);
  await expect(chapterGroup).not.toContainText("相关 Labs");

  const theoryGroup = chapterGroup.locator(
    ".VPSidebarItem:has(> .item > .text > .course-lab-category--theory)",
  );
  await expect(theoryGroup).toHaveCount(1);
  await expect(theoryGroup.locator(".course-lab-category--theory")).toContainText("理论 Theory");
  await expect(theoryGroup).toHaveClass(/collapsed/);
  await theoryGroup.locator(":scope > .item > .caret").click();
  await expect(theoryGroup).not.toHaveClass(/collapsed/);
  await expect(theoryGroup.locator(":scope > .items a")).toHaveCount(5);
  for (const title of [
    "Lab 05-T-01：森林与二叉树转换题精练",
    "Lab 05-T-02：树与森林遍历题精练",
    "Lab 05-T-03：哈夫曼树与编码题精练",
    "Lab 05-T-04：并查集题精练",
    "Lab 05-T-05：堆题精练",
  ]) {
    await expect(theoryGroup.getByRole("link", { name: labSidebarTitle(title) })).toHaveCount(1);
  }
  await expect(theoryGroup.locator(":scope > .items a").first()).toHaveText(
    "05T01 · 森林与二叉树转换题精练",
  );
  await expect(theoryGroup.locator(".course-lab-category__empty")).toHaveCount(0);

  const exerciseGroup = chapterGroup.locator(
    ".VPSidebarItem:has(> .item > .text > .course-lab-category--exercise)",
  );
  await expect(exerciseGroup).toHaveCount(1);
  await expect(exerciseGroup.locator(".course-lab-category--exercise")).toContainText(
    "实验 Exercise",
  );
  await expect(exerciseGroup).toHaveClass(/collapsed/);
  await exerciseGroup.locator(":scope > .item > .caret").click();
  await expect(exerciseGroup).not.toHaveClass(/collapsed/);
  await expect(exerciseGroup.locator(":scope > .items a")).toHaveCount(17);
  for (const title of [
    "Lab 05-E-01：二叉搜索树的插入与查找",
    "Lab 05-E-17：B+ 树的范围查询",
  ]) {
    await expect(exerciseGroup.getByRole("link", { name: labSidebarTitle(title) })).toHaveCount(1);
  }
  await expect(exerciseGroup.locator(":scope > .items a").first()).toContainText("05E01");
  await expect(exerciseGroup.locator(".course-lab-category__empty")).toHaveCount(0);

  const projectGroup = chapterGroup.locator(
    ".VPSidebarItem:has(> .item > .text > .course-lab-category--project)",
  );
  await expect(projectGroup).toHaveCount(1);
  await expect(projectGroup.locator(".course-lab-category--project")).toContainText(
    "工程 Project",
  );
  await expect(projectGroup).not.toHaveClass(/collapsed/);
  await expect(projectGroup.locator(":scope > .items a")).toHaveCount(0);
  await expect(projectGroup.locator(".course-lab-category__empty")).toHaveText(
    "暂无工程型 Lab",
  );

  await expect(labGroup.locator(".course-lab-category__empty")).toHaveCount(1);
  await expect(labGroup.locator(".course-lab-category svg")).toHaveCount(3);
  const labPanelStyle = await labGroup.evaluate((element) => {
    const style = globalThis.getComputedStyle(element);
    return {
      borderStyle: style.borderTopStyle,
      borderRadius: Number.parseFloat(style.borderTopLeftRadius),
      backgroundColor: style.backgroundColor,
    };
  });
  expect(labPanelStyle.borderStyle).toBe("solid");
  expect(labPanelStyle.borderRadius).toBeGreaterThan(0);
  expect(labPanelStyle.backgroundColor).not.toBe("rgba(0, 0, 0, 0)");

  await page.locator(".VPNavBarAppearance .VPSwitchAppearance").click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.setViewportSize({ width: 390, height: 844 });
  const layout = await page.evaluate(() => ({
    clientWidth: globalThis.document.documentElement.clientWidth,
    scrollWidth: globalThis.document.documentElement.scrollWidth,
  }));
  expect(layout.scrollWidth).toBeLessThanOrEqual(layout.clientWidth);
  expect(failures).toEqual([]);
});

test("chapter 14 exposes five DP lessons and three empty Lab categories", async ({ page }) => {
  const failures = monitorPage(page);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(`${baseUrl}/learn/outline/chapter-14-dynamic-programming/`);

  const chapterGroup = page.locator(
    '.VPSidebarItem:has(> .item a[href*="/learn/outline/chapter-14-dynamic-programming/"])',
  );
  await expect(chapterGroup).toHaveCount(1);
  await expect(chapterGroup).not.toContainText("相关 Labs");

  for (const title of [
    "第 14 章 动态规划：把重复搜索折叠成状态",
    "14.1 动态规划思维与状态设计",
    "14.2 从记忆化搜索到递推",
    "14.3 线性与网格动态规划",
    "14.4 背包动态规划：选择次数、目标语义与循环顺序",
  ]) {
    await expect(chapterGroup.getByRole("link", { name: title, exact: true })).toHaveCount(1);
  }

  const labGroup = chapterGroup.locator(
    ".VPSidebarItem:has(> .item > .text > .course-lab-nav__title)",
  );
  await expect(labGroup).toHaveCount(1);
  await expect(labGroup).not.toHaveClass(/collapsed/);

  const categories = [
    ["theory", "理论 Theory", "暂无理论型 Lab"],
    ["exercise", "实验 Exercise", "暂无实验型 Lab"],
    ["project", "工程 Project", "暂无工程型 Lab"],
  ];
  for (const [category, label, empty] of categories) {
    const group = labGroup.locator(
      `.VPSidebarItem:has(> .item > .text > .course-lab-category--${category})`,
    );
    await expect(group).toHaveCount(1);
    await expect(group.locator(`.course-lab-category--${category}`)).toContainText(label);
    if (category !== "project") {
      await group.locator(":scope > .item > .caret").click();
      await expect(group).not.toHaveClass(/collapsed/);
    }
    await expect(group.locator(":scope > .items a")).toHaveCount(0);
    await expect(group.locator(".course-lab-category__empty")).toHaveText(empty);
  }

  await expect(labGroup.locator(".course-lab-category__empty")).toHaveCount(3);
  const layout = await page.evaluate(() => ({
    clientWidth: globalThis.document.documentElement.clientWidth,
    scrollWidth: globalThis.document.documentElement.scrollWidth,
  }));
  expect(layout.scrollWidth).toBeLessThanOrEqual(layout.clientWidth);
  expect(failures).toEqual([]);
});

test("chapter 9 hash index theory quiz exposes all 18 questions and reconstructed tree prompts", async ({ page }) => {
  const failures = monitorPage(page);
  await page.goto(`${baseUrl}/labs/chapter-09/theory/T-09-01-hash-index-theory-quiz/`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Lab 09-T-01：散列与索引选择题精练",
  );

  const questions = page.locator(".course-quiz-question");
  await expect(questions).toHaveCount(18);
  await expect(page.locator(".course-quiz-nav li")).toHaveCount(18);
  await expect(page.locator(".course-quiz-option")).toHaveCount(72);
  await expect(page.locator(".course-quiz-meta")).toHaveCount(18);
  await expect(questions.nth(2).locator("pre")).toContainText("[55,65]");
  await expect(page.locator(".course-quiz-stem mjx-container").first()).toBeVisible();
  await expect(page.locator(".vp-doc")).not.toContainText(
    /查看原始页面|看交互可视化|答案来源说明|答案来源：Codex/,
  );

  const firstQuestion = questions.first();
  await firstQuestion.locator(".course-quiz-option").first().click();
  await firstQuestion.getByRole("button", { name: "提交答案" }).click();
  await expect(firstQuestion.locator(".course-quiz-feedback")).toContainText("正确答案：D");
  await expect(firstQuestion.locator(".course-quiz-explanation")).toContainText("B+ 树");
  await firstQuestion.getByRole("button", { name: "重新作答" }).click();
  await expect(firstQuestion.locator(".course-quiz-feedback")).toHaveCount(0);

  await page.setViewportSize({ width: 390, height: 844 });
  const layout = await page.evaluate(() => ({
    clientWidth: globalThis.document.documentElement.clientWidth,
    scrollWidth: globalThis.document.documentElement.scrollWidth,
  }));
  expect(layout.scrollWidth).toBeLessThanOrEqual(layout.clientWidth);
  expect(failures).toEqual([]);
});

test("chapter 8 search theory quiz exposes all 6 questions", async ({ page }) => {
  const failures = monitorPage(page);
  await page.goto(`${baseUrl}/labs/chapter-08/theory/T-08-01-search-theory-quiz/`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Lab 08-T-01：查找理论选择题精练",
  );

  const questions = page.locator(".course-quiz-question");
  await expect(questions).toHaveCount(6);
  await expect(page.locator(".course-quiz-nav li")).toHaveCount(6);
  await expect(page.locator(".course-quiz-option")).toHaveCount(24);
  await expect(page.locator(".course-quiz-meta")).toHaveCount(6);
  await expect(page.locator(".vp-doc")).not.toContainText(
    /查看原始页面|看交互可视化|答案来源说明|答案来源：Codex/,
  );
  expect(failures).toEqual([]);
});
