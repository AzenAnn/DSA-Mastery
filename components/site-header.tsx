import { BookOpen, Code2, FlaskConical } from "lucide-react";
import Link from "next/link";
import type { SearchItem } from "@/lib/content";
import { SearchPalette } from "./search-palette";
import { ThemeToggle } from "./theme-toggle";

export function SiteHeader({ searchItems }: { searchItems: SearchItem[] }) {
  const repositoryUrl = process.env.NEXT_PUBLIC_REPOSITORY_URL;

  return (
    <header className="site-header">
      <div className="header-inner">
        <Link aria-label="DSA Lab 首页" className="brand" href="/">
          <span className="brand-mark" aria-hidden="true">D</span>
          <span>
            <strong>DSA Lab</strong>
            <small>主动输出式教程</small>
          </span>
        </Link>

        <SearchPalette items={searchItems} />

        <nav aria-label="主导航" className="header-nav">
          <Link href="/learn/chapter-00-introduction/00-overview">
            <BookOpen aria-hidden="true" size={17} />
            教材
          </Link>
          <Link href="/labs">
            <FlaskConical aria-hidden="true" size={17} />
            Labs
          </Link>
          {repositoryUrl ? (
            <a href={repositoryUrl} rel="noreferrer" target="_blank">
              <Code2 aria-hidden="true" size={17} />
              GitHub
            </a>
          ) : null}
        </nav>
        <ThemeToggle />
      </div>
    </header>
  );
}
