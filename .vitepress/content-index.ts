import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import type { DefaultTheme } from "vitepress";

export type DocumentKind = "lesson" | "lab";
export type DocumentStatus = "draft" | "review" | "published";

export interface CourseDocument {
  kind: DocumentKind;
  slug: string;
  url: string;
  sourcePath: string;
  title: string;
  description: string;
  chapter: number;
  chapterTitle: string;
  order: number;
  updated: string;
  contributors: string[];
  status: DocumentStatus;
  difficulty?: string;
  duration?: string;
  readingMinutes: number;
}

export interface CourseChapter {
  chapter: number;
  title: string;
  lessons: CourseDocument[];
  labs: CourseDocument[];
}

export interface CurriculumChapter {
  id: string;
  number: string;
  title: string;
  description: string;
  url: string;
  lessons: CourseDocument[];
  labs: CourseDocument[];
}

export interface CurriculumPart {
  id: string;
  numeral: string;
  title: string;
  url: string;
  chapters: CurriculumChapter[];
}

export interface CurriculumOutline {
  url: string;
  foundations: CurriculumChapter[];
  parts: CurriculumPart[];
}

export interface CourseIndex {
  lessons: CourseDocument[];
  labs: CourseDocument[];
  chapters: CourseChapter[];
  curriculum: CurriculumOutline;
}

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const chapterDirectoryPattern = /^chapter-\d{2}-[a-z0-9-]+$/;
const labDirectoryPattern = /^lab-\d{2}-\d{2}-[a-z0-9-]+$/;

type CurriculumChapterDefinition = Omit<CurriculumChapter, "lessons" | "labs"> & {
  lessonSources?: string[];
  labSources?: string[];
};

const curriculumChapterDefinitions: CurriculumChapterDefinition[] = [
  {
    id: "chapter-00-memory-foundations",
    number: "0",
    title: "内存基础",
    description: "从内存组织方式理解数据结构为何具有不同的表示与操作成本。",
    url: "/learn/outline/chapter-00-memory-foundations/",
    lessonSources: [
      "content/chapter-00-introduction/01-data-structure-basics.md",
      "content/chapter-00-introduction/03-memory-perspective.md",
    ],
    labSources: ["labs/chapter-00/lab-00-02-operation-counter/README.md"],
  },
  {
    id: "chapter-00-plus-algorithm-thinking",
    number: "0+",
    title: "算法思维体验",
    description: "通过 Peak Finding 与 Union-Find 体验数据结构选择如何改变算法效率。",
    url: "/learn/outline/chapter-00-plus-algorithm-thinking/",
    lessonSources: ["content/chapter-00-introduction/02-algorithm-complexity-analysis.md"],
    labSources: [
      "labs/chapter-00/lab-00-01-learning-map/README.md",
      "labs/chapter-00/lab-00-03-complexity-quiz/README.md",
    ],
  },
  {
    id: "chapter-01-linear-list",
    number: "1",
    title: "线性表",
    description: "学习线性表 ADT、顺序存储、链式存储及其设计取舍。",
    url: "/learn/outline/chapter-01-linear-list/",
    lessonSources: [
      "content/chapter-01-linear-list/00-overview.md",
      "content/chapter-01-linear-list/01-abstract-data-type.md",
      "content/chapter-01-linear-list/02-sequential-list.md",
      "content/chapter-01-linear-list/03-linked-list.md",
      "content/chapter-01-linear-list/04-comparison-and-selection.md",
    ],
    labSources: [
      "labs/chapter-01/lab-01-01-sequence-list/README.md",
      "labs/chapter-01/lab-01-02-linked-list/README.md",
      "labs/chapter-01/lab-01-03-problem-template/README.md",
    ],
  },
  {
    id: "chapter-02-stack-queue",
    number: "2",
    title: "栈与队列",
    description: "掌握受限线性结构及其在表达式、递归和层序处理中的应用。",
    url: "/learn/outline/chapter-02-stack-queue/",
    lessonSources: [
      "content/chapter-02-stack-queue/00-overview.md",
      "content/chapter-02-stack-queue/01-stack.md",
      "content/chapter-02-stack-queue/02-queue.md",
      "content/chapter-02-stack-queue/03-applications.md",
    ],
    labSources: [
      "labs/chapter-02/lab-02-01-stack-simulator/README.md",
      "labs/chapter-02/lab-02-02-cycle-queue/README.md",
    ],
  },
  {
    id: "chapter-03-string-array-matrix",
    number: "3",
    title: "字符串、数组与矩阵",
    description: "连接字符串匹配、数组寻址和矩阵压缩的连续存储视角。",
    url: "/learn/outline/chapter-03-string-array-matrix/",
    lessonSources: [
      "content/chapter-03-string-array/00-overview.md",
      "content/chapter-03-string-array/01-string-basics.md",
      "content/chapter-03-string-array/02-pattern-matching.md",
      "content/chapter-03-string-array/03-array-and-matrix.md",
    ],
    labSources: [
      "labs/chapter-03/lab-03-01-string-matcher/README.md",
      "labs/chapter-03/lab-03-02-sparse-matrix/README.md",
    ],
  },
  {
    id: "chapter-04-tree-binary-tree",
    number: "4",
    title: "树与二叉树",
    description: "建立树形结构、二叉树性质和遍历方法的共同基础。",
    url: "/learn/outline/chapter-04-tree-binary-tree/",
    lessonSources: [
      "content/chapter-04-tree/00-overview.md",
      "content/chapter-04-tree/01-binary-tree.md",
    ],
    labSources: ["labs/chapter-04/lab-04-01-binary-tree-traversal/README.md"],
  },
  {
    id: "chapter-05-tree-applications",
    number: "5",
    title: "树的应用",
    description: "把树结构用于 Huffman 编码、表达式树、堆与优先队列。",
    url: "/learn/outline/chapter-05-tree-applications/",
    lessonSources: [
      "content/chapter-04-tree/02-tree-applications.md",
      "content/chapter-04-tree/03-heap.md",
    ],
    labSources: ["labs/chapter-04/lab-04-02-huffman-coding/README.md"],
  },
  {
    id: "chapter-06-graph-foundations-storage",
    number: "6",
    title: "图的基础与存储",
    description: "学习图的基本概念，以及邻接矩阵和邻接表的表示取舍。",
    url: "/learn/outline/chapter-06-graph-foundations-storage/",
    lessonSources: [
      "content/chapter-05-graph/00-overview.md",
      "content/chapter-05-graph/01-representation.md",
    ],
  },
  {
    id: "chapter-07-graph-traversal-applications",
    number: "7",
    title: "图的遍历与应用",
    description: "从 DFS、BFS 走向最小生成树、最短路径等图算法。",
    url: "/learn/outline/chapter-07-graph-traversal-applications/",
    lessonSources: [
      "content/chapter-05-graph/02-traversal.md",
      "content/chapter-05-graph/03-applications.md",
      "content/chapter-05-graph/04-astar-visualization.md",
    ],
    labSources: [
      "labs/chapter-05/lab-05-01-bfs-maze/README.md",
      "labs/chapter-05/lab-05-02-dijkstra-path/README.md",
    ],
  },
  {
    id: "chapter-08-basic-tree-search",
    number: "8",
    title: "基础查找与树形查找",
    description: "从基础查找策略过渡到二叉搜索树及其操作。",
    url: "/learn/outline/chapter-08-basic-tree-search/",
    lessonSources: [
      "content/chapter-06-search/00-overview.md",
      "content/chapter-06-search/01-binary-search-tree.md",
    ],
    labSources: ["labs/chapter-06/lab-06-01-bst-operations/README.md"],
  },
  {
    id: "chapter-09-hashing-indexes",
    number: "9",
    title: "散列与索引结构",
    description: "理解散列函数、冲突处理和面向查找效率的索引结构。",
    url: "/learn/outline/chapter-09-hashing-indexes/",
    lessonSources: ["content/chapter-06-search/02-hash-table.md"],
    labSources: ["labs/chapter-06/lab-06-02-hash-table/README.md"],
  },
  {
    id: "chapter-10-basic-sorting",
    number: "10",
    title: "基础排序算法",
    description: "比较插入、交换与选择类排序的过程、稳定性和复杂度。",
    url: "/learn/outline/chapter-10-basic-sorting/",
    lessonSources: [
      "content/chapter-07-sort/00-overview.md",
      "content/chapter-07-sort/01-compare-sort.md",
    ],
    labSources: ["labs/chapter-07/lab-07-01-stability-compare/README.md"],
  },
  {
    id: "chapter-11-advanced-external-sorting",
    number: "11",
    title: "高效排序与外部排序",
    description: "组织快速、归并、堆、基数与外部排序的进阶学习框架。",
    url: "/learn/outline/chapter-11-advanced-external-sorting/",
    lessonSources: [
      "content/chapter-07-sort/01-compare-sort.md",
      "content/chapter-07-sort/02-heap-and-radix-sort.md",
    ],
    labSources: ["labs/chapter-07/lab-07-02-performance-benchmark/README.md"],
  },
  {
    id: "chapter-12-divide-conquer-recursion",
    number: "12",
    title: "分治与递归",
    description: "建立递归定义、问题分解、合并结果与复杂度分析框架。",
    url: "/learn/outline/chapter-12-divide-conquer-recursion/",
  },
  {
    id: "chapter-13-greedy",
    number: "13",
    title: "贪心算法",
    description: "理解局部选择、最优子结构以及贪心正确性的证明思路。",
    url: "/learn/outline/chapter-13-greedy/",
  },
  {
    id: "chapter-14-dynamic-programming",
    number: "14",
    title: "动态规划",
    description: "围绕状态、转移、边界和计算顺序建立动态规划方法。",
    url: "/learn/outline/chapter-14-dynamic-programming/",
  },
  {
    id: "chapter-15-backtracking-search",
    number: "15",
    title: "回溯与搜索",
    description: "使用状态空间、选择、撤销与剪枝组织系统搜索。",
    url: "/learn/outline/chapter-15-backtracking-search/",
  },
];

const curriculumPartDefinitions = [
  { id: "part-01-linear", numeral: "I", title: "线性结构", chapters: ["1", "2", "3"] },
  { id: "part-02-tree", numeral: "II", title: "树形结构", chapters: ["4", "5"] },
  { id: "part-03-graph", numeral: "III", title: "图结构", chapters: ["6", "7"] },
  { id: "part-04-search-index", numeral: "IV", title: "查找与索引", chapters: ["8", "9"] },
  { id: "part-05-sorting", numeral: "V", title: "排序", chapters: ["10", "11"] },
  { id: "part-06-algorithmic-thinking", numeral: "VI", title: "算法思想", chapters: ["12", "13", "14", "15"] },
] as const;

function markdownFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .map((entry) => path.join(directory, entry.name));
}

function listLessonFiles(root: string): string[] {
  const contentRoot = path.join(root, "content");
  return readdirSync(contentRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && chapterDirectoryPattern.test(entry.name))
    .flatMap((entry) => markdownFiles(path.join(contentRoot, entry.name)))
    .filter((file) => path.basename(file).toLowerCase() !== "readme.md");
}

function listLabFiles(root: string): string[] {
  const labsRoot = path.join(root, "labs");
  return readdirSync(labsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && /^chapter-\d{2}$/.test(entry.name))
    .flatMap((chapterEntry) => {
      const chapterPath = path.join(labsRoot, chapterEntry.name);
      return readdirSync(chapterPath, { withFileTypes: true })
        .filter((entry) => entry.isDirectory() && labDirectoryPattern.test(entry.name))
        .map((entry) => path.join(chapterPath, entry.name, "README.md"));
    });
}

function text(value: unknown, fallback = ""): string {
  if (value === undefined || value === null) return fallback;
  return String(value);
}

function number(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function contributors(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  return typeof value === "string" && value.trim() ? [value.trim()] : [];
}

function stripMarkdown(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/[>#*_~|-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function estimateReadingMinutes(markdown: string): number {
  const plain = stripMarkdown(markdown);
  const cjkCharacters = (plain.match(/[\u3400-\u9fff]/g) ?? []).length;
  const latinWords = (plain.replace(/[\u3400-\u9fff]/g, " ").match(/[A-Za-z0-9]+/g) ?? []).length;
  return Math.max(1, Math.ceil(cjkCharacters / 420 + latinWords / 190));
}

function createDocument(root: string, file: string, kind: DocumentKind): CourseDocument {
  const source = readFileSync(file, "utf8");
  const parsed = matter(source);
  const sourcePath = path.relative(root, file).replaceAll("\\", "/");
  const relativeContentPath = sourcePath.replace(/^(content|labs)\//, "");
  const slug = relativeContentPath.replace(/\.md$/i, "").replace(/\/README$/i, "");
  const chapter = number(parsed.data.chapter);
  const title = text(parsed.data.title);
  const description = text(parsed.data.description);

  if (!title || !description) {
    throw new Error(`${sourcePath}: title and description are required`);
  }

  return {
    kind,
    slug,
    url: kind === "lesson" ? `/learn/${slug}/` : `/labs/${slug}/`,
    sourcePath,
    title,
    description,
    chapter,
    chapterTitle: text(parsed.data.chapterTitle, chapter === 0 ? "绪论" : `第 ${chapter} 章`),
    order: number(parsed.data.order),
    updated: text(parsed.data.updated, "未标注"),
    contributors: contributors(parsed.data.contributors),
    status: text(parsed.data.status, "draft") as DocumentStatus,
    difficulty: text(parsed.data.difficulty) || undefined,
    duration: text(parsed.data.duration) || undefined,
    readingMinutes: estimateReadingMinutes(parsed.content),
  };
}

function sortDocuments(documents: CourseDocument[]): CourseDocument[] {
  return documents.sort(
    (left, right) =>
      left.chapter - right.chapter ||
      left.order - right.order ||
      left.title.localeCompare(right.title, "zh-CN"),
  );
}

export function collectCourseIndex(root = projectRoot): CourseIndex {
  const lessons = sortDocuments(listLessonFiles(root).map((file) => createDocument(root, file, "lesson")));
  const labs = sortDocuments(listLabFiles(root).map((file) => createDocument(root, file, "lab")));
  const chapterNumbers = [...new Set([...lessons, ...labs].map((document) => document.chapter))].sort(
    (left, right) => left - right,
  );
  const chapters = chapterNumbers.map((chapter) => {
    const chapterLessons = lessons.filter((document) => document.chapter === chapter);
    const chapterLabs = labs.filter((document) => document.chapter === chapter);
    return {
      chapter,
      title: chapterLessons[0]?.chapterTitle ?? chapterLabs[0]?.chapterTitle ?? `第 ${chapter} 章`,
      lessons: chapterLessons,
      labs: chapterLabs,
    };
  });

  const documentsBySource = new Map([...lessons, ...labs].map((document) => [document.sourcePath, document]));
  const outlineChapters = curriculumChapterDefinitions.map(({ lessonSources = [], labSources = [], ...chapter }) => ({
    ...chapter,
    lessons: lessonSources.map((source) => documentsBySource.get(source)).filter((item): item is CourseDocument => Boolean(item)),
    labs: labSources.map((source) => documentsBySource.get(source)).filter((item): item is CourseDocument => Boolean(item)),
  }));
  const outlineByNumber = new Map(outlineChapters.map((chapter) => [chapter.number, chapter]));
  const parts = curriculumPartDefinitions.map((part) => ({
    id: part.id,
    numeral: part.numeral,
    title: part.title,
    url: `/learn/parts/${part.id}/`,
    chapters: part.chapters.map((number) => outlineByNumber.get(number)).filter((item): item is CurriculumChapter => Boolean(item)),
  }));

  return {
    lessons,
    labs,
    chapters,
    curriculum: {
      url: "/learn/",
      foundations: outlineChapters.filter((chapter) => chapter.number === "0" || chapter.number === "0+"),
      parts,
    },
  };
}

export function createCourseSidebar(index: CourseIndex): DefaultTheme.SidebarItem[] {
  const chapterItem = (chapter: CurriculumChapter): DefaultTheme.SidebarItem => ({
    text: `Ch.${chapter.number} ${chapter.title}`,
    link: chapter.url,
    collapsed: true,
    items: [
      ...chapter.lessons.map((lesson) => ({ text: lesson.title, link: lesson.url })),
      ...(chapter.labs.length ? [{ text: "相关 Labs", collapsed: true, items: chapter.labs.map((lab) => ({ text: lab.title, link: lab.url })) }] : []),
    ],
  });

  return [
    { text: "课程总目录", link: index.curriculum.url },
    { text: "基础部分", collapsed: false, items: index.curriculum.foundations.map(chapterItem) },
    ...index.curriculum.parts.map((part) => ({
      text: `Part ${part.numeral} · ${part.title}`,
      link: part.url,
      collapsed: false,
      items: part.chapters.map(chapterItem),
    })),
  ];
}

export function sourceUrlMap(index: CourseIndex): Map<string, string> {
  return new Map([...index.lessons, ...index.labs].map((document) => [document.sourcePath, document.url]));
}

export function normalizePagesBase(raw = process.env.GITHUB_PAGES_BASE_PATH ?? ""): string {
  const cleaned = raw.trim().replace(/^\/+|\/+$/g, "");
  return cleaned ? `/${cleaned}/` : "/";
}
