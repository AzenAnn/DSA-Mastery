import type { Metadata } from "next";
import "katex/dist/katex.min.css";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { getSearchItems } from "@/lib/content";

const siteUrlValue = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000/";
const siteUrl = new URL(siteUrlValue.endsWith("/") ? siteUrlValue : `${siteUrlValue}/`);
const description = "从概念、ADT 与复杂度推导，到动手实现、边界测试与典型问题训练，帮助课程学习者扎实掌握数据结构与算法。";
const imageUrl = new URL("og.png", siteUrl).toString();
const faviconUrl = new URL("favicon.svg", siteUrl).toString();

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: {
    default: "DSA Mastery · 数据结构与算法理论与实验教程",
    template: "%s · DSA Mastery",
  },
  description,
  icons: {
    icon: faviconUrl,
    shortcut: faviconUrl,
  },
  openGraph: {
    type: "website",
    url: siteUrl,
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
