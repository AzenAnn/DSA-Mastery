import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const destination = new URL("review/", import.meta.url);
await mkdir(destination, { recursive: true });
const browser = await chromium.launch();
const reports = [];
try {
  for (const width of [1440, 390]) for (const theme of ["light", "dark"]) {
    const context = await browser.newContext({ viewport: { width, height: width === 390 ? 844 : 1000 } });
    await context.addInitScript((value) => localStorage.setItem("vitepress-theme-appearance", value), theme);
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
    page.on("response", (response) => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
    for (const slug of ["E-04-15-create-inorder-thread", "E-04-17-forest-to-binary-tree"]) {
      const response = await page.goto(`http://127.0.0.1:4175/DSA-Mastery/labs/chapter-04/exercise/${slug}/`);
      assert.equal(response.status(), 200);
      await page.locator(".vp-doc img").scrollIntoViewIfNeeded();
      await page.locator(".vp-doc img").evaluate(async (image) => { await image.decode(); });
      assert(await page.locator(".vp-doc img").evaluate((image) => image.naturalWidth > 0));
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth));
      await page.screenshot({ path: fileURLToPath(new URL(`${slug}-${width}-${theme}.png`, destination)) });
    }
    assert.deepEqual(errors, []);
    reports.push({ width, theme, errors, diagrams: 2, overflow: false });
    await context.close();
  }
} finally {
  await browser.close();
}
await writeFile(new URL("preview-check.json", destination), JSON.stringify(reports, null, 2) + "\n");
console.log("PASS: actual preview on port 4175, desktop/mobile and light/dark");
