#!/usr/bin/env node
import type { ExecutableLab, LoadedLab, TargetName } from "@dsa/lab-core";
import process from "node:process";
import {
  asLabError,
  createReport,
  createTheme,
  EXIT,
  findRepoRoot,
  invocationDirectory,
  isProgramLab,
  isProjectLab,
  isQuizLab,
  LabError,
  loadLab,
} from "@dsa/lab-core";
import {
  buildProject,
  cleanLab,
  compileTarget,
  formatJudge,
  formatProject,
  inspectEnvironment,
  interactiveProjectTask,
  judgeProgram,
  locateLabById,
  packStudent,
  projectStatus,
  refreshExpected,
  refreshProjectExpected,
  runInteractive,
  scoreProject,
  verifyProgram,
  verifyProject,
} from "@dsa/lab-runner";
import {
  formatBuild,
  formatClean,
  formatDoctor,
  formatError,
  formatHelp,
  formatLocate,
  formatNew,
  formatPack,
  formatRefresh,
  formatValidate,
  formatVerify,
} from "./reporter.ts";
import { createLab } from "./scaffold.ts";

interface ParsedArgs {
  command?: string | undefined;
  options: Record<string, string | boolean>;
  positional: string[];
}

const LAB_ID_ARGUMENT = /^(?:lab-?)?\d{1,2}-?[tep]-?\d+$/i;

function parseArgs(argv: string[]): ParsedArgs {
  const [command, ...forwarded] = argv;
  const rest = forwarded[0] === "--" ? forwarded.slice(1) : forwarded;
  const options: Record<string, string | boolean> = {};
  const positional: string[] = [];
  for (let index = 0; index < rest.length; index += 1) {
    const token = rest[index]!;
    if (!token.startsWith("--")) {
      positional.push(token);
      continue;
    }
    const [rawKey = "", inline] = token.slice(2).split("=", 2);
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

const COMMON_OPTIONS = ["json", "no-color"];

const OPTIONS_BY_COMMAND: Record<string, string[]> = {
  new: [...COMMON_OPTIONS, "type", "chapter", "order", "slug"],
  locate: COMMON_OPTIONS,
  doctor: COMMON_OPTIONS,
  validate: COMMON_OPTIONS,
  build: [...COMMON_OPTIONS, "target", "task"],
  "project-status": [...COMMON_OPTIONS, "target", "dirty-files"],
  run: [...COMMON_OPTIONS, "target", "case", "task"],
  interactive: ["target", "task"],
  score: [...COMMON_OPTIONS, "target", "case", "task"],
  verify: COMMON_OPTIONS,
  "refresh-expected": [...COMMON_OPTIONS, "write", "task"],
  pack: [...COMMON_OPTIONS, "profile"],
  clean: COMMON_OPTIONS,
};

function validateOptions(parsed: ParsedArgs): void {
  const allowed: string[] | undefined = OPTIONS_BY_COMMAND[parsed.command!];
  if (allowed === undefined) return;
  const unknown = Object.keys(parsed.options).filter((key) => !allowed.includes(key));
  if (unknown.length) {
    throw new LabError(
      "ARGUMENT_INVALID",
      `命令 ${parsed.command} 不支持选项：${unknown.map((key) => `--${key}`).join(", ")}`,
    );
  }
  if (parsed.command !== "new" && parsed.positional.length > 1) {
    throw new LabError("ARGUMENT_INVALID", `${parsed.command} 最多接受一个 Lab 路径`);
  }
  if (parsed.command === "new" && parsed.positional.length)
    throw new LabError("ARGUMENT_INVALID", "new 不接受位置参数");
  if (parsed.command === "locate" && parsed.positional.length !== 1) {
    throw new LabError("ARGUMENT_INVALID", "locate 要求一个 Lab ID，例如 02T3");
  }
}

/** 位置参数可以是 Lab 路径，也可以是 `02T3` 这样的稳定 ID；都没有时按调用目录推断。 */
async function resolveLabPathArgument(positional: string[], repoRoot: string | undefined): Promise<string> {
  const argument = positional[0] ?? "";
  if (!argument) return invocationDirectory(repoRoot);
  if (!LAB_ID_ARGUMENT.test(argument)) return argument;
  if (repoRoot === undefined) throw new LabError("REPO_NOT_FOUND", `只有在仓库内才能用 Lab ID 定位：${argument}`);

  return (await locateLabById(repoRoot, argument)).labPath;
}

function requireRepo(repoRoot: string | undefined, command: string): string {
  if (repoRoot === undefined) throw new LabError("REPO_NOT_FOUND", `${command} 只能在 DSA Mastery 仓库内运行`);

  return repoRoot;
}

function assertExecutable(lab: LoadedLab, command: string): asserts lab is ExecutableLab {
  if (lab.manifest.type === "quiz") throw new LabError("TYPE_UNSUPPORTED", `${command} 不支持 quiz Lab`);
}

const EXECUTABLE_COMMANDS = new Set([
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
  "project-status",
]);

async function main(): Promise<number> {
  let parsed: ParsedArgs | undefined;
  try {
    parsed = parseArgs(process.argv.slice(2));
    const theme = createTheme({ stream: process.stdout, noColor: Boolean(parsed.options["no-color"]) });
    const json = Boolean(parsed.options["json"]);
    if (parsed.command === undefined || ["help", "--help", "-h"].includes(parsed.command)) {
      console.log(formatHelp(theme));

      return EXIT.OK;
    }
    validateOptions(parsed);
    const repoRoot = await findRepoRoot(import.meta.dirname);

    if (parsed.command === "new") {
      const created = await createLab(parsed.options as never, requireRepo(repoRoot, "new"));
      if (json) {
        console.log(
          JSON.stringify(
            {
              reportVersion: 1,
              command: "new",
              ok: true,
              lab: {
                id: created.labId,
                path: created.labRoot,
                relativePath: created.relativeRoot,
                type: created.type,
                order: created.order,
              },
            },
            null,
            2,
          ),
        );
      } else {
        console.log(formatNew(created, theme));
      }

      return EXIT.OK;
    }

    if (parsed.command === "locate") {
      const located = await locateLabById(requireRepo(repoRoot, "locate"), parsed.positional[0]);
      const lab = {
        id: located.id,
        path: located.labPath,
        relativePath: located.relativePath,
        type: located.type,
        category: located.category,
      };
      if (json) console.log(JSON.stringify({ reportVersion: 1, command: "locate", ok: true, lab }, null, 2));
      else console.log(formatLocate(lab, theme));

      return EXIT.OK;
    }

    if (!EXECUTABLE_COMMANDS.has(parsed.command)) throw new LabError("COMMAND_UNKNOWN", `未知命令：${parsed.command}`);
    const lab = await loadLab(await resolveLabPathArgument(parsed.positional, repoRoot));
    const target = (parsed.options["target"] ?? "student") as TargetName;
    const labPath = parsed.positional[0] ?? lab.labRoot;

    if (parsed.command === "validate") {
      const report = createReport("validate", lab, {
        quiz: isQuizLab(lab) ? lab.quizResult : undefined,
        cases: isProgramLab(lab) ? lab.cases.length : undefined,
        tasks: isProjectLab(lab) ? lab.tasks.length : undefined,
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
      const verification = isQuizLab(lab)
        ? { ok: true, checks: { quizContract: true }, quiz: lab.quizResult }
        : isProjectLab(lab)
          ? await verifyProject(lab)
          : await verifyProgram(lab);
      const report = createReport("verify", lab, { verification });
      report.ok = verification.ok;
      if (json) console.log(JSON.stringify(report, null, 2));
      else console.log(formatVerify(lab.manifest.type, verification, theme));

      return verification.ok ? EXIT.OK : EXIT.SCORE_NOT_FULL;
    }

    assertExecutable(lab, parsed.command);

    if (parsed.command === "project-status") {
      if (!isProjectLab(lab)) throw new LabError("TYPE_UNSUPPORTED", "project-status 仅支持 Project");
      const dirtyFiles: string[] =
        parsed.options["dirty-files"] === undefined
          ? []
          : (JSON.parse(String(parsed.options["dirty-files"])) as string[]);
      const result = await projectStatus(lab, target, dirtyFiles);
      if (json) console.log(JSON.stringify(createReport(parsed.command, lab, { result }), null, 2));
      else console.log(formatProject({ ...result, current: result } as never, { theme }));

      return EXIT.OK;
    }

    if (parsed.command === "build") {
      const compilation = isProjectLab(lab)
        ? await buildProject(lab, target, { taskId: parsed.options["task"] as string | undefined })
        : await compileTarget(lab, target);
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
          taskId: parsed.options["task"] as string | undefined,
          caseId: parsed.options["case"] as string | undefined,
        });
        const report = createReport(parsed.command, lab, { result: project });
        report.ok = !project.internalError;
        if (json) console.log(JSON.stringify(report, null, 2));
        else console.log(formatProject(project, { theme, command, labPath }));
        if (project.internalError) return EXIT.TOOL_ERROR;

        return parsed.command === "run" || project.automatedFull ? EXIT.OK : EXIT.SCORE_NOT_FULL;
      }
      const judged = await judgeProgram(lab, {
        target,
        caseId: parsed.options["case"] as string | undefined,
      });
      const internalError = judged.cases.some((item) => item.verdict === "IE");
      const report = createReport(parsed.command, lab, {
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
      report.ok = !internalError;
      if (json) console.log(JSON.stringify(report, null, 2));
      else console.log(formatJudge(judged, { theme, command, labPath }));
      if (internalError) return EXIT.TOOL_ERROR;

      return parsed.command === "run" || judged.score === judged.maxScore ? EXIT.OK : EXIT.SCORE_NOT_FULL;
    }

    if (parsed.command === "interactive") {
      const result = isProjectLab(lab)
        ? await interactiveProjectTask(lab, parsed.options["task"] as string | undefined, target)
        : await runInteractive(lab, target);

      return result.code;
    }

    if (parsed.command === "refresh-expected") {
      const refresh = isProjectLab(lab)
        ? await refreshProjectExpected(lab, {
            taskId: parsed.options["task"] as string | undefined,
            write: Boolean(parsed.options["write"]),
          })
        : await refreshExpected(lab, Boolean(parsed.options["write"]));
      const report = createReport("refresh-expected", lab, { refresh });
      if (json) console.log(JSON.stringify(report, null, 2));
      else console.log(formatRefresh(refresh, { write: Boolean(parsed.options["write"]), theme }));

      return refresh.changed && parsed.options["write"] === undefined ? EXIT.SCORE_NOT_FULL : EXIT.OK;
    }

    if (parsed.command === "pack") {
      if (parsed.options["profile"] !== "student")
        throw new LabError("ARGUMENT_INVALID", "pack 目前要求 --profile student");
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
    if (parsed?.options?.["json"] !== undefined) {
      console.log(
        JSON.stringify(
          {
            reportVersion: 1,
            command: parsed?.command ?? null,
            ok: false,
            error: { code: error.code, message: error.message, details: error.details },
          },
          null,
          2,
        ),
      );
    } else {
      const theme = createTheme({ stream: process.stderr, noColor: Boolean(parsed?.options?.["no-color"]) });
      console.error(formatError(error, theme));
    }

    return EXIT.TOOL_ERROR;
  }
}

process.exitCode = await main();
