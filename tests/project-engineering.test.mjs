import { cp, mkdtemp, readFile, rm, utimes, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { expect, it, onTestFinished } from "vitest";
import { loadLab } from "../tools/lab/core.mjs";
import { packStudent } from "../tools/lab/operations.mjs";
import { scoreProject } from "../tools/lab/project.mjs";
import { projectStatus } from "../tools/lab/project-state.mjs";
import { runProcess } from "../tools/lab/process.mjs";

const source = path.resolve("labs/chapter-02/project/P-02-04-expression-evaluator");
const modules = ["stack", "tokenizer", "postfix", "evaluator"];
const relative = (index) => `tasks/task-0${index + 1}-${index === 3 ? "final" : modules[index]}`;
const statuses = (result) => result.tasks.map((task) => task.status);

it("real expression project: reference, starter, independent builds, dependency faults, integration and external pack", { timeout: 300_000 }, async () => {
  const parent = await mkdtemp(path.join(os.tmpdir(), "dsa project engineering "));
  onTestFinished(() => rm(parent, { recursive: true, force: true }));
  const root = path.join(parent, "expression project");
  await cp(source, root, { recursive: true, filter: (file) => !file.split(path.sep).includes(".lab-cache") });
  const lab = await loadLab(root);
  const starter = await scoreProject(lab);
  expect(starter.automatedFull).toBe(false);
  expect(starter.tasks.every((task) => task.build?.ok)).toBeTruthy();
  const solution = await scoreProject(lab, { target: "solution" });
  expect(solution.automatedScore).toBe(100);
  const originals = await Promise.all(modules.map((name, i) => readFile(path.join(root, relative(i), "solution", `${name}.cpp`), "utf8")));
  const student = (i) => path.join(root, relative(i), "student", `${modules[i]}.cpp`);
  for (let i = 0; i < modules.length; i += 1) await writeFile(student(i), originals[i]);
  expect((await scoreProject(lab)).current.complete).toBe(true);

  await writeFile(student(3), "#error FINAL_COMPILE_FAULT\n");
  await utimes(student(3), new Date("2000-01-01"), new Date("2000-01-01"));
  const isolated = await scoreProject(lab, { taskId: "stack" });
  expect(isolated.tasks[0].status).toBe("AC");
  expect(isolated.current.complete).toBe(false);
  expect(isolated.current.tasks[3].status).toBe("STALE");
  expect(statuses(await scoreProject(lab))).toStrictEqual(["AC", "AC", "AC", "CE"]);
  await writeFile(student(3), originals[3]);

  await writeFile(student(0), "#error STACK_COMPILE_FAULT\n");
  const blocked = await scoreProject(lab);
  expect(statuses(blocked)).toStrictEqual(["CE", "AC", "BLOCKED", "BLOCKED"]);
  expect(blocked.tasks[3].blockedBy).toStrictEqual(["stack"]);
  expect(blocked.tasks[3].tests.length).toBe(0);
  expect(blocked.tasks[3].build.build.stdout + blocked.tasks[3].build.build.stderr).toMatch(/stack\.cpp|STACK_COMPILE_FAULT/);
  await writeFile(student(0), originals[0]);

  const unitFile = path.join(root, relative(0), "tests/stack_tests.cpp");
  const unitOriginal = await readFile(unitFile, "utf8");
  await writeFile(unitFile, unitOriginal.replace('CHECK(argc == 2, "test group");', 'CHECK(false, "injected unit failure");'));
  expect(statuses(await scoreProject(lab))).toStrictEqual(["WA", "AC", "AC", "AC"]);
  await writeFile(unitFile, unitOriginal);

  await writeFile(student(1), originals[1].replace("tokens.push_back({Kind::Number, value, begin});", "tokens.push_back({Kind::Number, value == 42 ? 43 : value, begin});"));
  const integration = await scoreProject(lab);
  expect(statuses(integration)).toStrictEqual(["AC", "AC", "AC", "WA"]);
  expect(integration.tasks[3].tests[0].output).toMatch(/expected 52, actual 53/);
  await writeFile(student(1), originals[1]);
  expect((await scoreProject(lab)).current.complete).toBe(true);
  await writeFile(student(0), `${originals[0]}\n// upstream change\n`);
  const stale = await projectStatus(lab);
  expect(statuses(stale)).toStrictEqual(["STALE", "AC", "STALE", "STALE"]);
  expect(stale.automatedScore).toBe(20);
  expect(stale.tasks[3].historicalScore).toBe(35);
  expect(statuses((await scoreProject(lab, { taskId: "stack" })).current)).toStrictEqual(["AC", "AC", "STALE", "STALE"]);

  // Export the actual starter, then run the copied CLI outside the repository.
  const packed = await packStudent(await loadLab(source));
  const external = path.join(parent, "fresh student pack");
  await cp(packed.packageRoot, external, { recursive: true });
  for (const command of ["validate", "score"]) {
    const run = await runProcess(process.execPath, ["tools/lab/cli.mjs", command, ".", "--json"], { cwd: external, timeMs: 120_000, outputKb: 4096 });
    expect(run.code, run.stderr + run.stdout).toBe(command === "score" ? 1 : 0);
    const report = JSON.parse(run.stdout);
    expect(report.ok).toBe(true);
    if (command === "score") {
      expect(report.result.automatedFull).toBe(false);
      expect(report.result.tasks.every((task) => task.build.ok)).toBeTruthy();
    }
  }
  console.log("PASS: starter/reference; single-target isolation; CE/BLOCKED scope; upstream WA continues; integration-only fault; transitive STALE; external fresh student pack");
});
