import Link from "next/link";
import type { AnchorHTMLAttributes } from "react";

type SiteLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  href: string;
};

const isGitHubPagesBuild = process.env.NEXT_PUBLIC_DEPLOY_TARGET === "github-pages";
const githubPagesBasePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/$/, "");

function splitHref(href: string): [pathname: string, suffix: string] {
  const suffixIndexes = [href.indexOf("?"), href.indexOf("#")].filter((index) => index >= 0);
  const suffixIndex = suffixIndexes.length ? Math.min(...suffixIndexes) : href.length;
  return [href.slice(0, suffixIndex), href.slice(suffixIndex)];
}

export function resolveStaticSiteHref(href: string): string {
  if (!isGitHubPagesBuild || !href.startsWith("/") || href.startsWith("//")) return href;

  const [pathname, suffix] = splitHref(href);
  const routePath = pathname !== "/" && !pathname.endsWith("/") && !/\.[^/]+$/.test(pathname)
    ? `${pathname}/`
    : pathname;

  if (!githubPagesBasePath) return `${routePath}${suffix}`;
  if (routePath === githubPagesBasePath || routePath.startsWith(`${githubPagesBasePath}/`)) {
    return `${routePath}${suffix}`;
  }

  const prefixedPath = routePath === "/"
    ? `${githubPagesBasePath}/`
    : `${githubPagesBasePath}${routePath}`;
  return `${prefixedPath}${suffix}`;
}

export function SiteLink({ children, href, ...props }: SiteLinkProps) {
  // Pages cannot serve vinext's header-driven RSC requests, so these links must load HTML documents.
  if (isGitHubPagesBuild) {
    return (
      <a
        {...props}
        data-navigation-mode="document"
        href={resolveStaticSiteHref(href)}
      >
        {children}
      </a>
    );
  }

  return <Link href={href} {...props}>{children}</Link>;
}
