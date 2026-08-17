#!/usr/bin/env node
import process from "node:process";
import { createReport, loadLab } from "./core.mjs";
import { inspectEnvironment } from "./doctor.mjs";
import { asLabError, EXIT, LabError } from "./errors.mjs";
import { compileTarget } from "./compiler.mjs";
import { formatJudge, judgeProgram, runInteractive } from "./judge.mjs";
import { cleanLab, packStudent, refreshExpected, verifyProgram } from "./operations.mjs";
import { buildProject, formatProject, interactiveProjectTask, refreshProjectExpected, scoreProject, verifyProject } from "./project.mjs";
import { createLab } from "./scaffold.mjs";

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
  return positional[0] ?? process.env.INIT_CWD ?? process.cwd();
}

function validateOptions(parsed) {
  const common = ["json", "no-color"];
  const byCommand = {
    new: [...common, "type", "chapter", "order", "slug"],
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
}

function humanValidate(report) {
  console.log(`Lab 校验通过：${report.lab.path}`);
  console.log(`类型：${report.lab.type} · Schema v${report.lab.schemaVersion}`);
  if (report.quiz) console.log(`题目：${report.quiz.count} 道 · 总分 ${report.quiz.totalPoints}`);
  if (report.cases) console.log(`测试：${report.cases} 个 · 总分 100`);
  if (report.tasks) console.log(`任务：${report.tasks} 个 · 权重 100`);
}

function humanDoctor(report) {
  console.log(`环境检查：${report.environment.ok ? "通过" : "未通过"}`);
  console.log(`平台：${report.environment.platform}/${report.environment.architecture} · Node ${report.environment.node}`);
  for (const tool of report.environment.tools) {
    const status = !tool.available ? "未找到" : tool.meetsMinimum ? `可用 ${tool.version}` : `版本过低 ${tool.version}`;
    console.log(`- ${tool.name}: ${status}${tool.minimum ? `（最低 ${tool.minimum}）` : ""}`);
  }
  console.log("GNU Make 为推荐项而非必装依赖；免 Make 入口：pnpm lab:run -- <lab-path>");
  for (const issue of report.environment.issues) console.log(`! ${issue}`);
}

function help() {
  console.log(`DSA Mastery Lab CLI

用法：node tools/lab/cli.mjs <command> [lab-path] [options]

命令：
  new       生成 quiz、program 或 project Lab
  doctor    检查当前 Lab 所需环境（只读，不安装软件）
  validate  校验 manifest、路径、题目、测试和任务依赖
  build     编译 student 或 solution 目标
  run       运行公开测试；未满分仍返回 0，适合 make run
  interactive 连接终端交互运行学生程序
  score     严格评分；未满分返回 1
  verify    验证参考实现、标准输出与学生骨架
  refresh-expected 预览参考输出漂移；加 --write 才覆盖
  pack      生成不含 solution 的独立学生包
  clean     只清理当前 Lab 的 .lab-cache

通用选项：--json  --no-color（interactive 直接接管终端，不支持这两项）
new 选项：--type <type> --chapter <n> --order <n> --slug <slug>
运行选项：--case <id> --task <id> --target <student|solution> --json --no-color`);
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
    if (!parsed.command || ["help", "--help", "-h"].includes(parsed.command)) {
      help();
      return EXIT.OK;
    }
    validateOptions(parsed);
    if (parsed.command === "new") {
      const created = await createLab(parsed.options);
      const report = { reportVersion: 1, command: "new", ok: true, lab: { path: created.labRoot, type: created.type } };
      if (parsed.options.json) console.log(JSON.stringify(report, null, 2));
      else console.log(`已创建 ${created.type} Lab：${created.relativeRoot}`);
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
      else humanValidate(report);
      return EXIT.OK;
    }
    if (parsed.command === "doctor") {
      const environment = await inspectEnvironment(lab);
      const report = createReport("doctor", lab, { environment });
      report.ok = environment.ok;
      if (parsed.options.json) console.log(JSON.stringify(report, null, 2));
      else humanDoctor(report);
      return environment.ok ? EXIT.OK : EXIT.TOOL_ERROR;
    }
    if (parsed.command === "build") {
      const compilation = lab.manifest.type === "project"
        ? await buildProject(lab, parsed.options.target ?? "student")
        : await compileTarget(lab, parsed.options.target ?? "student");
      const report = createReport("build", lab, { compilation });
      report.ok = compilation.ok;
      if (parsed.options.json) console.log(JSON.stringify(report, null, 2));
      else console.log(compilation.ok ? `编译通过：${compilation.executable}` : `编译失败（CE）\n${compilation.stderr || compilation.stdout}`);
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
        else console.log(formatProject(project));
        if (project.internalError) return EXIT.TOOL_ERROR;
        return parsed.command === "run" || project.automatedFull ? EXIT.OK : EXIT.SCORE_NOT_FULL;
      }
      const judged = await judgeProgram(lab, { target: parsed.options.target ?? "student", caseId: parsed.options.case });
      const report = reportJudge(parsed.command, lab, judged);
      report.ok = !judged.cases.some((item) => item.verdict === "IE");
      if (parsed.options.json) console.log(JSON.stringify(report, null, 2));
      else console.log(formatJudge(judged));
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
      else {
        if (lab.manifest.type === "quiz") {
          console.log(`Quiz：${verification.quiz.count} 道，${verification.quiz.totalPoints} 分；manifest 与题目合同通过。`);
        } else if (lab.manifest.type === "project") {
          console.log(`参考实现自动分：${verification.solution.automatedScore}/${verification.solution.automatedMax}`);
          console.log(`学生骨架自动分：${verification.student.automatedScore}/${verification.student.automatedMax}`);
          console.log(`人工待评分：${verification.solution.manualPending}`);
        } else {
          console.log(`参考实现：${verification.checks.solutionFullScore ? "100/100" : "失败"}`);
          console.log(`学生骨架：${verification.checks.studentCompiles ? "可编译" : "编译失败"}，${verification.checks.studentNotFullScore ? "未误得满分" : "错误地得到满分"}`);
          console.log(`标准输出：${verification.checks.expectedStable ? "无漂移" : `有 ${verification.drift.changed} 处漂移`}`);
        }
      }
      return verification.ok ? EXIT.OK : EXIT.SCORE_NOT_FULL;
    }
    if (parsed.command === "refresh-expected") {
      const refresh = lab.manifest.type === "project"
        ? await refreshProjectExpected(lab, { taskId: parsed.options.task, write: Boolean(parsed.options.write) })
        : await refreshExpected(lab, Boolean(parsed.options.write));
      const report = createReport("refresh-expected", lab, { refresh });
      if (parsed.options.json) console.log(JSON.stringify(report, null, 2));
      else if (!refresh.changed) console.log("标准输出与参考实现一致，无需更新。");
      else {
        const changes = refresh.tasks
          ? refresh.tasks.flatMap((task) => task.refresh.changes.map((change) => ({ ...change, id: `${task.id}/${change.id}` })))
          : refresh.changes;
        for (const change of changes) console.log(`${change.id}: ${change.expected}\n${change.diff}`);
        console.log(parsed.options.write ? `已更新 ${refresh.written} 个 .out 文件。` : "这是预览；确认 diff 后加 --write 才会覆盖 .out。 ");
      }
      return refresh.changed && !parsed.options.write ? EXIT.SCORE_NOT_FULL : EXIT.OK;
    }
    if (parsed.command === "pack") {
      if (parsed.options.profile !== "student") throw new LabError("ARGUMENT_INVALID", "pack 目前要求 --profile student");
      const packed = await packStudent(lab);
      const report = createReport("pack", lab, { package: packed });
      if (parsed.options.json) console.log(JSON.stringify(report, null, 2));
      else console.log(`学生包已生成：${packed.packageRoot}`);
      return EXIT.OK;
    }
    const cleaned = await cleanLab(lab);
    if (parsed.options.json) console.log(JSON.stringify(createReport("clean", lab, { cleaned }), null, 2));
    else console.log(`已清理：${cleaned.cache}`);
    return EXIT.OK;
  } catch (rawError) {
    const error = asLabError(rawError);
    const report = { reportVersion: 1, command: parsed?.command ?? null, ok: false, error: { code: error.code, message: error.message, details: error.details } };
    if (parsed?.options?.json) console.log(JSON.stringify(report, null, 2));
    else console.error(`[${error.code}] ${error.message}`);
    return EXIT.TOOL_ERROR;
  }
}

process.exitCode = await main();
