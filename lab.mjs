#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import path from "node:path";
import process from "node:process";

const EXIT_OK = 0;
const EXIT_TOOL_ERROR = 2;
const projectRoot = import.meta.dirname;
const labCli = path.join(projectRoot, "tools", "lab", "cli.mjs");

/** 将普通提示写入标准输出，并统一补充换行。 */
function print(message) {
  process.stdout.write(`${message}\n`);
}

/** 将错误或用法提示写入标准错误，并统一补充换行。 */
function printError(message) {
  process.stderr.write(`${message}\n`);
}

/** 显示脚本支持的三参数调用格式和一个最小示例。 */
function printUsage() {
  printError("用法：node lab.mjs <chapter> <T|E|P> <number>");
  printError("示例：node lab.mjs 1 E 2");
}

/** 校验三个位置参数，并将它们组合成底层 CLI 可识别的 Lab 简写 ID。 */
function parseArguments(argv) {
  if (argv.length !== 3) {
    printUsage();
    return undefined;
  }

  const [chapter, rawType, number] = argv;
  const type = rawType.toUpperCase();
  if (!["T", "E", "P"].includes(type)) {
    printError(`题目类型必须是 T、E 或 P，当前输入：${rawType}`);
    printUsage();
    return undefined;
  }

  return { type, labId: `${chapter}${type}${number}` };
}

/** 复用现有 locate 子命令，将简写 ID 解析为规范 ID、类型和题目相对路径。 */
function locateLab(labId) {
  const result = spawnSync(
    process.execPath,
    [labCli, "locate", labId, "--json", "--no-color"],
    {
      cwd: projectRoot,
      encoding: "utf8",
      shell: false,
    },
  );

  if (result.error) {
    printError(`无法启动 Lab 定位命令：${result.error.message}`);
    return undefined;
  }

  let report;
  try {
    report = JSON.parse(result.stdout);
  } catch {
    const detail = (result.stderr || result.stdout).trim();
    printError("Lab 定位命令没有返回可解析的 JSON。");
    if (detail) printError(detail);
    return undefined;
  }

  if (result.status !== EXIT_OK || report.error) {
    if (report.error) {
      printError(`${report.error.code}: ${report.error.message}`);
    } else {
      printError(`Lab 定位失败，退出码：${result.status ?? EXIT_TOOL_ERROR}`);
    }
    return undefined;
  }

  if (!report.lab?.id || !report.lab?.relativePath) {
    printError("Lab 定位报告缺少 id 或 relativePath。");
    return undefined;
  }

  return report.lab;
}

/** 检查 Windows 是否未指定其他生成器，并且当前环境中存在可用的 MinGW g++。 */
function canUseMinGW() {
  if (process.platform !== "win32" || process.env.CMAKE_GENERATOR) return false;
  if (process.env.CXX && !/g\+\+|mingw|gcc/i.test(process.env.CXX)) return false;
  const probe = spawnSync("g++", ["--version"], {
    cwd: projectRoot,
    encoding: "utf8",
    shell: false,
    windowsHide: true,
  });
  return !probe.error && probe.status === EXIT_OK;
}

/** 复用 clean 子命令清除指定 Lab 的旧构建缓存，供 Project 切换 CMake 生成器。 */
function cleanLabCache(relativePath) {
  const result = spawnSync(process.execPath, [labCli, "clean", relativePath, "--no-color"], {
    cwd: projectRoot,
    encoding: "utf8",
    shell: false,
    stdio: "ignore",
  });
  return !result.error && result.status === EXIT_OK;
}

/** 复用 run 子命令执行评测；Windows Project 可用时自动配置 MinGW 环境。 */
function runLab(lab) {
  const useMinGW = lab.type === "project" && canUseMinGW();
  if (useMinGW && !cleanLabCache(lab.relativePath)) {
    printError("无法清理 Project 的旧 CMake 构建缓存。");
    return EXIT_TOOL_ERROR;
  }

  const environment = { ...process.env };
  if (useMinGW) {
    environment.CMAKE_GENERATOR = "MinGW Makefiles";
    environment.CXX ??= "g++";
  }

  const result = spawnSync(process.execPath, [labCli, "run", lab.relativePath], {
    cwd: projectRoot,
    shell: false,
    env: environment,
    stdio: "inherit",
  });

  if (result.error) {
    printError(`无法启动 Lab 评测命令：${result.error.message}`);
    return EXIT_TOOL_ERROR;
  }

  if (result.status === null) {
    printError("Lab 评测进程未正常结束。");
    return EXIT_TOOL_ERROR;
  }

  return result.status;
}

/** 串联参数解析、题目定位和题型分流：T 给出指引，E/P 启动现有评测。 */
function main() {
  const parsed = parseArguments(process.argv.slice(2));
  if (!parsed) return EXIT_TOOL_ERROR;

  const lab = locateLab(parsed.labId);
  if (!lab) return EXIT_TOOL_ERROR;

  if (parsed.type === "T") {
    print(`已找到 ${lab.id}。`);
    print("Theory Quiz 不支持终端评测，请在课程网站或 VS Code 插件中作答。");
    print(`题目目录：${lab.relativePath}`);
    return EXIT_OK;
  }

  return runLab(lab);
}

process.exitCode = main();
