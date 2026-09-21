import type { OutputStream, Segment, Styles } from "./terminal.ts";
import process from "node:process";
import { renderBanner, renderPixelBanner } from "./banner.ts";
import { clampWidth, displayWidth, frameLine, frameSegments, supportsColor, truncate } from "./terminal.ts";

export type StageStatus = "pending" | "running" | "success" | "warning" | "failed" | "skipped";

export interface Stage {
  id: string;
  name: string;
  status: StageStatus;
  message: string;
}

const STATUS_ICON: Record<StageStatus, string> = {
  pending: "·",
  running: "▶",
  success: "✓",
  warning: "⚠",
  failed: "✗",
  skipped: "–",
};

const STATUS_LABEL: Record<StageStatus, string> = {
  pending: "待处理",
  running: "进行中",
  success: "完成",
  warning: "警告",
  failed: "失败",
  skipped: "跳过",
};

const STATUS_STYLES: Record<StageStatus, Styles> = {
  pending: "dim",
  running: ["bold", "cyan"],
  success: ["bold", "green"],
  warning: ["bold", "yellow"],
  failed: ["bold", "red"],
  skipped: "dim",
};

interface SummaryField {
  label: string;
  value: string;
}

export function renderTuiSummary({
  summary = "",
  width = 88,
  color = false,
}: { summary?: string; width?: number; color?: boolean } = {}): string {
  const safeWidth = clampWidth(width);
  const innerWidth = safeWidth - 4;
  const sourceLines = String(summary ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (!sourceLines.length) return "";

  const headline = sourceLines.shift()!;
  const metadata: string[] = [];
  const stages: { icon: string; name: string; message: string; status: StageStatus }[] = [];
  const resultDetails: string[] = [];
  for (const line of sourceLines) {
    const stage = parseSummaryStage(line);
    if (stage) stages.push(stage);
    else if (/^(?:仓库|日志|下一步)[：:]/u.test(line)) resultDetails.push(line);
    else metadata.push(line);
  }

  const success = headline.includes("成功");
  const matchedLabel = headline.match(/^DSA Mastery 环境配置[：:](.*)$/u)?.[1].trimStart();
  const headlineLabel = matchedLabel === undefined || matchedLabel === "" ? headline : matchedLabel;
  const metadataFields = metadata.map(parseSummaryField).filter((field): field is SummaryField => Boolean(field));
  const resultFields = resultDetails.map(parseSummaryField).filter((field): field is SummaryField => Boolean(field));
  const metadataLabelWidth = Math.max(4, ...metadataFields.map((field) => displayWidth(field.label)));
  const resultLabelWidth = Math.max(4, ...resultFields.map((field) => displayWidth(field.label)));
  const lines = [
    `╭${"─".repeat(safeWidth - 2)}╮`,
    frameLine(`配置结果 · ${headlineLabel}`, innerWidth, ["bold", success ? "green" : "red"], color),
  ];
  for (const field of metadataFields) {
    lines.push(frameSegments(alignedSummarySegments(field, metadataLabelWidth, innerWidth), innerWidth, color));
  }

  if (stages.length) {
    lines.push(`├${"─".repeat(safeWidth - 2)}┤`);
    lines.push(frameLine("执行阶段", innerWidth, ["bold", "magenta"], color));
    const labelWidth = Math.max(14, ...stages.map((stage) => displayWidth(`${stage.icon} ${stage.name}`)));
    for (const stage of stages) {
      const label = `${stage.icon} ${stage.name}`;
      const padding = " ".repeat(Math.max(0, labelWidth - displayWidth(label)));
      lines.push(
        frameSegments(
          [
            { value: `${label}${padding}`, styles: STATUS_STYLES[stage.status] },
            { value: stage.message ? `  ${stage.message}` : "", styles: "dim" },
          ],
          innerWidth,
          color,
        ),
      );
    }
  }

  if (resultDetails.length) {
    lines.push(`├${"─".repeat(safeWidth - 2)}┤`);
    lines.push(frameLine("输出信息", innerWidth, ["bold", "magenta"], color));
    for (const field of resultFields) {
      const valueStyles: Styles = field.label === "下一步" ? ["bold", "yellow"] : "dim";
      lines.push(
        frameSegments(alignedSummarySegments(field, resultLabelWidth, innerWidth, valueStyles), innerWidth, color),
      );
    }
  }
  lines.push(`╰${"─".repeat(safeWidth - 2)}╯`);

  return lines.join("\n");
}

const SUMMARY_ICON_STATUS: Record<string, StageStatus> = {
  "✓": "success",
  "⚠": "warning",
  "–": "skipped",
  "✗": "failed",
  "▶": "running",
  "·": "pending",
};

function parseSummaryStage(
  line: string,
): { icon: string; name: string; message: string; status: StageStatus } | undefined {
  const match = line.match(/^([✓⚠–✗·▶])\s+(\S[^：:]*)[：:](.*)$/u);
  if (!match) return undefined;

  return {
    icon: match[1],
    name: match[2],
    message: match[3].trimStart(),
    status: SUMMARY_ICON_STATUS[match[1]] ?? "pending",
  };
}

function parseSummaryField(line: string): SummaryField | undefined {
  const match = line.match(/^([^：:]+)[：:](.*)$/u);
  if (!match) return undefined;

  return { label: match[1].trim() === "Profile" ? "方案" : match[1].trim(), value: match[2].trimStart() };
}

function alignedSummarySegments(
  field: SummaryField,
  labelWidth: number,
  innerWidth: number,
  valueStyles: Styles = "dim",
): Segment[] {
  const padding = " ".repeat(Math.max(0, labelWidth - displayWidth(field.label)));
  const prefix = `${field.label}${padding}  `;

  return [
    { value: prefix, styles: ["bold", "cyan"] },
    { value: truncate(field.value, Math.max(0, innerWidth - displayWidth(prefix))), styles: valueStyles },
  ];
}

export function createStageState(names: readonly unknown[]): Stage[] {
  return names.map((name) => ({ id: String(name), name: String(name), status: "pending" as const, message: "" }));
}

function progressSummary(stages: readonly Stage[]): { completed: number; total: number; percent: number } {
  const total = stages.length;
  const completed = stages.filter((stage) => ["success", "warning", "skipped"].includes(stage.status)).length;

  return { completed, total, percent: total === 0 ? 100 : Math.round((completed / total) * 100) };
}

export function renderPlain({
  title = "DSA Mastery 环境配置",
  profile = "",
  stages = [],
  width = 80,
}: { title?: string; profile?: string; stages?: readonly Stage[]; width?: number } = {}): string {
  const safeWidth = clampWidth(width);
  const summary = progressSummary(stages);
  const lines = [
    title,
    profile ? `Profile：${profile}` : "",
    `进度：${summary.completed}/${summary.total} · ${summary.percent}%`,
  ];
  for (const stage of stages) {
    const message = stage.message ? ` · ${stage.message}` : "";
    lines.push(
      `${STATUS_ICON[stage.status] ?? "·"} ${stage.name} · ${STATUS_LABEL[stage.status] ?? stage.status}${message}`,
    );
  }

  return lines
    .filter(Boolean)
    .map((line) => truncate(line, safeWidth))
    .join("\n");
}

export function renderTuiFrame({
  title = "DSA Mastery 环境配置",
  profile = "",
  stages = [],
  width = 80,
  color = false,
}: { title?: string; profile?: string; stages?: readonly Stage[]; width?: number; color?: boolean } = {}): string {
  const safeWidth = clampWidth(width);
  const innerWidth = safeWidth - 4;
  const summary = progressSummary(stages);
  const barWidth = Math.max(8, innerWidth - 18);
  const filled = Math.round((summary.percent / 100) * barWidth);
  const empty = Math.max(0, barWidth - filled);
  const lines = [
    ...renderBanner({
      width: safeWidth,
      subtitle: profile ? `本地环境配置 · ${profile}` : "本地环境配置",
      color,
    }).split("\n"),
    "",
    `╭${"─".repeat(safeWidth - 2)}╮`,
    frameLine(`${title}${profile ? ` · ${profile}` : ""}`, innerWidth, ["bold", "cyan"], color),
    frameSegments(
      [
        { value: "进度 ", styles: ["bold", "cyan"] },
        { value: "█".repeat(filled), styles: ["bold", "green"] },
        { value: "░".repeat(empty), styles: "dim" },
        { value: ` ${summary.percent}% (${summary.completed}/${summary.total})`, styles: "dim" },
      ],
      innerWidth,
      color,
    ),
    `├${"─".repeat(safeWidth - 2)}┤`,
  ];
  for (const stage of stages) {
    const message = stage.message ? ` · ${stage.message}` : "";
    lines.push(
      frameLine(
        `${STATUS_ICON[stage.status] ?? "·"} ${stage.name} · ${STATUS_LABEL[stage.status] ?? stage.status}${message}`,
        innerWidth,
        STATUS_STYLES[stage.status],
        color,
      ),
    );
  }
  lines.push(`╰${"─".repeat(safeWidth - 2)}╯`);

  return lines.join("\n");
}

export type UiMode = "tui" | "plain";

function resolveUiMode({
  mode = "auto",
  stdout = process.stdout,
  json = false,
  nonInteractive = false,
}: { mode?: string; stdout?: { isTTY?: boolean }; json?: boolean; nonInteractive?: boolean } = {}): UiMode {
  if (json || nonInteractive || mode === "plain") return "plain";
  const tty = Boolean(stdout?.isTTY);
  const disabled = Boolean(process.env.NO_COLOR) || process.env.TERM === "dumb";

  return (mode === "tui" || mode === "auto") && tty && !disabled ? "tui" : "plain";
}

export interface ProgressUI {
  mode: UiMode;
  stages: Stage[];
  update: (id: string, status: StageStatus, message?: string) => Stage;
  render: () => string;
  start: () => void;
  finish: (options?: { ok?: boolean; summary?: string }) => void;
}

export function createProgressUI({
  mode = "auto",
  stdout = process.stdout,
  title = "DSA Mastery 环境配置",
  profile = "",
  stageNames = [],
  json = false,
  nonInteractive = false,
  spinner = true,
}: {
  mode?: string;
  stdout?: OutputStream;
  title?: string;
  profile?: string;
  stageNames?: readonly string[];
  json?: boolean;
  nonInteractive?: boolean;
  spinner?: boolean;
} = {}): ProgressUI {
  const stages = createStageState(stageNames);
  const resolvedMode = resolveUiMode({ mode, stdout, json, nonInteractive });
  let started = false;
  let timer: NodeJS.Timeout | undefined;
  let currentFrame = "";
  const frameWidth = (): number => Math.max(28, Number(stdout?.columns) || 80);

  const ui: ProgressUI = {
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
      const frame =
        resolvedMode === "tui"
          ? renderTuiFrame({ title, profile, stages, width, color: supportsColor(stdout) })
          : renderPlain({ title, profile, stages, width });
      if (resolvedMode === "tui" && currentFrame) stdout.write("\u001B[2J\u001B[H");
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
      timer = undefined;
      started = true;
      ui.render();
      if (summary && resolvedMode === "tui") {
        stdout.write(`\n${renderTuiSummary({ summary, width: frameWidth(), color: supportsColor(stdout) })}\n`);
      }
      if (ok && resolvedMode === "tui") {
        stdout.write(`\n${renderPixelBanner({ width: frameWidth(), color: supportsColor(stdout) })}\n`);
      }
      started = false;
    },
  };

  return ui;
}
