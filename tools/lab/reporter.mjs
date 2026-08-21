import { cleanTerminalText, createTheme } from "./terminal.mjs";

function plainTheme(theme) {
  return theme ?? createTheme({ color: false });
}

function externalDiagnostic(value) {
  return cleanTerminalText(value).trim();
}

function checkLine(theme, label, passed, successText, failureText) {
  const status = passed ? theme.success(successText) : theme.danger(failureText);
  return `${theme.heading(`${label}：`)}${status}`;
}

export function formatHelp(theme) {
  theme = plainTheme(theme);
  const rows = [
    ["new", "生成 quiz、program 或 project Lab"],
    ["doctor", "检查当前 Lab 所需环境（只读，不安装软件）"],
    ["validate", "校验 manifest、路径、题目、测试和任务依赖"],
    ["build", "编译 student 或 solution 目标"],
    ["run", "运行公开测试；未满分仍返回 0，适合 make run"],
    ["interactive", "连接终端交互运行学生程序"],
    ["score", "严格评分；未满分返回 1"],
    ["verify", "验证参考实现、标准输出与学生骨架"],
    ["refresh-expected", "预览参考输出漂移；加 --write 才覆盖"],
    ["pack", "生成不含 solution 的独立学生包"],
    ["clean", "只清理当前 Lab 的 .lab-cache"],
  ];
  const lines = [
    theme.heading("DSA Mastery Lab CLI"),
    "",
    theme.heading("用法"),
    `  ${theme.command("node tools/lab/cli.mjs <command> [lab-path] [options]")}`,
    "",
    theme.heading("命令"),
    ...rows.map(([command, description]) => `  ${theme.cell(command, 18, theme.command)} ${description}`),
    "",
    theme.heading("通用选项"),
    `  ${theme.command("--json  --no-color")} ${theme.muted("（interactive 直接接管终端，不支持这两项）")}`,
    `  ${theme.command("new --type <type> --chapter <n> --order <n> --slug <slug>")}`,
    `  ${theme.command("--case <id> --task <id> --target <student|solution>")}`,
  ];
  return lines.join("\n");
}

export function formatNew(created, theme) {
  theme = plainTheme(theme);
  return `${theme.success("CREATED")} ${created.type} Lab\n${theme.heading("Path：")}${theme.path(created.relativeRoot)}`;
}

export function formatValidate(report, theme) {
  theme = plainTheme(theme);
  const lines = [
    `${theme.success("VALIDATION PASS")} ${theme.path(report.lab.path)}`,
    `${theme.heading("类型：")}${report.lab.type} · Schema v${report.lab.schemaVersion}`,
  ];
  if (report.quiz) lines.push(`${theme.heading("题目：")}${report.quiz.count} 道 · ${theme.score(report.quiz.totalPoints, report.quiz.totalPoints)}`);
  if (report.cases) lines.push(`${theme.heading("测试：")}${report.cases} 个 · ${theme.score(100, 100)}`);
  if (report.tasks) lines.push(`${theme.heading("任务：")}${report.tasks} 个 · 权重 ${theme.score(100, 100)}`);
  return lines.join("\n");
}

export function formatDoctor(report, theme) {
  theme = plainTheme(theme);
  const environment = report.environment;
  const lines = [
    `${theme.status(environment.ok ? "PASS" : "FAIL")} 环境检查`,
    `${theme.heading("平台：")}${theme.info(`${environment.platform}/${environment.architecture}`)} · Node ${environment.node}`,
    "",
  ];
  for (const tool of environment.tools) {
    const status = !tool.available ? "NOT FOUND" : tool.meetsMinimum ? "AVAILABLE" : "TOO OLD";
    const style = tool.name === "GNU Make" && !tool.available ? theme.muted : theme.status;
    const version = tool.available ? ` ${tool.version}` : "";
    const minimum = tool.minimum ? theme.muted(` (>= ${tool.minimum})`) : "";
    lines.push(`${theme.cell(tool.name, 20, theme.heading)} ${theme.cell(status, 11, style)}${version}${minimum}`);
  }
  lines.push("", `${theme.muted("GNU Make 为推荐项而非必装依赖；免 Make 入口：")} ${theme.command("pnpm lab:run -- <lab-path>")}`);
  for (const issue of environment.issues) lines.push(`${theme.danger("ISSUE")} ${issue}`);
  return lines.join("\n");
}

export function formatBuild(compilation, theme) {
  theme = plainTheme(theme);
  if (compilation.ok) {
    const lines = [`${theme.success("BUILD PASS")} ${compilation.target ?? "student"}`];
    if (compilation.executable) lines.push(`${theme.heading("Executable：")}${theme.path(compilation.executable)}`);
    return lines.join("\n");
  }
  const phase = compilation.phase ?? "compile";
  const phaseResult = compilation[phase] ?? compilation;
  const diagnostic = externalDiagnostic(phaseResult.stderr || phaseResult.stdout);
  return [
    `${theme.danger("BUILD FAILED")} ${theme.verdict("CE")} · ${phase}`,
    diagnostic && `${theme.heading("诊断")}`,
    diagnostic,
  ].filter(Boolean).join("\n");
}

export function formatVerify(type, verification, theme) {
  theme = plainTheme(theme);
  const lines = [`${theme.status(verification.ok ? "PASS" : "FAIL")} VERIFY · ${type}`];
  if (type === "quiz") {
    lines.push(`${theme.success("PASS")} Quiz：${verification.quiz.count} 道，${verification.quiz.totalPoints} 分；manifest 与题目合同通过。`);
  } else if (type === "project") {
    lines.push(
      `${theme.heading("参考实现自动分：")}${theme.score(verification.solution.automatedScore, verification.solution.automatedMax)}`,
      `${theme.heading("学生骨架自动分：")}${theme.score(verification.student.automatedScore, verification.student.automatedMax)}`,
      `${theme.heading("人工待评分：")}${verification.solution.manualPending ? theme.warning(verification.solution.manualPending) : theme.success("0")}`,
    );
  } else {
    lines.push(
      checkLine(theme, "参考实现", verification.checks.solutionFullScore, "100/100", "失败"),
      checkLine(theme, "学生骨架编译", verification.checks.studentCompiles, "可编译", "编译失败"),
      checkLine(theme, "学生骨架分数", verification.checks.studentNotFullScore, "未误得满分", "错误地得到满分"),
      checkLine(theme, "标准输出", verification.checks.expectedStable, "无漂移", `有 ${verification.drift.changed} 处漂移`),
    );
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

export function formatRefresh(refresh, { write = false, theme } = {}) {
  theme = plainTheme(theme);
  if (!refresh.changed) return `${theme.success("NO DRIFT")} 标准输出与参考实现一致，无需更新。`;
  const changes = refresh.tasks
    ? refresh.tasks.flatMap((task) => task.refresh.changes.map((change) => ({ ...change, id: `${task.id}/${change.id}` })))
    : refresh.changes;
  const lines = [`${write ? theme.success("EXPECTED UPDATED") : theme.warning("DRIFT PREVIEW")} ${refresh.changed} change(s)`];
  for (const change of changes) {
    lines.push("", `${theme.heading(change.id)} ${theme.path(change.expected)}`, formatDiff(change.diff, theme));
  }
  lines.push("", write
    ? `${theme.success("WRITTEN")} 已更新 ${refresh.written} 个 .out 文件。`
    : `${theme.warning("PREVIEW ONLY")} 确认 diff 后加 ${theme.command("--write")} 才会覆盖 .out。`);
  return lines.join("\n");
}

export function formatPack(packed, theme) {
  theme = plainTheme(theme);
  return `${theme.success("PACKAGE READY")} 学生包已生成\n${theme.heading("Path：")}${theme.path(packed.packageRoot)}`;
}

export function formatClean(cleaned, theme) {
  theme = plainTheme(theme);
  return `${theme.success("CLEANED")} ${theme.path(cleaned.cache)}`;
}

export function formatError(error, theme) {
  theme = plainTheme(theme);
  return `${theme.danger(`[${error.code}]`)} ${cleanTerminalText(error.message)}`;
}
