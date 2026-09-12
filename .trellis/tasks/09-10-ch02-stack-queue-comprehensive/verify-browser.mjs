import { chromium, expect } from "@playwright/test";
import { mkdir, readFile, writeFile } from "node:fs/promises";

const base = process.env.LAB_PREVIEW_URL ?? "http://127.0.0.1:4173";
const route = "/labs/chapter-02/theory/T-02-03-stack-queue-comprehensive/";
const title = "Lab 02-T-03：栈与队列综合理论题";
const output = "outputs/ch02-stack-queue-preview";
await mkdir(output, { recursive: true });
const questions = JSON.parse(await readFile(`.${route}quiz.json`, "utf8"));
const browser = await chromium.launch();
const failures = [];
const report = [];
try {
  for (const width of [1440, 390]) {
    for (const theme of ["light", "dark"]) {
      console.log(`Checking ${width}px ${theme}`);
      const page = await browser.newPage({ viewport: { width, height: 960 }, colorScheme: theme });
      page.setDefaultTimeout(20000);
      page.on("pageerror", (error) => failures.push(error.message));
      page.on("console", (message) => {
        if (message.type() === "error") failures.push(message.text());
      });
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
      await expect(page.locator(".course-quiz-question")).toHaveCount(20);
      await expect(page.locator(".course-quiz-option")).toHaveCount(80);
      await expect(page.locator(".course-quiz-nav li")).toHaveCount(20);
      await expect(page.locator(".course-quiz-summary")).toContainText("已答 0/20");
      await page.evaluate((scheme) => {
        document.documentElement.classList.toggle("dark", scheme === "dark");
      }, theme);
      await page.screenshot({ path: `${output}/${width}-${theme}-top.png` });
      const first = page.locator(".course-quiz-question").first();
      await expect(first.getByRole("button", { name: "提交答案" })).toBeDisabled();
      await first.locator(".course-quiz-option").nth((questions[0].answer + 1) % 4).click();
      await first.getByRole("button", { name: "提交答案" }).click();
      await expect(first.locator(".course-quiz-feedback")).toContainText("回答错误");
      await first.getByRole("button", { name: "重新作答" }).click();
      await expect(first.locator(".course-quiz-feedback")).toHaveCount(0);
      for (let i = 0; i < questions.length; i += 1) {
        const question = page.locator(".course-quiz-question").nth(i);
        await question.locator(".course-quiz-option").nth(questions[i].answer).click();
        await question.getByRole("button", { name: "提交答案" }).click();
        await expect(question.locator(".course-quiz-feedback")).toContainText("回答正确");
      }
      await expect(page.locator(".course-quiz-summary")).toContainText("已答 20/20");
      await expect(page.locator(".course-quiz-summary")).toContainText("正确 20");
      await expect(page.locator(".course-quiz-stem mjx-container").first()).toBeVisible();
      const diagram = page.locator('.course-quiz-stem img[src*="ds-2016-03"]');
      await expect(diagram).toBeVisible();
      expect(await diagram.evaluate((img) => img.complete && img.naturalWidth > 100)).toBe(true);
      await page.locator("#quiz-q13").screenshot({ path: `${output}/${width}-${theme}-rail.png` });
      await expect(page.locator("#quiz-q9 .course-quiz-explanation table")).toBeVisible();
      const solutions = page.locator(".vp-doc details").filter({ has: page.locator("summary", { hasText: /^综合题 [1-5] 参考答案与评分要点$/ }) });
      await expect(solutions).toHaveCount(5);
      for (let i = 0; i < 5; i += 1) {
        await expect(solutions.nth(i)).not.toHaveAttribute("open");
        await solutions.nth(i).locator("summary").click();
        await expect(solutions.nth(i)).toHaveAttribute("open", "");
        await expect(solutions.nth(i)).toContainText("评分要点（12 分）");
      }
      await solutions.nth(1).scrollIntoViewIfNeeded();
      await page.screenshot({ path: `${output}/${width}-${theme}-written.png` });
      const dimensions = await page.evaluate(() => ({
        width: innerWidth,
        scroll: document.documentElement.scrollWidth,
        brokenImages: [...document.querySelectorAll(".vp-doc img")].filter((img) => !img.complete || !img.naturalWidth).length,
      }));
      expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.width);
      expect(dimensions.brokenImages).toBe(0);
      if (width === 1440 && theme === "light") {
        await page.locator("#local-search button").click();
        await page.getByRole("searchbox").fill("栈与队列综合理论题");
        const result = page.getByRole("listbox").locator(`a[href*="${route}"]`).first();
        await expect(result).toBeVisible({ timeout: 20000 });
        await result.click();
        await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);
      }
      report.push({ width, theme, ...dimensions, choices: 20, written: 5 });
      await page.close();
    }
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
