import type { ExecutableLab } from "@dsa/lab-core";
import { cp, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  isProgramLab,
  isProjectLab,
  LabError,
  pathExists,
  requireRepoRoot,
  STANDALONE_CLI_FILENAME,
  STANDALONE_MAKEFILE,
} from "@dsa/lab-core";

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
    if (taskManifest.targets !== undefined) delete taskManifest.targets["solution"];
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
  manifest["distribution"] = "student";
  manifest["$schema"] = "schemas/lab.schema.json";
  if (manifest.targets !== undefined) delete manifest.targets["solution"];
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
