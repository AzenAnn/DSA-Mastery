import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { LabError } from "./errors.mjs";
import { pathExists } from "./core.mjs";

const projectRoot = path.resolve(import.meta.dirname, "../..");

function pad(value) {
  return String(value).padStart(2, "0");
}

function json(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function readme({ chapter, order, slug, type }) {
  const code = `${pad(chapter)}-${pad(order)}`;
  const names = { quiz: "选择题自测", program: "编程练习", project: "综合项目" };
  return `---
title: "Lab ${code}：${names[type]}"
description: "请在发布前把这里替换为可检查的 Lab 学习成果。"
order: ${order}
chapter: ${chapter}
chapterTitle: "请填写章节标题"
updated: "${new Date().toISOString().slice(0, 10)}"
contributors: ["DSA Mastery Team"]
status: "draft"
lab: true
difficulty: "基础"
duration: "45～60 分钟"
---

# Lab ${code}：${names[type]}

## 学习目标

- [ ] 请填写一个可以检查的学习目标。

## 前置知识与环境

请说明所需知识与环境。可执行 Lab 先运行 \`make doctor\`；未安装 Make 时使用 pnpm 兜底命令。

${type === "quiz" ? "## 选择题\n\n<QuizSet />" : "## 任务\n\n请补充输入、输出、约束、正常/边界/错误情况。\n\n## 运行\n\n```powershell\nmake run\n# 免 Make 兜底：在仓库根执行\npnpm lab:run -- labs/chapter-" + pad(chapter) + "/lab-" + code + "-" + slug + "\n```"}

## 完成清单

- [ ] 正常、边界和错误情况都有可复现证据。
- [ ] README 命令已从干净检出验证。

## 思考与复盘

记录一种错误方案、失败原因和改进方式。
`;
}

const starter = `#include <iostream>

int main() {
    // TODO: 读取输入并完成任务。学生骨架应可编译，但不能直接得到满分。
    return 0;
}
`;

const solution = `#include <iostream>

int main() {
    // TODO(author): 把占位行为替换为经过审阅的参考实现，并重新生成标准输出。
    std::cout << 0 << '\\n';
    return 0;
}
`;

const thinMakefile = `LAB_DIR := $(CURDIR)
REPO_ROOT := $(LAB_DIR)/../../..
include ../../../tools/lab/lab.mk
`;

async function write(root, relative, content) {
  const file = path.join(root, relative);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, content, { encoding: "utf8", flag: "wx" });
}

export async function createLab(options, root = projectRoot) {
  const type = options.type;
  const chapter = Number(options.chapter);
  const order = Number(options.order);
  const slug = options.slug;
  if (!new Set(["quiz", "program", "project"]).has(type)) throw new LabError("ARGUMENT_INVALID", "--type 必须是 quiz、program 或 project");
  if (!Number.isInteger(chapter) || chapter < 0 || chapter > 99) throw new LabError("ARGUMENT_INVALID", "--chapter 必须是 0～99 的整数");
  if (!Number.isInteger(order) || order < 0 || order > 99) throw new LabError("ARGUMENT_INVALID", "--order 必须是 0～99 的整数");
  if (typeof slug !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new LabError("ARGUMENT_INVALID", "--slug 必须是小写 kebab-case");
  const relativeRoot = `labs/chapter-${pad(chapter)}/lab-${pad(chapter)}-${pad(order)}-${slug}`;
  const labRoot = path.join(root, relativeRoot);
  if (await pathExists(labRoot)) throw new LabError("TARGET_EXISTS", `目标 Lab 已存在：${relativeRoot}`);
  await mkdir(path.dirname(labRoot), { recursive: true });
  await mkdir(labRoot, { recursive: false });
  await write(root, `${relativeRoot}/README.md`, readme({ chapter, order, slug, type }));
  if (type === "quiz") {
    await write(root, `${relativeRoot}/lab.json`, json({ $schema: "../../../schemas/lab.schema.json", schemaVersion: 1, type, quiz: { questions: "quiz.json", questionType: "single-choice", reveal: "after-submit", scoring: "points" } }));
    await write(root, `${relativeRoot}/quiz.json`, json([{ id: "q1", stem: "请替换为题面。", options: ["选项一", "选项二", "选项三", "选项四"], answer: 0, explanation: "请补充解析。", hint: "可选提示。", points: 1 }]));
  } else if (type === "program") {
    await write(root, `${relativeRoot}/lab.json`, json({ $schema: "../../../schemas/lab.schema.json", schemaVersion: 1, type, language: "cpp", toolchain: { standard: "c++17", profile: "course-default" }, targets: { student: { sources: ["student/main.cpp"] }, solution: { sources: ["solution/main.cpp"] } }, judge: { kind: "stdio", cases: "tests/cases.json", compare: { mode: "tokens" }, limits: { timeMs: 2000, outputKb: 1024 } } }));
    await write(root, `${relativeRoot}/Makefile`, thinMakefile);
    await write(root, `${relativeRoot}/student/main.cpp`, starter);
    await write(root, `${relativeRoot}/solution/main.cpp`, solution);
    await write(root, `${relativeRoot}/tests/cases.json`, json([{ id: "sample", input: "tests/001-sample.in", expected: "tests/001-sample.out", points: 100, tags: ["sample"] }]));
    await write(root, `${relativeRoot}/tests/001-sample.in`, "\n");
    await write(root, `${relativeRoot}/tests/001-sample.out`, "0\n");
  } else {
    await write(root, `${relativeRoot}/lab.json`, json({ $schema: "../../../schemas/lab.schema.json", schemaVersion: 1, type, language: "cpp", toolchain: { standard: "c++17", profile: "course-default" }, buildSystem: "cmake", tasks: [{ id: "implementation", path: "tasks/task-01-implementation", weight: 80, kind: "ctest", dependsOn: [] }, { id: "report", path: "report", weight: 20, kind: "manual", dependsOn: ["implementation"] }] }));
    await write(root, `${relativeRoot}/Makefile`, thinMakefile);
    await write(root, `${relativeRoot}/CMakeLists.txt`, "cmake_minimum_required(VERSION 3.25)\nproject(dsa_lab LANGUAGES CXX)\nif(NOT DEFINED CMAKE_CXX_STANDARD)\n  set(CMAKE_CXX_STANDARD 17)\nendif()\nset(CMAKE_CXX_STANDARD_REQUIRED ON)\nset(CMAKE_CXX_EXTENSIONS OFF)\noption(LAB_USE_SOLUTION \"Build reference implementation\" OFF)\nif(MSVC)\n  add_compile_options(/W4 /permissive-)\nelse()\n  add_compile_options(-Wall -Wextra -Wpedantic)\nendif()\nenable_testing()\nadd_subdirectory(tasks/task-01-implementation)\n");
    await write(root, `${relativeRoot}/CMakePresets.json`, json({ version: 6, configurePresets: [{ name: "student", binaryDir: "${sourceDir}/.lab-cache/cmake/student", cacheVariables: { CMAKE_CXX_STANDARD: "17", CMAKE_CXX_STANDARD_REQUIRED: "ON", LAB_USE_SOLUTION: "OFF" } }, { name: "solution", binaryDir: "${sourceDir}/.lab-cache/cmake/solution", cacheVariables: { CMAKE_CXX_STANDARD: "17", CMAKE_CXX_STANDARD_REQUIRED: "ON", LAB_USE_SOLUTION: "ON" } }], buildPresets: [{ name: "student", configurePreset: "student" }, { name: "solution", configurePreset: "solution" }], testPresets: [{ name: "student", configurePreset: "student", output: { outputOnFailure: true } }, { name: "solution", configurePreset: "solution", output: { outputOnFailure: true } }] }));
    await write(root, `${relativeRoot}/tasks/task-01-implementation/task.json`, json({ $schema: "../../../../../schemas/task.schema.json", schemaVersion: 1, kind: "ctest", ctest: { tests: [{ name: "implementation-smoke", points: 100 }] } }));
    await write(root, `${relativeRoot}/tasks/task-01-implementation/CMakeLists.txt`, "set(IMPLEMENTATION_SOURCE student/main.cpp)\nif(LAB_USE_SOLUTION)\n  set(IMPLEMENTATION_SOURCE solution/main.cpp)\nendif()\nadd_executable(implementation ${IMPLEMENTATION_SOURCE})\nadd_test(NAME implementation-smoke COMMAND implementation)\n");
    await write(root, `${relativeRoot}/tasks/task-01-implementation/student/main.cpp`, "int main() { return 1; }\n");
    await write(root, `${relativeRoot}/tasks/task-01-implementation/solution/main.cpp`, "int main() { return 0; }\n");
    await write(root, `${relativeRoot}/tasks/task-01-implementation/README.md`, "# Task 01：Implementation\n\n请补充接口、验收标准和边界情况。\n");
    await write(root, `${relativeRoot}/report/task.json`, json({ $schema: "../../../../schemas/task.schema.json", schemaVersion: 1, kind: "manual", checklist: ["说明设计、测试证据与复盘"] }));
    await write(root, `${relativeRoot}/report/README.md`, "# 人工评分报告\n\n请补充复杂度、测试证据与复盘。\n");
  }
  return { labRoot, relativeRoot, type };
}

export const THIN_MAKEFILE = thinMakefile;
