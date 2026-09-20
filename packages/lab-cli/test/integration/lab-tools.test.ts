import type { CompareDifference, CompareResult, LoadedProjectLab } from "@dsa/lab-core";
import type { CliReport } from "@dsa/lab-testkit";
import { access, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createLab } from "@dsa/lab-cli";
import {
  compareOutput,
  findLabRoot,
  formatLabDocumentTitlePrefix,
  insertLabIdFrontmatter,
  loadLab,
  normalizeLabId,
  parseLabId,
  parseQuizQuestions,
  resolveLabPath,
  runProcess,
  STANDALONE_CLI_FILENAME,
  THIN_MAKEFILE,
  validateQuizReadme,
} from "@dsa/lab-core";
import {
  allocateLabIdentity,
  classifyCtestExecution,
  classifyExecution,
  cleanLab,
  cmakeStandardNumber,
  judgeProgram,
  locateLabById,
  packStudent,
  previewDiff,
  projectHasInternalError,
  refreshExpected,
  scanLabRecords,
  scoreProject,
  selectCompiler,
} from "@dsa/lab-runner";
import { capture, loadExecutableLab, loadProgramLab, loadProjectLab, REPO_ROOT } from "@dsa/lab-testkit";
import { expect, it, onTestFinished } from "vitest";

const projectRoot = REPO_ROOT;

async function fixture(manifest: { type: string; [key: string]: unknown }, extra: Record<string, string> = {}) {
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

it("findLabRoot finds the nearest manifest from a nested path containing spaces", async () => {
  const root = await fixture(
    { schemaVersion: 1, type: "quiz", quiz: { questions: "quiz.json" } },
    {
      "quiz.json": JSON.stringify([
        { id: "q1", stem: "题面", options: ["一", "二", "三", "四"], answer: 0, explanation: "解析" },
      ]),
    },
  );
  onTestFinished(() => rm(root, { recursive: true, force: true }));
  const nested = path.join(root, "nested path", "deeper");
  await mkdir(nested, { recursive: true });
  expect(await findLabRoot(nested)).toBe(root);
});

it("loadLab rejects an unknown schema major version", async () => {
  const root = await fixture({ schemaVersion: 2, type: "quiz", quiz: { questions: "quiz.json" } });
  onTestFinished(() => rm(root, { recursive: true, force: true }));
  await expect(loadLab(root)).rejects.toThrow(expect.objectContaining({ code: "SCHEMA_VERSION" }));
});

it("loadLab rejects paths escaping the lab root", async () => {
  const root = await fixture({ schemaVersion: 1, type: "quiz", quiz: { questions: "../quiz.json" } });
  onTestFinished(() => rm(root, { recursive: true, force: true }));
  await expect(loadLab(root)).rejects.toThrow(expect.objectContaining({ code: "PATH_ESCAPE" }));
});

it("path resolution rejects absolute paths", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "dsa absolute path "));
  onTestFinished(() => rm(root, { recursive: true, force: true }));
  const outside = path.resolve(root, "file.txt");
  await writeFile(outside, "fixture");
  await expect(resolveLabPath(root, outside, "absolute fixture")).rejects.toThrow(
    expect.objectContaining({ code: "PATH_ESCAPE" }),
  );
});

it("loadLab rejects a symbolic link escaping the lab root", async (t) => {
  const outside = await mkdtemp(path.join(os.tmpdir(), "dsa outside "));
  const root = await fixture({ schemaVersion: 1, type: "quiz", quiz: { questions: "linked-quiz.json" } });
  onTestFinished(async () => {
    await Promise.all([rm(root, { recursive: true, force: true }), rm(outside, { recursive: true, force: true })]);
  });
  const outsideFile = path.join(outside, "quiz.json");
  await writeFile(
    outsideFile,
    JSON.stringify([{ id: "q1", stem: "题", options: ["一", "二", "三", "四"], answer: 0, explanation: "解" }]),
  );
  try {
    await symlink(outsideFile, path.join(root, "linked-quiz.json"), "file");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "EPERM") {
      t.skip("当前 Windows 策略不允许创建测试符号链接");
      return;
    }
    throw error;
  }
  await expect(loadLab(root)).rejects.toThrow(expect.objectContaining({ code: "PATH_ESCAPE" }));
});

it("program cases must total exactly 100 points", async () => {
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
    "tests/cases.json": JSON.stringify([
      { id: "sample", input: "tests/input.in", expected: "tests/output.out", points: 99 },
    ]),
  });
  onTestFinished(() => rm(root, { recursive: true, force: true }));
  await expect(loadLab(root)).rejects.toThrow(expect.objectContaining({ code: "CASES_POINTS" }));
});

it("project dependencies must be acyclic", async () => {
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
  onTestFinished(() => rm(root, { recursive: true, force: true }));
  await expect(loadLab(root)).rejects.toThrow(expect.objectContaining({ code: "TASK_CYCLE" }));
});

it("project validation rejects bad total weights and missing dependencies", async () => {
  const base = {
    schemaVersion: 1,
    type: "project",
    language: "cpp",
    toolchain: { standard: "c++17" },
    buildSystem: "cmake",
  };
  const weights = await fixture(
    {
      ...base,
      tasks: [{ id: "report", path: "report", weight: 99, kind: "manual", dependsOn: [] }],
    },
    {
      Makefile: THIN_MAKEFILE,
      "report/task.json": JSON.stringify({ schemaVersion: 1, kind: "manual", checklist: ["review"] }),
    },
  );
  const dependency = await fixture(
    {
      ...base,
      tasks: [{ id: "report", path: "report", weight: 100, kind: "manual", dependsOn: ["missing"] }],
    },
    {
      Makefile: THIN_MAKEFILE,
      "report/task.json": JSON.stringify({ schemaVersion: 1, kind: "manual", checklist: ["review"] }),
    },
  );
  onTestFinished(async () => {
    await Promise.all([
      rm(weights, { recursive: true, force: true }),
      rm(dependency, { recursive: true, force: true }),
    ]);
  });
  await expect(loadLab(weights)).rejects.toThrow(expect.objectContaining({ code: "TASK_WEIGHTS" }));
  await expect(loadLab(dependency)).rejects.toThrow(expect.objectContaining({ code: "TASK_DEPENDENCY" }));
});

it("Project build metadata remains optional and rejects invalid targets and build dependency cycles", async () => {
  const task = { schemaVersion: 1, kind: "ctest", ctest: { tests: [{ name: "unit", points: 100 }] } };
  const manifest = {
    schemaVersion: 1,
    type: "project",
    language: "cpp",
    toolchain: { standard: "c++17" },
    buildSystem: "cmake",
    tasks: [
      { id: "module", path: "tasks/module", kind: "ctest", weight: 100, dependsOn: [], buildDependsOn: [] as string[] },
    ],
  };
  const root = await fixture(manifest, { Makefile: THIN_MAKEFILE, "tasks/module/task.json": JSON.stringify(task) });
  onTestFinished(() => rm(root, { recursive: true, force: true }));
  expect(((await loadLab(root)) as LoadedProjectLab).tasks[0].config.ctest!.buildTargets).toBe(undefined);
  for (const buildTargets of [[], ["--all"], ["one", "one"], ["path/target"]]) {
    await writeFile(
      path.join(root, "tasks/module/task.json"),
      JSON.stringify({ ...task, ctest: { ...task.ctest, buildTargets } }),
    );
    await expect(loadLab(root)).rejects.toThrow(expect.objectContaining({ code: "SCHEMA_INVALID" }));
  }
  await writeFile(path.join(root, "tasks/module/task.json"), JSON.stringify(task));
  manifest.tasks[0].buildDependsOn = ["missing"];
  await writeFile(path.join(root, "lab.json"), JSON.stringify(manifest));
  await expect(loadLab(root)).rejects.toThrow(expect.objectContaining({ code: "TASK_DEPENDENCY" }));
  manifest.tasks[0].buildDependsOn = ["module"];
  await writeFile(path.join(root, "lab.json"), JSON.stringify(manifest));
  await expect(loadLab(root)).rejects.toThrow(expect.objectContaining({ code: "TASK_CYCLE" }));
});

it("single stdio case feedback cannot replace a full Task grade or complete a manual Project", async () => {
  const root = await fixture(
    {
      schemaVersion: 1,
      type: "project",
      language: "cpp",
      toolchain: { standard: "c++17" },
      buildSystem: "cmake",
      tasks: [
        { id: "code", path: "code", kind: "stdio", weight: 90, dependsOn: [] },
        { id: "report", path: "report", kind: "manual", weight: 10, dependsOn: ["code"] },
      ],
    },
    {
      Makefile: THIN_MAKEFILE,
      "code/task.json": JSON.stringify({
        schemaVersion: 1,
        kind: "stdio",
        targets: { student: { sources: ["student/main.cpp"] }, solution: { sources: ["student/main.cpp"] } },
        judge: { kind: "stdio", cases: "tests/cases.json" },
      }),
      "code/student/main.cpp": "#include <iostream>\nint main(){std::cout << 1;}",
      "code/tests/input.in": "",
      "code/tests/one.out": "1",
      "code/tests/two.out": "2",
      "code/tests/cases.json": JSON.stringify([
        { id: "one", input: "tests/input.in", expected: "tests/one.out", points: 50 },
        { id: "two", input: "tests/input.in", expected: "tests/two.out", points: 50 },
      ]),
      "report/task.json": JSON.stringify({ schemaVersion: 1, kind: "manual", checklist: ["review"] }),
    },
  );
  onTestFinished(() => rm(root, { recursive: true, force: true }));
  const lab = await loadProjectLab(root);
  const whole = await scoreProject(lab);
  expect(whole.current.automatedScore).toBe(45);
  const partial = await scoreProject(lab, { taskId: "code", caseId: "one" });
  expect(partial.automatedFull).toBe(true);
  expect(partial.partial).toBe(true);
  expect(partial.current.automatedScore).toBe(45);
  expect(partial.current.tasks[0].status).toBe("WA");
  expect(partial.current.complete).toBe(false);
  expect(partial.current.manualPending).toBe(10);
});

it("executable labs reject a forked thin Makefile", async () => {
  const manifest = {
    schemaVersion: 1,
    type: "program",
    language: "cpp",
    toolchain: { standard: "c++17" },
    targets: { student: { sources: ["student/main.cpp"] }, solution: { sources: ["solution/main.cpp"] } },
    judge: { kind: "stdio", cases: "tests/cases.json" },
  };
  const root = await fixture(manifest, {
    Makefile: "run:\n\techo forked\n",
    "student/main.cpp": "int main(){}",
    "solution/main.cpp": "int main(){}",
    "tests/input.in": "",
    "tests/output.out": "",
    "tests/cases.json": JSON.stringify([
      { id: "sample", input: "tests/input.in", expected: "tests/output.out", points: 100 },
    ]),
  });
  onTestFinished(() => rm(root, { recursive: true, force: true }));
  await expect(loadLab(root)).rejects.toThrow(expect.objectContaining({ code: "MAKEFILE_DRIFT" }));
});

it("quiz contract rejects authored option labels and duplicate options", () => {
  expect(() =>
    parseQuizQuestions([{ id: "q1", stem: "题", options: ["A. 一", "二", "三", "四"], answer: 0, explanation: "解" }]),
  ).toThrow(/不要手写/);
  expect(() =>
    parseQuizQuestions([{ id: "q1", stem: "题", options: ["一", "一", "三", "四"], answer: 0, explanation: "解" }]),
  ).toThrow(/重复选项/);
});

it("quiz contract rejects wrong option counts, answer indexes, duplicate IDs, and README answer copies", () => {
  const valid = { id: "q1", stem: "题", options: ["一", "二", "三", "四"], answer: 0, explanation: "解" };
  expect(() => parseQuizQuestions([{ ...valid, options: ["一", "二", "三"] }])).toThrow(/恰好包含 4 项/);
  expect(() => parseQuizQuestions([{ ...valid, answer: 4 }])).toThrow(/0～3/);
  expect(() => parseQuizQuestions([valid, { ...valid }])).toThrow(/id q1 重复/);
  expect(() => validateQuizReadme("# Quiz\n\n<QuizSet />\n\n## 答案速查\n")).toThrow(/不得重复维护/);
  expect(() =>
    validateQuizReadme("# Quiz\n\n<QuizSet />\n\n## 标准答案\n\n| 题号 | 答案 |\n| --- | --- |\n| 1 | A |\n"),
  ).toThrow(/不得重复维护/);
  expect(() => validateQuizReadme("# Quiz\n")).toThrow(/必须且只能挂载一次/);
});

it("output comparators normalize CRLF and support exact, tokens, and float tolerances", () => {
  expect(compareOutput("a\r\nb\r\n", "a\nb\n", { mode: "exact" }).equal).toBe(true);
  expect(compareOutput("1  2\n3", "1\n2 3\n", { mode: "tokens" }).equal).toBe(true);
  expect(compareOutput("value 1.0000", "value 1.0009", { mode: "float", absTol: 0.001, relTol: 0 }).equal).toBe(true);
  const mismatch = compareOutput("one two", "one three", { mode: "tokens" });
  expect(difference(mismatch)).toStrictEqual({ kind: "token", index: 2, expected: "two", actual: "three" });
});

/** compareOutput 是判别联合，断言差异前先收窄到 equal: false。 */
function difference(result: CompareResult): CompareDifference | undefined {
  return result.equal ? undefined : result.difference;
}

it("exact comparison ignores line-end horizontal whitespace without hiding other differences", () => {
  expect(compareOutput("42\n", "42", { mode: "exact" }).equal).toBe(true);
  expect(compareOutput("42", "42\n", { mode: "exact" }).equal).toBe(true);
  expect(compareOutput("1 2 3\n4 5\n", "1 2 3 \n4 5\n", { mode: "exact" }).equal).toBe(true);
  expect(compareOutput("1 2\n3", "1 2  \t\n3\t", { mode: "exact" }).equal).toBe(true);
  expect(classifyExecution(capture({ stdout: "1 2 3 \n4 5\n" }), "1 2 3\n4 5\n", { mode: "exact" }).verdict).toBe("AC");
  expect(compareOutput("42\n\n", "42\n", { mode: "exact" }).equal).toBe(false);
  expect(compareOutput("42\n", "42\nextra\n", { mode: "exact" }).equal).toBe(false);
  expect(compareOutput("42\n43", "4243", { mode: "exact" }).equal).toBe(false);
  expect(compareOutput("1  2", "1 2", { mode: "exact" }).equal).toBe(false);
  expect(compareOutput(" 42", "42", { mode: "exact" }).equal).toBe(false);
  expect(difference(compareOutput("1 2\n3", "1 2 \n4", { mode: "exact" }))).toStrictEqual({
    kind: "character",
    index: 4,
    line: 2,
    column: 1,
    expected: "1 2\\n3",
    actual: "1 2\\n4",
  });
});

it("expected-output refresh renders a reviewable line diff", () => {
  expect(previewDiff("one\ntwo\n", "one\nthree\n")).toBe("@@ line 2 @@\n- two\n+ three");
});

it("expected-output refresh is preview-only until --write and clean preserves sources", async () => {
  const manifest = {
    schemaVersion: 1,
    type: "program",
    language: "cpp",
    toolchain: { standard: "c++17" },
    targets: { student: { sources: ["student/main.cpp"] }, solution: { sources: ["solution/main.cpp"] } },
    judge: { kind: "stdio", cases: "tests/cases.json", compare: { mode: "exact" } },
  };
  const root = await fixture(manifest, {
    Makefile: THIN_MAKEFILE,
    "student/main.cpp": "int main() { return 0; }\n",
    "solution/main.cpp": '#include <iostream>\nint main() { std::cout << "new\\n"; }\n',
    "tests/cases.json": JSON.stringify([
      { id: "sample", input: "tests/sample.in", expected: "tests/sample.out", points: 100 },
    ]),
    "tests/sample.in": "",
    "tests/sample.out": "old\n",
  });
  onTestFinished(() => rm(root, { recursive: true, force: true }));
  const lab = await loadProgramLab(root);
  const preview = await refreshExpected(lab, false);
  expect(preview.changed).toBe(1);
  expect(preview.written).toBe(0);
  expect(await readFile(path.join(root, "tests", "sample.out"), "utf8")).toBe("old\n");
  const written = await refreshExpected(lab, true);
  expect(written.written).toBe(1);
  expect(await readFile(path.join(root, "tests", "sample.out"), "utf8")).toBe("new\n");
  await cleanLab(lab);
  await expect(access(path.join(root, ".lab-cache"))).rejects.toThrow();
  expect(await readFile(path.join(root, "student", "main.cpp"), "utf8")).toMatch(/int main/);
  expect(await readFile(path.join(root, "solution", "main.cpp"), "utf8")).toMatch(/std::cout/);
});

it("execution classification covers AC, WA, TLE, RE, OLE, and IE", () => {
  const base = capture({ stdout: "ok\n" });
  expect(classifyExecution(base, "ok\r\n", { mode: "exact" }).verdict).toBe("AC");
  expect(classifyExecution(base, "different", { mode: "exact" }).verdict).toBe("WA");
  expect(classifyExecution({ ...base, timedOut: true }, "", { mode: "exact" }).verdict).toBe("TLE");
  expect(classifyExecution({ ...base, code: 3 }, "", { mode: "exact" }).verdict).toBe("RE");
  expect(classifyExecution({ ...base, outputExceeded: true }, "", { mode: "exact" }).verdict).toBe("OLE");
  expect(classifyExecution({ ...base, spawnError: new Error("missing") }, "", { mode: "exact" }).verdict).toBe("IE");
});

it("project scoring promotes nested IE verdicts to a tool error", () => {
  expect(projectHasInternalError([{ id: "stdio", status: "WA", judge: { cases: [{ verdict: "IE" }] } }])).toBe(true);
  expect(projectHasInternalError([{ id: "ctest", status: "IE", tests: [] }])).toBe(true);
  expect(projectHasInternalError([{ id: "ok", status: "AC", tests: [{ verdict: "AC" }] }])).toBe(false);
});

it("CTest zero-match and infrastructure failures never receive AC", () => {
  const base = capture();
  expect(classifyCtestExecution({ ...base, stdout: "No tests were found!!!" })).toBe("IE");
  expect(classifyCtestExecution({ ...base, spawnError: new Error("missing") })).toBe("IE");
  expect(classifyCtestExecution({ ...base, code: 1 })).toBe("WA");
  expect(classifyCtestExecution(base)).toBe("AC");
});

it("Project CMake standard follows the manifest override", () => {
  expect(cmakeStandardNumber("c++17")).toBe("17");
  expect(cmakeStandardNumber("c++20")).toBe("20");
  expect(() => cmakeStandardNumber("c++14")).toThrow(/不支持/);
});

it("Project clean removes top-level and task-local caches only", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "dsa project clean "));
  const taskPath = path.join(root, "tasks", "implementation");
  onTestFinished(() => rm(root, { recursive: true, force: true }));
  await mkdir(path.join(root, ".lab-cache"), { recursive: true });
  await mkdir(path.join(taskPath, ".lab-cache"), { recursive: true });
  await mkdir(path.join(taskPath, "student"), { recursive: true });
  await writeFile(path.join(taskPath, "student", "main.cpp"), "int main() {}\n");
  await cleanLab({ labRoot: root, tasks: [{ taskPath }] });
  await expect(access(path.join(root, ".lab-cache"))).rejects.toThrow();
  await expect(access(path.join(taskPath, ".lab-cache"))).rejects.toThrow();
  await access(path.join(taskPath, "student", "main.cpp"));
});

it("judge reports compiler errors as CE", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "dsa ce "));
  onTestFinished(() => rm(root, { recursive: true, force: true }));
  await mkdir(path.join(root, "student"));
  await writeFile(path.join(root, "student", "main.cpp"), "this is not valid C++\n");
  const result = await judgeProgram({
    labRoot: root,
    manifest: {
      toolchain: { standard: "c++17" },
      targets: { student: { sources: ["student/main.cpp"] } },
      judge: {
        kind: "stdio",
        cases: "tests/cases.json",
        compare: { mode: "exact" },
        limits: { timeMs: 1000, outputKb: 64 },
      },
    },
    cases: [],
  });
  expect(result.verdict).toBe("CE");
  expect(result.score).toBe(0);
});

it("an unavailable CXX override produces a clear compiler error", async () => {
  const previous = process.env.CXX;
  process.env.CXX = path.join(os.tmpdir(), "definitely-missing-cxx.exe");
  try {
    await expect(selectCompiler()).rejects.toThrow(expect.objectContaining({ code: "COMPILER_NOT_FOUND" }));
  } finally {
    if (previous === undefined) delete process.env.CXX;
    else process.env.CXX = previous;
  }
});

it("process runner enforces real timeout and output limits", async () => {
  const timeout = await runProcess(process.execPath, ["-e", "setInterval(() => {}, 1000)"], {
    timeMs: 100,
    outputKb: 64,
  });
  expect(timeout.timedOut).toBe(true);
  const output = await runProcess(process.execPath, ["-e", "process.stdout.write('x'.repeat(4096))"], {
    timeMs: 2000,
    outputKb: 1,
  });
  expect(output.outputExceeded).toBe(true);
});

it("process runner merges an injected toolchain environment", async () => {
  const result = await runProcess(process.execPath, ["-e", "process.stdout.write(process.env.LAB_TOOLCHAIN_MARKER)"], {
    env: { LAB_TOOLCHAIN_MARKER: "from-env" },
    timeMs: 2000,
    outputKb: 64,
  });
  expect(result.code).toBe(0);
  expect(result.stdout).toBe("from-env");
});

it("stable Lab IDs normalize common shorthand", () => {
  expect(normalizeLabId("02T3")).toBe("02T03");
  expect(normalizeLabId("2t3")).toBe("02T03");
  expect(normalizeLabId("02-T-03")).toBe("02T03");
  expect(normalizeLabId("lab02-T-03")).toBe("02T03");
  expect(parseLabId("02P12")).toStrictEqual({ id: "02P12", chapter: 2, tag: "P", sequence: 12 });
  expect(formatLabDocumentTitlePrefix("2e3")).toBe("Lab 02-E-03：");
  expect(() => normalizeLabId("02X03")).toThrow(expect.objectContaining({ code: "LAB_ID_INVALID" }));
  expect(() => normalizeLabId("02T0")).toThrow(expect.objectContaining({ code: "LAB_ID_INVALID" }));
});

it("Lab ID migration preserves the frontmatter line ending beside chapter", () => {
  const mixed = "---\nchapter: 2\nchapterTitle: 测试\r\n---\r\n";
  const migrated = insertLabIdFrontmatter(mixed, "2t3");
  expect(migrated).toBe('---\nchapter: 2\nlabId: "02T03"\nchapterTitle: 测试\r\n---\r\n');
});

it("scaffolder allocates independent type sequences and optional display order", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "dsa scaffold "));
  onTestFinished(() => rm(root, { recursive: true, force: true }));
  const emptyCategoryMarker = path.join(root, "labs", "chapter-02", "theory", ".gitkeep");
  await mkdir(path.dirname(emptyCategoryMarker), { recursive: true });
  await writeFile(emptyCategoryMarker, "");
  const quiz = await createLab({ type: "quiz", chapter: "2", order: "3", slug: "stack-quiz" }, root);
  await expect(access(emptyCategoryMarker)).rejects.toThrow(expect.objectContaining({ code: "ENOENT" }));
  await access(path.join(root, "labs", "chapter-02", "exercise", ".gitkeep"));
  await access(path.join(root, "labs", "chapter-02", "project", ".gitkeep"));
  const program = await createLab({ type: "program", chapter: "2", slug: "stack-run" }, root);
  await expect(access(path.join(root, "labs", "chapter-02", "exercise", ".gitkeep"))).rejects.toThrow(
    expect.objectContaining({ code: "ENOENT" }),
  );
  const project = await createLab({ type: "project", chapter: "2", order: "5", slug: "stack-project" }, root);
  await expect(access(path.join(root, "labs", "chapter-02", "project", ".gitkeep"))).rejects.toThrow(
    expect.objectContaining({ code: "ENOENT" }),
  );
  const nextProgram = await createLab({ type: "program", chapter: "2", slug: "stack-run" }, root);
  expect([quiz.labId, program.labId, project.labId, nextProgram.labId]).toStrictEqual([
    "02T01",
    "02E01",
    "02P01",
    "02E02",
  ]);
  expect([quiz.order, program.order, project.order, nextProgram.order]).toStrictEqual([3, 4, 5, 6]);
  expect(quiz.relativeRoot).toBe("labs/chapter-02/theory/T-02-01-stack-quiz");
  expect(program.relativeRoot).toBe("labs/chapter-02/exercise/E-02-01-stack-run");
  expect((await loadLab(quiz.labRoot)).manifest.type).toBe("quiz");
  expect((await loadLab(program.labRoot)).manifest.type).toBe("program");
  expect((await loadLab(project.labRoot)).manifest.type).toBe("project");
  expect(await readFile(path.join(program.labRoot, "Makefile"), "utf8")).toBe(THIN_MAKEFILE);
  const projectTask = JSON.parse(
    await readFile(path.join(project.labRoot, "tasks", "task-01-implementation", "task.json"), "utf8"),
  ) as { $schema: string };
  const projectReport = JSON.parse(await readFile(path.join(project.labRoot, "report", "task.json"), "utf8")) as {
    $schema: string;
  };
  expect(projectTask.$schema).toBe("../../../../../../schemas/task.schema.json");
  expect(projectReport.$schema).toBe("../../../../../schemas/task.schema.json");
  const projectPackage = await packStudent(await loadExecutableLab(project.labRoot));
  expect((await loadLab(projectPackage.packageRoot)).manifest.distribution).toBe("student");
  const programReadme = await readFile(path.join(program.labRoot, "README.md"), "utf8");
  expect(programReadme).toMatch(/labId: "02E01"/);
  expect(programReadme).toMatch(/title: "Lab 02-E-01：编程练习"/);
  await expect(createLab({ type: "quiz", chapter: "2", order: "3", slug: "duplicate-order" }, root)).rejects.toThrow(
    expect.objectContaining({ code: "ORDER_DUPLICATE" }),
  );
});

it("Lab scanning rejects flat legacy directories and malformed categorized directories", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "dsa lab layout "));
  onTestFinished(() => rm(root, { recursive: true, force: true }));
  const chapterRoot = path.join(root, "labs", "chapter-02");
  const flat = path.join(chapterRoot, "lab-02-01-flat");
  await mkdir(flat, { recursive: true });
  await expect(scanLabRecords(root)).rejects.toThrow(expect.objectContaining({ code: "LAB_PATH_INVALID" }));
  await rm(flat, { recursive: true, force: true });

  await mkdir(path.join(chapterRoot, "theory", "lab-02-T-01-malformed"), { recursive: true });
  await expect(scanLabRecords(root)).rejects.toThrow(expect.objectContaining({ code: "LAB_PATH_INVALID" }));
});

it("allocator uses max plus one and never fills a deleted gap", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "dsa lab identity "));
  onTestFinished(() => rm(root, { recursive: true, force: true }));
  for (const [directory, labId, order] of [
    ["T-02-01-first", "02T01", 1],
    ["T-02-03-third", "02T03", 3],
  ] as const) {
    const labRoot = path.join(root, "labs", "chapter-02", "theory", directory);
    await mkdir(labRoot, { recursive: true });
    await writeFile(
      path.join(labRoot, "README.md"),
      `---\ntitle: "Fixture"\ndescription: "Fixture"\norder: ${order}\nchapter: 2\nlabId: "${labId}"\nchapterTitle: "栈与队列"\nupdated: "2026-08-31"\ncontributors: ["Test"]\nstatus: "draft"\nlab: true\nlabCategory: "theory"\ndifficulty: "测试"\nduration: "1 分钟"\n---\n`,
    );
  }
  const allocated = await allocateLabIdentity(root, { type: "quiz", chapter: 2 });
  expect(allocated).toStrictEqual({ id: "02T04", chapter: 2, tag: "T", sequence: 4, order: 4 });

  const duplicateRoot = path.join(root, "labs", "chapter-02", "theory", "T-02-03-duplicate");
  await mkdir(duplicateRoot, { recursive: true });
  await writeFile(
    path.join(duplicateRoot, "README.md"),
    `---\ntitle: "Duplicate"\ndescription: "Duplicate"\norder: 4\nchapter: 2\nlabId: "02T03"\nchapterTitle: "栈与队列"\nupdated: "2026-08-31"\ncontributors: ["Test"]\nstatus: "draft"\nlab: true\nlabCategory: "theory"\ndifficulty: "测试"\nduration: "1 分钟"\n---\n`,
  );
  await expect(allocateLabIdentity(root, { type: "quiz", chapter: 2 })).rejects.toThrow(
    expect.objectContaining({ code: "LAB_ID_DUPLICATE" }),
  );
});

it("Lab IDs locate a unique repository path", async () => {
  const located = await locateLabById(projectRoot, "1e4");
  expect(located.id).toBe("01E04");
  expect(located.relativePath).toBe("labs/chapter-01/exercise/E-01-04-singly-linked-list-reverse");
});

it("student pack follows multi-source manifests and excludes binaries", async () => {
  const root = await fixture(
    {
      schemaVersion: 1,
      type: "program",
      language: "cpp",
      toolchain: { standard: "c++17" },
      targets: {
        student: { sources: ["student/main.cpp", "shared/helper.cpp"], includeDirs: ["include"] },
        solution: { sources: ["solution/main.cpp"] },
      },
      judge: { kind: "stdio", cases: "public/cases.json" },
    },
    {
      Makefile: THIN_MAKEFILE,
      "student/main.cpp": "int helper(); int main() { return helper(); }\n",
      "student/stale.exe": "not a real executable",
      "shared/helper.cpp": "int helper() { return 0; }\n",
      "include/helper.hpp": "int helper();\n",
      "solution/main.cpp": "int main() { return 0; }\n",
      "public/cases.json": JSON.stringify([
        { id: "sample", input: "public/sample.in", expected: "public/sample.out", points: 100 },
      ]),
      "public/sample.in": "",
      "public/sample.out": "",
    },
  );
  onTestFinished(() => rm(root, { recursive: true, force: true }));
  const packed = await packStudent(await loadExecutableLab(root));
  await access(path.join(packed.packageRoot, "student", "main.cpp"));
  await access(path.join(packed.packageRoot, "shared", "helper.cpp"));
  await access(path.join(packed.packageRoot, "include", "helper.hpp"));
  await expect(access(path.join(packed.packageRoot, "student", "stale.exe"))).rejects.toThrow();
  await expect(access(path.join(packed.packageRoot, "solution"))).rejects.toThrow();
});

it("student pack lab CLI runs outside the source repository", async () => {
  const root = await fixture(
    {
      schemaVersion: 1,
      type: "program",
      language: "cpp",
      toolchain: { standard: "c++17" },
      targets: { student: { sources: ["student/main.cpp"] }, solution: { sources: ["solution/main.cpp"] } },
      judge: { kind: "stdio", cases: "tests/cases.json" },
    },
    {
      Makefile: THIN_MAKEFILE,
      "student/main.cpp": "int main() { return 0; }\n",
      "solution/main.cpp": "int main() { return 0; }\n",
      "tests/cases.json": JSON.stringify([
        { id: "sample", input: "tests/sample.in", expected: "tests/sample.out", points: 100 },
      ]),
      "tests/sample.in": "",
      "tests/sample.out": "",
    },
  );
  onTestFinished(() => rm(root, { recursive: true, force: true }));
  const packed = await packStudent(await loadExecutableLab(root));
  const result = await runProcess(process.execPath, [STANDALONE_CLI_FILENAME, "validate", "--json", "--no-color"], {
    cwd: packed.packageRoot,
    timeMs: 5000,
    outputKb: 256,
  });
  expect(result.code, result.stderr || result.stdout).toBe(0);
  expect((JSON.parse(result.stdout) as { ok: boolean }).ok).toBe(true);
});

it("schema documents are valid JSON with stable v1 identities", async () => {
  for (const file of ["lab.schema.json", "quiz.schema.json", "cases.schema.json", "task.schema.json"]) {
    const schema = JSON.parse(await readFile(path.join(projectRoot, "schemas", file), "utf8")) as {
      $schema: string;
      $id: string;
    };
    expect(schema.$schema).toBe("https://json-schema.org/draft/2020-12/schema");
    expect(schema.$id).toMatch(/\/schemas\//);
  }
});

it("CLI JSON mode is versioned, color-free, and uses exit 2 for unknown commands", async () => {
  const root = await fixture(
    { schemaVersion: 1, type: "quiz", quiz: { questions: "quiz.json" } },
    {
      "quiz.json": JSON.stringify([
        { id: "q1", stem: "题面", options: ["一", "二", "三", "四"], answer: 0, explanation: "解析" },
      ]),
    },
  );
  onTestFinished(() => rm(root, { recursive: true, force: true }));
  const valid = await runProcess(
    process.execPath,
    ["packages/lab-cli/dist/cli.js", "validate", root, "--json", "--no-color"],
    { cwd: projectRoot, timeMs: 5000, outputKb: 256 },
  );
  expect(valid.code).toBe(0);
  expect((JSON.parse(valid.stdout) as { reportVersion: number }).reportVersion).toBe(1);
  expect(valid.stdout.includes(String.fromCharCode(27))).toBe(false);
  const forwarded = await runProcess(
    process.execPath,
    ["packages/lab-cli/dist/cli.js", "validate", "--", root, "--json", "--no-color"],
    { cwd: projectRoot, timeMs: 5000, outputKb: 256 },
  );
  expect(forwarded.code).toBe(0);
  expect((JSON.parse(forwarded.stdout) as CliReport).lab.path).toBe(root);
  const unknown = await runProcess(process.execPath, ["packages/lab-cli/dist/cli.js", "unknown", "--json"], {
    cwd: projectRoot,
    timeMs: 5000,
    outputKb: 256,
  });
  expect(unknown.code).toBe(2);
  expect((JSON.parse(unknown.stdout) as { error: { code: string } }).error.code).toBe("COMMAND_UNKNOWN");
  const unsupportedInteractiveJson = await runProcess(
    process.execPath,
    ["packages/lab-cli/dist/cli.js", "interactive", root, "--json"],
    { cwd: projectRoot, timeMs: 5000, outputKb: 256 },
  );
  expect(unsupportedInteractiveJson.code).toBe(2);
  expect((JSON.parse(unsupportedInteractiveJson.stdout) as { error: { code: string } }).error.code).toBe(
    "ARGUMENT_INVALID",
  );
  const located = await runProcess(process.execPath, ["packages/lab-cli/dist/cli.js", "locate", "01E4", "--json"], {
    cwd: projectRoot,
    timeMs: 5000,
    outputKb: 256,
  });
  expect(located.code).toBe(0);
  expect((JSON.parse(located.stdout) as CliReport).lab.id).toBe("01E04");
});
