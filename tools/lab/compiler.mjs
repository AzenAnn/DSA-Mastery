import { mkdir } from "node:fs/promises";
import path from "node:path";
import { LabError } from "./errors.mjs";
import { runProcess } from "./process.mjs";

async function available(command, args = ["--version"], acceptNonzero = false) {
  const result = await runProcess(command, args, { timeMs: 5000, outputKb: 256 });
  return !result.spawnError && (acceptNonzero || result.code === 0);
}

export async function selectCompiler() {
  if (process.env.CXX) {
    const command = process.env.CXX;
    const family = /(?:^|[\\/])cl(?:\.exe)?$/i.test(command) ? "msvc" : "gnu";
    if (await available(command, family === "msvc" ? [] : ["--version"], family === "msvc")) return { command, family };
    throw new LabError("COMPILER_NOT_FOUND", `CXX 指定的编译器不可用：${command}`);
  }
  for (const candidate of [
    { command: "g++", family: "gnu" },
    { command: "clang++", family: "gnu" },
    { command: "cl", family: "msvc", args: [] },
  ]) {
    if (await available(candidate.command, candidate.args, candidate.family === "msvc")) return candidate;
  }
  throw new LabError("COMPILER_NOT_FOUND", "未找到可用 C++ 编译器；请安装 GCC >= 11、Clang >= 14 或 Visual Studio 2022，然后重新运行 lab:doctor");
}

export async function compileTarget(lab, targetName = "student") {
  const target = lab.manifest.targets?.[targetName];
  if (!target) throw new LabError("TARGET_INVALID", `manifest 中不存在编译目标：${targetName}`);
  const compiler = await selectCompiler();
  const outputDir = path.join(lab.labRoot, ".lab-cache", "bin");
  await mkdir(outputDir, { recursive: true });
  const executable = path.join(outputDir, `${targetName}${process.platform === "win32" ? ".exe" : ""}`);
  const standard = lab.manifest.toolchain.standard;
  const sources = target.sources.map((source) => path.resolve(lab.labRoot, source));
  const includeDirs = (target.includeDirs ?? []).map((dir) => path.resolve(lab.labRoot, dir));
  const args = compiler.family === "msvc"
    ? ["/nologo", `/std:${standard}`, "/EHsc", "/utf-8", "/W4", ...includeDirs.map((dir) => `/I${dir}`), ...sources, `/Fe:${executable}`]
    : [`-std=${standard}`, "-O2", "-Wall", "-Wextra", "-Wpedantic", ...includeDirs.flatMap((dir) => ["-I", dir]), ...sources, "-o", executable];
  const result = await runProcess(compiler.command, args, { cwd: lab.labRoot, timeMs: 60_000, outputKb: 4096 });
  if (result.spawnError) throw new LabError("COMPILER_NOT_FOUND", `无法启动编译器 ${compiler.command}：${result.spawnError.message}`);
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
