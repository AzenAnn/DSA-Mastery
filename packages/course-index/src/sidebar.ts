import type { CurriculumChapter } from "./curriculum.ts";
import type { CourseDocument, CourseIndex, LabCategory } from "./documents.ts";
import type { DefaultTheme } from "vitepress";
import process from "node:process";

export type LabSidebarIcons = Record<LabCategory, string>;

/** 课程内容始终在仓库根，向上找标记文件而不是按目录层数倒推。 */

function sidebarCategoryLabel(category: LabCategory, label: string, icon: string): string {
  return `<span class="course-lab-category course-lab-category--${category}">${icon}<span>${label}</span></span>`;
}

function labSidebarLabel(lab: CourseDocument): string {
  if (lab.labId === undefined) return lab.title;

  const title = lab.title.replace(/^Lab\s+\d{2}-[TEP]-\d{2,}[：:]\s*/, "");
  return `${lab.labId} · ${title}`;
}

function chapterLabGroup(labs: CourseDocument[], icons: LabSidebarIcons): DefaultTheme.SidebarItem {
  const categories: Array<{ category: LabCategory; label: string; empty: string }> = [
    { category: "theory", label: "理论 Theory", empty: "暂无理论型 Lab" },
    { category: "exercise", label: "实验 Exercise", empty: "暂无实验型 Lab" },
    { category: "project", label: "工程 Project", empty: "暂无工程型 Lab" },
  ];

  return {
    text: '<span class="course-lab-nav__title">本章 Labs</span>',
    collapsed: false,
    items: categories.map(({ category, label, empty }) => {
      const categoryLabs = labs.filter((lab) => lab.labCategory === category);
      return {
        text: sidebarCategoryLabel(category, label, icons[category]),
        collapsed: category !== "project",
        items: categoryLabs.length
          ? categoryLabs.map((lab) => ({ text: labSidebarLabel(lab), link: lab.url }))
          : [{ text: `<span class="course-lab-category__empty">${empty}</span>` }],
      };
    }),
  };
}

export function createCourseSidebar(index: CourseIndex, icons: LabSidebarIcons): DefaultTheme.SidebarItem[] {
  const chapterItem = (chapter: CurriculumChapter): DefaultTheme.SidebarItem => {
    if (chapter.number === "preface") {
      return {
        text: chapter.label,
        link: chapter.url,
        collapsed: false,
        items: chapter.lessons.map((lesson) => ({ text: lesson.title, link: lesson.url })),
      };
    }
    return {
      text: `${chapter.label} ${chapter.title}`,
      link: chapter.url,
      collapsed: true,
      items: [
        ...chapter.lessons.map((lesson) => ({ text: lesson.title, link: lesson.url })),
        ...(chapter.autoLabChapter !== undefined
          ? [chapterLabGroup(chapter.labs, icons)]
          : chapter.labs.length
            ? [
                {
                  text: "相关 Labs",
                  collapsed: true,
                  items: chapter.labs.map((lab) => ({ text: labSidebarLabel(lab), link: lab.url })),
                },
              ]
            : []),
      ],
    };
  };

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

export function normalizePagesBase(raw = process.env["GITHUB_PAGES_BASE_PATH"] ?? ""): string {
  const cleaned = raw.trim().replace(/^\/+|\/+$/g, "");
  return cleaned ? `/${cleaned}/` : "/";
}
