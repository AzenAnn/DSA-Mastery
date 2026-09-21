import process from "node:process";
import { stripVTControlCharacters } from "node:util";

const ANSI = {
  bold: 1,
  dim: 2,
  red: 31,
  green: 32,
  yellow: 33,
  cyan: 36,
} as const;

type Tone = "success" | "danger" | "warning";

const VERDICT_TONE: Record<string, Tone> = {
  AC: "success",
  WA: "danger",
  CE: "danger",
  RE: "danger",
  IE: "danger",
  TLE: "warning",
  OLE: "warning",
  PENDING: "warning",
};

export type Paint = (value: unknown) => string;

export interface Theme {
  enabled: boolean;
  success: Paint;
  danger: Paint;
  warning: Paint;
  info: Paint;
  muted: Paint;
  heading: Paint;
  path: Paint;
  command: Paint;
  verdict: Paint;
  status: Paint;
  score: (actual: unknown, maximum: unknown) => string;
  cell: (value: unknown, width: number, style?: (text: string) => string) => string;
  separator: (width: number) => string;
}

export interface ColorOptions {
  stream?: { isTTY?: boolean };
  noColor?: boolean;
  environment?: NodeJS.ProcessEnv;
}

function hasNoColor(environment: NodeJS.ProcessEnv): boolean {
  return Object.hasOwn(environment, "NO_COLOR");
}

export function shouldUseColor({
  stream = process.stdout,
  noColor = false,
  environment = process.env,
}: ColorOptions = {}): boolean {
  return Boolean(stream?.isTTY) && !noColor && !hasNoColor(environment) && environment.TERM?.toLowerCase() !== "dumb";
}

function paint(enabled: boolean, codes: readonly number[], value: unknown): string {
  const text = String(value);
  if (!enabled || text.length === 0) return text;

  return `\u001B[${codes.join(";")}m${text}\u001B[0m`;
}

export function cleanTerminalText(value: unknown): string {
  return stripVTControlCharacters(String(value ?? ""));
}

export function formatNumber(value: unknown): string {
  const number = Number(value);
  if (!Number.isFinite(number)) return String(value);
  if (Number.isInteger(number)) return String(number);

  return number
    .toFixed(2)
    .replace(/\.00$/, "")
    .replace(/(\.\d)0$/, "$1");
}

export function quoteCommandArg(value: unknown): string {
  const text = String(value);

  return /^[\w./:@\\-]+$/.test(text) ? text : `"${text.replaceAll('"', '\\"')}"`;
}

export function createTheme(options: ColorOptions & { color?: boolean } = {}): Theme {
  const enabled = options.color ?? shouldUseColor(options);
  const tone =
    (codes: readonly number[]): Paint =>
    (value) =>
      paint(enabled, codes, value);
  const success = tone([ANSI.bold, ANSI.green]);
  const danger = tone([ANSI.bold, ANSI.red]);
  const warning = tone([ANSI.bold, ANSI.yellow]);
  const info = tone([ANSI.cyan]);
  const muted = tone([ANSI.dim]);
  const heading = tone([ANSI.bold]);
  const byTone: Record<Tone, Paint> = { success, danger, warning };

  return {
    enabled,
    success,
    danger,
    warning,
    info,
    muted,
    heading,
    path: info,
    command: info,
    verdict: (value) => (byTone[VERDICT_TONE[String(value).trim()]] ?? heading)(value),
    status: (value) => {
      const status = String(value).trim();
      if (status === "PASS" || status === "AVAILABLE") return success(value);
      if (status === "PENDING" || status === "NOT FOUND" || status === "TOO OLD") return warning(value);
      if (status === "NOT FULL" || status === "FAIL" || status === "FAILED") return danger(value);

      return heading(value);
    },
    score: (actual, maximum) => {
      const actualText = formatNumber(actual);
      const maximumText = `/${formatNumber(maximum)}`;

      return Number(actual) === Number(maximum)
        ? success(`${actualText}${maximumText}`)
        : `${danger(actualText)}${success(maximumText)}`;
    },
    cell: (value, width, style = (text) => text) => style(String(value).padEnd(width)),
    separator: (width) => muted("".padEnd(width, "-")),
  };
}
