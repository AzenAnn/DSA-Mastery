import { mkdir, readFile, readdir, rm, rmdir, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const lessonDirectory = path.join(projectRoot, "content", "chapter-99-discovery-fixture");
const labDirectory = path.join(projectRoot, "labs", "chapter-99", "lab-99-E-01-discovery-fixture");
const sidebarLabDirectory = path.join(
  projectRoot,
  "labs",
  "chapter-01",
  "lab-01-E-99-sidebar-discovery-fixture",
);
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
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

[进入自动发现 Lab](../../labs/chapter-99/lab-99-E-01-discovery-fixture/README.md)
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
  const command = process.platform === "win32" ? (process.env.ComSpec ?? "cmd.exe") : npmCommand;
  const commandArgs = process.platform === "win32"
    ? ["/d", "/s", "/c", ["npm", ...args].join(" ")]
    : args;
  const result = spawnSync(command, commandArgs, {
    cwd: projectRoot,
    env: pagesEnvironment,
    encoding: "utf8",
    stdio: "pipe",
  });
  if (result.status !== 0) {
    throw new Error(
      [`npm ${args.join(" ")} failed`, result.error?.message, result.stdout, result.stderr]
        .filter(Boolean)
        .join("\n"),
    );
  }
}

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

let primaryError;
try {
  await mkdir(lessonDirectory, { recursive: true });
  await mkdir(labDirectory, { recursive: true });
  await mkdir(sidebarLabDirectory, { recursive: true });
  await writeFile(path.join(lessonDirectory, "00-autodiscovery.md"), lesson, "utf8");
  await writeFile(path.join(labDirectory, "README.md"), lab, "utf8");
  await writeFile(path.join(sidebarLabDirectory, "README.md"), sidebarLab, "utf8");

  runNpm(["run", "validate:content"]);
  runNpm(["run", "build:vitepress"]);
  runNpm(["run", "check:site"]);

  const lessonHtml = await readFile(
    path.join(projectRoot, "dist", "pages", "learn", "chapter-99-discovery-fixture", "00-autodiscovery", "index.html"),
    "utf8",
  );
  const labHtml = await readFile(
    path.join(projectRoot, "dist", "pages", "labs", "chapter-99", "lab-99-E-01-discovery-fixture", "index.html"),
    "utf8",
  );
  const sidebarLabHtml = await readFile(
    path.join(
      projectRoot,
      "dist",
      "pages",
      "labs",
      "chapter-01",
      "lab-01-E-99-sidebar-discovery-fixture",
      "index.html",
    ),
    "utf8",
  );
  const chapterFiveOutlineHtml = await readFile(
    path.join(
      projectRoot,
      "dist",
      "pages",
      "learn",
      "outline",
      "chapter-05-tree-applications",
      "index.html",
    ),
    "utf8",
  );
  for (const required of ["第 99 章 自动发现验证", "mjx-container", "language-js", "<table", 'type="checkbox"']) {
    if (!lessonHtml.includes(required)) throw new Error(`Temporary lesson did not render expected feature: ${required}`);
  }
  const theoryKinds = [
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
  for (const kind of theoryKinds) {
    if (!lessonHtml.includes("dsa-theory-block--" + kind)) {
      throw new Error("Temporary lesson did not render theory container: " + kind);
    }
    if (!lessonHtml.includes('data-theory-kind="' + kind + '"')) {
      throw new Error("Temporary lesson did not render theory data attribute: " + kind);
    }
  }
  for (const defaultTitle of ["定义", "定理", "引理", "推论", "性质", "证明", "直觉", "示例", "反例", "复杂度", "易错点"]) {
    if (!lessonHtml.includes("<span>" + defaultTitle + "</span>")) {
      throw new Error("Temporary lesson did not render default theory title: " + defaultTitle);
    }
  }
  if (!lessonHtml.includes("&lt;img src=x onerror=alert(1)&gt;")) {
    throw new Error("Theory container title was not escaped");
  }
  if (lessonHtml.includes('<span><img src="x"') || lessonHtml.includes("<span><img src=x")) {
    throw new Error("Theory container title emitted executable HTML");
  }
  if (!lessonHtml.includes("<mark>语义高亮</mark>")) {
    throw new Error("Mark syntax did not render semantic <mark>");
  }
  if ((lessonHtml.match(/<mark>/g) ?? []).length !== 1) {
    throw new Error("Mark syntax leaked into code or MathJax content");
  }
  if (!lessonHtml.includes("<code>a == b</code>")) {
    throw new Error("Inline code equality was incorrectly parsed as mark syntax");
  }
  if (!lessonHtml.includes("dsa-code-block--titled") || !lessonHtml.includes("theory-fixture.js")) {
    throw new Error("Standalone code filename did not render in the toolbar");
  }
  for (const annotation of ["has-focused-lines", "has-focus", "diff add", "diff remove", "highlighted warning", "highlighted error"]) {
    if (!lessonHtml.includes(annotation)) {
      throw new Error("Native Shiki annotation did not survive: " + annotation);
    }
  }
  if (!lessonHtml.includes("native-tab.js") || !lessonHtml.includes("native-tab.ts")) {
    throw new Error("Native code-group tab filenames did not render");
  }
  if ((lessonHtml.match(/dsa-code-title/g) ?? []).length !== 1) {
    throw new Error("Code-group filenames were duplicated by the standalone title enhancer");
  }
  if (lessonHtml.includes("::: definition") || lessonHtml.includes("::: theorem")) {
    throw new Error("Unparsed theory container marker leaked into the artifact");
  }
  if (!lessonHtml.includes("/DSA-Mastery/labs/chapter-99/lab-99-E-01-discovery-fixture/")) {
    throw new Error("Relative Markdown link was not rewritten to the Pages-aware Lab route");
  }
  if (!labHtml.includes("Lab 99-E-01：自动发现验证") || !labHtml.includes("99E01")) throw new Error("Temporary Lab page or stable ID was not generated");
  const searchFiles = (await filesRecursively(path.join(projectRoot, "dist", "pages")))
    .filter((file) => file.endsWith(".js"));
  const searchableJavaScript = (await Promise.all(searchFiles.map((file) => readFile(file, "utf8")))).join("\n");
  if (!searchableJavaScript.includes("理论容器检索锚点")) {
    throw new Error("Theory container content did not enter the local search bundle");
  }
  const sidebarStart = sidebarLabHtml.indexOf('<aside class="VPSidebar"');
  const sidebarEnd = sidebarLabHtml.indexOf("</aside>", sidebarStart);
  const sidebarHtml = sidebarLabHtml.slice(sidebarStart, sidebarEnd);
  if (
    sidebarStart < 0 ||
    sidebarEnd < 0 ||
    !sidebarHtml.includes("本章 Labs") ||
    !sidebarHtml.includes("实验 Exercise") ||
    !sidebarHtml.includes("course-lab-category--exercise") ||
    !sidebarHtml.includes("01E99 · 章节侧栏自动收录验证") ||
    sidebarHtml.includes("01E99 · Lab 01-E-99") ||
    !sidebarHtml.includes(
      'href="/DSA-Mastery/labs/chapter-01/lab-01-E-99-sidebar-discovery-fixture/"',
    )
  ) {
    throw new Error("Temporary chapter-01 Lab did not enter Ch.1 Exercise sidebar automatically");
  }
  const chapterFiveSidebarStart = chapterFiveOutlineHtml.indexOf('<aside class="VPSidebar"');
  const chapterFiveSidebarEnd = chapterFiveOutlineHtml.indexOf(
    "</aside>",
    chapterFiveSidebarStart,
  );
  const chapterFiveSidebar = chapterFiveOutlineHtml.slice(
    chapterFiveSidebarStart,
    chapterFiveSidebarEnd,
  );
  const chapterFiveItemStart = chapterFiveSidebar.indexOf(
    "/learn/outline/chapter-05-tree-applications/",
  );
  const chapterFiveItemEnd = chapterFiveSidebar.indexOf(
    "Part III · 图结构",
    chapterFiveItemStart,
  );
  const chapterFiveItem = chapterFiveSidebar.slice(chapterFiveItemStart, chapterFiveItemEnd);
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
    "05E17 · B+ 树的范围查询",
    "暂无工程型 Lab",
  ]) {
    if (!chapterFiveItem.includes(required)) {
      throw new Error(`Chapter 5 categorized Lab interface is missing: ${required}`);
    }
  }
  const chapterFiveLabLinks = chapterFiveItem.match(/\/labs\/chapter-05\//g) ?? [];
  if (
    chapterFiveSidebarStart < 0 ||
    chapterFiveSidebarEnd < 0 ||
    chapterFiveItemStart < 0 ||
    chapterFiveItemEnd < 0 ||
    chapterFiveLabLinks.length !== 22 ||
    chapterFiveItem.includes("暂无理论型 Lab") ||
    chapterFiveItem.includes("暂无实验型 Lab")
  ) {
    throw new Error("Chapter 5 Theory/Exercise Labs or empty Project slot are inconsistent");
  }
} catch (error) {
  primaryError = error;
} finally {
  assertFixtureTarget(lessonDirectory, path.join(projectRoot, "content"), "chapter-99-discovery-fixture");
  assertFixtureTarget(labDirectory, path.join(projectRoot, "labs", "chapter-99"), "lab-99-E-01-discovery-fixture");
  assertFixtureTarget(
    sidebarLabDirectory,
    path.join(projectRoot, "labs", "chapter-01"),
    "lab-01-E-99-sidebar-discovery-fixture",
  );
  await rm(lessonDirectory, { recursive: true, force: true });
  await rm(labDirectory, { recursive: true, force: true });
  await rm(sidebarLabDirectory, { recursive: true, force: true });
  await rmdir(path.join(projectRoot, "labs", "chapter-99")).catch(() => {});
  try {
    runNpm(["run", "build:vitepress"]);
  } catch (cleanupError) {
    primaryError = primaryError ?? cleanupError;
  }
}

if (primaryError) throw primaryError;
console.log("自动发现检查通过：临时内容与分类 Labs 已进入构建，Ch.5 Theory 5 个、Exercise 17 个入口及 Project 空槽位存在，fixture 已安全清理。");
