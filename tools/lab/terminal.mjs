import process from "node:process";
import { stripVTControlCharacters } from "node:util";

const ANSI = Object.freeze({
  bold: 1,
  dim: 2,
  red: 31,
  green: 32,
  yellow: 33,
  cyan: 36,
});

const VERDICT_TONE = Object.freeze({
  AC: "success",
  WA: "danger",
  CE: "danger",
  RE: "danger",
  IE: "danger",
  TLE: "warning",
  OLE: "warning",
  PENDING: "warning",
});

function hasNoColor(environment) {
  return Object.prototype.hasOwnProperty.call(environment, "NO_COLOR");
}

export function shouldUseColor({ stream = process.stdout, noColor = false, environment = process.env } = {}) {
  return Boolean(stream?.isTTY) && !noColor && !hasNoColor(environment) && environment.TERM?.toLowerCase() !== "dumb";
}

function paint(enabled, codes, value) {
  const text = String(value);
  if (!enabled || text.length === 0) return text;
  return `\u001B[${codes.join(";")}m${text}\u001B[0m`;
}

export function cleanTerminalText(value) {
  return stripVTControlCharacters(String(value ?? ""));
}

export function formatNumber(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return String(value);
  if (Number.isInteger(number)) return String(number);
  return number.toFixed(2).replace(/\.00$/, "").replace(/(\.\d)0$/, "$1");
}

export function quoteCommandArg(value) {
  const text = String(value);
  return /^[A-Za-z0-9_./:@\\-]+$/.test(text) ? text : `"${text.replaceAll('"', '\\"')}"`;
}

export function createTheme(options = {}) {
  const enabled = options.color ?? shouldUseColor(options);
  const theme = {
    enabled,
    success: (value) => paint(enabled, [ANSI.bold, ANSI.green], value),
    danger: (value) => paint(enabled, [ANSI.bold, ANSI.red], value),
    warning: (value) => paint(enabled, [ANSI.bold, ANSI.yellow], value),
    info: (value) => paint(enabled, [ANSI.cyan], value),
    muted: (value) => paint(enabled, [ANSI.dim], value),
    heading: (value) => paint(enabled, [ANSI.bold], value),
  };
  theme.path = theme.info;
  theme.command = theme.info;
  theme.verdict = (value) => (theme[VERDICT_TONE[String(value).trim()]] ?? theme.heading)(value);
  theme.status = (value) => {
    const status = String(value).trim();
    if (status === "PASS" || status === "AVAILABLE") return theme.success(value);
    if (status === "PENDING" || status === "NOT FOUND" || status === "TOO OLD") return theme.warning(value);
    if (status === "NOT FULL" || status === "FAIL" || status === "FAILED") return theme.danger(value);
    return theme.heading(value);
  };
  theme.score = (actual, maximum) => {
    const actualText = formatNumber(actual);
    const maximumText = `/${formatNumber(maximum)}`;
    return Number(actual) === Number(maximum)
      ? theme.success(`${actualText}${maximumText}`)
      : `${theme.danger(actualText)}${theme.success(maximumText)}`;
  };
  theme.cell = (value, width, style = (text) => text) => style(String(value).padEnd(width));
  theme.separator = (width) => theme.muted("".padEnd(width, "-"));
  return theme;
}
