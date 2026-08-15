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
const chapterDirectoryPattern = /^chapter-\d{2}-[a-z0-9-]+$/;
const labDirectoryPattern = /^lab-\d{2}-\d{2}-[a-z0-9-]+$/;

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
    const labEntries = await readdir(path.join(labsRoot, chapter.name), { withFileTypes: true });
    labs += labEntries.filter((entry) => entry.isDirectory() && labDirectoryPattern.test(entry.name)).length;
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
  await page.locator(".course-curriculum-resource-list").getByRole("link", { name: /0\.1 数据结构基础概念/ }).click();
  await expect(page).toHaveURL(`${baseUrl}/learn/chapter-00-introduction/01-data-structure-basics/`);
  await page.locator(".VPNavBarMenu").getByRole("link", { name: "教材" }).click();
  await expect(page).toHaveURL(`${baseUrl}/learn/`);
  await page.locator(".VPSidebar").getByRole("link", { name: /Ch\.0\+ 算法思维体验/ }).click();
  await expect(page).toHaveURL(`${baseUrl}/learn/outline/chapter-00-plus-algorithm-thinking/`);
  await expect(page.locator(".course-curriculum-detail")).toContainText("Peak Finding");
  await expect(page.locator(".course-curriculum-detail")).toContainText("Union-Find");
  await expect(page.locator(".course-curriculum-detail")).toContainText("数据结构的选择如何影响算法效率");
  await page.locator(".course-curriculum-resource-list").getByRole("link", { name: /算法复杂度与算法分析/ }).click();
  await expect(page).toHaveURL(`${baseUrl}/learn/chapter-00-introduction/03-algorithm-complexity-analysis/`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("0.3 算法复杂度与算法分析");
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
    results.locator('a[href*="/labs/chapter-01/lab-01-08-static-linked-list-quiz/"]').first(),
  ).toBeVisible();
  await input.fill("算法复杂度与算法分析");
  await expect(
    results.locator('a[href*="/learn/chapter-00-introduction/03-algorithm-complexity-analysis/"]').first(),
  ).toBeVisible();
  await input.fill("实现并验证单链表");
  const labResult = results.locator('a[href*="/labs/chapter-01/lab-01-02-linked-list/"]').first();
  await expect(labResult).toBeVisible();
  await labResult.click();
  await expect(page).toHaveURL(
    (url) => url.pathname === `${pagesBasePath}/labs/chapter-01/lab-01-02-linked-list/`,
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
  await expect(page.locator(".course-curriculum-resource-list")).toContainText("6.1 二叉排序树");

  await page.goto(`${baseUrl}/learn/outline/chapter-12-divide-conquer-recursion/`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("分治与递归");
  await expect(page.locator(".course-curriculum-empty")).toContainText("后续迭代中完善");

  await page.goto(`${baseUrl}/learn/chapter-06-search/01-binary-search-tree/`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("6.1 二叉排序树");
  await page.goto(`${baseUrl}/labs/chapter-06/lab-06-02-hash-table/`);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("散列表");
  expect(failures).toEqual([]);
});

test("chapter 0 code contrast, callouts, math, copy, details, tables, and metadata remain functional", async ({ page }) => {
  const failures = monitorPage(page);
  await page.goto(`${baseUrl}/learn/chapter-00-introduction/03-algorithm-complexity-analysis/`);
  const codeContrast = async () =>
    page.locator('.vp-doc div[class*="language-"].line-numbers-mode').first().evaluate((block) => {
      const parseColor = (value) => {
        const channels = value.match(/[\d.]+/g)?.map(Number) ?? [];
        return {
          red: channels[0] ?? 0,
          green: channels[1] ?? 0,
          blue: channels[2] ?? 0,
          alpha: channels[3] ?? 1,
        };
      };
      const composite = (foreground, background) => ({
        red: foreground.red * foreground.alpha + background.red * (1 - foreground.alpha),
        green: foreground.green * foreground.alpha + background.green * (1 - foreground.alpha),
        blue: foreground.blue * foreground.alpha + background.blue * (1 - foreground.alpha),
        alpha: 1,
      });
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
          const lineBackground = parseColor(
            globalThis.getComputedStyle(token.closest(".highlighted") ?? block).backgroundColor,
          );
          return contrast(foreground, composite(lineBackground, blockBackground));
        });
      const lineNumber = block.querySelector(".line-numbers-wrapper span");
      const pre = block.querySelector("pre");

      return {
        minimumTokenContrast: Math.min(...tokenContrasts),
        lineNumberContrast: lineNumber
          ? contrast(parseColor(globalThis.getComputedStyle(lineNumber).color), blockBackground)
          : 0,
        codeFontSize: Number.parseFloat(globalThis.getComputedStyle(block.querySelector("code")).fontSize),
        overflowX: globalThis.getComputedStyle(pre).overflowX,
        overflowY: globalThis.getComputedStyle(pre).overflowY,
      };
    });

  const lightCodeContrast = await codeContrast();
  expect(lightCodeContrast.minimumTokenContrast).toBeGreaterThanOrEqual(4.5);
  expect(lightCodeContrast.lineNumberContrast).toBeGreaterThanOrEqual(4.5);
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
  expect(darkCodeContrast.lineNumberContrast).toBeGreaterThanOrEqual(4.5);

  const codeBlock = page.locator('.vp-doc div[class*="language-"]').first();
  await expect(codeBlock).toBeVisible();
  const copyButton = codeBlock.locator("button.copy");
  await copyButton.click();
  await expect(copyButton).toHaveClass(/copied/);
  await expect(page.getByRole("link", { name: "在 GitHub 上编辑此页" })).toHaveAttribute(
    "href",
    /content\/chapter-00-introduction\/03-algorithm-complexity-analysis\.md$/,
  );
  await expect(page.locator(".vp-doc .custom-block.info").first()).toBeVisible();
  await expect(page.locator(".vp-doc .custom-block.warning").first()).toBeVisible();
  await expect(page.locator(".vp-doc mjx-container").first()).toBeVisible();
  const details = page.locator(".vp-doc details").first();
  await expect(details).not.toHaveAttribute("open", "");
  await details.locator("summary").click();
  await expect(details).toHaveAttribute("open", "");

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
  await expect(page.locator(".VPSidebar.open")).toContainText("1.2 顺序表");
  await expect(page.locator(".VPSidebar.open")).toContainText("1.3 第二种实现——链表与演进设计");
  await expect(page.locator(".VPSidebar.open")).toContainText("1.4 比较与权衡");
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
  const route = `${baseUrl}/learn/chapter-00-introduction/03-algorithm-complexity-analysis/`;

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
  const route = `${baseUrl}/learn/chapter-00-introduction/03-algorithm-complexity-analysis/`;

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
  await page.goto(`${baseUrl}/labs/chapter-00/lab-00-03-complexity-quiz/`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Lab 00-03：复杂度计算自测");
  const questions = page.locator(".course-quiz-question");
  await expect(questions).toHaveCount(19);

  // 右侧答题进度导航：19 个圈，初始全部未作答
  const navigator = page.locator(".course-quiz-nav");
  await expect(navigator).toBeVisible();
  await expect(navigator.locator("li")).toHaveCount(19);
  await expect(navigator.locator("li.is-pending")).toHaveCount(19);

  // 第 1 题故意选错：立即出现错误反馈、正确答案与题解，导航第 1 圈变红
  const first = questions.first();
  await first.locator(".course-quiz-option").nth(1).click();
  await expect(first.getByRole("radio").nth(1)).toBeChecked();
  await first.getByRole("button", { name: "提交答案" }).click();
  await expect(first.locator(".course-quiz-feedback")).toContainText("回答错误");
  await expect(first.locator(".course-quiz-feedback")).toContainText("正确答案：A. O(log n)");
  await expect(first.locator(".course-quiz-explanation")).toContainText("翻倍");
  await expect(first.locator(".course-quiz-options")).toHaveClass(/is-submitted/);
  await expect(first.getByRole("radio").first()).toBeDisabled();
  await expect(navigator.locator("li").first()).toHaveClass(/is-wrong/);

  // 第 2 题选对：正确反馈，导航第 2 圈变绿；重新作答后回到未作答状态
  const second = questions.nth(1);
  await second.locator(".course-quiz-option").nth(1).click();
  await second.getByRole("button", { name: "提交答案" }).click();
  await expect(second.locator(".course-quiz-feedback")).toContainText("回答正确");
  await expect(navigator.locator("li").nth(1)).toHaveClass(/is-correct/);
  await second.getByRole("button", { name: "重新作答" }).click();
  await expect(second.locator(".course-quiz-feedback")).toHaveCount(0);
  await expect(second.getByRole("radio").nth(1)).toBeEnabled();
  await expect(navigator.locator("li").nth(1)).toHaveClass(/is-pending/);

  // 点击导航第 3 个圈应跳转到第 3 题卡片
  await navigator.locator("li").nth(2).getByRole("button").click();
  await expect(questions.nth(2)).toBeInViewport();

  expect(failures).toEqual([]);
});

test("programming problem template renders the standard problem sections", async ({ page }) => {
  const failures = monitorPage(page);
  await page.goto(`${baseUrl}/labs/chapter-01/lab-01-03-problem-template/`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Lab 01-03：编程题页面样板");

  // 题面 7 要素全部渲染
  for (const heading of ["题目", "输入格式", "输出格式", "数据范围与限制", "样例", "如何验证"]) {
    await expect(page.locator(".vp-doc h2").filter({ hasText: heading })).toHaveCount(1);
  }
  // 「任务要求」属于「题目」小节下的 h3
  await expect(page.locator(".vp-doc h3").filter({ hasText: "任务要求" })).toHaveCount(1);

  // 样例输入与输出代码块
  const sampleInput = page.locator(".vp-doc pre").filter({ hasText: "1 3 5 7" });
  await expect(sampleInput).toBeVisible();
  await expect(page.locator(".vp-doc pre").filter({ hasText: "1 2 3 4 5 6 7" })).toBeVisible();

  // 数据范围表格与样例解释表格
  await expect(page.locator(".vp-doc table")).toHaveCount(2);

  // 验证清单的 checkbox 渲染
  await expect(page.locator('.vp-doc input[type="checkbox"]')).toHaveCount(3);

  // 页内链接到该 Lab 的入口在 Labs 索引中存在
  await page.goto(`${baseUrl}/labs/`);
  await expect(
    page.locator("a.course-labs-list-card").filter({ hasText: "Lab 01-03：编程题页面样板" }),
  ).toBeVisible();

  expect(failures).toEqual([]);
});

test("linear-list quiz Labs are interactive and complete in the chapter sidebar", async ({ page }) => {
  const failures = monitorPage(page);
  const quizLabs = [
    {
      slug: "lab-01-04-sequential-list-quiz",
      title: "Lab 01-04：顺序表选择题精练",
      questions: 10,
    },
    {
      slug: "lab-01-05-singly-linked-list-quiz",
      title: "Lab 01-05：单链表选择题精练",
      questions: 10,
    },
    {
      slug: "lab-01-06-doubly-linked-list-quiz",
      title: "Lab 01-06：双链表选择题精练",
      questions: 10,
    },
    {
      slug: "lab-01-07-circular-linked-list-quiz",
      title: "Lab 01-07：循环链表选择题精练",
      questions: 2,
    },
    {
      slug: "lab-01-08-static-linked-list-quiz",
      title: "Lab 01-08：静态链表选择题精练",
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
    await expect(
      page.locator(".vp-doc details > summary").filter({ hasText: "展开答案表" }),
    ).toHaveCount(1);

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

  await page.goto(`${baseUrl}/labs/chapter-01/lab-01-04-sequential-list-quiz/`);
  const chapterSidebar = page.locator(".VPSidebar");
  for (const quiz of quizLabs) {
    await expect(chapterSidebar.getByRole("link", { name: quiz.title, exact: true })).toHaveCount(1);
  }
  await expect(page.locator(".course-quiz-stem mjx-container").first()).toBeVisible();

  await page.goto(`${baseUrl}/labs/chapter-01/lab-01-05-singly-linked-list-quiz/`);
  await expect(page.locator(".course-quiz-question").nth(1).locator("table")).toBeVisible();

  expect(failures).toEqual([]);
});
