import { access, lstat, readFile, realpath } from "node:fs/promises";
import path from "node:path";
import { LabError } from "./errors.mjs";
import { parseLabId } from "./lab-id.mjs";

export const LAB_SCHEMA_VERSION = 1;
export const JSON_REPORT_VERSION = 1;
export const LAB_TYPES = new Set(["quiz", "program", "project"]);
export const COMPARE_MODES = new Set(["exact", "tokens", "float"]);
export const TASK_KINDS = new Set(["stdio", "ctest", "manual"]);
const THIN_MAKEFILE = "LAB_DIR := $(CURDIR)\nREPO_ROOT := $(LAB_DIR)/../../../..\ninclude ../../../../tools/lab/lab.mk\n";

export function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function pathExists(target) {
  try {
    await access(target);
    return true;
  } catch {
    return false;
  }
}

export async function findLabRoot(start = process.cwd()) {
  let current = path.resolve(start);
  if (await pathExists(current)) {
    const stats = await lstat(current);
    if (!stats.isDirectory()) current = path.dirname(current);
  }
  while (true) {
    if (await pathExists(path.join(current, "lab.json"))) return current;
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  throw new LabError("LAB_NOT_FOUND", `从 ${path.resolve(start)} 向上未找到 lab.json`);
}

export async function readJson(file, label = file) {
  let source;
  try {
    source = await readFile(file, "utf8");
  } catch (error) {
    if (error?.code === "ENOENT") throw new LabError("FILE_NOT_FOUND", `${label} 不存在`);
    throw error;
  }
  try {
    return JSON.parse(source);
  } catch (error) {
    throw new LabError("JSON_INVALID", `${label} JSON 解析失败：${error.message}`);
  }
}

function isWithin(root, target) {
  const relative = path.relative(root, target);
  return relative === "" || (!relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative));
}

export async function resolveLabPath(labRoot, value, label, options = {}) {
  const { mustExist = true } = options;
  if (typeof value !== "string" || !value.trim()) {
    throw new LabError("PATH_INVALID", `${label} 必须是非空相对路径`);
  }
  if (path.isAbsolute(value)) throw new LabError("PATH_ESCAPE", `${label} 不得使用绝对路径：${value}`);
  const root = path.resolve(labRoot);
  const target = path.resolve(root, value);
  if (!isWithin(root, target)) throw new LabError("PATH_ESCAPE", `${label} 不能逃出当前 Lab：${value}`);
  if (!mustExist) return target;
  if (!(await pathExists(target))) throw new LabError("FILE_NOT_FOUND", `${label} 不存在：${value}`);
  const [realRoot, realTarget] = await Promise.all([realpath(root), realpath(target)]);
  if (!isWithin(realRoot, realTarget)) {
    throw new LabError("PATH_ESCAPE", `${label} 通过符号链接逃出当前 Lab：${value}`);
  }
  return target;
}

function requireRecord(value, label) {
  if (!isRecord(value)) throw new LabError("SCHEMA_INVALID", `${label} 必须是对象`);
  return value;
}

function requireString(value, label) {
  if (typeof value !== "string" || !value.trim()) throw new LabError("SCHEMA_INVALID", `${label} 必须是非空字符串`);
  return value;
}

function requirePositiveInteger(value, label) {
  if (!Number.isInteger(value) || value <= 0) throw new LabError("SCHEMA_INVALID", `${label} 必须是正整数`);
  return value;
}

function assertKnownKeys(value, allowed, label) {
  const unknown = Object.keys(value).filter((key) => !allowed.has(key));
  if (unknown.length) throw new LabError("SCHEMA_INVALID", `${label} 含未知字段：${unknown.join(", ")}`);
}

function validateCompare(value, label) {
  if (value === undefined) return;
  requireRecord(value, label);
  assertKnownKeys(value, new Set(["mode", "absTol", "relTol"]), label);
  if (!COMPARE_MODES.has(value.mode)) throw new LabError("SCHEMA_INVALID", `${label}.mode 必须是 exact、tokens 或 float`);
  for (const key of ["absTol", "relTol"]) {
    if (value[key] !== undefined && (typeof value[key] !== "number" || value[key] < 0)) {
      throw new LabError("SCHEMA_INVALID", `${label}.${key} 必须是非负数`);
    }
  }
}

function validateLimits(value, label) {
  if (value === undefined) return;
  requireRecord(value, label);
  assertKnownKeys(value, new Set(["timeMs", "outputKb"]), label);
  for (const key of ["timeMs", "outputKb"]) {
    if (value[key] !== undefined) requirePositiveInteger(value[key], `${label}.${key}`);
  }
}

async function validateSources(labRoot, target, label) {
  requireRecord(target, label);
  assertKnownKeys(target, new Set(["sources", "includeDirs"]), label);
  if (!Array.isArray(target.sources) || target.sources.length === 0) {
    throw new LabError("SCHEMA_INVALID", `${label}.sources 必须是非空数组`);
  }
  for (const [index, source] of target.sources.entries()) {
    await resolveLabPath(labRoot, source, `${label}.sources[${index}]`);
  }
  if (target.includeDirs !== undefined) {
    if (!Array.isArray(target.includeDirs)) throw new LabError("SCHEMA_INVALID", `${label}.includeDirs 必须是数组`);
    for (const [index, dir] of target.includeDirs.entries()) {
      await resolveLabPath(labRoot, dir, `${label}.includeDirs[${index}]`);
    }
  }
}

export function validateQuizQuestions(questions, label = "quiz.json") {
  if (!Array.isArray(questions) || questions.length === 0) {
    throw new LabError("QUIZ_INVALID", `${label} 顶层必须是非空题目数组`);
  }
  const ids = new Set();
  let totalPoints = 0;
  questions.forEach((raw, index) => {
    const question = requireRecord(raw, `${label}: 第 ${index + 1} 题`);
    const itemLabel = `${label}: 第 ${index + 1} 题`;
    assertKnownKeys(question, new Set([
      "id", "title", "source", "difficulty", "topics", "targetId", "stem", "code", "options",
      "answer", "explanation", "hint", "points",
    ]), itemLabel);
    const id = requireString(question.id, `${itemLabel}.id`);
    requireString(question.stem, `${itemLabel}.stem`);
    requireString(question.explanation, `${itemLabel}.explanation`);
    if (ids.has(id)) throw new LabError("QUIZ_INVALID", `${itemLabel}: id ${id} 重复`);
    ids.add(id);
    if (!Array.isArray(question.options) || question.options.length !== 4) {
      throw new LabError("QUIZ_INVALID", `${itemLabel}.options 必须恰好包含 4 项`);
    }
    const normalized = question.options.map((option, optionIndex) => {
      const text = requireString(option, `${itemLabel}.options[${optionIndex}]`).trim();
      if (/^[A-DＡ-Ｄ][.．、:：)）]\s*/i.test(text)) {
        throw new LabError("QUIZ_INVALID", `${itemLabel}.options[${optionIndex}] 不要手写 A、B、C、D 前缀`);
      }
      return text.replace(/\s+/gu, " ").toLocaleLowerCase();
    });
    if (new Set(normalized).size !== normalized.length) throw new LabError("QUIZ_INVALID", `${itemLabel} 含重复选项`);
    if (!Number.isInteger(question.answer) || question.answer < 0 || question.answer > 3) {
      throw new LabError("QUIZ_INVALID", `${itemLabel}.answer 必须是 0～3 的整数`);
    }
    for (const field of ["title", "source", "difficulty", "targetId", "code", "hint"]) {
      if (question[field] !== undefined) requireString(question[field], `${itemLabel}.${field}`);
    }
    if (question.topics !== undefined) {
      if (!Array.isArray(question.topics) || question.topics.some((topic) => typeof topic !== "string" || !topic.trim())) {
        throw new LabError("QUIZ_INVALID", `${itemLabel}.topics 必须是非空字符串数组`);
      }
    }
    const points = question.points === undefined ? 1 : requirePositiveInteger(question.points, `${itemLabel}.points`);
    totalPoints += points;
  });
  return { count: questions.length, totalPoints };
}

export function validateQuizReadme(source, label = "README.md") {
  if (typeof source !== "string") throw new LabError("QUIZ_INVALID", `${label} 必须是文本文件`);
  const mountCount = [...source.matchAll(/<QuizSet\s*\/>/g)].length;
  if (mountCount !== 1) {
    throw new LabError("QUIZ_INVALID", `${label} 必须且只能挂载一次 <QuizSet />`);
  }
  const staticAnswerPatterns = [
    /^### 题 \d+/m,
    /^::: details 查看答案与解析/m,
    /答案速查|展开答案表/,
    /^#{2,6}\s*(?:参考|标准|正确)?答案(?:与解析|总览|速查|表)?\s*$/m,
    /^\|[^\n|]*(?:题号|题目)[^\n]*\|[^\n|]*(?:答案|正确选项)[^\n]*\|/m,
    /^(?:\*\*)?(?:正确|标准|参考)?答案(?:\*\*)?[：:]\s*[A-DＡ-Ｄ](?:\b|[.．、)）])/mi,
  ];
  if (staticAnswerPatterns.some((pattern) => pattern.test(source))) {
    throw new LabError("QUIZ_INVALID", `${label} 不得重复维护静态题目或折叠答案`);
  }
  return { mountCount };
}

export async function loadCases(labRoot, casesPath) {
  const absolute = await resolveLabPath(labRoot, casesPath, "judge.cases");
  const cases = await readJson(absolute, path.relative(labRoot, absolute));
  if (!Array.isArray(cases) || cases.length === 0) throw new LabError("CASES_INVALID", "cases.json 顶层必须是非空数组");
  const ids = new Set();
  let totalPoints = 0;
  for (const [index, raw] of cases.entries()) {
    const item = requireRecord(raw, `cases[${index}]`);
    assertKnownKeys(item, new Set(["id", "input", "expected", "points", "tags", "timeMs", "outputKb", "compare"]), `cases[${index}]`);
    const id = requireString(item.id, `cases[${index}].id`);
    if (!/^[a-z0-9][a-z0-9-]*$/.test(id)) throw new LabError("CASES_INVALID", `cases[${index}].id 格式无效：${id}`);
    if (ids.has(id)) throw new LabError("CASES_INVALID", `用例 id 重复：${id}`);
    ids.add(id);
    await resolveLabPath(labRoot, item.input, `cases[${index}].input`);
    await resolveLabPath(labRoot, item.expected, `cases[${index}].expected`);
    totalPoints += requirePositiveInteger(item.points, `cases[${index}].points`);
    if (item.tags !== undefined && (!Array.isArray(item.tags) || item.tags.some((tag) => typeof tag !== "string" || !tag.trim()))) {
      throw new LabError("CASES_INVALID", `cases[${index}].tags 必须是非空字符串数组`);
    }
    if (item.timeMs !== undefined) requirePositiveInteger(item.timeMs, `cases[${index}].timeMs`);
    if (item.outputKb !== undefined) requirePositiveInteger(item.outputKb, `cases[${index}].outputKb`);
    validateCompare(item.compare, `cases[${index}].compare`);
  }
  if (totalPoints !== 100) throw new LabError("CASES_POINTS", `测试用例分值必须合计 100，当前为 ${totalPoints}`);
  return cases;
}

function assertAcyclic(tasks) {
  const byId = new Map(tasks.map((task) => [task.id, task]));
  const state = new Map();
  const ordered = [];
  function visit(id, chain) {
    if (state.get(id) === "done") return;
    if (state.get(id) === "visiting") throw new LabError("TASK_CYCLE", `Project task 存在循环依赖：${[...chain, id].join(" -> ")}`);
    state.set(id, "visiting");
    const task = byId.get(id);
    for (const dependency of task.dependsOn ?? []) visit(dependency, [...chain, id]);
    state.set(id, "done");
    ordered.push(task);
  }
  for (const task of tasks) visit(task.id, []);
  return ordered;
}

async function validateThinMakefile(labRoot, distribution) {
  if (distribution === "student") return;
  const makefile = await readFile(path.join(labRoot, "Makefile"), "utf8").catch((error) => {
    if (error?.code === "ENOENT") throw new LabError("MAKEFILE_MISSING", "可执行 Lab 缺少薄 Makefile");
    throw error;
  });
  if (makefile.replace(/\r\n/g, "\n") !== THIN_MAKEFILE) {
    throw new LabError("MAKEFILE_DRIFT", "Lab Makefile 已偏离统一薄模板；请只 include tools/lab/lab.mk");
  }
}

async function validateProject(labRoot, manifest) {
  if (manifest.buildSystem !== "cmake") throw new LabError("SCHEMA_INVALID", "project.buildSystem 必须是 cmake");
  if (!Array.isArray(manifest.tasks) || manifest.tasks.length === 0) throw new LabError("SCHEMA_INVALID", "project.tasks 必须是非空数组");
  const ids = new Set();
  let totalWeight = 0;
  const tasks = [];
  for (const [index, raw] of manifest.tasks.entries()) {
    const task = requireRecord(raw, `tasks[${index}]`);
    assertKnownKeys(task, new Set(["id", "path", "weight", "kind", "dependsOn"]), `tasks[${index}]`);
    const id = requireString(task.id, `tasks[${index}].id`);
    if (!/^[a-z][a-z0-9-]*$/.test(id)) throw new LabError("SCHEMA_INVALID", `tasks[${index}].id 格式无效：${id}`);
    if (ids.has(id)) throw new LabError("TASK_DUPLICATE", `Project task id 重复：${id}`);
    ids.add(id);
    if (!TASK_KINDS.has(task.kind)) throw new LabError("SCHEMA_INVALID", `tasks[${index}].kind 无效`);
    const taskPath = await resolveLabPath(labRoot, task.path, `tasks[${index}].path`);
    const weight = requirePositiveInteger(task.weight, `tasks[${index}].weight`);
    totalWeight += weight;
    const dependsOn = task.dependsOn ?? [];
    if (!Array.isArray(dependsOn) || dependsOn.some((item) => typeof item !== "string" || !item.trim())) {
      throw new LabError("SCHEMA_INVALID", `tasks[${index}].dependsOn 必须是字符串数组`);
    }
    tasks.push({ ...task, taskPath, dependsOn });
  }
  if (totalWeight !== 100) throw new LabError("TASK_WEIGHTS", `Project task 权重必须合计 100，当前为 ${totalWeight}`);
  for (const task of tasks) {
    for (const dependency of task.dependsOn) {
      if (!ids.has(dependency)) throw new LabError("TASK_DEPENDENCY", `${task.id} 依赖不存在的 task：${dependency}`);
      if (dependency === task.id) throw new LabError("TASK_CYCLE", `${task.id} 不能依赖自身`);
    }
  }
  const orderedTasks = assertAcyclic(tasks);
  for (const task of orderedTasks) {
    const taskManifestPath = path.join(task.taskPath, "task.json");
    const config = await readJson(taskManifestPath, path.relative(labRoot, taskManifestPath));
    requireRecord(config, `${task.id}/task.json`);
    assertKnownKeys(config, new Set(["$schema", "schemaVersion", "kind", "targets", "judge", "ctest", "checklist"]), `${task.id}/task.json`);
    if (config.schemaVersion !== LAB_SCHEMA_VERSION) throw new LabError("SCHEMA_VERSION", `${task.id}/task.json 的 schemaVersion 必须是 ${LAB_SCHEMA_VERSION}`);
    if (config.kind !== task.kind) throw new LabError("TASK_KIND", `${task.id} 的顶层 kind 与 task.json 不一致`);
    if (task.kind === "stdio") {
      const targets = requireRecord(config.targets, `${task.id}.targets`);
      assertKnownKeys(targets, new Set(["student", "solution"]), `${task.id}.targets`);
      await validateSources(task.taskPath, targets.student, `${task.id}.targets.student`);
      if (targets.solution) await validateSources(task.taskPath, targets.solution, `${task.id}.targets.solution`);
      else if (manifest.distribution !== "student") throw new LabError("SCHEMA_INVALID", `${task.id} 必须声明 targets.solution`);
      const judge = requireRecord(config.judge, `${task.id}.judge`);
      assertKnownKeys(judge, new Set(["kind", "cases", "compare", "limits"]), `${task.id}.judge`);
      if (judge.kind !== "stdio") throw new LabError("SCHEMA_INVALID", `${task.id}.judge.kind 必须是 stdio`);
      validateCompare(judge.compare, `${task.id}.judge.compare`);
      validateLimits(judge.limits, `${task.id}.judge.limits`);
      task.cases = await loadCases(task.taskPath, requireString(judge.cases, `${task.id}.judge.cases`));
    } else if (task.kind === "ctest") {
      const ctest = requireRecord(config.ctest, `${task.id}.ctest`);
      assertKnownKeys(ctest, new Set(["tests"]), `${task.id}.ctest`);
      if (!Array.isArray(ctest.tests) || ctest.tests.length === 0) throw new LabError("SCHEMA_INVALID", `${task.id}.ctest.tests 必须是非空数组`);
      const names = new Set();
      let points = 0;
      for (const [index, test] of ctest.tests.entries()) {
        requireRecord(test, `${task.id}.ctest.tests[${index}]`);
        assertKnownKeys(test, new Set(["name", "points"]), `${task.id}.ctest.tests[${index}]`);
        const name = requireString(test.name, `${task.id}.ctest.tests[${index}].name`);
        if (names.has(name)) throw new LabError("TASK_DUPLICATE", `${task.id} 的 CTest 名称重复：${name}`);
        names.add(name);
        points += requirePositiveInteger(test.points, `${task.id}.ctest.tests[${index}].points`);
      }
      if (points !== 100) throw new LabError("TASK_WEIGHTS", `${task.id} 的 CTest 分值必须合计 100，当前为 ${points}`);
    } else if (!Array.isArray(config.checklist) || config.checklist.length === 0 || config.checklist.some((item) => typeof item !== "string" || !item.trim())) {
      throw new LabError("SCHEMA_INVALID", `${task.id}.checklist 必须是非空字符串数组`);
    }
    task.config = config;
  }
  return orderedTasks;
}

export async function loadLab(start = process.cwd()) {
  const labRoot = await findLabRoot(start);
  const manifestPath = path.join(labRoot, "lab.json");
  const readmePath = await resolveLabPath(labRoot, "README.md", "README.md");
  const readme = await readFile(readmePath, "utf8");
  const labIdMatch = readme.match(/^labId:\s*["']?([^"'\s]+)["']?\s*$/m);
  const labId = labIdMatch ? parseLabId(labIdMatch[1]).id : undefined;
  const manifest = await readJson(manifestPath, path.relative(process.cwd(), manifestPath) || "lab.json");
  requireRecord(manifest, "lab.json");
  if (!Number.isInteger(manifest.schemaVersion)) throw new LabError("SCHEMA_VERSION", "schemaVersion 必须是整数");
  if (manifest.schemaVersion !== LAB_SCHEMA_VERSION) {
    throw new LabError("SCHEMA_VERSION", `不支持 schemaVersion ${manifest.schemaVersion}；当前 CLI 仅支持 ${LAB_SCHEMA_VERSION}`);
  }
  if (!LAB_TYPES.has(manifest.type)) throw new LabError("SCHEMA_INVALID", "type 必须是 quiz、program 或 project");
  const baseKeys = new Set(["$schema", "schemaVersion", "type", "distribution"]);
  if (manifest.distribution !== undefined && !["source", "student"].includes(manifest.distribution)) {
    throw new LabError("SCHEMA_INVALID", "distribution 必须是 source 或 student");
  }
  if (manifest.type === "quiz") {
    assertKnownKeys(manifest, new Set([...baseKeys, "quiz"]), "lab.json");
    const quiz = requireRecord(manifest.quiz, "quiz");
    assertKnownKeys(quiz, new Set(["questions", "questionType", "reveal", "scoring"]), "quiz");
    if (quiz.questionType !== undefined && quiz.questionType !== "single-choice") throw new LabError("SCHEMA_INVALID", "quiz.questionType 必须是 single-choice");
    if (quiz.reveal !== undefined && quiz.reveal !== "after-submit") throw new LabError("SCHEMA_INVALID", "quiz.reveal 必须是 after-submit");
    if (quiz.scoring !== undefined && !["equal", "points"].includes(quiz.scoring)) throw new LabError("SCHEMA_INVALID", "quiz.scoring 必须是 equal 或 points");
    validateQuizReadme(readme, path.relative(labRoot, readmePath));
    const quizPath = await resolveLabPath(labRoot, quiz.questions, "quiz.questions");
    const quizResult = validateQuizQuestions(await readJson(quizPath, path.relative(labRoot, quizPath)), path.relative(labRoot, quizPath));
    return { labRoot, manifestPath, manifest, labId, quizPath, quizResult };
  }
  if (manifest.language !== "cpp") throw new LabError("SCHEMA_INVALID", "可执行 Lab 的 language 必须是 cpp");
  const toolchain = requireRecord(manifest.toolchain, "toolchain");
  assertKnownKeys(toolchain, new Set(["standard", "profile"]), "toolchain");
  if (!["c++17", "c++20"].includes(toolchain.standard)) throw new LabError("SCHEMA_INVALID", "toolchain.standard 必须是 c++17 或 c++20");
  if (toolchain.profile !== undefined) requireString(toolchain.profile, "toolchain.profile");
  if (manifest.type === "program") {
    assertKnownKeys(manifest, new Set([...baseKeys, "language", "toolchain", "targets", "judge"]), "lab.json");
    const targets = requireRecord(manifest.targets, "targets");
    assertKnownKeys(targets, new Set(["student", "solution"]), "targets");
    await validateSources(labRoot, targets.student, "targets.student");
    if (targets.solution) await validateSources(labRoot, targets.solution, "targets.solution");
    else if (manifest.distribution !== "student") throw new LabError("SCHEMA_INVALID", "源码仓库中的 program 必须声明 targets.solution");
    const judge = requireRecord(manifest.judge, "judge");
    assertKnownKeys(judge, new Set(["kind", "cases", "compare", "limits"]), "judge");
    if (judge.kind !== "stdio") throw new LabError("SCHEMA_INVALID", "judge.kind 必须是 stdio");
    validateCompare(judge.compare, "judge.compare");
    validateLimits(judge.limits, "judge.limits");
    const cases = await loadCases(labRoot, requireString(judge.cases, "judge.cases"));
    await validateThinMakefile(labRoot, manifest.distribution);
    return { labRoot, manifestPath, manifest, labId, cases };
  }
  assertKnownKeys(manifest, new Set([...baseKeys, "language", "toolchain", "buildSystem", "tasks"]), "lab.json");
  const tasks = await validateProject(labRoot, manifest);
  await validateThinMakefile(labRoot, manifest.distribution);
  return { labRoot, manifestPath, manifest, labId, tasks };
}

export function createReport(command, lab, data = {}) {
  return {
    reportVersion: JSON_REPORT_VERSION,
    command,
    ok: true,
    lab: {
      id: lab.labId,
      path: lab.labRoot,
      type: lab.manifest.type,
      schemaVersion: lab.manifest.schemaVersion,
    },
    ...data,
  };
}
