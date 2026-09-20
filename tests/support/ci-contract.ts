/**
 * CI 与文档共同依赖的测试项目名。
 * 收敛 package.json script 或改 workflow 时，只改这里一处。
 */
export const CI_CONTRACT = {
  /** C++ 门禁 job 必须跑的 vitest project。 */
  cppProjects: ["lab-cpp"],
  /** 站点 job 必须跑的 vitest project。 */
  siteProjects: ["unit", "lab-tools", "vscode", "content", "docs", "site-audit", "site-e2e", "discovery"],
} as const;
