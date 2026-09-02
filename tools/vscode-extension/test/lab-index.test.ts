import assert from "node:assert/strict";
import { execFile as execFileCallback } from "node:child_process";
import { mkdtemp, mkdir, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { promisify } from "node:util";
import { fileURLToPath, pathToFileURL } from "node:url";

const execFile = promisify(execFileCallback);
const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function loadLabIndex(): Promise<typeof import("../src/labIndex.ts")> {
  const buildRoot = await mkdtemp(path.join(tmpdir(), "dsa-lab-index-build-"));
  const bundlePath = path.join(buildRoot, "labIndex.cjs");
  try {
    await execFile(path.join(packageRoot, "node_modules", "esbuild", "bin", "esbuild"), [
      "src/labIndex.ts",
      "--bundle",
      "--platform=node",
      "--format=cjs",
      `--outfile=${bundlePath}`,
    ], { cwd: packageRoot });
    return await import(pathToFileURL(bundlePath).href) as typeof import("../src/labIndex.ts");
  } finally {
    // The imported CommonJS bundle is self-contained; its temporary directory can be removed
    // after loading so the test never leaves generated files in the repository.
    await rm(buildRoot, { recursive: true, force: true });
  }
}

async function writeLab(
  repoRoot: string,
  relativeDir: string,
  frontmatter: Record<string, string | number>,
  manifest: Record<string, unknown>,
  extraFiles: Record<string, string> = {},
): Promise<void> {
  const labRoot = path.join(repoRoot, relativeDir);
  await mkdir(labRoot, { recursive: true });
  const front = Object.entries(frontmatter)
    .map(([key, value]) => `${key}: ${typeof value === "string" ? JSON.stringify(value) : value}`)
    .join("\n");
  await writeFile(path.join(labRoot, "README.md"), `---\n${front}\n---\n\n# ${frontmatter.title}\n`, "utf8");
  await writeFile(path.join(labRoot, "lab.json"), JSON.stringify(manifest), "utf8");
  await Promise.all(
    Object.entries(extraFiles).map(async ([relativePath, content]) => {
      const filePath = path.join(labRoot, relativePath);
      await mkdir(path.dirname(filePath), { recursive: true });
      await writeFile(filePath, content, "utf8");
    }),
  );
}

const quizManifest = { type: "quiz", quiz: { questions: "quiz.json" } };
const programManifest = {
  type: "program",
  targets: { student: { sources: ["student/main.cpp"] } },
  judge: { cases: "tests/cases.json" },
};
const quizData = JSON.stringify([
  { id: "q1", stem: "题面", options: ["A", "B", "C", "D"], answer: 0, explanation: "解析" },
]);

test("discovers PR#122 category labs and keeps a legacy flat lab readable", async () => {
  const { discoverProgramLabs } = await loadLabIndex();
  const repoRoot = await mkdtemp(path.join(tmpdir(), "dsa-lab-index-"));
  try {
    await mkdir(path.join(repoRoot, "labs", "chapter-01", "project"), { recursive: true });
    await writeLab(
      repoRoot,
      "labs/chapter-01/theory/T-01-01-sequential-list-quiz",
      { title: "Lab 01-T-01：顺序表选择题", description: "理论", order: 1, chapter: 1, chapterTitle: "线性表", labId: "01T01" },
      quizManifest,
      { "quiz.json": quizData },
    );
    await writeLab(
      repoRoot,
      "labs/chapter-01/exercise/E-01-01-sequential-list",
      { title: "Lab 01-E-01：顺序表练习", description: "练习", order: 2, chapter: 1, chapterTitle: "线性表", labId: "01E01" },
      programManifest,
      { "student/main.cpp": "int main() {}", "tests/cases.json": "[]" },
    );
    await writeLab(
      repoRoot,
      "labs/chapter-01/project/P-01-01-list-project",
      { title: "Lab 01-P-01：顺序表项目", description: "项目", order: 3, chapter: 1, chapterTitle: "线性表", labId: "01P01" },
      programManifest,
      { "student/main.cpp": "int main() {}", "tests/cases.json": "[]" },
    );
    await writeLab(
      repoRoot,
      "labs/chapter-01/project/P-01-02-manual-review",
      { title: "Lab 01-P-02：人工评审项目", description: "人工评审", order: 4, chapter: 1, chapterTitle: "线性表", labId: "01P02" },
      { type: "project", tasks: [{ id: "review", kind: "manual" }] },
    );
    await writeLab(
      repoRoot,
      "labs/chapter-01/lab-01-09-legacy-quiz",
      { title: "旧目录选择题", description: "兼容", order: 9, chapter: 1, chapterTitle: "线性表" },
      quizManifest,
      { "quiz.json": quizData },
    );
    await writeLab(
      repoRoot,
      "labs/chapter-01/exercise/readme-only",
      { title: "不是可作答题", description: "过滤", order: 10, chapter: 1, chapterTitle: "线性表" },
      {},
    );

    const chapters = await discoverProgramLabs(repoRoot);
    const labs = chapters.flatMap((chapter) => chapter.labs);

    assert.deepEqual(labs.map((lab) => lab.id), ["01T01", "01E01", "01P01", "lab-01-09-legacy-quiz"]);
    assert.deepEqual(labs.map((lab) => lab.name), [
      "T-01-01-sequential-list-quiz",
      "E-01-01-sequential-list",
      "P-01-01-list-project",
      "lab-01-09-legacy-quiz",
    ]);
    assert.deepEqual(labs[1]?.legacyNames, ["lab-01-02-sequential-list"]);
    assert.match(labs[1]?.relativePath ?? "", /^labs\/chapter-01\/exercise\//);
  } finally {
    await rm(repoRoot, { recursive: true, force: true });
  }
});

test("discovers project task metadata, cases, ctest names, and student files", async () => {
  const { discoverProgramLabs } = await loadLabIndex();
  const repoRoot = await mkdtemp(path.join(tmpdir(), "dsa-lab-project-index-"));
  try {
    await writeLab(
      repoRoot,
      "labs/chapter-01/project/P-01-02-workload-analyzer",
      { title: "Lab 01-P-02：工作负载分析器", description: "项目", order: 2, chapter: 1, chapterTitle: "线性表", labId: "01P02" },
      {
        schemaVersion: 1,
        type: "project",
        language: "cpp",
        toolchain: { standard: "c++17", profile: "course-default" },
        buildSystem: "cmake",
        tasks: [
          { id: "sequential", path: "tasks/sequential", weight: 30, kind: "stdio", dependsOn: [] },
          { id: "linked", path: "tasks/linked", weight: 50, kind: "ctest", dependsOn: ["sequential"] },
          { id: "report", path: "tasks/report", weight: 20, kind: "manual", dependsOn: ["linked"] },
        ],
      },
      {
        "tasks/sequential/task.json": JSON.stringify({
          schemaVersion: 1,
          id: "sequential",
          kind: "stdio",
          targets: { student: { sources: ["student/main.cpp"] } },
          judge: { kind: "stdio", cases: "tests/cases.json" },
        }),
        "tasks/sequential/tests/cases.json": JSON.stringify([
          { id: "small", input: "tests/small.in", expected: "tests/small.out", points: 40 },
          { id: "large", input: "tests/large.in", expected: "tests/large.out", points: 60 },
        ]),
        "tasks/sequential/tests/small.in": "3\n",
        "tasks/sequential/tests/small.out": "6\n",
        "tasks/sequential/tests/large.in": "5\n",
        "tasks/sequential/tests/large.out": "15\n",
        "tasks/sequential/student/main.cpp": "int main() {}\n",
        "tasks/linked/task.json": JSON.stringify({
          schemaVersion: 1,
          id: "linked",
          kind: "ctest",
          ctest: { tests: [{ name: "linked_basic", points: 50 }, { name: "linked_edge", points: 50 }] },
        }),
        "tasks/linked/student/linked.cpp": "// student implementation\n",
        "tasks/report/task.json": JSON.stringify({
          schemaVersion: 1,
          id: "report",
          kind: "manual",
          checklist: ["复杂度分析", "实验报告"],
        }),
        "tasks/report/student/report.md": "# Report\n",
      },
    );

    const labs = (await discoverProgramLabs(repoRoot)).flatMap((chapter) => chapter.labs);
    const project = labs.find((lab) => lab.id === "01P02");

    assert.ok(project);
    assert.equal(project?.type, "project");
    if (project?.type !== "project") return;

    assert.equal(project.buildSystem, "cmake");
    assert.deepEqual(project.tasks.map((task) => [task.id, task.kind, task.weight]), [
      ["sequential", "stdio", 30],
      ["linked", "ctest", 50],
      ["report", "manual", 20],
    ]);
    assert.deepEqual(project.tasks[0]?.cases?.map((testCase) => testCase.id), ["small", "large"]);
    assert.deepEqual(project.tasks[1]?.ctestTests?.map((testCase) => testCase.name), ["linked_basic", "linked_edge"]);
    assert.deepEqual(project.tasks[2]?.checklist, ["复杂度分析", "实验报告"]);
    assert.deepEqual(project.studentFiles.map((file) => file.relativePath).sort(), [
      "tasks/linked/student/linked.cpp",
      "tasks/report/student/report.md",
      "tasks/sequential/student/main.cpp",
    ]);
  } finally {
    await rm(repoRoot, { recursive: true, force: true });
  }
});

test("does not follow a project student directory symlink", async () => {
  if (process.platform === "win32") return;

  const { discoverProgramLabs } = await loadLabIndex();
  const repoRoot = await mkdtemp(path.join(tmpdir(), "dsa-lab-project-symlink-"));
  const outsideRoot = await mkdtemp(path.join(tmpdir(), "dsa-lab-project-outside-"));
  try {
    await writeLab(
      repoRoot,
      "labs/chapter-01/project/P-01-03-symlink",
      { title: "Project", description: "安全边界", order: 3, chapter: 1, chapterTitle: "线性表", labId: "01P03" },
      {
        schemaVersion: 1,
        type: "project",
        language: "cpp",
        toolchain: { standard: "c++17" },
        buildSystem: "cmake",
        tasks: [{ id: "review", path: "tasks/review", weight: 100, kind: "manual", dependsOn: [] }],
      },
      { "tasks/review/task.json": JSON.stringify({ schemaVersion: 1, kind: "manual", checklist: ["检查"] }) },
    );
    await writeFile(path.join(outsideRoot, "secret.cpp"), "should not be discovered\n", "utf8");
    await symlink(outsideRoot, path.join(repoRoot, "labs/chapter-01/project/P-01-03-symlink/tasks/review/student"), "dir");

    const labs = (await discoverProgramLabs(repoRoot)).flatMap((chapter) => chapter.labs);
    const project = labs.find((lab) => lab.id === "01P03");

    assert.ok(project);
    assert.equal(project?.type, "project");
    if (project?.type !== "project") return;
    assert.deepEqual(project.studentFiles, []);
  } finally {
    await rm(repoRoot, { recursive: true, force: true });
    await rm(outsideRoot, { recursive: true, force: true });
  }
});

test("discovers all real Project labs in the repository", async () => {
  const { discoverProgramLabs } = await loadLabIndex();
  const repoRoot = path.resolve(packageRoot, "../..");
  const projects = (await discoverProgramLabs(repoRoot))
    .flatMap((chapter) => chapter.labs)
    .filter((lab) => lab.type === "project");

  assert.deepEqual(projects.map((lab) => lab.id), ["01P01", "03P01", "03P02", "08P01", "09P01"]);
  assert.deepEqual(projects.map((lab) => lab.relativePath), [
    "labs/chapter-01/project/P-01-01-list-workload-analyzer",
    "labs/chapter-03/project/P-03-01-string-match-engine",
    "labs/chapter-03/project/P-03-02-sparse-matrix-library",
    "labs/chapter-08/project/P-08-01-avl-tree-rotations",
    "labs/chapter-09/project/P-09-01-hash-index-engine",
  ]);
});

test("prefers the categorized lab when a transition checkout contains its old flat copy", async () => {
  const { discoverProgramLabs } = await loadLabIndex();
  const repoRoot = await mkdtemp(path.join(tmpdir(), "dsa-lab-index-"));
  try {
    await writeLab(
      repoRoot,
      "labs/chapter-01/exercise/E-01-01-sequential-list",
      { title: "Lab 01-E-01：顺序表练习", description: "新目录", order: 6, chapter: 1, chapterTitle: "线性表", labId: "01E01" },
      programManifest,
      { "student/main.cpp": "int main() {}", "tests/cases.json": "[]" },
    );
    await writeLab(
      repoRoot,
      "labs/chapter-01/lab-01-06-sequential-list",
      { title: "Lab 01-06：顺序表练习", description: "旧目录", order: 6, chapter: 1, chapterTitle: "线性表" },
      programManifest,
      { "student/main.cpp": "int main() {}", "tests/cases.json": "[]" },
    );

    const labs = (await discoverProgramLabs(repoRoot)).flatMap((chapter) => chapter.labs);

    assert.equal(labs.length, 1);
    assert.equal(labs[0]?.id, "01E01");
    assert.match(labs[0]?.relativePath ?? "", /\/exercise\/E-01-01-sequential-list$/);
  } finally {
    await rm(repoRoot, { recursive: true, force: true });
  }
});
