import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { expect, it, onTestFinished } from "vitest";
import { compareOutput } from "../tools/lab/compare.mjs";
import { loadLab } from "../tools/lab/core.mjs";
import { THIN_MAKEFILE } from "../tools/lab/scaffold.mjs";

const projectRoot = path.resolve(import.meta.dirname, "..");
const read = (relative) => readFile(path.join(projectRoot, relative), "utf8");

const guide = await read("docs/LAB_AUTHORING_GUIDE.md");
const commandGuide = await read("docs/LAB_CLI_COMMAND_GUIDE.md");
const packageJson = JSON.parse(await read("package.json"));
const jsonBlocks = [...guide.matchAll(/```json\s*\r?\n([\s\S]*?)\r?\n```/g)];

const commands = [
  "lab:new",
  "lab:locate",
  "lab:doctor",
  "lab:validate",
  "lab:build",
  "lab:run",
  "lab:interactive",
  "lab:score",
  "lab:verify",
  "lab:refresh-expected",
  "lab:pack",
  "lab:clean",
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

function parsedExamples() {
  expect(jsonBlocks.length, "Lab 作者指南缺少三类 Lab 的完整 JSON 示例").toBeGreaterThanOrEqual(6);
  return jsonBlocks.map((match, index) => {
    try {
      return JSON.parse(match[1]);
    } catch (error) {
      throw new Error(`Lab 作者指南第 ${index + 1} 个 JSON 示例无效：${error.message}`);
    }
  });
}

function requireExample(examples, predicate, label) {
  const example = examples.find(predicate);
  expect(example, `Lab 作者指南缺少可执行的 ${label} JSON 示例`).toBeDefined();
  return structuredClone(example);
}

async function writeFixture(root, relative, content) {
  const file = path.join(root, relative);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, typeof content === "string" ? content : `${JSON.stringify(content, null, 2)}\n`, "utf8");
}

it("every Lab manifest example in the guide loads as a real Lab", async () => {
  const examples = parsedExamples();
  const quizManifest = requireExample(examples, (value) => value?.type === "quiz", "Quiz manifest");
  const quizQuestions = requireExample(
    examples,
    (value) => Array.isArray(value) && value[0]?.stem && value[0]?.options,
    "Quiz 题目",
  );
  const programManifest = requireExample(examples, (value) => value?.type === "program", "Program manifest");
  const cases = requireExample(
    examples,
    (value) => Array.isArray(value) && value[0]?.input && value[0]?.expected,
    "Program cases",
  );
  const float = requireExample(examples, (value) => value?.mode === "float", "浮点比较器");
  const projectManifest = requireExample(examples, (value) => value?.type === "project", "Project manifest");
  const manualTask = requireExample(examples, (value) => value?.kind === "manual", "manual task");

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
    /<!-- LAB_THIN_MAKEFILE:START -->\s*```makefile\s*\r?\n([\s\S]*?)\r?\n```\s*<!-- LAB_THIN_MAKEFILE:END -->/,
  );
  expect(thinMatch, "Lab 作者指南缺少可校验的薄 Makefile 模板").not.toBeNull();
  expect(`${thinMatch[1].replace(/\r\n/g, "\n")}\n`, "Lab 作者指南中的薄 Makefile 已与脚手架模板漂移").toBe(
    THIN_MAKEFILE,
  );
});

it("both guides explain every CLI entry point, option and Make variable", async () => {
  for (const command of commands) {
    expect(packageJson.scripts[command], `package.json 缺少作者指南声明的命令：${command}`).toBeDefined();
    expect(guide, `Lab 作者指南未解释命令：${command}`).toContain(command);
    expect(commandGuide, `Lab 命令指南未解释命令：${command}`).toContain(command);
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

it("the C++ gate keeps the Golden Lab commands the guide depends on", async () => {
  expect(packageJson.scripts["test:lab-golden"], "package.json 缺少 Golden Lab 集成检查").toBeDefined();
  expect(packageJson.scripts["test:lab-make"], "package.json 缺少 Make/CLI 一致性检查").toBeDefined();
  const workflow = await read(".github/workflows/pages.yml");
  expect(workflow, "C++ CI 未执行作者指南依赖的 Golden Lab 命令示例").toContain("pnpm run test:lab-golden");
  expect(workflow, "Pages deploy 必须同时等待网站与 C++ Lab 门禁").toMatch(
    /deploy:[\s\S]*?needs:\s*\[build,\s*lab-cpp\]/,
  );
});

it("every PowerShell command in the guides resolves to a real script, Make target or Golden Lab", async () => {
  const makeTargets = new Set([...THIN_MAKEFILE.matchAll(/^([a-z][a-z-]*):/gm)].map((match) => match[1]));
  for (const match of (await read("tools/lab/lab.mk")).matchAll(/^([a-z][a-z-]*):/gm)) makeTargets.add(match[1]);
  for (const target of makeTargetNames) {
    expect(makeTargets, `共享 Make 入口缺少 target：${target}`).toContain(target);
    expect(commandGuide, `Lab 命令指南未解释 Make target：${target}`).toContain(`\`${target}\``);
  }

  const commandLines = [guide, commandGuide]
    .flatMap((source) => [...source.matchAll(/```powershell(?:[^\r\n]*)\s*\r?\n([\s\S]*?)\r?\n```/g)])
    .flatMap((match) => match[1].split(/\r?\n/))
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));
  expect(commandLines.length).toBeGreaterThan(0);
  for (const line of commandLines) {
    const pnpm = line.match(/^pnpm(?:\s+run)?\s+([a-z0-9:-]+)/i);
    if (pnpm) expect(packageJson.scripts[pnpm[1]], `作者指南命令没有 package script：${line}`).toBeDefined();
    const make = line.match(/^make\s+([a-z][a-z-]*)/i);
    if (make) expect(makeTargets, `作者指南命令没有 Make target：${line}`).toContain(make[1]);
    const cd = line.match(/^cd\s+([^\s]+)$/i);
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
