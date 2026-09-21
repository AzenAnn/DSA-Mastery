#!/usr/bin/env node
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";
import { access, mkdir, mkdtemp, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import { Buffer } from "node:buffer";
import { execFileSync, spawn } from "node:child_process";
import { stripVTControlCharacters } from "node:util";
import os from "node:os";
//#region ../lab-core/src/errors.ts
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
//#endregion
//#region ../lab-core/src/manifest/schema.ts
async function pathExists$1(target) {
	try {
		await access(target);
		return true;
	} catch {
		return false;
	}
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
		const [workspace, labs] = await Promise.all([pathExists$1(path.join(current, "pnpm-workspace.yaml")), pathExists$1(path.join(current, "labs"))]);
		if (workspace && labs) return current;
		const parent = path.dirname(current);
		if (parent === current) return void 0;
		current = parent;
	}
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
const PROFILES = {
	runtime: {
		name: "runtime",
		requiresCompiler: false,
		requiresCmake: false
	},
	basic: {
		name: "basic",
		requiresCompiler: true,
		requiresCmake: false
	},
	full: {
		name: "full",
		requiresCompiler: true,
		requiresCmake: true
	}
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
function profileRequirements(profile) {
	const result = PROFILES[profile];
	if (result === void 0) throw new LabError("ARGUMENT_INVALID", `不支持的安装 profile：${profile}（可选 runtime、basic 或 full）`);
	return result;
}
//#endregion
//#region ../lab-core/src/system/terminal.ts
function cleanTerminalText(value) {
	return stripVTControlCharacters(String(value ?? ""));
}
//#endregion
//#region src/options.ts
const DEFAULT_REPO_URL = "https://github.com/AzenAnn/DSA-Mastery.git";
const VALUE_OPTIONS = /* @__PURE__ */ new Set([
	"profile",
	"repo-dir",
	"repo-url",
	"ui"
]);
const VALUE_KEYS = {
	profile: "profile",
	"repo-dir": "repoDir",
	"repo-url": "repoUrl",
	ui: "ui"
};
const BOOLEAN_OPTIONS = /* @__PURE__ */ new Map([
	["check-only", "checkOnly"],
	["skip-vscode", "skipVscode"],
	["install-vscode", "installVscode"],
	["update-repo", "updateRepo"],
	["non-interactive", "nonInteractive"],
	["json", "json"],
	["no-ui", "noUi"],
	["help", "help"]
]);
function invalid(message) {
	return new LabError("ARGUMENT_INVALID", message);
}
function assignValue(result, key, value) {
	if (key === "profile" && ![
		"runtime",
		"basic",
		"full"
	].includes(value)) throw invalid(`--profile 必须是 runtime、basic 或 full，收到：${value}`);
	if (key === "ui" && ![
		"auto",
		"tui",
		"plain"
	].includes(value)) throw invalid(`--ui 必须是 auto、tui 或 plain，收到：${value}`);
	result[VALUE_KEYS[key]] = value;
}
function parseSetupArgs(argv = []) {
	const result = {
		profile: void 0,
		repoDir: void 0,
		repoUrl: DEFAULT_REPO_URL,
		checkOnly: false,
		ui: "auto",
		skipVscode: false,
		installVscode: false,
		updateRepo: false,
		nonInteractive: false,
		json: false
	};
	let noUi = false;
	for (let index = 0; index < argv.length; index += 1) {
		const token = String(argv[index]);
		if (token === "--") continue;
		if (!token.startsWith("--")) throw invalid(`不支持的位置参数：${token}`);
		const [rawKey, inlineValue] = token.slice(2).split("=", 2);
		const booleanKey = BOOLEAN_OPTIONS.get(rawKey);
		if (booleanKey) {
			if (inlineValue !== void 0 && !["true", "false"].includes(inlineValue)) throw invalid(`--${rawKey} 只接受 true 或 false`);
			const value = inlineValue === void 0 ? true : inlineValue === "true";
			if (booleanKey === "noUi") noUi = value;
			else result[booleanKey] = value;
			continue;
		}
		if (!VALUE_OPTIONS.has(rawKey)) throw invalid(`未知选项：--${rawKey}`);
		const value = inlineValue ?? argv[++index];
		if (value === void 0 || String(value).startsWith("--")) throw invalid(`--${rawKey} 缺少值`);
		assignValue(result, rawKey, String(value));
	}
	if (noUi && result.ui !== "auto") throw invalid("--ui 与 --no-ui 不能同时指定");
	if (noUi) result.ui = "plain";
	if (result.json || result.nonInteractive) result.ui = "plain";
	return result;
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
	if (env.VSWHERE_PATH !== void 0 && env.VSWHERE_PATH !== "") candidates.push(env.VSWHERE_PATH);
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
//#endregion
//#region src/checks.ts
/**
* 学生要装的 pnpm 直接取自仓库的 packageManager —— 再抄一份常量必然会漂移。
* setup.js 总是在克隆好的仓库里运行（见 scripts/bootstrap-*.sh），这个文件一定读得到。
*/
async function readPnpmVersion() {
	const root = await findRepoRoot(import.meta.dirname);
	if (root === void 0) throw new Error("找不到仓库根目录，无法确定要安装的 pnpm 版本。");
	const manifest = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"));
	const version = manifest.packageManager?.match(/^pnpm@([^+]+)/u)?.[1];
	if (version === void 0) throw new Error(`package.json 的 packageManager 不是 pnpm@<版本>：${manifest.packageManager}`);
	return version;
}
const PNPM_VERSION = await readPnpmVersion();
function hasTool$1(tools, names) {
	return tools.some((tool) => names.includes(tool.name) && tool.available && tool.meetsMinimum);
}
function evaluateProfile(profile, tools = []) {
	const requirement = profileRequirements(profile);
	const issues = [];
	const git = tools.find((tool) => tool.name === "Git");
	const node = tools.find((tool) => tool.name === "Node.js");
	const pnpm = tools.find((tool) => tool.name === "pnpm");
	if (!git?.available || !git.meetsMinimum) issues.push("Git");
	if (!node?.available || !node.meetsMinimum) issues.push(`Node.js >= ${formatVersion(MINIMUMS.node)}`);
	if (!pnpm?.available || !pnpm.meetsMinimum || pnpm.version !== PNPM_VERSION) issues.push(`pnpm ${PNPM_VERSION}`);
	const compilerReady = hasTool$1(tools, [
		"GCC",
		"Clang",
		"Clang (g++ driver)",
		"MSVC"
	]);
	if (requirement.requiresCompiler && !compilerReady) issues.push("GCC >= 11、Clang >= 14 或 MSVC >= 19.30 之一");
	const cmake = tools.find((tool) => tool.name === "CMake");
	const cmakeReady = Boolean(cmake?.available && cmake.meetsMinimum);
	if (requirement.requiresCmake && !cmakeReady) issues.push(`CMake >= ${formatVersion(MINIMUMS.cmake)}`);
	return {
		profile,
		ok: issues.length === 0,
		issues,
		compilerReady,
		cmakeReady
	};
}
async function probeTool(name, command, args, minimum, options = {}) {
	const result = await (options.runner ?? runProcess)(command, args, {
		env: options.env,
		cwd: options.cwd,
		timeMs: options.timeMs ?? 5e3,
		outputKb: 256
	});
	const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`.trim();
	const version = parseVersion(output, options.pattern);
	const available = !result.spawnError && (result.code === 0 || Boolean(options.allowNonzero));
	return {
		name,
		command,
		available,
		version: formatVersion(version),
		minimum: formatVersion(minimum),
		meetsMinimum: available && (options.exactVersion === void 0 ? compareVersion(version, minimum) : formatVersion(version) === options.exactVersion),
		summary: output.split(/\r?\n/).find((line) => line !== "")?.trim(),
		error: result.spawnError?.code ?? result.spawnError?.message
	};
}
async function inspectHost({ platform = process.platform, architecture = process.arch, env = process.env, runner = runProcess, nodeCommand = process.execPath } = {}) {
	let msvcEnvironment;
	let msvcError;
	let msvcFallbackPath;
	if (platform === "win32") try {
		msvcEnvironment = await createMsvcEnvironment({
			platform,
			env,
			runner
		});
	} catch (error) {
		msvcError = error;
		msvcFallbackPath = (await findVisualStudioInstallation({
			platform,
			env,
			runner
		}).catch(() => void 0))?.installationPath;
	}
	const tools = await Promise.all([
		probeTool("Git", "git", ["--version"], [
			0,
			0,
			0
		], {
			env,
			runner
		}),
		probeTool("Node.js", nodeCommand, ["--version"], MINIMUMS.node, {
			env,
			runner
		}),
		probeTool("pnpm", "pnpm", ["--version"], parseVersion(PNPM_VERSION), {
			env,
			runner,
			exactVersion: PNPM_VERSION
		}),
		probeTool("GCC", "g++", ["--version"], MINIMUMS.gcc, {
			env,
			runner
		}),
		probeTool("Clang", "clang++", ["--version"], MINIMUMS.clang, {
			env,
			runner
		}),
		probeTool("MSVC", "cl", [], MINIMUMS.msvc, {
			env: msvcEnvironment?.env,
			runner,
			pattern: /Version\s+(\d+)\.(\d+)(?:\.(\d+))?/i,
			allowNonzero: true
		}),
		probeTool("CMake", "cmake", ["--version"], MINIMUMS.cmake, {
			env,
			runner
		}),
		probeTool("GNU Make", "make", ["--version"], MINIMUMS.make, {
			env,
			runner
		})
	]);
	const node = tools.find((tool) => tool.name === "Node.js");
	const pnpm = tools.find((tool) => tool.name === "pnpm");
	const cmake = tools.find((tool) => tool.name === "CMake");
	return {
		platform,
		architecture,
		tools,
		compilerReady: tools.some((tool) => [
			"GCC",
			"Clang",
			"MSVC"
		].includes(tool.name) && tool.meetsMinimum),
		cmakeReady: Boolean(cmake?.meetsMinimum),
		runtimeReady: Boolean(node?.meetsMinimum && pnpm?.meetsMinimum),
		msvc: {
			initialized: Boolean(msvcEnvironment),
			installationPath: msvcEnvironment?.installationPath ?? msvcFallbackPath,
			developerCommand: msvcEnvironment?.developerCommand,
			environment: msvcEnvironment?.env,
			error: msvcError?.message,
			fallbackDetected: Boolean(msvcFallbackPath)
		}
	};
}
//#endregion
//#region src/commands.ts
function commandText(command, args = []) {
	return [command, ...args].map((part) => {
		const value = String(part);
		return /[\s"']/u.test(value) ? JSON.stringify(value) : value;
	}).join(" ");
}
//#endregion
//#region src/setup/report.ts
const SETUP_EXIT = {
	OK: 0,
	UNSUPPORTED: 10,
	INSTALLER: 11,
	USER_ACTION: 12,
	REPOSITORY: 13,
	ENVIRONMENT: 14,
	SMOKE: 15,
	ARGUMENT: 2
};
const SETUP_STAGES = [
	"preflight",
	"toolchain",
	"repository",
	"dependencies",
	"ide",
	"smoke"
];
var SetupError = class extends Error {
	code;
	details;
	exitCode;
	constructor(code, message, details, exitCode) {
		super(message);
		this.name = "SetupError";
		this.code = code;
		this.details = details;
		this.exitCode = exitCode ?? exitCodeFor(code);
	}
};
function exitCodeFor(code) {
	return {
		SETUP_UNSUPPORTED: SETUP_EXIT.UNSUPPORTED,
		INSTALLER_FAILED: SETUP_EXIT.INSTALLER,
		NEEDS_USER_ACTION: SETUP_EXIT.USER_ACTION,
		REPOSITORY_DIRTY: SETUP_EXIT.REPOSITORY,
		REPOSITORY_INVALID: SETUP_EXIT.REPOSITORY,
		REPOSITORY_MISSING: SETUP_EXIT.REPOSITORY,
		REPOSITORY_UPDATE_FAILED: SETUP_EXIT.REPOSITORY,
		ENVIRONMENT_NOT_READY: SETUP_EXIT.ENVIRONMENT,
		SMOKE_FAILED: SETUP_EXIT.SMOKE,
		ARGUMENT_INVALID: SETUP_EXIT.ARGUMENT
	}[code] ?? SETUP_EXIT.INSTALLER;
}
function setupError(code, message, details) {
	return new SetupError(code, message, details);
}
function serializeHost(host) {
	if (!host) return void 0;
	return {
		platform: host.platform,
		architecture: host.architecture,
		compilerReady: host.compilerReady,
		cmakeReady: host.cmakeReady,
		runtimeReady: host.runtimeReady,
		tools: host.tools,
		msvc: {
			initialized: host.msvc?.initialized,
			installationPath: host.msvc?.installationPath,
			developerCommand: host.msvc?.developerCommand,
			error: host.msvc?.error
		}
	};
}
function summarizeReport(report) {
	const lines = [
		"",
		`DSA Mastery 环境配置：${report.ok ? "成功" : "未完成"}`,
		`Profile：${report.profile} · 平台：${report.platform}/${report.architecture}`
	];
	if (report.selectionLabels !== void 0 && report.selectionLabels.length > 0) lines.push(`已选择：${report.selectionLabels.join("、")}`);
	for (const stage of report.stages ?? []) lines.push(`${stage.status === "success" ? "✓" : stage.status === "warning" ? "⚠" : stage.status === "skipped" ? "–" : stage.status === "failed" ? "✗" : "·"} ${stage.id}：${stage.message ?? ""}`);
	if (report.repository !== void 0) lines.push(`仓库：${report.repository.path}`);
	if (report.logPath !== void 0) lines.push(`日志：${report.logPath}`);
	if (report.error?.nextAction !== void 0) lines.push(`下一步：${report.error.nextAction}`);
	return lines.join("\n");
}
async function writeFailureLog(context, report) {
	if (context.options.checkOnly) return void 0;
	const home = context.env.HOME ?? context.env.USERPROFILE ?? os.homedir();
	const directory = context.platform === "darwin" ? path.join(home, "Library", "Logs", "DSA-Mastery", "setup") : context.platform === "win32" ? path.join(context.env.LOCALAPPDATA ?? path.join(home, "AppData", "Local"), "DSA-Mastery", "setup") : path.join(home, ".local", "state", "DSA-Mastery", "setup");
	await mkdir(directory, { recursive: true });
	const file = path.join(directory, `setup-${(/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-")}.log`);
	const lines = [
		`DSA Mastery setup ${(/* @__PURE__ */ new Date()).toISOString()}`,
		`profile=${context.profile}`,
		`platform=${context.platform}/${context.architecture}`,
		`repo=${context.repoDir}`,
		`error=${report.error?.code ?? "unknown"}: ${report.error?.message ?? "unknown"}`,
		""
	];
	for (const command of context.commands) {
		lines.push(`$ ${commandText(command.command, command.args)}`);
		if (command.stdout) lines.push(command.stdout.trimEnd());
		if (command.stderr) lines.push(command.stderr.trimEnd());
		lines.push("");
	}
	await writeFile(file, `${lines.join("\n")}\n`, "utf8");
	return file;
}
function normalizeError(rawError) {
	if (rawError instanceof SetupError) return rawError;
	const error = rawError;
	return setupError(error?.code === "ARGUMENT_INVALID" ? "ARGUMENT_INVALID" : "INSTALLER_FAILED", error?.message ?? String(rawError), { cause: error?.stack });
}
//#endregion
//#region src/setup/context.ts
const HOMEBREW_INSTALLER = "https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh";
async function pathExists(target) {
	try {
		await access(target);
		return true;
	} catch {
		return false;
	}
}
function resultOutput(result) {
	return `${result?.stdout ?? ""}\n${result?.stderr ?? ""}`.trim();
}
function resultFailed(result) {
	return Boolean(result?.spawnError) || result?.code !== 0 || Boolean(result?.timedOut) || Boolean(result?.outputExceeded);
}
function firstOutputLine(result) {
	return resultOutput(result).split(/\r?\n/).find(Boolean)?.trim();
}
function prependPath(currentPath, additions, delimiter) {
	const values = [...additions, ...String(currentPath ?? "").split(delimiter)].filter(Boolean);
	return [...new Set(values)].join(delimiter);
}
function hostTool(host, name) {
	return host?.tools?.find((tool) => tool.name === name);
}
function hasTool(host, name) {
	return Boolean(hostTool(host, name)?.meetsMinimum);
}
async function runWithRunner(context, command, args = [], options = {}) {
	try {
		return await context.runner(command, args, {
			cwd: options.cwd ?? context.commandCwd ?? context.repoDir,
			env: options.env ?? context.env,
			timeMs: options.timeoutMs ?? options.timeMs ?? 3e4,
			outputKb: options.outputLimitKb ?? options.outputKb ?? 4096,
			inherit: options.inherit ?? false
		});
	} catch (error) {
		return {
			code: null,
			spawnError: error,
			stdout: "",
			stderr: ""
		};
	}
}
async function commandAvailable(context, command, args = ["--version"]) {
	const result = await runWithRunner(context, command, args, {
		timeMs: 5e3,
		outputKb: 256
	});
	return !resultFailed(result) ? result : void 0;
}
async function refreshPlatformEnvironment(context) {
	if (context.platform === "darwin" && context.packageManager?.kind === "brew") {
		const prefix = firstOutputLine(await runWithRunner(context, context.packageManager.command, ["--prefix"], {
			timeMs: 5e3,
			outputKb: 256
		}));
		if (prefix !== void 0 && prefix !== "") context.env.PATH = prependPath(context.env.PATH, [path.join(prefix, "bin"), path.join(prefix, "sbin")], ":");
	}
	if (context.platform === "win32") {
		const pathResult = await runWithRunner(context, "powershell.exe", [
			"-NoProfile",
			"-NonInteractive",
			"-Command",
			"[Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [Environment]::GetEnvironmentVariable('Path','User')"
		], {
			timeMs: 1e4,
			outputKb: 4096
		});
		if (!resultFailed(pathResult) && pathResult.stdout?.trim()) context.env.PATH = pathResult.stdout.trim();
	}
	return context.env;
}
async function resolveExecutable(context, command) {
	if (path.isAbsolute(command)) return command;
	return firstOutputLine(await runWithRunner(context, context.platform === "win32" ? "where.exe" : "which", [command], {
		timeMs: 5e3,
		outputKb: 256
	})) ?? command;
}
function recordCommand(context, command, args, result) {
	context.commands.push({
		command,
		args,
		code: result?.code ?? null,
		stdout: result?.stdout ?? "",
		stderr: result?.stderr ?? "",
		timedOut: Boolean(result?.timedOut),
		outputExceeded: Boolean(result?.outputExceeded)
	});
}
async function runExternal(context, command, args, options = {}) {
	const result = await runWithRunner(context, command, args, options);
	recordCommand(context, command, args, result);
	if (resultFailed(result)) throw setupError(options.errorCode ?? "INSTALLER_FAILED", options.errorMessage ?? `命令执行失败：${commandText(command, args)}`, {
		command,
		args,
		result
	});
	return result;
}
async function inspectContextHost(context) {
	context.host = await inspectHost({
		platform: context.platform,
		architecture: context.architecture,
		env: context.env,
		nodeCommand: context.nodeCommand,
		runner: context.runner
	});
	return context.host;
}
//#endregion
//#region src/setup/toolchain.ts
function wingetInstall(id, extra = []) {
	return {
		command: "winget",
		args: [
			"install",
			"--id",
			id,
			"--exact",
			"--source",
			"winget",
			"--accept-source-agreements",
			"--accept-package-agreements",
			...extra
		]
	};
}
const VS_BUILDTOOLS_INSTALLER_URL = "https://aka.ms/vs/17/release/vs_buildtools.exe";
const VC_TOOLS_COMPONENT = "Microsoft.VisualStudio.Component.VC.Tools.x86.x64";
async function findVisualStudioViaVsWhere(context) {
	const candidates = [];
	if (context.env["ProgramFiles(x86)"] !== void 0) candidates.push(path.join(context.env["ProgramFiles(x86)"], "Microsoft Visual Studio", "Installer", "vswhere.exe"));
	candidates.push("vswhere.exe");
	for (const command of [...new Set(candidates)]) {
		const result = await runWithRunner(context, command, [
			"-latest",
			"-products",
			"*",
			"-requires",
			VC_TOOLS_COMPONENT,
			"-property",
			"installationPath"
		], {
			timeMs: 1e4,
			outputKb: 256
		});
		if (!resultFailed(result)) {
			const installationPath = resultOutput(result).split(/\r?\n/).find(Boolean)?.trim();
			if (installationPath !== void 0 && installationPath !== "") return {
				installationPath,
				vswhere: command
			};
		}
	}
}
async function downloadFileWithPowershell(context, url, destination) {
	const result = await runWithRunner(context, "powershell.exe", [
		"-NoProfile",
		"-NonInteractive",
		"-Command",
		`[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri '${url}' -OutFile '${destination}' -UseBasicParsing`
	], {
		timeMs: 6e5,
		outputKb: 4096
	});
	if (resultFailed(result)) throw setupError("INSTALLER_FAILED", `下载失败：${url}`, {
		command: "powershell.exe",
		result
	});
	return destination;
}
async function installVisualStudioBuildTools(context) {
	const existing = await findVisualStudioViaVsWhere(context);
	if (existing) {
		context.ui.update("toolchain", "running", `检测到已安装 Visual Studio C++ 工具：${existing.installationPath}`);
		return {
			skipped: true,
			reason: "already-installed",
			installationPath: existing.installationPath
		};
	}
	if (context.packageManager?.kind === "winget") {
		const install = wingetInstall("Microsoft.VisualStudio.2022.BuildTools", [
			"--wait",
			"--override",
			"--passive --norestart --add Microsoft.VisualStudio.Workload.VCTools --includeRecommended"
		]);
		try {
			context.ui.update("toolchain", "running", "通过 winget 安装 Visual Studio C++ Build Tools");
			await runExternal(context, install.command, install.args, {
				inherit: true,
				timeMs: 27e5,
				errorMessage: "winget 安装 Visual Studio C++ Build Tools 失败"
			});
			return { method: "winget" };
		} catch {
			context.ui.update("toolchain", "running", "winget 安装未成功，回退到官方安装程序");
		}
	}
	const tempDir = await mkdtemp(path.join(os.tmpdir(), "dsa-mastery-vs-"));
	const installer = path.join(tempDir, "vs_buildtools.exe");
	try {
		context.ui.update("toolchain", "running", "下载 Visual Studio Build Tools 官方安装程序");
		await downloadFileWithPowershell(context, VS_BUILDTOOLS_INSTALLER_URL, installer);
		context.ui.update("toolchain", "running", "运行官方安装程序（可能需要 10-30 分钟）");
		await runExternal(context, installer, [
			"--wait",
			"--passive",
			"--norestart",
			"--add",
			"Microsoft.VisualStudio.Workload.VCTools",
			"--includeRecommended"
		], {
			inherit: true,
			timeMs: 54e5,
			errorMessage: "官方安装程序安装 Visual Studio C++ Build Tools 失败"
		});
		return { method: "official-installer" };
	} finally {
		await rm(tempDir, {
			recursive: true,
			force: true
		}).catch(() => {});
	}
}
function planToolchainInstall(profile, host = {}) {
	const requirement = profileRequirements(profile);
	const plan = [];
	const platform = host.platform ?? process.platform;
	const packageManager = host.packageManager?.command ?? (platform === "win32" ? "winget" : "brew");
	const missing = (name) => !hasTool(host, name);
	const add = (id, description, install, extra = {}) => {
		plan.push({
			id,
			description,
			...install,
			...extra
		});
	};
	if (platform === "darwin") {
		if (missing("Git")) add("git", "安装 Git", {
			command: packageManager,
			args: ["install", "git"]
		});
		if (missing("Node.js")) add("node", "安装 Node.js", {
			command: packageManager,
			args: ["install", "node"]
		});
		if (requirement.requiresCompiler && !hasTool(host, "Clang") && !hasTool(host, "GCC")) add("compiler", "安装 Xcode Command Line Tools", {
			command: "xcode-select",
			args: ["--install"]
		}, { requiresUserAction: true });
		if (requirement.requiresCmake && missing("CMake")) add("cmake", "安装 CMake", {
			command: packageManager,
			args: ["install", "cmake"]
		});
		return plan;
	}
	if (platform === "win32") {
		if (missing("Git")) add("git", "安装 Git", wingetInstall("Git.Git"));
		if (missing("Node.js")) add("node", "安装 Node.js LTS", wingetInstall("OpenJS.NodeJS.LTS"));
		const hasAnyCompiler = hasTool(host, "MSVC") || hasTool(host, "GCC") || hasTool(host, "Clang");
		if (requirement.requiresCompiler && !hasAnyCompiler) add("msvc", "安装 Visual Studio C++ Build Tools", wingetInstall("Microsoft.VisualStudio.2022.BuildTools", [
			"--wait",
			"--override",
			"--passive --norestart --add Microsoft.VisualStudio.Workload.VCTools --includeRecommended"
		]));
		if (requirement.requiresCmake && missing("CMake")) add("cmake", "安装 CMake", wingetInstall("Kitware.CMake"));
		return plan;
	}
	throw setupError("SETUP_UNSUPPORTED", `暂不支持自动配置平台：${platform}`);
}
async function detectPackageManager(context) {
	if (context.platform === "darwin") {
		for (const command of [
			"brew",
			"/opt/homebrew/bin/brew",
			"/usr/local/bin/brew"
		]) if (await commandAvailable(context, command)) return {
			kind: "brew",
			command
		};
		return;
	}
	if (context.platform === "win32") return await commandAvailable(context, "winget") ? {
		kind: "winget",
		command: "winget"
	} : void 0;
}
async function ensureHomebrew(context) {
	context.packageManager = await detectPackageManager(context);
	if (context.packageManager) return context.packageManager;
	if (!await commandAvailable(context, "curl", ["--version"])) throw setupError("SETUP_UNSUPPORTED", "未找到 Homebrew 或 curl，无法自动安装 macOS 工具；请按 macOS 手工指南安装 Homebrew。", { fallback: "docs/MACOS_STUDENT_SETUP_GUIDE.md" });
	const temporaryDirectory = await mkdtemp(path.join(os.tmpdir(), "dsa-mastery-brew-"));
	const installer = path.join(temporaryDirectory, "install-homebrew.sh");
	try {
		context.ui.update("toolchain", "running", "下载 Homebrew 官方安装脚本");
		await runExternal(context, "curl", [
			"-fsSL",
			HOMEBREW_INSTALLER,
			"-o",
			installer
		], { inherit: true });
		await runExternal(context, "/bin/bash", [installer], { inherit: true });
	} finally {
		await rm(temporaryDirectory, {
			recursive: true,
			force: true
		});
	}
	await refreshPlatformEnvironment(context);
	context.packageManager = await detectPackageManager(context);
	if (!context.packageManager) throw setupError("INSTALLER_FAILED", "Homebrew 安装命令已结束，但当前进程仍找不到 brew；请打开新终端后重试。", { restartRequired: true });
	return context.packageManager;
}
async function ensurePnpm(context) {
	const current = await runWithRunner(context, "pnpm", ["--version"], {
		timeMs: 5e3,
		outputKb: 256
	});
	if (!resultFailed(current) && firstOutputLine(current) === PNPM_VERSION) {
		context.pnpmCommand = "pnpm";
		return context.pnpmCommand;
	}
	if (await commandAvailable(context, "corepack", ["--version"])) {
		recordCommand(context, "corepack", ["enable", "pnpm"], await runWithRunner(context, "corepack", ["enable", "pnpm"], {
			timeMs: 3e4,
			outputKb: 512
		}));
		const installed = await runWithRunner(context, "corepack", [
			"install",
			"--global",
			`pnpm@${PNPM_VERSION}`
		], {
			timeMs: 6e4,
			outputKb: 1024
		});
		recordCommand(context, "corepack", [
			"install",
			"--global",
			`pnpm@${PNPM_VERSION}`
		], installed);
		const afterCorepack = await runWithRunner(context, "pnpm", ["--version"], {
			timeMs: 5e3,
			outputKb: 256
		});
		if (!resultFailed(afterCorepack) && firstOutputLine(afterCorepack) === PNPM_VERSION) {
			context.pnpmCommand = "pnpm";
			return context.pnpmCommand;
		}
	}
	if (!await commandAvailable(context, "npm", ["--version"])) throw setupError("INSTALLER_FAILED", "未找到 npm，无法准备固定版本 pnpm。请安装满足要求的 Node.js 后重试。", { required: `pnpm ${PNPM_VERSION}` });
	const globalInstall = await runWithRunner(context, "npm", [
		"install",
		"--global",
		`pnpm@${PNPM_VERSION}`
	], {
		timeMs: 12e4,
		outputKb: 2048
	});
	recordCommand(context, "npm", [
		"install",
		"--global",
		`pnpm@${PNPM_VERSION}`
	], globalInstall);
	const afterGlobal = await runWithRunner(context, "pnpm", ["--version"], {
		timeMs: 5e3,
		outputKb: 256
	});
	if (!resultFailed(afterGlobal) && firstOutputLine(afterGlobal) === PNPM_VERSION) {
		context.pnpmCommand = "pnpm";
		return context.pnpmCommand;
	}
	const base = context.platform === "win32" ? path.join(context.env.LOCALAPPDATA ?? context.env.USERPROFILE ?? os.homedir(), "DSA-Mastery", "tools") : path.join(context.env.XDG_DATA_HOME ?? path.join(context.env.HOME ?? os.homedir(), ".local", "share"), "DSA-Mastery", "tools");
	await mkdir(base, { recursive: true });
	const localInstall = await runWithRunner(context, "npm", [
		"install",
		"--global",
		"--prefix",
		base,
		`pnpm@${PNPM_VERSION}`
	], {
		timeMs: 12e4,
		outputKb: 2048
	});
	recordCommand(context, "npm", [
		"install",
		"--global",
		"--prefix",
		base,
		`pnpm@${PNPM_VERSION}`
	], localInstall);
	const bin = context.platform === "win32" ? base : path.join(base, "bin");
	context.env.PATH = prependPath(context.env.PATH, [bin], context.platform === "win32" ? ";" : ":");
	const candidates = context.platform === "win32" ? [path.join(base, "pnpm.cmd"), path.join(base, "node_modules", ".bin", "pnpm.cmd")] : [path.join(bin, "pnpm")];
	for (const candidate of candidates) {
		const afterLocal = await runWithRunner(context, candidate, ["--version"], {
			timeMs: 5e3,
			outputKb: 256
		});
		if (!resultFailed(afterLocal) && firstOutputLine(afterLocal) === PNPM_VERSION) {
			context.pnpmCommand = candidate;
			return context.pnpmCommand;
		}
	}
	throw setupError("INSTALLER_FAILED", `无法准备 pnpm ${PNPM_VERSION}；请按安装指南手工安装并重新运行。`, { required: `pnpm ${PNPM_VERSION}` });
}
async function installSystemTools(context) {
	const plan = planToolchainInstall(context.profile, {
		...context.host,
		packageManager: context.packageManager
	});
	if (!plan.length) return plan;
	if (context.platform === "darwin") await ensureHomebrew(context);
	if (context.platform === "win32" && !context.packageManager) {
		context.packageManager = await detectPackageManager(context);
		if (!context.packageManager) throw setupError("SETUP_UNSUPPORTED", "未找到 winget，无法自动安装 Windows 工具；请按 Windows 手工指南安装 Git、Node、Build Tools 和 CMake。", { fallback: "docs/WINDOWS_STUDENT_SETUP_GUIDE.md" });
	}
	for (const action of plan) {
		if (action.requiresUserAction) {
			await runExternal(context, action.command, action.args, {
				inherit: true,
				errorCode: "NEEDS_USER_ACTION"
			});
			throw setupError("NEEDS_USER_ACTION", "Xcode Command Line Tools 安装窗口已打开；请完成安装后重新运行此脚本。", { restartRequired: true });
		}
		if (action.id === "msvc" && context.platform === "win32") {
			await installVisualStudioBuildTools(context);
			context.ui.update("toolchain", "running", "Visual Studio 安装完成，准备捕获开发环境");
			continue;
		}
		const command = action.command === "brew" ? context.packageManager.command : action.command;
		await runExternal(context, command, action.args, {
			inherit: true,
			timeMs: 12e5,
			errorMessage: `${action.description}失败：${commandText(command, action.args)}`
		});
	}
	await refreshPlatformEnvironment(context);
	context.nodeCommand = await resolveExecutable(context, "node");
	return plan;
}
async function ensureToolchain(context) {
	await installSystemTools(context);
	await ensurePnpm(context);
	await refreshPlatformEnvironment(context);
	await inspectContextHost(context);
	const evaluation = evaluateProfile(context.profile, context.host.tools);
	context.evaluation = evaluation;
	if (!evaluation.ok) throw setupError("ENVIRONMENT_NOT_READY", `环境检查未通过：${evaluation.issues.join("；")}。请根据提示补齐工具后重试。`, {
		evaluation,
		host: serializeHost(context.host)
	});
	return evaluation;
}
//#endregion
//#region src/setup/ide.ts
function planIdeExtensions(options = {}, profile = "basic") {
	if (options.selection !== void 0) return [...options.installCppExtension === true ? ["ms-vscode.cpptools"] : [], ...options.installCmakeExtension === true ? ["ms-vscode.cmake-tools"] : []];
	return [...profile === "runtime" ? [] : ["ms-vscode.cpptools"], ...profile === "full" ? ["ms-vscode.cmake-tools"] : []];
}
async function detectVSCode(context) {
	if (await commandAvailable(context, "code", ["--version"])) return {
		found: true,
		inPath: true
	};
	if (context.platform === "darwin") for (const application of ["/Applications/Visual Studio Code.app", path.join(os.homedir(), "Applications/Visual Studio Code.app")]) {
		const binDir = path.join(application, "Contents/Resources/app/bin");
		if (!await pathExists(path.join(binDir, "code"))) continue;
		context.env.PATH = prependPath(context.env.PATH, [binDir], ":");
		if (await commandAvailable(context, "code", ["--version"])) return {
			found: true,
			inPath: false,
			path: binDir
		};
	}
	if (context.platform !== "win32") return { found: false };
	try {
		const { execFileSync } = await import("node:child_process");
		const candidates = execFileSync("where.exe", ["code"], {
			encoding: "utf8",
			timeout: 5e3,
			stdio: [
				"ignore",
				"pipe",
				"ignore"
			],
			env: process.env
		}).split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
		const codeCmd = candidates.find((p) => /\.cmd$/i.test(p)) ?? candidates.find((p) => /\.exe$/i.test(p)) ?? candidates[0];
		if (codeCmd !== void 0 && await pathExists(codeCmd)) {
			const binDir = path.dirname(codeCmd);
			context.env.PATH = prependPath(context.env.PATH, [binDir], ";");
			if (await commandAvailable(context, "code", ["--version"])) return {
				found: true,
				inPath: false,
				path: binDir
			};
		}
	} catch {}
	const standardDirs = [];
	if (context.env.LOCALAPPDATA !== void 0) standardDirs.push(path.join(context.env.LOCALAPPDATA, "Programs", "Microsoft VS Code", "bin"));
	if (context.env.ProgramFiles !== void 0) standardDirs.push(path.join(context.env.ProgramFiles, "Microsoft VS Code", "bin"));
	if (context.env["ProgramFiles(x86)"] !== void 0) standardDirs.push(path.join(context.env["ProgramFiles(x86)"], "Microsoft VS Code", "bin"));
	for (const binDir of standardDirs) if (await pathExists(path.join(binDir, "code.cmd"))) {
		context.env.PATH = prependPath(context.env.PATH, [binDir], ";");
		if (await commandAvailable(context, "code", ["--version"])) return {
			found: true,
			inPath: false,
			path: binDir
		};
	}
	return { found: false };
}
async function installIde(context) {
	if (context.options.skipVscode || !context.options.installVscode) return {
		status: "skipped",
		message: "未选择 VS Code"
	};
	const detected = await detectVSCode(context);
	if (detected.found && !detected.inPath) context.ui.update("ide", "running", `检测到已安装 VS Code：${detected.path}`);
	let code = await commandAvailable(context, "code", ["--version"]);
	if (!code) {
		if (context.platform === "darwin") {
			await ensureHomebrew(context);
			await runExternal(context, context.packageManager.command, [
				"install",
				"--cask",
				"visual-studio-code"
			], {
				stage: "ide",
				inherit: true,
				timeMs: 12e5
			});
		} else if (context.platform === "win32") {
			if (!context.packageManager) context.packageManager = await detectPackageManager(context);
			if (!context.packageManager) return {
				status: "warning",
				message: "未找到 winget，跳过 VS Code"
			};
			const install = wingetInstall("Microsoft.VisualStudioCode");
			await runExternal(context, install.command, install.args, {
				stage: "ide",
				inherit: true,
				timeMs: 12e5
			});
		}
		await refreshPlatformEnvironment(context);
		code = await commandAvailable(context, "code", ["--version"]);
	}
	if (!code) return {
		status: "warning",
		message: "VS Code 安装后当前终端仍找不到 code，请打开新终端"
	};
	const extensions = planIdeExtensions(context.options, context.profile);
	const failures = [];
	for (const extension of extensions) {
		const result = await runWithRunner(context, "code", [
			"--install-extension",
			extension,
			"--force"
		], {
			timeMs: 12e4,
			outputKb: 2048
		});
		recordCommand(context, "code", [
			"--install-extension",
			extension,
			"--force"
		], result);
		if (resultFailed(result)) failures.push(extension);
	}
	return failures.length ? {
		status: "warning",
		message: `扩展安装失败：${failures.join(", ")}`
	} : {
		status: "success",
		message: extensions.length ? "VS Code 与所选扩展已准备" : "VS Code 已准备"
	};
}
//#endregion
//#region src/ui/terminal.ts
const ANSI_STYLE = {
	reset: "\x1B[0m",
	bold: "\x1B[1m",
	dim: "\x1B[2m",
	cyan: "\x1B[36m",
	green: "\x1B[32m",
	yellow: "\x1B[33m",
	red: "\x1B[31m",
	magenta: "\x1B[35m",
	brightRed: "\x1B[91m",
	brightYellow: "\x1B[93m",
	brightBlue: "\x1B[94m"
};
function clampWidth(width) {
	return Math.max(28, Number.isFinite(Number(width)) ? Number(width) : 80);
}
function supportsColor(output) {
	return Boolean(output?.isTTY) && (process.env.NO_COLOR ?? "") === "" && process.env.TERM !== "dumb";
}
const COMBINING_CHARACTER = /^\p{Mark}$/u;
function isZeroWidthCodePoint(codePoint, character) {
	return codePoint === 8205 || codePoint >= 65024 && codePoint <= 65039 || codePoint >= 917760 && codePoint <= 917999 || COMBINING_CHARACTER.test(character);
}
function isWideCodePoint(codePoint) {
	return codePoint >= 4352 && codePoint <= 4447 || codePoint === 9001 || codePoint === 9002 || codePoint >= 11904 && codePoint <= 12350 || codePoint >= 12352 && codePoint <= 42191 || codePoint >= 44032 && codePoint <= 55203 || codePoint >= 63744 && codePoint <= 64255 || codePoint >= 65040 && codePoint <= 65049 || codePoint >= 65072 && codePoint <= 65135 || codePoint >= 65280 && codePoint <= 65376 || codePoint >= 65504 && codePoint <= 65510 || codePoint >= 127462 && codePoint <= 127487 || codePoint >= 127744 && codePoint <= 129791 || codePoint >= 131072 && codePoint <= 262141;
}
function displayWidth(value) {
	let width = 0;
	for (const character of cleanTerminalText(value)) {
		const codePoint = character.codePointAt(0);
		if (codePoint === void 0 || codePoint < 32 || codePoint >= 127 && codePoint < 160) continue;
		if (isZeroWidthCodePoint(codePoint, character)) continue;
		width += isWideCodePoint(codePoint) ? 2 : 1;
	}
	return width;
}
function paint(value, styles, color) {
	if (!color) return value;
	const prefix = (Array.isArray(styles) ? styles : styles === void 0 ? [] : [styles]).map((name) => ANSI_STYLE[name]).join("");
	return prefix ? `${prefix}${value}${ANSI_STYLE.reset}` : value;
}
function frameLine(value, width, styles, color = false) {
	const content = truncate(value, width);
	return `│ ${paint(`${content}${" ".repeat(Math.max(0, width - displayWidth(content)))}`, styles, color)} │`;
}
function frameSegments(segments, width, color) {
	const visible = segments.map((segment) => segment.value).join("");
	if (displayWidth(visible) > width) return frameLine(visible, width);
	return `│ ${segments.map((segment) => paint(segment.value, segment.styles, color)).join("").concat(" ".repeat(Math.max(0, width - displayWidth(visible))))} │`;
}
function truncate(value, width) {
	const text = String(value ?? "");
	if (displayWidth(text) <= width) return text;
	if (width <= 1) return "…";
	const targetWidth = width - 1;
	let result = "";
	let usedWidth = 0;
	for (const character of text) {
		const characterWidth = displayWidth(character);
		if (usedWidth + characterWidth > targetWidth) break;
		result += character;
		usedWidth += characterWidth;
	}
	return `${result}…`;
}
//#endregion
//#region src/ui/banner.ts
const PIXEL_GLYPHS = {
	D: [
		"███  ",
		"█  █ ",
		"█  █ ",
		"█  █ ",
		"███  "
	],
	S: [
		" ███ ",
		"█    ",
		" ███ ",
		"    █",
		"███  "
	],
	A: [
		" ███ ",
		"█   █",
		"█████",
		"█   █",
		"█   █"
	],
	M: [
		"█   █",
		"██ ██",
		"█ █ █",
		"█   █",
		"█   █"
	],
	T: [
		"█████",
		"  █  ",
		"  █  ",
		"  █  ",
		"  █  "
	],
	E: [
		"████ ",
		"█    ",
		"████ ",
		"█    ",
		"████ "
	],
	R: [
		"████ ",
		"█   █",
		"████ ",
		"█ █  ",
		"█  ██"
	],
	Y: [
		"█   █",
		" █ █ ",
		"  █  ",
		"  █  ",
		"  █  "
	]
};
const PIXEL_WORDS = [{
	text: "DSA",
	styles: [
		"brightRed",
		"brightYellow",
		"brightBlue"
	]
}, {
	text: "MASTERY",
	styles: [
		"dim",
		"dim",
		"dim",
		"dim",
		"dim",
		"dim",
		"dim"
	]
}];
function pixelRowSegments(row) {
	const segments = [];
	for (const [wordIndex, word] of PIXEL_WORDS.entries()) {
		if (wordIndex > 0) segments.push({ value: "   " });
		for (const [letterIndex, letter] of [...word.text].entries()) {
			if (letterIndex > 0) segments.push({ value: " " });
			segments.push({
				value: PIXEL_GLYPHS[letter][row],
				styles: word.styles[letterIndex]
			});
		}
	}
	return segments;
}
function renderBanner({ width = 88, subtitle = "本地实验环境安装向导", color = false } = {}) {
	const safeWidth = clampWidth(width);
	return [
		`╭${"─".repeat(safeWidth - 2)}╮`,
		frameLine(`◆ DSA MASTERY  ·  ${subtitle}`, safeWidth - 4, ["bold", "cyan"], color),
		`╰${"─".repeat(safeWidth - 2)}╯`
	].join("\n");
}
function renderPixelBanner({ width = 88, color = false } = {}) {
	const safeWidth = clampWidth(width);
	const innerWidth = safeWidth - 4;
	const artWidth = displayWidth(pixelRowSegments(0).map((segment) => segment.value).join(""));
	if (innerWidth < artWidth) return [
		`╭${"─".repeat(safeWidth - 2)}╮`,
		frameSegments([
			{ value: "◆ " },
			{
				value: "D",
				styles: "brightRed"
			},
			{
				value: "S",
				styles: "brightYellow"
			},
			{
				value: "A",
				styles: "brightBlue"
			},
			{
				value: " MASTERY",
				styles: "dim"
			}
		], innerWidth, color),
		`╰${"─".repeat(safeWidth - 2)}╯`
	].join("\n");
	const leftPadding = Math.floor((innerWidth - artWidth) / 2);
	const rightPadding = innerWidth - artWidth - leftPadding;
	const lines = [`╭${"─".repeat(safeWidth - 2)}╮`];
	for (let row = 0; row < 5; row += 1) lines.push(frameSegments([
		{ value: " ".repeat(leftPadding) },
		...pixelRowSegments(row),
		{ value: " ".repeat(rightPadding) }
	], innerWidth, color));
	lines.push(`╰${"─".repeat(safeWidth - 2)}╯`);
	return lines.join("\n");
}
//#endregion
//#region src/ui/choices.ts
const INSTALL_CHOICES = [
	{
		id: "runtime",
		label: "基础运行环境",
		description: "启动器和课程工具所需的 Git、Node.js、pnpm",
		detail: "必选。启动器需要它来下载仓库、安装依赖和运行课程工具。",
		profile: "runtime",
		group: "基础环境",
		defaultSelected: true,
		required: true
	},
	{
		id: "program",
		label: "Program Lab C++ 环境",
		description: "编译并运行基础 C++ 练习（推荐）",
		detail: "准备 Apple Clang、MSVC 或其他受支持的 C++ 编译器。",
		profile: "basic",
		group: "课程环境",
		defaultSelected: true
	},
	{
		id: "project",
		label: "Project Lab / CMake 环境",
		description: "运行需要 CMake 的综合项目",
		detail: "准备 CMake，并自动勾选 Program Lab。",
		profile: "full",
		group: "课程环境",
		defaultSelected: false,
		requires: ["program"]
	},
	{
		id: "vscode",
		label: "VS Code 编辑器",
		description: "用图形界面编写和运行代码",
		detail: "可选，不影响命令行 Lab 使用。",
		group: "编辑器与扩展",
		defaultSelected: false,
		optional: true
	},
	{
		id: "cpp-extension",
		label: "C/C++ 代码扩展",
		description: "VS Code 的补全、跳转和调试支持",
		detail: "需要先安装 VS Code。",
		group: "编辑器与扩展",
		defaultSelected: false,
		optional: true,
		requires: ["vscode"]
	},
	{
		id: "cmake-extension",
		label: "CMake Tools 扩展",
		description: "在 VS Code 中管理 Project / CMake",
		detail: "需要先选择 Project / CMake 和 VS Code。",
		group: "编辑器与扩展",
		defaultSelected: false,
		optional: true,
		requires: ["project", "vscode"]
	}
];
const CHOICE_BY_ID = new Map(INSTALL_CHOICES.map((choice) => [choice.id, choice]));
const CHOICE_ARROW_KEYS = [
	["\x1B[A", "up"],
	["\x1B[B", "down"],
	["\x1B[C", "right"],
	["\x1B[D", "left"],
	["\x1BOA", "up"],
	["\x1BOB", "down"],
	["\x1BOC", "right"],
	["\x1BOD", "left"]
];
function createInstallSelection(overrides = {}) {
	const selected = new Set(INSTALL_CHOICES.filter((choice) => choice.defaultSelected).map((choice) => choice.id));
	for (const [id, value] of Object.entries(overrides)) {
		if (!CHOICE_BY_ID.has(id)) continue;
		if (value) selected.add(id);
		else selected.delete(id);
	}
	return normalizeInstallSelection(selected);
}
function normalizeInstallSelection(selection) {
	const selected = new Set(selection ?? []);
	selected.add("runtime");
	let changed = true;
	while (changed) {
		changed = false;
		for (const choice of INSTALL_CHOICES) {
			if (!selected.has(choice.id)) continue;
			for (const required of choice.requires ?? []) if (!selected.has(required)) {
				selected.add(required);
				changed = true;
			}
		}
	}
	return selected;
}
function removeChoiceAndDependents(selected, id) {
	selected.delete(id);
	for (const choice of INSTALL_CHOICES) if (choice.requires?.includes(id)) removeChoiceAndDependents(selected, choice.id);
}
function selectionToOptions(selection) {
	const normalized = normalizeInstallSelection(selection);
	const vscode = normalized.has("vscode");
	return {
		profile: normalized.has("project") ? "full" : normalized.has("program") ? "basic" : "runtime",
		installVscode: vscode,
		skipVscode: !vscode,
		installCppExtension: normalized.has("cpp-extension"),
		installCmakeExtension: normalized.has("cmake-extension"),
		selection: INSTALL_CHOICES.filter((choice) => normalized.has(choice.id)).map((choice) => choice.id)
	};
}
function choiceSelectionSummary(selection) {
	const normalized = normalizeInstallSelection(selection);
	return INSTALL_CHOICES.filter((choice) => normalized.has(choice.id)).map((choice) => choice.label);
}
function handleChoiceKey(key, cursor, selection) {
	const selected = normalizeInstallSelection(selection);
	const last = INSTALL_CHOICES.length - 1;
	if (key === "up" || key === "k") return {
		cursor: Math.max(0, cursor - 1),
		selection: selected,
		action: "move"
	};
	if (key === "down" || key === "j") return {
		cursor: Math.min(last, cursor + 1),
		selection: selected,
		action: "move"
	};
	if (key === "space") {
		const choice = INSTALL_CHOICES[cursor];
		if (choice === void 0) return {
			cursor,
			selection: selected,
			action: "noop"
		};
		if (choice.required) return {
			cursor,
			selection: selected,
			action: "locked"
		};
		if (selected.has(choice.id)) removeChoiceAndDependents(selected, choice.id);
		else {
			const normalized = normalizeInstallSelection(/* @__PURE__ */ new Set([...selected, choice.id]));
			selected.clear();
			for (const id of normalized) selected.add(id);
		}
		if (choice.id === "program" && !selected.has("program")) removeChoiceAndDependents(selected, "program");
		return {
			cursor,
			selection: selected,
			action: "toggle"
		};
	}
	if (key === "enter") return {
		cursor,
		selection: selected,
		action: "confirm"
	};
	if (key === "escape" || key === "q") return {
		cursor,
		selection: selected,
		action: "cancel"
	};
	return {
		cursor,
		selection: selected,
		action: "noop"
	};
}
function renderChoiceMenu({ title = "配置 DSA Mastery", subtitle = "用 ↑↓ 移动，空格勾选，Enter 开始", choices = INSTALL_CHOICES, selection = createInstallSelection(), cursor = 0, width = 88, color = false } = {}) {
	const safeWidth = clampWidth(width);
	const innerWidth = safeWidth - 4;
	const normalized = normalizeInstallSelection(selection);
	const lines = [
		...renderBanner({
			width: safeWidth,
			subtitle: "本地实验环境安装向导",
			color
		}).split("\n"),
		"",
		`╭${"─".repeat(safeWidth - 2)}╮`,
		frameLine(title, innerWidth, ["bold", "cyan"], color),
		frameLine(subtitle, innerWidth, "dim", color),
		`├${"─".repeat(safeWidth - 2)}┤`
	];
	let previousGroup;
	choices.forEach((choice, index) => {
		if (choice.group !== previousGroup) {
			if (previousGroup !== void 0) lines.push(frameLine("", innerWidth));
			lines.push(frameLine(`▌ ${choice.group}`, innerWidth, ["bold", "magenta"], color));
			previousGroup = choice.group;
		}
		const prefix = index === cursor ? "▶" : " ";
		const checkbox = normalized.has(choice.id) ? "☑" : "☐";
		const lock = choice.required ? " · 必选" : "";
		const choiceStyle = index === cursor ? ["bold", "cyan"] : choice.required ? "yellow" : normalized.has(choice.id) ? "green" : "dim";
		lines.push(frameLine(`${prefix} ${checkbox} ${choice.label}${lock}`, innerWidth, choiceStyle, color));
		lines.push(frameLine(`  ${choice.description}`, innerWidth, "dim", color));
	});
	const active = choices[cursor];
	if (active?.detail) {
		lines.push(frameLine("", innerWidth));
		lines.push(frameLine(`▸ 说明：${active.detail}`, innerWidth, "dim", color));
	}
	const plan = selectionToOptions(normalized);
	const planLabel = plan.profile === "runtime" ? "runtime（仅课程工具）" : plan.profile === "full" ? "full（Program + Project）" : "basic（Program）";
	lines.push(frameLine(`▸ 当前方案：${planLabel}`, innerWidth, plan.profile === "full" ? "green" : "cyan", color));
	lines.push(`├${"─".repeat(safeWidth - 2)}┤`);
	lines.push(frameLine("↑↓/jk 移动   空格 选择/取消   Enter 开始   q 退出", innerWidth, "dim", color));
	lines.push(`╰${"─".repeat(safeWidth - 2)}╯`);
	return lines.join("\n");
}
function decodeChoiceInputInternal(value, { deferIncomplete = false } = {}) {
	const actions = [];
	let pending = "";
	for (let index = 0; index < value.length;) {
		const remaining = value.slice(index);
		const arrow = CHOICE_ARROW_KEYS.find(([sequence]) => remaining.startsWith(sequence));
		if (arrow) {
			actions.push(arrow[1]);
			index += arrow[0].length;
			continue;
		}
		if (deferIncomplete && CHOICE_ARROW_KEYS.some(([sequence]) => sequence.startsWith(remaining))) {
			pending = remaining;
			break;
		}
		const character = value[index];
		if (character === "" || character === "\x1B") actions.push("escape");
		else if (character === " ") actions.push("space");
		else if (character === "\r" || character === "\n") actions.push("enter");
		else if (character.toLowerCase() === "q") actions.push("q");
		else if (character.toLowerCase() === "j") actions.push("j");
		else if (character.toLowerCase() === "k") actions.push("k");
		index += 1;
	}
	return {
		actions,
		pending
	};
}
/** cooked 模式下读一行；终端自己负责回显，这里只把数据攒到换行为止。 */
function promptLine(question, input, output) {
	output.write(question);
	return new Promise((resolve) => {
		let buffer = "";
		const onData = (chunk) => {
			buffer += String(chunk ?? "");
			const newline = buffer.indexOf("\n");
			if (newline < 0) return;
			input.off?.("data", onData);
			input.pause?.();
			resolve(buffer.slice(0, newline).trim());
		};
		input.resume?.();
		input.on("data", onData);
	});
}
async function promptInstallSelection({ input = process.stdin, output = process.stdout, initialSelection = createInstallSelection(), title = "配置 DSA Mastery" } = {}) {
	if (!input?.isTTY || !output?.isTTY) return {
		cancelled: false,
		...selectionToOptions(initialSelection)
	};
	let cursor = Math.min(1, INSTALL_CHOICES.length - 1);
	let selection = normalizeInstallSelection(initialSelection);
	const previousRawMode = input.isRaw;
	let inputBuffer = "";
	let rendered = false;
	const color = supportsColor(output);
	const render = () => {
		if (rendered) output.write("\x1B[2J\x1B[H");
		output.write(`${renderChoiceMenu({
			title,
			selection,
			cursor,
			width: output.columns ?? 88,
			color
		})}\n`);
		rendered = true;
	};
	input.setRawMode?.(true);
	input.resume?.();
	render();
	try {
		return await new Promise((resolve) => {
			const onData = (chunk) => {
				inputBuffer += String(chunk ?? "");
				const decoded = decodeChoiceInputInternal(inputBuffer, { deferIncomplete: true });
				inputBuffer = decoded.pending;
				for (const key of decoded.actions) {
					const action = handleChoiceKey(key, cursor, selection);
					cursor = action.cursor;
					selection = action.selection;
					if (action.action === "confirm") {
						input.off?.("data", onData);
						resolve({
							cancelled: false,
							...selectionToOptions(selection)
						});
						return;
					}
					if (action.action === "cancel") {
						input.off?.("data", onData);
						resolve({
							cancelled: true,
							...selectionToOptions(selection)
						});
						return;
					}
					render();
				}
			};
			input.on("data", onData);
		});
	} finally {
		if (rendered) output.write("\x1B[2J\x1B[H");
		input.setRawMode?.(previousRawMode ?? false);
		input.pause?.();
	}
}
//#endregion
//#region src/setup/repository.ts
function resolveRepositoryDir({ cwd = process.cwd(), repoDir } = {}) {
	return path.resolve(cwd, repoDir ?? ".");
}
async function inspectRepository(repositoryDir, { runner = runProcess, env = process.env } = {}) {
	const state = {
		path: repositoryDir,
		exists: false,
		directory: false,
		empty: false,
		valid: false,
		git: false,
		dirty: false,
		remote: void 0
	};
	try {
		const repositoryStat = await stat(repositoryDir);
		state.exists = true;
		state.directory = repositoryStat.isDirectory();
	} catch (error) {
		if (error.code === "ENOENT") return state;
		throw error;
	}
	if (!state.directory) return state;
	state.empty = (await readdir(repositoryDir)).length === 0;
	state.valid = await Promise.all([
		pathExists(path.join(repositoryDir, "package.json")),
		pathExists(path.join(repositoryDir, "pnpm-lock.yaml")),
		pathExists(path.join(repositoryDir, "labs")),
		pathExists(path.join(repositoryDir, "packages", "lab-cli", "dist", "cli.js"))
	]).then((items) => items.every(Boolean));
	state.git = await pathExists(path.join(repositoryDir, ".git"));
	if (state.git) {
		const status = await runner("git", ["status", "--short"], {
			cwd: repositoryDir,
			env,
			timeMs: 1e4,
			outputKb: 256
		});
		state.dirty = !resultFailed(status) && Boolean(status.stdout?.trim());
		const remote = await runner("git", [
			"remote",
			"get-url",
			"origin"
		], {
			cwd: repositoryDir,
			env,
			timeMs: 1e4,
			outputKb: 256
		});
		if (!resultFailed(remote)) state.remote = firstOutputLine(remote);
	}
	return state;
}
function assertRepositorySafe(state) {
	if (state.exists && !state.directory) throw setupError("REPOSITORY_INVALID", `仓库目标不是目录：${state.path}`);
	if (state.exists && !state.valid && !state.empty) throw setupError("REPOSITORY_INVALID", `目标目录不是 DSA Mastery 仓库且不为空，不会覆盖：${state.path}`);
	if (state.dirty && state.updateRepo) throw setupError("REPOSITORY_DIRTY", `仓库存在未提交改动，已阻止更新：${state.path}；请提交/暂存改动后再使用 --update-repo。`);
	return state;
}
async function ensureRepository(context) {
	let state = await inspectRepository(context.repoDir, {
		runner: context.runner,
		env: context.env
	});
	state.updateRepo = context.options.updateRepo;
	assertRepositorySafe(state);
	if (state.valid) {
		if (context.options.updateRepo) {
			if (!state.git) throw setupError("REPOSITORY_INVALID", "--update-repo 要求目标是 Git 仓库；当前目录缺少 .git。", { path: context.repoDir });
			await runExternal(context, "git", ["pull", "--ff-only"], {
				stage: "repository",
				timeMs: 12e4,
				errorCode: "REPOSITORY_UPDATE_FAILED",
				errorMessage: "仓库更新失败；未执行强制覆盖，请检查网络和远端分支。"
			});
			state = await inspectRepository(context.repoDir, {
				runner: context.runner,
				env: context.env
			});
		}
		context.repository = state;
		return state;
	}
	if (context.options.checkOnly) throw setupError("REPOSITORY_MISSING", `未找到有效的 DSA Mastery 仓库：${context.repoDir}`, { path: context.repoDir });
	await mkdir(path.dirname(context.repoDir), { recursive: true });
	await runExternal(context, "git", [
		"clone",
		context.options.repoUrl,
		context.repoDir
	], {
		stage: "repository",
		timeMs: 12e5,
		errorCode: "REPOSITORY_UPDATE_FAILED",
		errorMessage: `仓库 clone 失败：${context.options.repoUrl}`
	});
	state = await inspectRepository(context.repoDir, {
		runner: context.runner,
		env: context.env
	});
	if (!state.valid) throw setupError("REPOSITORY_INVALID", `clone 完成但目标不是有效的 DSA Mastery 仓库：${context.repoDir}`);
	context.repository = state;
	return state;
}
async function askRepositoryUpdate(options, { io, cwd, runner, env }) {
	if (!(!options.nonInteractive && !options.json && !options.checkOnly && options.ui !== "plain" && Boolean(io.input?.isTTY && io.output?.isTTY)) || options.updateRepo) return options;
	const repositoryDir = resolveRepositoryDir({
		cwd,
		repoDir: options.repoDir
	});
	const state = await inspectRepository(repositoryDir, {
		runner,
		env
	});
	if (!state.valid || !state.git || state.dirty) return options;
	const answer = (await promptLine(`发现已有干净仓库 ${repositoryDir}，是否执行 git pull --ff-only？[y/N]：`, io.input, io.output)).toLowerCase();
	if ([
		"y",
		"yes",
		"是"
	].includes(answer)) return {
		...options,
		updateRepo: true
	};
	return options;
}
//#endregion
//#region src/setup/smoke.ts
async function runLabJson(context, args, label) {
	const result = await runWithRunner(context, context.nodeCommand ?? process.execPath, [
		"packages/lab-cli/dist/cli.js",
		...args,
		"--json",
		"--no-color"
	], {
		cwd: context.repoDir,
		timeMs: 6e5,
		outputKb: 8192
	});
	recordCommand(context, context.nodeCommand ?? process.execPath, [
		"packages/lab-cli/dist/cli.js",
		...args,
		"--json",
		"--no-color"
	], result);
	let report;
	try {
		report = JSON.parse(result.stdout);
	} catch {
		throw setupError("SMOKE_FAILED", `${label} 未返回可解析的 JSON 报告。`, { result });
	}
	if (resultFailed(result) || report.ok !== true) throw setupError("SMOKE_FAILED", `${label} 未通过；请查看报告或日志中的诊断。`, {
		report,
		result
	});
	return report;
}
async function runSmoke(context) {
	if (context.profile === "runtime") {
		context.smoke = [];
		return context.smoke;
	}
	const program = path.join(context.repoDir, "labs", "chapter-01", "exercise", "E-01-01-sequential-list-deduplication");
	const results = [{
		label: "Program doctor",
		report: await runLabJson(context, ["doctor", program], "Program doctor")
	}, {
		label: "Program reference sample",
		report: await runLabJson(context, [
			"run",
			program,
			"--target",
			"solution",
			"--case",
			"001-sample"
		], "Program reference sample")
	}];
	if (context.profile === "full") {
		const project = path.join(context.repoDir, "labs", "chapter-08", "project", "P-08-01-avl-tree-rotations");
		results.push({
			label: "Project doctor",
			report: await runLabJson(context, ["doctor", project], "Project doctor")
		});
		results.push({
			label: "Project reference CTest",
			report: await runLabJson(context, [
				"run",
				project,
				"--target",
				"solution",
				"--task",
				"avl"
			], "Project reference CTest")
		});
	}
	context.smoke = results;
	return results;
}
async function runCheckOnly(context) {
	const evaluation = evaluateProfile(context.profile, context.host.tools);
	context.evaluation = evaluation;
	const repository = await inspectRepository(context.repoDir, {
		runner: context.runner,
		env: context.env
	});
	context.repository = repository;
	const issues = [...evaluation.issues];
	if (!repository.valid) issues.push(`有效仓库：${context.repoDir}`);
	if (issues.length) {
		evaluation.ok = false;
		evaluation.issues = issues;
		throw setupError("ENVIRONMENT_NOT_READY", `只读检查未通过：${issues.join("；")}`, {
			evaluation,
			host: serializeHost(context.host),
			repository
		});
	}
	return {
		evaluation,
		repository
	};
}
//#endregion
//#region src/ui/progress.ts
const STATUS_ICON = {
	pending: "·",
	running: "▶",
	success: "✓",
	warning: "⚠",
	failed: "✗",
	skipped: "–"
};
const STATUS_LABEL = {
	pending: "待处理",
	running: "进行中",
	success: "完成",
	warning: "警告",
	failed: "失败",
	skipped: "跳过"
};
const STATUS_STYLES = {
	pending: "dim",
	running: ["bold", "cyan"],
	success: ["bold", "green"],
	warning: ["bold", "yellow"],
	failed: ["bold", "red"],
	skipped: "dim"
};
function renderTuiSummary({ summary = "", width = 88, color = false } = {}) {
	const safeWidth = clampWidth(width);
	const innerWidth = safeWidth - 4;
	const sourceLines = String(summary ?? "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
	if (!sourceLines.length) return "";
	const headline = sourceLines.shift();
	const metadata = [];
	const stages = [];
	const resultDetails = [];
	for (const line of sourceLines) {
		const stage = parseSummaryStage(line);
		if (stage) stages.push(stage);
		else if (/^(?:仓库|日志|下一步)[：:]/u.test(line)) resultDetails.push(line);
		else metadata.push(line);
	}
	const success = headline.includes("成功");
	const matchedLabel = headline.match(/^DSA Mastery 环境配置[：:](.*)$/u)?.[1].trimStart();
	const headlineLabel = matchedLabel === void 0 || matchedLabel === "" ? headline : matchedLabel;
	const metadataFields = metadata.map(parseSummaryField).filter((field) => Boolean(field));
	const resultFields = resultDetails.map(parseSummaryField).filter((field) => Boolean(field));
	const metadataLabelWidth = Math.max(4, ...metadataFields.map((field) => displayWidth(field.label)));
	const resultLabelWidth = Math.max(4, ...resultFields.map((field) => displayWidth(field.label)));
	const lines = [`╭${"─".repeat(safeWidth - 2)}╮`, frameLine(`配置结果 · ${headlineLabel}`, innerWidth, ["bold", success ? "green" : "red"], color)];
	for (const field of metadataFields) lines.push(frameSegments(alignedSummarySegments(field, metadataLabelWidth, innerWidth), innerWidth, color));
	if (stages.length) {
		lines.push(`├${"─".repeat(safeWidth - 2)}┤`);
		lines.push(frameLine("执行阶段", innerWidth, ["bold", "magenta"], color));
		const labelWidth = Math.max(14, ...stages.map((stage) => displayWidth(`${stage.icon} ${stage.name}`)));
		for (const stage of stages) {
			const label = `${stage.icon} ${stage.name}`;
			const padding = " ".repeat(Math.max(0, labelWidth - displayWidth(label)));
			lines.push(frameSegments([{
				value: `${label}${padding}`,
				styles: STATUS_STYLES[stage.status]
			}, {
				value: stage.message ? `  ${stage.message}` : "",
				styles: "dim"
			}], innerWidth, color));
		}
	}
	if (resultDetails.length) {
		lines.push(`├${"─".repeat(safeWidth - 2)}┤`);
		lines.push(frameLine("输出信息", innerWidth, ["bold", "magenta"], color));
		for (const field of resultFields) {
			const valueStyles = field.label === "下一步" ? ["bold", "yellow"] : "dim";
			lines.push(frameSegments(alignedSummarySegments(field, resultLabelWidth, innerWidth, valueStyles), innerWidth, color));
		}
	}
	lines.push(`╰${"─".repeat(safeWidth - 2)}╯`);
	return lines.join("\n");
}
const SUMMARY_ICON_STATUS = {
	"✓": "success",
	"⚠": "warning",
	"–": "skipped",
	"✗": "failed",
	"▶": "running",
	"·": "pending"
};
function parseSummaryStage(line) {
	const match = line.match(/^([✓⚠–✗·▶])\s+(\S[^：:]*)[：:](.*)$/u);
	if (!match) return void 0;
	return {
		icon: match[1],
		name: match[2],
		message: match[3].trimStart(),
		status: SUMMARY_ICON_STATUS[match[1]] ?? "pending"
	};
}
function parseSummaryField(line) {
	const match = line.match(/^([^：:]+)[：:](.*)$/u);
	if (!match) return void 0;
	return {
		label: match[1].trim() === "Profile" ? "方案" : match[1].trim(),
		value: match[2].trimStart()
	};
}
function alignedSummarySegments(field, labelWidth, innerWidth, valueStyles = "dim") {
	const padding = " ".repeat(Math.max(0, labelWidth - displayWidth(field.label)));
	const prefix = `${field.label}${padding}  `;
	return [{
		value: prefix,
		styles: ["bold", "cyan"]
	}, {
		value: truncate(field.value, Math.max(0, innerWidth - displayWidth(prefix))),
		styles: valueStyles
	}];
}
function createStageState(names) {
	return names.map((name) => ({
		id: String(name),
		name: String(name),
		status: "pending",
		message: ""
	}));
}
function progressSummary(stages) {
	const total = stages.length;
	const completed = stages.filter((stage) => [
		"success",
		"warning",
		"skipped"
	].includes(stage.status)).length;
	return {
		completed,
		total,
		percent: total === 0 ? 100 : Math.round(completed / total * 100)
	};
}
function renderPlain({ title = "DSA Mastery 环境配置", profile = "", stages = [], width = 80 } = {}) {
	const safeWidth = clampWidth(width);
	const summary = progressSummary(stages);
	const lines = [
		title,
		profile ? `Profile：${profile}` : "",
		`进度：${summary.completed}/${summary.total} · ${summary.percent}%`
	];
	for (const stage of stages) {
		const message = stage.message ? ` · ${stage.message}` : "";
		lines.push(`${STATUS_ICON[stage.status] ?? "·"} ${stage.name} · ${STATUS_LABEL[stage.status] ?? stage.status}${message}`);
	}
	return lines.filter(Boolean).map((line) => truncate(line, safeWidth)).join("\n");
}
function renderTuiFrame({ title = "DSA Mastery 环境配置", profile = "", stages = [], width = 80, color = false } = {}) {
	const safeWidth = clampWidth(width);
	const innerWidth = safeWidth - 4;
	const summary = progressSummary(stages);
	const barWidth = Math.max(8, innerWidth - 18);
	const filled = Math.round(summary.percent / 100 * barWidth);
	const empty = Math.max(0, barWidth - filled);
	const lines = [
		...renderBanner({
			width: safeWidth,
			subtitle: profile ? `本地环境配置 · ${profile}` : "本地环境配置",
			color
		}).split("\n"),
		"",
		`╭${"─".repeat(safeWidth - 2)}╮`,
		frameLine(`${title}${profile ? ` · ${profile}` : ""}`, innerWidth, ["bold", "cyan"], color),
		frameSegments([
			{
				value: "进度 ",
				styles: ["bold", "cyan"]
			},
			{
				value: "█".repeat(filled),
				styles: ["bold", "green"]
			},
			{
				value: "░".repeat(empty),
				styles: "dim"
			},
			{
				value: ` ${summary.percent}% (${summary.completed}/${summary.total})`,
				styles: "dim"
			}
		], innerWidth, color),
		`├${"─".repeat(safeWidth - 2)}┤`
	];
	for (const stage of stages) {
		const message = stage.message ? ` · ${stage.message}` : "";
		lines.push(frameLine(`${STATUS_ICON[stage.status] ?? "·"} ${stage.name} · ${STATUS_LABEL[stage.status] ?? stage.status}${message}`, innerWidth, STATUS_STYLES[stage.status], color));
	}
	lines.push(`╰${"─".repeat(safeWidth - 2)}╯`);
	return lines.join("\n");
}
function resolveUiMode({ mode = "auto", stdout = process.stdout, json = false, nonInteractive = false } = {}) {
	if (json || nonInteractive || mode === "plain") return "plain";
	const tty = Boolean(stdout?.isTTY);
	const disabled = Boolean(process.env.NO_COLOR) || process.env.TERM === "dumb";
	return (mode === "tui" || mode === "auto") && tty && !disabled ? "tui" : "plain";
}
function createProgressUI({ mode = "auto", stdout = process.stdout, title = "DSA Mastery 环境配置", profile = "", stageNames = [], json = false, nonInteractive = false, spinner = true } = {}) {
	const stages = createStageState(stageNames);
	const resolvedMode = resolveUiMode({
		mode,
		stdout,
		json,
		nonInteractive
	});
	let started = false;
	let timer;
	let currentFrame = "";
	const frameWidth = () => Math.max(28, Number(stdout?.columns) || 80);
	const ui = {
		mode: resolvedMode,
		stages,
		update(id, status, message = "") {
			const stage = stages.find((item) => item.id === id);
			if (!stage) throw new Error(`未知安装阶段：${id}`);
			stage.status = status;
			stage.message = message;
			ui.render();
			return stage;
		},
		render() {
			const width = frameWidth();
			const frame = resolvedMode === "tui" ? renderTuiFrame({
				title,
				profile,
				stages,
				width,
				color: supportsColor(stdout)
			}) : renderPlain({
				title,
				profile,
				stages,
				width
			});
			if (resolvedMode === "tui" && currentFrame) stdout.write("\x1B[2J\x1B[H");
			stdout.write(`${frame}\n`);
			currentFrame = frame;
			return frame;
		},
		start() {
			if (started) return;
			started = true;
			ui.render();
			if (resolvedMode === "tui" && spinner) {
				timer = setInterval(() => ui.render(), 800);
				timer.unref?.();
			}
		},
		finish({ ok = false, summary = "" } = {}) {
			if (timer) clearInterval(timer);
			timer = void 0;
			started = true;
			ui.render();
			if (summary && resolvedMode === "tui") stdout.write(`\n${renderTuiSummary({
				summary,
				width: frameWidth(),
				color: supportsColor(stdout)
			})}\n`);
			if (ok && resolvedMode === "tui") stdout.write(`\n${renderPixelBanner({
				width: frameWidth(),
				color: supportsColor(stdout)
			})}\n`);
			started = false;
		}
	};
	return ui;
}
//#endregion
//#region src/setup.ts
async function installDependencies(context) {
	await runExternal(context, context.pnpmCommand ?? "pnpm", ["install", "--frozen-lockfile"], {
		stage: "dependencies",
		cwd: context.repoDir,
		env: context.env,
		timeMs: 12e5,
		errorCode: "INSTALLER_FAILED",
		errorMessage: "项目依赖安装失败；请查看日志中的 pnpm install 输出后重试。"
	});
}
async function askInstallChoices(options, io) {
	if (!(!options.checkOnly && !options.nonInteractive && !options.json && options.ui !== "plain" && Boolean(io.input?.isTTY && io.output?.isTTY))) return {
		...options,
		profile: options.profile ?? "basic"
	};
	if (options.profile !== void 0) return { ...options };
	const initialSelection = createInstallSelection({
		program: true,
		project: false,
		vscode: options.installVscode,
		"cpp-extension": options.installCppExtension ?? false,
		"cmake-extension": options.installCmakeExtension ?? false
	});
	const selected = await promptInstallSelection({
		input: io.input,
		output: io.output,
		initialSelection,
		title: "配置 DSA Mastery · 选择要安装的内容"
	});
	if (selected.cancelled) return {
		...options,
		cancelled: true
	};
	return {
		...options,
		...selected
	};
}
function createSilentProgressUI() {
	const stages = SETUP_STAGES.map((id) => ({
		id,
		name: id,
		status: "pending",
		message: ""
	}));
	return {
		mode: "plain",
		stages,
		start() {},
		render: () => "",
		update(id, status, message = "") {
			const stage = stages.find((item) => item.id === id);
			if (!stage) throw new Error(`未知安装阶段：${id}`);
			stage.status = status;
			stage.message = message;
			return stage;
		},
		finish() {}
	};
}
async function executeStage(context, id, action) {
	context.currentStage = id;
	context.ui.update(id, "running", "准备中");
	const result = await action();
	const outcome = result;
	context.ui.update(id, outcome?.status ?? "success", outcome?.message ?? "完成");
	return result;
}
async function runSetup(argv = [], dependencies = {}) {
	if (process.platform === "win32") {
		try {
			process.stdout.setEncoding("utf8");
		} catch {}
		try {
			process.stderr.setEncoding("utf8");
		} catch {}
	}
	let options;
	try {
		options = parseSetupArgs(argv);
	} catch (error) {
		const normalized = normalizeError(error);
		return {
			exitCode: normalized.exitCode,
			report: {
				reportVersion: 1,
				command: "setup",
				ok: false,
				error: {
					code: normalized.code,
					message: normalized.message
				}
			}
		};
	}
	if (options.help) return {
		exitCode: SETUP_EXIT.OK,
		report: {
			reportVersion: 1,
			command: "setup",
			ok: true,
			help: "node packages/bootstrap/dist/setup.js [--profile runtime|basic|full] [--check-only] [--repo-dir <path>] [--ui auto|tui|plain]"
		}
	};
	const io = dependencies.io ?? {
		input: process.stdin,
		output: process.stdout
	};
	options = await askInstallChoices(options, io);
	if (options.cancelled === true) return {
		exitCode: SETUP_EXIT.OK,
		report: {
			reportVersion: 1,
			command: "setup",
			ok: false,
			cancelled: true,
			message: "已取消安装"
		},
		summary: "\nDSA Mastery 环境配置：已取消"
	};
	const profile = profileRequirements(options.profile ?? "basic").name;
	const runner = dependencies.runner ?? runProcess;
	options = await askRepositoryUpdate(options, {
		io,
		cwd: dependencies.cwd ?? process.cwd(),
		runner,
		env: dependencies.env ?? process.env
	});
	const context = {
		options,
		profile,
		platform: dependencies.platform ?? process.platform,
		architecture: dependencies.architecture ?? process.arch,
		env: { ...dependencies.env ?? process.env },
		runner,
		commandCwd: dependencies.commandCwd ?? dependencies.cwd ?? process.cwd(),
		repoDir: resolveRepositoryDir({
			cwd: dependencies.cwd ?? process.cwd(),
			repoDir: options.repoDir
		}),
		nodeCommand: dependencies.nodeCommand ?? process.execPath,
		commands: [],
		stages: SETUP_STAGES,
		ui: createSilentProgressUI()
	};
	context.packageManager = await detectPackageManager(context);
	context.ui = options.json ? createSilentProgressUI() : createProgressUI({
		mode: options.ui,
		stdout: io.output,
		title: "DSA Mastery 环境配置",
		profile,
		stageNames: SETUP_STAGES,
		nonInteractive: options.nonInteractive
	});
	const report = {
		reportVersion: 1,
		command: "setup",
		ok: false,
		profile,
		platform: context.platform,
		architecture: context.architecture,
		repoDir: context.repoDir,
		selection: options.selection,
		selectionLabels: options.selection === void 0 ? void 0 : choiceSelectionSummary(options.selection),
		stages: SETUP_STAGES.map((id) => ({
			id,
			status: "pending",
			message: ""
		}))
	};
	let summary = "";
	try {
		context.ui.start();
		await executeStage(context, "preflight", async () => {
			await inspectContextHost(context);
			const compilerMessage = profile === "runtime" ? "未选择 C++ 编译器" : `编译器${context.host.compilerReady ? "可用" : "缺失"}`;
			return { message: `Node ${context.host.tools.find((tool) => tool.name === "Node.js")?.version ?? "unknown"} · ${compilerMessage}` };
		});
		if (options.checkOnly) {
			await executeStage(context, "toolchain", async () => {
				await runCheckOnly(context);
				return { message: "只读检查通过" };
			});
			await executeStage(context, "repository", async () => ({
				status: context.repository?.valid ? "success" : "warning",
				message: context.repository?.valid ? "仓库有效" : "仓库缺失"
			}));
			context.ui.update("dependencies", "skipped", "check-only 不安装依赖");
			context.ui.update("ide", "skipped", "check-only 不安装 IDE");
			context.ui.update("smoke", "skipped", "check-only 不运行 smoke");
		} else {
			await executeStage(context, "toolchain", async () => {
				await ensureToolchain(context);
				return { message: profile === "runtime" ? "Node/pnpm 已就绪" : `Node/pnpm/编译器${profile === "full" ? "/CMake" : ""} 已就绪` };
			});
			await executeStage(context, "repository", async () => {
				const repository = await ensureRepository(context);
				return {
					message: context.options.updateRepo ? "仓库已检查并更新" : "仓库已复用或准备",
					repository
				};
			});
			await executeStage(context, "dependencies", async () => {
				await installDependencies(context);
				return { message: "pnpm install --frozen-lockfile 完成" };
			});
			await executeStage(context, "ide", async () => installIde(context));
			if (profile === "runtime") context.ui.update("smoke", "skipped", "runtime 方案不运行 C++ smoke");
			else await executeStage(context, "smoke", async () => {
				await runSmoke(context);
				return { message: profile === "full" ? "Program + Project reference 验证通过" : "Program reference 验证通过" };
			});
		}
		report.ok = true;
	} catch (rawError) {
		const error = normalizeError(rawError);
		report.error = {
			code: error.code,
			message: error.message,
			details: error.details,
			nextAction: error.details?.restartRequired ? "完成系统安装/重启终端后重新运行同一命令。" : error.code === "REPOSITORY_DIRTY" ? "先提交或暂存改动，再显式使用 --update-repo。" : error.code === "SETUP_UNSUPPORTED" ? "改用对应平台的手工安装指南，再重新运行 --check-only。" : "根据失败阶段和日志中的完整命令输出修复后重新运行。"
		};
		context.ui.update(String(context.currentStage ?? "preflight"), "failed", error.message);
		report.exitCode = error.exitCode;
	} finally {
		for (const stage of report.stages) {
			const current = context.ui.stages?.find((item) => item.id === stage.id);
			if (current) {
				stage.status = current.status;
				stage.message = current.message;
			}
		}
		report.repository = context.repository ? {
			path: context.repository.path,
			valid: context.repository.valid,
			dirty: context.repository.dirty,
			remote: context.repository.remote
		} : void 0;
		report.host = serializeHost(context.host);
		report.evaluation = context.evaluation;
		report.smoke = context.smoke?.map((item) => ({
			label: item.label,
			ok: item.report.ok
		}));
		if (!report.ok && !options.checkOnly) try {
			report.logPath = await writeFailureLog(context, report);
		} catch (error) {
			report.logError = error.message;
		}
		summary = summarizeReport(report);
		context.ui.finish({
			ok: report.ok,
			summary
		});
	}
	report.exitCode ??= report.ok ? SETUP_EXIT.OK : SETUP_EXIT.INSTALLER;
	return {
		exitCode: report.exitCode,
		report,
		summary,
		uiMode: context.ui.mode
	};
}
function printSuccessBanner() {
	const reset = "\x1B[0m";
	const bold = "\x1B[1m";
	const colors = [
		"\x1B[38;5;27m",
		"\x1B[38;5;33m",
		"\x1B[38;5;39m",
		"\x1B[38;5;42m",
		"\x1B[38;5;46m"
	];
	const lines = [
		"  ____  ____   _    __  __           __  __           _             ",
		" |  _ \\/ ___| / \\  |  \\/  |         |  \\/  | __ _ ___| |_ ___ _ __  ",
		" | | | \\___ \\/ _ \\ | |\\/| |  _____  | |\\/| |/ _` / __| __/ _ \\ '__| ",
		" | |_| |___) / ___ \\| |  | | |_____| | |  | | (_| \\__ \\ ||  __/ |    ",
		" |____/|____/_/   \\_\\_|  |_|         |_|  |_|\\__,_|___/\\__\\___|_|    "
	];
	let output = "\n";
	lines.forEach((line, i) => {
		output += `${colors[i % colors.length] + bold + line + reset}\n`;
	});
	output += "\n";
	return output;
}
async function main() {
	const result = await runSetup(process.argv.slice(2));
	if (result.report.help !== void 0) console.log(result.report.help);
	else if (result.report.command === "setup" && result.report.error === void 0 && process.argv.includes("--json")) console.log(JSON.stringify(result.report, null, 2));
	else if (process.argv.includes("--json")) console.log(JSON.stringify(result.report, null, 2));
	else if (result.summary !== void 0 && result.uiMode !== "tui") console.log(result.summary);
	if (result.report.ok && !process.argv.includes("--json") && result.uiMode !== "tui") process.stdout.write(printSuccessBanner());
	process.exitCode = result.exitCode;
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) await main();
//#endregion
export { runSetup };
