import hljs from "highlight.js/lib/core";
import bash from "highlight.js/lib/languages/bash";
import cpp from "highlight.js/lib/languages/cpp";
import javascript from "highlight.js/lib/languages/javascript";
import plaintext from "highlight.js/lib/languages/plaintext";
import python from "highlight.js/lib/languages/python";
import typescript from "highlight.js/lib/languages/typescript";
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { CopyButton } from "./copy-button";
import { SiteLink as Link } from "./site-link";

hljs.registerLanguage("bash", bash);
hljs.registerLanguage("cpp", cpp);
hljs.registerLanguage("c", cpp);
hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("js", javascript);
hljs.registerLanguage("plaintext", plaintext);
hljs.registerLanguage("text", plaintext);
hljs.registerLanguage("python", python);
hljs.registerLanguage("py", python);
hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("ts", typescript);

function CodeBlock({ code, language }: { code: string; language?: string }) {
  const normalizedLanguage = language?.toLowerCase();
  const highlighted = normalizedLanguage && hljs.getLanguage(normalizedLanguage)
    ? hljs.highlight(code, { language: normalizedLanguage }).value
    : hljs.highlightAuto(code).value;

  return (
    <figure className="code-block">
      <figcaption>
        <span>{normalizedLanguage || "text"}</span>
        <CopyButton code={code} />
      </figcaption>
      <pre>
        <code className={`hljs language-${normalizedLanguage || "text"}`} dangerouslySetInnerHTML={{ __html: highlighted }} />
      </pre>
    </figure>
  );
}

function resolveDocumentHref(href: string, sourceUrl: string): string {
  if (!href.endsWith(".md") && !href.includes(".md#")) return href;
  const [pathPart, hash] = href.split("#", 2);
  const baseSegments = sourceUrl.split("/").filter(Boolean).slice(0, -1);
  const targetSegments = pathPart.split("/");
  for (const segment of targetSegments) {
    if (!segment || segment === ".") continue;
    if (segment === "..") baseSegments.pop();
    else baseSegments.push(segment.replace(/\.md$/i, ""));
  }
  return `/${baseSegments.join("/")}${hash ? `#${hash}` : ""}`;
}

export function MarkdownRenderer({ markdown, sourceUrl }: { markdown: string; sourceUrl: string }) {
  return (
    <div className="markdown-body">
      <ReactMarkdown
        rehypePlugins={[rehypeSlug, rehypeKatex]}
        remarkPlugins={[remarkGfm, remarkMath]}
        components={{
          pre({ children }) {
            return <>{children}</>;
          },
          a({ href = "", children, ...props }) {
            const resolvedHref = resolveDocumentHref(href, sourceUrl);
            const external = /^(https?:)?\/\//.test(resolvedHref);
            if (external) {
              return <a href={resolvedHref} rel="noreferrer" target="_blank" {...props}>{children}</a>;
            }
            return <Link href={resolvedHref} {...props}>{children}</Link>;
          },
          code({ className, children, ...props }) {
            const language = /language-([^\s]+)/.exec(className || "")?.[1];
            const code = String(children).replace(/\n$/, "");
            if (!language && !code.includes("\n")) {
              return <code className={className} {...props}>{children}</code>;
            }
            return <CodeBlock code={code} language={language} />;
          },
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
