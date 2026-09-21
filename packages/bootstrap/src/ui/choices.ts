import type { InputStream, OutputStream, Styles } from "./terminal.ts";
import type { ProfileName } from "@dsa/lab-core";
import process from "node:process";
import { renderBanner } from "./banner.ts";
import { clampWidth, frameLine, supportsColor } from "./terminal.ts";

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

const INSTALL_CHOICES: readonly InstallChoice[] = [
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

function normalizeInstallSelection(selection: Iterable<string> | undefined): Selection {
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
  if (active !== undefined && active.detail !== "") {
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
    const character = value[index] ?? "";
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
  input?: InputStream | undefined;
  output?: OutputStream | undefined;
  initialSelection?: Iterable<string> | undefined;
  title?: string | undefined;
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
