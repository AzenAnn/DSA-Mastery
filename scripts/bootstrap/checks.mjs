import process from "node:process";
import { compareVersion, formatVersion, MINIMUMS, parseVersion, PNPM_VERSION, profileRequirements } from "./requirements.mjs";
import { runCommand } from "./commands.mjs";
import { createMsvcEnvironment } from "../../tools/lab/toolchain.mjs";

export function parseCommandVersion(_command, output) {
  return formatVersion(parseVersion(output));
}

function hasTool(tools, names) {
  return tools.some((tool) => names.includes(tool.name) && tool.available && tool.meetsMinimum);
}

export function evaluateProfile(profile, tools = []) {
  const requirement = profileRequirements(profile);
  const issues = [];
  const git = tools.find((tool) => tool.name === "Git");
  const node = tools.find((tool) => tool.name === "Node.js");
  const pnpm = tools.find((tool) => tool.name === "pnpm");
  if (!git?.available || !git.meetsMinimum) issues.push("Git");
  if (!node?.available || !node.meetsMinimum) issues.push(`Node.js >= ${formatVersion(MINIMUMS.node)}`);
  if (!pnpm?.available || !pnpm.meetsMinimum || pnpm.version !== PNPM_VERSION) issues.push(`pnpm ${PNPM_VERSION}`);
  const compilerReady = hasTool(tools, ["GCC", "Clang", "Clang (g++ driver)", "MSVC"]);
  if (requirement.requiresCompiler && !compilerReady) issues.push("GCC >= 11、Clang >= 14 或 MSVC >= 19.30 之一");
  const cmake = tools.find((tool) => tool.name === "CMake");
  const cmakeReady = Boolean(cmake?.available && cmake.meetsMinimum);
  if (requirement.requiresCmake && !cmakeReady) issues.push(`CMake >= ${formatVersion(MINIMUMS.cmake)}`);
  return {
    profile,
    ok: issues.length === 0,
    issues,
    compilerReady,
    cmakeReady,
  };
}

export function toolResult(name, command, output, minimum) {
  const version = parseVersion(output);
  return {
    name,
    command,
    available: version !== undefined,
    version: formatVersion(version),
    minimum: formatVersion(minimum),
    meetsMinimum: compareVersion(version, minimum),
  };
}

async function probeTool(name, command, args, minimum, options = {}) {
  const result = await (options.runner ?? runCommand)(command, args, {
    env: options.env,
    cwd: options.cwd,
    timeoutMs: options.timeoutMs ?? 5000,
    timeMs: options.timeoutMs ?? 5000,
    outputLimitKb: 256,
    outputKb: 256,
  });
  const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`.trim();
  const version = parseVersion(output, options.pattern);
  const available = !result.spawnError && (result.code === 0 || options.allowNonzero);
  return {
    name,
    command,
    available,
    version: formatVersion(version),
    minimum: formatVersion(minimum),
    meetsMinimum: available && (options.exactVersion
      ? formatVersion(version) === options.exactVersion
      : compareVersion(version, minimum)),
    summary: output.split(/\r?\n/).find(Boolean)?.trim(),
    error: result.spawnError?.code ?? result.spawnError?.message,
  };
}

export async function inspectHost({ platform = process.platform, architecture = process.arch, env = process.env, runner = runCommand, nodeCommand = process.execPath } = {}) {
  let msvcEnvironment;
  let msvcError;
  if (platform === "win32") {
    try {
      msvcEnvironment = await createMsvcEnvironment({ platform, env, runner });
    } catch (error) {
      msvcError = error;
    }
  }
  const tools = await Promise.all([
    probeTool("Git", "git", ["--version"], [0, 0, 0], { env, runner }),
    probeTool("Node.js", nodeCommand, ["--version"], MINIMUMS.node, { env, runner }),
    probeTool("pnpm", "pnpm", ["--version"], parseVersion(PNPM_VERSION), { env, runner, exactVersion: PNPM_VERSION }),
    probeTool("GCC", "g++", ["--version"], MINIMUMS.gcc, { env, runner }),
    probeTool("Clang", "clang++", ["--version"], MINIMUMS.clang, { env, runner }),
    probeTool("MSVC", "cl", [], MINIMUMS.msvc, {
      env: msvcEnvironment?.env,
      runner,
      pattern: /Version\s+(\d+)\.(\d+)(?:\.(\d+))?/i,
      allowNonzero: true,
    }),
    probeTool("CMake", "cmake", ["--version"], MINIMUMS.cmake, { env, runner }),
    probeTool("GNU Make", "make", ["--version"], MINIMUMS.make, { env, runner }),
  ]);
  const node = tools.find((tool) => tool.name === "Node.js");
  const pnpm = tools.find((tool) => tool.name === "pnpm");
  const compiler = tools.find((tool) => ["GCC", "Clang", "MSVC"].includes(tool.name) && tool.meetsMinimum);
  const cmake = tools.find((tool) => tool.name === "CMake");
  return {
    platform,
    architecture,
    tools,
    compilerReady: Boolean(compiler),
    cmakeReady: Boolean(cmake?.meetsMinimum),
    runtimeReady: Boolean(node?.meetsMinimum && pnpm?.meetsMinimum),
    msvc: {
      initialized: Boolean(msvcEnvironment),
      installationPath: msvcEnvironment?.installationPath,
      developerCommand: msvcEnvironment?.developerCommand,
      environment: msvcEnvironment?.env,
      error: msvcError?.message,
    },
  };
}
