import { createHash } from "node:crypto";
import { mkdir, open, readFile, readdir, rename, rm } from "node:fs/promises";
import path from "node:path";
import { LabError } from "./errors.mjs";

const ignoredDirectories = new Set([".lab-cache", "solution", ".git", "node_modules"]);
const binary = /\.(?:exe|o|obj|a|lib|so|dylib|dll|pdb|vsix)$/i;
const slash = (value) => value.replaceAll("\\", "/");

export function sourceDependencies(task) {
  return task.buildDependsOn ?? task.dependsOn ?? [];
}

export function dependencyClosure(lab, task, dependencies = sourceDependencies) {
  const result = new Set();
  function visit(item) {
    for (const id of dependencies(item)) {
      if (result.has(id)) continue;
      result.add(id);
      visit(lab.tasks.find((candidate) => candidate.id === id));
    }
  }
  visit(task);
  return lab.tasks.filter((item) => result.has(item.id));
}

export async function projectInputs(lab, target = "student") {
  const files = new Map();
  async function walk(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      if (ignoredDirectories.has(entry.name) && !(target === "solution" && entry.name === "solution")) continue;
      if (target === "solution" && entry.name === "student") continue;
      if (binary.test(entry.name)) continue;
      const absolute = path.join(directory, entry.name);
      if (entry.isSymbolicLink()) throw new LabError("PATH_ESCAPE", `Project 输入不支持符号链接：${absolute}`);
      if (entry.isDirectory()) await walk(absolute);
      else if (entry.isFile()) files.set(slash(path.relative(lab.labRoot, absolute)), createHash("sha256").update(await readFile(absolute)).digest("hex"));
    }
  }
  await walk(lab.labRoot);
  const runner = createHash("sha256");
  for (const name of (await readdir(import.meta.dirname)).filter((name) => name.endsWith(".mjs")).sort()) runner.update(await readFile(path.join(import.meta.dirname, name)));
  const engine = runner.digest("hex");
  const roots = lab.tasks.map((task) => `${slash(task.path).replace(/\/$/, "")}/`);
  const shared = [...files.keys()].filter((file) => !roots.some((root) => file.startsWith(root)));
  return Object.fromEntries(lab.tasks.map((task) => {
    const owners = [task, ...dependencyClosure(lab, task)].map((item) => `${slash(item.path).replace(/\/$/, "")}/`);
    const inputs = [...new Set([...shared, ...[...files.keys()].filter((file) => owners.some((root) => file.startsWith(root)))])].sort();
    const fingerprint = createHash("sha256").update(JSON.stringify([target, engine, inputs.map((file) => [file, files.get(file)])])).digest("hex");
    return [task.id, { fingerprint, files: inputs }];
  }));
}

function statePath(lab, target) {
  return path.join(lab.labRoot, ".lab-cache", `project-results-${target}.json`);
}

export async function readProjectState(lab, target) {
  try {
    const state = JSON.parse(await readFile(statePath(lab, target), "utf8"));
    if (state.version !== 1 || !state.tasks || typeof state.tasks !== "object") return { version: 1, tasks: {} };
    return state;
  } catch (error) {
    if (error.code !== "ENOENT" && !(error instanceof SyntaxError)) throw error;
    return { version: 1, tasks: {} };
  }
}

export async function writeProjectState(lab, target, state) {
  const file = statePath(lab, target);
  await mkdir(path.dirname(file), { recursive: true });
  const temporary = `${file}.${process.pid}.tmp`;
  const handle = await open(temporary, "w");
  try { await handle.writeFile(`${JSON.stringify(state, null, 2)}\n`); } finally { await handle.close(); }
  try { await rename(temporary, file); } finally { await rm(temporary, { force: true }); }
}

export function currentProject(lab, state, inputs, dirtyFiles = []) {
  const tasks = lab.tasks.map((task) => {
    const entry = state.tasks[task.id];
    const dirty = inputs[task.id].files.some((file) => dirtyFiles.includes(file));
    const valid = Boolean(entry && entry.fingerprint === inputs[task.id].fingerprint && !entry.changedDuringRun && !dirty);
    const status = task.kind === "manual" ? "PENDING" : !entry ? "UNASSESSED" : valid ? entry.result.status : "STALE";
    return {
      ...(entry?.result ?? {}), id: task.id, kind: task.kind, weight: task.weight, status,
      weightedScore: valid && task.kind !== "manual" ? (entry.result.score ?? 0) / (entry.result.maxScore || 100) * task.weight : 0,
      historicalScore: entry?.result.weightedScore, bestScore: entry?.bestScore,
      previousStatus: entry?.result.status, assessedAt: entry?.at,
      inputFingerprint: inputs[task.id].fingerprint, inputFiles: inputs[task.id].files,
      valid: valid && task.kind !== "manual", dependsOn: task.dependsOn,
      unsaved: dirty,
      buildDependsOn: task.buildDependsOn, checklist: task.config.checklist,
    };
  });
  const automated = tasks.filter((task) => task.kind !== "manual");
  const automatedScore = automated.reduce((sum, task) => sum + task.weightedScore, 0);
  const automatedMax = automated.reduce((sum, task) => sum + task.weight, 0);
  const manualPending = tasks.filter((task) => task.kind === "manual").reduce((sum, task) => sum + task.weight, 0);
  const automatedFull = automated.length > 0 && automated.every((task) => task.valid && task.status === "AC" && task.score === task.maxScore);
  const internalError = tasks.some((task) => task.status === "IE");
  return { tasks, automatedScore, automatedMax, manualPending, provisionalTotal: automatedScore, total: 100,
    automatedFull, internalError, complete: automatedFull && manualPending === 0 && !internalError };
}

export async function projectStatus(lab, target = "student", dirtyFiles = []) {
  if (lab.manifest.type !== "project") throw new LabError("TYPE_UNSUPPORTED", "project-status 仅支持 Project");
  if (!["student", "solution"].includes(target)) throw new LabError("TARGET_INVALID", "Project target 必须是 student 或 solution");
  if (!Array.isArray(dirtyFiles) || dirtyFiles.some((file) => typeof file !== "string")) throw new LabError("ARGUMENT_INVALID", "--dirty-files 必须为相对路径 JSON 数组");
  return { target, ...currentProject(lab, await readProjectState(lab, target), await projectInputs(lab, target), dirtyFiles.map(slash)) };
}

export async function withProjectLock(lab, operation) {
  const directory = path.join(lab.labRoot, ".lab-cache");
  await mkdir(directory, { recursive: true });
  const file = path.join(directory, "project.lock");
  let handle;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try { handle = await open(file, "wx"); break; } catch (error) {
      if (error.code !== "EEXIST") throw error;
      let owner;
      try { owner = JSON.parse(await readFile(file, "utf8")); } catch { /* A new owner may still be writing its PID. */ }
      let alive = true;
      if (Number.isInteger(owner?.pid) && owner.pid > 0) {
        try { process.kill(owner.pid, 0); } catch (probe) { alive = probe.code !== "ESRCH"; }
      }
      if (alive || attempt) throw new LabError("PROJECT_BUSY", "该 Project 正在构建或测评，请等待完成后重试。", { lockFile: file, pid: owner?.pid });
      await rm(file, { force: true });
    }
  }
  try {
    await handle.writeFile(JSON.stringify({ pid: process.pid }));
    return await operation();
  } finally {
    await handle.close();
    await rm(file, { force: true });
  }
}
