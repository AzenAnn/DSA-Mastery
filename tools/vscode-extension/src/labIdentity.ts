const STABLE_LAB_ID = /^\d{2}[TEP]\d{2,}$/;

/** 读取 PR#122 的稳定题号；旧仓库或旧 learner 包没有合法编号时退回目录名。 */
export function readStableLabId(value: unknown, legacyDirectoryName: string): string {
  if (typeof value !== "string" || !value.trim()) return legacyDirectoryName;
  const id = value.trim();
  return STABLE_LAB_ID.test(id) ? id : legacyDirectoryName;
}

/** 侧边栏显示题号已经单独呈现，因此从标题中去掉旧/新编号前缀，避免重复。 */
export function shortLabTitle(title: string): string {
  return title.replace(/^Lab\s+(?:\d{2}-(?:\d{2}|[TEP]-\d{2,})|\d{2}[TEP]\d{2,})[：:]\s*/, "");
}
