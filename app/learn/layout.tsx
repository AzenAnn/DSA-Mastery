import { DocsSidebar } from "@/components/docs-sidebar";
import { MobileDocsNav } from "@/components/mobile-docs-nav";
import { getChapterGroups, getLabs, getLessons } from "@/lib/content";

export default function LearnLayout({ children }: { children: React.ReactNode }) {
  const lessonGroups = getChapterGroups(getLessons());
  const labGroups = getChapterGroups(getLabs());

  return (
    <div className="docs-layout">
      <DocsSidebar labGroups={labGroups} lessonGroups={lessonGroups} />
      <main className="docs-main">
        <MobileDocsNav labGroups={labGroups} lessonGroups={lessonGroups} />
        {children}
      </main>
    </div>
  );
}
