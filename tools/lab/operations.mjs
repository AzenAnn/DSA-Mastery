import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { compareOutput, normalizeNewlines } from "./compare.mjs";
import { compileTarget } from "./compiler.mjs";
import { pathExists } from "./core.mjs";
import { LabError } from "./errors.mjs";
import { judgeProgram } from "./judge.mjs";
import { runProcess } from "./process.mjs";

export function previewDiff(previous, next) {
  const before = previous.replace(/\r\n?/g, "\n").split("\n");
  const after = next.replace(/\r\n?/g, "\n").split("\n");
  const lines = [];
  for (let index = 0; index < Math.max(before.length, after.length) && lines.length < 12; index += 1) {
    if (before[index] === after[index]) continue;
    lines.push(`@@ line ${index + 1} @@`);
    lines.push(`- ${before[index] ?? "<end of file>"}`);
    lines.push(`+ ${after[index] ?? "<end of file>"}`);
  }
  return lines.join("\n");
}

export async function refreshExpected(lab, write = false) {
  if (lab.manifest.type !== "program") throw new LabError("TYPE_UNSUPPORTED", "refresh-expected 仅支持 program Lab");
  if (!lab.manifest.targets.solution) throw new LabError("SOLUTION_UNAVAILABLE", "学生分发包不包含参考实现");
  const compilation = await compileTarget(lab, "solution");
  if (!compilation.ok) throw new LabError("SOLUTION_CE", `参考实现编译失败：\n${compilation.stderr || compilation.stdout}`);
  const changes = [];
  for (const testCase of lab.cases) {
    const input = await readFile(path.resolve(lab.labRoot, testCase.input), "utf8");
    const result = await runProcess(compilation.executable, [], {
      cwd: lab.labRoot,
      input,
      timeMs: testCase.timeMs ?? lab.manifest.judge.limits?.timeMs ?? 2000,
      outputKb: testCase.outputKb ?? lab.manifest.judge.limits?.outputKb ?? 1024,
    });
    if (result.spawnError || result.timedOut || result.outputExceeded || result.code !== 0) {
      throw new LabError("SOLUTION_FAILED", `参考实现未能生成 ${testCase.id}：${result.timedOut ? "TLE" : result.outputExceeded ? "OLE" : "RE"}`);
    }
    const expectedPath = path.resolve(lab.labRoot, testCase.expected);
    const previous = await readFile(expectedPath, "utf8");
    const normalizedOutput = normalizeNewlines(result.stdout);
    const comparison = compareOutput(previous, normalizedOutput, { mode: "exact" });
    if (!comparison.equal) {
      changes.push({
        id: testCase.id,
        expected: testCase.expected,
        difference: comparison.difference,
        diff: previewDiff(previous, normalizedOutput),
      });
      if (write) await writeFile(expectedPath, normalizedOutput, "utf8");
    }
  }
  return { changed: changes.length, written: write ? changes.length : 0, changes };
}

export async function verifyProgram(lab) {
  if (lab.manifest.type !== "program") throw new LabError("TYPE_UNSUPPORTED", "当前 verify 仅支持 program Lab");
  const drift = await refreshExpected(lab, false);
  const solution = await judgeProgram(lab, { target: "solution" });
  const student = await judgeProgram(lab, { target: "student" });
  const checks = {
    expectedStable: drift.changed === 0,
    solutionFullScore: solution.score === 100 && solution.maxScore === 100,
    studentCompiles: student.verdict !== "CE",
    studentNotFullScore: student.score < student.maxScore,
  };
  return { ok: Object.values(checks).every(Boolean), checks, drift, solution, student };
}

function standaloneMakefile() {
  return `LAB_DIR := $(CURDIR)\nREPO_ROOT := $(LAB_DIR)\ninclude tools/lab/lab.mk\n`;
}

const PACK_BINARY = /\.(?:exe|o|obj|a|lib|so|dylib|dll|pdb)$/i;

function packageFilter(source) {
  const parts = path.resolve(source).split(path.sep).map((part) => part.toLocaleLowerCase());
  const name = path.basename(source);
  return !parts.includes("solution") &&
    !parts.includes(".lab-cache") &&
    !parts.includes("node_modules") &&
    !PACK_BINARY.test(name);
}

async function copyPackageEntry(lab, packageRoot, relative, required = false) {
  const source = path.resolve(lab.labRoot, relative);
  if (!(await pathExists(source))) {
    if (required) throw new LabError("FILE_NOT_FOUND", `学生包缺少必需源文件：${relative}`);
    return false;
  }
  const target = path.resolve(packageRoot, relative);
  await mkdir(path.dirname(target), { recursive: true });
  await cp(source, target, { recursive: true, force: true, filter: packageFilter });
  return true;
}

export async function packStudent(lab) {
  if (!new Set(["program", "project"]).has(lab.manifest.type)) throw new LabError("TYPE_UNSUPPORTED", "student pack 仅支持 program/project Lab");
  const packageRoot = path.join(lab.labRoot, ".lab-cache", "packages", `${path.basename(lab.labRoot)}-student`);
  await rm(packageRoot, { recursive: true, force: true });
  await mkdir(packageRoot, { recursive: true });
  const requiredEntries = new Set(["README.md"]);
  const optionalEntries = new Set();
  if (lab.manifest.type === "program") {
    optionalEntries.add("student");
    optionalEntries.add("tests");
    requiredEntries.add(lab.manifest.judge.cases);
    for (const source of lab.manifest.targets.student.sources) requiredEntries.add(source);
    for (const includeDir of lab.manifest.targets.student.includeDirs ?? []) requiredEntries.add(includeDir);
    for (const testCase of lab.cases) {
      requiredEntries.add(testCase.input);
      requiredEntries.add(testCase.expected);
    }
  } else {
    requiredEntries.add("CMakeLists.txt");
    requiredEntries.add("CMakePresets.json");
    for (const task of lab.manifest.tasks) requiredEntries.add(task.path);
    for (const shared of ["include", "src", "contracts"]) optionalEntries.add(shared);
  }
  for (const entry of requiredEntries) await copyPackageEntry(lab, packageRoot, entry, true);
  for (const entry of optionalEntries) {
    if (!requiredEntries.has(entry)) await copyPackageEntry(lab, packageRoot, entry);
  }
  const manifest = structuredClone(lab.manifest);
  manifest.distribution = "student";
  manifest.$schema = "schemas/lab.schema.json";
  if (manifest.targets) delete manifest.targets.solution;
  await writeFile(path.join(packageRoot, "lab.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  await writeFile(path.join(packageRoot, "Makefile"), standaloneMakefile(), "utf8");
  await cp(path.resolve(import.meta.dirname, "../../schemas"), path.join(packageRoot, "schemas"), { recursive: true });
  if (lab.manifest.type === "project") {
    const taskFiles = [];
    async function collect(root) {
      for (const entry of await readdir(root, { withFileTypes: true })) {
        const target = path.join(root, entry.name);
        if (entry.isDirectory()) await collect(target);
        else if (entry.name === "task.json") taskFiles.push(target);
      }
    }
    await collect(packageRoot);
    for (const taskFile of taskFiles) {
      const taskManifest = JSON.parse(await readFile(taskFile, "utf8"));
      if (taskManifest.targets) delete taskManifest.targets.solution;
      taskManifest.$schema = path.relative(
        path.dirname(taskFile),
        path.join(packageRoot, "schemas", "task.schema.json"),
      ).replaceAll("\\", "/");
      await writeFile(taskFile, `${JSON.stringify(taskManifest, null, 2)}\n`, "utf8");
    }
    const presetsPath = path.join(packageRoot, "CMakePresets.json");
    const presets = JSON.parse(await readFile(presetsPath, "utf8"));
    for (const key of ["configurePresets", "buildPresets", "testPresets"]) {
      presets[key] = presets[key]?.filter((preset) => preset.name === "student");
    }
    await writeFile(presetsPath, `${JSON.stringify(presets, null, 2)}\n`, "utf8");
  }
  await cp(path.resolve(import.meta.dirname), path.join(packageRoot, "tools", "lab"), {
    recursive: true,
    filter: packageFilter,
  });
  await writeFile(path.join(packageRoot, "package.json"), `${JSON.stringify({
    name: `${path.basename(lab.labRoot)}-student`,
    private: true,
    type: "module",
    scripts: {
      "lab:doctor": "node tools/lab/cli.mjs doctor",
      "lab:validate": "node tools/lab/cli.mjs validate",
      "lab:build": "node tools/lab/cli.mjs build",
      "lab:run": "node tools/lab/cli.mjs run",
      "lab:interactive": "node tools/lab/cli.mjs interactive",
      "lab:score": "node tools/lab/cli.mjs score",
      "lab:clean": "node tools/lab/cli.mjs clean"
    }
  }, null, 2)}\n`, "utf8");
  return { packageRoot };
}

export async function cleanLab(lab) {
  const root = path.resolve(lab.labRoot);
  const caches = new Set([path.join(root, ".lab-cache")]);
  for (const task of lab.tasks ?? []) caches.add(path.join(path.resolve(task.taskPath), ".lab-cache"));
  for (const cache of caches) {
    const relative = path.relative(root, cache);
    if (relative.startsWith(`..${path.sep}`) || relative === ".." || path.isAbsolute(relative) || path.basename(cache) !== ".lab-cache") {
      throw new LabError("CLEAN_REFUSED", `拒绝清理 Lab 根目录之外的路径：${cache}`);
    }
  }
  await Promise.all([...caches].map((cache) => rm(cache, { recursive: true, force: true })));
  return { cache: path.join(root, ".lab-cache"), caches: [...caches] };
}
