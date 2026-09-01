import assert from "node:assert/strict";
import { execFile as execFileCallback } from "node:child_process";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
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
