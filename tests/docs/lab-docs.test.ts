import type { CompareConfig } from "@dsa/lab-core";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { compareOutput, loadLab, THIN_MAKEFILE } from "@dsa/lab-core";
import { REPO_ROOT } from "@dsa/lab-testkit";
import { expect, it, onTestFinished } from "vitest";
import { CI_CONTRACT } from "../support/ci-contract.ts";

const projectRoot = REPO_ROOT;
const read = (relative: string) => readFile(path.join(projectRoot, relative), "utf8");

const guide = await read("docs/LAB_AUTHORING_GUIDE.md");
const commandGuide = await read("docs/LAB_CLI_COMMAND_GUIDE.md");
const packageJson = JSON.parse(await read("package.json")) as { scripts: Record<string, string | undefined> };
const jsonBlocks = [...guide.matchAll(/```json[^\S\r\n]*\r?\n([\s\S]*?)\r?\n```/g)];

const commands = [
  "new",
  "locate",
  "doctor",
  "validate",
  "build",
  "run",
  "interactive",
  "score",
  "verify",
  "refresh-expected",
  "pack",
  "clean",
];
const makeTargetNames = [
  "help",
  "doctor",
  "validate",
  "build",
  "run",
  "interactive",
  "score",
  "verify",
  "refresh-expected",
  "pack",
  "clean",
];
const goldenLabs = [
  "labs/chapter-00/theory/T-00-02-complexity-quiz",
  "labs/chapter-01/exercise/E-01-01-sequential-list-deduplication",
  "labs/chapter-08/project/P-08-01-avl-tree-rotations",
];

type Example = Record<string, unknown> | unknown[];

interface GuideQuizManifest {
  quiz: { questions: string };
}
interface GuideProgramManifest {
  judge: { cases: string };
  targets: Record<string, { sources: string[]; includeDirs?: string[] }>;
}
interface GuideProjectManifest {
  tasks: { path: string; kind: string }[];
}
interface GuideCase {
  input: string;
  expected: string;
}

function parsedExamples(): Example[] {
  expect(jsonBlocks.length, "Lab 作者指南缺少三类 Lab 的完整 JSON 示例").toBeGreaterThanOrEqual(6);
  return jsonBlocks.map((match, index) => {
    try {
      return JSON.parse(match[1]) as Example;
    } catch (error) {
      throw new Error(`Lab 作者指南第 ${index + 1} 个 JSON 示例无效：${(error as Error).message}`);
    }
  });
}

function requireExample<T>(examples: Example[], predicate: (value: Example) => boolean, label: string): T {
  const example = examples.find(predicate);
  expect(example, `Lab 作者指南缺少可执行的 ${label} JSON 示例`).toBeDefined();
  return structuredClone(example) as T;
}

const hasType = (value: Example, type: string) => (value as { type?: string }).type === type;
function firstEntry(value: Example) {
  return Array.isArray(value) ? (value[0] as Record<string, unknown> | undefined) : undefined;
}

async function writeFixture(root: string, relative: string, content: unknown) {
  const file = path.join(root, relative);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, typeof content === "string" ? content : `${JSON.stringify(content, null, 2)}\n`, "utf8");
}

it("every Lab manifest example in the guide loads as a real Lab", async () => {
  const examples = parsedExamples();
  const quizManifest = requireExample<GuideQuizManifest>(examples, (value) => hasType(value, "quiz"), "Quiz manifest");
  const quizQuestions = requireExample<unknown[]>(
    examples,
    (value) => firstEntry(value)?.stem !== undefined && firstEntry(value)?.options !== undefined,
    "Quiz 题目",
  );
  const programManifest = requireExample<GuideProgramManifest>(
    examples,
    (value) => hasType(value, "program"),
    "Program manifest",
  );
  const cases = requireExample<GuideCase[]>(
    examples,
    (value) => firstEntry(value)?.input !== undefined && firstEntry(value)?.expected !== undefined,
    "Program cases",
  );
  const float = requireExample<CompareConfig>(
    examples,
    (value) => (value as { mode?: string }).mode === "float",
    "浮点比较器",
  );
  const projectManifest = requireExample<GuideProjectManifest>(
    examples,
    (value) => hasType(value, "project"),
    "Project manifest",
  );
  const manualTask = requireExample<Example>(
    examples,
    (value) => (value as { kind?: string }).kind === "manual",
    "manual task",
  );

  const fixtureRoot = await mkdtemp(path.join(os.tmpdir(), "dsa-lab-guide-"));
  onTestFinished(() => rm(fixtureRoot, { recursive: true, force: true }));

  const quizRoot = path.join(fixtureRoot, "quiz");
  await writeFixture(quizRoot, "README.md", "# Quiz\n\n<QuizSet />\n");
  await writeFixture(quizRoot, "lab.json", quizManifest);
  await writeFixture(quizRoot, quizManifest.quiz.questions, quizQuestions);
  await loadLab(quizRoot);

  const programRoot = path.join(fixtureRoot, "program");
  await writeFixture(programRoot, "README.md", "# Program\n");
  await writeFixture(programRoot, "Makefile", THIN_MAKEFILE);
  await writeFixture(programRoot, "lab.json", programManifest);
  await writeFixture(programRoot, programManifest.judge.cases, cases);
  for (const target of Object.values(programManifest.targets)) {
    for (const source of target.sources) await writeFixture(programRoot, source, "int main() { return 0; }\n");
    for (const includeDir of target.includeDirs ?? [])
      await mkdir(path.join(programRoot, includeDir), { recursive: true });
  }
  for (const testCase of cases) {
    await writeFixture(programRoot, testCase.input, "\n");
    await writeFixture(programRoot, testCase.expected, "\n");
  }
  await loadLab(programRoot);
  expect(
    compareOutput("value 1.0", "value 1.0000005", float).equal,
    "Lab 作者指南的 float 比较器示例不能通过声明的容差",
  ).toBe(true);

  const projectFixture = path.join(fixtureRoot, "project");
  await writeFixture(projectFixture, "README.md", "# Project\n");
  await writeFixture(projectFixture, "Makefile", THIN_MAKEFILE);
  await writeFixture(projectFixture, "lab.json", projectManifest);
  for (const task of projectManifest.tasks) {
    const taskRoot = path.join(projectFixture, task.path);
    if (task.kind === "stdio") {
      await writeFixture(taskRoot, "task.json", {
        schemaVersion: 1,
        kind: "stdio",
        targets: {
          student: { sources: ["student/main.cpp"] },
          solution: { sources: ["solution/main.cpp"] },
        },
        judge: { kind: "stdio", cases: "tests/cases.json", compare: { mode: "tokens" } },
      });
      await writeFixture(taskRoot, "student/main.cpp", "int main() { return 0; }\n");
      await writeFixture(taskRoot, "solution/main.cpp", "int main() { return 0; }\n");
      await writeFixture(taskRoot, "tests/cases.json", [
        { id: "sample", input: "tests/sample.in", expected: "tests/sample.out", points: 100 },
      ]);
      await writeFixture(taskRoot, "tests/sample.in", "\n");
      await writeFixture(taskRoot, "tests/sample.out", "\n");
    } else if (task.kind === "ctest") {
      await writeFixture(taskRoot, "task.json", {
        schemaVersion: 1,
        kind: "ctest",
        ctest: { tests: [{ name: "guide-smoke", points: 100 }] },
      });
    } else {
      await writeFixture(taskRoot, "task.json", manualTask);
    }
  }
  await loadLab(projectFixture);
});

it("the guide's thin Makefile template matches the scaffold", () => {
  const thinMatch = guide.match(
    /<!-- LAB_THIN_MAKEFILE:START -->\s*```makefile[^\S\r\n]*\r?\n([\s\S]*?)\r?\n```\s*<!-- LAB_THIN_MAKEFILE:END -->/,
  );
  expect(thinMatch, "Lab 作者指南缺少可校验的薄 Makefile 模板").not.toBeNull();
  expect(`${thinMatch![1].replace(/\r\n/g, "\n")}\n`, "Lab 作者指南中的薄 Makefile 已与脚手架模板漂移").toBe(
    THIN_MAKEFILE,
  );
});

it("both guides explain every CLI entry point, option and Make variable", async () => {
  expect(packageJson.scripts.lab, "package.json 缺少统一的 lab 入口").toBeDefined();
  for (const command of commands) {
    expect(commandGuide, `Lab 命令指南未解释命令：pnpm lab ${command}`).toContain(`pnpm lab ${command}`);
  }
  for (const option of [
    "--type",
    "--chapter",
    "--order",
    "--slug",
    "--target",
    "--case",
    "--task",
    "--json",
    "--no-color",
    "--write",
    "--profile",
  ]) {
    expect(commandGuide, `Lab 命令指南未解释参数：${option}`).toContain(option);
  }
  for (const variable of ["LAB", "CASE", "TASK", "TARGET", "JSON", "NO_COLOR", "WRITE"]) {
    expect(commandGuide, `Lab 命令指南未解释 Make 变量：${variable}`).toContain(`\`${variable}\``);
  }
});

it("CI 点名的 vitest project 都存在于根配置，且 deploy 仍等两个门禁", async () => {
  const workflow = await read(".github/workflows/pages.yml");
  const config = await import("../../vitest.config.ts");
  const projects = config.default.test!.projects as {
    test: { name: string; maxWorkers?: unknown; fileParallelism?: unknown };
  }[];
  const declared = projects.map((project) => project.test.name);
  for (const project of [...CI_CONTRACT.cppProjects, ...CI_CONTRACT.siteProjects]) {
    expect(declared, `根 vitest 配置缺少 CI 点名的 project：${project}`).toContain(project);
    expect(workflow, `CI 未运行 project：${project}`).toContain(`--project ${project}`);
  }
  // 单组并行的前提：没有任何 project 自己设 maxWorkers 或 fileParallelism。
  for (const project of projects) {
    expect(project.test.maxWorkers, `${project.test.name} 不应单独设置 maxWorkers`).toBeUndefined();
    expect(project.test.fileParallelism, `${project.test.name} 不应设置 fileParallelism`).toBeUndefined();
  }
  expect(workflow, "Pages deploy 必须同时等待网站与 C++ Lab 门禁").toMatch(
    /deploy:[\s\S]*?needs:\s*\[build,\s*lab-cpp\]/,
  );
});

it("every PowerShell command in the guides resolves to a real script, Make target or Golden Lab", async () => {
  const makeTargets = new Set([...THIN_MAKEFILE.matchAll(/^([a-z][a-z-]*):/gm)].map((match) => match[1]));
  for (const match of (await read("packages/lab-cli/lab.mk")).matchAll(/^([a-z][a-z-]*):/gm)) makeTargets.add(match[1]);
  for (const target of makeTargetNames) {
    expect(makeTargets, `共享 Make 入口缺少 target：${target}`).toContain(target);
    expect(commandGuide, `Lab 命令指南未解释 Make target：${target}`).toContain(`\`${target}\``);
  }

  const commandLines = [guide, commandGuide]
    .flatMap((source) => [...source.matchAll(/```powershell[^\r\n]*\r?\n([\s\S]*?)\r?\n```/g)])
    .flatMap((match) => match[1].split(/\r?\n/))
    .map((line) => line.trim())
    .filter((line) => line !== "" && !line.startsWith("#"));
  expect(commandLines.length).toBeGreaterThan(0);
  for (const line of commandLines) {
    const pnpm = line.match(/^pnpm(?:\s+run)?\s+([a-z0-9:-]+)/i);
    if (pnpm) expect(packageJson.scripts[pnpm[1]], `作者指南命令没有 package script：${line}`).toBeDefined();
    const labCommand = line.match(/^pnpm\s+lab\s+([a-z-]+)/i);
    if (labCommand) expect(commands, `作者指南使用了不存在的 lab 子命令：${line}`).toContain(labCommand[1]);
    const make = line.match(/^make\s+([a-z][a-z-]*)/i);
    if (make) expect(makeTargets, `作者指南命令没有 Make target：${line}`).toContain(make[1]);
    const cd = line.match(/^cd\s+(\S+)$/i);
    if (cd) await readFile(path.join(path.resolve(projectRoot, cd[1]), "lab.json"), "utf8");
  }
});

it("the guide references every Golden Lab and each one still loads", async () => {
  for (const relative of goldenLabs) {
    expect(guide, `Lab 作者指南未引用 Golden Lab：${relative}`).toContain(relative);
    await loadLab(path.join(projectRoot, relative));
  }
});

it("repository and course entry points all link back to the Lab guides", async () => {
  for (const relative of [
    "README.md",
    "CONTRIBUTING.md",
    "docs/UPDATE_WORKFLOW.md",
    ".trellis/spec/content/index.md",
  ]) {
    expect(await read(relative), `${relative} 缺少 Lab 作者指南入口`).toContain("LAB_AUTHORING_GUIDE.md");
  }
  expect(
    await read("content/chapter-preface/01-lab-authoring-guide.md"),
    "前言章节的 Lab 作者指南页面没有复用 docs/LAB_AUTHORING_GUIDE.md",
  ).toContain("../../docs/LAB_AUTHORING_GUIDE.md");
  expect(
    await read("content/chapter-preface/03-lab-cli-command-guide.md"),
    "前言章节的 Lab 命令指南页面没有复用 docs/LAB_CLI_COMMAND_GUIDE.md",
  ).toContain("../../docs/LAB_CLI_COMMAND_GUIDE.md");
  expect(
    await read("content/chapter-preface/00-theory-environments.md"),
    "理论环境展示页缺少站内 Lab 更新与测试指南入口",
  ).toContain("./01-lab-authoring-guide.md");
});
