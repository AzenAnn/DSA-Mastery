import type { CreatedLab } from "./scaffold.ts";
import type { LabError, LabReport, LabType, Theme } from "@dsa/lab-core";
import type {
  CompileResult,
  EnvironmentReport,
  VerifyResult,
  PublicBuild,
  ProjectRefreshResult,
  ProjectVerifyResult,
  ExpectedChange,
  RefreshResult,
} from "@dsa/lab-runner";
import { cleanTerminalText, createTheme } from "@dsa/lab-core";

const plain = (theme?: Theme): Theme => theme ?? createTheme({ color: false });

function checkLine(theme: Theme, label: string, passed: boolean, successText: string, failureText: string): string {
  return `${theme.heading(`${label}：`)}${passed ? theme.success(successText) : theme.danger(failureText)}`;
}

export function formatHelp(source?: Theme): string {
  const theme = plain(source);
  const rows = [
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
    ["clean", "只清理当前 Lab 的 .lab-cache"],
  ];

  return [
    theme.heading("DSA Mastery Lab CLI"),
    "",
    theme.heading("用法"),
    `  ${theme.command("pnpm lab <command> [lab-path|lab-id] [options]")}`,
    "",
    theme.heading("命令"),
    ...rows.map(([command, description]) => `  ${theme.cell(command, 18, theme.command)} ${description}`),
    "",
    theme.heading("通用选项"),
    `  ${theme.command("--json  --no-color")} ${theme.muted("（interactive 直接接管终端，不支持这两项）")}`,
    `  ${theme.command("new --type <type> --chapter <n> --slug <slug> [--order <n>]")}`,
    `  ${theme.command("locate <lab-id>")} ${theme.muted("（例如 02T3）")}`,
    `  ${theme.command("--case <id> --task <id> --target <student|solution>")}`,
  ].join("\n");
}

export function formatNew(created: CreatedLab, source?: Theme): string {
  const theme = plain(source);

  return `${theme.success("CREATED")} ${created.type} Lab · ${theme.info(created.labId)}\n${theme.heading("Order：")}${created.order}\n${theme.heading("Path：")}${theme.path(created.relativeRoot)}`;
}

export interface LocatedLab {
  id: string;
  type?: LabType;
  category?: string;
  relativePath: string;
}

export function formatLocate(lab: LocatedLab, source?: Theme): string {
  const theme = plain(source);

  return `${theme.success("FOUND")} ${theme.info(lab.id)}\n${theme.heading("Type：")}${lab.type ?? lab.category ?? "README-only"}\n${theme.heading("Path：")}${theme.path(lab.relativePath)}`;
}

export function formatValidate(report: LabReport, source?: Theme): string {
  const theme = plain(source);
  const quiz = report.quiz as { count: number; totalPoints: number } | undefined;
  const cases = report.cases as number | undefined;
  const tasks = report.tasks as number | undefined;
  const lines = [
    `${theme.success("VALIDATION PASS")} ${report.lab.id === undefined ? "" : `${theme.info(report.lab.id)} · `}${theme.path(report.lab.path)}`,
    `${theme.heading("类型：")}${report.lab.type} · Schema v${report.lab.schemaVersion}`,
  ];
  if (quiz)
    lines.push(`${theme.heading("题目：")}${quiz.count} 道 · ${theme.score(quiz.totalPoints, quiz.totalPoints)}`);
  if (cases !== undefined) lines.push(`${theme.heading("测试：")}${cases} 个 · ${theme.score(100, 100)}`);
  if (tasks !== undefined) lines.push(`${theme.heading("任务：")}${tasks} 个 · 权重 ${theme.score(100, 100)}`);

  return lines.join("\n");
}

export function formatDoctor(report: { environment: EnvironmentReport }, source?: Theme): string {
  const theme = plain(source);
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
    const minimum = tool.minimum === undefined ? "" : theme.muted(` (>= ${tool.minimum})`);
    lines.push(`${theme.cell(tool.name, 20, theme.heading)} ${theme.cell(status, 11, style)}${version}${minimum}`);
  }
  lines.push(
    "",
    `${theme.muted("GNU Make 为推荐项而非必装依赖；免 Make 入口：")} ${theme.command("pnpm lab run <lab-path>")}`,
  );
  for (const issue of environment.issues) lines.push(`${theme.danger("ISSUE")} ${issue}`);

  return lines.join("\n");
}

export function formatBuild(compilation: (CompileResult & { target?: string }) | PublicBuild, source?: Theme): string {
  const theme = plain(source);
  const built = compilation as CompileResult & { target?: string; phase?: "configure" | "build" };
  if (built.ok) {
    const lines = [`${theme.success("BUILD PASS")} ${built.target ?? "student"}`];
    if (built.executable) lines.push(`${theme.heading("Executable：")}${theme.path(built.executable)}`);

    return lines.join("\n");
  }
  const phase = built.phase ?? "compile";
  const phaseResult = (built as unknown as Record<string, { stdout?: string; stderr?: string }>)[phase] ?? built;
  const diagnostic = cleanTerminalText(phaseResult.stderr ?? phaseResult.stdout).trim();

  return [
    `${theme.danger("BUILD FAILED")} ${theme.verdict("CE")} · ${phase}`,
    diagnostic && theme.heading("诊断"),
    diagnostic,
  ]
    .filter(Boolean)
    .join("\n");
}

export type Verification =
  | { quiz: { count: number; totalPoints: number }; ok: boolean }
  | VerifyResult
  | ProjectVerifyResult;

export function formatVerify(type: LabType, verification: Verification, source?: Theme): string {
  const theme = plain(source);
  const lines = [`${theme.status(verification.ok ? "PASS" : "FAIL")} VERIFY · ${type}`];
  if (type === "quiz") {
    const quiz = (verification as { quiz: { count: number; totalPoints: number } }).quiz;
    lines.push(`${theme.success("PASS")} Quiz：${quiz.count} 道，${quiz.totalPoints} 分；manifest 与题目合同通过。`);
  } else if (type === "project") {
    const { solution, student } = verification as ProjectVerifyResult;
    lines.push(
      `${theme.heading("参考实现自动分：")}${theme.score(solution.automatedScore, solution.automatedMax)}`,
      `${theme.heading("学生骨架自动分：")}${theme.score(student.automatedScore, student.automatedMax)}`,
      `${theme.heading("人工待评分：")}${solution.manualPending ? theme.warning(solution.manualPending) : theme.success("0")}`,
    );
  } else {
    const { checks, drift } = verification as VerifyResult;
    lines.push(
      checkLine(theme, "参考实现", checks.solutionFullScore, "100/100", "失败"),
      checkLine(theme, "学生骨架编译", checks.studentCompiles, "可编译", "编译失败"),
      checkLine(theme, "学生骨架分数", checks.studentNotFullScore, "未误得满分", "错误地得到满分"),
      checkLine(theme, "标准输出", checks.expectedStable, "无漂移", `有 ${drift.changed} 处漂移`),
    );
  }

  return lines.join("\n");
}

function formatDiff(diff: string, theme: Theme): string {
  return cleanTerminalText(diff)
    .split(/\r?\n/)
    .map((line) => {
      if (line.startsWith("- ")) return theme.danger(line);
      if (line.startsWith("+ ")) return theme.success(line);

      return theme.muted(line);
    })
    .join("\n");
}

export function formatRefresh(
  refresh: RefreshResult | ProjectRefreshResult,
  { write = false, theme: source }: { write?: boolean; theme?: Theme } = {},
): string {
  const theme = plain(source);
  if (!refresh.changed) return `${theme.success("NO DRIFT")} 标准输出与参考实现一致，无需更新。`;
  const changes: ExpectedChange[] =
    "tasks" in refresh
      ? refresh.tasks.flatMap((task) =>
          task.refresh.changes.map((change) => ({ ...change, id: `${task.id}/${change.id}` })),
        )
      : refresh.changes;
  const lines = [
    `${write ? theme.success("EXPECTED UPDATED") : theme.warning("DRIFT PREVIEW")} ${refresh.changed} change(s)`,
  ];
  for (const change of changes) {
    lines.push("", `${theme.heading(change.id)} ${theme.path(change.expected)}`, formatDiff(change.diff, theme));
  }
  lines.push(
    "",
    write
      ? `${theme.success("WRITTEN")} 已更新 ${refresh.written} 个 .out 文件。`
      : `${theme.warning("PREVIEW ONLY")} 确认 diff 后加 ${theme.command("--write")} 才会覆盖 .out。`,
  );

  return lines.join("\n");
}

export function formatPack(packed: { packageRoot: string }, source?: Theme): string {
  const theme = plain(source);

  return `${theme.success("PACKAGE READY")} 学生包已生成\n${theme.heading("Path：")}${theme.path(packed.packageRoot)}`;
}

export function formatClean(cleaned: { cache: string }, source?: Theme): string {
  const theme = plain(source);

  return `${theme.success("CLEANED")} ${theme.path(cleaned.cache)}`;
}

export function formatError(error: LabError, source?: Theme): string {
  const theme = plain(source);

  return `${theme.danger(`[${error.code}]`)} ${cleanTerminalText(error.message)}`;
}
