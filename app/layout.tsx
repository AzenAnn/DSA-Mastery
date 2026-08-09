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
  const description = "从概念、ADT 与复杂度推导，到动手实现、边界测试与典型问题训练，帮助课程学习者扎实掌握数据结构与算法。";
  const imageUrl = new URL("/og.png", origin).toString();

  return {
    metadataBase: new URL(origin),
    title: {
      default: "DSA Mastery · 数据结构与算法理论与实验教程",
      template: "%s · DSA Mastery",
    },
    description,
    icons: {
      icon: "/favicon.svg",
      shortcut: "/favicon.svg",
    },
    openGraph: {
      type: "website",
      url: origin,
      title: "DSA Mastery · 数据结构与算法理论与实验教程",
      description,
      images: [{ url: imageUrl, width: 1672, height: 941, alt: "DSA Mastery 项目分享封面" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "DSA Mastery · 数据结构与算法理论与实验教程",
      description,
      images: [imageUrl],
    },
  };
}

const themeScript = `
  try {
    const currentTheme = localStorage.getItem('dsa-mastery-theme');
    const legacyTheme = localStorage.getItem('dsa-lab-theme');
    const saved = currentTheme || legacyTheme;
    if (!currentTheme && legacyTheme) {
      localStorage.setItem('dsa-mastery-theme', legacyTheme);
    }
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
          <span>DSA Mastery · 面向课程高水平掌握的理论与实验教程</span>
          <span>Markdown 是当前唯一内容源</span>
        </footer>
      </body>
    </html>
  );
}
