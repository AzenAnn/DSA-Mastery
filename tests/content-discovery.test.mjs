import { spawnSync } from "node:child_process";
import { mkdir, readFile, readdir, rm, rmdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { afterAll, beforeAll, expect, it } from "vitest";

const projectRoot = path.resolve(import.meta.dirname, "..");
const distPages = path.join(projectRoot, "dist", "pages");
const lessonDirectory = path.join(projectRoot, "content", "chapter-99-discovery-fixture");
const labDirectory = path.join(projectRoot, "labs", "chapter-99", "exercise", "E-99-01-discovery-fixture");
const stableTitleLabDirectory = path.join(projectRoot, "labs", "chapter-99", "theory", "T-99-01-stable-title-fixture");
const sidebarLabDirectory = path.join(
  projectRoot,
  "labs",
  "chapter-01",
  "exercise",
  "E-01-99-sidebar-discovery-fixture",
);
const projectCategoryDirectory = path.join(projectRoot, "labs", "chapter-99", "project");
const projectCategoryMarker = path.join(projectCategoryDirectory, ".gitkeep");
const assetBytes = Buffer.from([0, 1, 127, 128, 254, 255]);

const pagesEnvironment = {
  ...process.env,
  GITHUB_PAGES_BASE_PATH: "/DSA-Mastery",
  SITE_URL: "https://azenann.github.io/DSA-Mastery/",
};

const lesson = `---
title: "第 99 章 自动发现验证"
description: "验证新增教材会自动进入页面、导航、搜索和统计。"
order: 0
chapter: 99
chapterTitle: "自动发现验证"
updated: "2026-08-10"
contributors: ["Discovery Test"]
status: "draft"
---

# 第 99 章 自动发现验证

## 理论语法、公式、代码与表格

当 $a == b$ 且 $T(n)=n+1$ 时，增长数量级为 $O(n)$。

普通文本使用 ==语义高亮==，而行内代码 \`a == b\` 保持代码语义。

::: definition <img src=x onerror=alert(1)>
理论容器检索锚点：定义正文包含[站内链接](../chapter-00-introduction/00-overview.md)、行内代码 \`size()\`、公式 $T(n)$ 和列表：

- 第一项；
- 第二项。

| 输入 | 期望 |
| --- | --- |
| 空表 | 0 |

\`\`\`text
container-code
\`\`\`
:::

::: definition
默认定义正文。
:::

::: theorem
定理正文。
:::

::: lemma 自定义引理
引理正文。
:::

::: lemma
默认引理正文。
:::

::: corollary
推论正文。
:::

::: property
性质正文。
:::

::: proof
证明正文。
:::

::: intuition
直觉正文。
:::

::: example
示例正文。
:::

::: example 示例 · $n=16$ 时最多比较几次
标题公式渲染检查正文。
:::

::: counterexample
反例正文。
:::

::: complexity
复杂度正文。
:::

::: pitfall
易错点正文。
:::

\`\`\`js:line-numbers [theory-fixture.js]
const equal = a == b // [!code focus]
const added = true   // [!code ++]
const removed = true // [!code --]
const risky = true   // [!code warning]
const invalid = true // [!code error]
\`\`\`

::: code-group

\`\`\`js [native-tab.js]
const grouped = true
\`\`\`

\`\`\`ts [native-tab.ts]
const grouped: boolean = true
\`\`\`

:::

- [ ] 自动发现任务列表

[进入自动发现 Lab](../../labs/chapter-99/exercise/E-99-01-discovery-fixture/README.md)
`;

const lab = `---
title: "Lab 99-E-01：自动发现验证"
description: "验证新增 Lab 会自动进入页面、导航、搜索和统计。"
order: 1
chapter: 99
labId: "99E01"
chapterTitle: "自动发现验证"
updated: "2026-08-10"
contributors: ["Discovery Test"]
status: "draft"
lab: true
labCategory: exercise
difficulty: "测试"
duration: "1 分钟"
---

# Lab 99-E-01：自动发现验证

## 验收标准

- [ ] 页面、导航和搜索均包含本 Lab。
`;

const stableTitleLab = `---
title: "Lab 99-T-01：稳定标题验证"
description: "验证目录、labId、frontmatter 标题和 H1 使用同一稳定编号。"
order: 2
chapter: 99
labId: "99T01"
chapterTitle: "自动发现验证"
updated: "2026-09-01"
contributors: ["Discovery Test"]
status: "draft"
lab: true
labCategory: theory
difficulty: "测试"
duration: "1 分钟"
---

# Lab 99-T-01：稳定标题验证

## 验收标准

- [ ] 目录、题号和标题保持一致。
`;

const sidebarLab = `---
title: "Lab 01-E-99：章节侧栏自动收录验证"
description: "验证新增线性表 Lab 会自动进入本章 Labs 的实验分类。"
order: 99
chapter: 1
labId: "01E99"
chapterTitle: "线性表"
updated: "2026-08-14"
contributors: ["Discovery Test"]
status: "draft"
lab: true
difficulty: "测试"
duration: "1 分钟"
labCategory: exercise
---

# Lab 01-E-99：章节侧栏自动收录验证

## 验收标准

- [ ] 本 Lab 自动出现在 Ch.1 线性表的实验 Exercise 中。
`;

function runNpm(args) {
  const command = process.platform === "win32" ? (process.env.ComSpec ?? "cmd.exe") : "npm";
  const commandArgs = process.platform === "win32" ? ["/d", "/s", "/c", ["npm", ...args].join(" ")] : args;
  const result = spawnSync(command, commandArgs, {
    cwd: projectRoot,
    env: pagesEnvironment,
    encoding: "utf8",
    stdio: "pipe",
  });
  if (result.status !== 0) {
    throw new Error(
      [`npm ${args.join(" ")} failed`, result.error?.message, result.stdout, result.stderr].filter(Boolean).join("\n"),
    );
  }
}

// 仅允许删除本套件自己创建的 fixture 目录，避免清理阶段误删教材。
function assertFixtureTarget(target, allowedParent, expectedName) {
  const resolved = path.resolve(target);
  const parent = `${path.resolve(allowedParent)}${path.sep}`;
  if (!resolved.startsWith(parent) || path.basename(resolved) !== expectedName) {
    throw new Error(`Refusing to remove unexpected fixture target: ${resolved}`);
  }
}

async function filesRecursively(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await filesRecursively(target)));
    else files.push(target);
  }
  return files;
}

const html = {};
let searchableJavaScript;

beforeAll(async () => {
  await mkdir(lessonDirectory, { recursive: true });
  await mkdir(labDirectory, { recursive: true });
  await mkdir(stableTitleLabDirectory, { recursive: true });
  await mkdir(projectCategoryDirectory, { recursive: true });
  await mkdir(sidebarLabDirectory, { recursive: true });
  const nestedAssets = path.join(stableTitleLabDirectory, "assets", "nested");
  await mkdir(nestedAssets, { recursive: true });
  await writeFile(path.join(nestedAssets, "quiz evidence.bin"), assetBytes);
  await writeFile(path.join(lessonDirectory, "00-autodiscovery.md"), lesson, "utf8");
  await writeFile(path.join(labDirectory, "README.md"), lab, "utf8");
  await writeFile(path.join(stableTitleLabDirectory, "README.md"), stableTitleLab, "utf8");
  await writeFile(path.join(sidebarLabDirectory, "README.md"), sidebarLab, "utf8");
  await writeFile(projectCategoryMarker, "", "utf8");

  runNpm(["run", "validate:content"]);
  runNpm(["run", "build:vitepress"]);
  runNpm(["run", "check:site"]);

  html.lesson = await readFile(
    path.join(distPages, "learn", "chapter-99-discovery-fixture", "00-autodiscovery", "index.html"),
    "utf8",
  );
  html.lab = await readFile(
    path.join(distPages, "labs", "chapter-99", "exercise", "E-99-01-discovery-fixture", "index.html"),
    "utf8",
  );
  html.stableTitle = await readFile(
    path.join(distPages, "labs", "chapter-99", "theory", "T-99-01-stable-title-fixture", "index.html"),
    "utf8",
  );
  html.sidebar = await readFile(
    path.join(distPages, "labs", "chapter-01", "exercise", "E-01-99-sidebar-discovery-fixture", "index.html"),
    "utf8",
  );
  html.chapterFiveOutline = await readFile(
    path.join(distPages, "learn", "outline", "chapter-05-tree-applications", "index.html"),
    "utf8",
  );
  const searchFiles = (await filesRecursively(distPages)).filter((file) => file.endsWith(".js"));
  searchableJavaScript = (await Promise.all(searchFiles.map((file) => readFile(file, "utf8")))).join("\n");
});

afterAll(async () => {
  assertFixtureTarget(lessonDirectory, path.join(projectRoot, "content"), "chapter-99-discovery-fixture");
  assertFixtureTarget(
    labDirectory,
    path.join(projectRoot, "labs", "chapter-99", "exercise"),
    "E-99-01-discovery-fixture",
  );
  assertFixtureTarget(
    stableTitleLabDirectory,
    path.join(projectRoot, "labs", "chapter-99", "theory"),
    "T-99-01-stable-title-fixture",
  );
  assertFixtureTarget(
    sidebarLabDirectory,
    path.join(projectRoot, "labs", "chapter-01", "exercise"),
    "E-01-99-sidebar-discovery-fixture",
  );
  await rm(lessonDirectory, { recursive: true, force: true });
  await rm(labDirectory, { recursive: true, force: true });
  await rm(stableTitleLabDirectory, { recursive: true, force: true });
  await rm(sidebarLabDirectory, { recursive: true, force: true });
  await rm(projectCategoryMarker, { force: true });
  await rmdir(path.join(projectRoot, "labs", "chapter-99", "theory")).catch(() => {});
  await rmdir(path.join(projectRoot, "labs", "chapter-99", "exercise")).catch(() => {});
  await rmdir(projectCategoryDirectory).catch(() => {});
  await rmdir(path.join(projectRoot, "labs", "chapter-99")).catch(() => {});
  runNpm(["run", "build:vitepress"]);
});

it("Lab assets outside Markdown are copied unchanged", async () => {
  const copied = await readFile(
    path.join(
      distPages,
      "labs",
      "chapter-99",
      "theory",
      "T-99-01-stable-title-fixture",
      "assets",
      "nested",
      "quiz evidence.bin",
    ),
  );
  expect(copied.equals(assetBytes)).toBe(true);
});

it("a temporary lesson renders math, code, tables and task lists", () => {
  for (const required of ["第 99 章 自动发现验证", "mjx-container", "language-js", "<table", 'type="checkbox"']) {
    expect(html.lesson, `Temporary lesson did not render expected feature: ${required}`).toContain(required);
  }
});

it("every theory container kind renders with its class, data attribute and default title", () => {
  const kinds = [
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
  ];
  for (const kind of kinds) {
    expect(html.lesson, `Temporary lesson did not render theory container: ${kind}`).toContain(
      `dsa-theory-block--${kind}`,
    );
    expect(html.lesson, `Temporary lesson did not render theory data attribute: ${kind}`).toContain(
      `data-theory-kind="${kind}"`,
    );
  }
  for (const title of ["定义", "定理", "引理", "推论", "性质", "证明", "直觉", "示例", "反例", "复杂度", "易错点"]) {
    expect(html.lesson, `Temporary lesson did not render default theory title: ${title}`).toContain(
      `<span>${title}</span>`,
    );
  }
  expect(html.lesson, "Unparsed theory container marker leaked into the artifact").not.toContain("::: definition");
  expect(html.lesson, "Unparsed theory container marker leaked into the artifact").not.toContain("::: theorem");
});

it("theory container titles are escaped but still render inline MathJax", () => {
  expect(html.lesson, "Theory container title was not escaped").toContain("&lt;img src=x onerror=alert(1)&gt;");
  expect(html.lesson, "Theory container title emitted executable HTML").not.toContain('<span><img src="x"');
  expect(html.lesson, "Theory container title emitted executable HTML").not.toContain("<span><img src=x");
  expect(html.lesson, "Theory container title did not render inline MathJax").toContain("示例 · <mjx-container");
});

it("mark syntax stays semantic and never leaks into code or MathJax", () => {
  expect(html.lesson, "Mark syntax did not render semantic <mark>").toContain("<mark>语义高亮</mark>");
  expect(html.lesson.match(/<mark>/g) ?? [], "Mark syntax leaked into code or MathJax content").toHaveLength(1);
  expect(html.lesson, "Inline code equality was incorrectly parsed as mark syntax").toContain("<code>a == b</code>");
});

it("Shiki annotations, code titles and code-group tabs all survive the build", () => {
  expect(html.lesson, "Standalone code filename did not render in the toolbar").toContain("dsa-code-block--titled");
  expect(html.lesson, "Standalone code filename did not render in the toolbar").toContain("theory-fixture.js");
  for (const annotation of [
    "has-focused-lines",
    "has-focus",
    "diff add",
    "diff remove",
    "highlighted warning",
    "highlighted error",
  ]) {
    expect(html.lesson, `Native Shiki annotation did not survive: ${annotation}`).toContain(annotation);
  }
  expect(html.lesson, "Native code-group tab filenames did not render").toContain("native-tab.js");
  expect(html.lesson, "Native code-group tab filenames did not render").toContain("native-tab.ts");
  expect(
    html.lesson.match(/dsa-code-title/g) ?? [],
    "Code-group filenames were duplicated by the standalone title enhancer",
  ).toHaveLength(1);
});

it("relative Markdown links are rewritten to Pages-aware Lab routes", () => {
  expect(html.lesson, "Relative Markdown link was not rewritten to the Pages-aware Lab route").toContain(
    "/DSA-Mastery/labs/chapter-99/exercise/E-99-01-discovery-fixture/",
  );
});

it("temporary Lab pages keep their stable identifier and title", () => {
  expect(html.lab, "Temporary Lab page or stable ID was not generated").toContain("Lab 99-E-01：自动发现验证");
  expect(html.lab, "Temporary Lab page or stable ID was not generated").toContain("99E01");
  expect(html.stableTitle, "Stable Lab directory and document title did not stay aligned").toContain(
    "Lab 99-T-01：稳定标题验证",
  );
  expect(html.stableTitle, "Stable Lab directory and document title did not stay aligned").toContain("99T01");
});

it("theory container content enters the local search bundle", () => {
  expect(searchableJavaScript, "Theory container content did not enter the local search bundle").toContain(
    "理论容器检索锚点",
  );
});

it("a new chapter-01 Lab enters the Ch.1 Exercise sidebar automatically", () => {
  const start = html.sidebar.indexOf('<aside class="VPSidebar"');
  const end = html.sidebar.indexOf("</aside>", start);
  expect(start).toBeGreaterThanOrEqual(0);
  expect(end).toBeGreaterThanOrEqual(0);
  const sidebar = html.sidebar.slice(start, end);
  for (const required of [
    "本章 Labs",
    "实验 Exercise",
    "course-lab-category--exercise",
    "01E99 · 章节侧栏自动收录验证",
  ]) {
    expect(
      sidebar,
      `Temporary chapter-01 Lab did not enter Ch.1 Exercise sidebar automatically: ${required}`,
    ).toContain(required);
  }
  expect(sidebar).toContain('href="/DSA-Mastery/labs/chapter-01/exercise/E-01-99-sidebar-discovery-fixture/"');
  expect(sidebar).not.toContain("01E99 · Lab 01-E-99");
});

it("chapter 5 lists categorized Theory and Exercise Labs plus an empty Project slot", () => {
  const sidebarStart = html.chapterFiveOutline.indexOf('<aside class="VPSidebar"');
  const sidebarEnd = html.chapterFiveOutline.indexOf("</aside>", sidebarStart);
  expect(sidebarStart).toBeGreaterThanOrEqual(0);
  expect(sidebarEnd).toBeGreaterThanOrEqual(0);
  const sidebar = html.chapterFiveOutline.slice(sidebarStart, sidebarEnd);
  const itemStart = sidebar.indexOf("/learn/outline/chapter-05-tree-applications/");
  const itemEnd = sidebar.indexOf("Part III · 图结构", itemStart);
  expect(itemStart).toBeGreaterThanOrEqual(0);
  expect(itemEnd).toBeGreaterThanOrEqual(0);
  const item = sidebar.slice(itemStart, itemEnd);
  for (const required of [
    "本章 Labs",
    "理论 Theory",
    "实验 Exercise",
    "工程 Project",
    "05T01 · 森林与二叉树转换题精练",
    "05T02 · 树与森林遍历题精练",
    "05T03 · 哈夫曼树与编码题精练",
    "05T04 · 并查集题精练",
    "05T05 · 堆题精练",
    "05E01 · 二叉搜索树的插入与查找",
    "05E27 · B+ 树的范围查询",
    "暂无工程型 Lab",
  ]) {
    expect(item, `Chapter 5 categorized Lab interface is missing: ${required}`).toContain(required);
  }
  expect(item.match(/\/labs\/chapter-05\//g) ?? []).toHaveLength(32);
  expect(item).not.toContain("暂无理论型 Lab");
  expect(item).not.toContain("暂无实验型 Lab");
});
