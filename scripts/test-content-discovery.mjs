import { mkdir, readFile, rm, rmdir, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const lessonDirectory = path.join(projectRoot, "content", "chapter-99-discovery-fixture");
const labDirectory = path.join(projectRoot, "labs", "chapter-99", "lab-99-01-discovery-fixture");
const sidebarLabDirectory = path.join(
  projectRoot,
  "labs",
  "chapter-01",
  "lab-01-99-sidebar-discovery-fixture",
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

## 公式、代码与表格

当 $T(n)=n+1$ 时，增长数量级为 $O(n)$。

\`\`\`js
const size = items.length
\`\`\`

| 输入 | 期望 |
| --- | --- |
| 空表 | 0 |

- [ ] 自动发现任务列表

[进入自动发现 Lab](../../labs/chapter-99/lab-99-01-discovery-fixture/README.md)
`;

const lab = `---
title: "Lab 99-01：自动发现验证"
description: "验证新增 Lab 会自动进入页面、导航、搜索和统计。"
order: 0
chapter: 99
chapterTitle: "自动发现验证"
updated: "2026-08-10"
contributors: ["Discovery Test"]
status: "draft"
lab: true
difficulty: "测试"
duration: "1 分钟"
---

# Lab 99-01：自动发现验证

## 验收标准

- [ ] 页面、导航和搜索均包含本 Lab。
`;

const sidebarLab = `---
title: "Lab 01-99：章节侧栏自动收录验证"
description: "验证新增线性表 Lab 会自动进入本章相关 Labs。"
order: 99
chapter: 1
chapterTitle: "线性表"
updated: "2026-08-14"
contributors: ["Discovery Test"]
status: "draft"
lab: true
difficulty: "测试"
duration: "1 分钟"
---

# Lab 01-99：章节侧栏自动收录验证

## 验收标准

- [ ] 本 Lab 自动出现在 Ch.1 线性表的相关 Labs 中。
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
    path.join(projectRoot, "dist", "pages", "labs", "chapter-99", "lab-99-01-discovery-fixture", "index.html"),
    "utf8",
  );
  const sidebarLabHtml = await readFile(
    path.join(
      projectRoot,
      "dist",
      "pages",
      "labs",
      "chapter-01",
      "lab-01-99-sidebar-discovery-fixture",
      "index.html",
    ),
    "utf8",
  );
  for (const required of ["第 99 章 自动发现验证", "mjx-container", "language-js", "<table", 'type="checkbox"']) {
    if (!lessonHtml.includes(required)) throw new Error(`Temporary lesson did not render expected feature: ${required}`);
  }
  if (!lessonHtml.includes("/DSA-Mastery/labs/chapter-99/lab-99-01-discovery-fixture/")) {
    throw new Error("Relative Markdown link was not rewritten to the Pages-aware Lab route");
  }
  if (!labHtml.includes("Lab 99-01：自动发现验证")) throw new Error("Temporary Lab page was not generated");
  const sidebarStart = sidebarLabHtml.indexOf('<aside class="VPSidebar"');
  const sidebarEnd = sidebarLabHtml.indexOf("</aside>", sidebarStart);
  const sidebarHtml = sidebarLabHtml.slice(sidebarStart, sidebarEnd);
  if (
    sidebarStart < 0 ||
    sidebarEnd < 0 ||
    !sidebarHtml.includes("Lab 01-99：章节侧栏自动收录验证") ||
    !sidebarHtml.includes(
      'href="/DSA-Mastery/labs/chapter-01/lab-01-99-sidebar-discovery-fixture/"',
    )
  ) {
    throw new Error("Temporary chapter-01 Lab did not enter Ch.1 related Labs sidebar automatically");
  }
} catch (error) {
  primaryError = error;
} finally {
  assertFixtureTarget(lessonDirectory, path.join(projectRoot, "content"), "chapter-99-discovery-fixture");
  assertFixtureTarget(labDirectory, path.join(projectRoot, "labs", "chapter-99"), "lab-99-01-discovery-fixture");
  assertFixtureTarget(
    sidebarLabDirectory,
    path.join(projectRoot, "labs", "chapter-01"),
    "lab-01-99-sidebar-discovery-fixture",
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
console.log("自动发现检查通过：临时教材与 Lab 已进入构建、导航、搜索及章节相关 Labs，并被安全清理。");
