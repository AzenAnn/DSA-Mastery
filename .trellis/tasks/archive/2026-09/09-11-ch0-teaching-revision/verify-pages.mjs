import assert from "node:assert/strict";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { chromium } from "@playwright/test";

const root = process.cwd();
const artifact = path.join(root, "dist", "pages");
const output = path.join(root, "outputs", "ch0-teaching-revision");
await mkdir(output, { recursive: true });
const base = "/DSA-Mastery";
const mime = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png", ".woff2": "font/woff2", ".json": "application/json" };
const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url, "http://localhost");
    if (!url.pathname.startsWith(`${base}/`)) return response.writeHead(404).end();
    let file = path.resolve(artifact, decodeURIComponent(url.pathname.slice(base.length + 1)));
    if (file !== artifact && !file.startsWith(`${artifact}${path.sep}`)) return response.writeHead(403).end();
    if ((await stat(file)).isDirectory()) file = path.join(file, "index.html");
    response.writeHead(200, { "content-type": mime[path.extname(file)] ?? "application/octet-stream" });
    response.end(await readFile(file));
  } catch {
    response.writeHead(404).end();
  }
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch();
const results = [];
const fragmentFailures = new Set();
const lessons = ["01-data-structure-basics", "02-time-and-space-complexity"];
try {
  for (const width of [1440,390]) for (const theme of ["light","dark"]) {
    const context = await browser.newContext({ viewport: {width,height:900}, colorScheme: theme });
    await context.addInitScript((value) => localStorage.setItem("vitepress-theme-appearance", value), theme);
    const page = await context.newPage();
    const failures = [];
    page.on("pageerror", (error) => failures.push(error.message));
    page.on("console", (message) => { if(message.type()==="error") failures.push(message.text()); });
    page.on("requestfailed", (request) => { if(!request.failure()?.errorText.includes("ERR_ABORTED")) failures.push(request.url()); });
    page.on("response", (response) => { if(response.url().startsWith(origin) && response.status()>=400) failures.push(`${response.status()} ${response.url()}`); });
    for (const lesson of lessons) {
      await page.goto(`${origin}${base}/learn/chapter-00-introduction/${lesson}/`, {waitUntil:"networkidle"});
      assert.equal(await page.locator("html").evaluate((el)=>el.classList.contains("dark")), theme==="dark");
      const doc=page.locator(".vp-doc");
      assert.equal(await page.getByRole("heading", {level:1}).count(),1);
      assert.equal(await doc.locator('[data-mjx-error], mjx-merror, [data-mml-node="merror"]').count(),0);
      assert(!/::: (?:details|definition|proof|complexity)/.test(await doc.innerText()));
      const details=doc.locator("details");
      for(let i=0;i<await details.count();++i) {
        const item=details.nth(i);
        assert.equal(await item.getAttribute("open"),null);
        await item.locator("summary").click();
        assert.equal(await item.getAttribute("open"),"");
      }
      const group=doc.locator(".vp-code-group");
      assert.equal(await group.count(),1);
      await group.locator(".tabs label").nth(1).click();
      assert.equal(await group.locator("input").nth(1).isChecked(),true);
      const images=doc.locator("figure.vpd-diagram img");
      assert.equal(await images.count(),lesson.startsWith("01")?3:1);
      assert.equal(await doc.locator(".vpd-diagram-caption").count(),await images.count());
      const diagramEvidence=[];
      for(let i=0;i<await images.count();++i) {
        const img=images.nth(i);
        await img.scrollIntoViewIfNeeded();
        await img.evaluate((el)=>el.decode());
        const geometry=await img.evaluate((el)=>({width:el.clientWidth,height:el.clientHeight,naturalWidth:el.naturalWidth,src:el.src}));
        assert(geometry.width>100 && geometry.height>50 && geometry.naturalWidth>0);
        assert(geometry.src.includes(`${base}/diagrams/`));
        const svg=await (await page.request.get(geometry.src)).text();
        assert(svg.includes('fill="white"') || svg.includes('fill="#ffffff"'));
        assert((svg.match(/<text\b/g)??[]).length>=4);
        const figure=img.locator("..");
        assert(await figure.locator(".vpd-diagram-caption").isVisible());
        await figure.screenshot({path:path.join(output,`${lesson}-${width}-${theme}-diagram-${i+1}.png`)});
        diagramEvidence.push(geometry);
      }
      const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
      assert(overflow<=0,`${lesson} ${width} ${theme}: overflow ${overflow}`);
      const mathCount=await doc.locator("mjx-container").count();
      if(lesson.startsWith("02")) {
        assert(mathCount>10);
        await doc.locator(".dsa-theory-block--proof").first().scrollIntoViewIfNeeded();
        await page.screenshot({path:path.join(output,`${lesson}-${width}-${theme}-proof.png`)});
        await details.nth(0).scrollIntoViewIfNeeded();
        await page.screenshot({path:path.join(output,`${lesson}-${width}-${theme}-details.png`)});
      } else {
        await doc.locator("#抽象数据类型").scrollIntoViewIfNeeded();
        await page.screenshot({path:path.join(output,`${lesson}-${width}-${theme}-contract.png`)});
      }
      // Audit fragments too: check:site intentionally validates only the route pathname.
      const links=await doc.locator('a[href*="#"]').evaluateAll((els)=>els.map(el=>el.href));
      for(const href of new Set(links)) {
        const url=new URL(href);
        if(url.origin!==origin || !url.hash) continue;
        if(url.pathname===new URL(page.url()).pathname) {
          if(!await page.evaluate((id)=>Boolean(document.getElementById(id)),decodeURIComponent(url.hash.slice(1)))) fragmentFailures.add(url.pathname+url.hash);
        } else {
          const linked=await (await page.request.get(url.href)).text();
          if(!linked.includes(`id="${decodeURIComponent(url.hash.slice(1))}"`)) fragmentFailures.add(url.pathname+url.hash);
        }
      }
      await page.screenshot({path:path.join(output,`${lesson}-${width}-${theme}-full.png`),fullPage:true});
      assert.deepEqual(failures,[]);
      results.push({lesson,width,theme,details:await details.count(),mathCount,overflow,diagrams:diagramEvidence});
    }
    const quizUrl=`${origin}${base}/labs/chapter-00/theory/T-00-02-complexity-quiz/`;
    await page.goto(quizUrl,{waitUntil:"networkidle"});
    const questions=page.locator(".course-quiz-question");
    assert.equal(await questions.count(),19);
    for(const [index,answer] of [[4,1],[10,2],[18,0]]) {
      const question=questions.nth(index);
      const options=question.locator('input[type="radio"]');
      assert.equal(await options.count(),4);
      await question.locator(".course-quiz-option").nth(answer).click();
      assert.equal(await options.nth(answer).isChecked(),true);
      await question.getByRole("button",{name:"提交答案",exact:true}).click();
      assert((await question.innerText()).includes("回答正确"));
      if(index===18) {
        assert((await question.innerText()).includes("不会变成平方级"));
        await question.screenshot({path:path.join(output,`quiz-q19-${width}-${theme}.png`)});
      }
      await question.getByRole("button",{name:"重新作答",exact:true}).click();
      assert.equal(await question.locator('input:checked').count(),0);
    }
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    assert.deepEqual(failures,[]);
    await context.close();
  }
  await writeFile(path.join(output,"browser-results.json"),JSON.stringify(results,null,2));
  assert.deepEqual([...fragmentFailures],[]);
  console.log(`PASS: ${results.length} article viewport/theme combinations, figures, math, details, tabs, fragments; quiz q5/q11/q19 submission and retry in 4 combinations.`);
} finally {
  await browser.close();
  await new Promise((resolve)=>server.close(resolve));
}
