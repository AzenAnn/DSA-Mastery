const STABLE_LAB_ID = /^\d{2}[TEP]\d{2,}$/;

/** 旧仓库没有 labId 时退回目录名，供 v2 进度迁移和旧 learner 包兼容。 */
export function readStableLabId(value: unknown, legacyDirectoryName: string): string {
  if (typeof value !== "string" || !value.trim()) return legacyDirectoryName;
  const id = value.trim();
  return STABLE_LAB_ID.test(id) ? id : legacyDirectoryName;
}
