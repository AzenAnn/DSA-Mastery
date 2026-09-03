const STATUS_ICON = Object.freeze({
  pending: "·",
  running: "▶",
  success: "✓",
  warning: "⚠",
  failed: "✗",
  skipped: "–",
});

const ANSI_STYLE = Object.freeze({
  reset: "\u001b[0m",
  bold: "\u001b[1m",
  dim: "\u001b[2m",
  cyan: "\u001b[36m",
  green: "\u001b[32m",
  yellow: "\u001b[33m",
  red: "\u001b[31m",
  magenta: "\u001b[35m",
  brightRed: "\u001b[91m",
  brightYellow: "\u001b[93m",
  brightBlue: "\u001b[94m",
});

const PIXEL_GLYPHS = Object.freeze({
  D: ["███  ", "█  █ ", "█  █ ", "█  █ ", "███  "],
  S: [" ███ ", "█    ", " ███ ", "    █", "███  "],
  A: [" ███ ", "█   █", "█████", "█   █", "█   █"],
  M: ["█   █", "██ ██", "█ █ █", "█   █", "█   █"],
  T: ["█████", "  █  ", "  █  ", "  █  ", "  █  "],
  E: ["████ ", "█    ", "████ ", "█    ", "████ "],
  R: ["████ ", "█   █", "████ ", "█ █  ", "█  ██"],
  Y: ["█   █", " █ █ ", "  █  ", "  █  ", "  █  "],
});

const PIXEL_WORDS = Object.freeze([
  { text: "DSA", styles: ["brightRed", "brightYellow", "brightBlue"] },
  { text: "MASTERY", styles: ["dim", "dim", "dim", "dim", "dim", "dim", "dim"] },
]);

export const INSTALL_CHOICES = Object.freeze([
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
]);

const CHOICE_BY_ID = new Map(INSTALL_CHOICES.map((choice) => [choice.id, choice]));
const CHOICE_ARROW_KEYS = Object.freeze([
  ["\u001b[A", "up"],
  ["\u001b[B", "down"],
  ["\u001b[C", "right"],
  ["\u001b[D", "left"],
  ["\u001bOA", "up"],
  ["\u001bOB", "down"],
  ["\u001bOC", "right"],
  ["\u001bOD", "left"],
]);

export function createInstallSelection(overrides = {}) {
  const selected = new Set(INSTALL_CHOICES.filter((choice) => choice.defaultSelected).map((choice) => choice.id));
  for (const [id, value] of Object.entries(overrides)) {
    if (!CHOICE_BY_ID.has(id)) continue;
    if (value) selected.add(id);
    else selected.delete(id);
  }
  return normalizeInstallSelection(selected);
}

export function normalizeInstallSelection(selection) {
  const selected = new Set(selection instanceof Set ? selection : selection ?? []);
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

function removeChoiceAndDependents(selected, id) {
  selected.delete(id);
  for (const choice of INSTALL_CHOICES) {
    if (choice.requires?.includes(id)) removeChoiceAndDependents(selected, choice.id);
  }
}

export function selectionToOptions(selection) {
  const normalized = normalizeInstallSelection(selection);
  const project = normalized.has("project");
  const program = normalized.has("program");
  const vscode = normalized.has("vscode");
  return {
    profile: project ? "full" : program ? "basic" : "runtime",
    installVscode: vscode,
    skipVscode: !vscode,
    installCppExtension: normalized.has("cpp-extension"),
    installCmakeExtension: normalized.has("cmake-extension"),
    selection: INSTALL_CHOICES.filter((choice) => normalized.has(choice.id)).map((choice) => choice.id),
  };
}

export function choiceSelectionSummary(selection) {
  const normalized = normalizeInstallSelection(selection);
  return INSTALL_CHOICES
    .filter((choice) => normalized.has(choice.id))
    .map((choice) => choice.label);
}

export function handleChoiceKey(key, cursor, selection) {
  const selected = normalizeInstallSelection(selection);
  const last = INSTALL_CHOICES.length - 1;
  if (key === "up" || key === "k") return { cursor: Math.max(0, cursor - 1), selection: selected, action: "move" };
  if (key === "down" || key === "j") return { cursor: Math.min(last, cursor + 1), selection: selected, action: "move" };
  if (key === "space") {
    const choice = INSTALL_CHOICES[cursor];
    if (!choice) return { cursor, selection: selected, action: "noop" };
    if (choice?.required) return { cursor, selection: selected, action: "locked" };
    if (selected.has(choice.id)) removeChoiceAndDependents(selected, choice.id);
    else {
      const normalized = normalizeInstallSelection(new Set([...selected, choice.id]));
      selected.clear();
      for (const id of normalized) selected.add(id);
    }
    if (choice.id === "program" && !selected.has("program")) {
      removeChoiceAndDependents(selected, "program");
    }
    return { cursor, selection: selected, action: "toggle" };
  }
  if (key === "enter") return { cursor, selection: selected, action: "confirm" };
  if (key === "escape" || key === "q") return { cursor, selection: selected, action: "cancel" };
  return { cursor, selection: selected, action: "noop" };
}

export function renderBanner({ width = 88, subtitle = "本地实验环境安装向导", color = false } = {}) {
  const safeWidth = clampWidth(width);
  const innerWidth = safeWidth - 4;
  return [
    `╭${"─".repeat(safeWidth - 2)}╮`,
    frameLine(`◆ DSA MASTERY  ·  ${subtitle}`, innerWidth, ["bold", "cyan"], color),
    `╰${"─".repeat(safeWidth - 2)}╯`,
  ].join("\n");
}

export function renderPixelBanner({ width = 88, color = false } = {}) {
  const safeWidth = clampWidth(width);
  const innerWidth = safeWidth - 4;
  const artWidth = displayWidth(pixelRowSegments(0).map((segment) => segment.value).join(""));
  if (innerWidth < artWidth) {
    return [
      `╭${"─".repeat(safeWidth - 2)}╮`,
      frameSegments([
        { value: "◆ " },
        { value: "D", styles: "brightRed" },
        { value: "S", styles: "brightYellow" },
        { value: "A", styles: "brightBlue" },
        { value: " MASTERY", styles: "dim" },
      ], innerWidth, color),
      `╰${"─".repeat(safeWidth - 2)}╯`,
    ].join("\n");
  }
  const leftPadding = Math.floor((innerWidth - artWidth) / 2);
  const rightPadding = innerWidth - artWidth - leftPadding;
  const lines = [
    `╭${"─".repeat(safeWidth - 2)}╮`,
  ];
  for (let row = 0; row < 5; row += 1) {
    lines.push(frameSegments([
      { value: " ".repeat(leftPadding) },
      ...pixelRowSegments(row),
      { value: " ".repeat(rightPadding) },
    ], innerWidth, color));
  }
  lines.push(`╰${"─".repeat(safeWidth - 2)}╯`);
  return lines.join("\n");
}

function pixelRowSegments(row) {
  const segments = [];
  for (const [wordIndex, word] of PIXEL_WORDS.entries()) {
    if (wordIndex > 0) segments.push({ value: "   " });
    for (const [letterIndex, letter] of [...word.text].entries()) {
      if (letterIndex > 0) segments.push({ value: " " });
      segments.push({ value: PIXEL_GLYPHS[letter][row], styles: word.styles[letterIndex] });
    }
  }
  return segments;
}

export function renderChoiceMenu({ title = "配置 DSA Mastery", subtitle = "用 ↑↓ 移动，空格勾选，Enter 开始", choices = INSTALL_CHOICES, selection = createInstallSelection(), cursor = 0, width = 88, color = false } = {}) {
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
  let previousGroup;
  choices.forEach((choice, index) => {
    if (choice.group && choice.group !== previousGroup) {
      if (previousGroup) lines.push(frameLine("", innerWidth));
      lines.push(frameLine(`▌ ${choice.group}`, innerWidth, ["bold", "magenta"], color));
      previousGroup = choice.group;
    }
    const prefix = index === cursor ? "▶" : " ";
    const checkbox = normalized.has(choice.id) ? "☑" : "☐";
    const lock = choice.required ? " · 必选" : "";
    const choiceStyle = index === cursor
      ? ["bold", "cyan"]
      : choice.required
        ? "yellow"
        : normalized.has(choice.id)
          ? "green"
          : "dim";
    lines.push(frameLine(`${prefix} ${checkbox} ${choice.label}${lock}`, innerWidth, choiceStyle, color));
    lines.push(frameLine(`  ${choice.description}`, innerWidth, "dim", color));
  });
  const active = choices[cursor];
  if (active?.detail) {
    lines.push(frameLine("", innerWidth));
    lines.push(frameLine(`▸ 说明：${active.detail}`, innerWidth, "dim", color));
  }
  const plan = selectionToOptions(normalized);
  const planLabel = plan.profile === "runtime"
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

export function decodeChoiceInput(buffer) {
  const value = String(buffer ?? "");
  return decodeChoiceInputInternal(value).actions;
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
    if (character === "\u0003" || character === "\u001b") actions.push("escape");
    else if (character === " ") actions.push("space");
    else if (character === "\r" || character === "\n") actions.push("enter");
    else if (character.toLowerCase() === "q") actions.push("q");
    else if (character.toLowerCase() === "j") actions.push("j");
    else if (character.toLowerCase() === "k") actions.push("k");
    index += 1;
  }
  return { actions, pending };
}

export async function promptInstallSelection({ input = process.stdin, output = process.stdout, initialSelection = createInstallSelection(), title = "配置 DSA Mastery" } = {}) {
  if (!input?.isTTY || !output?.isTTY) return { cancelled: false, ...selectionToOptions(initialSelection) };
  let cursor = Math.min(1, INSTALL_CHOICES.length - 1);
  let selection = normalizeInstallSelection(initialSelection);
  const previousRawMode = input.isRaw;
  let inputBuffer = "";
  let rendered = false;
  const color = supportsColor(output);
  const render = () => {
    if (rendered) output.write("\u001b[2J\u001b[H");
    output.write(`${renderChoiceMenu({ title, selection, cursor, width: output.columns ?? 88, color })}\n`);
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
    if (rendered) output.write("\u001b[2J\u001b[H");
    input.setRawMode?.(previousRawMode ?? false);
    input.pause?.();
  }
}

function clampWidth(width) {
  return Math.max(28, Number.isFinite(Number(width)) ? Number(width) : 80);
}

function supportsColor(output) {
  return Boolean(output?.isTTY && !process.env.NO_COLOR && process.env.TERM !== "dumb");
}

const COMBINING_CHARACTER = /^\p{Mark}$/u;

function isZeroWidthCodePoint(codePoint, character) {
  return codePoint === 0x200d
    || (codePoint >= 0xfe00 && codePoint <= 0xfe0f)
    || (codePoint >= 0xe0100 && codePoint <= 0xe01ef)
    || COMBINING_CHARACTER.test(character);
}

function isWideCodePoint(codePoint) {
  return (
    (codePoint >= 0x1100 && codePoint <= 0x115f)
    || codePoint === 0x2329
    || codePoint === 0x232a
    || (codePoint >= 0x2e80 && codePoint <= 0x303e)
    || (codePoint >= 0x3040 && codePoint <= 0xa4cf)
    || (codePoint >= 0xac00 && codePoint <= 0xd7a3)
    || (codePoint >= 0xf900 && codePoint <= 0xfaff)
    || (codePoint >= 0xfe10 && codePoint <= 0xfe19)
    || (codePoint >= 0xfe30 && codePoint <= 0xfe6f)
    || (codePoint >= 0xff00 && codePoint <= 0xff60)
    || (codePoint >= 0xffe0 && codePoint <= 0xffe6)
    || (codePoint >= 0x1f1e6 && codePoint <= 0x1f1ff)
    || (codePoint >= 0x1f300 && codePoint <= 0x1faff)
    || (codePoint >= 0x20000 && codePoint <= 0x3fffd)
  );
}
export function displayWidth(value) {
  let width = 0;
  for (const character of stripAnsi(value)) {
    const codePoint = character.codePointAt(0);
    if (!codePoint || codePoint < 0x20 || (codePoint >= 0x7f && codePoint < 0xa0)) continue;
    if (isZeroWidthCodePoint(codePoint, character)) continue;
    width += isWideCodePoint(codePoint) ? 2 : 1;
  }
  return width;
}

function paint(value, styles, color) {
  if (!color) return value;
  const names = Array.isArray(styles) ? styles : [styles];
  const prefix = names.filter(Boolean).map((name) => ANSI_STYLE[name]).join("");
  return prefix ? `${prefix}${value}${ANSI_STYLE.reset}` : value;
}

function frameLine(value, width, styles, color = false) {
  const content = truncate(value, width);
  const padding = " ".repeat(Math.max(0, width - displayWidth(content)));
  return `│ ${paint(`${content}${padding}`, styles, color)} │`;
}

function frameSegments(segments, width, color) {
  const visible = segments.map((segment) => segment.value).join("");
  if (displayWidth(visible) > width) return frameLine(visible, width);
  const content = segments
    .map((segment) => paint(segment.value, segment.styles, color))
    .join("")
    .concat(" ".repeat(Math.max(0, width - displayWidth(visible))));
  return `│ ${content} │`;
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

function statusLabel(status) {
  return {
    pending: "待处理",
    running: "进行中",
    success: "完成",
    warning: "警告",
    failed: "失败",
    skipped: "跳过",
  }[status] ?? status;
}

function completedCount(stages) {
  return stages.filter((stage) => ["success", "warning", "skipped"].includes(stage.status)).length;
}

export function createStageState(names) {
  return names.map((name) => ({ id: String(name), name: String(name), status: "pending", message: "" }));
}

export function progressSummary(stages) {
  const total = stages.length;
  const completed = completedCount(stages);
  return {
    completed,
    total,
    percent: total === 0 ? 100 : Math.round((completed / total) * 100),
  };
}

export function renderPlain({ title = "DSA Mastery 环境配置", profile = "", stages = [], width = 80 } = {}) {
  const safeWidth = clampWidth(width);
  const summary = progressSummary(stages);
  const lines = [
    title,
    profile ? `Profile：${profile}` : "",
    `进度：${summary.completed}/${summary.total} · ${summary.percent}%`,
  ];
  for (const stage of stages) {
    const message = stage.message ? ` · ${stage.message}` : "";
    lines.push(`${STATUS_ICON[stage.status] ?? "·"} ${stage.name} · ${statusLabel(stage.status)}${message}`);
  }
  return lines.filter(Boolean).map((line) => truncate(line, safeWidth)).join("\n");
}

export function renderTuiFrame({ title = "DSA Mastery 环境配置", profile = "", stages = [], width = 80, color = false } = {}) {
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
    frameSegments([
      { value: "进度 ", styles: ["bold", "cyan"] },
      { value: "█".repeat(filled), styles: ["bold", "green"] },
      { value: "░".repeat(empty), styles: "dim" },
      { value: ` ${summary.percent}% (${summary.completed}/${summary.total})`, styles: "dim" },
    ], innerWidth, color),
    `├${"─".repeat(safeWidth - 2)}┤`,
  ];
  for (const stage of stages) {
    const message = stage.message ? ` · ${stage.message}` : "";
    lines.push(frameLine(
      `${STATUS_ICON[stage.status] ?? "·"} ${stage.name} · ${statusLabel(stage.status)}${message}`,
      innerWidth,
      statusStyles(stage.status),
      color,
    ));
  }
  lines.push(`╰${"─".repeat(safeWidth - 2)}╯`);
  return lines.join("\n");
}

function statusStyles(status) {
  return {
    pending: "dim",
    running: ["bold", "cyan"],
    success: ["bold", "green"],
    warning: ["bold", "yellow"],
    failed: ["bold", "red"],
    skipped: "dim",
  }[status];
}

export function stripAnsi(value) {
  const escape = String.fromCharCode(27);
  return String(value ?? "").replace(new RegExp(`${escape}\\[[0-?]*[ -/]*[@-~]`, "g"), "");
}

export function resolveUiMode({ mode = "auto", stdout = process.stdout, json = false, nonInteractive = false } = {}) {
  if (json || nonInteractive || mode === "plain") return "plain";
  const tty = Boolean(stdout?.isTTY);
  const disabled = Boolean(process.env.NO_COLOR) || process.env.TERM === "dumb";
  if (mode === "tui" && tty && !disabled) return "tui";
  if (mode === "auto" && tty && !disabled) return "tui";
  return "plain";
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
} = {}) {
  const ui = {
    mode: resolveUiMode({ mode, stdout, json, nonInteractive }),
    stdout,
    title,
    profile,
    stages: createStageState(stageNames),
    spinner,
    started: false,
    timer: undefined,
    currentFrame: "",
    update(id, status, message = "") {
      const stage = ui.stages.find((item) => item.id === id);
      if (!stage) throw new Error(`未知安装阶段：${id}`);
      stage.status = status;
      stage.message = message;
      ui.render();
      return stage;
    },
    render() {
      const width = Math.max(28, Number(ui.stdout?.columns) || 80);
      const frame = ui.mode === "tui"
        ? renderTuiFrame({ title: ui.title, profile: ui.profile, stages: ui.stages, width, color: supportsColor(ui.stdout) })
        : renderPlain({ title: ui.title, profile: ui.profile, stages: ui.stages, width });
      if (ui.mode === "tui" && ui.currentFrame) ui.stdout.write("\u001b[2J\u001b[H");
      ui.stdout.write(`${frame}\n`);
      ui.currentFrame = frame;
      return frame;
    },
    start() {
      if (ui.started) return;
      ui.started = true;
      ui.render();
      if (ui.mode === "tui" && ui.spinner) {
        ui.timer = setInterval(() => ui.render(), 800);
        ui.timer.unref?.();
      }
    },
    finish({ ok = false } = {}) {
      if (ui.timer) clearInterval(ui.timer);
      ui.timer = undefined;
      if (!ui.started) ui.started = true;
      ui.render();
      if (ok && ui.mode === "tui") {
        const width = Math.max(28, Number(ui.stdout?.columns) || 80);
        ui.stdout.write(`${renderPixelBanner({ width, color: supportsColor(ui.stdout) })}\n`);
      }
      ui.started = false;
    },
  };
  return ui;
}
