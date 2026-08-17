import { spawn } from "node:child_process";
import process from "node:process";
import { LabError } from "./errors.mjs";

const MINIMUMS = Object.freeze({
  gcc: [11, 0, 0],
  clang: [14, 0, 0],
  msvc: [19, 30, 0],
  cmake: [3, 25, 0],
  make: [4, 0, 0],
});

function runProbe(command, args) {
  return new Promise((resolve) => {
    const child = spawn(command, args, { shell: false, windowsHide: true });
    let stdout = "";
    let stderr = "";
    child.stdout?.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr?.on("data", (chunk) => {
      stderr += chunk;
    });
    child.once("error", (error) => resolve({ available: false, error: error.code ?? error.message }));
    child.once("close", (code) => resolve({ available: true, code, output: `${stdout}\n${stderr}`.trim() }));
  });
}

function versionTuple(source, pattern = /(\d+)\.(\d+)(?:\.(\d+))?/) {
  const match = source?.match(pattern);
  return match ? [Number(match[1]), Number(match[2]), Number(match[3] ?? 0)] : undefined;
}

function compareVersion(actual, minimum) {
  if (!actual) return false;
  for (let index = 0; index < Math.max(actual.length, minimum.length); index += 1) {
    const difference = (actual[index] ?? 0) - (minimum[index] ?? 0);
    if (difference !== 0) return difference > 0;
  }
  return true;
}

function printable(tuple) {
  return tuple?.join(".") ?? "unknown";
}

async function probe(name, command, args, minimum, pattern) {
  const result = await runProbe(command, args);
  if (!result.available) return { name, command, available: false, meetsMinimum: false };
  const version = versionTuple(result.output, pattern);
  return {
    name,
    command,
    available: true,
    version: printable(version),
    minimum: printable(minimum),
    meetsMinimum: compareVersion(version, minimum),
    summary: result.output.split(/\r?\n/).find(Boolean)?.trim(),
  };
}

export async function inspectEnvironment(lab) {
  const probes = await Promise.all([
    probe("GCC", "g++", ["--version"], MINIMUMS.gcc),
    probe("Clang", "clang++", ["--version"], MINIMUMS.clang),
    probe("MSVC", "cl", [], MINIMUMS.msvc, /Version\s+(\d+)\.(\d+)(?:\.(\d+))?/i),
    probe("CMake", "cmake", ["--version"], MINIMUMS.cmake),
    probe("GNU Make", "make", ["--version"], MINIMUMS.make),
  ]);
  if (probes[0].available && /clang/i.test(probes[0].summary ?? "")) {
    probes[0].name = "Clang (g++ driver)";
    probes[0].minimum = printable(MINIMUMS.clang);
    probes[0].meetsMinimum = compareVersion(versionTuple(probes[0].version), MINIMUMS.clang);
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
    fallback: "pnpm lab:run -- <lab-path>",
    ok: issues.length === 0,
    issues,
  };
}

export function assertEnvironmentReady(environment) {
  if (!environment.ok) throw new LabError("ENVIRONMENT_MISSING", environment.issues.join("；"), environment);
}
