import type { Metadata } from "next";
import { headers } from "next/headers";
import "katex/dist/katex.min.css";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { getSearchItems } from "@/lib/content";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host")
    ?? requestHeaders.get("host")
    ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto")
    ?? (/^(localhost|127\.)/.test(host) ? "http" : "https");
  const origin = `${protocol}://${host}`;
  const description = "通过解释、实现、测试与同伴评审，共同建设一套可持续更新的数据结构与算法教程。";
  const imageUrl = new URL("/og.png", origin).toString();

  return {
    metadataBase: new URL(origin),
    title: {
      default: "DSA Lab · 主动输出式数据结构与算法教程",
      template: "%s · DSA Lab",
    },
    description,
    icons: {
      icon: "/favicon.svg",
      shortcut: "/favicon.svg",
    },
    openGraph: {
      type: "website",
      url: origin,
      title: "DSA Lab · 主动输出式数据结构与算法教程",
      description,
      images: [{ url: imageUrl, width: 1676, height: 941, alt: "DSA Lab 项目分享封面" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "DSA Lab · 主动输出式数据结构与算法教程",
      description,
      images: [imageUrl],
    },
  };
}

const themeScript = `
  try {
    const saved = localStorage.getItem('dsa-lab-theme');
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.dataset.theme = saved || (systemDark ? 'dark' : 'light');
  } catch (_) {}
`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const searchItems = getSearchItems();

  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head>
      <body>
        <SiteHeader searchItems={searchItems} />
        {children}
        <footer className="site-footer">
          <span>DSA Lab · 学习价值优先的开源教程实验</span>
          <span>Markdown 是当前唯一内容源</span>
        </footer>
      </body>
    </html>
  );
}
