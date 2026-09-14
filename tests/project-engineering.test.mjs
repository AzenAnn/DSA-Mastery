import assert from "node:assert/strict";
import { cp, mkdtemp, readFile, rm, utimes, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { loadLab } from "../tools/lab/core.mjs";
import { packStudent } from "../tools/lab/operations.mjs";
import { scoreProject } from "../tools/lab/project.mjs";
import { projectStatus } from "../tools/lab/project-state.mjs";
import { runProcess } from "../tools/lab/process.mjs";

const source = path.resolve("labs/chapter-02/project/P-02-04-expression-evaluator");
const modules = ["stack", "tokenizer", "postfix", "evaluator"];
const relative = (index) => `tasks/task-0${index + 1}-${index === 3 ? "final" : modules[index]}`;
const statuses = (result) => result.tasks.map((task) => task.status);

test("real expression project: reference, starter, independent builds, dependency faults, integration and external pack", { timeout: 300_000 }, async (t) => {
  const parent = await mkdtemp(path.join(os.tmpdir(), "dsa project engineering "));
  t.after(() => rm(parent, { recursive: true, force: true }));
  const root = path.join(parent, "expression project");
  await cp(source, root, { recursive: true, filter: (file) => !file.split(path.sep).includes(".lab-cache") });
  const lab = await loadLab(root);
  const starter = await scoreProject(lab);
  assert.equal(starter.automatedFull, false);
  assert(starter.tasks.every((task) => task.build?.ok));
  const solution = await scoreProject(lab, { target: "solution" });
  assert.equal(solution.automatedScore, 100);
  const originals = await Promise.all(modules.map((name, i) => readFile(path.join(root, relative(i), "solution", `${name}.cpp`), "utf8")));
  const student = (i) => path.join(root, relative(i), "student", `${modules[i]}.cpp`);
  for (let i = 0; i < modules.length; i += 1) await writeFile(student(i), originals[i]);
  assert.equal((await scoreProject(lab)).current.complete, true);

  await writeFile(student(3), "#error FINAL_COMPILE_FAULT\n");
  await utimes(student(3), new Date("2000-01-01"), new Date("2000-01-01"));
  const isolated = await scoreProject(lab, { taskId: "stack" });
  assert.equal(isolated.tasks[0].status, "AC");
  assert.equal(isolated.current.complete, false);
  assert.equal(isolated.current.tasks[3].status, "STALE");
  assert.deepEqual(statuses(await scoreProject(lab)), ["AC", "AC", "AC", "CE"]);
  await writeFile(student(3), originals[3]);

  await writeFile(student(0), "#error STACK_COMPILE_FAULT\n");
  const blocked = await scoreProject(lab);
  assert.deepEqual(statuses(blocked), ["CE", "AC", "BLOCKED", "BLOCKED"]);
  assert.deepEqual(blocked.tasks[3].blockedBy, ["stack"]);
  assert.equal(blocked.tasks[3].tests.length, 0);
  assert.match(blocked.tasks[3].build.build.stdout + blocked.tasks[3].build.build.stderr, /stack\.cpp|STACK_COMPILE_FAULT/);
  await writeFile(student(0), originals[0]);

  const unitFile = path.join(root, relative(0), "tests/stack_tests.cpp");
  const unitOriginal = await readFile(unitFile, "utf8");
  await writeFile(unitFile, unitOriginal.replace('CHECK(argc == 2, "test group");', 'CHECK(false, "injected unit failure");'));
  assert.deepEqual(statuses(await scoreProject(lab)), ["WA", "AC", "AC", "AC"]);
  await writeFile(unitFile, unitOriginal);

  await writeFile(student(1), originals[1].replace("tokens.push_back({Kind::Number, value, begin});", "tokens.push_back({Kind::Number, value == 42 ? 43 : value, begin});"));
  const integration = await scoreProject(lab);
  assert.deepEqual(statuses(integration), ["AC", "AC", "AC", "WA"]);
  assert.match(integration.tasks[3].tests[0].output, /expected 52, actual 53/);
  await writeFile(student(1), originals[1]);
  assert.equal((await scoreProject(lab)).current.complete, true);
  await writeFile(student(0), `${originals[0]}\n// upstream change\n`);
  const stale = await projectStatus(lab);
  assert.deepEqual(statuses(stale), ["STALE", "AC", "STALE", "STALE"]);
  assert.equal(stale.automatedScore, 20);
  assert.equal(stale.tasks[3].historicalScore, 35);
  assert.deepEqual(statuses((await scoreProject(lab, { taskId: "stack" })).current), ["AC", "AC", "STALE", "STALE"]);

  // Export the actual starter, then run the copied CLI outside the repository.
  const packed = await packStudent(await loadLab(source));
  const external = path.join(parent, "fresh student pack");
  await cp(packed.packageRoot, external, { recursive: true });
  for (const command of ["validate", "score"]) {
    const run = await runProcess(process.execPath, ["tools/lab/cli.mjs", command, ".", "--json"], { cwd: external, timeMs: 120_000, outputKb: 4096 });
    assert.equal(run.code, command === "score" ? 1 : 0, run.stderr + run.stdout);
    const report = JSON.parse(run.stdout);
    assert.equal(report.ok, true);
    if (command === "score") {
      assert.equal(report.result.automatedFull, false);
      assert(report.result.tasks.every((task) => task.build.ok));
    }
  }
  console.log("PASS: starter/reference; single-target isolation; CE/BLOCKED scope; upstream WA continues; integration-only fault; transitive STALE; external fresh student pack");
});
