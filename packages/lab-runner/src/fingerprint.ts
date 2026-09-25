import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

/**
 * 判题引擎指纹：引擎变了就让 Project 的缓存成绩失效。
 * 打包产物由 tsdown 在构建期注入常量；直接跑源码时按源码树现算。
 */
declare const __LAB_ENGINE_FINGERPRINT__: string;

/** 三个包的源码都会进判题产物，漏算任何一个都会让引擎改动后的缓存成绩继续生效。 */
const ENGINE_PACKAGES = ["lab-core", "lab-runner", "lab-cli"];

/** 必须递归：源码分目录放置后，只扫顶层会漏掉绝大多数引擎代码。 */
async function collectSources(root: string): Promise<string[]> {
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

  return files;
}

export async function hashEngineSources(packagesDir: string): Promise<string> {
  const hash = createHash("sha256");
  for (const pkg of ENGINE_PACKAGES) {
    const root = path.join(packagesDir, pkg, "src");
    for (const file of await collectSources(root)) {
      const source = await readFile(file);
      // 路径和长度一起入哈希：只拼内容的话，改名或在文件之间搬代码都不会改变指纹。
      hash.update(`${pkg}/${path.relative(root, file).replaceAll(path.sep, "/")}\u0000${source.length}\u0000`);
      hash.update(source);
    }
  }

  return hash.digest("hex");
}

export async function engineFingerprint(): Promise<string> {
  if (typeof __LAB_ENGINE_FINGERPRINT__ === "string") return __LAB_ENGINE_FINGERPRINT__;

  return hashEngineSources(path.resolve(import.meta.dirname, "../.."));
}
