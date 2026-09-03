import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { compareOutput } from "../tools/lab/compare.mjs";
import { loadLab } from "../tools/lab/core.mjs";
import { THIN_MAKEFILE } from "../tools/lab/scaffold.mjs";

const projectRoot = path.resolve(import.meta.dirname, "..");
const guidePath = path.join(projectRoot, "docs", "LAB_AUTHORING_GUIDE.md");
const guide = await readFile(guidePath, "utf8");
const commandGuidePath = path.join(projectRoot, "docs", "LAB_CLI_COMMAND_GUIDE.md");
const commandGuide = await readFile(commandGuidePath, "utf8");

const jsonBlocks = [...guide.matchAll(/```json\s*\r?\n([\s\S]*?)\r?\n```/g)];
if (jsonBlocks.length < 6) throw new Error("Lab 作者指南缺少三类 Lab 的完整 JSON 示例");
const parsedJsonBlocks = jsonBlocks.map((match, index) => {
  try {
    return JSON.parse(match[1]);
  } catch (error) {
    throw new Error(`Lab 作者指南第 ${index + 1} 个 JSON 示例无效：${error.message}`);
  }
});

function requireExample(predicate, label) {
  const example = parsedJsonBlocks.find(predicate);
  if (example === undefined) throw new Error(`Lab 作者指南缺少可执行的 ${label} JSON 示例`);
  return structuredClone(example);
}

async function writeFixture(root, relative, content) {
  const file = path.join(root, relative);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, typeof content === "string" ? content : `${JSON.stringify(content, null, 2)}\n`, "utf8");
}

const quizManifestExample = requireExample((value) => value?.type === "quiz", "Quiz manifest");
const quizQuestionsExample = requireExample((value) => Array.isArray(value) && value[0]?.stem && value[0]?.options, "Quiz 题目");
const programManifestExample = requireExample((value) => value?.type === "program", "Program manifest");
const casesExample = requireExample((value) => Array.isArray(value) && value[0]?.input && value[0]?.expected, "Program cases");
const floatExample = requireExample((value) => value?.mode === "float", "浮点比较器");
const projectManifestExample = requireExample((value) => value?.type === "project", "Project manifest");
const manualTaskExample = requireExample((value) => value?.kind === "manual", "manual task");

const fixtureRoot = await mkdtemp(path.join(os.tmpdir(), "dsa-lab-guide-"));
try {
  const quizRoot = path.join(fixtureRoot, "quiz");
  await writeFixture(quizRoot, "README.md", "# Quiz\n\n<QuizSet />\n");
  await writeFixture(quizRoot, "lab.json", quizManifestExample);
  await writeFixture(quizRoot, quizManifestExample.quiz.questions, quizQuestionsExample);
  await loadLab(quizRoot);

  const programRoot = path.join(fixtureRoot, "program");
  await writeFixture(programRoot, "README.md", "# Program\n");
  await writeFixture(programRoot, "Makefile", THIN_MAKEFILE);
  await writeFixture(programRoot, "lab.json", programManifestExample);
  await writeFixture(programRoot, programManifestExample.judge.cases, casesExample);
  for (const target of Object.values(programManifestExample.targets)) {
    for (const source of target.sources) await writeFixture(programRoot, source, "int main() { return 0; }\n");
    for (const includeDir of target.includeDirs ?? []) await mkdir(path.join(programRoot, includeDir), { recursive: true });
  }
  for (const testCase of casesExample) {
    await writeFixture(programRoot, testCase.input, "\n");
    await writeFixture(programRoot, testCase.expected, "\n");
  }
  await loadLab(programRoot);
  if (!compareOutput("value 1.0", "value 1.0000005", floatExample).equal) {
    throw new Error("Lab 作者指南的 float 比较器示例不能通过声明的容差");
  }

  const projectRootFixture = path.join(fixtureRoot, "project");
  await writeFixture(projectRootFixture, "README.md", "# Project\n");
  await writeFixture(projectRootFixture, "Makefile", THIN_MAKEFILE);
  await writeFixture(projectRootFixture, "lab.json", projectManifestExample);
  for (const task of projectManifestExample.tasks) {
    const taskRoot = path.join(projectRootFixture, task.path);
    if (task.kind === "stdio") {
      const config = {
        schemaVersion: 1,
        kind: "stdio",
        targets: {
          student: { sources: ["student/main.cpp"] },
          solution: { sources: ["solution/main.cpp"] },
        },
        judge: { kind: "stdio", cases: "tests/cases.json", compare: { mode: "tokens" } },
      };
      await writeFixture(taskRoot, "task.json", config);
      await writeFixture(taskRoot, "student/main.cpp", "int main() { return 0; }\n");
      await writeFixture(taskRoot, "solution/main.cpp", "int main() { return 0; }\n");
      await writeFixture(taskRoot, "tests/cases.json", [{ id: "sample", input: "tests/sample.in", expected: "tests/sample.out", points: 100 }]);
      await writeFixture(taskRoot, "tests/sample.in", "\n");
      await writeFixture(taskRoot, "tests/sample.out", "\n");
    } else if (task.kind === "ctest") {
      await writeFixture(taskRoot, "task.json", { schemaVersion: 1, kind: "ctest", ctest: { tests: [{ name: "guide-smoke", points: 100 }] } });
    } else {
      await writeFixture(taskRoot, "task.json", manualTaskExample);
    }
  }
  await loadLab(projectRootFixture);
} finally {
  await rm(fixtureRoot, { recursive: true, force: true });
}

const thinMatch = guide.match(/<!-- LAB_THIN_MAKEFILE:START -->\s*```makefile\s*\r?\n([\s\S]*?)\r?\n```\s*<!-- LAB_THIN_MAKEFILE:END -->/);
if (!thinMatch) throw new Error("Lab 作者指南缺少可校验的薄 Makefile 模板");
if (`${thinMatch[1].replace(/\r\n/g, "\n")}\n` !== THIN_MAKEFILE) {
  throw new Error("Lab 作者指南中的薄 Makefile 已与脚手架模板漂移");
}

const packageJson = JSON.parse(await readFile(path.join(projectRoot, "package.json"), "utf8"));
const commands = ["lab:new", "lab:doctor", "lab:validate", "lab:build", "lab:run", "lab:interactive", "lab:score", "lab:verify", "lab:refresh-expected", "lab:pack", "lab:clean"];
for (const command of commands) {
  if (!packageJson.scripts[command]) throw new Error(`package.json 缺少作者指南声明的命令：${command}`);
  if (!guide.includes(command)) throw new Error(`Lab 作者指南未解释命令：${command}`);
  if (!commandGuide.includes(command)) throw new Error(`Lab 命令指南未解释命令：${command}`);
}
for (const option of ["--type", "--chapter", "--order", "--slug", "--target", "--case", "--task", "--json", "--no-color", "--write", "--profile"]) {
  if (!commandGuide.includes(option)) throw new Error(`Lab 命令指南未解释参数：${option}`);
}
if (!packageJson.scripts["test:lab-golden"]) throw new Error("package.json 缺少 Golden Lab 集成检查");
if (!packageJson.scripts["test:lab-make"]) throw new Error("package.json 缺少 Make/CLI 一致性检查");
const workflow = await readFile(path.join(projectRoot, ".github", "workflows", "pages.yml"), "utf8");
if (!workflow.includes("pnpm run test:lab-golden")) throw new Error("C++ CI 未执行作者指南依赖的 Golden Lab 命令示例");
if (!/deploy:[\s\S]*?needs:\s*\[build,\s*lab-cpp\]/.test(workflow)) throw new Error("Pages deploy 必须同时等待网站与 C++ Lab 门禁");

const powershellBlocks = [guide, commandGuide].flatMap((source) => [...source.matchAll(/```powershell(?:[^\r\n]*)\s*\r?\n([\s\S]*?)\r?\n```/g)]);
const commandLines = powershellBlocks.flatMap((match) => match[1].split(/\r?\n/))
  .map((line) => line.trim())
  .filter((line) => line && !line.startsWith("#"));
const makeTargets = new Set([...THIN_MAKEFILE.matchAll(/^([a-z][a-z-]*):/gm)].map((match) => match[1]));
const sharedMake = await readFile(path.join(projectRoot, "tools", "lab", "lab.mk"), "utf8");
for (const match of sharedMake.matchAll(/^([a-z][a-z-]*):/gm)) makeTargets.add(match[1]);
for (const line of commandLines) {
  const pnpm = line.match(/^pnpm(?:\s+run)?\s+([a-z0-9:-]+)/i);
  if (pnpm && !packageJson.scripts[pnpm[1]]) throw new Error(`作者指南命令没有 package script：${line}`);
  const make = line.match(/^make\s+([a-z][a-z-]*)/i);
  if (make && !makeTargets.has(make[1])) throw new Error(`作者指南命令没有 Make target：${line}`);
  const cd = line.match(/^cd\s+([^\s]+)$/i);
  if (cd) {
    const target = path.resolve(projectRoot, cd[1]);
    try {
      await readFile(path.join(target, "lab.json"), "utf8");
    } catch {
      throw new Error(`作者指南 cd 目标不是现有 Golden Lab：${line}`);
    }
  }
}
for (const target of ["help", "doctor", "validate", "build", "run", "interactive", "score", "verify", "refresh-expected", "pack", "clean"]) {
  if (!makeTargets.has(target)) throw new Error(`共享 Make 入口缺少 target：${target}`);
  if (!commandGuide.includes(`\`${target}\``)) throw new Error(`Lab 命令指南未解释 Make target：${target}`);
}
for (const variable of ["LAB", "CASE", "TASK", "TARGET", "JSON", "NO_COLOR", "WRITE"]) {
  if (!commandGuide.includes(`\`${variable}\``)) throw new Error(`Lab 命令指南未解释 Make 变量：${variable}`);
}

const goldenLabs = [
  "labs/chapter-00/lab-00-03-complexity-quiz",
  "labs/chapter-01/lab-01-06-sequential-list-deduplication",
  "labs/chapter-08/lab-08-05-avl-tree-rotations",
];
for (const relative of goldenLabs) {
  if (!guide.includes(relative)) throw new Error(`Lab 作者指南未引用 Golden Lab：${relative}`);
  await loadLab(path.join(projectRoot, relative));
}

for (const relative of [
  "README.md",
  "CONTRIBUTING.md",
  "docs/UPDATE_WORKFLOW.md",
  ".trellis/spec/content/index.md",
]) {
  const source = await readFile(path.join(projectRoot, relative), "utf8");
  if (!source.includes("LAB_AUTHORING_GUIDE.md")) throw new Error(`${relative} 缺少 Lab 作者指南入口`);
}

const courseGuide = await readFile(path.join(projectRoot, "content/chapter-preface/01-lab-authoring-guide.md"), "utf8");
if (!courseGuide.includes("../../docs/LAB_AUTHORING_GUIDE.md")) {
  throw new Error("前言章节的 Lab 作者指南页面没有复用 docs/LAB_AUTHORING_GUIDE.md");
}
const courseCommandGuide = await readFile(path.join(projectRoot, "content/chapter-preface/03-lab-cli-command-guide.md"), "utf8");
if (!courseCommandGuide.includes("../../docs/LAB_CLI_COMMAND_GUIDE.md")) {
  throw new Error("前言章节的 Lab 命令指南页面没有复用 docs/LAB_CLI_COMMAND_GUIDE.md");
}
const prefaceShowcase = await readFile(path.join(projectRoot, "content/chapter-preface/00-theory-environments.md"), "utf8");
if (!prefaceShowcase.includes("./01-lab-authoring-guide.md")) {
  throw new Error("理论环境展示页缺少站内 Lab 更新与测试指南入口");
}

console.log(`Lab 文档检查通过：${jsonBlocks.length} 个语义化 JSON 示例、${commandLines.length} 条命令、${goldenLabs.length} 个 Golden Lab、${commands.length} 个 CLI 入口及完整 pnpm/Make 指南。`);
