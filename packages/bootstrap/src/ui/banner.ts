import type { Segment, StyleName } from "./terminal.ts";
import { clampWidth, displayWidth, frameLine, frameSegments } from "./terminal.ts";

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
