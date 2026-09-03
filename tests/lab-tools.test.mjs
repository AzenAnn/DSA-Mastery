import assert from "node:assert/strict";
import { access, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { compareOutput } from "../tools/lab/compare.mjs";
import { selectCompiler } from "../tools/lab/compiler.mjs";
import { findLabRoot, loadLab, resolveLabPath, validateQuizQuestions, validateQuizReadme } from "../tools/lab/core.mjs";
import { classifyExecution, judgeProgram } from "../tools/lab/judge.mjs";
import {
  allocateLabIdentity,
  formatLabDocumentTitlePrefix,
  insertLabIdFrontmatter,
  locateLabById,
  normalizeLabId,
  parseLabId,
  scanLabRecords,
} from "../tools/lab/identity.mjs";
import { runProcess } from "../tools/lab/process.mjs";
import { createLab, THIN_MAKEFILE } from "../tools/lab/scaffold.mjs";
import { cleanLab, packStudent, previewDiff, refreshExpected } from "../tools/lab/operations.mjs";
import { classifyCtestExecution, cmakeStandardNumber, projectHasInternalError } from "../tools/lab/project.mjs";

const projectRoot = path.resolve(import.meta.dirname, "..");

async function fixture(manifest, extra = {}) {
  const root = await mkdtemp(path.join(os.tmpdir(), "dsa lab tools "));
  await writeFile(path.join(root, "lab.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  const files = {
    "README.md": manifest.type === "quiz" ? "# Quiz\n\n<QuizSet />\n" : "# Executable Lab\n",
    ...extra,
  };
  for (const [relative, content] of Object.entries(files)) {
    const file = path.join(root, relative);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, content);
  }
  return root;
}

test("findLabRoot finds the nearest manifest from a nested path containing spaces", async (t) => {
  const root = await fixture({ schemaVersion: 1, type: "quiz", quiz: { questions: "quiz.json" } }, {
    "quiz.json": JSON.stringify([{ id: "q1", stem: "题面", options: ["一", "二", "三", "四"], answer: 0, explanation: "解析" }]),
  });
  t.after(() => rm(root, { recursive: true, force: true }));
  const nested = path.join(root, "nested path", "deeper");
  await mkdir(nested, { recursive: true });
  assert.equal(await findLabRoot(nested), root);
});

test("loadLab rejects an unknown schema major version", async (t) => {
  const root = await fixture({ schemaVersion: 2, type: "quiz", quiz: { questions: "quiz.json" } });
  t.after(() => rm(root, { recursive: true, force: true }));
  await assert.rejects(loadLab(root), (error) => error.code === "SCHEMA_VERSION");
});

test("loadLab rejects paths escaping the lab root", async (t) => {
  const root = await fixture({ schemaVersion: 1, type: "quiz", quiz: { questions: "../quiz.json" } });
  t.after(() => rm(root, { recursive: true, force: true }));
  await assert.rejects(loadLab(root), (error) => error.code === "PATH_ESCAPE");
});

test("path resolution rejects absolute paths", async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "dsa absolute path "));
  t.after(() => rm(root, { recursive: true, force: true }));
  const outside = path.resolve(root, "file.txt");
  await writeFile(outside, "fixture");
  await assert.rejects(resolveLabPath(root, outside, "absolute fixture"), (error) => error.code === "PATH_ESCAPE");
});

test("loadLab rejects a symbolic link escaping the lab root", async (t) => {
  const outside = await mkdtemp(path.join(os.tmpdir(), "dsa outside "));
  const root = await fixture({ schemaVersion: 1, type: "quiz", quiz: { questions: "linked-quiz.json" } });
  t.after(() => Promise.all([rm(root, { recursive: true, force: true }), rm(outside, { recursive: true, force: true })]));
  const outsideFile = path.join(outside, "quiz.json");
  await writeFile(outsideFile, JSON.stringify([{ id: "q1", stem: "题", options: ["一", "二", "三", "四"], answer: 0, explanation: "解" }]));
  try {
    await symlink(outsideFile, path.join(root, "linked-quiz.json"), "file");
  } catch (error) {
    if (error.code === "EPERM") {
      t.skip("当前 Windows 策略不允许创建测试符号链接");
      return;
    }
    throw error;
  }
  await assert.rejects(loadLab(root), (error) => error.code === "PATH_ESCAPE");
});

test("program cases must total exactly 100 points", async (t) => {
  const manifest = {
    schemaVersion: 1,
    type: "program",
    language: "cpp",
    toolchain: { standard: "c++17" },
    targets: { student: { sources: ["student/main.cpp"] }, solution: { sources: ["solution/main.cpp"] } },
    judge: { kind: "stdio", cases: "tests/cases.json" },
  };
  const root = await fixture(manifest, {
    "student/main.cpp": "int main(){}",
    "solution/main.cpp": "int main(){}",
    "tests/input.in": "",
    "tests/output.out": "",
    "tests/cases.json": JSON.stringify([{ id: "sample", input: "tests/input.in", expected: "tests/output.out", points: 99 }]),
  });
  t.after(() => rm(root, { recursive: true, force: true }));
  await assert.rejects(loadLab(root), (error) => error.code === "CASES_POINTS");
});

test("project dependencies must be acyclic", async (t) => {
  const manifest = {
    schemaVersion: 1,
    type: "project",
    language: "cpp",
    toolchain: { standard: "c++17" },
    buildSystem: "cmake",
    tasks: [
      { id: "first", path: "tasks/first", weight: 50, kind: "manual", dependsOn: ["second"] },
      { id: "second", path: "tasks/second", weight: 50, kind: "manual", dependsOn: ["first"] },
    ],
  };
  const root = await fixture(manifest, { "tasks/first/.keep": "", "tasks/second/.keep": "" });
  t.after(() => rm(root, { recursive: true, force: true }));
  await assert.rejects(loadLab(root), (error) => error.code === "TASK_CYCLE");
});

test("project validation rejects bad total weights and missing dependencies", async (t) => {
  const base = {
    schemaVersion: 1,
    type: "project",
    language: "cpp",
    toolchain: { standard: "c++17" },
    buildSystem: "cmake",
  };
  const weights = await fixture({
    ...base,
    tasks: [{ id: "report", path: "report", weight: 99, kind: "manual", dependsOn: [] }],
  }, { "Makefile": THIN_MAKEFILE, "report/task.json": JSON.stringify({ schemaVersion: 1, kind: "manual", checklist: ["review"] }) });
  const dependency = await fixture({
    ...base,
    tasks: [{ id: "report", path: "report", weight: 100, kind: "manual", dependsOn: ["missing"] }],
  }, { "Makefile": THIN_MAKEFILE, "report/task.json": JSON.stringify({ schemaVersion: 1, kind: "manual", checklist: ["review"] }) });
  t.after(() => Promise.all([rm(weights, { recursive: true, force: true }), rm(dependency, { recursive: true, force: true })]));
  await assert.rejects(loadLab(weights), (error) => error.code === "TASK_WEIGHTS");
  await assert.rejects(loadLab(dependency), (error) => error.code === "TASK_DEPENDENCY");
});

test("executable labs reject a forked thin Makefile", async (t) => {
  const manifest = {
    schemaVersion: 1,
    type: "program",
    language: "cpp",
    toolchain: { standard: "c++17" },
    targets: { student: { sources: ["student/main.cpp"] }, solution: { sources: ["solution/main.cpp"] } },
    judge: { kind: "stdio", cases: "tests/cases.json" },
  };
  const root = await fixture(manifest, {
    "Makefile": "run:\n\techo forked\n",
    "student/main.cpp": "int main(){}",
    "solution/main.cpp": "int main(){}",
    "tests/input.in": "",
    "tests/output.out": "",
    "tests/cases.json": JSON.stringify([{ id: "sample", input: "tests/input.in", expected: "tests/output.out", points: 100 }]),
  });
  t.after(() => rm(root, { recursive: true, force: true }));
  await assert.rejects(loadLab(root), (error) => error.code === "MAKEFILE_DRIFT");
});

test("quiz contract rejects authored option labels and duplicate options", () => {
  assert.throws(() => validateQuizQuestions([{ id: "q1", stem: "题", options: ["A. 一", "二", "三", "四"], answer: 0, explanation: "解" }]), /不要手写/);
  assert.throws(() => validateQuizQuestions([{ id: "q1", stem: "题", options: ["一", "一", "三", "四"], answer: 0, explanation: "解" }]), /重复选项/);
});

test("quiz contract rejects wrong option counts, answer indexes, duplicate IDs, and README answer copies", () => {
  const valid = { id: "q1", stem: "题", options: ["一", "二", "三", "四"], answer: 0, explanation: "解" };
  assert.throws(() => validateQuizQuestions([{ ...valid, options: ["一", "二", "三"] }]), /恰好包含 4 项/);
  assert.throws(() => validateQuizQuestions([{ ...valid, answer: 4 }]), /0～3/);
  assert.throws(() => validateQuizQuestions([valid, { ...valid }]), /id q1 重复/);
  assert.throws(() => validateQuizReadme("# Quiz\n\n<QuizSet />\n\n## 答案速查\n"), /不得重复维护/);
  assert.throws(() => validateQuizReadme("# Quiz\n\n<QuizSet />\n\n## 标准答案\n\n| 题号 | 答案 |\n| --- | --- |\n| 1 | A |\n"), /不得重复维护/);
  assert.throws(() => validateQuizReadme("# Quiz\n"), /必须且只能挂载一次/);
});

test("output comparators normalize CRLF and support exact, tokens, and float tolerances", () => {
  assert.equal(compareOutput("a\r\nb\r\n", "a\nb\n", { mode: "exact" }).equal, true);
  assert.equal(compareOutput("1  2\n3", "1\n2 3\n", { mode: "tokens" }).equal, true);
  assert.equal(compareOutput("value 1.0000", "value 1.0009", { mode: "float", absTol: 0.001, relTol: 0 }).equal, true);
  const mismatch = compareOutput("one two", "one three", { mode: "tokens" });
  assert.deepEqual(mismatch.difference, { kind: "token", index: 2, expected: "two", actual: "three" });
});

test("exact comparison ignores line-end horizontal whitespace without hiding other differences", () => {
  assert.equal(compareOutput("42\n", "42", { mode: "exact" }).equal, true);
  assert.equal(compareOutput("42", "42\n", { mode: "exact" }).equal, true);
  assert.equal(compareOutput("1 2 3\n4 5\n", "1 2 3 \n4 5\n", { mode: "exact" }).equal, true);
  assert.equal(compareOutput("1 2\n3", "1 2  \t\n3\t", { mode: "exact" }).equal, true);
  assert.equal(
    classifyExecution(
      { code: 0, stdout: "1 2 3 \n4 5\n", stderr: "", timedOut: false, outputExceeded: false },
      "1 2 3\n4 5\n",
      { mode: "exact" },
    ).verdict,
    "AC",
  );
  assert.equal(compareOutput("42\n\n", "42\n", { mode: "exact" }).equal, false);
  assert.equal(compareOutput("42\n", "42\nextra\n", { mode: "exact" }).equal, false);
  assert.equal(compareOutput("42\n43", "4243", { mode: "exact" }).equal, false);
  assert.equal(compareOutput("1  2", "1 2", { mode: "exact" }).equal, false);
  assert.equal(compareOutput(" 42", "42", { mode: "exact" }).equal, false);
  assert.deepEqual(compareOutput("1 2\n3", "1 2 \n4", { mode: "exact" }).difference, {
    kind: "character",
    index: 4,
    line: 2,
    column: 1,
    expected: "1 2\\n3",
    actual: "1 2\\n4",
  });
});

test("expected-output refresh renders a reviewable line diff", () => {
  assert.equal(previewDiff("one\ntwo\n", "one\nthree\n"), "@@ line 2 @@\n- two\n+ three");
});

test("expected-output refresh is preview-only until --write and clean preserves sources", async (t) => {
  const manifest = {
    schemaVersion: 1,
    type: "program",
    language: "cpp",
    toolchain: { standard: "c++17" },
    targets: { student: { sources: ["student/main.cpp"] }, solution: { sources: ["solution/main.cpp"] } },
    judge: { kind: "stdio", cases: "tests/cases.json", compare: { mode: "exact" } },
  };
  const root = await fixture(manifest, {
    "Makefile": THIN_MAKEFILE,
    "student/main.cpp": "int main() { return 0; }\n",
    "solution/main.cpp": "#include <iostream>\nint main() { std::cout << \"new\\n\"; }\n",
    "tests/cases.json": JSON.stringify([{ id: "sample", input: "tests/sample.in", expected: "tests/sample.out", points: 100 }]),
    "tests/sample.in": "",
    "tests/sample.out": "old\n",
  });
  t.after(() => rm(root, { recursive: true, force: true }));
  const lab = await loadLab(root);
  const preview = await refreshExpected(lab, false);
  assert.equal(preview.changed, 1);
  assert.equal(preview.written, 0);
  assert.equal(await readFile(path.join(root, "tests", "sample.out"), "utf8"), "old\n");
  const written = await refreshExpected(lab, true);
  assert.equal(written.written, 1);
  assert.equal(await readFile(path.join(root, "tests", "sample.out"), "utf8"), "new\n");
  await cleanLab(lab);
  await assert.rejects(access(path.join(root, ".lab-cache")));
  assert.match(await readFile(path.join(root, "student", "main.cpp"), "utf8"), /int main/);
  assert.match(await readFile(path.join(root, "solution", "main.cpp"), "utf8"), /std::cout/);
});

test("execution classification covers AC, WA, TLE, RE, OLE, and IE", () => {
  const base = { code: 0, stdout: "ok\n", stderr: "", timedOut: false, outputExceeded: false };
  assert.equal(classifyExecution(base, "ok\r\n", { mode: "exact" }).verdict, "AC");
  assert.equal(classifyExecution(base, "different", { mode: "exact" }).verdict, "WA");
  assert.equal(classifyExecution({ ...base, timedOut: true }, "", { mode: "exact" }).verdict, "TLE");
  assert.equal(classifyExecution({ ...base, code: 3 }, "", { mode: "exact" }).verdict, "RE");
  assert.equal(classifyExecution({ ...base, outputExceeded: true }, "", { mode: "exact" }).verdict, "OLE");
  assert.equal(classifyExecution({ ...base, spawnError: new Error("missing") }, "", { mode: "exact" }).verdict, "IE");
});

test("project scoring promotes nested IE verdicts to a tool error", () => {
  assert.equal(projectHasInternalError([{ id: "stdio", status: "WA", judge: { cases: [{ verdict: "IE" }] } }]), true);
  assert.equal(projectHasInternalError([{ id: "ctest", status: "IE", tests: [] }]), true);
  assert.equal(projectHasInternalError([{ id: "ok", status: "AC", tests: [{ verdict: "AC" }] }]), false);
});

test("CTest zero-match and infrastructure failures never receive AC", () => {
  const base = { code: 0, stdout: "", stderr: "", timedOut: false, outputExceeded: false };
  assert.equal(classifyCtestExecution({ ...base, stdout: "No tests were found!!!" }), "IE");
  assert.equal(classifyCtestExecution({ ...base, spawnError: new Error("missing") }), "IE");
  assert.equal(classifyCtestExecution({ ...base, code: 1 }), "WA");
  assert.equal(classifyCtestExecution(base), "AC");
});

test("Project CMake standard follows the manifest override", () => {
  assert.equal(cmakeStandardNumber("c++17"), "17");
  assert.equal(cmakeStandardNumber("c++20"), "20");
  assert.throws(() => cmakeStandardNumber("c++14"), /不支持/);
});

test("Project clean removes top-level and task-local caches only", async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "dsa project clean "));
  const taskPath = path.join(root, "tasks", "implementation");
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(path.join(root, ".lab-cache"), { recursive: true });
  await mkdir(path.join(taskPath, ".lab-cache"), { recursive: true });
  await mkdir(path.join(taskPath, "student"), { recursive: true });
  await writeFile(path.join(taskPath, "student", "main.cpp"), "int main() {}\n");
  await cleanLab({ labRoot: root, tasks: [{ taskPath }] });
  await assert.rejects(access(path.join(root, ".lab-cache")));
  await assert.rejects(access(path.join(taskPath, ".lab-cache")));
  await access(path.join(taskPath, "student", "main.cpp"));
});

test("judge reports compiler errors as CE", async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "dsa ce "));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(path.join(root, "student"));
  await writeFile(path.join(root, "student", "main.cpp"), "this is not valid C++\n");
  const result = await judgeProgram({
    labRoot: root,
    manifest: {
      type: "program",
      toolchain: { standard: "c++17" },
      targets: { student: { sources: ["student/main.cpp"] } },
      judge: { kind: "stdio", compare: { mode: "exact" }, limits: { timeMs: 1000, outputKb: 64 } },
    },
    cases: [],
  });
  assert.equal(result.verdict, "CE");
  assert.equal(result.score, 0);
});

test("an unavailable CXX override produces a clear compiler error", async () => {
  const previous = process.env.CXX;
  process.env.CXX = path.join(os.tmpdir(), "definitely-missing-cxx.exe");
  try {
    await assert.rejects(selectCompiler(), (error) => error.code === "COMPILER_NOT_FOUND");
  } finally {
    if (previous === undefined) delete process.env.CXX;
    else process.env.CXX = previous;
  }
});

test("process runner enforces real timeout and output limits", async () => {
  const timeout = await runProcess(process.execPath, ["-e", "setInterval(() => {}, 1000)"], { timeMs: 100, outputKb: 64 });
  assert.equal(timeout.timedOut, true);
  const output = await runProcess(process.execPath, ["-e", "process.stdout.write('x'.repeat(4096))"], { timeMs: 2000, outputKb: 1 });
  assert.equal(output.outputExceeded, true);
});

test("process runner merges an injected toolchain environment", async () => {
  const result = await runProcess(process.execPath, ["-e", "process.stdout.write(process.env.LAB_TOOLCHAIN_MARKER)"], {
    env: { LAB_TOOLCHAIN_MARKER: "from-env" },
    timeMs: 2000,
    outputKb: 64,
  });
  assert.equal(result.code, 0);
  assert.equal(result.stdout, "from-env");
});

test("stable Lab IDs normalize common shorthand", () => {
  assert.equal(normalizeLabId("02T3"), "02T03");
  assert.equal(normalizeLabId("2t3"), "02T03");
  assert.equal(normalizeLabId("02-T-03"), "02T03");
  assert.equal(normalizeLabId("lab02-T-03"), "02T03");
  assert.deepEqual(parseLabId("02P12"), { id: "02P12", chapter: 2, tag: "P", sequence: 12 });
  assert.equal(formatLabDocumentTitlePrefix("2e3"), "Lab 02-E-03：");
  assert.throws(() => normalizeLabId("02X03"), (error) => error.code === "LAB_ID_INVALID");
  assert.throws(() => normalizeLabId("02T0"), (error) => error.code === "LAB_ID_INVALID");
});

test("Lab ID migration preserves the frontmatter line ending beside chapter", () => {
  const mixed = "---\nchapter: 2\nchapterTitle: 测试\r\n---\r\n";
  const migrated = insertLabIdFrontmatter(mixed, "2t3");
  assert.equal(migrated, "---\nchapter: 2\nlabId: \"02T03\"\nchapterTitle: 测试\r\n---\r\n");
});

test("scaffolder allocates independent type sequences and optional display order", async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "dsa scaffold "));
  t.after(() => rm(root, { recursive: true, force: true }));
  const emptyCategoryMarker = path.join(root, "labs", "chapter-02", "theory", ".gitkeep");
  await mkdir(path.dirname(emptyCategoryMarker), { recursive: true });
  await writeFile(emptyCategoryMarker, "");
  const quiz = await createLab({ type: "quiz", chapter: "2", order: "3", slug: "stack-quiz" }, root);
  await assert.rejects(access(emptyCategoryMarker), (error) => error.code === "ENOENT");
  await access(path.join(root, "labs", "chapter-02", "exercise", ".gitkeep"));
  await access(path.join(root, "labs", "chapter-02", "project", ".gitkeep"));
  const program = await createLab({ type: "program", chapter: "2", slug: "stack-run" }, root);
  await assert.rejects(
    access(path.join(root, "labs", "chapter-02", "exercise", ".gitkeep")),
    (error) => error.code === "ENOENT",
  );
  const project = await createLab({ type: "project", chapter: "2", order: "5", slug: "stack-project" }, root);
  await assert.rejects(
    access(path.join(root, "labs", "chapter-02", "project", ".gitkeep")),
    (error) => error.code === "ENOENT",
  );
  const nextProgram = await createLab({ type: "program", chapter: "2", slug: "stack-run" }, root);
  assert.deepEqual(
    [quiz.labId, program.labId, project.labId, nextProgram.labId],
    ["02T01", "02E01", "02P01", "02E02"],
  );
  assert.deepEqual([quiz.order, program.order, project.order, nextProgram.order], [3, 4, 5, 6]);
  assert.equal(quiz.relativeRoot, "labs/chapter-02/theory/T-02-01-stack-quiz");
  assert.equal(program.relativeRoot, "labs/chapter-02/exercise/E-02-01-stack-run");
  assert.equal((await loadLab(quiz.labRoot)).manifest.type, "quiz");
  assert.equal((await loadLab(program.labRoot)).manifest.type, "program");
  assert.equal((await loadLab(project.labRoot)).manifest.type, "project");
  assert.equal(await readFile(path.join(program.labRoot, "Makefile"), "utf8"), THIN_MAKEFILE);
  const projectTask = JSON.parse(await readFile(path.join(project.labRoot, "tasks", "task-01-implementation", "task.json"), "utf8"));
  const projectReport = JSON.parse(await readFile(path.join(project.labRoot, "report", "task.json"), "utf8"));
  assert.equal(projectTask.$schema, "../../../../../../schemas/task.schema.json");
  assert.equal(projectReport.$schema, "../../../../../schemas/task.schema.json");
  const projectPackage = await packStudent(await loadLab(project.labRoot));
  assert.equal((await loadLab(projectPackage.packageRoot)).manifest.distribution, "student");
  const programReadme = await readFile(path.join(program.labRoot, "README.md"), "utf8");
  assert.match(programReadme, /labId: "02E01"/);
  assert.match(programReadme, /title: "Lab 02-E-01：编程练习"/);
  await assert.rejects(
    createLab({ type: "quiz", chapter: "2", order: "3", slug: "duplicate-order" }, root),
    (error) => error.code === "ORDER_DUPLICATE",
  );
});

test("Lab scanning rejects flat legacy directories and malformed categorized directories", async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "dsa lab layout "));
  t.after(() => rm(root, { recursive: true, force: true }));
  const chapterRoot = path.join(root, "labs", "chapter-02");
  const flat = path.join(chapterRoot, "lab-02-01-flat");
  await mkdir(flat, { recursive: true });
  await assert.rejects(scanLabRecords(root), (error) => error.code === "LAB_PATH_INVALID");
  await rm(flat, { recursive: true, force: true });

  await mkdir(path.join(chapterRoot, "theory", "lab-02-T-01-malformed"), { recursive: true });
  await assert.rejects(scanLabRecords(root), (error) => error.code === "LAB_PATH_INVALID");
});

test("allocator uses max plus one and never fills a deleted gap", async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "dsa lab identity "));
  t.after(() => rm(root, { recursive: true, force: true }));
  for (const [directory, labId, order] of [
    ["T-02-01-first", "02T01", 1],
    ["T-02-03-third", "02T03", 3],
  ]) {
    const labRoot = path.join(root, "labs", "chapter-02", "theory", directory);
    await mkdir(labRoot, { recursive: true });
    await writeFile(path.join(labRoot, "README.md"), `---\ntitle: "Fixture"\ndescription: "Fixture"\norder: ${order}\nchapter: 2\nlabId: "${labId}"\nchapterTitle: "栈与队列"\nupdated: "2026-08-31"\ncontributors: ["Test"]\nstatus: "draft"\nlab: true\nlabCategory: "theory"\ndifficulty: "测试"\nduration: "1 分钟"\n---\n`);
  }
  const allocated = await allocateLabIdentity(root, { type: "quiz", chapter: 2 });
  assert.deepEqual(allocated, { id: "02T04", chapter: 2, tag: "T", sequence: 4, order: 4 });

  const duplicateRoot = path.join(root, "labs", "chapter-02", "theory", "T-02-03-duplicate");
  await mkdir(duplicateRoot, { recursive: true });
  await writeFile(path.join(duplicateRoot, "README.md"), `---\ntitle: "Duplicate"\ndescription: "Duplicate"\norder: 4\nchapter: 2\nlabId: "02T03"\nchapterTitle: "栈与队列"\nupdated: "2026-08-31"\ncontributors: ["Test"]\nstatus: "draft"\nlab: true\nlabCategory: "theory"\ndifficulty: "测试"\nduration: "1 分钟"\n---\n`);
  await assert.rejects(
    allocateLabIdentity(root, { type: "quiz", chapter: 2 }),
    (error) => error.code === "LAB_ID_DUPLICATE",
  );
});

test("Lab IDs locate a unique repository path", async () => {
  const located = await locateLabById(projectRoot, "1e4");
  assert.equal(located.id, "01E04");
  assert.equal(located.relativePath, "labs/chapter-01/exercise/E-01-04-singly-linked-list-reverse");
});

test("student pack follows multi-source manifests and excludes binaries", async (t) => {
  const root = await fixture({
    schemaVersion: 1,
    type: "program",
    language: "cpp",
    toolchain: { standard: "c++17" },
    targets: {
      student: { sources: ["student/main.cpp", "shared/helper.cpp"], includeDirs: ["include"] },
      solution: { sources: ["solution/main.cpp"] },
    },
    judge: { kind: "stdio", cases: "public/cases.json" },
  }, {
    "Makefile": THIN_MAKEFILE,
    "student/main.cpp": "int helper(); int main() { return helper(); }\n",
    "student/stale.exe": "not a real executable",
    "shared/helper.cpp": "int helper() { return 0; }\n",
    "include/helper.hpp": "int helper();\n",
    "solution/main.cpp": "int main() { return 0; }\n",
    "public/cases.json": JSON.stringify([{ id: "sample", input: "public/sample.in", expected: "public/sample.out", points: 100 }]),
    "public/sample.in": "",
    "public/sample.out": "",
  });
  t.after(() => rm(root, { recursive: true, force: true }));
  const packed = await packStudent(await loadLab(root));
  await access(path.join(packed.packageRoot, "student", "main.cpp"));
  await access(path.join(packed.packageRoot, "shared", "helper.cpp"));
  await access(path.join(packed.packageRoot, "include", "helper.hpp"));
  await assert.rejects(access(path.join(packed.packageRoot, "student", "stale.exe")));
  await assert.rejects(access(path.join(packed.packageRoot, "solution")));
});

test("student pack lab CLI runs outside the source repository", async (t) => {
  const root = await fixture({
    schemaVersion: 1,
    type: "program",
    language: "cpp",
    toolchain: { standard: "c++17" },
    targets: { student: { sources: ["student/main.cpp"] }, solution: { sources: ["solution/main.cpp"] } },
    judge: { kind: "stdio", cases: "tests/cases.json" },
  }, {
    "Makefile": THIN_MAKEFILE,
    "student/main.cpp": "int main() { return 0; }\n",
    "solution/main.cpp": "int main() { return 0; }\n",
    "tests/cases.json": JSON.stringify([{ id: "sample", input: "tests/sample.in", expected: "tests/sample.out", points: 100 }]),
    "tests/sample.in": "",
    "tests/sample.out": "",
  });
  t.after(() => rm(root, { recursive: true, force: true }));
  const packed = await packStudent(await loadLab(root));
  const result = await runProcess(process.execPath, ["tools/lab/cli.mjs", "validate", "--json", "--no-color"], {
    cwd: packed.packageRoot,
    timeMs: 5000,
    outputKb: 256,
  });
  assert.equal(result.code, 0, result.stderr || result.stdout);
  assert.equal(JSON.parse(result.stdout).ok, true);
});

test("schema documents are valid JSON with stable v1 identities", async () => {
  for (const file of ["lab.schema.json", "quiz.schema.json", "cases.schema.json", "task.schema.json"]) {
    const schema = JSON.parse(await readFile(path.join(projectRoot, "schemas", file), "utf8"));
    assert.equal(schema.$schema, "https://json-schema.org/draft/2020-12/schema");
    assert.match(schema.$id, /\/schemas\//);
  }
});

test("CLI JSON mode is versioned, color-free, and uses exit 2 for unknown commands", async (t) => {
  const root = await fixture({ schemaVersion: 1, type: "quiz", quiz: { questions: "quiz.json" } }, {
    "quiz.json": JSON.stringify([{ id: "q1", stem: "题面", options: ["一", "二", "三", "四"], answer: 0, explanation: "解析" }]),
  });
  t.after(() => rm(root, { recursive: true, force: true }));
  const valid = await runProcess(process.execPath, ["tools/lab/cli.mjs", "validate", root, "--json", "--no-color"], { cwd: projectRoot, timeMs: 5000, outputKb: 256 });
  assert.equal(valid.code, 0);
  assert.equal(JSON.parse(valid.stdout).reportVersion, 1);
  assert.equal(valid.stdout.includes(String.fromCharCode(27)), false);
  const forwarded = await runProcess(process.execPath, ["tools/lab/cli.mjs", "validate", "--", root, "--json", "--no-color"], { cwd: projectRoot, timeMs: 5000, outputKb: 256 });
  assert.equal(forwarded.code, 0);
  assert.equal(JSON.parse(forwarded.stdout).lab.path, root);
  const unknown = await runProcess(process.execPath, ["tools/lab/cli.mjs", "unknown", "--json"], { cwd: projectRoot, timeMs: 5000, outputKb: 256 });
  assert.equal(unknown.code, 2);
  assert.equal(JSON.parse(unknown.stdout).error.code, "COMMAND_UNKNOWN");
  const unsupportedInteractiveJson = await runProcess(process.execPath, ["tools/lab/cli.mjs", "interactive", root, "--json"], { cwd: projectRoot, timeMs: 5000, outputKb: 256 });
  assert.equal(unsupportedInteractiveJson.code, 2);
  assert.equal(JSON.parse(unsupportedInteractiveJson.stdout).error.code, "ARGUMENT_INVALID");
  const located = await runProcess(process.execPath, ["tools/lab/cli.mjs", "locate", "01E4", "--json"], { cwd: projectRoot, timeMs: 5000, outputKb: 256 });
  assert.equal(located.code, 0);
  assert.equal(JSON.parse(located.stdout).lab.id, "01E04");
});
