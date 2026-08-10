import { data as rawCourseIndex } from "../content.data";
import type { CourseChapter, CourseDocument, CourseIndex } from "../content-index";

const loadedIndex = rawCourseIndex as Partial<CourseIndex>;

export const courseIndex: CourseIndex = {
  lessons: loadedIndex.lessons ?? [],
  labs: loadedIndex.labs ?? [],
  chapters: loadedIndex.chapters ?? [],
};

export function normalizeCourseUrl(value: string): string {
  const path = decodeURI(value.split(/[?#]/, 1)[0] || "/")
    .replace(/\/index\.html$/i, "/")
    .replace(/\.html$/i, "")
    .replace(/\/{2,}/g, "/");
  return path === "/" ? path : path.replace(/\/$/, "");
}

export function findCourseDocument(path: string): CourseDocument | undefined {
  const normalizedPath = normalizeCourseUrl(path);
  return [...courseIndex.lessons, ...courseIndex.labs].find(
    (document) => {
      const documentPath = normalizeCourseUrl(document.url);
      return documentPath === normalizedPath || normalizedPath.endsWith(documentPath);
    },
  );
}

export function getCourseChapters(): CourseChapter[] {
  if (courseIndex.chapters.length) return courseIndex.chapters;

  const chapters = new Map<number, CourseChapter>();
  for (const document of [...courseIndex.lessons, ...courseIndex.labs]) {
    const chapter = chapters.get(document.chapter) ?? {
      chapter: document.chapter,
      title: document.chapterTitle,
      lessons: [],
      labs: [],
    };
    chapter[document.kind === "lab" ? "labs" : "lessons"].push(document);
    chapters.set(document.chapter, chapter);
  }

  return [...chapters.values()].sort((left, right) => left.chapter - right.chapter);
}

export function getChapterLanding(document: CourseDocument): string {
  if (document.kind === "lab") return "/labs/";
  return courseIndex.lessons.find((entry) => entry.chapter === document.chapter)?.url
    ?? document.url;
}
