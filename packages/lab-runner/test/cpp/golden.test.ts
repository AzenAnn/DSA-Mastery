import type { LoadedProgramLab, LoadedProjectLab, LoadedQuizLab } from "@dsa/lab-core";
import type { CliReport } from "@dsa/lab-testkit";
import { access, cp, mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { STANDALONE_CLI_FILENAME, runProcess } from "@dsa/lab-core";
import { judgeProgram, packStudent, verifyProgram, scoreProject, verifyProject } from "@dsa/lab-runner";
import { loadProgramLab, loadProjectLab, loadQuizLab, materializeLab } from "@dsa/lab-testkit";
import { beforeAll, expect, it, onTestFinished } from "vitest";

let quiz: LoadedQuizLab;
let program: LoadedProgramLab;
let project: LoadedProjectLab;
let programPackage: { packageRoot: string };
let projectPackage: { packageRoot: string };

async function assertNoForbiddenPackageFiles(root: string) {
  for (const entry of await readdir(root, { withFileTypes: true })) {
    const target = path.join(root, entry.name);
    expect(entry.name, `student pack leaked solution directory: ${target}`).not.toBe("solution");
    expect(/\.(?:exe|o|obj|a|so|dylib)$/i.test(entry.name), `student pack leaked build artifact: ${target}`).toBe(
      false,
    );
    if (entry.isDirectory()) await assertNoForbiddenPackageFiles(target);
  }
}

async function assertSchemaReferences(root: string) {
  for (const entry of await readdir(root, { withFileTypes: true })) {
    if ([".git", ".lab-cache", "node_modules"].includes(entry.name)) continue;
    const target = path.join(root, entry.name);
    if (entry.isDirectory()) {
      await assertSchemaReferences(target);
    } else if (["lab.json", "task.json"].includes(entry.name)) {
      const manifest = JSON.parse(await readFile(target, "utf8")) as { $schema: string };
      expect(typeof manifest.$schema, `${target} must declare a local schema`).toBe("string");
      const schemaPath = path.resolve(path.dirname(target), manifest.$schema);
      await access(schemaPath);
      const schema = JSON.parse(await readFile(schemaPath, "utf8")) as { $id: string };
      expect(schema.$id, `${target} points to the wrong schema`).toMatch(/\/schemas\/(?:lab|task)\.schema\.json$/);
    }
  }
}

async function runPackedCli(root: string, command: string, args: string[] = []): Promise<CliReport> {
  const execution = await runProcess(process.execPath, [STANDALONE_CLI_FILENAME, command, ".", ...args, "--json"], {
    cwd: root,
    timeMs: 180_000,
    outputKb: 8192,
  });
  expect(execution.code, `packed ${command} failed: ${execution.stderr || execution.stdout}`).toBe(0);
  return JSON.parse(execution.stdout) as CliReport;
}

beforeAll(async () => {
  // 判题会往 Lab 目录写 .lab-cache，必须先物化到临时目录，测试之间才能并行且不脏仓库。
  const [quizCopy, programCopy, projectCopy] = await Promise.all([
    materializeLab("labs/chapter-00/theory/T-00-02-complexity-quiz"),
    materializeLab("labs/chapter-01/exercise/E-01-01-sequential-list-deduplication"),
    materializeLab("labs/chapter-08/project/P-08-01-avl-tree-rotations"),
  ]);
  quiz = await loadQuizLab(quizCopy.root);
  program = await loadProgramLab(programCopy.root);
  project = await loadProjectLab(projectCopy.root);
  programPackage = await packStudent(program);
  projectPackage = await packStudent(project);
});

it("Golden Quiz question count and points stay stable", () => {
  expect(quiz.quizResult.count).toBe(19);
  expect(quiz.quizResult.totalPoints).toBe(20);
});

it("Golden Program keeps solution=100, starter<100, and a stable .out", async () => {
  expect((await verifyProgram(program)).ok).toBe(true);
});

it("Golden Project keeps a full automated reference and a non-full starter", async () => {
  expect((await verifyProject(project)).ok).toBe(true);
});

it("every Golden Lab manifest points at a local schema", async () => {
  await Promise.all([
    assertSchemaReferences(quiz.labRoot),
    assertSchemaReferences(program.labRoot),
    assertSchemaReferences(project.labRoot),
  ]);
});

it("packed Program hides the solution and grades the starter through its embedded runner", async () => {
  await assertNoForbiddenPackageFiles(programPackage.packageRoot);
  await assertSchemaReferences(programPackage.packageRoot);
  const packed = await judgeProgram(await loadProgramLab(programPackage.packageRoot));
  expect(packed.score, "packed Program starter must not get full score").toBeLessThan(packed.maxScore);
  await runPackedCli(programPackage.packageRoot, "validate");
  const report = await runPackedCli(programPackage.packageRoot, "run");
  expect(report.result.score, "embedded Program runner must execute the starter independently").toBeLessThan(
    report.result.maxScore!,
  );
});

it("a student package copied outside the repository does not need the root node_modules", async () => {
  const parent = await mkdtemp(path.join(os.tmpdir(), "dsa-mastery-student-pack-"));
  onTestFinished(() => rm(parent, { recursive: true, force: true }));
  const detached = path.join(parent, "program");
  await cp(programPackage.packageRoot, detached, { recursive: true });
  await runPackedCli(detached, "validate");
  const report = await runPackedCli(detached, "run");
  expect(report.result.score).toBeLessThan(report.result.maxScore!);
});

it("packed Project keeps a non-full automated score and its manual pending points", async () => {
  await assertNoForbiddenPackageFiles(projectPackage.packageRoot);
  await assertSchemaReferences(projectPackage.packageRoot);
  const packed = await scoreProject(await loadProjectLab(projectPackage.packageRoot));
  expect(packed.automatedFull, "packed Project starter must not get full automated score").toBe(false);
  await runPackedCli(projectPackage.packageRoot, "validate");
  const report = await runPackedCli(projectPackage.packageRoot, "run");
  expect(report.result.automatedFull, "embedded Project runner must execute the starter independently").toBe(false);
  expect(report.result.manualPending, "embedded Project runner must preserve manual pending points").toBe(20);
});
