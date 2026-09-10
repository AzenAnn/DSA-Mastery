import { chromium, expect } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";

const base = process.env.LAB_PREVIEW_URL ?? "http://127.0.0.1:4174/DSA-Mastery";
const route = "/labs/chapter-01/theory/T-01-06-linear-list-written/";
const title = "Lab 01-T-06：线性表理论大题训练";
const output = "outputs/ch01-linear-list-preview";
await mkdir(output, { recursive: true });
const browser = await chromium.launch();
const failures = [], report = [];
try {
  for (const width of [1440, 390]) for (const theme of ["light", "dark"]) {
    console.log(`Checking ${width}px ${theme}`);
    const page = await browser.newPage({
      viewport: { width, height: 960 }, colorScheme: theme,
      permissions: ["clipboard-read", "clipboard-write"],
    });
    page.setDefaultTimeout(20000);
    page.on("pageerror", (error) => failures.push(error.message));
    page.on("console", (message) => { if (message.type() === "error") failures.push(message.text()); });
    page.on("requestfailed", (request) => {
      if (!request.failure()?.errorText.includes("ERR_ABORTED")) failures.push(request.url());
    });
    page.on("response", (response) => {
      if (response.url().startsWith(base) && response.status() >= 400) failures.push(`${response.status()} ${response.url()}`);
    });
    await page.goto(`${base}/labs/`);
    const card = page.locator("a.course-labs-list-card").filter({ hasText: title });
    await expect(card).toHaveCount(1);
    await card.click();
    await expect(page).toHaveURL(`${base}${route}`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);
    await expect(page.locator(".vp-doc h3")).toHaveCount(15);
    await expect(page.locator(".course-quiz")).toHaveCount(0);
    await expect(page.locator(".vp-doc")).toContainText("总计 150 分");
    await page.evaluate((scheme) => document.documentElement.classList.toggle("dark", scheme === "dark"), theme);
    await page.screenshot({ path: `${output}/${width}-${theme}-top.png` });
    const solutions = page.locator(".vp-doc details");
    await expect(solutions).toHaveCount(15);
    for (let i = 0; i < 15; i++) {
      const solution = solutions.nth(i);
      await expect(solution).not.toHaveAttribute("open");
      await expect(solution.locator("summary")).toHaveText(`第 ${i + 1} 题参考答案与评分要点`);
      await solution.locator("summary").click();
      await expect(solution).toHaveAttribute("open", "");
      await expect(solution).toContainText("评分要点（10 分）");
    }
    await expect(solutions.first().locator("mjx-container").first()).toBeVisible();
    await expect(solutions.nth(4).locator("table")).toBeVisible();
    const copy = solutions.first().locator("button.copy").first();
    await copy.click();
    const copied = await page.evaluate(() => navigator.clipboard.readText());
    expect(copied).toContain("lo = 0; hi = n");
    await solutions.first().locator("summary").focus();
    await page.keyboard.press("Enter");
    await expect(solutions.first()).not.toHaveAttribute("open");
    await page.keyboard.press("Enter");
    await expect(solutions.first()).toHaveAttribute("open", "");
    await page.screenshot({ path: `${output}/${width}-${theme}-answer.png` });
    const diagram = page.locator('.vp-doc img[alt^="交错单链表"]');
    await diagram.scrollIntoViewIfNeeded();
    await expect(diagram).toBeVisible();
    expect(await diagram.evaluate((img) => img.complete && img.naturalWidth > 400)).toBe(true);
    await page.screenshot({ path: `${output}/${width}-${theme}-diagram.png` });
    await solutions.last().scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${output}/${width}-${theme}-frequency.png` });
    const dimensions = await page.evaluate(() => ({
      width: innerWidth, scroll: document.documentElement.scrollWidth,
      brokenImages: [...document.querySelectorAll(".vp-doc img")].filter((img) => !img.complete || !img.naturalWidth).length,
      leakedContainers: [...document.querySelectorAll(".vp-doc p")].some((p) => /^:::/.test(p.textContent.trim())),
    }));
    expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.width);
    expect(dimensions.brokenImages).toBe(0);
    expect(dimensions.leakedContainers).toBe(false);
    if (width === 1440 && theme === "light") {
      await page.locator("#local-search button").click();
      await page.getByRole("searchbox").fill("线性表理论大题训练");
      const result = page.getByRole("listbox").locator(`a[href*="${route}"]`).first();
      await expect(result).toBeVisible({ timeout: 20000 });
      await result.click();
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);
    }
    report.push({ ...dimensions, theme, questions: 15, solutions: 15 });
    await page.close();
  }
  expect(failures).toEqual([]);
  await writeFile(`${output}/verification.json`, `${JSON.stringify({ base, route, report, failures }, null, 2)}\n`);
  console.log(JSON.stringify({ status: "PASS", report, failures }, null, 2));
} catch (error) {
  console.error(JSON.stringify({ failures }, null, 2));
  throw error;
} finally {
  await browser.close();
}
