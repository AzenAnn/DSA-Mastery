import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

/**
 * 判题引擎指纹：引擎变了就让 Project 的缓存成绩失效。
 * 打包产物由 tsdown 在构建期注入常量；直接跑源码时按源码树现算。
 */
declare const __LAB_ENGINE_FINGERPRINT__: string;

/** 必须递归：源码分目录放置后，只扫顶层会漏掉绝大多数引擎代码。 */
export async function hashSourceTree(root: string): Promise<string> {
  const files: string[] = [];
  async function collect(directory: string): Promise<void> {
    for (const entry of (await readdir(directory, { withFileTypes: true })).sort((left, right) =>
      left.name.localeCompare(right.name),
    )) {
      const target = path.join(directory, entry.name);
      if (entry.isDirectory()) await collect(target);
      else if (entry.name.endsWith(".ts")) files.push(target);
    }
  }
  await collect(root);
  const hash = createHash("sha256");
  for (const file of files) hash.update(await readFile(file));

  return hash.digest("hex");
}

export async function engineFingerprint(): Promise<string> {
  if (typeof __LAB_ENGINE_FINGERPRINT__ === "string") return __LAB_ENGINE_FINGERPRINT__;

  return hashSourceTree(path.resolve(import.meta.dirname));
}
