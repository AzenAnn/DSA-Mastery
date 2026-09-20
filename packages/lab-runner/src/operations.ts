import type { JudgeResult } from "./judge.ts";
import type { CompareDifference, ExecutableLab, LoadedProgramLab } from "@dsa/lab-core";
import { cp, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  compareOutput,
  isProgramLab,
  isProjectLab,
  LabError,
  normalizeNewlines,
  pathExists,
  requireRepoRoot,
  runProcess,
  STANDALONE_CLI_FILENAME,
  STANDALONE_MAKEFILE,
} from "@dsa/lab-core";
import { compileTarget } from "./compiler.ts";
import { judgeProgram } from "./judge.ts";

export interface ExpectedChange {
  id: string;
  expected: string;
  difference: CompareDifference;
  diff: string;
}

export interface RefreshResult {
  changed: number;
  written: number;
  changes: ExpectedChange[];
}

export interface VerifyResult {
  ok: boolean;
  checks: Record<string, boolean>;
  drift: RefreshResult;
  solution: JudgeResult;
  student: JudgeResult;
}

export function previewDiff(previous: string, next: string): string {
  const before = previous.replace(/\r\n?/g, "\n").split("\n");
  const after = next.replace(/\r\n?/g, "\n").split("\n");
  const lines: string[] = [];
  for (let index = 0; index < Math.max(before.length, after.length) && lines.length < 12; index += 1) {
    if (before[index] === after[index]) continue;
    lines.push(`@@ line ${index + 1} @@`);
    lines.push(`- ${before[index] ?? "<end of file>"}`);
    lines.push(`+ ${after[index] ?? "<end of file>"}`);
  }

  return lines.join("\n");
}

export async function refreshExpected(lab: LoadedProgramLab, write = false): Promise<RefreshResult> {
  if (!lab.manifest.targets.solution) throw new LabError("SOLUTION_UNAVAILABLE", "学生分发包不包含参考实现");
  const compilation = await compileTarget(lab, "solution");
  if (!compilation.ok)
    throw new LabError("SOLUTION_CE", `参考实现编译失败：\n${compilation.stderr || compilation.stdout}`);
  const changes: ExpectedChange[] = [];
  for (const testCase of lab.cases) {
    const input = await readFile(path.resolve(lab.labRoot, testCase.input), "utf8");
    const result = await runProcess(compilation.executable, [], {
      cwd: lab.labRoot,
      input,
      timeMs: testCase.timeMs ?? lab.manifest.judge.limits?.timeMs ?? 2000,
      outputKb: testCase.outputKb ?? lab.manifest.judge.limits?.outputKb ?? 1024,
    });
    if (result.spawnError || result.timedOut || result.outputExceeded || result.code !== 0) {
      const reason = result.timedOut ? "TLE" : result.outputExceeded ? "OLE" : "RE";
      throw new LabError("SOLUTION_FAILED", `参考实现未能生成 ${testCase.id}：${reason}`);
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

export async function verifyProgram(lab: LoadedProgramLab): Promise<VerifyResult> {
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

const PACK_BINARY = /\.(?:exe|o|obj|a|lib|so|dylib|dll|pdb)$/i;

function packageFilter(source: string): boolean {
  const parts = path
    .resolve(source)
    .split(path.sep)
    .map((part) => part.toLocaleLowerCase());

  return (
    !parts.includes("solution") &&
    !parts.includes(".lab-cache") &&
    !parts.includes("node_modules") &&
    !PACK_BINARY.test(path.basename(source))
  );
}

async function copyPackageEntry(
  lab: ExecutableLab,
  packageRoot: string,
  relative: string,
  required = false,
): Promise<boolean> {
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

async function rewriteTaskManifests(packageRoot: string): Promise<void> {
  const taskFiles: string[] = [];
  async function collect(root: string): Promise<void> {
    for (const entry of await readdir(root, { withFileTypes: true })) {
      const target = path.join(root, entry.name);
      if (entry.isDirectory()) await collect(target);
      else if (entry.name === "task.json") taskFiles.push(target);
    }
  }
  await collect(packageRoot);
  for (const taskFile of taskFiles) {
    const taskManifest = JSON.parse(await readFile(taskFile, "utf8")) as {
      targets?: Record<string, unknown>;
      $schema?: string;
    };
    if (taskManifest.targets !== undefined) delete taskManifest.targets.solution;
    taskManifest.$schema = path
      .relative(path.dirname(taskFile), path.join(packageRoot, "schemas", "task.schema.json"))
      .replaceAll("\\", "/");
    await writeFile(taskFile, `${JSON.stringify(taskManifest, null, 2)}\n`, "utf8");
  }
}

const STUDENT_COMMANDS = ["doctor", "validate", "build", "run", "interactive", "score", "clean"] as const;

export async function packStudent(lab: ExecutableLab): Promise<{ packageRoot: string }> {
  // schemas 和判题内核产物属于工具自身所在的仓库，与被打包的 Lab 放在哪里无关。
  const repoRoot = await requireRepoRoot(import.meta.dirname);
  const packageRoot = path.join(lab.labRoot, ".lab-cache", "packages", `${path.basename(lab.labRoot)}-student`);
  await rm(packageRoot, { recursive: true, force: true });
  await mkdir(packageRoot, { recursive: true });

  const requiredEntries = new Set(["README.md"]);
  const optionalEntries = new Set<string>();
  if (isProgramLab(lab)) {
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

  const manifest = structuredClone(lab.manifest) as unknown as Record<string, unknown> & {
    targets?: Record<string, unknown>;
  };
  manifest.distribution = "student";
  manifest.$schema = "schemas/lab.schema.json";
  if (manifest.targets !== undefined) delete manifest.targets.solution;
  await writeFile(path.join(packageRoot, "lab.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  await writeFile(path.join(packageRoot, "Makefile"), STANDALONE_MAKEFILE, "utf8");
  await cp(path.join(repoRoot, "schemas"), path.join(packageRoot, "schemas"), { recursive: true });
  if (isProjectLab(lab)) await rewriteTaskManifests(packageRoot);

  // 学生包自带整个判题内核：单个打包产物 + lab.mk，不依赖仓库布局，也不需要 node_modules。
  const cliBundle = path.join(repoRoot, "packages", "lab-cli", "dist", "cli.js");
  if (!(await pathExists(cliBundle))) {
    throw new LabError("CLI_BUNDLE_MISSING", `缺少判题内核构建产物：${cliBundle}；请先运行 pnpm -r build`);
  }
  await cp(cliBundle, path.join(packageRoot, STANDALONE_CLI_FILENAME));
  await cp(path.join(repoRoot, "packages", "lab-cli", "lab.mk"), path.join(packageRoot, "lab.mk"));
  await writeFile(
    path.join(packageRoot, "package.json"),
    `${JSON.stringify(
      {
        name: `${path.basename(lab.labRoot)}-student`,
        private: true,
        type: "module",
        scripts: Object.fromEntries(
          STUDENT_COMMANDS.map((command) => [`lab:${command}`, `node ${STANDALONE_CLI_FILENAME} ${command}`]),
        ),
      },
      null,
      2,
    )}\n`,
    "utf8",
  );

  return { packageRoot };
}

export async function cleanLab(lab: {
  labRoot: string;
  tasks?: { taskPath: string }[];
}): Promise<{ cache: string; caches: string[] }> {
  const root = path.resolve(lab.labRoot);
  const caches = new Set([path.join(root, ".lab-cache")]);
  for (const task of lab.tasks ?? []) caches.add(path.join(path.resolve(task.taskPath), ".lab-cache"));
  for (const cache of caches) {
    const relative = path.relative(root, cache);
    if (
      relative.startsWith(`..${path.sep}`) ||
      relative === ".." ||
      path.isAbsolute(relative) ||
      path.basename(cache) !== ".lab-cache"
    ) {
      throw new LabError("CLEAN_REFUSED", `拒绝清理 Lab 根目录之外的路径：${cache}`);
    }
  }
  await Promise.all([...caches].map((cache) => rm(cache, { recursive: true, force: true })));

  return { cache: path.join(root, ".lab-cache"), caches: [...caches] };
}
