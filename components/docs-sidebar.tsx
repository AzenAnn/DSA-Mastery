"use client";

import { BookOpen, ChevronDown, FlaskConical } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ChapterGroup } from "@/lib/content";

interface DocsSidebarProps {
  lessonGroups: ChapterGroup[];
  labGroups: ChapterGroup[];
}

function NavigationGroups({ groups, label }: { groups: ChapterGroup[]; label: string }) {
  const pathname = usePathname();

  return (
    <div className="sidebar-section">
      <p className="sidebar-label">{label}</p>
      {groups.map((group) => (
        <details className="chapter-nav" key={`${label}-${group.chapter}`} open>
          <summary>
            <span>第 {group.chapter} 章 · {group.title}</span>
            <ChevronDown aria-hidden="true" size={15} />
          </summary>
          <div className="chapter-links">
            {group.entries.map((entry) => (
              <Link
                aria-current={pathname === entry.url ? "page" : undefined}
                className={pathname === entry.url ? "active" : undefined}
                href={entry.url}
                key={entry.url}
              >
                {entry.title.replace(/^第\s*\d+\s*章\s*/, "")}
              </Link>
            ))}
          </div>
        </details>
      ))}
    </div>
  );
}

export function DocsSidebar({ lessonGroups, labGroups }: DocsSidebarProps) {
  return (
    <aside className="docs-sidebar">
      <nav aria-label="教程目录">
        <div className="sidebar-mode">
          <BookOpen aria-hidden="true" size={16} />
          教材目录
        </div>
        <NavigationGroups groups={lessonGroups} label="章节" />
        <div className="sidebar-mode sidebar-mode-labs">
          <FlaskConical aria-hidden="true" size={16} />
          实践实验
        </div>
        <NavigationGroups groups={labGroups} label="Labs" />
      </nav>
    </aside>
  );
}
