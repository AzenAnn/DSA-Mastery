import process from "node:process";
import { LabError } from "./errors.mjs";
import { compareVersion, formatVersion, MINIMUMS, parseVersion } from "./requirements.mjs";
import { runProcess } from "./process.mjs";
import { createMsvcEnvironment } from "./toolchain.mjs";

async function probe(name, command, args, minimum, pattern, options = {}) {
  const result = await options.runner(command, args, { env: options.env, timeMs: 5000, outputKb: 256 });
  if (result.spawnError) return { name, command, available: false, meetsMinimum: false, error: result.spawnError.code ?? result.spawnError.message };
  const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`.trim();
  const version = parseVersion(output, pattern);
  return {
    name,
    command,
    available: true,
    version: formatVersion(version),
    minimum: formatVersion(minimum),
    meetsMinimum: compareVersion(version, minimum),
    summary: output.split(/\r?\n/).find(Boolean)?.trim(),
  };
}

export async function inspectEnvironment(lab, options = {}) {
  const platform = options.platform ?? process.platform;
  const env = options.env ?? process.env;
  const runner = options.runner ?? runProcess;
  let msvcEnvironment;
  let msvcError;
  if (platform === "win32") {
    try {
      msvcEnvironment = await createMsvcEnvironment({ platform, env, runner });
    } catch (error) {
      msvcError = error;
    }
  }
  const probes = await Promise.all([
    probe("GCC", "g++", ["--version"], MINIMUMS.gcc, undefined, { env, runner }),
    probe("Clang", "clang++", ["--version"], MINIMUMS.clang, undefined, { env, runner }),
    probe("MSVC", "cl", [], MINIMUMS.msvc, /Version\s+(\d+)\.(\d+)(?:\.(\d+))?/i, { env: msvcEnvironment?.env, runner }),
    probe("CMake", "cmake", ["--version"], MINIMUMS.cmake, undefined, { env, runner }),
    probe("GNU Make", "make", ["--version"], MINIMUMS.make, undefined, { env, runner }),
  ]);
  if (probes[0].available && /clang/i.test(probes[0].summary ?? "")) {
    probes[0].name = "Clang (g++ driver)";
    probes[0].minimum = formatVersion(MINIMUMS.clang);
    probes[0].meetsMinimum = compareVersion(parseVersion(probes[0].version), MINIMUMS.clang);
  }
  const compilers = probes.slice(0, 3);
  const requiresCompiler = lab.manifest.type !== "quiz";
  const requiresCmake = lab.manifest.type === "project";
  const compilerReady = compilers.some((item) => item.available && item.meetsMinimum);
  const cmake = probes.find((item) => item.name === "CMake");
  const make = probes.find((item) => item.name === "GNU Make");
  const issues = [];
  if (requiresCompiler && !compilerReady) {
    issues.push("需要 GCC >= 11、Clang >= 14 或 Visual Studio 2022 / MSVC >= 19.30 之一");
  }
  if (requiresCmake && !(cmake.available && cmake.meetsMinimum)) issues.push("Project Lab 需要 CMake >= 3.25");
  return {
    platform: process.platform,
    architecture: process.arch,
    node: process.version,
    standard: lab.manifest.toolchain?.standard,
    tools: probes,
    makeOptional: true,
    makeAvailable: make.available,
    msvc: {
      initialized: Boolean(msvcEnvironment),
      installationPath: msvcEnvironment?.installationPath,
      developerCommand: msvcEnvironment?.developerCommand,
      error: msvcError?.message,
    },
    fallback: "pnpm lab:run -- <lab-path>",
    ok: issues.length === 0,
    issues,
  };
}

export function assertEnvironmentReady(environment) {
  if (!environment.ok) throw new LabError("ENVIRONMENT_MISSING", environment.issues.join("；"), environment);
}
