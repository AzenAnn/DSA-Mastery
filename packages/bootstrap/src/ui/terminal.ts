import process from "node:process";
import { cleanTerminalText } from "@dsa/lab-core";

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

export type StyleName = keyof typeof ANSI_STYLE;
export type Styles = StyleName | readonly StyleName[] | undefined;

export interface Segment {
  value: string;
  styles?: Styles;
}

export function clampWidth(width: unknown): number {
  return Math.max(28, Number.isFinite(Number(width)) ? Number(width) : 80);
}

export function supportsColor(output: { isTTY?: boolean } | undefined): boolean {
  return Boolean(output?.isTTY) && (process.env["NO_COLOR"] ?? "") === "" && process.env["TERM"] !== "dumb";
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

export function paint(value: string, styles: Styles, color: boolean): string {
  if (!color) return value;
  const names: readonly StyleName[] = Array.isArray(styles) ? styles : styles === undefined ? [] : [styles];
  const prefix = names.map((name) => ANSI_STYLE[name]).join("");

  return prefix ? `${prefix}${value}${ANSI_STYLE.reset}` : value;
}

export function frameLine(value: string, width: number, styles?: Styles, color = false): string {
  const content = truncate(value, width);
  const padding = " ".repeat(Math.max(0, width - displayWidth(content)));

  return `│ ${paint(`${content}${padding}`, styles, color)} │`;
}

export function frameSegments(segments: Segment[], width: number, color: boolean): string {
  const visible = segments.map((segment) => segment.value).join("");
  if (displayWidth(visible) > width) return frameLine(visible, width);
  const content = segments
    .map((segment) => paint(segment.value, segment.styles, color))
    .join("")
    .concat(" ".repeat(Math.max(0, width - displayWidth(visible))));

  return `│ ${content} │`;
}

export function truncate(value: unknown, width: number): string {
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
