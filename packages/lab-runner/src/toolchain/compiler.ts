import type { MsvcEnvironment, ToolchainProbeOptions } from "./windows.ts";
import type { CompileTarget, Runner, TargetName, Toolchain } from "@dsa/lab-core";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { LabError, runProcess } from "@dsa/lab-core";
import { createMsvcEnvironment, isMsvcCommand } from "./windows.ts";

export type CompilerFamily = "gnu" | "msvc";

export interface SelectedCompiler {
  command: string;
  family: CompilerFamily;
  args?: string[];
  env?: NodeJS.ProcessEnv;
  toolchain?: MsvcEnvironment;
}

/** 编译只需要 Lab 根目录、编译目标和标准，Program Lab 与 Project 的 stdio task 共用这个形状。 */
export interface CompilableLab {
  labRoot: string;
  manifest: { targets?: Partial<Record<TargetName, CompileTarget>>; toolchain: Toolchain };
}

export interface CompileResult {
  ok: boolean;
  compiler: SelectedCompiler;
  command: string;
  args: string[];
  executable: string;
  stdout: string;
  stderr: string;
  durationMs: number;
}

async function available(
  command: string,
  args: string[] = ["--version"],
  acceptNonzero = false,
  env?: NodeJS.ProcessEnv,
  runner: Runner = runProcess,
): Promise<boolean> {
  const result = await runner(command, args, { env, timeMs: 5000, outputKb: 256 });

  return !result.spawnError && (acceptNonzero || result.code === 0);
}

export async function selectCompiler({
  platform = process.platform,
  env = process.env,
  runner = runProcess,
}: ToolchainProbeOptions = {}): Promise<SelectedCompiler> {
  if (env.CXX !== undefined && env.CXX !== "") {
    const command = env.CXX;
    const family: CompilerFamily = isMsvcCommand(command) ? "msvc" : "gnu";
    let compilerEnvironment: MsvcEnvironment | undefined;
    if (family === "msvc" && platform === "win32") {
      try {
        compilerEnvironment = await createMsvcEnvironment({ platform, env, runner });
      } catch (error) {
        throw new LabError("COMPILER_NOT_FOUND", (error as Error).message, (error as LabError).details);
      }
    }
    if (
      await available(
        command,
        family === "msvc" ? [] : ["--version"],
        family === "msvc",
        compilerEnvironment?.env,
        runner,
      )
    ) {
      return { command, family, env: compilerEnvironment?.env, toolchain: compilerEnvironment };
    }

    throw new LabError("COMPILER_NOT_FOUND", `CXX 指定的编译器不可用：${command}`);
  }
  const candidates: SelectedCompiler[] = [
    { command: "g++", family: "gnu" },
    { command: "clang++", family: "gnu" },
    ...(platform === "win32" ? [{ command: "cl", family: "msvc" as const, args: [] }] : []),
  ];
  for (const candidate of candidates) {
    let compilerEnvironment: MsvcEnvironment | undefined;
    if (candidate.family === "msvc") {
      try {
        compilerEnvironment = await createMsvcEnvironment({ platform, env, runner });
      } catch {
        continue;
      }
    }
    if (
      await available(candidate.command, candidate.args, candidate.family === "msvc", compilerEnvironment?.env, runner)
    ) {
      return { ...candidate, env: compilerEnvironment?.env, toolchain: compilerEnvironment };
    }
  }

  throw new LabError(
    "COMPILER_NOT_FOUND",
    "未找到可用 C++ 编译器；请安装 GCC >= 11、Clang >= 14 或 Visual Studio 2022，然后重新运行 lab doctor",
  );
}

export async function compileTarget(lab: CompilableLab, targetName: TargetName = "student"): Promise<CompileResult> {
  const target = lab.manifest.targets?.[targetName];
  if (!target) throw new LabError("TARGET_INVALID", `manifest 中不存在编译目标：${targetName}`);
  const compiler = await selectCompiler();
  const outputDir = path.join(lab.labRoot, ".lab-cache", "bin");
  await mkdir(outputDir, { recursive: true });
  const executable = path.join(outputDir, `${targetName}${process.platform === "win32" ? ".exe" : ""}`);
  const standard = lab.manifest.toolchain.standard;
  const sources = target.sources.map((source) => path.resolve(lab.labRoot, source));
  const includeDirs = (target.includeDirs ?? []).map((dir) => path.resolve(lab.labRoot, dir));
  const args =
    compiler.family === "msvc"
      ? [
          "/nologo",
          `/std:${standard}`,
          "/EHsc",
          "/utf-8",
          "/W4",
          ...includeDirs.map((dir) => `/I${dir}`),
          ...sources,
          `/Fe:${executable}`,
        ]
      : [
          `-std=${standard}`,
          "-O2",
          "-Wall",
          "-Wextra",
          "-Wpedantic",
          ...includeDirs.flatMap((dir) => ["-I", dir]),
          ...sources,
          "-o",
          executable,
        ];
  const result = await runProcess(compiler.command, args, {
    cwd: lab.labRoot,
    env: compiler.env,
    timeMs: 60_000,
    outputKb: 4096,
  });
  if (result.spawnError) {
    throw new LabError("COMPILER_NOT_FOUND", `无法启动编译器 ${compiler.command}：${result.spawnError.message}`);
  }

  return {
    ok: result.code === 0 && !result.timedOut && !result.outputExceeded,
    compiler,
    command: compiler.command,
    args,
    executable,
    stdout: result.stdout,
    stderr: result.stderr,
    durationMs: result.durationMs,
  };
}
