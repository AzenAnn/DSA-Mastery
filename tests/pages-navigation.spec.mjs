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
  await input.fill("存储模型");
  await expect(results.locator('a[href*="/learn/chapter-01-linear-list/03-linked-list/"]')).toBeVisible();
  await input.fill("算法复杂度与算法分析");
  await expect(
    results.locator('a[href*="/learn/chapter-00-introduction/02-algorithm-complexity-analysis/"]').first(),
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

test("chapter 0 code contrast, callouts, math, copy, details, tables, and metadata remain functional", async ({ page }) => {
  const failures = monitorPage(page);
  await page.goto(`${baseUrl}/learn/chapter-00-introduction/02-algorithm-complexity-analysis/`);
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
    /content\/chapter-00-introduction\/02-algorithm-complexity-analysis\.md$/,
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
  await page.keyboard.press("Escape");
  await expect(page.locator(".VPSidebar")).toBeHidden();

  await page.locator(".VPNavBarHamburger").click();
  await expect(page.locator(".VPNavScreen")).toBeVisible();
  await expect(page.locator(".VPNavScreen")).toContainText("Labs");
  expect(failures).toEqual([]);
});

test("home and lesson navbar share the same horizontal rail", async ({ page }) => {
  const failures = monitorPage(page);
  const widths = [1024, 1440, 2048];
  const route = `${baseUrl}/learn/chapter-00-introduction/02-algorithm-complexity-analysis/`;

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
  const route = `${baseUrl}/learn/chapter-00-introduction/02-algorithm-complexity-analysis/`;

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
