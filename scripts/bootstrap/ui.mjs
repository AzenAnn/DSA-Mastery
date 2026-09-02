const STATUS_ICON = Object.freeze({
  pending: "·",
  running: "▶",
  success: "✓",
  warning: "⚠",
  failed: "✗",
  skipped: "–",
});

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
