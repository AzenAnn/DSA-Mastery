import type { ProfileName } from "@dsa/lab-core";
import process from "node:process";
import { cleanTerminalText } from "@dsa/lab-core";

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

const ANSI_STYLE = {
  reset: "\u001B[0m",
  bold: "\u001B[1m",
  dim: "\u001B[2m",
  cyan: "\u001B[36m",
  green: "\u001B[32m",
  yellow: "\u001B[33m",
  red: "\u001B[31m",
  magenta: "\u001B[35m",
  brightRed: "\u001B[91m",
  brightYellow: "\u001B[93m",
  brightBlue: "\u001B[94m",
} as const;

type StyleName = keyof typeof ANSI_STYLE;
type Styles = StyleName | readonly StyleName[] | undefined;

interface Segment {
  value: string;
  styles?: Styles;
}

const STATUS_STYLES: Record<StageStatus, Styles> = {
  pending: "dim",
  running: ["bold", "cyan"],
  success: ["bold", "green"],
  warning: ["bold", "yellow"],
  failed: ["bold", "red"],
  skipped: "dim",
};

const PIXEL_GLYPHS: Record<string, readonly string[]> = {
  D: ["███  ", "█  █ ", "█  █ ", "█  █ ", "███  "],
  S: [" ███ ", "█    ", " ███ ", "    █", "███  "],
  A: [" ███ ", "█   █", "█████", "█   █", "█   █"],
  M: ["█   █", "██ ██", "█ █ █", "█   █", "█   █"],
  T: ["█████", "  █  ", "  █  ", "  █  ", "  █  "],
  E: ["████ ", "█    ", "████ ", "█    ", "████ "],
  R: ["████ ", "█   █", "████ ", "█ █  ", "█  ██"],
  Y: ["█   █", " █ █ ", "  █  ", "  █  ", "  █  "],
};

const PIXEL_WORDS: readonly { text: string; styles: readonly StyleName[] }[] = [
  { text: "DSA", styles: ["brightRed", "brightYellow", "brightBlue"] },
  { text: "MASTERY", styles: ["dim", "dim", "dim", "dim", "dim", "dim", "dim"] },
];

export interface InstallChoice {
  id: string;
  label: string;
  description: string;
  detail: string;
  profile?: ProfileName;
  group: string;
  defaultSelected: boolean;
  required?: boolean;
  optional?: boolean;
  requires?: readonly string[];
}

export const INSTALL_CHOICES: readonly InstallChoice[] = [
  {
    id: "runtime",
    label: "基础运行环境",
    description: "启动器和课程工具所需的 Git、Node.js、pnpm",
    detail: "必选。启动器需要它来下载仓库、安装依赖和运行课程工具。",
    profile: "runtime",
    group: "基础环境",
    defaultSelected: true,
    required: true,
  },
  {
    id: "program",
    label: "Program Lab C++ 环境",
    description: "编译并运行基础 C++ 练习（推荐）",
    detail: "准备 Apple Clang、MSVC 或其他受支持的 C++ 编译器。",
    profile: "basic",
    group: "课程环境",
    defaultSelected: true,
  },
  {
    id: "project",
    label: "Project Lab / CMake 环境",
    description: "运行需要 CMake 的综合项目",
    detail: "准备 CMake，并自动勾选 Program Lab。",
    profile: "full",
    group: "课程环境",
    defaultSelected: false,
    requires: ["program"],
  },
  {
    id: "vscode",
    label: "VS Code 编辑器",
    description: "用图形界面编写和运行代码",
    detail: "可选，不影响命令行 Lab 使用。",
    group: "编辑器与扩展",
    defaultSelected: false,
    optional: true,
  },
  {
    id: "cpp-extension",
    label: "C/C++ 代码扩展",
    description: "VS Code 的补全、跳转和调试支持",
    detail: "需要先安装 VS Code。",
    group: "编辑器与扩展",
    defaultSelected: false,
    optional: true,
    requires: ["vscode"],
  },
  {
    id: "cmake-extension",
    label: "CMake Tools 扩展",
    description: "在 VS Code 中管理 Project / CMake",
    detail: "需要先选择 Project / CMake 和 VS Code。",
    group: "编辑器与扩展",
    defaultSelected: false,
    optional: true,
    requires: ["project", "vscode"],
  },
];

const CHOICE_BY_ID = new Map(INSTALL_CHOICES.map((choice) => [choice.id, choice]));

export type ChoiceKey = "up" | "down" | "left" | "right" | "space" | "enter" | "escape" | "q" | "j" | "k";

const CHOICE_ARROW_KEYS: readonly (readonly [string, ChoiceKey])[] = [
  ["\u001B[A", "up"],
  ["\u001B[B", "down"],
  ["\u001B[C", "right"],
  ["\u001B[D", "left"],
  ["\u001BOA", "up"],
  ["\u001BOB", "down"],
  ["\u001BOC", "right"],
  ["\u001BOD", "left"],
];

export type Selection = Set<string>;

export interface SelectionOptions {
  profile: ProfileName;
  installVscode: boolean;
  skipVscode: boolean;
  installCppExtension: boolean;
  installCmakeExtension: boolean;
  selection: string[];
}

export function createInstallSelection(overrides: Record<string, boolean> = {}): Selection {
  const selected = new Set(INSTALL_CHOICES.filter((choice) => choice.defaultSelected).map((choice) => choice.id));
  for (const [id, value] of Object.entries(overrides)) {
    if (!CHOICE_BY_ID.has(id)) continue;
    if (value) selected.add(id);
    else selected.delete(id);
  }

  return normalizeInstallSelection(selected);
}

export function normalizeInstallSelection(selection: Iterable<string> | undefined): Selection {
  const selected = new Set(selection ?? []);
  selected.add("runtime");
  let changed = true;
  while (changed) {
    changed = false;
    for (const choice of INSTALL_CHOICES) {
      if (!selected.has(choice.id)) continue;
      for (const required of choice.requires ?? []) {
        if (!selected.has(required)) {
          selected.add(required);
          changed = true;
        }
      }
    }
  }

  return selected;
}

function removeChoiceAndDependents(selected: Selection, id: string): void {
  selected.delete(id);
  for (const choice of INSTALL_CHOICES) {
    if (choice.requires?.includes(id)) removeChoiceAndDependents(selected, choice.id);
  }
}

export function selectionToOptions(selection: Iterable<string> | undefined): SelectionOptions {
  const normalized = normalizeInstallSelection(selection);
  const vscode = normalized.has("vscode");

  return {
    profile: normalized.has("project") ? "full" : normalized.has("program") ? "basic" : "runtime",
    installVscode: vscode,
    skipVscode: !vscode,
    installCppExtension: normalized.has("cpp-extension"),
    installCmakeExtension: normalized.has("cmake-extension"),
    selection: INSTALL_CHOICES.filter((choice) => normalized.has(choice.id)).map((choice) => choice.id),
  };
}

export function choiceSelectionSummary(selection: Iterable<string> | undefined): string[] {
  const normalized = normalizeInstallSelection(selection);

  return INSTALL_CHOICES.filter((choice) => normalized.has(choice.id)).map((choice) => choice.label);
}

export type ChoiceAction = "move" | "toggle" | "locked" | "confirm" | "cancel" | "noop";

export function handleChoiceKey(
  key: ChoiceKey,
  cursor: number,
  selection: Iterable<string> | undefined,
): { cursor: number; selection: Selection; action: ChoiceAction } {
  const selected = normalizeInstallSelection(selection);
  const last = INSTALL_CHOICES.length - 1;
  if (key === "up" || key === "k") return { cursor: Math.max(0, cursor - 1), selection: selected, action: "move" };
  if (key === "down" || key === "j") return { cursor: Math.min(last, cursor + 1), selection: selected, action: "move" };
  if (key === "space") {
    const choice: InstallChoice | undefined = INSTALL_CHOICES[cursor];
    if (choice === undefined) return { cursor, selection: selected, action: "noop" };
    if (choice.required) return { cursor, selection: selected, action: "locked" };
    if (selected.has(choice.id)) {
      removeChoiceAndDependents(selected, choice.id);
    } else {
      const normalized = normalizeInstallSelection(new Set([...selected, choice.id]));
      selected.clear();
      for (const id of normalized) selected.add(id);
    }
    if (choice.id === "program" && !selected.has("program")) removeChoiceAndDependents(selected, "program");

    return { cursor, selection: selected, action: "toggle" };
  }
  if (key === "enter") return { cursor, selection: selected, action: "confirm" };
  if (key === "escape" || key === "q") return { cursor, selection: selected, action: "cancel" };

  return { cursor, selection: selected, action: "noop" };
}

export function renderBanner({
  width = 88,
  subtitle = "本地实验环境安装向导",
  color = false,
}: { width?: number; subtitle?: string; color?: boolean } = {}): string {
  const safeWidth = clampWidth(width);

  return [
    `╭${"─".repeat(safeWidth - 2)}╮`,
    frameLine(`◆ DSA MASTERY  ·  ${subtitle}`, safeWidth - 4, ["bold", "cyan"], color),
    `╰${"─".repeat(safeWidth - 2)}╯`,
  ].join("\n");
}

export function renderPixelBanner({ width = 88, color = false }: { width?: number; color?: boolean } = {}): string {
  const safeWidth = clampWidth(width);
  const innerWidth = safeWidth - 4;
  const artWidth = displayWidth(
    pixelRowSegments(0)
      .map((segment) => segment.value)
      .join(""),
  );
  if (innerWidth < artWidth) {
    return [
      `╭${"─".repeat(safeWidth - 2)}╮`,
      frameSegments(
        [
          { value: "◆ " },
          { value: "D", styles: "brightRed" },
          { value: "S", styles: "brightYellow" },
          { value: "A", styles: "brightBlue" },
          { value: " MASTERY", styles: "dim" },
        ],
        innerWidth,
        color,
      ),
      `╰${"─".repeat(safeWidth - 2)}╯`,
    ].join("\n");
  }
  const leftPadding = Math.floor((innerWidth - artWidth) / 2);
  const rightPadding = innerWidth - artWidth - leftPadding;
  const lines = [`╭${"─".repeat(safeWidth - 2)}╮`];
  for (let row = 0; row < 5; row += 1) {
    lines.push(
      frameSegments(
        [{ value: " ".repeat(leftPadding) }, ...pixelRowSegments(row), { value: " ".repeat(rightPadding) }],
        innerWidth,
        color,
      ),
    );
  }
  lines.push(`╰${"─".repeat(safeWidth - 2)}╯`);

  return lines.join("\n");
}

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

function pixelRowSegments(row: number): Segment[] {
  const segments: Segment[] = [];
  for (const [wordIndex, word] of PIXEL_WORDS.entries()) {
    if (wordIndex > 0) segments.push({ value: "   " });
    for (const [letterIndex, letter] of [...word.text].entries()) {
      if (letterIndex > 0) segments.push({ value: " " });
      segments.push({ value: PIXEL_GLYPHS[letter][row], styles: word.styles[letterIndex] });
    }
  }

  return segments;
}

export function renderChoiceMenu({
  title = "配置 DSA Mastery",
  subtitle = "用 ↑↓ 移动，空格勾选，Enter 开始",
  choices = INSTALL_CHOICES,
  selection = createInstallSelection(),
  cursor = 0,
  width = 88,
  color = false,
}: {
  title?: string;
  subtitle?: string;
  choices?: readonly InstallChoice[];
  selection?: Iterable<string>;
  cursor?: number;
  width?: number;
  color?: boolean;
} = {}): string {
  const safeWidth = clampWidth(width);
  const innerWidth = safeWidth - 4;
  const normalized = normalizeInstallSelection(selection);
  const lines = [
    ...renderBanner({ width: safeWidth, subtitle: "本地实验环境安装向导", color }).split("\n"),
    "",
    `╭${"─".repeat(safeWidth - 2)}╮`,
    frameLine(title, innerWidth, ["bold", "cyan"], color),
    frameLine(subtitle, innerWidth, "dim", color),
    `├${"─".repeat(safeWidth - 2)}┤`,
  ];
  let previousGroup: string | undefined;
  choices.forEach((choice, index) => {
    if (choice.group !== previousGroup) {
      if (previousGroup !== undefined) lines.push(frameLine("", innerWidth));
      lines.push(frameLine(`▌ ${choice.group}`, innerWidth, ["bold", "magenta"], color));
      previousGroup = choice.group;
    }
    const prefix = index === cursor ? "▶" : " ";
    const checkbox = normalized.has(choice.id) ? "☑" : "☐";
    const lock = choice.required ? " · 必选" : "";
    const choiceStyle: Styles =
      index === cursor ? ["bold", "cyan"] : choice.required ? "yellow" : normalized.has(choice.id) ? "green" : "dim";
    lines.push(frameLine(`${prefix} ${checkbox} ${choice.label}${lock}`, innerWidth, choiceStyle, color));
    lines.push(frameLine(`  ${choice.description}`, innerWidth, "dim", color));
  });
  const active = choices[cursor];
  if (active?.detail) {
    lines.push(frameLine("", innerWidth));
    lines.push(frameLine(`▸ 说明：${active.detail}`, innerWidth, "dim", color));
  }
  const plan = selectionToOptions(normalized);
  const planLabel =
    plan.profile === "runtime"
      ? "runtime（仅课程工具）"
      : plan.profile === "full"
        ? "full（Program + Project）"
        : "basic（Program）";
  lines.push(frameLine(`▸ 当前方案：${planLabel}`, innerWidth, plan.profile === "full" ? "green" : "cyan", color));
  lines.push(`├${"─".repeat(safeWidth - 2)}┤`);
  lines.push(frameLine("↑↓/jk 移动   空格 选择/取消   Enter 开始   q 退出", innerWidth, "dim", color));
  lines.push(`╰${"─".repeat(safeWidth - 2)}╯`);

  return lines.join("\n");
}

export function decodeChoiceInput(buffer: unknown): ChoiceKey[] {
  return decodeChoiceInputInternal(String(buffer ?? "")).actions;
}

function decodeChoiceInputInternal(
  value: string,
  { deferIncomplete = false }: { deferIncomplete?: boolean } = {},
): { actions: ChoiceKey[]; pending: string } {
  const actions: ChoiceKey[] = [];
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
    if (character === "" || character === "\u001B") actions.push("escape");
    else if (character === " ") actions.push("space");
    else if (character === "\r" || character === "\n") actions.push("enter");
    else if (character.toLowerCase() === "q") actions.push("q");
    else if (character.toLowerCase() === "j") actions.push("j");
    else if (character.toLowerCase() === "k") actions.push("k");
    index += 1;
  }

  return { actions, pending };
}

// 只声明真正用到的成员：process.stdin/stdout 依旧可以直接传进来，测试也不必伪造整个 Node 流。
export interface InputStream {
  isTTY?: boolean;
  isRaw?: boolean;
  setRawMode?: (mode: boolean) => unknown;
  resume?: () => unknown;
  pause?: () => unknown;
  on: (event: "data", listener: (chunk: unknown) => void) => unknown;
  off?: (event: "data", listener: (chunk: unknown) => void) => unknown;
}

export interface OutputStream {
  isTTY?: boolean;
  columns?: number;
  write: (value: string) => unknown;
}

/** cooked 模式下读一行；终端自己负责回显，这里只把数据攒到换行为止。 */
export function promptLine(question: string, input: InputStream, output: OutputStream): Promise<string> {
  output.write(question);

  return new Promise((resolve) => {
    let buffer = "";
    const onData = (chunk: unknown): void => {
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

export async function promptInstallSelection({
  input = process.stdin,
  output = process.stdout,
  initialSelection = createInstallSelection(),
  title = "配置 DSA Mastery",
}: {
  input?: InputStream;
  output?: OutputStream;
  initialSelection?: Iterable<string>;
  title?: string;
} = {}): Promise<SelectionOptions & { cancelled: boolean }> {
  if (!input?.isTTY || !output?.isTTY) return { cancelled: false, ...selectionToOptions(initialSelection) };
  let cursor = Math.min(1, INSTALL_CHOICES.length - 1);
  let selection = normalizeInstallSelection(initialSelection);
  const previousRawMode = input.isRaw;
  let inputBuffer = "";
  let rendered = false;
  const color = supportsColor(output);
  const render = (): void => {
    if (rendered) output.write("\u001B[2J\u001B[H");
    output.write(`${renderChoiceMenu({ title, selection, cursor, width: output.columns ?? 88, color })}\n`);
    rendered = true;
  };
  input.setRawMode?.(true);
  input.resume?.();
  render();
  try {
    return await new Promise((resolve) => {
      const onData = (chunk: unknown): void => {
        inputBuffer += String(chunk ?? "");
        const decoded = decodeChoiceInputInternal(inputBuffer, { deferIncomplete: true });
        inputBuffer = decoded.pending;
        for (const key of decoded.actions) {
          const action = handleChoiceKey(key, cursor, selection);
          cursor = action.cursor;
          selection = action.selection;
          if (action.action === "confirm") {
            input.off?.("data", onData);
            resolve({ cancelled: false, ...selectionToOptions(selection) });

            return;
          }
          if (action.action === "cancel") {
            input.off?.("data", onData);
            resolve({ cancelled: true, ...selectionToOptions(selection) });

            return;
          }
          render();
        }
      };
      input.on("data", onData);
    });
  } finally {
    if (rendered) output.write("\u001B[2J\u001B[H");
    input.setRawMode?.(previousRawMode ?? false);
    input.pause?.();
  }
}

function clampWidth(width: unknown): number {
  return Math.max(28, Number.isFinite(Number(width)) ? Number(width) : 80);
}

function supportsColor(output: { isTTY?: boolean } | undefined): boolean {
  return Boolean(output?.isTTY) && (process.env.NO_COLOR ?? "") === "" && process.env.TERM !== "dumb";
}

const COMBINING_CHARACTER = /^\p{Mark}$/u;

function isZeroWidthCodePoint(codePoint: number, character: string): boolean {
  return (
    codePoint === 0x200d ||
    (codePoint >= 0xfe00 && codePoint <= 0xfe0f) ||
    (codePoint >= 0xe0100 && codePoint <= 0xe01ef) ||
    COMBINING_CHARACTER.test(character)
  );
}

function isWideCodePoint(codePoint: number): boolean {
  return (
    (codePoint >= 0x1100 && codePoint <= 0x115f) ||
    codePoint === 0x2329 ||
    codePoint === 0x232a ||
    (codePoint >= 0x2e80 && codePoint <= 0x303e) ||
    (codePoint >= 0x3040 && codePoint <= 0xa4cf) ||
    (codePoint >= 0xac00 && codePoint <= 0xd7a3) ||
    (codePoint >= 0xf900 && codePoint <= 0xfaff) ||
    (codePoint >= 0xfe10 && codePoint <= 0xfe19) ||
    (codePoint >= 0xfe30 && codePoint <= 0xfe6f) ||
    (codePoint >= 0xff00 && codePoint <= 0xff60) ||
    (codePoint >= 0xffe0 && codePoint <= 0xffe6) ||
    (codePoint >= 0x1f1e6 && codePoint <= 0x1f1ff) ||
    (codePoint >= 0x1f300 && codePoint <= 0x1faff) ||
    (codePoint >= 0x20000 && codePoint <= 0x3fffd)
  );
}

export function displayWidth(value: unknown): number {
  let width = 0;
  for (const character of cleanTerminalText(value)) {
    const codePoint = character.codePointAt(0);
    if (codePoint === undefined || codePoint < 0x20 || (codePoint >= 0x7f && codePoint < 0xa0)) continue;
    if (isZeroWidthCodePoint(codePoint, character)) continue;
    width += isWideCodePoint(codePoint) ? 2 : 1;
  }

  return width;
}

function paint(value: string, styles: Styles, color: boolean): string {
  if (!color) return value;
  const names: readonly StyleName[] = Array.isArray(styles) ? styles : styles === undefined ? [] : [styles];
  const prefix = names.map((name) => ANSI_STYLE[name]).join("");

  return prefix ? `${prefix}${value}${ANSI_STYLE.reset}` : value;
}

function frameLine(value: string, width: number, styles?: Styles, color = false): string {
  const content = truncate(value, width);
  const padding = " ".repeat(Math.max(0, width - displayWidth(content)));

  return `│ ${paint(`${content}${padding}`, styles, color)} │`;
}

function frameSegments(segments: Segment[], width: number, color: boolean): string {
  const visible = segments.map((segment) => segment.value).join("");
  if (displayWidth(visible) > width) return frameLine(visible, width);
  const content = segments
    .map((segment) => paint(segment.value, segment.styles, color))
    .join("")
    .concat(" ".repeat(Math.max(0, width - displayWidth(visible))));

  return `│ ${content} │`;
}

function truncate(value: unknown, width: number): string {
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

export function createStageState(names: readonly unknown[]): Stage[] {
  return names.map((name) => ({ id: String(name), name: String(name), status: "pending" as const, message: "" }));
}

export function progressSummary(stages: readonly Stage[]): { completed: number; total: number; percent: number } {
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

export function resolveUiMode({
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
