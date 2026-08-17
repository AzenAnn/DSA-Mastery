import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { loadLab } from "../tools/lab/core.mjs";
import { judgeProgram } from "../tools/lab/judge.mjs";
import { packStudent, verifyProgram } from "../tools/lab/operations.mjs";
import { scoreProject, verifyProject } from "../tools/lab/project.mjs";
import { runProcess } from "../tools/lab/process.mjs";

const projectRoot = path.resolve(import.meta.dirname, "..");
const quiz = await loadLab(path.join(projectRoot, "labs/chapter-00/lab-00-03-complexity-quiz"));
const program = await loadLab(path.join(projectRoot, "labs/chapter-01/lab-01-03-problem-template"));
const project = await loadLab(path.join(projectRoot, "labs/chapter-04/lab-04-02-huffman-coding"));
assert.equal(quiz.quizResult.count, 19, "Golden Quiz question count must stay stable");
assert.equal(quiz.quizResult.totalPoints, 20, "Golden Quiz points must stay stable");

const programVerification = await verifyProgram(program);
assert.equal(programVerification.ok, true, "Golden Program must keep solution=100, starter<100, and stable .out");
const projectVerification = await verifyProject(project);
assert.equal(projectVerification.ok, true, "Golden Project must keep full automated reference and non-full starter");

async function assertNoForbiddenPackageFiles(root) {
  async function visit(current) {
    for (const entry of await readdir(current, { withFileTypes: true })) {
      const target = path.join(current, entry.name);
      assert.notEqual(entry.name, "solution", `student pack leaked solution directory: ${target}`);
      assert.equal(/\.(?:exe|o|obj|a|so|dylib)$/i.test(entry.name), false, `student pack leaked build artifact: ${target}`);
      if (entry.isDirectory()) await visit(target);
    }
  }
  await visit(root);
}

async function assertSchemaReferences(root) {
  async function visit(current) {
    for (const entry of await readdir(current, { withFileTypes: true })) {
      if ([".git", ".lab-cache", "node_modules"].includes(entry.name)) continue;
      const target = path.join(current, entry.name);
      if (entry.isDirectory()) await visit(target);
      else if (["lab.json", "task.json"].includes(entry.name)) {
        const manifest = JSON.parse(await readFile(target, "utf8"));
        assert.equal(typeof manifest.$schema, "string", `${target} must declare a local schema`);
        const schemaPath = path.resolve(path.dirname(target), manifest.$schema);
        await access(schemaPath);
        const schema = JSON.parse(await readFile(schemaPath, "utf8"));
        assert.match(schema.$id, /\/schemas\/(?:lab|task)\.schema\.json$/, `${target} points to the wrong schema`);
      }
    }
  }
  await visit(root);
}

async function runPackedCli(root, command, args = []) {
  const execution = await runProcess(process.execPath, ["tools/lab/cli.mjs", command, ".", ...args, "--json"], {
    cwd: root,
    timeMs: 180_000,
    outputKb: 8192,
  });
  assert.equal(execution.code, 0, `packed ${command} failed: ${execution.stderr || execution.stdout}`);
  return JSON.parse(execution.stdout);
}

await Promise.all([
  assertSchemaReferences(quiz.labRoot),
  assertSchemaReferences(program.labRoot),
  assertSchemaReferences(project.labRoot),
]);

const programPackage = await packStudent(program);
await assertNoForbiddenPackageFiles(programPackage.packageRoot);
await assertSchemaReferences(programPackage.packageRoot);
const packedProgram = await loadLab(programPackage.packageRoot);
const packedProgramResult = await judgeProgram(packedProgram);
assert.ok(packedProgramResult.score < packedProgramResult.maxScore, "packed Program starter must not get full score");
await runPackedCli(programPackage.packageRoot, "validate");
const packedProgramReport = await runPackedCli(programPackage.packageRoot, "run");
assert.ok(packedProgramReport.result.score < packedProgramReport.result.maxScore, "embedded Program runner must execute the starter independently");

const projectPackage = await packStudent(project);
await assertNoForbiddenPackageFiles(projectPackage.packageRoot);
await assertSchemaReferences(projectPackage.packageRoot);
const packedProject = await loadLab(projectPackage.packageRoot);
const packedProjectResult = await scoreProject(packedProject);
assert.equal(packedProjectResult.automatedFull, false, "packed Project starter must not get full automated score");
await runPackedCli(projectPackage.packageRoot, "validate");
const packedProjectReport = await runPackedCli(projectPackage.packageRoot, "run");
assert.equal(packedProjectReport.result.automatedFull, false, "embedded Project runner must execute the starter independently");
assert.equal(packedProjectReport.result.manualPending, 20, "embedded Project runner must preserve manual pending points");

console.log("Golden Lab 检查通过：Schema 引用、Quiz manifest、Program 100/非满分、Project 80/80 + manual pending、两个独立 runner 学生包。");
