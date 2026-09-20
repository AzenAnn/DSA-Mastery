export type CompareMode = "exact" | "tokens" | "float";

export interface CompareConfig {
  mode: CompareMode;
  absTol?: number;
  relTol?: number;
}

export type CompareDifference =
  | { kind: "character"; index: number; line: number; column: number; expected: string; actual: string }
  | { kind: "token"; index: number; expected: string; actual: string };

export type CompareResult = { equal: true } | { equal: false; difference: CompareDifference };

export function normalizeNewlines(value: string): string {
  return value.replace(/\r\n?/g, "\n");
}

function removeOptionalFinalLineBreak(value: string): string {
  return value.endsWith("\n") ? value.slice(0, -1) : value;
}

function normalizeExact(value: string): string {
  return removeOptionalFinalLineBreak(
    normalizeNewlines(value)
      .split("\n")
      .map((line) => line.replace(/[\t ]+$/u, ""))
      .join("\n"),
  );
}

function locationAt(value: string, offset: number): { line: number; column: number } {
  const before = value.slice(0, offset);
  const lines = before.split("\n");

  return { line: lines.length, column: lines.at(-1)!.length + 1 };
}

function excerpt(value: string, offset: number): string {
  return value.slice(Math.max(0, offset - 24), offset + 48).replaceAll("\n", "\\n");
}

function exact(expected: string, actual: string): CompareResult {
  const left = normalizeExact(expected);
  const right = normalizeExact(actual);
  if (left === right) return { equal: true };
  let index = 0;
  while (index < left.length && index < right.length && left[index] === right[index]) index += 1;

  return {
    equal: false,
    difference: {
      kind: "character",
      index,
      ...locationAt(left, index),
      expected: excerpt(left, index),
      actual: excerpt(right, index),
    },
  };
}

function tokens(value: string): string[] {
  return normalizeNewlines(value).match(/\S+/gu) ?? [];
}

function isNumericToken(value: string): boolean {
  return /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(value);
}

function tokenCompare(expected: string, actual: string, config: CompareConfig): CompareResult {
  const left = tokens(expected);
  const right = tokens(actual);
  const absTol = config.absTol ?? 1e-6;
  const relTol = config.relTol ?? 1e-6;
  for (let index = 0; index < Math.max(left.length, right.length); index += 1) {
    const expectedToken = left[index];
    const actualToken = right[index];
    let equal = expectedToken === actualToken;
    if (config.mode === "float" && isNumericToken(expectedToken ?? "") && isNumericToken(actualToken ?? "")) {
      const expectedNumber = Number(expectedToken);
      const actualNumber = Number(actualToken);
      equal =
        Number.isFinite(expectedNumber) &&
        Number.isFinite(actualNumber) &&
        Math.abs(expectedNumber - actualNumber) <=
          Math.max(absTol, relTol * Math.max(Math.abs(expectedNumber), Math.abs(actualNumber)));
    }
    if (!equal) {
      return {
        equal: false,
        difference: {
          kind: "token",
          index: index + 1,
          expected: expectedToken ?? "<end of output>",
          actual: actualToken ?? "<end of output>",
        },
      };
    }
  }

  return { equal: true };
}

export function compareOutput(
  expected: string,
  actual: string,
  config: CompareConfig = { mode: "tokens" },
): CompareResult {
  if (config.mode === "exact") return exact(expected, actual);

  return tokenCompare(expected, actual, config);
}
