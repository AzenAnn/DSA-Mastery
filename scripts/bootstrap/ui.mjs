const STATUS_ICON = Object.freeze({
  pending: "·",
  running: "▶",
  success: "✓",
  warning: "⚠",
  failed: "✗",
  skipped: "–",
});

export const INSTALL_CHOICES = Object.freeze([
  {
    id: "runtime",
    label: "基础运行环境",
    description: "启动器和课程工具所需的 Git、Node.js、pnpm",
    detail: "必选。启动器需要它来下载仓库、安装依赖和运行课程工具。",
    profile: "runtime",
    defaultSelected: true,
    required: true,
  },
  {
    id: "program",
    label: "Program Lab C++ 环境",
    description: "编译并运行基础 C++ 练习（推荐）",
    detail: "准备 Apple Clang、MSVC 或其他受支持的 C++ 编译器。",
    profile: "basic",
    defaultSelected: true,
  },
  {
    id: "project",
    label: "Project Lab / CMake 环境",
    description: "运行需要 CMake 的综合项目",
    detail: "准备 CMake，并自动勾选 Program Lab。",
    profile: "full",
    defaultSelected: false,
    requires: ["program"],
  },
  {
    id: "vscode",
    label: "VS Code 编辑器",
    description: "用图形界面编写和运行代码",
    detail: "可选，不影响命令行 Lab 使用。",
    defaultSelected: false,
    optional: true,
  },
  {
    id: "cpp-extension",
    label: "C/C++ 代码扩展",
    description: "VS Code 的补全、跳转和调试支持",
    detail: "需要先安装 VS Code。",
    defaultSelected: false,
    optional: true,
    requires: ["vscode"],
  },
  {
    id: "cmake-extension",
    label: "CMake Tools 扩展",
    description: "在 VS Code 中管理 Project / CMake",
    detail: "需要先选择 Project / CMake 和 VS Code。",
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

export function renderChoiceMenu({ title = "配置 DSA Mastery", subtitle = "用 ↑↓ 移动，空格勾选，Enter 开始", choices = INSTALL_CHOICES, selection = createInstallSelection(), cursor = 0, width = 88 } = {}) {
  const safeWidth = clampWidth(width);
  const innerWidth = safeWidth - 4;
  const normalized = normalizeInstallSelection(selection);
  const lines = [
    `╭${"─".repeat(safeWidth - 2)}╮`,
    `│ ${truncate(title, innerWidth)} │`,
    `│ ${truncate(subtitle, innerWidth)} │`,
    `├${"─".repeat(safeWidth - 2)}┤`,
  ];
  choices.forEach((choice, index) => {
    const prefix = index === cursor ? "▶" : " ";
    const checkbox = normalized.has(choice.id) ? "☑" : "☐";
    const lock = choice.required ? " · 必选" : "";
    lines.push(`│ ${truncate(`${prefix} ${checkbox} ${choice.label}${lock}`, innerWidth)} │`);
    lines.push(`│   ${truncate(choice.description, innerWidth - 2)} │`);
  });
  const active = choices[cursor];
  if (active?.detail) lines.push(`│ ${truncate(`说明：${active.detail}`, innerWidth)} │`);
  const plan = selectionToOptions(normalized);
  const planLabel = plan.profile === "runtime"
    ? "runtime（仅课程工具）"
    : plan.profile === "full"
      ? "full（Program + Project）"
      : "basic（Program）";
  lines.push(`│ ${truncate(`当前方案：${planLabel}`, innerWidth)} │`);
  lines.push(`├${"─".repeat(safeWidth - 2)}┤`);
  lines.push(`│ ${truncate("↑↓/jk 移动   空格 选择/取消   Enter 开始   q 退出", innerWidth)} │`);
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
  const render = () => {
    if (rendered) output.write("\u001b[2J\u001b[H");
    output.write(`${renderChoiceMenu({ title, selection, cursor, width: output.columns ?? 88 })}\n`);
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

function truncate(value, width) {
  const text = String(value ?? "");
  if (text.length <= width) return text;
  if (width <= 1) return text.slice(0, width);
  return `${text.slice(0, width - 1)}…`;
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

export function renderTuiFrame({ title = "DSA Mastery 环境配置", profile = "", stages = [], width = 80 } = {}) {
  const safeWidth = clampWidth(width);
  const innerWidth = safeWidth - 4;
  const summary = progressSummary(stages);
  const barWidth = Math.max(8, innerWidth - 18);
  const filled = Math.round((summary.percent / 100) * barWidth);
  const bar = `${"█".repeat(filled)}${"░".repeat(Math.max(0, barWidth - filled))}`;
  const lines = [
    `╭${"─".repeat(safeWidth - 2)}╮`,
    `│ ${truncate(`${title}${profile ? ` · ${profile}` : ""}`, innerWidth)} │`,
    `│ ${truncate(`进度 ${bar} ${summary.percent}% (${summary.completed}/${summary.total})`, innerWidth)} │`,
    `├${"─".repeat(safeWidth - 2)}┤`,
  ];
  for (const stage of stages) {
    const message = stage.message ? ` · ${stage.message}` : "";
    lines.push(`│ ${truncate(`${STATUS_ICON[stage.status] ?? "·"} ${stage.name} · ${statusLabel(stage.status)}${message}`, innerWidth)} │`);
  }
  lines.push(`╰${"─".repeat(safeWidth - 2)}╯`);
  return lines.join("\n");
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
        ? renderTuiFrame({ title: ui.title, profile: ui.profile, stages: ui.stages, width })
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
    finish() {
      if (ui.timer) clearInterval(ui.timer);
      ui.timer = undefined;
      if (!ui.started) ui.started = true;
      ui.render();
      ui.started = false;
    },
  };
  return ui;
}
