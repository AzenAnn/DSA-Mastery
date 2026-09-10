#!/usr/bin/env node
import path from "node:path";
import process from "node:process";
import { createReport, loadLab } from "./core.mjs";
import { inspectEnvironment } from "./doctor.mjs";
import { asLabError, EXIT, LabError } from "./errors.mjs";
import { compileTarget } from "./compiler.mjs";
import { formatJudge, judgeProgram, runInteractive } from "./judge.mjs";
import { cleanLab, packStudent, refreshExpected, verifyProgram } from "./operations.mjs";
import { buildProject, formatProject, interactiveProjectTask, refreshProjectExpected, scoreProject, verifyProject } from "./project.mjs";
import { formatBuild, formatClean, formatDoctor, formatError, formatHelp, formatLocate, formatNew, formatPack, formatRefresh, formatValidate, formatVerify } from "./reporter.mjs";
import { createTheme } from "./terminal.mjs";

const projectRoot = path.resolve(import.meta.dirname, "../..");

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
    const [rawKey, inline] = token.slice(2).split("=", 2);
    if (["json", "no-color", "write"].includes(rawKey)) {
      options[rawKey] = inline === undefined ? true : inline !== "false";
      continue;
    }
    const value = inline ?? rest[index + 1];
    if (value === undefined || value.startsWith("--")) throw new LabError("ARGUMENT_INVALID", `--${rawKey} 缺少值`);
    if (inline === undefined) index += 1;
    options[rawKey] = value;
  }
  return { command, options, positional };
}

function targetPath(positional) {
  if (positional[0]) return positional[0];
  const initialDirectory = process.env.INIT_CWD ? path.resolve(process.env.INIT_CWD) : undefined;
  const projectBoundary = `${projectRoot}${path.sep}`;
  return initialDirectory && (initialDirectory === projectRoot || initialDirectory.startsWith(projectBoundary))
    ? initialDirectory
    : process.cwd();
}

function validateOptions(parsed) {
  const common = ["json", "no-color"];
  const byCommand = {
    new: [...common, "type", "chapter", "order", "slug"],
    locate: common,
    doctor: common,
    validate: common,
    build: [...common, "target"],
    run: [...common, "target", "case", "task"],
    interactive: ["target", "task"],
    score: [...common, "target", "case", "task"],
    verify: common,
    "refresh-expected": [...common, "write", "task"],
    pack: [...common, "profile"],
    clean: common,
  };
  const allowed = byCommand[parsed.command];
  if (!allowed) return;
  const unknown = Object.keys(parsed.options).filter((key) => !allowed.includes(key));
  if (unknown.length) throw new LabError("ARGUMENT_INVALID", `命令 ${parsed.command} 不支持选项：${unknown.map((key) => `--${key}`).join(", ")}`);
  if (parsed.command !== "new" && parsed.positional.length > 1) throw new LabError("ARGUMENT_INVALID", `${parsed.command} 最多接受一个 Lab 路径`);
  if (parsed.command === "new" && parsed.positional.length) throw new LabError("ARGUMENT_INVALID", "new 不接受位置参数");
  if (parsed.command === "locate" && parsed.positional.length !== 1) throw new LabError("ARGUMENT_INVALID", "locate 要求一个 Lab ID，例如 02T3");
}

function reportJudge(command, lab, judged) {
  return createReport(command, lab, {
    result: {
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
        stderr: judged.compilation.stderr,
      },
    },
  });
}

async function main() {
  let parsed;
  try {
    parsed = parseArgs(process.argv.slice(2));
    const theme = createTheme({ stream: process.stdout, noColor: Boolean(parsed.options["no-color"]) });
    if (!parsed.command || ["help", "--help", "-h"].includes(parsed.command)) {
      console.log(formatHelp(theme));
      return EXIT.OK;
    }
    validateOptions(parsed);
    if (parsed.command === "new") {
      const { createLab } = await import("./scaffold.mjs");
      const created = await createLab(parsed.options);
      const report = { reportVersion: 1, command: "new", ok: true, lab: { id: created.labId, path: created.labRoot, relativePath: created.relativeRoot, type: created.type, order: created.order } };
      if (parsed.options.json) console.log(JSON.stringify(report, null, 2));
      else console.log(formatNew(created, theme));
      return EXIT.OK;
    }
    if (parsed.command === "locate") {
      const { locateLabById } = await import("./identity.mjs");
      const located = await locateLabById(projectRoot, parsed.positional[0]);
      const report = { reportVersion: 1, command: "locate", ok: true, lab: { id: located.id, path: located.labPath, relativePath: located.relativePath, type: located.type, category: located.category } };
      if (parsed.options.json) console.log(JSON.stringify(report, null, 2));
      else console.log(formatLocate(report.lab, theme));
      return EXIT.OK;
    }
    const commands = new Set(["doctor", "validate", "build", "run", "interactive", "score", "verify", "refresh-expected", "pack", "clean"]);
    if (!commands.has(parsed.command)) throw new LabError("COMMAND_UNKNOWN", `未知命令：${parsed.command}`);
    const lab = await loadLab(targetPath(parsed.positional));
    if (parsed.command === "validate") {
      const report = createReport("validate", lab, {
        quiz: lab.quizResult,
        cases: lab.cases?.length,
        tasks: lab.tasks?.length,
      });
      if (parsed.options.json) console.log(JSON.stringify(report, null, 2));
      else console.log(formatValidate(report, theme));
      return EXIT.OK;
    }
    if (parsed.command === "doctor") {
      const environment = await inspectEnvironment(lab);
      const report = createReport("doctor", lab, { environment });
      report.ok = environment.ok;
      if (parsed.options.json) console.log(JSON.stringify(report, null, 2));
      else console.log(formatDoctor(report, theme));
      return environment.ok ? EXIT.OK : EXIT.TOOL_ERROR;
    }
    if (parsed.command === "build") {
      const compilation = lab.manifest.type === "project"
        ? await buildProject(lab, parsed.options.target ?? "student")
        : await compileTarget(lab, parsed.options.target ?? "student");
      const report = createReport("build", lab, { compilation });
      report.ok = compilation.ok;
      if (parsed.options.json) console.log(JSON.stringify(report, null, 2));
      else console.log(formatBuild(compilation, theme));
      return compilation.ok ? EXIT.OK : EXIT.SCORE_NOT_FULL;
    }
    if (["run", "score"].includes(parsed.command)) {
      if (lab.manifest.type === "project") {
        const project = await scoreProject(lab, {
          target: parsed.options.target ?? "student",
          taskId: parsed.options.task,
          caseId: parsed.options.case,
        });
        const report = createReport(parsed.command, lab, { result: project });
        report.ok = !project.internalError;
        if (parsed.options.json) console.log(JSON.stringify(report, null, 2));
        else console.log(formatProject(project, {
          theme,
          command: `pnpm lab:${parsed.command}`,
          labPath: parsed.positional[0] ?? lab.labRoot,
        }));
        if (project.internalError) return EXIT.TOOL_ERROR;
        return parsed.command === "run" || project.automatedFull ? EXIT.OK : EXIT.SCORE_NOT_FULL;
      }
      const judged = await judgeProgram(lab, { target: parsed.options.target ?? "student", caseId: parsed.options.case });
      const report = reportJudge(parsed.command, lab, judged);
      report.ok = !judged.cases.some((item) => item.verdict === "IE");
      if (parsed.options.json) console.log(JSON.stringify(report, null, 2));
      else console.log(formatJudge(judged, {
        theme,
        command: `pnpm lab:${parsed.command}`,
        labPath: parsed.positional[0] ?? lab.labRoot,
      }));
      if (judged.cases.some((item) => item.verdict === "IE")) return EXIT.TOOL_ERROR;
      return parsed.command === "run" || judged.score === judged.maxScore ? EXIT.OK : EXIT.SCORE_NOT_FULL;
    }
    if (parsed.command === "interactive") {
      const result = lab.manifest.type === "project"
        ? await interactiveProjectTask(lab, parsed.options.task, parsed.options.target ?? "student")
        : await runInteractive(lab, parsed.options.target ?? "student");
      return result.code;
    }
    if (parsed.command === "verify") {
      const verification = lab.manifest.type === "quiz"
        ? { ok: true, checks: { quizContract: true }, quiz: lab.quizResult }
        : lab.manifest.type === "project"
          ? await verifyProject(lab)
          : await verifyProgram(lab);
      const report = createReport("verify", lab, { verification });
      report.ok = verification.ok;
      if (parsed.options.json) console.log(JSON.stringify(report, null, 2));
      else console.log(formatVerify(lab.manifest.type, verification, theme));
      return verification.ok ? EXIT.OK : EXIT.SCORE_NOT_FULL;
    }
    if (parsed.command === "refresh-expected") {
      const refresh = lab.manifest.type === "project"
        ? await refreshProjectExpected(lab, { taskId: parsed.options.task, write: Boolean(parsed.options.write) })
        : await refreshExpected(lab, Boolean(parsed.options.write));
      const report = createReport("refresh-expected", lab, { refresh });
      if (parsed.options.json) console.log(JSON.stringify(report, null, 2));
      else console.log(formatRefresh(refresh, { write: Boolean(parsed.options.write), theme }));
      return refresh.changed && !parsed.options.write ? EXIT.SCORE_NOT_FULL : EXIT.OK;
    }
    if (parsed.command === "pack") {
      if (parsed.options.profile !== "student") throw new LabError("ARGUMENT_INVALID", "pack 目前要求 --profile student");
      const packed = await packStudent(lab);
      const report = createReport("pack", lab, { package: packed });
      if (parsed.options.json) console.log(JSON.stringify(report, null, 2));
      else console.log(formatPack(packed, theme));
      return EXIT.OK;
    }
    const cleaned = await cleanLab(lab);
    if (parsed.options.json) console.log(JSON.stringify(createReport("clean", lab, { cleaned }), null, 2));
    else console.log(formatClean(cleaned, theme));
    return EXIT.OK;
  } catch (rawError) {
    const error = asLabError(rawError);
    const report = { reportVersion: 1, command: parsed?.command ?? null, ok: false, error: { code: error.code, message: error.message, details: error.details } };
    if (parsed?.options?.json) console.log(JSON.stringify(report, null, 2));
    else console.error(formatError(error, createTheme({ stream: process.stderr, noColor: Boolean(parsed?.options?.["no-color"]) })));
    return EXIT.TOOL_ERROR;
  }
}

process.exitCode = await main();
