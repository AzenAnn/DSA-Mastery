#!/usr/bin/env node
import process from "node:process";
import { access, cp, lstat, mkdir, open, readFile, readdir, realpath, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { Buffer } from "node:buffer";
import { execFileSync, spawn } from "node:child_process";
import { stripVTControlCharacters } from "node:util";
import { createHash } from "node:crypto";
//#region ../lab-core/src/errors.ts
const EXIT = {
	OK: 0,
	SCORE_NOT_FULL: 1,
	TOOL_ERROR: 2
};
var LabError = class extends Error {
	code;
	details;
	constructor(code, message, details) {
		super(message);
		this.name = "LabError";
		this.code = code;
		this.details = details;
	}
};
function asLabError(error) {
	if (error instanceof LabError) return error;
	return new LabError("LAB_INTERNAL", error instanceof Error ? error.message : String(error));
}
//#endregion
//#region ../lab-core/src/identity/lab-id.ts
function padMinimum(value, width = 2) {
	return String(value).padStart(width, "0");
}
function integer(value, label, minimum = 0) {
	const parsed = Number(value);
	if (!Number.isInteger(parsed) || parsed < minimum) throw new LabError("ARGUMENT_INVALID", `${label} 必须是大于等于 ${minimum} 的整数`);
	return parsed;
}
function formatLabId(chapter, tag, sequence) {
	const normalizedChapter = integer(chapter, "章节", 0);
	const normalizedSequence = integer(sequence, "Lab 类型内序号", 1);
	const normalizedTag = String(tag ?? "").toUpperCase();
	if (!(/* @__PURE__ */ new Set([
		"T",
		"E",
		"P"
	])).has(normalizedTag)) throw new LabError("LAB_ID_INVALID", "Lab 类型标签必须是 T、E 或 P");
	if (normalizedChapter > 99) throw new LabError("LAB_ID_INVALID", "Lab 章节必须在 0～99 之间");
	return `${padMinimum(normalizedChapter)}${normalizedTag}${padMinimum(normalizedSequence)}`;
}
function parseLabId(value) {
	const source = String(value ?? "").trim();
	const match = source.match(/^(?:lab-?)?(\d{1,2})-?([tep])-?(\d+)$/i);
	if (!match) throw new LabError("LAB_ID_INVALID", `Lab ID 格式无效：${source || "(empty)"}；示例：02T03、02T3、02-T-03`);
	const chapter = Number(match[1]);
	const tag = match[2].toUpperCase();
	const sequence = Number(match[3]);
	if (!Number.isInteger(sequence) || sequence < 1) throw new LabError("LAB_ID_INVALID", "Lab 类型内序号必须从 1 开始");
	return {
		id: formatLabId(chapter, tag, sequence),
		chapter,
		tag,
		sequence
	};
}
function normalizeLabId(value) {
	return parseLabId(value).id;
}
function formatLabDocumentTitlePrefix(value) {
	const { chapter, tag, sequence } = parseLabId(value);
	return `Lab ${padMinimum(chapter)}-${tag}-${padMinimum(sequence)}：`;
}
//#endregion
//#region ../lab-core/src/identity/frontmatter.ts
const BLOCK = /^---[^\S\r\n]*\r?\n([\s\S]*?)\r?\n---\s*/;
/**
* 课程 frontmatter 只用扁平的 `key: value`，所以这里不引入 YAML 解析器 —— 判题内核要保持零第三方依赖。
* 需要数组或嵌套值的站点索引另行使用 gray-matter。
*/
function parseFrontmatter(source, label = "README.md") {
	const match = source.match(BLOCK);
	if (!match) throw new LabError("FRONTMATTER_INVALID", `${label}: 缺少 YAML frontmatter`);
	const data = {};
	for (const line of match[1].split(/\r?\n/)) {
		const separator = line.indexOf(":");
		if (separator === -1) continue;
		data[line.slice(0, separator).trim()] = line.slice(separator + 1).trim().replace(/^(["'])(.*)\1$/, "$2");
	}
	return {
		data,
		body: source.slice(match[0].length)
	};
}
//#endregion
//#region ../lab-core/src/identity/layout.ts
const LAB_TYPES = /* @__PURE__ */ new Set([
	"quiz",
	"program",
	"project"
]);
const LAB_CATEGORIES = [
	"theory",
	"exercise",
	"project"
];
const LAB_TYPE_TO_TAG = {
	quiz: "T",
	program: "E",
	project: "P"
};
const LAB_TYPE_TO_CATEGORY = {
	quiz: "theory",
	program: "exercise",
	project: "project"
};
const LAB_CATEGORY_TO_TAG = {
	theory: "T",
	exercise: "E",
	project: "P"
};
const LAB_DIRECTORY_PATTERN = /^([TEP])-(\d{2})-(\d{2,})-([a-z0-9]+(?:-[a-z0-9]+)*)$/;
const LAB_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const CHAPTER_DIRECTORY_PATTERN = /^chapter-(\d{2})$/;
function isLabType(value) {
	return typeof value === "string" && LAB_TYPES.has(value);
}
function tagForType(type) {
	if (!isLabType(type)) throw new LabError("ARGUMENT_INVALID", "--type 必须是 quiz、program 或 project");
	return LAB_TYPE_TO_TAG[type];
}
function categoryForType(type) {
	return LAB_TYPE_TO_CATEGORY[type];
}
function tagForCategory(category) {
	return LAB_CATEGORY_TO_TAG[category];
}
function formatLabDirectoryName(value, slug) {
	const identity = parseLabId(value);
	const normalizedSlug = String(slug ?? "").trim();
	if (!LAB_SLUG_PATTERN.test(normalizedSlug)) throw new LabError("ARGUMENT_INVALID", "Lab slug 必须是小写 kebab-case");
	return `${identity.tag}-${String(identity.chapter).padStart(2, "0")}-${String(identity.sequence).padStart(2, "0")}-${normalizedSlug}`;
}
function parseLabDirectoryName(value) {
	const source = String(value ?? "").trim();
	const match = source.match(LAB_DIRECTORY_PATTERN);
	if (!match) throw new LabError("LAB_PATH_INVALID", `Lab 目录格式无效：${source || "(empty)"}；应为 X-CC-SS-kebab-slug`);
	return {
		...parseLabId(formatLabId(Number(match[2]), match[1], Number(match[3]))),
		slug: match[4],
		directoryName: source
	};
}
//#endregion
//#region ../lab-core/src/manifest/compare.ts
function normalizeNewlines(value) {
	return value.replace(/\r\n?/g, "\n");
}
function removeOptionalFinalLineBreak(value) {
	return value.endsWith("\n") ? value.slice(0, -1) : value;
}
function normalizeExact(value) {
	return removeOptionalFinalLineBreak(normalizeNewlines(value).split("\n").map((line) => line.replace(/[\t ]+$/u, "")).join("\n"));
}
function locationAt(value, offset) {
	const lines = value.slice(0, offset).split("\n");
	return {
		line: lines.length,
		column: lines.at(-1).length + 1
	};
}
function excerpt(value, offset) {
	return value.slice(Math.max(0, offset - 24), offset + 48).replaceAll("\n", "\\n");
}
function exact(expected, actual) {
	const left = normalizeExact(expected);
	const right = normalizeExact(actual);
	if (left === right) return { equal: true };
	let index = 0;
	while (index < left.length && index < right.length && left[index] === right[index]) index += 1;
	return {
		equal: false,
		difference: {
			kind: "character",
			index,
			...locationAt(left, index),
			expected: excerpt(left, index),
			actual: excerpt(right, index)
		}
	};
}
function tokens(value) {
	return normalizeNewlines(value).match(/\S+/gu) ?? [];
}
function isNumericToken(value) {
	return /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(value);
}
function tokenCompare(expected, actual, config) {
	const left = tokens(expected);
	const right = tokens(actual);
	const absTol = config.absTol ?? 1e-6;
	const relTol = config.relTol ?? 1e-6;
	for (let index = 0; index < Math.max(left.length, right.length); index += 1) {
		const expectedToken = left[index];
		const actualToken = right[index];
		let equal = expectedToken === actualToken;
		if (config.mode === "float" && isNumericToken(expectedToken ?? "") && isNumericToken(actualToken ?? "")) {
			const expectedNumber = Number(expectedToken);
			const actualNumber = Number(actualToken);
			equal = Number.isFinite(expectedNumber) && Number.isFinite(actualNumber) && Math.abs(expectedNumber - actualNumber) <= Math.max(absTol, relTol * Math.max(Math.abs(expectedNumber), Math.abs(actualNumber)));
		}
		if (!equal) return {
			equal: false,
			difference: {
				kind: "token",
				index: index + 1,
				expected: expectedToken ?? "<end of output>",
				actual: actualToken ?? "<end of output>"
			}
		};
	}
	return { equal: true };
}
function compareOutput(expected, actual, config = { mode: "tokens" }) {
	if (config.mode === "exact") return exact(expected, actual);
	return tokenCompare(expected, actual, config);
}
//#endregion
//#region ../lab-core/src/manifest/makefile.ts
/** 仓库内 Lab 的薄 Makefile：`../../../../` 对应 labs/chapter-NN/<category>/<lab>/ 的深度。 */
const THIN_MAKEFILE = "LAB_DIR := $(CURDIR)\nREPO_ROOT := $(LAB_DIR)/../../../..\ninclude ../../../../packages/lab-cli/lab.mk\n";
/** 学生包是自包含的：判题内核和 lab.mk 都躺在 Lab 目录里，不依赖仓库布局。 */
const STANDALONE_MAKEFILE = "LAB_DIR := $(CURDIR)\nREPO_ROOT := $(LAB_DIR)\nLAB_CLI_JS := $(LAB_DIR)/lab-cli.js\ninclude lab.mk\n";
/** 学生包里判题内核的文件名，`STANDALONE_MAKEFILE` 与打包逻辑共用。 */
const STANDALONE_CLI_FILENAME = "lab-cli.js";
//#endregion
//#region ../lab-core/src/manifest/schema.ts
function isRecord(value) {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}
async function pathExists(target) {
	try {
		await access(target);
		return true;
	} catch {
		return false;
	}
}
async function readJson(file, label = file) {
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
function requireStringArray(value, label, code = "SCHEMA_INVALID") {
	if (!Array.isArray(value) || value.some((item) => typeof item !== "string" || !item.trim())) throw new LabError(code, `${label} 必须是非空字符串数组`);
	return value;
}
//#endregion
//#region ../lab-core/src/manifest/quiz.ts
const QUESTION_KEYS = /* @__PURE__ */ new Set([
	"id",
	"title",
	"source",
	"difficulty",
	"topics",
	"targetId",
	"stem",
	"code",
	"options",
	"answer",
	"explanation",
	"hint",
	"points",
	"optionTargets",
	"block"
]);
const OPTIONAL_STRING_KEYS = [
	"title",
	"source",
	"difficulty",
	"targetId",
	"code",
	"hint",
	"block"
];
const OPTION_PREFIX = /^[A-DＡＢＣＤ][.．、:：)）]\s*/i;
function optionalString(value, label) {
	return value === void 0 ? void 0 : requireString(value, label);
}
function parseQuestion(value, index, label) {
	const itemLabel = `${label}: 第 ${index + 1} 题`;
	const raw = requireRecord(value, itemLabel);
	assertKnownKeys(raw, QUESTION_KEYS, itemLabel);
	if (!Array.isArray(raw["options"]) || raw["options"].length !== 4) throw new LabError("QUIZ_INVALID", `${itemLabel}.options 必须恰好包含 4 项`);
	const options = raw["options"].map((option, optionIndex) => {
		const text = requireString(option, `${itemLabel}.options[${optionIndex}]`);
		if (OPTION_PREFIX.test(text.trim())) throw new LabError("QUIZ_INVALID", `${itemLabel}.options[${optionIndex}] 不要手写 A、B、C、D 前缀`);
		return text;
	});
	const normalized = options.map((option) => option.trim().replace(/\s+/gu, " ").toLocaleLowerCase());
	if (new Set(normalized).size !== normalized.length) throw new LabError("QUIZ_INVALID", `${itemLabel} 含重复选项`);
	if (!Number.isInteger(raw["answer"]) || raw["answer"] < 0 || raw["answer"] > 3) throw new LabError("QUIZ_INVALID", `${itemLabel}.answer 必须是 0～3 的整数`);
	const question = {
		id: requireString(raw["id"], `${itemLabel}.id`),
		stem: requireString(raw["stem"], `${itemLabel}.stem`),
		explanation: requireString(raw["explanation"], `${itemLabel}.explanation`),
		options,
		answer: raw["answer"],
		points: raw["points"] === void 0 ? 1 : requirePositiveInteger(raw["points"], `${itemLabel}.points`)
	};
	for (const key of OPTIONAL_STRING_KEYS) {
		const text = optionalString(raw[key], `${itemLabel}.${key}`);
		if (text !== void 0) question[key] = text;
	}
	if (raw["topics"] !== void 0) question.topics = requireStringArray(raw["topics"], `${itemLabel}.topics`, "QUIZ_INVALID");
	if (raw["optionTargets"] !== void 0) question.optionTargets = requireStringArray(raw["optionTargets"], `${itemLabel}.optionTargets`, "QUIZ_INVALID");
	return question;
}
function parseQuizQuestions(value, label = "quiz.json") {
	if (!Array.isArray(value) || value.length === 0) throw new LabError("QUIZ_INVALID", `${label} 顶层必须是非空题目数组`);
	const questions = value.map((question, index) => parseQuestion(question, index, label));
	const ids = /* @__PURE__ */ new Set();
	for (const question of questions) {
		if (ids.has(question.id)) throw new LabError("QUIZ_INVALID", `${label}: id ${question.id} 重复`);
		ids.add(question.id);
	}
	return questions;
}
function countQuizMounts(source) {
	return [...source.matchAll(/<QuizSet\s*\/>/g)].length;
}
const STATIC_ANSWER_PATTERNS = [
	/^### 题 \d+/m,
	/^::: details 查看答案与解析/m,
	/答案速查|展开答案表/,
	/^#{2,6}\s*(?:参考|标准|正确)?答案(?:与解析|总览|速查|表)?\s*$/m,
	/^\|[^\n|]*(?:题号|题目)[^\n]*\|[^\n|]*(?:答案|正确选项)[^\n]*\|/m,
	/^(?:\*\*)?(?:正确|标准|参考)?答案(?:\*\*)?[：:]\s*[A-DＡＢＣＤ](?:\b|[.．、)）])/im
];
function validateQuizReadme(source, label = "README.md") {
	if (typeof source !== "string") throw new LabError("QUIZ_INVALID", `${label} 必须是文本文件`);
	const mountCount = countQuizMounts(source);
	if (mountCount !== 1) throw new LabError("QUIZ_INVALID", `${label} 必须且只能挂载一次 <QuizSet />`);
	if (STATIC_ANSWER_PATTERNS.some((pattern) => pattern.test(source))) throw new LabError("QUIZ_INVALID", `${label} 不得重复维护静态题目或折叠答案`);
	return { mountCount };
}
//#endregion
//#region ../lab-core/src/manifest/manifest.ts
const LAB_SCHEMA_VERSION = 1;
const JSON_REPORT_VERSION = 1;
const COMPARE_MODES = /* @__PURE__ */ new Set([
	"exact",
	"tokens",
	"float"
]);
const TASK_KINDS = /* @__PURE__ */ new Set([
	"stdio",
	"ctest",
	"manual"
]);
function isQuizLab(lab) {
	return lab.manifest.type === "quiz";
}
function isProgramLab(lab) {
	return lab.manifest.type === "program";
}
function isProjectLab(lab) {
	return lab.manifest.type === "project";
}
async function findLabRoot(start = process.cwd()) {
	let current = path.resolve(start);
	if (await pathExists(current)) {
		if (!(await lstat(current)).isDirectory()) current = path.dirname(current);
	}
	while (true) {
		if (await pathExists(path.join(current, "lab.json"))) return current;
		const parent = path.dirname(current);
		if (parent === current) break;
		current = parent;
	}
	throw new LabError("LAB_NOT_FOUND", `从 ${path.resolve(start)} 向上未找到 lab.json`);
}
function isWithin(root, target) {
	const relative = path.relative(root, target);
	return relative === "" || !relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative);
}
async function resolveLabPath(labRoot, value, label, { mustExist = true } = {}) {
	if (typeof value !== "string" || !value.trim()) throw new LabError("PATH_INVALID", `${label} 必须是非空相对路径`);
	if (path.isAbsolute(value)) throw new LabError("PATH_ESCAPE", `${label} 不得使用绝对路径：${value}`);
	const root = path.resolve(labRoot);
	const target = path.resolve(root, value);
	if (!isWithin(root, target)) throw new LabError("PATH_ESCAPE", `${label} 不能逃出当前 Lab：${value}`);
	if (!mustExist) return target;
	if (!await pathExists(target)) throw new LabError("FILE_NOT_FOUND", `${label} 不存在：${value}`);
	const [realRoot, realTarget] = await Promise.all([realpath(root), realpath(target)]);
	if (!isWithin(realRoot, realTarget)) throw new LabError("PATH_ESCAPE", `${label} 通过符号链接逃出当前 Lab：${value}`);
	return target;
}
function validateCompare(value, label) {
	if (value === void 0) return void 0;
	const compare = requireRecord(value, label);
	assertKnownKeys(compare, /* @__PURE__ */ new Set([
		"mode",
		"absTol",
		"relTol"
	]), label);
	if (!COMPARE_MODES.has(compare["mode"])) throw new LabError("SCHEMA_INVALID", `${label}.mode 必须是 exact、tokens 或 float`);
	for (const key of ["absTol", "relTol"]) if (compare[key] !== void 0 && (typeof compare[key] !== "number" || compare[key] < 0)) throw new LabError("SCHEMA_INVALID", `${label}.${key} 必须是非负数`);
	return compare;
}
function validateLimits(value, label) {
	if (value === void 0) return void 0;
	const limits = requireRecord(value, label);
	assertKnownKeys(limits, /* @__PURE__ */ new Set(["timeMs", "outputKb"]), label);
	for (const key of ["timeMs", "outputKb"]) if (limits[key] !== void 0) requirePositiveInteger(limits[key], `${label}.${key}`);
	return limits;
}
async function validateSources(labRoot, value, label) {
	const target = requireRecord(value, label);
	assertKnownKeys(target, /* @__PURE__ */ new Set(["sources", "includeDirs"]), label);
	if (!Array.isArray(target["sources"]) || target["sources"].length === 0) throw new LabError("SCHEMA_INVALID", `${label}.sources 必须是非空数组`);
	for (const [index, source] of target["sources"].entries()) await resolveLabPath(labRoot, source, `${label}.sources[${index}]`);
	if (target["includeDirs"] !== void 0) {
		if (!Array.isArray(target["includeDirs"])) throw new LabError("SCHEMA_INVALID", `${label}.includeDirs 必须是数组`);
		for (const [index, dir] of target["includeDirs"].entries()) await resolveLabPath(labRoot, dir, `${label}.includeDirs[${index}]`);
	}
	return target;
}
async function loadCases(labRoot, casesPath) {
	const absolute = await resolveLabPath(labRoot, casesPath, "judge.cases");
	const cases = await readJson(absolute, path.relative(labRoot, absolute));
	if (!Array.isArray(cases) || cases.length === 0) throw new LabError("CASES_INVALID", "cases.json 顶层必须是非空数组");
	const ids = /* @__PURE__ */ new Set();
	let totalPoints = 0;
	for (const [index, raw] of cases.entries()) {
		const item = requireRecord(raw, `cases[${index}]`);
		assertKnownKeys(item, /* @__PURE__ */ new Set([
			"id",
			"input",
			"expected",
			"points",
			"tags",
			"timeMs",
			"outputKb",
			"compare"
		]), `cases[${index}]`);
		const id = requireString(item["id"], `cases[${index}].id`);
		if (!/^[a-z0-9][a-z0-9-]*$/.test(id)) throw new LabError("CASES_INVALID", `cases[${index}].id 格式无效：${id}`);
		if (ids.has(id)) throw new LabError("CASES_INVALID", `用例 id 重复：${id}`);
		ids.add(id);
		await resolveLabPath(labRoot, item["input"], `cases[${index}].input`);
		await resolveLabPath(labRoot, item["expected"], `cases[${index}].expected`);
		totalPoints += requirePositiveInteger(item["points"], `cases[${index}].points`);
		if (item["tags"] !== void 0) requireStringArray(item["tags"], `cases[${index}].tags`, "CASES_INVALID");
		if (item["timeMs"] !== void 0) requirePositiveInteger(item["timeMs"], `cases[${index}].timeMs`);
		if (item["outputKb"] !== void 0) requirePositiveInteger(item["outputKb"], `cases[${index}].outputKb`);
		validateCompare(item["compare"], `cases[${index}].compare`);
	}
	if (totalPoints !== 100) throw new LabError("CASES_POINTS", `测试用例分值必须合计 100，当前为 ${totalPoints}`);
	return cases;
}
function assertAcyclic(tasks) {
	const byId = new Map(tasks.map((task) => [task.id, task]));
	const state = /* @__PURE__ */ new Map();
	const ordered = [];
	function visit(id, chain) {
		if (state.get(id) === "done") return;
		if (state.get(id) === "visiting") throw new LabError("TASK_CYCLE", `Project task 存在循环依赖：${[...chain, id].join(" -> ")}`);
		state.set(id, "visiting");
		const task = byId.get(id);
		for (const dependency of /* @__PURE__ */ new Set([...task.dependsOn, ...task.buildDependsOn ?? []])) visit(dependency, [...chain, id]);
		state.set(id, "done");
		ordered.push(task);
	}
	for (const task of tasks) visit(task.id, []);
	return ordered;
}
async function validateThinMakefile(labRoot, distribution) {
	if (distribution === "student") return;
	if ((await readFile(path.join(labRoot, "Makefile"), "utf8").catch((error) => {
		if (error?.code === "ENOENT") throw new LabError("MAKEFILE_MISSING", "可执行 Lab 缺少薄 Makefile");
		throw error;
	})).replace(/\r\n/g, "\n") !== "LAB_DIR := $(CURDIR)\nREPO_ROOT := $(LAB_DIR)/../../../..\ninclude ../../../../packages/lab-cli/lab.mk\n") throw new LabError("MAKEFILE_DRIFT", "Lab Makefile 已偏离统一薄模板；请只 include packages/lab-cli/lab.mk");
}
function validateCtest(config, taskId) {
	const ctest = requireRecord(config["ctest"], `${taskId}.ctest`);
	assertKnownKeys(ctest, /* @__PURE__ */ new Set([
		"tests",
		"buildTargets",
		"moduleTargets"
	]), `${taskId}.ctest`);
	for (const key of ["buildTargets", "moduleTargets"]) {
		const targets = ctest[key];
		if (targets === void 0) continue;
		if (!(Array.isArray(targets) && targets.length > 0 && targets.every((name) => typeof name === "string" && /^\w[\w.+-]*$/.test(name)) && new Set(targets).size === targets.length)) throw new LabError("SCHEMA_INVALID", `${taskId}.ctest.${key} 必须是非空、无重复的 CMake target 数组`);
	}
	if (!Array.isArray(ctest["tests"]) || ctest["tests"].length === 0) throw new LabError("SCHEMA_INVALID", `${taskId}.ctest.tests 必须是非空数组`);
	const names = /* @__PURE__ */ new Set();
	let points = 0;
	for (const [index, entry] of ctest["tests"].entries()) {
		const test = requireRecord(entry, `${taskId}.ctest.tests[${index}]`);
		assertKnownKeys(test, /* @__PURE__ */ new Set(["name", "points"]), `${taskId}.ctest.tests[${index}]`);
		const name = requireString(test["name"], `${taskId}.ctest.tests[${index}].name`);
		if (names.has(name)) throw new LabError("TASK_DUPLICATE", `${taskId} 的 CTest 名称重复：${name}`);
		names.add(name);
		points += requirePositiveInteger(test["points"], `${taskId}.ctest.tests[${index}].points`);
	}
	if (points !== 100) throw new LabError("TASK_WEIGHTS", `${taskId} 的 CTest 分值必须合计 100，当前为 ${points}`);
}
async function validateProject(labRoot, manifest) {
	if (manifest.buildSystem !== "cmake") throw new LabError("SCHEMA_INVALID", "project.buildSystem 必须是 cmake");
	if (!Array.isArray(manifest.tasks) || manifest.tasks.length === 0) throw new LabError("SCHEMA_INVALID", "project.tasks 必须是非空数组");
	const ids = /* @__PURE__ */ new Set();
	let totalWeight = 0;
	const tasks = [];
	for (const [index, raw] of manifest.tasks.entries()) {
		const task = requireRecord(raw, `tasks[${index}]`);
		assertKnownKeys(task, /* @__PURE__ */ new Set([
			"id",
			"path",
			"weight",
			"kind",
			"dependsOn",
			"buildDependsOn"
		]), `tasks[${index}]`);
		const id = requireString(task["id"], `tasks[${index}].id`);
		if (!/^[a-z][a-z0-9-]*$/.test(id)) throw new LabError("SCHEMA_INVALID", `tasks[${index}].id 格式无效：${id}`);
		if (ids.has(id)) throw new LabError("TASK_DUPLICATE", `Project task id 重复：${id}`);
		ids.add(id);
		if (!TASK_KINDS.has(task["kind"])) throw new LabError("SCHEMA_INVALID", `tasks[${index}].kind 无效`);
		const taskPath = await resolveLabPath(labRoot, task["path"], `tasks[${index}].path`);
		totalWeight += requirePositiveInteger(task["weight"], `tasks[${index}].weight`);
		const dependsOn = task["dependsOn"] === void 0 ? [] : requireStringArray(task["dependsOn"], `tasks[${index}].dependsOn`);
		if (task["buildDependsOn"] !== void 0) {
			if (requireStringArray(task["buildDependsOn"], `tasks[${index}].buildDependsOn`).some((item) => !/^[a-z][a-z0-9-]*$/.test(item))) throw new LabError("SCHEMA_INVALID", `tasks[${index}].buildDependsOn 必须是 task ID 数组`);
		}
		for (const dependencies of [dependsOn, task["buildDependsOn"] ?? []]) if (new Set(dependencies).size !== dependencies.length) throw new LabError("TASK_DUPLICATE", `${id} 的依赖重复`);
		tasks.push({
			...task,
			taskPath,
			dependsOn,
			config: void 0
		});
	}
	if (totalWeight !== 100) throw new LabError("TASK_WEIGHTS", `Project task 权重必须合计 100，当前为 ${totalWeight}`);
	for (const task of tasks) for (const dependency of /* @__PURE__ */ new Set([...task.dependsOn, ...task.buildDependsOn ?? []])) {
		if (!ids.has(dependency)) throw new LabError("TASK_DEPENDENCY", `${task.id} 依赖不存在的 task：${dependency}`);
		if (dependency === task.id) throw new LabError("TASK_CYCLE", `${task.id} 不能依赖自身`);
	}
	const orderedTasks = assertAcyclic(tasks);
	for (const task of orderedTasks) {
		const taskManifestPath = path.join(task.taskPath, "task.json");
		const config = requireRecord(await readJson(taskManifestPath, path.relative(labRoot, taskManifestPath)), `${task.id}/task.json`);
		assertKnownKeys(config, /* @__PURE__ */ new Set([
			"$schema",
			"schemaVersion",
			"kind",
			"targets",
			"judge",
			"ctest",
			"checklist"
		]), `${task.id}/task.json`);
		if (config["schemaVersion"] !== LAB_SCHEMA_VERSION) throw new LabError("SCHEMA_VERSION", `${task.id}/task.json 的 schemaVersion 必须是 ${LAB_SCHEMA_VERSION}`);
		if (config["kind"] !== task.kind) throw new LabError("TASK_KIND", `${task.id} 的顶层 kind 与 task.json 不一致`);
		if (task.kind === "stdio") {
			const targets = requireRecord(config["targets"], `${task.id}.targets`);
			assertKnownKeys(targets, /* @__PURE__ */ new Set(["student", "solution"]), `${task.id}.targets`);
			await validateSources(task.taskPath, targets["student"], `${task.id}.targets.student`);
			if (targets["solution"] !== void 0) await validateSources(task.taskPath, targets["solution"], `${task.id}.targets.solution`);
			else if (manifest.distribution !== "student") throw new LabError("SCHEMA_INVALID", `${task.id} 必须声明 targets.solution`);
			const judge = requireRecord(config["judge"], `${task.id}.judge`);
			assertKnownKeys(judge, /* @__PURE__ */ new Set([
				"kind",
				"cases",
				"compare",
				"limits"
			]), `${task.id}.judge`);
			if (judge["kind"] !== "stdio") throw new LabError("SCHEMA_INVALID", `${task.id}.judge.kind 必须是 stdio`);
			validateCompare(judge["compare"], `${task.id}.judge.compare`);
			validateLimits(judge["limits"], `${task.id}.judge.limits`);
			task.cases = await loadCases(task.taskPath, requireString(judge["cases"], `${task.id}.judge.cases`));
		} else if (task.kind === "ctest") validateCtest(config, task.id);
		else if (!Array.isArray(config["checklist"]) || config["checklist"].length === 0 || config["checklist"].some((item) => typeof item !== "string" || !item.trim())) throw new LabError("SCHEMA_INVALID", `${task.id}.checklist 必须是非空字符串数组`);
		task.config = config;
	}
	return orderedTasks;
}
function validateToolchain(value) {
	const toolchain = requireRecord(value, "toolchain");
	assertKnownKeys(toolchain, /* @__PURE__ */ new Set(["standard", "profile"]), "toolchain");
	if (!["c++17", "c++20"].includes(toolchain["standard"])) throw new LabError("SCHEMA_INVALID", "toolchain.standard 必须是 c++17 或 c++20");
	if (toolchain["profile"] !== void 0) requireString(toolchain["profile"], "toolchain.profile");
	return toolchain;
}
const BASE_KEYS = [
	"$schema",
	"schemaVersion",
	"type",
	"distribution"
];
async function loadLab(start = process.cwd()) {
	const labRoot = await findLabRoot(start);
	const manifestPath = path.join(labRoot, "lab.json");
	const readmePath = await resolveLabPath(labRoot, "README.md", "README.md");
	const readme = await readFile(readmePath, "utf8");
	const labIdMatch = readme.match(/^labId:\s*["']?([^"'\s]+)["']?\s*$/m);
	const labId = labIdMatch ? parseLabId(labIdMatch[1]).id : void 0;
	const manifest = requireRecord(await readJson(manifestPath, path.relative(process.cwd(), manifestPath) || "lab.json"), "lab.json");
	if (!Number.isInteger(manifest["schemaVersion"])) throw new LabError("SCHEMA_VERSION", "schemaVersion 必须是整数");
	if (manifest["schemaVersion"] !== LAB_SCHEMA_VERSION) throw new LabError("SCHEMA_VERSION", `不支持 schemaVersion ${String(manifest["schemaVersion"])}；当前 CLI 仅支持 ${LAB_SCHEMA_VERSION}`);
	if (!isLabType(manifest["type"])) throw new LabError("SCHEMA_INVALID", "type 必须是 quiz、program 或 project");
	if (manifest["distribution"] !== void 0 && !["source", "student"].includes(manifest["distribution"])) throw new LabError("SCHEMA_INVALID", "distribution 必须是 source 或 student");
	const distribution = manifest["distribution"];
	if (manifest["type"] === "quiz") {
		assertKnownKeys(manifest, /* @__PURE__ */ new Set([...BASE_KEYS, "quiz"]), "lab.json");
		const quiz = requireRecord(manifest["quiz"], "quiz");
		assertKnownKeys(quiz, /* @__PURE__ */ new Set([
			"questions",
			"questionType",
			"reveal",
			"scoring"
		]), "quiz");
		if (quiz["questionType"] !== void 0 && quiz["questionType"] !== "single-choice") throw new LabError("SCHEMA_INVALID", "quiz.questionType 必须是 single-choice");
		if (quiz["reveal"] !== void 0 && quiz["reveal"] !== "after-submit") throw new LabError("SCHEMA_INVALID", "quiz.reveal 必须是 after-submit");
		if (quiz["scoring"] !== void 0 && !["equal", "points"].includes(quiz["scoring"])) throw new LabError("SCHEMA_INVALID", "quiz.scoring 必须是 equal 或 points");
		validateQuizReadme(readme, path.relative(labRoot, readmePath));
		const quizPath = await resolveLabPath(labRoot, quiz["questions"], "quiz.questions");
		const questions = parseQuizQuestions(await readJson(quizPath, path.relative(labRoot, quizPath)), path.relative(labRoot, quizPath));
		const totalPoints = questions.reduce((sum, question) => sum + question.points, 0);
		return {
			labRoot,
			manifestPath,
			manifest,
			labId,
			quizPath,
			questions,
			quizResult: {
				count: questions.length,
				totalPoints
			}
		};
	}
	if (manifest["language"] !== "cpp") throw new LabError("SCHEMA_INVALID", "可执行 Lab 的 language 必须是 cpp");
	validateToolchain(manifest["toolchain"]);
	if (manifest["type"] === "program") {
		assertKnownKeys(manifest, /* @__PURE__ */ new Set([
			...BASE_KEYS,
			"language",
			"toolchain",
			"targets",
			"judge"
		]), "lab.json");
		const targets = requireRecord(manifest["targets"], "targets");
		assertKnownKeys(targets, /* @__PURE__ */ new Set(["student", "solution"]), "targets");
		await validateSources(labRoot, targets["student"], "targets.student");
		if (targets["solution"] !== void 0) await validateSources(labRoot, targets["solution"], "targets.solution");
		else if (distribution !== "student") throw new LabError("SCHEMA_INVALID", "源码仓库中的 program 必须声明 targets.solution");
		const judge = requireRecord(manifest["judge"], "judge");
		assertKnownKeys(judge, /* @__PURE__ */ new Set([
			"kind",
			"cases",
			"compare",
			"limits"
		]), "judge");
		if (judge["kind"] !== "stdio") throw new LabError("SCHEMA_INVALID", "judge.kind 必须是 stdio");
		validateCompare(judge["compare"], "judge.compare");
		validateLimits(judge["limits"], "judge.limits");
		const cases = await loadCases(labRoot, requireString(judge["cases"], "judge.cases"));
		await validateThinMakefile(labRoot, distribution);
		return {
			labRoot,
			manifestPath,
			manifest,
			labId,
			cases
		};
	}
	assertKnownKeys(manifest, /* @__PURE__ */ new Set([
		...BASE_KEYS,
		"language",
		"toolchain",
		"buildSystem",
		"tasks"
	]), "lab.json");
	const projectManifest = manifest;
	const tasks = await validateProject(labRoot, projectManifest);
	await validateThinMakefile(labRoot, distribution);
	return {
		labRoot,
		manifestPath,
		manifest: projectManifest,
		labId,
		tasks
	};
}
function createReport(command, lab, data = {}) {
	return {
		reportVersion: JSON_REPORT_VERSION,
		command,
		ok: true,
		lab: {
			id: lab.labId,
			path: lab.labRoot,
			type: lab.manifest.type,
			schemaVersion: lab.manifest.schemaVersion
		},
		...data
	};
}
//#endregion
//#region ../lab-core/src/system/process.ts
const WINDOWS_SCRIPT_EXT = /\.(?:cmd|bat|com)$/i;
function resolveWindowsCommand(command, env) {
	if (path.isAbsolute(command)) return command;
	if (/\.(?:exe|cmd|bat|com|ps1|msi|vbs|js|wsh)$/i.test(command)) return command;
	try {
		const candidates = execFileSync("where.exe", [command], {
			encoding: "utf8",
			timeout: 5e3,
			stdio: [
				"ignore",
				"pipe",
				"ignore"
			],
			env: env ?? process.env
		}).split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
		return candidates.find((candidate) => /\.(?:exe|cmd|bat|com)$/i.test(candidate)) ?? candidates[0] ?? command;
	} catch {
		return command;
	}
}
function buildSpawnTarget(command, args, env) {
	if (process.platform !== "win32") return {
		command,
		args
	};
	const resolved = resolveWindowsCommand(command, env);
	if (WINDOWS_SCRIPT_EXT.test(resolved)) {
		const argString = args.map((value) => /[\s"]/.test(value) ? `"${value.replace(/"/g, "\\\"")}"` : value).join(" ");
		const quotedCommand = `"${resolved}"`;
		return {
			command: "cmd.exe",
			args: ["/c", argString ? `${quotedCommand} ${argString}` : quotedCommand],
			windowsVerbatimArguments: true
		};
	}
	if (/cmd(?:\.exe)?$/i.test(resolved)) return {
		command: resolved,
		args,
		windowsVerbatimArguments: true
	};
	return {
		command: resolved,
		args
	};
}
function runProcess(command, args, options = {}) {
	const { cwd, input = "", timeMs = 3e4, outputKb = 4096, inherit = false, env } = options;
	const childEnvironment = env === void 0 ? process.env : {
		...process.env,
		...env
	};
	const target = buildSpawnTarget(command, args, childEnvironment);
	if (inherit) return new Promise((resolve, reject) => {
		const started = performance.now();
		const child = spawn(target.command, target.args, {
			cwd,
			env: childEnvironment,
			shell: false,
			windowsHide: true,
			windowsVerbatimArguments: target.windowsVerbatimArguments,
			stdio: "inherit"
		});
		child.once("error", reject);
		child.once("close", (code, signal) => resolve({
			code,
			signal,
			durationMs: performance.now() - started
		}));
	});
	return new Promise((resolve) => {
		const started = performance.now();
		const limitBytes = outputKb * 1024;
		const child = spawn(target.command, target.args, {
			cwd,
			env: childEnvironment,
			shell: false,
			windowsHide: true,
			windowsVerbatimArguments: target.windowsVerbatimArguments,
			stdio: [
				"pipe",
				"pipe",
				"pipe"
			]
		});
		const stdout = [];
		const stderr = [];
		let stdoutBytes = 0;
		let stderrBytes = 0;
		let timedOut = false;
		let outputExceeded = false;
		let spawnError;
		let settled = false;
		const stop = () => {
			if (!child.killed) child.kill("SIGKILL");
		};
		const collect = (bucket, chunk, stream) => {
			const size = Buffer.byteLength(chunk);
			if (stream === "stdout") stdoutBytes += size;
			else stderrBytes += size;
			if ((stream === "stdout" ? stdoutBytes : stderrBytes) <= limitBytes) bucket.push(Buffer.from(chunk));
			if (stdoutBytes + stderrBytes > limitBytes) {
				outputExceeded = true;
				stop();
			}
		};
		child.stdout.on("data", (chunk) => collect(stdout, chunk, "stdout"));
		child.stderr.on("data", (chunk) => collect(stderr, chunk, "stderr"));
		child.once("error", (error) => {
			spawnError = error;
		});
		const timer = setTimeout(() => {
			timedOut = true;
			stop();
		}, timeMs);
		child.once("close", (code, signal) => {
			if (settled) return;
			settled = true;
			clearTimeout(timer);
			resolve({
				code,
				signal,
				timedOut,
				outputExceeded,
				spawnError,
				stdout: Buffer.concat(stdout).toString("utf8"),
				stderr: Buffer.concat(stderr).toString("utf8"),
				stdoutBytes,
				stderrBytes,
				durationMs: performance.now() - started
			});
		});
		child.stdin.on("error", () => {});
		child.stdin.end(input);
	});
}
//#endregion
//#region ../lab-core/src/system/repo-root.ts
/**
* 仓库根靠标记文件向上查找，而不是按目录层数倒推 —— 判题内核被打包进学生包后层数不再成立。
* 学生包里没有仓库根，返回 undefined 由调用方决定是否报错。
*/
async function findRepoRoot(start) {
	let current = path.resolve(start);
	while (true) {
		const [workspace, labs] = await Promise.all([pathExists(path.join(current, "pnpm-workspace.yaml")), pathExists(path.join(current, "labs"))]);
		if (workspace && labs) return current;
		const parent = path.dirname(current);
		if (parent === current) return void 0;
		current = parent;
	}
}
async function requireRepoRoot(start) {
	const root = await findRepoRoot(start);
	if (root === void 0) throw new LabError("REPO_NOT_FOUND", `从 ${path.resolve(start)} 向上未找到 DSA Mastery 仓库根`);
	return root;
}
/**
* pnpm 在子目录里运行脚本时把原始工作目录放进 INIT_CWD。
* 只有当它落在 CLI 自身所属的仓库内时才可信：学生包里的 INIT_CWD 指向的是源仓库，用它会找错 Lab。
*/
function invocationDirectory(repoRoot) {
	const initCwd = process.env["INIT_CWD"];
	const initial = initCwd === void 0 || initCwd === "" ? void 0 : path.resolve(initCwd);
	if (initial === void 0 || repoRoot === void 0) return process.cwd();
	const relative = path.relative(repoRoot, initial);
	return relative === "" || !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative) ? initial : process.cwd();
}
const MINIMUMS = {
	node: [
		22,
		13,
		0
	],
	gcc: [
		11,
		0,
		0
	],
	clang: [
		14,
		0,
		0
	],
	msvc: [
		19,
		30,
		0
	],
	cmake: [
		3,
		25,
		0
	],
	make: [
		4,
		0,
		0
	]
};
function parseVersion(source, pattern = /(\d+)\.(\d+)(?:\.(\d+))?/) {
	const match = String(source ?? "").match(pattern);
	return match ? [
		Number(match[1]),
		Number(match[2]),
		Number(match[3] ?? 0)
	] : void 0;
}
function compareVersion(actual, minimum) {
	if (!actual || !minimum) return false;
	for (let index = 0; index < Math.max(actual.length, minimum.length); index += 1) {
		const difference = (actual[index] ?? 0) - (minimum[index] ?? 0);
		if (difference !== 0) return difference > 0;
	}
	return true;
}
function formatVersion(version) {
	return version?.join(".") ?? "unknown";
}
//#endregion
//#region ../lab-core/src/system/terminal.ts
const ANSI = {
	bold: 1,
	dim: 2,
	red: 31,
	green: 32,
	yellow: 33,
	cyan: 36
};
const VERDICT_TONE = {
	AC: "success",
	WA: "danger",
	CE: "danger",
	RE: "danger",
	IE: "danger",
	TLE: "warning",
	OLE: "warning",
	PENDING: "warning"
};
function hasNoColor(environment) {
	return Object.hasOwn(environment, "NO_COLOR");
}
function shouldUseColor({ stream = process.stdout, noColor = false, environment = process.env } = {}) {
	return Boolean(stream?.isTTY) && !noColor && !hasNoColor(environment) && environment["TERM"]?.toLowerCase() !== "dumb";
}
function paint(enabled, codes, value) {
	const text = String(value);
	if (!enabled || text.length === 0) return text;
	return `\u001B[${codes.join(";")}m${text}\u001B[0m`;
}
function cleanTerminalText(value) {
	return stripVTControlCharacters(String(value ?? ""));
}
function formatNumber(value) {
	const number = Number(value);
	if (!Number.isFinite(number)) return String(value);
	if (Number.isInteger(number)) return String(number);
	return number.toFixed(2).replace(/\.00$/, "").replace(/(\.\d)0$/, "$1");
}
function quoteCommandArg(value) {
	const text = String(value);
	return /^[\w./:@\\-]+$/.test(text) ? text : `"${text.replaceAll("\"", "\\\"")}"`;
}
function createTheme(options = {}) {
	const enabled = options.color ?? shouldUseColor(options);
	const tone = (codes) => (value) => paint(enabled, codes, value);
	const success = tone([ANSI.bold, ANSI.green]);
	const danger = tone([ANSI.bold, ANSI.red]);
	const warning = tone([ANSI.bold, ANSI.yellow]);
	const info = tone([ANSI.cyan]);
	const muted = tone([ANSI.dim]);
	const heading = tone([ANSI.bold]);
	const byTone = {
		success,
		danger,
		warning
	};
	return {
		enabled,
		success,
		danger,
		warning,
		info,
		muted,
		heading,
		path: info,
		command: info,
		verdict: (value) => {
			const verdictTone = VERDICT_TONE[String(value).trim()];
			return (verdictTone === void 0 ? heading : byTone[verdictTone])(value);
		},
		status: (value) => {
			const status = String(value).trim();
			if (status === "PASS" || status === "AVAILABLE") return success(value);
			if (status === "PENDING" || status === "NOT FOUND" || status === "TOO OLD") return warning(value);
			if (status === "NOT FULL" || status === "FAIL" || status === "FAILED") return danger(value);
			return heading(value);
		},
		score: (actual, maximum) => {
			const actualText = formatNumber(actual);
			const maximumText = `/${formatNumber(maximum)}`;
			return Number(actual) === Number(maximum) ? success(`${actualText}${maximumText}`) : `${danger(actualText)}${success(maximumText)}`;
		},
		cell: (value, width, style = (text) => text) => style(String(value).padEnd(width)),
		separator: (width) => muted("".padEnd(width, "-"))
	};
}
//#endregion
//#region ../lab-runner/src/distribution.ts
const PACK_BINARY = /\.(?:exe|o|obj|a|lib|so|dylib|dll|pdb)$/i;
function packageFilter(source) {
	const parts = path.resolve(source).split(path.sep).map((part) => part.toLocaleLowerCase());
	return !parts.includes("solution") && !parts.includes(".lab-cache") && !parts.includes("node_modules") && !PACK_BINARY.test(path.basename(source));
}
async function copyPackageEntry(lab, packageRoot, relative, required = false) {
	const source = path.resolve(lab.labRoot, relative);
	if (!await pathExists(source)) {
		if (required) throw new LabError("FILE_NOT_FOUND", `学生包缺少必需源文件：${relative}`);
		return false;
	}
	const target = path.resolve(packageRoot, relative);
	await mkdir(path.dirname(target), { recursive: true });
	await cp(source, target, {
		recursive: true,
		force: true,
		filter: packageFilter
	});
	return true;
}
async function rewriteTaskManifests(packageRoot) {
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
		if (taskManifest.targets !== void 0) delete taskManifest.targets["solution"];
		taskManifest.$schema = path.relative(path.dirname(taskFile), path.join(packageRoot, "schemas", "task.schema.json")).replaceAll("\\", "/");
		await writeFile(taskFile, `${JSON.stringify(taskManifest, null, 2)}\n`, "utf8");
	}
}
const STUDENT_COMMANDS = [
	"doctor",
	"validate",
	"build",
	"run",
	"interactive",
	"score",
	"clean"
];
async function packStudent(lab) {
	const repoRoot = await requireRepoRoot(import.meta.dirname);
	const packageRoot = path.join(lab.labRoot, ".lab-cache", "packages", `${path.basename(lab.labRoot)}-student`);
	await rm(packageRoot, {
		recursive: true,
		force: true
	});
	await mkdir(packageRoot, { recursive: true });
	const requiredEntries = /* @__PURE__ */ new Set(["README.md"]);
	const optionalEntries = /* @__PURE__ */ new Set();
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
		for (const shared of [
			"include",
			"src",
			"contracts"
		]) optionalEntries.add(shared);
	}
	for (const entry of requiredEntries) await copyPackageEntry(lab, packageRoot, entry, true);
	for (const entry of optionalEntries) if (!requiredEntries.has(entry)) await copyPackageEntry(lab, packageRoot, entry);
	const manifest = structuredClone(lab.manifest);
	manifest["distribution"] = "student";
	manifest["$schema"] = "schemas/lab.schema.json";
	if (manifest.targets !== void 0) delete manifest.targets["solution"];
	await writeFile(path.join(packageRoot, "lab.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
	await writeFile(path.join(packageRoot, "Makefile"), STANDALONE_MAKEFILE, "utf8");
	await cp(path.join(repoRoot, "schemas"), path.join(packageRoot, "schemas"), { recursive: true });
	if (isProjectLab(lab)) await rewriteTaskManifests(packageRoot);
	const cliBundle = path.join(repoRoot, "packages", "lab-cli", "dist", "cli.js");
	if (!await pathExists(cliBundle)) throw new LabError("CLI_BUNDLE_MISSING", `缺少判题内核构建产物：${cliBundle}；请先运行 pnpm -r build`);
	await cp(cliBundle, path.join(packageRoot, STANDALONE_CLI_FILENAME));
	await cp(path.join(repoRoot, "packages", "lab-cli", "lab.mk"), path.join(packageRoot, "lab.mk"));
	await writeFile(path.join(packageRoot, "package.json"), `${JSON.stringify({
		name: `${path.basename(lab.labRoot)}-student`,
		private: true,
		type: "module",
		scripts: Object.fromEntries(STUDENT_COMMANDS.map((command) => [`lab:${command}`, `node ${STANDALONE_CLI_FILENAME} ${command}`]))
	}, null, 2)}\n`, "utf8");
	return { packageRoot };
}
async function cleanLab(lab) {
	const root = path.resolve(lab.labRoot);
	const caches = /* @__PURE__ */ new Set([path.join(root, ".lab-cache")]);
	for (const task of lab.tasks ?? []) caches.add(path.join(path.resolve(task.taskPath), ".lab-cache"));
	for (const cache of caches) {
		const relative = path.relative(root, cache);
		if (relative.startsWith(`..${path.sep}`) || relative === ".." || path.isAbsolute(relative) || path.basename(cache) !== ".lab-cache") throw new LabError("CLEAN_REFUSED", `拒绝清理 Lab 根目录之外的路径：${cache}`);
	}
	await Promise.all([...caches].map((cache) => rm(cache, {
		recursive: true,
		force: true
	})));
	return {
		cache: path.join(root, ".lab-cache"),
		caches: [...caches]
	};
}
//#endregion
//#region ../lab-runner/src/fingerprint.ts
async function engineFingerprint() {
	return "b172968b3ea6f7606f4c94392863733d7d2047e14b07b04cbae13a399304e4b7";
}
//#endregion
//#region ../lab-runner/src/identity.ts
async function readManifestType(labPath) {
	const manifestPath = path.join(labPath, "lab.json");
	let source;
	try {
		source = await readFile(manifestPath, "utf8");
	} catch (error) {
		if (error?.code === "ENOENT") return void 0;
		throw error;
	}
	let manifest;
	try {
		manifest = JSON.parse(source);
	} catch (error) {
		throw new LabError("JSON_INVALID", `${manifestPath}: 无法解析 JSON`, { cause: error });
	}
	if (!isLabType(manifest.type)) throw new LabError("LAB_TYPE_INVALID", `${manifestPath}: type 必须是 quiz、program 或 project`);
	return manifest.type;
}
async function scanLabRecords(root, options = {}) {
	const labsRoot = path.join(root, "labs");
	let chapterEntries;
	try {
		chapterEntries = await readdir(labsRoot, { withFileTypes: true });
	} catch (error) {
		if (error?.code === "ENOENT") return [];
		throw error;
	}
	const records = [];
	for (const chapterEntry of chapterEntries) {
		const chapterMatch = chapterEntry.isDirectory() ? chapterEntry.name.match(CHAPTER_DIRECTORY_PATTERN) : null;
		if (chapterMatch === null) continue;
		const pathChapter = Number(chapterMatch[1]);
		if (options.chapter !== void 0 && pathChapter !== Number(options.chapter)) continue;
		const chapterPath = path.join(labsRoot, chapterEntry.name);
		for (const child of await readdir(chapterPath, { withFileTypes: true })) if (child.isDirectory() && !LAB_CATEGORIES.includes(child.name)) throw new LabError("LAB_PATH_INVALID", `${path.relative(root, path.join(chapterPath, child.name)).split(path.sep).join("/")}: Lab 必须放在 theory、exercise 或 project 分类目录中`);
		for (const category of LAB_CATEGORIES) {
			const categoryPath = path.join(chapterPath, category);
			let labEntries;
			try {
				labEntries = await readdir(categoryPath, { withFileTypes: true });
			} catch (error) {
				if (error?.code === "ENOENT") continue;
				throw error;
			}
			for (const labEntry of labEntries) {
				if (!labEntry.isDirectory()) continue;
				if (!LAB_DIRECTORY_PATTERN.test(labEntry.name)) throw new LabError("LAB_PATH_INVALID", `${path.relative(root, path.join(categoryPath, labEntry.name)).split(path.sep).join("/")}: Lab 目录应为 X-CC-SS-kebab-slug`);
				const labPath = path.join(categoryPath, labEntry.name);
				const readmePath = path.join(labPath, "README.md");
				let source;
				try {
					source = await readFile(readmePath, "utf8");
				} catch (error) {
					if (error?.code === "ENOENT") continue;
					throw error;
				}
				const { data } = parseFrontmatter(source, path.relative(root, readmePath));
				const type = await readManifestType(labPath);
				const declaredCategory = type ? categoryForType(type) : (data["labCategory"] ?? "").trim();
				records.push({
					labPath,
					readmePath,
					relativePath: path.relative(root, labPath).split(path.sep).join("/"),
					directoryName: labEntry.name,
					directoryIdentity: parseLabDirectoryName(labEntry.name),
					pathChapter,
					categoryDirectory: category,
					type,
					category: declaredCategory || void 0,
					labId: (data["labId"] ?? "").trim(),
					order: Number(data["order"])
				});
			}
		}
	}
	return records;
}
function validateRecordIdentity(record) {
	if (!record.labId) throw new LabError("LAB_ID_MISSING", `${record.relativePath}/README.md: 缺少 labId`);
	const parsed = parseLabId(record.labId);
	if (parsed.id !== record.labId) throw new LabError("LAB_ID_NOT_CANONICAL", `${record.relativePath}/README.md: labId 应写为 ${parsed.id}`);
	if (parsed.chapter !== record.pathChapter) throw new LabError("LAB_ID_CHAPTER_MISMATCH", `${record.relativePath}/README.md: labId 章节与目录不一致`);
	if (record.directoryIdentity.id !== parsed.id) throw new LabError("LAB_ID_PATH_MISMATCH", `${record.relativePath}/README.md: 目录编号必须与 labId ${parsed.id} 一致`);
	const expectedTag = tagForCategory(record.category);
	if (!expectedTag) throw new LabError("LAB_CATEGORY_MISSING", `${record.relativePath}/README.md: 无法确定 Theory、Exercise 或 Project 分类`);
	if (parsed.tag !== expectedTag) throw new LabError("LAB_ID_TYPE_MISMATCH", `${record.relativePath}/README.md: ${record.labId} 与 ${record.category} 分类不一致，应使用 ${expectedTag}`);
	if (record.categoryDirectory !== record.category) throw new LabError("LAB_CATEGORY_PATH_MISMATCH", `${record.relativePath}/README.md: ${record.categoryDirectory} 目录与 ${record.category} 分类不一致`);
	return parsed;
}
async function allocateLabIdentity(root, options) {
	const chapter = integer(options.chapter, "--chapter", 0);
	if (chapter > 99) throw new LabError("ARGUMENT_INVALID", "--chapter 必须是 0～99 的整数");
	const tag = tagForType(options.type);
	const records = await scanLabRecords(root, { chapter });
	const seen = /* @__PURE__ */ new Set();
	let maxSequence = 0;
	let maxOrder = 0;
	for (const record of records) {
		const parsed = validateRecordIdentity(record);
		if (seen.has(parsed.id)) throw new LabError("LAB_ID_DUPLICATE", `稳定 ID 重复：${parsed.id}`);
		seen.add(parsed.id);
		if (parsed.tag === tag) maxSequence = Math.max(maxSequence, parsed.sequence);
		if (Number.isInteger(record.order) && record.order >= 0) maxOrder = Math.max(maxOrder, record.order);
	}
	const order = options.order === void 0 ? maxOrder + 1 : integer(options.order, "--order", 0);
	if (options.order !== void 0 && records.some((record) => record.order === order)) throw new LabError("ORDER_DUPLICATE", `第 ${chapter} 章已经使用展示顺序 ${order}`);
	const sequence = maxSequence + 1;
	return {
		id: formatLabId(chapter, tag, sequence),
		chapter,
		tag,
		sequence,
		order
	};
}
async function locateLabById(root, value) {
	const id = normalizeLabId(value);
	const matches = (await scanLabRecords(root)).filter((record) => record.labId !== void 0 && normalizeLabId(record.labId) === id);
	if (matches.length === 0) throw new LabError("LAB_ID_NOT_FOUND", `没有找到 Lab：${id}`);
	if (matches.length > 1) throw new LabError("LAB_ID_DUPLICATE", `稳定 ID ${id} 对应多个目录：${matches.map((item) => item.relativePath).join("、")}`);
	return {
		id,
		...matches[0]
	};
}
//#endregion
//#region ../lab-runner/src/toolchain/windows.ts
function parseEnvironmentBlock(source, baseEnvironment = {}) {
	const environment = { ...baseEnvironment };
	for (const rawLine of String(source ?? "").split(/\r?\n/)) {
		const line = rawLine.trimEnd();
		const separator = line.indexOf("=");
		if (separator <= 0) continue;
		const key = line.slice(0, separator).trim();
		if (!key) continue;
		environment[key] = line.slice(separator + 1);
	}
	return environment;
}
function parseVsWherePath(source) {
	return String(source ?? "").split(/\r?\n/).map((line) => line.trim()).find(Boolean);
}
function vsWhereCandidates(env) {
	const candidates = [];
	if (env["VSWHERE_PATH"] !== void 0 && env["VSWHERE_PATH"] !== "") candidates.push(env["VSWHERE_PATH"]);
	if (env["ProgramFiles(x86)"] !== void 0) candidates.push(path.win32.join(env["ProgramFiles(x86)"], "Microsoft Visual Studio", "Installer", "vswhere.exe"));
	candidates.push("vswhere.exe");
	return [...new Set(candidates)];
}
const VSWHERE_ARGS = [
	"-latest",
	"-products",
	"*",
	"-requires",
	"Microsoft.VisualStudio.Component.VC.Tools.x86.x64",
	"-property",
	"installationPath"
];
async function findVisualStudioInstallation({ platform = process.platform, env = process.env, runner = runProcess } = {}) {
	if (platform !== "win32") return void 0;
	for (const command of vsWhereCandidates(env)) {
		const result = await runner(command, VSWHERE_ARGS, {
			env,
			timeMs: 1e4,
			outputKb: 256
		});
		const installationPath = result?.code === 0 && !result.spawnError ? parseVsWherePath(result.stdout) : void 0;
		if (installationPath !== void 0 && installationPath !== "") return {
			installationPath,
			vswhere: command
		};
	}
}
async function createMsvcEnvironment({ platform = process.platform, env = process.env, runner = runProcess } = {}) {
	if (platform !== "win32") return void 0;
	const installation = await findVisualStudioInstallation({
		platform,
		env,
		runner
	});
	if (!installation) throw new LabError("MSVC_ENV_NOT_FOUND", "未找到满足 Microsoft.VisualStudio.Component.VC.Tools.x86.x64 的 Visual Studio 实例；请安装 Visual Studio 2022 Build Tools，或打开 Developer PowerShell。", { candidates: vsWhereCandidates(env) });
	const developerCommand = path.win32.join(installation.installationPath, "Common7", "Tools", "VsDevCmd.bat");
	const result = await runner("cmd.exe", [
		"/d",
		"/s",
		"/c",
		`call "${developerCommand}" -arch=x64 >nul 2>&1 && set`
	], {
		env,
		timeMs: 6e4,
		outputKb: 4096
	});
	if (result?.spawnError || result?.code !== 0) throw new LabError("MSVC_ENV_NOT_FOUND", `Visual Studio 开发环境初始化失败：${developerCommand}`, {
		installationPath: installation.installationPath,
		developerCommand,
		result
	});
	return {
		family: "msvc",
		command: "cl",
		env: parseEnvironmentBlock(result.stdout, env),
		installationPath: installation.installationPath,
		developerCommand
	};
}
/**
* 没装 Visual Studio 但有 MinGW 的 Windows 机器的退路。
*
* CMake 默认挑 MSVC 生成器，探不到就直接失败；显式换成 MinGW Makefiles 才能把 Project Lab 跑起来。
*/
async function createMinGwEnvironment({ platform = process.platform, env = process.env, runner = runProcess } = {}) {
	if (platform !== "win32" || (env["CMAKE_GENERATOR"] ?? "") !== "") return void 0;
	if (env["CXX"] !== void 0 && !/g\+\+|mingw|gcc/iu.test(env["CXX"])) return void 0;
	const probe = await runner("g++", ["--version"], {
		env,
		timeMs: 1e4,
		outputKb: 256
	});
	if (probe.spawnError || probe.code !== 0) return void 0;
	return {
		family: "mingw",
		command: "g++",
		env: {
			...env,
			CMAKE_GENERATOR: "MinGW Makefiles",
			CXX: env["CXX"] ?? "g++"
		}
	};
}
function isMsvcCommand(command) {
	return /(?:^|[\\/])cl(?:\.exe)?$/iu.test(String(command ?? ""));
}
//#endregion
//#region ../lab-runner/src/toolchain/compiler.ts
async function available(command, args = ["--version"], acceptNonzero = false, env, runner = runProcess) {
	const result = await runner(command, args, {
		env,
		timeMs: 5e3,
		outputKb: 256
	});
	return !result.spawnError && (acceptNonzero || result.code === 0);
}
async function selectCompiler({ platform = process.platform, env = process.env, runner = runProcess } = {}) {
	if (env["CXX"] !== void 0 && env["CXX"] !== "") {
		const command = env["CXX"];
		const family = isMsvcCommand(command) ? "msvc" : "gnu";
		let compilerEnvironment;
		if (family === "msvc" && platform === "win32") try {
			compilerEnvironment = await createMsvcEnvironment({
				platform,
				env,
				runner
			});
		} catch (error) {
			throw new LabError("COMPILER_NOT_FOUND", error.message, error.details);
		}
		if (await available(command, family === "msvc" ? [] : ["--version"], family === "msvc", compilerEnvironment?.env, runner)) return {
			command,
			family,
			env: compilerEnvironment?.env,
			toolchain: compilerEnvironment
		};
		throw new LabError("COMPILER_NOT_FOUND", `CXX 指定的编译器不可用：${command}`);
	}
	const candidates = [
		{
			command: "g++",
			family: "gnu"
		},
		{
			command: "clang++",
			family: "gnu"
		},
		...platform === "win32" ? [{
			command: "cl",
			family: "msvc",
			args: []
		}] : []
	];
	for (const candidate of candidates) {
		let compilerEnvironment;
		if (candidate.family === "msvc") try {
			compilerEnvironment = await createMsvcEnvironment({
				platform,
				env,
				runner
			});
		} catch {
			continue;
		}
		if (await available(candidate.command, candidate.args, candidate.family === "msvc", compilerEnvironment?.env, runner)) return {
			...candidate,
			env: compilerEnvironment?.env,
			toolchain: compilerEnvironment
		};
	}
	throw new LabError("COMPILER_NOT_FOUND", "未找到可用 C++ 编译器；请安装 GCC >= 11、Clang >= 14 或 Visual Studio 2022，然后重新运行 lab doctor");
}
async function compileTarget(lab, targetName = "student") {
	const target = lab.manifest.targets?.[targetName];
	if (!target) throw new LabError("TARGET_INVALID", `manifest 中不存在编译目标：${targetName}`);
	const compiler = await selectCompiler();
	const outputDir = path.join(lab.labRoot, ".lab-cache", "bin");
	await mkdir(outputDir, { recursive: true });
	const executable = path.join(outputDir, `${targetName}${process.platform === "win32" ? ".exe" : ""}`);
	const standard = lab.manifest.toolchain.standard;
	const sources = target.sources.map((source) => path.resolve(lab.labRoot, source));
	const includeDirs = (target.includeDirs ?? []).map((dir) => path.resolve(lab.labRoot, dir));
	const args = compiler.family === "msvc" ? [
		"/nologo",
		`/std:${standard}`,
		"/EHsc",
		"/utf-8",
		"/W4",
		...includeDirs.map((dir) => `/I${dir}`),
		...sources,
		`/Fe:${executable}`
	] : [
		`-std=${standard}`,
		"-O2",
		"-Wall",
		"-Wextra",
		"-Wpedantic",
		...includeDirs.flatMap((dir) => ["-I", dir]),
		...sources,
		"-o",
		executable
	];
	const result = await runProcess(compiler.command, args, {
		cwd: lab.labRoot,
		env: compiler.env,
		timeMs: 6e4,
		outputKb: 4096
	});
	if (result.spawnError) throw new LabError("COMPILER_NOT_FOUND", `无法启动编译器 ${compiler.command}：${result.spawnError.message}`);
	return {
		ok: result.code === 0 && !result.timedOut && !result.outputExceeded,
		compiler,
		command: compiler.command,
		args,
		executable,
		stdout: result.stdout,
		stderr: result.stderr,
		durationMs: result.durationMs
	};
}
//#endregion
//#region ../lab-runner/src/program/judge.ts
function limitsFor(manifest, testCase) {
	return {
		timeMs: testCase.timeMs ?? manifest.judge.limits?.timeMs ?? 2e3,
		outputKb: testCase.outputKb ?? manifest.judge.limits?.outputKb ?? 1024
	};
}
function compareFor(manifest, testCase) {
	return {
		mode: "tokens",
		...manifest.judge.compare,
		...testCase.compare
	};
}
function classifyExecution(execution, expected, compareConfig) {
	if (execution.spawnError) return { verdict: "IE" };
	if (execution.outputExceeded) return { verdict: "OLE" };
	if (execution.timedOut) return { verdict: "TLE" };
	if (execution.code !== 0) return { verdict: "RE" };
	const comparison = compareOutput(expected, execution.stdout, compareConfig);
	return {
		verdict: comparison.equal ? "AC" : "WA",
		comparison
	};
}
async function judgeProgram(lab, options = {}) {
	const target = options.target ?? "student";
	const compilation = await compileTarget(lab, target);
	if (!compilation.ok) return {
		target,
		verdict: "CE",
		score: 0,
		maxScore: 100,
		compilation,
		cases: []
	};
	const selected = options.caseId === void 0 ? lab.cases : lab.cases.filter((item) => item.id === options.caseId);
	if (options.caseId !== void 0 && selected.length === 0) throw new LabError("CASE_NOT_FOUND", `不存在测试用例：${options.caseId}`);
	const results = [];
	for (const testCase of selected) {
		const [input, expected] = await Promise.all([readFile(path.resolve(lab.labRoot, testCase.input), "utf8"), readFile(path.resolve(lab.labRoot, testCase.expected), "utf8")]);
		const execution = await runProcess(compilation.executable, [], {
			cwd: lab.labRoot,
			input,
			...limitsFor(lab.manifest, testCase)
		});
		const { verdict, comparison } = classifyExecution(execution, expected, compareFor(lab.manifest, testCase));
		results.push({
			id: testCase.id,
			tags: testCase.tags ?? [],
			verdict,
			points: verdict === "AC" ? testCase.points : 0,
			maxPoints: testCase.points,
			durationMs: execution.durationMs,
			stderr: execution.stderr,
			comparison
		});
	}
	return {
		target,
		verdict: results.find((result) => result.verdict !== "AC")?.verdict ?? "AC",
		score: results.reduce((total, result) => total + result.points, 0),
		maxScore: results.reduce((total, result) => total + result.maxPoints, 0),
		compilation,
		cases: results
	};
}
async function runInteractive(lab, target = "student") {
	const compilation = await compileTarget(lab, target);
	if (!compilation.ok) return {
		verdict: "CE",
		compilation,
		code: 1
	};
	const execution = await runProcess(compilation.executable, [], {
		cwd: lab.labRoot,
		inherit: true
	});
	return {
		verdict: execution.code === 0 ? "AC" : "RE",
		compilation,
		code: execution.code ?? 1
	};
}
function retryCommand(command, labPath, taskId, caseId) {
	if (labPath === void 0 || caseId === void 0) return void 0;
	const parts = [command, quoteCommandArg(labPath)];
	if (taskId !== void 0) parts.push("--task", quoteCommandArg(taskId));
	parts.push("--case", quoteCommandArg(caseId));
	return parts.join(" ");
}
function differenceLocation(difference) {
	return difference.kind === "token" ? `第 ${difference.index} 个 token` : `第 ${difference.line} 行第 ${difference.column} 列`;
}
function formatJudge(result, options = {}) {
	const theme = options.theme ?? createTheme({ color: false });
	if (result.verdict === "CE") {
		const diagnostic = cleanTerminalText(result.compilation.stderr || result.compilation.stdout).trim();
		return [
			`${theme.danger("COMPILE ERROR")} ${theme.verdict("CE")}`,
			diagnostic && theme.heading("诊断"),
			diagnostic
		].filter(Boolean).join("\n");
	}
	const caseWidth = Math.max(20, ...result.cases.map((item) => item.id.length));
	const rows = [`${theme.cell("CASE", caseWidth, theme.muted)} ${theme.cell("RESULT", 8, theme.muted)} ${theme.cell("TIME", 10, theme.muted)} ${theme.muted("SCORE")}`];
	for (const item of result.cases) {
		rows.push(`${theme.cell(item.id, caseWidth)} ${theme.cell(item.verdict, 8, theme.verdict)} ${theme.cell(`${Math.round(item.durationMs)} ms`, 10, theme.muted)} ${theme.score(item.points, item.maxPoints)}`);
		if (item.comparison && !item.comparison.equal) {
			const difference = item.comparison.difference;
			rows.push(`  ${theme.heading("首处差异：")}${differenceLocation(difference)}`, `  ${theme.muted("期望：")} ${JSON.stringify(difference.expected)}`, `  ${theme.muted("实际：")} ${JSON.stringify(difference.actual)}`);
		}
		if (item.stderr) rows.push(`  ${theme.heading("stderr")}`, cleanTerminalText(item.stderr).trim().slice(0, 500));
	}
	const passedCases = result.cases.filter((item) => item.verdict === "AC").length;
	const totalDuration = result.cases.reduce((total, item) => total + item.durationMs, 0);
	const full = result.score === result.maxScore && passedCases === result.cases.length;
	rows.push(theme.separator(Math.max(56, caseWidth + 37)));
	rows.push(`${theme.status(full ? "PASS" : "NOT FULL")}  ${passedCases}/${result.cases.length} cases · ${theme.score(result.score, result.maxScore)} · ${theme.muted(`${Math.round(totalDuration)} ms`)}`);
	const retry = retryCommand(options.command ?? "pnpm lab run", options.labPath, options.taskId, result.cases.find((item) => item.verdict !== "AC")?.id);
	if (retry !== void 0) rows.push(`${theme.heading("Retry：")} ${theme.command(retry)}`);
	return rows.join("\n");
}
//#endregion
//#region ../lab-runner/src/program/expected.ts
function previewDiff(previous, next) {
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
async function refreshExpected(lab, write = false) {
	if (!lab.manifest.targets.solution) throw new LabError("SOLUTION_UNAVAILABLE", "学生分发包不包含参考实现");
	const compilation = await compileTarget(lab, "solution");
	if (!compilation.ok) throw new LabError("SOLUTION_CE", `参考实现编译失败：\n${compilation.stderr || compilation.stdout}`);
	const changes = [];
	for (const testCase of lab.cases) {
		const input = await readFile(path.resolve(lab.labRoot, testCase.input), "utf8");
		const result = await runProcess(compilation.executable, [], {
			cwd: lab.labRoot,
			input,
			timeMs: testCase.timeMs ?? lab.manifest.judge.limits?.timeMs ?? 2e3,
			outputKb: testCase.outputKb ?? lab.manifest.judge.limits?.outputKb ?? 1024
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
				diff: previewDiff(previous, normalizedOutput)
			});
			if (write) await writeFile(expectedPath, normalizedOutput, "utf8");
		}
	}
	return {
		changed: changes.length,
		written: write ? changes.length : 0,
		changes
	};
}
async function verifyProgram(lab) {
	const drift = await refreshExpected(lab, false);
	const solution = await judgeProgram(lab, { target: "solution" });
	const student = await judgeProgram(lab, { target: "student" });
	const checks = {
		expectedStable: drift.changed === 0,
		solutionFullScore: solution.score === 100 && solution.maxScore === 100,
		studentCompiles: student.verdict !== "CE",
		studentNotFullScore: student.score < student.maxScore
	};
	return {
		ok: Object.values(checks).every(Boolean),
		checks,
		drift,
		solution,
		student
	};
}
//#endregion
//#region ../lab-runner/src/project/state.ts
const ignoredDirectories = /* @__PURE__ */ new Set([
	".lab-cache",
	"solution",
	".git",
	"node_modules"
]);
const binary = /\.(?:exe|o|obj|a|lib|so|dylib|dll|pdb|vsix)$/i;
const slash = (value) => value.replaceAll("\\", "/");
function sourceDependencies(task) {
	return task.buildDependsOn ?? task.dependsOn ?? [];
}
function dependencyClosure(lab, task, dependencies = sourceDependencies) {
	const result = /* @__PURE__ */ new Set();
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
async function projectInputs(lab, target = "student") {
	const files = /* @__PURE__ */ new Map();
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
	const engine = await engineFingerprint();
	const roots = lab.tasks.map((task) => `${slash(task.path).replace(/\/$/, "")}/`);
	const shared = [...files.keys()].filter((file) => !roots.some((root) => file.startsWith(root)));
	return Object.fromEntries(lab.tasks.map((task) => {
		const owners = [task, ...dependencyClosure(lab, task)].map((item) => `${slash(item.path).replace(/\/$/, "")}/`);
		const inputs = [.../* @__PURE__ */ new Set([...shared, ...[...files.keys()].filter((file) => owners.some((root) => file.startsWith(root)))])].sort();
		const fingerprint = createHash("sha256").update(JSON.stringify([
			target,
			engine,
			inputs.map((file) => [file, files.get(file)])
		])).digest("hex");
		return [task.id, {
			fingerprint,
			files: inputs
		}];
	}));
}
function statePath(lab, target) {
	return path.join(lab.labRoot, ".lab-cache", `project-results-${target}.json`);
}
async function readProjectState(lab, target) {
	try {
		const state = JSON.parse(await readFile(statePath(lab, target), "utf8"));
		if (state.version !== 1 || typeof state.tasks !== "object") return {
			version: 1,
			tasks: {}
		};
		return state;
	} catch (error) {
		if (error.code !== "ENOENT" && !(error instanceof SyntaxError)) throw error;
		return {
			version: 1,
			tasks: {}
		};
	}
}
async function writeProjectState(lab, target, state) {
	const file = statePath(lab, target);
	await mkdir(path.dirname(file), { recursive: true });
	const temporary = `${file}.${process.pid}.tmp`;
	const handle = await open(temporary, "w");
	try {
		await handle.writeFile(`${JSON.stringify(state, null, 2)}\n`);
	} finally {
		await handle.close();
	}
	try {
		await rename(temporary, file);
	} finally {
		await rm(temporary, { force: true });
	}
}
function currentProject(lab, state, inputs, dirtyFiles = []) {
	const tasks = lab.tasks.map((task) => {
		const entry = state.tasks[task.id];
		const taskInputs = inputs[task.id];
		const dirty = taskInputs.files.some((file) => dirtyFiles.includes(file));
		const valid = entry !== void 0 && entry.fingerprint === taskInputs.fingerprint && !entry.changedDuringRun && !dirty;
		const status = task.kind === "manual" ? "PENDING" : entry === void 0 ? "UNASSESSED" : valid ? entry.result.status : "STALE";
		return {
			...entry?.result ?? {},
			id: task.id,
			kind: task.kind,
			weight: task.weight,
			status,
			weightedScore: valid && task.kind !== "manual" ? (entry.result.score ?? 0) / (entry.result.maxScore ?? 100) * task.weight : 0,
			historicalScore: entry?.result.weightedScore,
			bestScore: entry?.bestScore,
			previousStatus: entry?.result.status,
			assessedAt: entry?.at,
			inputFingerprint: taskInputs.fingerprint,
			inputFiles: taskInputs.files,
			valid: valid && task.kind !== "manual",
			dependsOn: task.dependsOn,
			unsaved: dirty,
			buildDependsOn: task.buildDependsOn,
			checklist: task.config.checklist
		};
	});
	const automated = tasks.filter((task) => task.kind !== "manual");
	const automatedScore = automated.reduce((sum, task) => sum + task.weightedScore, 0);
	const manualPending = tasks.filter((task) => task.kind === "manual").reduce((sum, task) => sum + task.weight, 0);
	const automatedFull = automated.length > 0 && automated.every((task) => task.valid && task.status === "AC" && task.score === task.maxScore);
	const internalError = tasks.some((task) => task.status === "IE");
	return {
		tasks,
		automatedScore,
		automatedMax: automated.reduce((sum, task) => sum + task.weight, 0),
		manualPending,
		provisionalTotal: automatedScore,
		total: 100,
		automatedFull,
		internalError,
		complete: automatedFull && manualPending === 0 && !internalError
	};
}
async function projectStatus(lab, target = "student", dirtyFiles = []) {
	if (!["student", "solution"].includes(target)) throw new LabError("TARGET_INVALID", "Project target 必须是 student 或 solution");
	if (!Array.isArray(dirtyFiles) || dirtyFiles.some((file) => typeof file !== "string")) throw new LabError("ARGUMENT_INVALID", "--dirty-files 必须为相对路径 JSON 数组");
	const [state, inputs] = await Promise.all([readProjectState(lab, target), projectInputs(lab, target)]);
	return {
		target,
		...currentProject(lab, state, inputs, dirtyFiles.map(slash))
	};
}
async function withProjectLock(lab, operation) {
	const directory = path.join(lab.labRoot, ".lab-cache");
	await mkdir(directory, { recursive: true });
	const file = path.join(directory, "project.lock");
	let handle;
	for (let attempt = 0; attempt < 2; attempt += 1) try {
		handle = await open(file, "wx");
		break;
	} catch (error) {
		if (error.code !== "EEXIST") throw error;
		let owner;
		try {
			owner = JSON.parse(await readFile(file, "utf8"));
		} catch {}
		let alive = true;
		if (Number.isInteger(owner?.pid) && owner.pid > 0) try {
			process.kill(owner.pid, 0);
		} catch (probe) {
			alive = probe.code !== "ESRCH";
		}
		if (alive || attempt) throw new LabError("PROJECT_BUSY", "该 Project 正在构建或测评，请等待完成后重试。", {
			lockFile: file,
			pid: owner?.pid
		});
		await rm(file, { force: true });
	}
	try {
		await handle.writeFile(JSON.stringify({ pid: process.pid }));
		return await operation();
	} finally {
		await handle.close();
		await rm(file, { force: true });
	}
}
//#endregion
//#region ../lab-runner/src/project/run.ts
function programView(lab, task) {
	return {
		labRoot: task.taskPath,
		manifest: {
			toolchain: lab.manifest.toolchain,
			targets: task.config.targets,
			judge: task.config.judge
		},
		cases: task.cases ?? []
	};
}
function selectedTasks(lab, taskId) {
	if (taskId === void 0) return lab.tasks;
	const selected = lab.tasks.filter((task) => task.id === taskId);
	if (!selected.length) throw new LabError("TASK_NOT_FOUND", `不存在 Project task：${taskId}`);
	return selected;
}
function selectedTask(lab, taskId) {
	const [task] = selectedTasks(lab, taskId);
	if (task === void 0) throw new LabError("TASK_NOT_FOUND", "Project 没有可运行的 task");
	return task;
}
function cmakeStandardNumber(standard) {
	if (standard === "c++17") return "17";
	if (standard === "c++20") return "20";
	throw new LabError("TOOLCHAIN_STANDARD", `Project 不支持 C++ 标准：${standard}`);
}
function assertTarget(target) {
	if (!["student", "solution"].includes(target)) throw new LabError("TARGET_INVALID", "Project target 必须是 student 或 solution");
}
/** MSVC 优先；没装 Visual Studio 但有 MinGW 时退回去，换生成器前必须清掉按旧生成器配置的缓存。 */
async function windowsEnvironment(lab, target) {
	if (process.platform !== "win32") return void 0;
	try {
		return await createMsvcEnvironment();
	} catch (error) {
		const mingw = await createMinGwEnvironment();
		if (mingw === void 0) throw error;
		await rm(path.join(lab.labRoot, ".lab-cache", "cmake", target), {
			recursive: true,
			force: true
		});
		return mingw;
	}
}
async function configureProject(lab, target, options = {}) {
	assertTarget(target);
	if (target === "solution" && lab.manifest.distribution === "student") throw new LabError("SOLUTION_UNAVAILABLE", "学生分发包不包含参考实现");
	const environment = options.environment ?? await windowsEnvironment(lab, target);
	const configure = await runProcess("cmake", [
		"--preset",
		target,
		`-DCMAKE_CXX_STANDARD=${cmakeStandardNumber(lab.manifest.toolchain.standard)}`,
		"-DCMAKE_CXX_STANDARD_REQUIRED=ON",
		"-DCMAKE_CXX_EXTENSIONS=OFF"
	], {
		cwd: lab.labRoot,
		env: environment?.env,
		timeMs: 6e4,
		outputKb: 4096
	});
	if (configure.spawnError) throw new LabError("CMAKE_NOT_FOUND", "无法启动 CMake；Project Lab 需要 CMake >= 3.25");
	return {
		ok: configure.code === 0 && !configure.timedOut && !configure.outputExceeded,
		phase: "configure",
		target,
		configure,
		environment
	};
}
async function buildTargets(lab, configured, targets) {
	if (!configured.ok) return {
		...configured,
		scope: "project"
	};
	const args = [
		"--build",
		"--preset",
		configured.target,
		"--config",
		"Release"
	];
	if (!configured.cleaned) {
		args.push("--clean-first");
		configured.cleaned = true;
	}
	if (targets !== void 0 && targets.length > 0) args.push("--target", ...targets);
	const build = await runProcess("cmake", args, {
		cwd: lab.labRoot,
		env: configured.environment?.env,
		timeMs: 12e4,
		outputKb: 8192
	});
	return {
		...configured,
		ok: !build.spawnError && build.code === 0 && !build.timedOut && !build.outputExceeded,
		phase: "build",
		build,
		targets,
		scope: targets !== void 0 && targets.length > 0 ? "task" : "project",
		legacyBuild: targets === void 0 || targets.length === 0
	};
}
function publicBuild(build) {
	const { environment, cleaned, ...report } = build;
	return report;
}
async function buildTask(lab, task, configured, modules) {
	if (!configured.ok) return {
		...configured,
		scope: "project",
		relatedTasks: lab.tasks.filter((item) => item.kind === "ctest").map((item) => item.id)
	};
	for (const dependency of dependencyClosure(lab, task, (item) => item.buildDependsOn ?? [])) {
		const targets = dependency.config.ctest?.moduleTargets;
		if (!targets) continue;
		if (!modules.has(dependency.id)) modules.set(dependency.id, await buildTargets(lab, configured, targets));
		const built = modules.get(dependency.id);
		if (!built.ok) return {
			...built,
			blockedBy: [dependency.id],
			relatedTasks: [dependency.id, task.id]
		};
	}
	return {
		...await buildTargets(lab, configured, task.config.ctest?.buildTargets),
		relatedTasks: [task.id, ...task.buildDependsOn ?? []]
	};
}
async function buildProject(lab, target = "student", options = {}) {
	return withProjectLock(lab, async () => {
		const configured = await configureProject(lab, target, options);
		if (options.taskId === void 0) return publicBuild(await buildTargets(lab, configured));
		const task = selectedTask(lab, options.taskId);
		if (task.kind !== "ctest") throw new LabError("TYPE_UNSUPPORTED", "Project build --task 需要 CTest task；stdio 请使用 run --task");
		return publicBuild(await buildTask(lab, task, configured, /* @__PURE__ */ new Map()));
	});
}
function classifyCtestExecution(result) {
	const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
	if (result.spawnError || /No tests were found/i.test(output)) return "IE";
	if (result.outputExceeded) return "OLE";
	if (result.timedOut) return "TLE";
	return result.code === 0 ? "AC" : "WA";
}
async function scoreCtest(lab, task, target, build) {
	if (!build.ok) return {
		id: task.id,
		kind: task.kind,
		status: build.blockedBy !== void 0 && build.blockedBy.length > 0 ? "BLOCKED" : build.build?.spawnError === void 0 ? "CE" : "IE",
		score: 0,
		maxScore: 100,
		weight: task.weight,
		weightedScore: 0,
		tests: [],
		build: publicBuild(build),
		blockedBy: build.blockedBy
	};
	const binaryDir = path.join(lab.labRoot, ".lab-cache", "cmake", target);
	const tests = [];
	for (const test of task.config.ctest.tests) {
		const result = await runProcess("ctest", [
			"--test-dir",
			binaryDir,
			"-C",
			"Release",
			"-R",
			`^${test.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
			"--no-tests=error",
			"--output-on-failure"
		], {
			cwd: lab.labRoot,
			env: build.environment?.env,
			timeMs: 6e4,
			outputKb: 4096
		});
		const verdict = classifyCtestExecution(result);
		tests.push({
			name: test.name,
			verdict,
			points: verdict === "AC" ? test.points : 0,
			maxPoints: test.points,
			durationMs: result.durationMs,
			output: `${result.stdout}\n${result.stderr}`.trim()
		});
	}
	const score = tests.reduce((total, test) => total + test.points, 0);
	return {
		id: task.id,
		kind: task.kind,
		status: tests.find((test) => test.verdict !== "AC")?.verdict ?? "AC",
		score,
		maxScore: 100,
		weight: task.weight,
		weightedScore: score * task.weight / 100,
		tests,
		build: publicBuild(build)
	};
}
function projectHasInternalError(results) {
	return results.some((task) => task.status === "IE" || task.judge?.cases?.some((testCase) => testCase.verdict === "IE") || task.tests?.some((testCase) => testCase.verdict === "IE"));
}
async function scoreProjectUnlocked(lab, options) {
	const target = options.target ?? "student";
	assertTarget(target);
	const tasks = selectedTasks(lab, options.taskId);
	if (options.caseId !== void 0 && (tasks.length !== 1 || tasks[0]?.kind !== "stdio")) throw new LabError("ARGUMENT_INVALID", "Project --case 必须同时选择一个 stdio --task");
	const before = await projectInputs(lab, target);
	let configured;
	if (tasks.some((task) => task.kind === "ctest")) configured = await configureProject(lab, target, options);
	const modules = /* @__PURE__ */ new Map();
	const results = [];
	for (const task of tasks) if (task.kind === "manual") results.push({
		id: task.id,
		kind: task.kind,
		status: "PENDING",
		weight: task.weight,
		weightedScore: 0,
		checklist: task.config.checklist
	});
	else if (task.kind === "stdio") {
		const judged = await judgeProgram(programView(lab, task), {
			target,
			caseId: options.caseId
		});
		results.push({
			id: task.id,
			kind: task.kind,
			status: judged.verdict,
			score: judged.score,
			maxScore: judged.maxScore,
			weight: task.weight,
			weightedScore: judged.maxScore ? judged.score / judged.maxScore * task.weight : 0,
			judge: judged
		});
	} else results.push(await scoreCtest(lab, task, target, await buildTask(lab, task, configured, modules)));
	const automated = results.filter((task) => task.kind !== "manual");
	const automatedScore = automated.reduce((total, task) => total + task.weightedScore, 0);
	const after = await projectInputs(lab, target);
	const at = (/* @__PURE__ */ new Date()).toISOString();
	const state = await readProjectState(lab, target);
	for (const result of results) {
		const inputs = before[result.id];
		result.inputFingerprint = inputs.fingerprint;
		result.changedDuringRun = inputs.fingerprint !== after[result.id].fingerprint;
		result.assessedAt = at;
		if (result.kind !== "manual" && options.caseId === void 0) state.tasks[result.id] = {
			at,
			fingerprint: inputs.fingerprint,
			changedDuringRun: result.changedDuringRun,
			bestScore: Math.max(state.tasks[result.id]?.bestScore ?? 0, result.weightedScore),
			result
		};
	}
	await writeProjectState(lab, target, state);
	return {
		target,
		tasks: results,
		automatedScore,
		automatedMax: automated.reduce((total, task) => total + task.weight, 0),
		manualPending: results.filter((task) => task.kind === "manual").reduce((total, task) => total + task.weight, 0),
		provisionalTotal: automatedScore,
		total: 100,
		automatedFull: automated.length > 0 && automated.every((task) => task.status === "AC" && !task.changedDuringRun),
		internalError: projectHasInternalError(results),
		selectedTaskId: options.taskId,
		partial: Boolean(options.caseId),
		current: currentProject(lab, state, after)
	};
}
async function scoreProject(lab, options = {}) {
	return withProjectLock(lab, () => scoreProjectUnlocked(lab, options));
}
async function refreshProjectExpected(lab, options = {}) {
	const stdioTasks = selectedTasks(lab, options.taskId).filter((task) => task.kind === "stdio");
	if (stdioTasks.length === 0) throw new LabError("TYPE_UNSUPPORTED", options.taskId === void 0 ? "当前 Project 没有可刷新 .out 的 stdio task" : `task ${options.taskId} 不是 stdio task，不能刷新 .out`);
	const tasks = [];
	for (const task of stdioTasks) tasks.push({
		id: task.id,
		refresh: await refreshExpected(programView(lab, task), Boolean(options.write))
	});
	return {
		changed: tasks.reduce((total, task) => total + task.refresh.changed, 0),
		written: tasks.reduce((total, task) => total + task.refresh.written, 0),
		tasks
	};
}
async function interactiveProjectTask(lab, taskId, target = "student") {
	const task = selectedTask(lab, taskId);
	if (task.kind !== "stdio") throw new LabError("TYPE_UNSUPPORTED", "interactive 只支持 stdio task");
	return runInteractive(programView(lab, task), target);
}
async function verifyProject(lab) {
	const drift = await refreshProjectExpected(lab, { write: false }).catch((error) => {
		if (error?.code === "TYPE_UNSUPPORTED") return {
			changed: 0,
			written: 0,
			tasks: []
		};
		throw error;
	});
	const solution = await scoreProject(lab, { target: "solution" });
	const student = await scoreProject(lab, { target: "student" });
	const checks = {
		solutionAutomatedFull: solution.automatedFull,
		studentNotFull: !student.automatedFull,
		studentCompiles: student.tasks.every((task) => ![
			"CE",
			"BLOCKED",
			"IE"
		].includes(task.status)),
		weightsTotal100: solution.automatedMax + solution.manualPending === 100,
		expectedStable: drift.changed === 0
	};
	return {
		ok: Object.values(checks).every(Boolean),
		checks,
		drift,
		solution,
		student
	};
}
function projectRetry(command, labPath, taskId, caseId) {
	if (labPath === void 0 || taskId === void 0) return void 0;
	const parts = [
		command,
		quoteCommandArg(labPath),
		"--task",
		quoteCommandArg(taskId)
	];
	if (caseId !== void 0) parts.push("--case", quoteCommandArg(caseId));
	return parts.join(" ");
}
function formatProject(result, options = {}) {
	const theme = options.theme ?? createTheme({ color: false });
	const taskWidth = Math.max(20, ...result.tasks.map((task) => task.id.length));
	const nestedWidth = Math.max(18, ...result.tasks.flatMap((task) => [...task.judge?.cases?.map((item) => item.id.length) ?? [], ...task.tests?.map((test) => test.name.length) ?? []]));
	const lines = [`${theme.cell("TASK", taskWidth, theme.muted)} ${theme.cell("KIND", 9, theme.muted)} ${theme.cell("RESULT", 9, theme.muted)} ${theme.muted("SCORE")}`];
	for (const task of result.tasks) {
		const score = task.kind === "manual" ? `${theme.warning("PENDING")} /${theme.success(task.weight)}` : theme.score(task.weightedScore, task.weight);
		lines.push(`${theme.cell(task.id, taskWidth)} ${theme.cell(task.kind, 9)} ${theme.cell(task.status, 9, theme.verdict)} ${score}`);
		if (task.judge) {
			for (const item of task.judge.cases) {
				lines.push(`  ${theme.cell(item.id, nestedWidth)} ${theme.cell(item.verdict, 9, theme.verdict)} ${theme.score(item.points, item.maxPoints)}`);
				if (item.comparison && !item.comparison.equal) {
					const difference = item.comparison.difference;
					const location = difference.kind === "token" ? `第 ${difference.index} 个 token` : `第 ${difference.line} 行第 ${difference.column} 列`;
					lines.push(`    ${theme.heading("首处差异：")}${location}`, `    ${theme.muted("期望：")} ${JSON.stringify(difference.expected)}`, `    ${theme.muted("实际：")} ${JSON.stringify(difference.actual)}`);
				}
				if (item.stderr) lines.push(`    ${theme.heading("stderr")}`, cleanTerminalText(item.stderr).trim().slice(0, 500));
			}
			if (task.status === "CE") {
				const diagnostic = cleanTerminalText(task.judge.compilation?.stderr || task.judge.compilation?.stdout).trim();
				if (diagnostic) lines.push(`  ${theme.heading("编译诊断")}`, diagnostic);
			}
		}
		if (task.tests) for (const test of task.tests) {
			lines.push(`  ${theme.cell(test.name, nestedWidth)} ${theme.cell(test.verdict, 9, theme.verdict)} ${theme.score(test.points, test.maxPoints)}`);
			if (test.verdict !== "AC" && test.output) lines.push(`    ${theme.heading("CTest output")}`, cleanTerminalText(test.output).trim().slice(0, 1e3));
		}
		if (task.build && !task.build.ok) {
			lines.push(`  ${theme.heading(`CMake ${task.build.phase} (${task.build.scope ?? "task"})`)}`);
			if (task.blockedBy !== void 0 && task.blockedBy.length > 0) lines.push(`  BLOCKED BY: ${task.blockedBy.join(", ")}`);
			const diagnostic = task.build.build ?? task.build.configure;
			lines.push(cleanTerminalText(`${diagnostic?.stdout ?? ""}\n${diagnostic?.stderr ?? ""}`).trim());
		}
		if (task.build?.legacyBuild) lines.push("  Legacy whole-project build: add ctest.buildTargets for task isolation.");
		if (task.changedDuringRun) lines.push("  STALE: inputs changed during assessment; retry required.");
	}
	lines.push(theme.separator(Math.max(56, taskWidth + 37)));
	lines.push(`${theme.heading("Automated：")} ${theme.score(result.automatedScore, result.automatedMax)}`);
	lines.push(`${theme.heading("Manual pending：")} ${result.manualPending ? theme.warning(result.manualPending) : theme.success("0")}`);
	lines.push(`${theme.heading("Provisional total：")} ${theme.score(result.provisionalTotal, result.total)}`);
	lines.push(`AUTOMATED ${theme.status(result.automatedFull ? "PASS" : "NOT FULL")}${result.manualPending ? ` · ${theme.warning("MANUAL REVIEW PENDING")}` : ""}`);
	if (result.current !== void 0) {
		lines.push(`CURRENT PROJECT: ${result.current.automatedScore}/${result.current.automatedMax} · ${result.current.complete ? "COMPLETE" : "INCOMPLETE"}`);
		for (const task of result.current.tasks) lines.push(`  ${task.id}: ${task.status} ${task.weightedScore}/${task.weight}${task.status === "STALE" ? ` (historical ${task.historicalScore}/${task.weight})` : ""}`);
	}
	const failedTask = result.tasks.find((task) => task.kind !== "manual" && task.status !== "AC");
	const retry = projectRetry(options.command ?? "pnpm lab run", options.labPath, failedTask?.id, failedTask?.judge?.cases?.find((item) => item.verdict !== "AC")?.id);
	if (retry !== void 0) lines.push(`${theme.heading("Retry：")} ${theme.command(retry)}`);
	return lines.join("\n");
}
//#endregion
//#region ../lab-runner/src/toolchain/doctor.ts
async function probe(name, command, args, minimum, pattern, options) {
	const result = await options.runner(command, args, {
		env: options.env,
		timeMs: 5e3,
		outputKb: 256
	});
	if (result.spawnError) return {
		name,
		command,
		available: false,
		meetsMinimum: false,
		error: result.spawnError.code ?? result.spawnError.message
	};
	const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`.trim();
	const version = parseVersion(output, pattern);
	return {
		name,
		command,
		available: true,
		version: formatVersion(version),
		minimum: formatVersion(minimum),
		meetsMinimum: compareVersion(version, minimum),
		summary: output.split(/\r?\n/).find(Boolean)?.trim()
	};
}
async function inspectEnvironment(lab, options = {}) {
	const platform = options.platform ?? process.platform;
	const env = options.env ?? process.env;
	const runner = options.runner ?? runProcess;
	let msvcEnvironment;
	let msvcError;
	if (platform === "win32") try {
		msvcEnvironment = await createMsvcEnvironment({
			platform,
			env,
			runner
		});
	} catch (error) {
		msvcError = error;
	}
	const probes = await Promise.all([
		probe("GCC", "g++", ["--version"], MINIMUMS.gcc, void 0, {
			env,
			runner
		}),
		probe("Clang", "clang++", ["--version"], MINIMUMS.clang, void 0, {
			env,
			runner
		}),
		probe("MSVC", "cl", [], MINIMUMS.msvc, /Version\s+(\d+)\.(\d+)(?:\.(\d+))?/i, {
			env: msvcEnvironment?.env,
			runner
		}),
		probe("CMake", "cmake", ["--version"], MINIMUMS.cmake, void 0, {
			env,
			runner
		}),
		probe("GNU Make", "make", ["--version"], MINIMUMS.make, void 0, {
			env,
			runner
		})
	]);
	if (probes[0].available && /clang/i.test(probes[0].summary ?? "")) {
		probes[0].name = "Clang (g++ driver)";
		probes[0].minimum = formatVersion(MINIMUMS.clang);
		probes[0].meetsMinimum = compareVersion(parseVersion(probes[0].version), MINIMUMS.clang);
	}
	const compilers = probes.slice(0, 3);
	const cmake = probes.find((item) => item.name === "CMake");
	const make = probes.find((item) => item.name === "GNU Make");
	const issues = [];
	if (lab.manifest.type !== "quiz" && !compilers.some((item) => item.available && item.meetsMinimum)) issues.push("需要 GCC >= 11、Clang >= 14 或 Visual Studio 2022 / MSVC >= 19.30 之一");
	if (lab.manifest.type === "project" && !(cmake.available && cmake.meetsMinimum)) issues.push("Project Lab 需要 CMake >= 3.25");
	return {
		platform: process.platform,
		architecture: process.arch,
		node: process.version,
		standard: lab.manifest.type === "quiz" ? void 0 : lab.manifest.toolchain.standard,
		tools: probes,
		makeOptional: true,
		makeAvailable: make.available,
		msvc: {
			initialized: Boolean(msvcEnvironment),
			installationPath: msvcEnvironment?.installationPath,
			developerCommand: msvcEnvironment?.developerCommand,
			error: msvcError?.message
		},
		fallback: "pnpm lab run <lab-path>",
		ok: issues.length === 0,
		issues
	};
}
//#endregion
//#region src/reporter.ts
const plain = (theme) => theme ?? createTheme({ color: false });
function checkLine(theme, label, passed, successText, failureText) {
	return `${theme.heading(`${label}：`)}${passed ? theme.success(successText) : theme.danger(failureText)}`;
}
function formatHelp(source) {
	const theme = plain(source);
	return [
		theme.heading("DSA Mastery Lab CLI"),
		"",
		theme.heading("用法"),
		`  ${theme.command("pnpm lab <command> [lab-path|lab-id] [options]")}`,
		"",
		theme.heading("命令"),
		...[
			["new", "生成 quiz、program 或 project Lab"],
			["locate", "用稳定 ID 定位 Lab 目录"],
			["doctor", "检查当前 Lab 所需环境（只读，不安装软件）"],
			["validate", "校验 manifest、路径、题目、测试和任务依赖"],
			["build", "编译 student 或 solution 目标"],
			["run", "运行公开测试；未满分仍返回 0，适合 make run"],
			["interactive", "连接终端交互运行学生程序"],
			["score", "严格评分；未满分返回 1"],
			["verify", "验证参考实现、标准输出与学生骨架"],
			["refresh-expected", "预览参考输出漂移；加 --write 才覆盖"],
			["pack", "生成不含 solution 的独立学生包"],
			["clean", "只清理当前 Lab 的 .lab-cache"]
		].map(([command, description]) => `  ${theme.cell(command, 18, theme.command)} ${description}`),
		"",
		theme.heading("通用选项"),
		`  ${theme.command("--json  --no-color")} ${theme.muted("（interactive 直接接管终端，不支持这两项）")}`,
		`  ${theme.command("new --type <type> --chapter <n> --slug <slug> [--order <n>]")}`,
		`  ${theme.command("locate <lab-id>")} ${theme.muted("（例如 02T3）")}`,
		`  ${theme.command("--case <id> --task <id> --target <student|solution>")}`
	].join("\n");
}
function formatNew(created, source) {
	const theme = plain(source);
	return `${theme.success("CREATED")} ${created.type} Lab · ${theme.info(created.labId)}\n${theme.heading("Order：")}${created.order}\n${theme.heading("Path：")}${theme.path(created.relativeRoot)}`;
}
function formatLocate(lab, source) {
	const theme = plain(source);
	return `${theme.success("FOUND")} ${theme.info(lab.id)}\n${theme.heading("Type：")}${lab.type ?? lab.category ?? "README-only"}\n${theme.heading("Path：")}${theme.path(lab.relativePath)}`;
}
function formatValidate(report, source) {
	const theme = plain(source);
	const quiz = report["quiz"];
	const cases = report["cases"];
	const tasks = report["tasks"];
	const lines = [`${theme.success("VALIDATION PASS")} ${report.lab.id === void 0 ? "" : `${theme.info(report.lab.id)} · `}${theme.path(report.lab.path)}`, `${theme.heading("类型：")}${report.lab.type} · Schema v${report.lab.schemaVersion}`];
	if (quiz) lines.push(`${theme.heading("题目：")}${quiz.count} 道 · ${theme.score(quiz.totalPoints, quiz.totalPoints)}`);
	if (cases !== void 0) lines.push(`${theme.heading("测试：")}${cases} 个 · ${theme.score(100, 100)}`);
	if (tasks !== void 0) lines.push(`${theme.heading("任务：")}${tasks} 个 · 权重 ${theme.score(100, 100)}`);
	return lines.join("\n");
}
function formatDoctor(report, source) {
	const theme = plain(source);
	const environment = report.environment;
	const lines = [
		`${theme.status(environment.ok ? "PASS" : "FAIL")} 环境检查`,
		`${theme.heading("平台：")}${theme.info(`${environment.platform}/${environment.architecture}`)} · Node ${environment.node}`,
		""
	];
	for (const tool of environment.tools) {
		const status = !tool.available ? "NOT FOUND" : tool.meetsMinimum ? "AVAILABLE" : "TOO OLD";
		const style = tool.name === "GNU Make" && !tool.available ? theme.muted : theme.status;
		const version = tool.available ? ` ${tool.version}` : "";
		const minimum = tool.minimum === void 0 ? "" : theme.muted(` (>= ${tool.minimum})`);
		lines.push(`${theme.cell(tool.name, 20, theme.heading)} ${theme.cell(status, 11, style)}${version}${minimum}`);
	}
	lines.push("", `${theme.muted("GNU Make 为推荐项而非必装依赖；免 Make 入口：")} ${theme.command("pnpm lab run <lab-path>")}`);
	for (const issue of environment.issues) lines.push(`${theme.danger("ISSUE")} ${issue}`);
	return lines.join("\n");
}
function formatBuild(compilation, source) {
	const theme = plain(source);
	const built = compilation;
	if (built.ok) {
		const lines = [`${theme.success("BUILD PASS")} ${built.target ?? "student"}`];
		if (built.executable) lines.push(`${theme.heading("Executable：")}${theme.path(built.executable)}`);
		return lines.join("\n");
	}
	const phase = built.phase ?? "compile";
	const phaseResult = built[phase] ?? built;
	const diagnostic = cleanTerminalText(phaseResult.stderr ?? phaseResult.stdout).trim();
	return [
		`${theme.danger("BUILD FAILED")} ${theme.verdict("CE")} · ${phase}`,
		diagnostic && theme.heading("诊断"),
		diagnostic
	].filter(Boolean).join("\n");
}
function formatVerify(type, verification, source) {
	const theme = plain(source);
	const lines = [`${theme.status(verification.ok ? "PASS" : "FAIL")} VERIFY · ${type}`];
	if (type === "quiz") {
		const quiz = verification.quiz;
		lines.push(`${theme.success("PASS")} Quiz：${quiz.count} 道，${quiz.totalPoints} 分；manifest 与题目合同通过。`);
	} else if (type === "project") {
		const { solution, student } = verification;
		lines.push(`${theme.heading("参考实现自动分：")}${theme.score(solution.automatedScore, solution.automatedMax)}`, `${theme.heading("学生骨架自动分：")}${theme.score(student.automatedScore, student.automatedMax)}`, `${theme.heading("人工待评分：")}${solution.manualPending ? theme.warning(solution.manualPending) : theme.success("0")}`);
	} else {
		const { checks, drift } = verification;
		lines.push(checkLine(theme, "参考实现", checks["solutionFullScore"], "100/100", "失败"), checkLine(theme, "学生骨架编译", checks["studentCompiles"], "可编译", "编译失败"), checkLine(theme, "学生骨架分数", checks["studentNotFullScore"], "未误得满分", "错误地得到满分"), checkLine(theme, "标准输出", checks["expectedStable"], "无漂移", `有 ${drift.changed} 处漂移`));
	}
	return lines.join("\n");
}
function formatDiff(diff, theme) {
	return cleanTerminalText(diff).split(/\r?\n/).map((line) => {
		if (line.startsWith("- ")) return theme.danger(line);
		if (line.startsWith("+ ")) return theme.success(line);
		return theme.muted(line);
	}).join("\n");
}
function formatRefresh(refresh, { write = false, theme: source } = {}) {
	const theme = plain(source);
	if (!refresh.changed) return `${theme.success("NO DRIFT")} 标准输出与参考实现一致，无需更新。`;
	const changes = "tasks" in refresh ? refresh.tasks.flatMap((task) => task.refresh.changes.map((change) => ({
		...change,
		id: `${task.id}/${change.id}`
	}))) : refresh.changes;
	const lines = [`${write ? theme.success("EXPECTED UPDATED") : theme.warning("DRIFT PREVIEW")} ${refresh.changed} change(s)`];
	for (const change of changes) lines.push("", `${theme.heading(change.id)} ${theme.path(change.expected)}`, formatDiff(change.diff, theme));
	lines.push("", write ? `${theme.success("WRITTEN")} 已更新 ${refresh.written} 个 .out 文件。` : `${theme.warning("PREVIEW ONLY")} 确认 diff 后加 ${theme.command("--write")} 才会覆盖 .out。`);
	return lines.join("\n");
}
function formatPack(packed, source) {
	const theme = plain(source);
	return `${theme.success("PACKAGE READY")} 学生包已生成\n${theme.heading("Path：")}${theme.path(packed.packageRoot)}`;
}
function formatClean(cleaned, source) {
	const theme = plain(source);
	return `${theme.success("CLEANED")} ${theme.path(cleaned.cache)}`;
}
function formatError(error, source) {
	return `${plain(source).danger(`[${error.code}]`)} ${cleanTerminalText(error.message)}`;
}
//#endregion
//#region src/scaffold.ts
function pad(value) {
	return String(value).padStart(2, "0");
}
function json(value) {
	return `${JSON.stringify(value, null, 2)}\n`;
}
function readme({ chapter, order, type, labId, relativeRoot }) {
	const title = `${formatLabDocumentTitlePrefix(labId)}${{
		quiz: "选择题自测",
		program: "编程练习",
		project: "综合项目"
	}[type]}`;
	const body = type === "quiz" ? "## 选择题\n\n<QuizSet />" : `## 任务\n\n请补充输入、输出、约束、正常/边界/错误情况。\n\n## 运行\n\n\`\`\`powershell\nmake run\n# 免 Make 兜底：在仓库根执行\npnpm lab run ${relativeRoot}\n\`\`\``;
	return `---
title: "${title}"
description: "请在发布前把这里替换为可检查的 Lab 学习成果。"
order: ${order}
chapter: ${chapter}
labId: "${labId}"
chapterTitle: "请填写章节标题"
updated: "${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}"
contributors: ["DSA Mastery Team"]
status: "draft"
lab: true
difficulty: "基础"
duration: "45～60 分钟"
---

# ${title}

## 学习目标

- [ ] 请填写一个可以检查的学习目标。

## 前置知识与环境

请说明所需知识与环境。可执行 Lab 先运行 \`make doctor\`；未安装 Make 时使用 pnpm 兜底命令。

${body}

## 完成清单

- [ ] 正常、边界和错误情况都有可复现证据。
- [ ] README 命令已从干净检出验证。

## 思考与复盘

记录一种错误方案、失败原因和改进方式。
`;
}
const starter = `#include <iostream>

int main() {
    // TODO: 读取输入并完成任务。学生骨架应可编译，但不能直接得到满分。
    return 0;
}
`;
const solution = `#include <iostream>

int main() {
    // TODO(author): 把占位行为替换为经过审阅的参考实现，并重新生成标准输出。
    std::cout << 0 << '\\n';
    return 0;
}
`;
async function write(root, relative, content) {
	const file = path.join(root, relative);
	await mkdir(path.dirname(file), { recursive: true });
	await writeFile(file, content, {
		encoding: "utf8",
		flag: "wx"
	});
}
async function syncChapterCategoryDirectories(root, chapter) {
	const chapterRoot = path.join(root, "labs", `chapter-${pad(chapter)}`);
	for (const category of LAB_CATEGORIES) {
		const categoryRoot = path.join(chapterRoot, category);
		await mkdir(categoryRoot, { recursive: true });
		const entries = await readdir(categoryRoot, { withFileTypes: true });
		const marker = path.join(categoryRoot, ".gitkeep");
		if (entries.some((entry) => entry.isDirectory())) await rm(marker, { force: true });
		else if (!await pathExists(marker)) await writeFile(marker, "", {
			encoding: "utf8",
			flag: "wx"
		});
	}
}
async function writeQuizLab(root, relativeRoot) {
	await write(root, `${relativeRoot}/lab.json`, json({
		$schema: "../../../../schemas/lab.schema.json",
		schemaVersion: 1,
		type: "quiz",
		quiz: {
			questions: "quiz.json",
			questionType: "single-choice",
			reveal: "after-submit",
			scoring: "points"
		}
	}));
	await write(root, `${relativeRoot}/quiz.json`, json([{
		id: "q1",
		stem: "请替换为题面。",
		options: [
			"选项一",
			"选项二",
			"选项三",
			"选项四"
		],
		answer: 0,
		explanation: "请补充解析。",
		hint: "可选提示。",
		points: 1
	}]));
}
async function writeProgramLab(root, relativeRoot) {
	await write(root, `${relativeRoot}/lab.json`, json({
		$schema: "../../../../schemas/lab.schema.json",
		schemaVersion: 1,
		type: "program",
		language: "cpp",
		toolchain: {
			standard: "c++17",
			profile: "course-default"
		},
		targets: {
			student: { sources: ["student/main.cpp"] },
			solution: { sources: ["solution/main.cpp"] }
		},
		judge: {
			kind: "stdio",
			cases: "tests/cases.json",
			compare: { mode: "tokens" },
			limits: {
				timeMs: 2e3,
				outputKb: 1024
			}
		}
	}));
	await write(root, `${relativeRoot}/Makefile`, THIN_MAKEFILE);
	await write(root, `${relativeRoot}/student/main.cpp`, starter);
	await write(root, `${relativeRoot}/solution/main.cpp`, solution);
	await write(root, `${relativeRoot}/tests/cases.json`, json([{
		id: "sample",
		input: "tests/001-sample.in",
		expected: "tests/001-sample.out",
		points: 100,
		tags: ["sample"]
	}]));
	await write(root, `${relativeRoot}/tests/001-sample.in`, "\n");
	await write(root, `${relativeRoot}/tests/001-sample.out`, "0\n");
}
async function writeProjectLab(root, relativeRoot) {
	await write(root, `${relativeRoot}/lab.json`, json({
		$schema: "../../../../schemas/lab.schema.json",
		schemaVersion: 1,
		type: "project",
		language: "cpp",
		toolchain: {
			standard: "c++17",
			profile: "course-default"
		},
		buildSystem: "cmake",
		tasks: [{
			id: "implementation",
			path: "tasks/task-01-implementation",
			weight: 80,
			kind: "ctest",
			dependsOn: []
		}, {
			id: "report",
			path: "report",
			weight: 20,
			kind: "manual",
			dependsOn: ["implementation"]
		}]
	}));
	await write(root, `${relativeRoot}/Makefile`, THIN_MAKEFILE);
	await write(root, `${relativeRoot}/CMakeLists.txt`, "cmake_minimum_required(VERSION 3.25)\nproject(dsa_lab LANGUAGES CXX)\nif(NOT DEFINED CMAKE_CXX_STANDARD)\n  set(CMAKE_CXX_STANDARD 17)\nendif()\nset(CMAKE_CXX_STANDARD_REQUIRED ON)\nset(CMAKE_CXX_EXTENSIONS OFF)\noption(LAB_USE_SOLUTION \"Build reference implementation\" OFF)\nif(MSVC)\n  add_compile_options(/W4 /permissive-)\nelse()\n  add_compile_options(-Wall -Wextra -Wpedantic)\nendif()\nenable_testing()\nadd_subdirectory(tasks/task-01-implementation)\n");
	await write(root, `${relativeRoot}/CMakePresets.json`, json({
		version: 6,
		configurePresets: [{
			name: "student",
			binaryDir: "${sourceDir}/.lab-cache/cmake/student",
			cacheVariables: {
				CMAKE_CXX_STANDARD: "17",
				CMAKE_CXX_STANDARD_REQUIRED: "ON",
				LAB_USE_SOLUTION: "OFF"
			}
		}, {
			name: "solution",
			binaryDir: "${sourceDir}/.lab-cache/cmake/solution",
			cacheVariables: {
				CMAKE_CXX_STANDARD: "17",
				CMAKE_CXX_STANDARD_REQUIRED: "ON",
				LAB_USE_SOLUTION: "ON"
			}
		}],
		buildPresets: [{
			name: "student",
			configurePreset: "student"
		}, {
			name: "solution",
			configurePreset: "solution"
		}],
		testPresets: [{
			name: "student",
			configurePreset: "student",
			output: { outputOnFailure: true }
		}, {
			name: "solution",
			configurePreset: "solution",
			output: { outputOnFailure: true }
		}]
	}));
	await write(root, `${relativeRoot}/tasks/task-01-implementation/task.json`, json({
		$schema: "../../../../../../schemas/task.schema.json",
		schemaVersion: 1,
		kind: "ctest",
		ctest: {
			buildTargets: ["implementation"],
			tests: [{
				name: "implementation-smoke",
				points: 100
			}]
		}
	}));
	await write(root, `${relativeRoot}/tasks/task-01-implementation/CMakeLists.txt`, "set(IMPLEMENTATION_SOURCE student/main.cpp)\nif(LAB_USE_SOLUTION)\n  set(IMPLEMENTATION_SOURCE solution/main.cpp)\nendif()\nadd_executable(implementation ${IMPLEMENTATION_SOURCE})\nadd_test(NAME implementation-smoke COMMAND implementation)\n");
	await write(root, `${relativeRoot}/tasks/task-01-implementation/student/main.cpp`, "int main() { return 1; }\n");
	await write(root, `${relativeRoot}/tasks/task-01-implementation/solution/main.cpp`, "int main() { return 0; }\n");
	await write(root, `${relativeRoot}/tasks/task-01-implementation/README.md`, "# Task 01：Implementation\n\n请补充接口、验收标准和边界情况。\n");
	await write(root, `${relativeRoot}/report/task.json`, json({
		$schema: "../../../../../schemas/task.schema.json",
		schemaVersion: 1,
		kind: "manual",
		checklist: ["说明设计、测试证据与复盘"]
	}));
	await write(root, `${relativeRoot}/report/README.md`, "# 人工评分报告\n\n请补充复杂度、测试证据与复盘。\n");
}
async function createLab(options, root) {
	const { type, slug } = options;
	const chapter = Number(options.chapter);
	if (type !== "quiz" && type !== "program" && type !== "project") throw new LabError("ARGUMENT_INVALID", "--type 必须是 quiz、program 或 project");
	if (!Number.isInteger(chapter) || chapter < 0 || chapter > 99) throw new LabError("ARGUMENT_INVALID", "--chapter 必须是 0～99 的整数");
	if (typeof slug !== "string" || !LAB_SLUG_PATTERN.test(slug)) throw new LabError("ARGUMENT_INVALID", "--slug 必须是小写 kebab-case");
	const identity = await allocateLabIdentity(root, {
		type,
		chapter,
		order: options.order
	});
	const directoryName = formatLabDirectoryName(identity.id, slug);
	const relativeRoot = `labs/chapter-${pad(chapter)}/${categoryForType(type)}/${directoryName}`;
	const labRoot = path.join(root, relativeRoot);
	if (await pathExists(labRoot)) throw new LabError("TARGET_EXISTS", `目标 Lab 已存在：${relativeRoot}`);
	await mkdir(path.dirname(labRoot), { recursive: true });
	await mkdir(labRoot, { recursive: false });
	await write(root, `${relativeRoot}/README.md`, readme({
		chapter,
		order: identity.order,
		type,
		labId: identity.id,
		relativeRoot
	}));
	if (type === "quiz") await writeQuizLab(root, relativeRoot);
	else if (type === "program") await writeProgramLab(root, relativeRoot);
	else await writeProjectLab(root, relativeRoot);
	await syncChapterCategoryDirectories(root, chapter);
	return {
		labRoot,
		relativeRoot,
		type,
		labId: identity.id,
		order: identity.order
	};
}
//#endregion
//#region src/cli.ts
const LAB_ID_ARGUMENT = /^(?:lab-?)?\d{1,2}-?[tep]-?\d+$/i;
function parseArgs(argv) {
	const [command, ...forwarded] = argv;
	const rest = forwarded[0] === "--" ? forwarded.slice(1) : forwarded;
	const options = {};
	const positional = [];
	for (let index = 0; index < rest.length; index += 1) {
		const token = rest[index];
		if (!token.startsWith("--")) {
			positional.push(token);
			continue;
		}
		const [rawKey = "", inline] = token.slice(2).split("=", 2);
		if ([
			"json",
			"no-color",
			"write"
		].includes(rawKey)) {
			options[rawKey] = inline === void 0 ? true : inline !== "false";
			continue;
		}
		const value = inline ?? rest[index + 1];
		if (value === void 0 || value.startsWith("--")) throw new LabError("ARGUMENT_INVALID", `--${rawKey} 缺少值`);
		if (inline === void 0) index += 1;
		options[rawKey] = value;
	}
	return {
		command,
		options,
		positional
	};
}
const COMMON_OPTIONS = ["json", "no-color"];
const OPTIONS_BY_COMMAND = {
	new: [
		...COMMON_OPTIONS,
		"type",
		"chapter",
		"order",
		"slug"
	],
	locate: COMMON_OPTIONS,
	doctor: COMMON_OPTIONS,
	validate: COMMON_OPTIONS,
	build: [
		...COMMON_OPTIONS,
		"target",
		"task"
	],
	"project-status": [
		...COMMON_OPTIONS,
		"target",
		"dirty-files"
	],
	run: [
		...COMMON_OPTIONS,
		"target",
		"case",
		"task"
	],
	interactive: ["target", "task"],
	score: [
		...COMMON_OPTIONS,
		"target",
		"case",
		"task"
	],
	verify: COMMON_OPTIONS,
	"refresh-expected": [
		...COMMON_OPTIONS,
		"write",
		"task"
	],
	pack: [...COMMON_OPTIONS, "profile"],
	clean: COMMON_OPTIONS
};
function validateOptions(parsed) {
	const allowed = OPTIONS_BY_COMMAND[parsed.command];
	if (allowed === void 0) return;
	const unknown = Object.keys(parsed.options).filter((key) => !allowed.includes(key));
	if (unknown.length) throw new LabError("ARGUMENT_INVALID", `命令 ${parsed.command} 不支持选项：${unknown.map((key) => `--${key}`).join(", ")}`);
	if (parsed.command !== "new" && parsed.positional.length > 1) throw new LabError("ARGUMENT_INVALID", `${parsed.command} 最多接受一个 Lab 路径`);
	if (parsed.command === "new" && parsed.positional.length) throw new LabError("ARGUMENT_INVALID", "new 不接受位置参数");
	if (parsed.command === "locate" && parsed.positional.length !== 1) throw new LabError("ARGUMENT_INVALID", "locate 要求一个 Lab ID，例如 02T3");
}
/** 位置参数可以是 Lab 路径，也可以是 `02T3` 这样的稳定 ID；都没有时按调用目录推断。 */
async function resolveLabPathArgument(positional, repoRoot) {
	const argument = positional[0] ?? "";
	if (!argument) return invocationDirectory(repoRoot);
	if (!LAB_ID_ARGUMENT.test(argument)) return argument;
	if (repoRoot === void 0) throw new LabError("REPO_NOT_FOUND", `只有在仓库内才能用 Lab ID 定位：${argument}`);
	return (await locateLabById(repoRoot, argument)).labPath;
}
function requireRepo(repoRoot, command) {
	if (repoRoot === void 0) throw new LabError("REPO_NOT_FOUND", `${command} 只能在 DSA Mastery 仓库内运行`);
	return repoRoot;
}
function assertExecutable(lab, command) {
	if (lab.manifest.type === "quiz") throw new LabError("TYPE_UNSUPPORTED", `${command} 不支持 quiz Lab`);
}
const EXECUTABLE_COMMANDS = /* @__PURE__ */ new Set([
	"doctor",
	"validate",
	"build",
	"run",
	"interactive",
	"score",
	"verify",
	"refresh-expected",
	"pack",
	"clean",
	"project-status"
]);
async function main() {
	let parsed;
	try {
		parsed = parseArgs(process.argv.slice(2));
		const theme = createTheme({
			stream: process.stdout,
			noColor: Boolean(parsed.options["no-color"])
		});
		const json = Boolean(parsed.options["json"]);
		if (parsed.command === void 0 || [
			"help",
			"--help",
			"-h"
		].includes(parsed.command)) {
			console.log(formatHelp(theme));
			return EXIT.OK;
		}
		validateOptions(parsed);
		const repoRoot = await findRepoRoot(import.meta.dirname);
		if (parsed.command === "new") {
			const created = await createLab(parsed.options, requireRepo(repoRoot, "new"));
			if (json) console.log(JSON.stringify({
				reportVersion: 1,
				command: "new",
				ok: true,
				lab: {
					id: created.labId,
					path: created.labRoot,
					relativePath: created.relativeRoot,
					type: created.type,
					order: created.order
				}
			}, null, 2));
			else console.log(formatNew(created, theme));
			return EXIT.OK;
		}
		if (parsed.command === "locate") {
			const located = await locateLabById(requireRepo(repoRoot, "locate"), parsed.positional[0]);
			const lab = {
				id: located.id,
				path: located.labPath,
				relativePath: located.relativePath,
				type: located.type,
				category: located.category
			};
			if (json) console.log(JSON.stringify({
				reportVersion: 1,
				command: "locate",
				ok: true,
				lab
			}, null, 2));
			else console.log(formatLocate(lab, theme));
			return EXIT.OK;
		}
		if (!EXECUTABLE_COMMANDS.has(parsed.command)) throw new LabError("COMMAND_UNKNOWN", `未知命令：${parsed.command}`);
		const lab = await loadLab(await resolveLabPathArgument(parsed.positional, repoRoot));
		const target = parsed.options["target"] ?? "student";
		const labPath = parsed.positional[0] ?? lab.labRoot;
		if (parsed.command === "validate") {
			const report = createReport("validate", lab, {
				quiz: isQuizLab(lab) ? lab.quizResult : void 0,
				cases: isProgramLab(lab) ? lab.cases.length : void 0,
				tasks: isProjectLab(lab) ? lab.tasks.length : void 0
			});
			if (json) console.log(JSON.stringify(report, null, 2));
			else console.log(formatValidate(report, theme));
			return EXIT.OK;
		}
		if (parsed.command === "doctor") {
			const environment = await inspectEnvironment(lab);
			const report = createReport("doctor", lab, { environment });
			report.ok = environment.ok;
			if (json) console.log(JSON.stringify(report, null, 2));
			else console.log(formatDoctor({ environment }, theme));
			return environment.ok ? EXIT.OK : EXIT.TOOL_ERROR;
		}
		if (parsed.command === "verify") {
			const verification = isQuizLab(lab) ? {
				ok: true,
				checks: { quizContract: true },
				quiz: lab.quizResult
			} : isProjectLab(lab) ? await verifyProject(lab) : await verifyProgram(lab);
			const report = createReport("verify", lab, { verification });
			report.ok = verification.ok;
			if (json) console.log(JSON.stringify(report, null, 2));
			else console.log(formatVerify(lab.manifest.type, verification, theme));
			return verification.ok ? EXIT.OK : EXIT.SCORE_NOT_FULL;
		}
		assertExecutable(lab, parsed.command);
		if (parsed.command === "project-status") {
			if (!isProjectLab(lab)) throw new LabError("TYPE_UNSUPPORTED", "project-status 仅支持 Project");
			const result = await projectStatus(lab, target, parsed.options["dirty-files"] === void 0 ? [] : JSON.parse(String(parsed.options["dirty-files"])));
			if (json) console.log(JSON.stringify(createReport(parsed.command, lab, { result }), null, 2));
			else console.log(formatProject({
				...result,
				current: result
			}, { theme }));
			return EXIT.OK;
		}
		if (parsed.command === "build") {
			const compilation = isProjectLab(lab) ? await buildProject(lab, target, { taskId: parsed.options["task"] }) : await compileTarget(lab, target);
			const report = createReport("build", lab, { compilation });
			report.ok = compilation.ok;
			if (json) console.log(JSON.stringify(report, null, 2));
			else console.log(formatBuild(compilation, theme));
			return compilation.ok ? EXIT.OK : EXIT.SCORE_NOT_FULL;
		}
		if (parsed.command === "run" || parsed.command === "score") {
			const command = `pnpm lab ${parsed.command}`;
			if (isProjectLab(lab)) {
				const project = await scoreProject(lab, {
					target,
					taskId: parsed.options["task"],
					caseId: parsed.options["case"]
				});
				const report = createReport(parsed.command, lab, { result: project });
				report.ok = !project.internalError;
				if (json) console.log(JSON.stringify(report, null, 2));
				else console.log(formatProject(project, {
					theme,
					command,
					labPath
				}));
				if (project.internalError) return EXIT.TOOL_ERROR;
				return parsed.command === "run" || project.automatedFull ? EXIT.OK : EXIT.SCORE_NOT_FULL;
			}
			const judged = await judgeProgram(lab, {
				target,
				caseId: parsed.options["case"]
			});
			const internalError = judged.cases.some((item) => item.verdict === "IE");
			const report = createReport(parsed.command, lab, { result: {
				target: judged.target,
				verdict: judged.verdict,
				score: judged.score,
				maxScore: judged.maxScore,
				cases: judged.cases,
				compilation: {
					ok: judged.compilation.ok,
					compiler: judged.compilation.compiler,
					durationMs: judged.compilation.durationMs,
					stdout: judged.compilation.stdout,
					stderr: judged.compilation.stderr
				}
			} });
			report.ok = !internalError;
			if (json) console.log(JSON.stringify(report, null, 2));
			else console.log(formatJudge(judged, {
				theme,
				command,
				labPath
			}));
			if (internalError) return EXIT.TOOL_ERROR;
			return parsed.command === "run" || judged.score === judged.maxScore ? EXIT.OK : EXIT.SCORE_NOT_FULL;
		}
		if (parsed.command === "interactive") return (isProjectLab(lab) ? await interactiveProjectTask(lab, parsed.options["task"], target) : await runInteractive(lab, target)).code;
		if (parsed.command === "refresh-expected") {
			const refresh = isProjectLab(lab) ? await refreshProjectExpected(lab, {
				taskId: parsed.options["task"],
				write: Boolean(parsed.options["write"])
			}) : await refreshExpected(lab, Boolean(parsed.options["write"]));
			const report = createReport("refresh-expected", lab, { refresh });
			if (json) console.log(JSON.stringify(report, null, 2));
			else console.log(formatRefresh(refresh, {
				write: Boolean(parsed.options["write"]),
				theme
			}));
			return refresh.changed && parsed.options["write"] === void 0 ? EXIT.SCORE_NOT_FULL : EXIT.OK;
		}
		if (parsed.command === "pack") {
			if (parsed.options["profile"] !== "student") throw new LabError("ARGUMENT_INVALID", "pack 目前要求 --profile student");
			const packed = await packStudent(lab);
			const report = createReport("pack", lab, { package: packed });
			if (json) console.log(JSON.stringify(report, null, 2));
			else console.log(formatPack(packed, theme));
			return EXIT.OK;
		}
		const cleaned = await cleanLab(lab);
		if (json) console.log(JSON.stringify(createReport("clean", lab, { cleaned }), null, 2));
		else console.log(formatClean(cleaned, theme));
		return EXIT.OK;
	} catch (rawError) {
		const error = asLabError(rawError);
		if (parsed?.options?.["json"] !== void 0) console.log(JSON.stringify({
			reportVersion: 1,
			command: parsed?.command ?? null,
			ok: false,
			error: {
				code: error.code,
				message: error.message,
				details: error.details
			}
		}, null, 2));
		else {
			const theme = createTheme({
				stream: process.stderr,
				noColor: Boolean(parsed?.options?.["no-color"])
			});
			console.error(formatError(error, theme));
		}
		return EXIT.TOOL_ERROR;
	}
}
process.exitCode = await main();
//#endregion
export {};
