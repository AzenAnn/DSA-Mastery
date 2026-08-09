import { Menu } from "lucide-react";
import type { ChapterGroup } from "@/lib/content";
import { SiteLink as Link } from "./site-link";

export function MobileDocsNav({
  lessonGroups,
  labGroups,
}: {
  lessonGroups: ChapterGroup[];
  labGroups: ChapterGroup[];
}) {
  return (
    <details className="mobile-docs-nav">
      <summary>
        <Menu aria-hidden="true" size={17} />
        打开教程目录
      </summary>
      <div className="mobile-docs-panel">
        {[...lessonGroups, ...labGroups].map((group, index) => (
          <div key={`${index}-${group.chapter}`}>
            <strong>{index < lessonGroups.length ? "教材" : "Lab"} · 第 {group.chapter} 章 {group.title}</strong>
            {group.entries.map((entry) => <Link href={entry.url} key={entry.url}>{entry.title}</Link>)}
          </div>
        ))}
      </div>
    </details>
  );
}
