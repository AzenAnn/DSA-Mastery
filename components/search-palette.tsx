"use client";

import { BookOpen, FlaskConical, Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { SearchItem } from "@/lib/content";
import { SiteLink as Link } from "./site-link";

interface SearchPaletteProps {
  items: SearchItem[];
}

export function SearchPalette({ items }: SearchPaletteProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const typing = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA";
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
      } else if (event.key === "/" && !typing) {
        event.preventDefault();
        setOpen(true);
      } else if (event.key === "Escape") {
        setOpen(false);
      }
    }

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  useEffect(() => {
    if (!open) return;
    const frame = window.requestAnimationFrame(() => inputRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [open]);

  const results = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("zh-CN");
    if (!normalized) return items.slice(0, 8);
    const terms = normalized.split(/\s+/).filter(Boolean);
    return items
      .filter((item) => {
        const haystack = `${item.title} ${item.description} ${item.headings.join(" ")} ${item.searchText}`;
        return terms.every((term) => haystack.includes(term));
      })
      .slice(0, 10);
  }, [items, query]);

  function close() {
    setOpen(false);
    setQuery("");
  }

  return (
    <>
      <button className="search-trigger" onClick={() => setOpen(true)} type="button">
        <Search aria-hidden="true" size={17} />
        <span>搜索教材与实验</span>
        <kbd>Ctrl K</kbd>
      </button>

      {open ? (
        <div className="search-overlay">
          <section aria-label="全文搜索" aria-modal="true" className="search-dialog" role="dialog">
            <div className="search-input-row">
              <Search aria-hidden="true" size={19} />
              <input
                aria-label="搜索关键词"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="试试“复杂度”“链表”或“Lab”"
                ref={inputRef}
                value={query}
              />
              <button aria-label="关闭搜索" className="bare-button" onClick={close} type="button">
                <X aria-hidden="true" size={19} />
              </button>
            </div>

            <div className="search-results">
              <p className="search-hint">{query ? `找到 ${results.length} 条结果` : "快速开始"}</p>
              {results.length ? (
                results.map((item) => (
                  <Link className="search-result" href={item.url} key={item.url} onClick={close}>
                    <span className="search-result-icon">
                      {item.kind === "lesson" ? (
                        <BookOpen aria-hidden="true" size={17} />
                      ) : (
                        <FlaskConical aria-hidden="true" size={17} />
                      )}
                    </span>
                    <span>
                      <strong>{item.title}</strong>
                      <small>{item.chapterLabel} · {item.kind === "lesson" ? "教材" : "实验"}</small>
                    </span>
                  </Link>
                ))
              ) : (
                <div className="search-empty">
                  <strong>没有匹配内容</strong>
                  <span>换一个关键词，或检查章节是否带有完整 frontmatter。</span>
                </div>
              )}
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
