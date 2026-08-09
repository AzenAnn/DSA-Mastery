import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Clock3,
  FileText,
  FlaskConical,
  PencilLine,
  Users,
} from "lucide-react";
import type { TutorialDocument } from "@/lib/content";
import { MarkdownRenderer } from "./markdown-renderer";
import { SiteLink as Link } from "./site-link";

interface DocumentViewProps {
  document: TutorialDocument;
  previous?: TutorialDocument;
  next?: TutorialDocument;
}

export function DocumentView({ document, previous, next }: DocumentViewProps) {
  const repositoryUrl = process.env.NEXT_PUBLIC_REPOSITORY_URL;
  const editUrl = repositoryUrl
    ? `${repositoryUrl.replace(/\/$/, "")}/edit/main/${document.sourcePath}`
    : undefined;

  return (
    <div className="document-grid">
      <article className="document-article">
        <nav aria-label="面包屑" className="breadcrumbs">
          <Link href="/">首页</Link>
          <span>/</span>
          <Link href={document.kind === "lab" ? "/labs" : document.url}>
            {document.kind === "lab" ? "Labs" : `第 ${document.chapter} 章`}
          </Link>
          <span>/</span>
          <span>{document.title}</span>
        </nav>

        <header className="document-heading">
          <div className="eyebrow">
            {document.kind === "lab" ? <FlaskConical aria-hidden="true" size={15} /> : <FileText aria-hidden="true" size={15} />}
            {document.kind === "lab" ? "动手实验" : `第 ${document.chapter} 章 · ${document.chapterTitle}`}
          </div>
          <h1>{document.title}</h1>
          <p>{document.description}</p>
          <div className="document-meta">
            <span><Clock3 aria-hidden="true" size={15} />{document.duration || `约 ${document.readingMinutes} 分钟阅读`}</span>
            <span><CalendarDays aria-hidden="true" size={15} />更新于 {document.updated}</span>
            <span><Users aria-hidden="true" size={15} />{document.contributors.join("、") || "待认领"}</span>
            <span className={`status-badge status-${document.status}`}>{document.status}</span>
          </div>
        </header>

        <MarkdownRenderer markdown={document.body} sourceUrl={document.url} />

        <footer className="document-footer">
          <div>
            <strong>发现问题？</strong>
            <p>先记录可复现的依据，再在 Review 中讨论。教材正确性由人工最终确认。</p>
          </div>
          {editUrl ? (
            <a className="text-link" href={editUrl} rel="noreferrer" target="_blank">
              <PencilLine aria-hidden="true" size={16} />编辑此页
            </a>
          ) : (
            <span className="source-path"><PencilLine aria-hidden="true" size={15} />{document.sourcePath}</span>
          )}
        </footer>

        <nav aria-label="前后页面" className="page-pagination">
          {previous ? (
            <Link className="pagination-card previous" href={previous.url}>
              <ArrowLeft aria-hidden="true" size={18} />
              <span><small>上一页</small><strong>{previous.title}</strong></span>
            </Link>
          ) : <span />}
          {next ? (
            <Link className="pagination-card next" href={next.url}>
              <span><small>下一页</small><strong>{next.title}</strong></span>
              <ArrowRight aria-hidden="true" size={18} />
            </Link>
          ) : <span />}
        </nav>
      </article>

      <aside aria-label="本页目录" className="table-of-contents">
        <p>本页目录</p>
        {document.headings.length ? (
          <nav>
            {document.headings.map((heading) => (
              <a className={heading.depth === 3 ? "toc-depth-3" : undefined} href={`#${heading.id}`} key={heading.id}>
                {heading.text}
              </a>
            ))}
          </nav>
        ) : <span>本页暂无二级标题</span>}
      </aside>
    </div>
  );
}
