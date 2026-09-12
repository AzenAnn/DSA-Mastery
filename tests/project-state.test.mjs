import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { currentProject, projectInputs, withProjectLock } from "../tools/lab/project-state.mjs";

async function fixture(t) {
  const labRoot = await mkdtemp(path.join(os.tmpdir(), "dsa project state "));
  t.after(() => rm(labRoot, { recursive: true, force: true }));
  const tasks = [
    { id: "a", path: "tasks/a", kind: "ctest", weight: 30, dependsOn: [], buildDependsOn: [] },
    { id: "b", path: "tasks/b", kind: "ctest", weight: 30, dependsOn: [], buildDependsOn: [] },
    { id: "final", path: "tasks/final", kind: "ctest", weight: 30, dependsOn: ["a"], buildDependsOn: ["a"] },
    { id: "report", path: "report", kind: "manual", weight: 10, dependsOn: ["final"] },
  ].map((task) => ({ ...task, config: { checklist: ["Review"] } }));
  for (const task of tasks) {
    await mkdir(path.join(labRoot, task.path, "student"), { recursive: true });
    await writeFile(path.join(labRoot, task.path, "student", "module.cpp"), "// initial");
  }
  await writeFile(path.join(labRoot, "lab.json"), "{}");
  return { labRoot, tasks, manifest: { type: "project" } };
}

test("source fingerprints invalidate only transitive owners and shared config, ignoring solution/cache", async (t) => {
  const lab = await fixture(t);
  const before = await projectInputs(lab);
  await writeFile(path.join(lab.labRoot, "tasks/a/student/module.cpp"), "// changed");
  const after = await projectInputs(lab);
  assert.notEqual(before.a.fingerprint, after.a.fingerprint);
  assert.equal(before.b.fingerprint, after.b.fingerprint);
  assert.notEqual(before.final.fingerprint, after.final.fingerprint);
  assert.notEqual(before.report.fingerprint, after.report.fingerprint);
  for (const dir of ["solution", ".lab-cache"]) {
    await mkdir(path.join(lab.labRoot, dir), { recursive: true });
    await writeFile(path.join(lab.labRoot, dir, "generated.cpp"), "irrelevant");
  }
  assert.deepEqual(await projectInputs(lab), after);
  await writeFile(path.join(lab.labRoot, "lab.json"), "{\"config\":true}");
  const configured = await projectInputs(lab);
  for (const task of lab.tasks) assert.notEqual(after[task.id].fingerprint, configured[task.id].fingerprint);
});

test("manual, unassessed and stale results cannot become complete; historical grades survive", async (t) => {
  const lab = await fixture(t);
  const inputs = await projectInputs(lab);
  const state = { tasks: Object.fromEntries(lab.tasks.filter((task) => task.kind !== "manual").map((task) => [task.id, {
    fingerprint: inputs[task.id].fingerprint, at: "2026-09-11", bestScore: task.weight,
    result: { id: task.id, status: "AC", score: 100, maxScore: 100, weightedScore: task.weight },
  }])) };
  const full = currentProject(lab, state, inputs);
  assert.equal(full.automatedFull, true);
  assert.equal(full.complete, false);
  assert.equal(full.manualPending, 10);
  await writeFile(path.join(lab.labRoot, "tasks/a/student/module.cpp"), "// stale");
  const stale = currentProject(lab, state, await projectInputs(lab));
  assert.equal(stale.automatedScore, 30);
  assert.equal(stale.tasks[0].status, "STALE");
  assert.equal(stale.tasks[0].historicalScore, 30);
  assert.equal(stale.tasks[0].bestScore, 30);
  assert.equal(stale.complete, false);
  assert.equal(currentProject(lab, { tasks: {} }, inputs).tasks[0].status, "UNASSESSED");
  state.tasks.b.changedDuringRun = true;
  assert.equal(currentProject(lab, state, inputs).tasks[1].status, "STALE");
});

test("project lock rejects concurrent grading and releases on failure", async (t) => {
  const lab = await fixture(t);
  await withProjectLock(lab, async () => {
    assert.equal(JSON.parse(await readFile(path.join(lab.labRoot, ".lab-cache/project.lock"), "utf8")).pid, process.pid);
    await assert.rejects(withProjectLock(lab, async () => {}), { code: "PROJECT_BUSY" });
  });
  await assert.rejects(withProjectLock(lab, async () => { throw new Error("fixture failure"); }), /fixture failure/);
  assert.equal(await withProjectLock(lab, async () => "released"), "released");
});
