import type { CurriculumChapter, CurriculumOutline } from "./curriculum.ts";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import { curriculumChapterDefinitions, curriculumPartDefinitions } from "./curriculum.ts";

export type DocumentKind = "lesson" | "lab";
export type DocumentStatus = "draft" | "review" | "published";
export type LabCategory = "theory" | "exercise" | "project";
export type ChapterId = number | "preface";

export interface CourseDocument {
  kind: DocumentKind;
  slug: string;
  url: string;
  sourcePath: string;
  title: string;
  description: string;
  chapter: ChapterId;
  chapterLabel: string;
  chapterTitle: string;
  order: number;
  updated: string;
  contributors: string[];
  status: DocumentStatus;
  difficulty?: string;
  duration?: string;
  labCategory?: LabCategory;
  labId?: string;
  readingMinutes: number;
}

export interface CourseChapter {
  chapter: ChapterId;
  title: string;
  lessons: CourseDocument[];
  labs: CourseDocument[];
}

export interface CourseIndex {
  lessons: CourseDocument[];
  labs: CourseDocument[];
  chapters: CourseChapter[];
  curriculum: CurriculumOutline;
}

function findProjectRoot(start: string): string {
  let current = start;
  while (true) {
    if (existsSync(path.join(current, "pnpm-workspace.yaml")) && existsSync(path.join(current, "labs"))) return current;
    const parent = path.dirname(current);
    if (parent === current) throw new Error(`从 ${start} 向上未找到 DSA Mastery 仓库根`);
    current = parent;
  }
}

const projectRoot = findProjectRoot(fileURLToPath(new URL(".", import.meta.url)));
const chapterDirectoryPattern = /^(?:chapter-\d{2}-[a-z0-9-]+|chapter-preface)$/;
const labDirectoryPattern = /^[TEP]-\d{2}-\d{2,}-[a-z0-9]+(?:-[a-z0-9]+)*$/;
const labCategories = ["theory", "exercise", "project"] as const;

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
      return labCategories.flatMap((category) => {
        const categoryPath = path.join(chapterPath, category);
        if (!existsSync(categoryPath)) return [];
        return readdirSync(categoryPath, { withFileTypes: true })
          .filter((entry) => entry.isDirectory() && labDirectoryPattern.test(entry.name))
          .map((entry) => path.join(categoryPath, entry.name, "README.md"));
      });
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

function chapterId(value: unknown): ChapterId {
  return text(value).trim() === "preface" ? "preface" : number(value);
}

function chapterRank(value: ChapterId): number {
  return value === "preface" ? -1 : value;
}

function chapterLabel(value: ChapterId): string {
  return value === "preface" ? "前言" : `第 ${value} 章`;
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
  const cjkCharacters = (plain.match(/[\u3400-\u9FFF]/g) ?? []).length;
  const latinWords = (plain.replace(/[\u3400-\u9FFF]/g, " ").match(/[A-Z0-9]+/gi) ?? []).length;
  return Math.max(1, Math.ceil(cjkCharacters / 420 + latinWords / 190));
}

const manifestTypeToCategory: Record<string, LabCategory> = {
  quiz: "theory",
  program: "exercise",
  project: "project",
};

function resolveLabCategory(file: string, data: Record<string, unknown>): LabCategory | undefined {
  const manifestPath = path.join(path.dirname(file), "lab.json");
  if (existsSync(manifestPath)) {
    let manifest: unknown;
    try {
      manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    } catch (error) {
      throw new Error(`${path.relative(projectRoot, manifestPath)}: cannot parse lab.json`, { cause: error });
    }
    const type = text((manifest as { type?: unknown }).type).trim();
    const category = manifestTypeToCategory[type];
    if (!category) {
      throw new Error(`${path.relative(projectRoot, manifestPath)}: type must be quiz, program, or project`);
    }
    return category;
  }

  const declared = text(data.labCategory).trim();
  if (!declared) return undefined;
  if (!(["theory", "exercise", "project"] as const).includes(declared as LabCategory)) {
    throw new Error(`${path.relative(projectRoot, file)}: labCategory must be theory, exercise, or project`);
  }
  return declared as LabCategory;
}

function createDocument(root: string, file: string, kind: DocumentKind): CourseDocument {
  const source = readFileSync(file, "utf8");
  const parsed = matter(source);
  const sourcePath = path.relative(root, file).replaceAll("\\", "/");
  const relativeContentPath = sourcePath.replace(/^(content|labs)\//, "");
  const slug = relativeContentPath.replace(/\.md$/i, "").replace(/\/README$/i, "");
  const chapter = chapterId(parsed.data.chapter);
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
    chapterLabel: chapterLabel(chapter),
    chapterTitle: text(
      parsed.data.chapterTitle,
      chapter === "preface" ? "课程作者指南" : chapter === 0 ? "基础" : `第 ${chapter} 章`,
    ),
    order: number(parsed.data.order),
    updated: text(parsed.data.updated, "未标注"),
    contributors: contributors(parsed.data.contributors),
    status: text(parsed.data.status, "draft") as DocumentStatus,
    difficulty: text(parsed.data.difficulty) || undefined,
    duration: text(parsed.data.duration) || undefined,
    labCategory: kind === "lab" ? resolveLabCategory(file, parsed.data) : undefined,
    labId: kind === "lab" ? text(parsed.data.labId) || undefined : undefined,
    readingMinutes: estimateReadingMinutes(parsed.content),
  };
}

function sortDocuments(documents: CourseDocument[]): CourseDocument[] {
  return documents.sort(
    (left, right) =>
      chapterRank(left.chapter) - chapterRank(right.chapter) ||
      left.order - right.order ||
      left.title.localeCompare(right.title, "zh-CN"),
  );
}

export function collectCourseIndex(root = projectRoot): CourseIndex {
  const lessons = sortDocuments(listLessonFiles(root).map((file) => createDocument(root, file, "lesson")));
  const labs = sortDocuments(listLabFiles(root).map((file) => createDocument(root, file, "lab")));
  const categorizedLabChapters = new Set(
    curriculumChapterDefinitions
      .map((definition) => definition.autoLabChapter)
      .filter((chapter): chapter is number => chapter !== undefined),
  );
  for (const lab of labs.filter(
    (document) => typeof document.chapter === "number" && categorizedLabChapters.has(document.chapter),
  )) {
    if (!lab.labCategory) {
      throw new Error(
        `${lab.sourcePath}: categorized chapter Labs must declare a category through lab.json or labCategory`,
      );
    }
  }
  const chapterNumbers = [...new Set([...lessons, ...labs].map((document) => document.chapter))].sort(
    (left, right) => chapterRank(left) - chapterRank(right),
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
  const outlineChapters = curriculumChapterDefinitions.map(
    ({ label, lessonSources = [], labSources = [], ...chapter }) => ({
      ...chapter,
      label: label ?? `Ch.${chapter.number}`,
      lessons: lessonSources
        .map((source) => documentsBySource.get(source))
        .filter((item): item is CourseDocument => Boolean(item)),
      labs:
        chapter.autoLabChapter === undefined
          ? labSources
              .map((source) => documentsBySource.get(source))
              .filter((item): item is CourseDocument => Boolean(item))
          : labs.filter((lab) => lab.chapter === chapter.autoLabChapter),
    }),
  );
  const outlineByNumber = new Map(outlineChapters.map((chapter) => [chapter.number, chapter]));
  const parts = curriculumPartDefinitions.map((part) => ({
    id: part.id,
    numeral: part.numeral,
    title: part.title,
    url: `/learn/parts/${part.id}/`,
    chapters: part.chapters
      .map((number) => outlineByNumber.get(number))
      .filter((item): item is CurriculumChapter => Boolean(item)),
  }));

  return {
    lessons,
    labs,
    chapters,
    curriculum: {
      url: "/learn/",
      foundations: outlineChapters.filter((chapter) => chapter.number === "preface" || chapter.number === "0"),
      parts,
    },
  };
}
