import GithubSlugger from "github-slugger";

export type DocumentKind = "lesson" | "lab";

export type DocumentStatus = "draft" | "review" | "published";

export interface HeadingItem {
  depth: 2 | 3;
  id: string;
  text: string;
}

export interface TutorialDocument {
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
  body: string;
  headings: HeadingItem[];
  readingMinutes: number;
  searchText: string;
}

export interface ChapterGroup {
  chapter: number;
  title: string;
  entries: TutorialDocument[];
}

export interface SearchItem {
  title: string;
  description: string;
  url: string;
  kind: DocumentKind;
  chapterLabel: string;
  headings: string[];
  searchText: string;
}

type Frontmatter = Record<string, string | number | boolean | string[]>;

const lessonModules = import.meta.glob<string>("/content/**/*.md", {
  eager: true,
  import: "default",
  query: "?raw",
});

const labModules = import.meta.glob<string>("/labs/**/README.md", {
  eager: true,
  import: "default",
  query: "?raw",
});

function parseScalar(value: string): string | number | boolean | string[] {
  const trimmed = value.trim();

  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    return trimmed
      .slice(1, -1)
      .split(",")
      .map((item) => unquote(item.trim()))
      .filter(Boolean);
  }

  if (/^-?\d+(\.\d+)?$/.test(trimmed)) return Number(trimmed);
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  return unquote(trimmed);
}

function unquote(value: string): string {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

function parseFrontmatter(raw: string): { data: Frontmatter; body: string } | null {
  const match = raw.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n?/);
  if (!match) return null;

  const data: Frontmatter = {};
  for (const line of match[1].split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf(":");
    if (separator === -1) continue;
    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1);
    data[key] = parseScalar(value);
  }

  return { data, body: raw.slice(match[0].length).trim() };
}

function textValue(data: Frontmatter, key: string, fallback = ""): string {
  const value = data[key];
  if (Array.isArray(value)) return value.join(", ");
  if (value === undefined) return fallback;
  return String(value);
}

function numberValue(data: Frontmatter, key: string, fallback = 0): number {
  const value = Number(data[key]);
  return Number.isFinite(value) ? value : fallback;
}

function listValue(data: Frontmatter, key: string): string[] {
  const value = data[key];
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === "string" && value.trim()) return [value.trim()];
  return [];
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

function extractHeadings(markdown: string): HeadingItem[] {
  const slugger = new GithubSlugger();
  const headings: HeadingItem[] = [];
  const pattern = /^(#{2,3})\s+(.+?)\s*#*$/gm;

  for (const match of markdown.matchAll(pattern)) {
    const text = match[2]
      .replace(/`([^`]+)`/g, "$1")
      .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
      .trim();
    headings.push({
      depth: match[1].length as 2 | 3,
      id: slugger.slug(text),
      text,
    });
  }

  return headings;
}

function estimateReadingMinutes(markdown: string): number {
  const plain = stripMarkdown(markdown);
  const cjkCharacters = (plain.match(/[\u3400-\u9fff]/g) ?? []).length;
  const latinWords = (plain.replace(/[\u3400-\u9fff]/g, " ").match(/[A-Za-z0-9]+/g) ?? [])
    .length;
  return Math.max(1, Math.ceil(cjkCharacters / 420 + latinWords / 190));
}

function deriveRelativePath(modulePath: string, kind: DocumentKind): string {
  const normalized = modulePath.replace(/\\/g, "/");
  const marker = kind === "lesson" ? "/content/" : "/labs/";
  const markerIndex = normalized.indexOf(marker);
  return markerIndex >= 0
    ? normalized.slice(markerIndex + marker.length)
    : normalized.replace(/^\/?(content|labs)\//, "");
}

function createDocument(
  modulePath: string,
  raw: string,
  kind: DocumentKind,
): TutorialDocument | null {
  const parsed = parseFrontmatter(raw);
  if (!parsed) return null;

  const relativePath = deriveRelativePath(modulePath, kind);
  const slug = relativePath.replace(/\.md$/i, "").replace(/\/README$/i, "");
  const chapter = numberValue(parsed.data, "chapter");
  const order = numberValue(parsed.data, "order");
  const title = textValue(parsed.data, "title");
  const description = textValue(parsed.data, "description");

  if (!title || !description) {
    throw new Error(`Missing title or description in ${relativePath}`);
  }

  const body = parsed.body.replace(/^#\s+.+?\r?\n+/, "").trim();
  const chapterTitle = textValue(
    parsed.data,
    "chapterTitle",
    chapter === 0 ? "绪论" : `第 ${chapter} 章`,
  );
  const plainText = stripMarkdown(body);

  return {
    kind,
    slug,
    url: kind === "lesson" ? `/learn/${slug}` : `/labs/${slug}`,
    sourcePath: `${kind === "lesson" ? "content" : "labs"}/${relativePath}`,
    title,
    description,
    chapter,
    chapterTitle,
    order,
    updated: textValue(parsed.data, "updated", "未标注"),
    contributors: listValue(parsed.data, "contributors"),
    status: textValue(parsed.data, "status", "draft") as DocumentStatus,
    difficulty: textValue(parsed.data, "difficulty") || undefined,
    duration: textValue(parsed.data, "duration") || undefined,
    body,
    headings: extractHeadings(body),
    readingMinutes: estimateReadingMinutes(body),
    searchText: `${title} ${description} ${plainText}`.toLocaleLowerCase("zh-CN"),
  };
}

function collectDocuments(
  modules: Record<string, string>,
  kind: DocumentKind,
): TutorialDocument[] {
  return Object.entries(modules)
    .map(([path, raw]) => createDocument(path, raw, kind))
    .filter((entry): entry is TutorialDocument => entry !== null)
    .sort(
      (a, b) =>
        a.chapter - b.chapter ||
        a.order - b.order ||
        a.title.localeCompare(b.title, "zh-CN"),
    );
}

const lessons = collectDocuments(lessonModules, "lesson");
const labs = collectDocuments(labModules, "lab");

export function getLessons(): TutorialDocument[] {
  return lessons;
}

export function getLabs(): TutorialDocument[] {
  return labs;
}

export function getAllDocuments(): TutorialDocument[] {
  return [...lessons, ...labs];
}

export function getDocument(kind: DocumentKind, slug: string): TutorialDocument | undefined {
  return (kind === "lesson" ? lessons : labs).find((entry) => entry.slug === slug);
}

export function getChapterGroups(entries = lessons): ChapterGroup[] {
  const groups = new Map<number, ChapterGroup>();

  for (const entry of entries) {
    const existing = groups.get(entry.chapter);
    if (existing) {
      existing.entries.push(entry);
    } else {
      groups.set(entry.chapter, {
        chapter: entry.chapter,
        title: entry.chapterTitle,
        entries: [entry],
      });
    }
  }

  return [...groups.values()].sort((a, b) => a.chapter - b.chapter);
}

export function getSearchItems(): SearchItem[] {
  return getAllDocuments().map((entry) => ({
    title: entry.title,
    description: entry.description,
    url: entry.url,
    kind: entry.kind,
    chapterLabel: `第 ${entry.chapter} 章 · ${entry.chapterTitle}`,
    headings: entry.headings.map((heading) => heading.text),
    searchText: entry.searchText,
  }));
}

export function getSiblings(
  entries: TutorialDocument[],
  slug: string,
): { previous?: TutorialDocument; next?: TutorialDocument } {
  const index = entries.findIndex((entry) => entry.slug === slug);
  if (index < 0) return {};
  return {
    previous: index > 0 ? entries[index - 1] : undefined,
    next: index < entries.length - 1 ? entries[index + 1] : undefined,
  };
}
