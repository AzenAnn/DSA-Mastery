import type { NextConfig } from "next";

const isGitHubPagesBuild = process.env.GITHUB_PAGES === "true";
const repositoryName = process.env.GITHUB_REPOSITORY?.split("/").at(-1);
const derivedGitHubPagesBasePath = repositoryName && !repositoryName.endsWith(".github.io")
  ? `/${repositoryName}`
  : "";
const githubPagesBasePath = process.env.GITHUB_PAGES_BASE_PATH
  ?? derivedGitHubPagesBasePath;

const nextConfig: NextConfig = {
  output: isGitHubPagesBuild ? "export" : undefined,
  basePath: isGitHubPagesBuild ? githubPagesBasePath : undefined,
  trailingSlash: isGitHubPagesBuild,
};

export default nextConfig;
