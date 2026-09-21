import type { SetupOptions } from "../options.ts";
import type { SetupContext, SetupIo } from "./context.ts";
import type { Runner } from "@dsa/lab-core";
import { mkdir, readdir, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { runProcess } from "@dsa/lab-core";
import { promptLine } from "../ui/choices.ts";
import { firstOutputLine, pathExists, resultFailed, runExternal } from "./context.ts";
import { setupError } from "./report.ts";

export interface RepositoryState {
  path: string;
  exists: boolean;
  directory: boolean;
  empty: boolean;
  valid: boolean;
  git: boolean;
  dirty: boolean;
  remote?: string;
  updateRepo?: boolean;
}

export function resolveRepositoryDir({
  cwd = process.cwd(),
  repoDir,
}: { cwd?: string; repoDir?: string } = {}): string {
  return path.resolve(cwd, repoDir ?? ".");
}

export async function inspectRepository(
  repositoryDir: string,
  { runner = runProcess, env = process.env }: { runner?: Runner; env?: NodeJS.ProcessEnv } = {},
): Promise<RepositoryState> {
  const state: RepositoryState = {
    path: repositoryDir,
    exists: false,
    directory: false,
    empty: false,
    valid: false,
    git: false,
    dirty: false,
    remote: undefined,
  };
  try {
    const repositoryStat = await stat(repositoryDir);
    state.exists = true;
    state.directory = repositoryStat.isDirectory();
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return state;
    throw error;
  }
  if (!state.directory) return state;
  state.empty = (await readdir(repositoryDir)).length === 0;
  state.valid = await Promise.all([
    pathExists(path.join(repositoryDir, "package.json")),
    pathExists(path.join(repositoryDir, "pnpm-lock.yaml")),
    pathExists(path.join(repositoryDir, "labs")),
    pathExists(path.join(repositoryDir, "packages", "lab-cli", "dist", "cli.js")),
  ]).then((items) => items.every(Boolean));
  state.git = await pathExists(path.join(repositoryDir, ".git"));
  if (state.git) {
    const status = await runner("git", ["status", "--short"], {
      cwd: repositoryDir,
      env,
      timeMs: 10_000,
      outputKb: 256,
    });
    state.dirty = !resultFailed(status) && Boolean(status.stdout?.trim());
    const remote = await runner("git", ["remote", "get-url", "origin"], {
      cwd: repositoryDir,
      env,
      timeMs: 10_000,
      outputKb: 256,
    });
    if (!resultFailed(remote)) state.remote = firstOutputLine(remote);
  }
  return state;
}

export function assertRepositorySafe(state: RepositoryState): RepositoryState {
  if (state.exists && !state.directory) {
    throw setupError("REPOSITORY_INVALID", `仓库目标不是目录：${state.path}`);
  }
  if (state.exists && !state.valid && !state.empty) {
    throw setupError("REPOSITORY_INVALID", `目标目录不是 DSA Mastery 仓库且不为空，不会覆盖：${state.path}`);
  }
  if (state.dirty && state.updateRepo) {
    throw setupError(
      "REPOSITORY_DIRTY",
      `仓库存在未提交改动，已阻止更新：${state.path}；请提交/暂存改动后再使用 --update-repo。`,
    );
  }
  return state;
}

export async function ensureRepository(context: SetupContext): Promise<RepositoryState> {
  let state = await inspectRepository(context.repoDir, { runner: context.runner, env: context.env });
  state.updateRepo = context.options.updateRepo;
  assertRepositorySafe(state);
  if (state.valid) {
    if (context.options.updateRepo) {
      if (!state.git) {
        throw setupError("REPOSITORY_INVALID", "--update-repo 要求目标是 Git 仓库；当前目录缺少 .git。", {
          path: context.repoDir,
        });
      }
      await runExternal(context, "git", ["pull", "--ff-only"], {
        stage: "repository",
        timeMs: 120_000,
        errorCode: "REPOSITORY_UPDATE_FAILED",
        errorMessage: "仓库更新失败；未执行强制覆盖，请检查网络和远端分支。",
      });
      state = await inspectRepository(context.repoDir, { runner: context.runner, env: context.env });
    }
    context.repository = state;
    return state;
  }
  if (context.options.checkOnly) {
    throw setupError("REPOSITORY_MISSING", `未找到有效的 DSA Mastery 仓库：${context.repoDir}`, {
      path: context.repoDir,
    });
  }
  await mkdir(path.dirname(context.repoDir), { recursive: true });
  await runExternal(context, "git", ["clone", context.options.repoUrl, context.repoDir], {
    stage: "repository",
    timeMs: 20 * 60_000,
    errorCode: "REPOSITORY_UPDATE_FAILED",
    errorMessage: `仓库 clone 失败：${context.options.repoUrl}`,
  });
  state = await inspectRepository(context.repoDir, { runner: context.runner, env: context.env });
  if (!state.valid)
    throw setupError("REPOSITORY_INVALID", `clone 完成但目标不是有效的 DSA Mastery 仓库：${context.repoDir}`);
  context.repository = state;
  return state;
}

export async function askRepositoryUpdate(
  options: SetupOptions,
  { io, cwd, runner, env }: { io: SetupIo; cwd: string; runner: Runner; env: NodeJS.ProcessEnv },
): Promise<SetupOptions> {
  const interactive =
    !options.nonInteractive &&
    !options.json &&
    !options.checkOnly &&
    options.ui !== "plain" &&
    Boolean(io.input?.isTTY && io.output?.isTTY);
  if (!interactive || options.updateRepo) return options;
  const repositoryDir = resolveRepositoryDir({ cwd, repoDir: options.repoDir });
  const state = await inspectRepository(repositoryDir, { runner, env });
  if (!state.valid || !state.git || state.dirty) return options;
  const answer = (
    await promptLine(`发现已有干净仓库 ${repositoryDir}，是否执行 git pull --ff-only？[y/N]：`, io.input!, io.output!)
  ).toLowerCase();
  if (["y", "yes", "是"].includes(answer)) return { ...options, updateRepo: true };
  return options;
}
