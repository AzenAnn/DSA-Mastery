import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { expect, it, onTestFinished } from "vitest";
import { currentProject, projectInputs, withProjectLock } from "../tools/lab/project-state.mjs";

async function fixture() {
  const labRoot = await mkdtemp(path.join(os.tmpdir(), "dsa project state "));
  onTestFinished(() => rm(labRoot, { recursive: true, force: true }));
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

it("source fingerprints invalidate only transitive owners and shared config, ignoring solution/cache", async () => {
  const lab = await fixture();
  const before = await projectInputs(lab);
  await writeFile(path.join(lab.labRoot, "tasks/a/student/module.cpp"), "// changed");
  const after = await projectInputs(lab);
  expect(before.a.fingerprint).not.toBe(after.a.fingerprint);
  expect(before.b.fingerprint).toBe(after.b.fingerprint);
  expect(before.final.fingerprint).not.toBe(after.final.fingerprint);
  expect(before.report.fingerprint).not.toBe(after.report.fingerprint);
  for (const dir of ["solution", ".lab-cache"]) {
    await mkdir(path.join(lab.labRoot, dir), { recursive: true });
    await writeFile(path.join(lab.labRoot, dir, "generated.cpp"), "irrelevant");
  }
  expect(await projectInputs(lab)).toStrictEqual(after);
  await writeFile(path.join(lab.labRoot, "lab.json"), "{\"config\":true}");
  const configured = await projectInputs(lab);
  for (const task of lab.tasks) expect(after[task.id].fingerprint).not.toBe(configured[task.id].fingerprint);
});

it("manual, unassessed and stale results cannot become complete; historical grades survive", async () => {
  const lab = await fixture();
  const inputs = await projectInputs(lab);
  const state = { tasks: Object.fromEntries(lab.tasks.filter((task) => task.kind !== "manual").map((task) => [task.id, {
    fingerprint: inputs[task.id].fingerprint, at: "2026-09-11", bestScore: task.weight,
    result: { id: task.id, status: "AC", score: 100, maxScore: 100, weightedScore: task.weight },
  }])) };
  const full = currentProject(lab, state, inputs);
  expect(full.automatedFull).toBe(true);
  expect(full.complete).toBe(false);
  expect(full.manualPending).toBe(10);
  await writeFile(path.join(lab.labRoot, "tasks/a/student/module.cpp"), "// stale");
  const stale = currentProject(lab, state, await projectInputs(lab));
  expect(stale.automatedScore).toBe(30);
  expect(stale.tasks[0].status).toBe("STALE");
  expect(stale.tasks[0].historicalScore).toBe(30);
  expect(stale.tasks[0].bestScore).toBe(30);
  expect(stale.complete).toBe(false);
  expect(currentProject(lab, { tasks: {} }, inputs).tasks[0].status).toBe("UNASSESSED");
  state.tasks.b.changedDuringRun = true;
  expect(currentProject(lab, state, inputs).tasks[1].status).toBe("STALE");
});

it("project lock rejects concurrent grading and releases on failure", async () => {
  const lab = await fixture();
  await withProjectLock(lab, async () => {
    expect(JSON.parse(await readFile(path.join(lab.labRoot, ".lab-cache/project.lock"), "utf8")).pid).toBe(process.pid);
    await expect(withProjectLock(lab, async () => {})).rejects.toThrow(expect.objectContaining({ code: "PROJECT_BUSY" }));
  });
  await expect(withProjectLock(lab, async () => { throw new Error("fixture failure"); })).rejects.toThrow(/fixture failure/);
  expect(await withProjectLock(lab, async () => "released")).toBe("released");
});
