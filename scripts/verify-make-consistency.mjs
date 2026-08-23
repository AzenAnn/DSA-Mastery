import assert from "node:assert/strict";
import { access, cp, mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { runProcess } from "../tools/lab/process.mjs";

const projectRoot = path.resolve(import.meta.dirname, "..");
const lab = "labs/chapter-01/lab-01-06-sequential-list-deduplication";
const labRoot = path.join(projectRoot, lab);
const projectLabRoot = path.join(projectRoot, "labs", "chapter-08", "lab-08-03-avl-tree-rotations");

async function chooseMake() {
  for (const command of [process.env.MAKE, "make", "mingw32-make"].filter(Boolean)) {
    const result = await runProcess(command, ["--version"], { cwd: projectRoot, timeMs: 5000, outputKb: 256 });
    if (!result.spawnError && result.code === 0) return command;
  }
  return undefined;
}

const make = await chooseMake();
if (!make) {
  console.log("GNU Make 未安装：按 Windows-first 合同跳过 Make 一致性检查；pnpm 是官方兜底。");
  process.exit(0);
}

async function runJson(command, args, cwd = projectRoot) {
  const result = await runProcess(command, args, { cwd, timeMs: 180_000, outputKb: 8192 });
  assert.equal(result.code, 0, `${command} failed: ${result.stderr || result.stdout}`);
  return JSON.parse(result.stdout);
}

const makeReport = await runJson(make, ["run", `LAB=${lab}`, "CASE=001-sample", "TARGET=solution", "JSON=1"]);
const localMakeReport = await runJson(make, ["run", "CASE=001-sample", "TARGET=solution", "JSON=1"], labRoot);
const cliReport = await runJson(process.execPath, ["tools/lab/cli.mjs", "run", lab, "--case", "001-sample", "--target", "solution", "--json"]);

function stable(report) {
  return {
    type: report.lab.type,
    verdict: report.result.verdict,
    score: report.result.score,
    maxScore: report.result.maxScore,
    cases: report.result.cases.map((item) => ({ id: item.id, verdict: item.verdict, points: item.points, maxPoints: item.maxPoints })),
  };
}

assert.deepEqual(stable(makeReport), stable(cliReport), "Make and direct CLI must produce the same verdicts and score");
assert.deepEqual(stable(localMakeReport), stable(cliReport), "Lab-local Make and direct CLI must produce the same verdicts and score");

const help = await runProcess(make, ["help"], { cwd: labRoot, timeMs: 10_000, outputKb: 1024 });
assert.equal(help.code, 0, help.stderr || help.stdout);
assert.match(help.stdout, /DSA Mastery Lab CLI/);
const doctor = await runProcess(make, ["doctor"], { cwd: labRoot, timeMs: 30_000, outputKb: 2048 });
assert.equal(doctor.code, 0, doctor.stderr || doctor.stdout);
const build = await runProcess(make, ["build", "TARGET=solution"], { cwd: labRoot, timeMs: 60_000, outputKb: 4096 });
assert.equal(build.code, 0, build.stderr || build.stdout);

const sampleInput = "8\n1 1 2 2 3 4 4 5\n";
const interactive = await runProcess(make, ["interactive", "TARGET=solution"], {
  cwd: labRoot,
  input: sampleInput,
  timeMs: 60_000,
  outputKb: 4096,
});
assert.equal(interactive.code, 0, interactive.stderr || interactive.stdout);
assert.match(interactive.stdout, /1 2 3 4 5/);

const learnerRun = await runProcess(make, ["run", "TARGET=student", "JSON=1"], {
  cwd: labRoot,
  timeMs: 60_000,
  outputKb: 4096,
});
assert.equal(learnerRun.code, 0, `make run must hide non-full-score exit status: ${learnerRun.stderr || learnerRun.stdout}`);
assert.ok(JSON.parse(learnerRun.stdout).result.score < 100, "starter should remain non-full under make run");
assert.doesNotMatch(`${learnerRun.stdout}\n${learnerRun.stderr}`, /\*\*\*/i, "make run must not print Make failure noise for WA");

const strict = await runProcess(make, ["score", `LAB=${lab}`, "CASE=001-sample", "TARGET=student", "JSON=1"], {
  cwd: projectRoot,
  timeMs: 60_000,
  outputKb: 4096,
});
assert.notEqual(strict.code, 0, "make score must be strict when the student is not full score");

const packed = await runJson(process.execPath, ["tools/lab/cli.mjs", "pack", lab, "--profile", "student", "--json"]);
const packedMake = await runJson(make, ["run", "JSON=1"], packed.package.packageRoot);
assert.ok(packedMake.result.score < packedMake.result.maxScore, "standalone student-package Makefile must use its embedded runner");
const spacedParent = await mkdtemp(path.join(os.tmpdir(), "dsa lab make "));
const spacedPackage = path.join(spacedParent, "student package with spaces");
try {
  await cp(packed.package.packageRoot, spacedPackage, { recursive: true });
  const spacedLocal = await runJson(make, ["run", "JSON=1"], spacedPackage);
  assert.ok(spacedLocal.result.score < spacedLocal.result.maxScore, "Lab-local Make must support paths containing spaces");
  const spacedRoot = await runJson(make, ["run", `LAB=${spacedPackage}`, "JSON=1"]);
  assert.deepEqual(stable(spacedRoot), stable(spacedLocal), "root Make LAB must preserve a path containing spaces");
} finally {
  await rm(spacedParent, { recursive: true, force: true });
}

const projectTask = await runJson(make, ["run", "TASK=bst", "TARGET=solution", "JSON=1"], projectLabRoot);
assert.deepEqual(projectTask.result.tasks.map((task) => task.id), ["bst"], "Project Make TASK must select exactly one task");
assert.equal(projectTask.result.automatedScore, 30);
assert.equal(projectTask.result.automatedMax, 30);
const projectRefresh = await runJson(make, ["refresh-expected", "TASK=bst", "JSON=1"], projectLabRoot);
assert.equal(projectRefresh.refresh.changed, 0, "Project stdio oracle must be stable through Make");

const clean = await runProcess(make, ["clean"], { cwd: labRoot, timeMs: 30_000, outputKb: 2048 });
assert.equal(clean.code, 0, clean.stderr || clean.stdout);
const cleanProject = await runProcess(make, ["clean"], { cwd: projectLabRoot, timeMs: 30_000, outputKb: 2048 });
assert.equal(cleanProject.code, 0, cleanProject.stderr || cleanProject.stdout);
await assert.rejects(access(path.join(projectLabRoot, "tasks", "task-01-bst", ".lab-cache")), undefined, "Project clean must remove task-local caches");

console.log(`Make/CLI 一致性检查通过：${make}，根/本地/学生包 run 一致，interactive 与 Project TASK/oracle 可用，student strict score 返回非零。`);
