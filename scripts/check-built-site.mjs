import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const artifactRoot = path.join(projectRoot, "dist", "pages");
const rawBase = process.env.GITHUB_PAGES_BASE_PATH ?? "";
const cleanedBase = rawBase.trim().replace(/^\/+|\/+$/g, "");
const base = cleanedBase ? `/${cleanedBase}/` : "/";

async function filesRecursively(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await filesRecursively(target)));
    else files.push(target);
  }
  return files;
}

async function exists(file) {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

async function expectedCoursePages() {
  const lessonPages = [];
  const contentRoot = path.join(projectRoot, "content");
  for (const chapter of await readdir(contentRoot, { withFileTypes: true })) {
    if (!chapter.isDirectory() || !/^chapter-\d{2}-[a-z0-9-]+$/.test(chapter.name)) continue;
    const chapterRoot = path.join(contentRoot, chapter.name);
    for (const file of await readdir(chapterRoot, { withFileTypes: true })) {
      if (!file.isFile() || !file.name.endsWith(".md") || file.name.toLowerCase() === "readme.md") continue;
      lessonPages.push(path.join("learn", chapter.name, file.name.replace(/\.md$/, ""), "index.html"));
    }
  }

  const labPages = [];
  const labsRoot = path.join(projectRoot, "labs");
  for (const chapter of await readdir(labsRoot, { withFileTypes: true })) {
    if (!chapter.isDirectory() || !/^chapter-\d{2}$/.test(chapter.name)) continue;
    const chapterRoot = path.join(labsRoot, chapter.name);
    for (const lab of await readdir(chapterRoot, { withFileTypes: true })) {
      if (!lab.isDirectory() || !/^lab-\d{2}-\d{2}-[a-z0-9-]+$/.test(lab.name)) continue;
      labPages.push(path.join("labs", chapter.name, lab.name, "index.html"));
    }
  }
  const curriculumPages = [path.join("learn", "index.html")];
  const curriculumRoot = path.join(projectRoot, "curriculum");
  for (const section of ["parts", "outline"]) {
    for (const file of await readdir(path.join(curriculumRoot, section), { withFileTypes: true })) {
      if (!file.isFile() || !file.name.endsWith(".md")) continue;
      curriculumPages.push(path.join("learn", section, file.name.replace(/\.md$/, ""), "index.html"));
    }
  }
  return { lessonPages, labPages, curriculumPages };
}

function artifactTarget(urlPath) {
  let pathname = decodeURIComponent(urlPath);
  if (base !== "/") {
    if (!pathname.startsWith(base)) {
      throw new Error(`Root-relative URL escaped the Pages base ${base}: ${urlPath}`);
    }
    pathname = pathname.slice(base.length);
  } else {
    pathname = pathname.replace(/^\//, "");
  }

  if (!pathname || pathname.endsWith("/")) return path.join(artifactRoot, pathname, "index.html");
  return path.join(artifactRoot, pathname);
}

const { lessonPages, labPages, curriculumPages } = await expectedCoursePages();
const expectedPages = ["index.html", "labs/index.html", "404.html", ...curriculumPages, ...lessonPages, ...labPages];
const missingPages = [];
for (const relativePath of expectedPages) {
  if (!(await exists(path.join(artifactRoot, relativePath)))) missingPages.push(relativePath.replaceAll("\\", "/"));
}
if (missingPages.length) throw new Error(`Missing generated pages:\n${missingPages.join("\n")}`);
if (await exists(path.join(artifactRoot, "AGENTS.html"))) {
  throw new Error("Repository-only AGENTS.md leaked into the public course artifact");
}

const allFiles = await filesRecursively(artifactRoot);
const htmlFiles = allFiles.filter((file) => file.endsWith(".html"));
const brokenLinks = [];
for (const htmlFile of htmlFiles) {
  const html = await readFile(htmlFile, "utf8");
  const routeRelative = path.relative(artifactRoot, htmlFile).replaceAll("\\", "/");
  const pageUrl = new URL(routeRelative.endsWith("index.html")
    ? `${base}${routeRelative.slice(0, -"index.html".length)}`
    : `${base}${routeRelative}`, "https://course.invalid");

  for (const match of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
    const value = match[1];
    if (!value || value.startsWith("#") || /^(?:mailto:|tel:|data:|javascript:)/i.test(value)) continue;
    const targetUrl = new URL(value, pageUrl);
    if (targetUrl.origin !== pageUrl.origin) continue;
    let target;
    try {
      target = artifactTarget(targetUrl.pathname);
    } catch (error) {
      brokenLinks.push(`${routeRelative} -> ${value} (${error.message})`);
      continue;
    }
    if (!(await exists(target))) brokenLinks.push(`${routeRelative} -> ${value}`);
  }
}
if (brokenLinks.length) throw new Error(`Broken internal artifact links:\n${brokenLinks.join("\n")}`);

for (const relativePath of [...lessonPages, ...labPages]) {
  const html = await readFile(path.join(artifactRoot, relativePath), "utf8");
  const h1Count = (html.match(/<h1\b/g) ?? []).length;
  if (h1Count !== 1) throw new Error(`${relativePath.replaceAll("\\", "/")}: expected one H1, found ${h1Count}`);
}

const dataStructureBasicsHtml = await readFile(
  path.join(artifactRoot, "learn", "chapter-00-introduction", "01-data-structure-basics", "index.html"),
  "utf8",
);
for (const required of [
  "dsa-theory-block--definition",
  "dsa-theory-block--intuition",
  "<mark>一个逻辑结构可以有多种存储实现</mark>",
  "<dfn>抽象数据类型</dfn>",
  "dsa-code-block--titled",
  "student-list-interface.cpp",
  "vp-code-group",
]) {
  if (!dataStructureBasicsHtml.includes(required)) {
    throw new Error(`Data-structure basics page is missing theory style artifact: ${required}`);
  }
}

const complexityHtml = await readFile(
  path.join(artifactRoot, "learn", "chapter-00-introduction", "03-algorithm-complexity-analysis", "index.html"),
  "utf8",
);
for (const kind of ["definition", "property", "proof", "complexity", "pitfall"]) {
  if (!complexityHtml.includes(`dsa-theory-block--${kind}`)) {
    throw new Error(`Complexity page is missing theory container: ${kind}`);
  }
}
if (complexityHtml.includes("::: definition") || dataStructureBasicsHtml.includes("::: definition")) {
  throw new Error("Unparsed theory container markers leaked into Chapter 0 artifacts");
}

const curriculumHtml = await readFile(path.join(artifactRoot, "learn", "index.html"), "utf8");
for (const requiredLabel of [
  "Part IV · 查找与索引",
  "Ch.8",
  "基础查找与树形查找",
  "Ch.9",
  "散列与索引结构",
  "Part V · 排序",
  "Ch.10",
  "基础排序算法",
  "Ch.11",
  "高效排序与外部排序",
  "Part VI · 算法思想",
  "Ch.12",
  "分治与递归",
  "Ch.13",
  "贪心算法",
  "Ch.14",
  "动态规划",
  "Ch.15",
  "回溯与搜索",
]) {
  if (!curriculumHtml.includes(requiredLabel)) throw new Error(`Curriculum index is missing: ${requiredLabel}`);
}

if (base !== "/") {
  const duplicate = `${base}${base.replace(/^\//, "")}`;
  for (const file of allFiles.filter((entry) => /\.(?:html|js|css|xml)$/.test(entry))) {
    if ((await readFile(file, "utf8")).includes(duplicate)) {
      throw new Error(`${path.relative(artifactRoot, file)} contains a doubled Pages base: ${duplicate}`);
    }
  }
}

const searchableJavaScript = (
  await Promise.all(allFiles.filter((file) => file.endsWith(".js")).map((file) => readFile(file, "utf8")))
).join("\n");
for (const searchTitle of ["第 0 章 绪论", "Lab 01-02：实现并验证单链表"]) {
  if (!searchableJavaScript.includes(searchTitle)) throw new Error(`Local search bundle is missing: ${searchTitle}`);
}

console.log(
  `站点产物检查通过：${lessonPages.length} 篇教材、${labPages.length} 个 Lab、${curriculumPages.length} 个课程框架页、${htmlFiles.length} 个 HTML，base=${base}`,
);
