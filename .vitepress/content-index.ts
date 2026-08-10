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

export interface CourseIndex {
  lessons: CourseDocument[];
  labs: CourseDocument[];
  chapters: CourseChapter[];
}

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const chapterDirectoryPattern = /^chapter-\d{2}-[a-z0-9-]+$/;
const labDirectoryPattern = /^lab-\d{2}-\d{2}-[a-z0-9-]+$/;

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

  return { lessons, labs, chapters };
}

export function createCourseSidebar(index: CourseIndex): DefaultTheme.SidebarItem[] {
  return index.chapters.map((chapter) => ({
    text: `第 ${chapter.chapter} 章 · ${chapter.title}`,
    collapsed: false,
    items: [
      ...chapter.lessons.map((lesson) => ({ text: lesson.title, link: lesson.url })),
      ...(chapter.labs.length
        ? [
            {
              text: "本章 Labs",
              collapsed: false,
              items: chapter.labs.map((lab) => ({ text: lab.title, link: lab.url })),
            },
          ]
        : []),
    ],
  }));
}

export function sourceUrlMap(index: CourseIndex): Map<string, string> {
  return new Map([...index.lessons, ...index.labs].map((document) => [document.sourcePath, document.url]));
}

export function normalizePagesBase(raw = process.env.GITHUB_PAGES_BASE_PATH ?? ""): string {
  const cleaned = raw.trim().replace(/^\/+|\/+$/g, "");
  return cleaned ? `/${cleaned}/` : "/";
}
