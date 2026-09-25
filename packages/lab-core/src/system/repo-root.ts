import path from "node:path";
import process from "node:process";
import { LabError } from "../errors.ts";
import { pathExists } from "../manifest/schema.ts";

/**
 * 仓库根靠标记文件向上查找，而不是按目录层数倒推 —— 判题内核被打包进学生包后层数不再成立。
 * 学生包里没有仓库根，返回 undefined 由调用方决定是否报错。
 */
export async function findRepoRoot(start: string): Promise<string | undefined> {
  let current = path.resolve(start);
  while (true) {
    const [workspace, labs] = await Promise.all([
      pathExists(path.join(current, "pnpm-workspace.yaml")),
      pathExists(path.join(current, "labs")),
    ]);
    if (workspace && labs) return current;
    const parent = path.dirname(current);
    if (parent === current) return undefined;
    current = parent;
  }
}

export async function requireRepoRoot(start: string): Promise<string> {
  const root = await findRepoRoot(start);
  if (root === undefined)
    throw new LabError("REPO_NOT_FOUND", `从 ${path.resolve(start)} 向上未找到 DSA Mastery 仓库根`);

  return root;
}

/**
 * pnpm 在子目录里运行脚本时把原始工作目录放进 INIT_CWD。
 * 只有当它落在 CLI 自身所属的仓库内时才可信：学生包里的 INIT_CWD 指向的是源仓库，用它会找错 Lab。
 */
export function invocationDirectory(repoRoot: string | undefined): string {
  const initCwd = process.env["INIT_CWD"];
  const initial = initCwd === undefined || initCwd === "" ? undefined : path.resolve(initCwd);
  if (initial === undefined || repoRoot === undefined) return process.cwd();
  const relative = path.relative(repoRoot, initial);

  return relative === "" || (!relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative))
    ? initial
    : process.cwd();
}
