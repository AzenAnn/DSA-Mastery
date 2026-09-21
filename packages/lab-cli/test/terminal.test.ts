import type { LabReport } from "@dsa/lab-core";
import type { CaseResult, CompileResult, EnvironmentReport, JudgeView, ProjectView } from "@dsa/lab-runner";
import {
  formatBuild,
  formatClean,
  formatDoctor,
  formatError,
  formatHelp,
  formatNew,
  formatPack,
  formatRefresh,
  formatValidate,
  formatVerify,
} from "@dsa/lab-cli";
import { cleanTerminalText, createTheme, LabError, shouldUseColor } from "@dsa/lab-core";
import { formatJudge, formatProject } from "@dsa/lab-runner";
import { expect, it } from "vitest";

const ESC = "\u001B[";
const colorTheme = createTheme({ color: true });
const plainTheme = createTheme({ color: false });

function sampleCase(overrides: Partial<CaseResult> = {}): CaseResult {
  return {
    id: "001-sample",
    tags: [],
    verdict: "AC",
    points: 20,
    maxPoints: 20,
    durationMs: 27,
    stderr: "",
    comparison: { equal: true },
    ...overrides,
  };
}

function compiled(overrides: Partial<CompileResult> = {}): CompileResult {
  return {
    ok: true,
    compiler: { command: "g++", family: "gnu" },
    command: "g++",
    args: [],
    executable: "demo.exe",
    stdout: "",
    stderr: "",
    durationMs: 12,
    ...overrides,
  };
}

it("color activation respects TTY, --no-color, NO_COLOR, and TERM=dumb", () => {
  const tty = { isTTY: true };
  expect(shouldUseColor({ stream: tty, environment: {} })).toBe(true);
  expect(shouldUseColor({ stream: tty, noColor: true, environment: {} })).toBe(false);
  expect(shouldUseColor({ stream: tty, environment: { NO_COLOR: "" } })).toBe(false);
  expect(shouldUseColor({ stream: tty, environment: { TERM: "dumb" } })).toBe(false);
  expect(shouldUseColor({ stream: { isTTY: false }, environment: {} })).toBe(false);
});

it("verdicts, pending state, and score parts use stable semantic colors", () => {
  expect(colorTheme.verdict("AC").includes(`${ESC}1;32mAC`)).toBe(true);
  for (const verdict of ["WA", "CE", "RE", "IE"])
    expect(colorTheme.verdict(verdict).includes(`${ESC}1;31m`)).toBe(true);
  for (const verdict of ["TLE", "OLE", "PENDING"])
    expect(colorTheme.verdict(verdict).includes(`${ESC}1;33m`)).toBe(true);
  expect(colorTheme.score(100, 100).includes(`${ESC}1;32m100/100`)).toBe(true);
  expect(colorTheme.score(80, 100).includes(`${ESC}1;31m80${ESC}0m${ESC}1;32m/100`)).toBe(true);
  expect(cleanTerminalText(colorTheme.cell("AC", 8, colorTheme.verdict))).toBe("AC      ");
});

it("Program formatter shows an aligned green PASS summary", () => {
  const result: JudgeView = {
    verdict: "AC",
    score: 100,
    maxScore: 100,
    compilation: compiled(),
    cases: [sampleCase(), sampleCase({ id: "002-single", points: 80, maxPoints: 80, durationMs: 33 })],
  };
  const output = formatJudge(result, { theme: colorTheme, labPath: "labs/chapter-01/exercise/E-01-01-demo" });
  const plain = cleanTerminalText(output);
  expect(output.includes(`${ESC}1;32mAC`)).toBe(true);
  expect(output.includes(`${ESC}1;32mPASS`)).toBe(true);
  expect(output.includes(`${ESC}1;32m100/100`)).toBe(true);
  expect(plain).toMatch(/^CASE\s+RESULT\s+TIME\s+SCORE/m);
  expect(plain).toMatch(/PASS {2}2\/2 cases · 100\/100 · 60 ms/);
  expect(plain).not.toMatch(/Retry/);
});

it("Program formatter expands WA diagnostics and gives a copyable retry", () => {
  const result: JudgeView = {
    verdict: "WA",
    score: 20,
    maxScore: 100,
    compilation: compiled(),
    cases: [
      sampleCase(),
      sampleCase({
        id: "002-single",
        verdict: "WA",
        points: 0,
        maxPoints: 80,
        durationMs: 18,
        comparison: {
          equal: false,
          difference: { kind: "token", index: 1, expected: "42", actual: "<end of output>" },
        },
      }),
    ],
  };
  const output = formatJudge(result, { theme: colorTheme, command: "pnpm lab score", labPath: "labs/chapter-01/demo" });
  const plain = cleanTerminalText(output);
  expect(output.includes(`${ESC}1;31mWA`)).toBe(true);
  expect(output.includes(`${ESC}1;31m20${ESC}0m${ESC}1;32m/100`)).toBe(true);
  expect(plain).toMatch(/首处差异：第 1 个 token/);
  expect(plain).toMatch(/期望： "42"/);
  expect(plain).toMatch(/实际： "<end of output>"/);
  expect(plain).toMatch(/NOT FULL {2}1\/2 cases/);
  expect(plain).toMatch(/Retry： pnpm lab score labs\/chapter-01\/demo --case 002-single/);
});

it("compiler diagnostics stay plain and have terminal controls removed", () => {
  const output = formatJudge(
    {
      verdict: "CE",
      score: 0,
      maxScore: 100,
      cases: [],
      compilation: compiled({ ok: false, stderr: "\u001B[31mstudent/main.cpp:1: error\u001B[0m" }),
    },
    { theme: colorTheme },
  );
  expect(output).toMatch(/COMPILE ERROR/);
  expect(cleanTerminalText(output)).toMatch(/student\/main\.cpp:1: error/);
  expect(output.includes(`${ESC}31mstudent`)).toBe(false);
});

it("Project formatter distinguishes automated full score from manual pending", () => {
  const result: ProjectView = {
    automatedScore: 80,
    automatedMax: 80,
    manualPending: 20,
    provisionalTotal: 80,
    total: 100,
    automatedFull: true,
    tasks: [
      {
        id: "implementation",
        kind: "stdio",
        status: "AC",
        weight: 30,
        weightedScore: 30,
        judge: {
          target: "student",
          verdict: "AC",
          score: 100,
          maxScore: 100,
          compilation: compiled(),
          cases: [sampleCase({ points: 100, maxPoints: 100 })],
        },
      },
      {
        id: "codec",
        kind: "ctest",
        status: "AC",
        weight: 50,
        weightedScore: 50,
        tests: [
          { name: "short", verdict: "AC", points: 50, maxPoints: 50, durationMs: 4, output: "" },
          { name: "codec-prefix-property", verdict: "AC", points: 50, maxPoints: 50, durationMs: 6, output: "" },
        ],
      },
      { id: "report", kind: "manual", status: "PENDING", weight: 20, weightedScore: 0 },
    ],
  };
  const output = formatProject(result, { theme: colorTheme, labPath: "labs/golden/project" });
  const plain = cleanTerminalText(output);
  expect(output.includes(`${ESC}1;33mPENDING`)).toBe(true);
  expect(output.includes(`${ESC}1;31m80${ESC}0m${ESC}1;32m/100`)).toBe(true);
  expect(plain).toMatch(/Automated： 80\/80/);
  expect(plain).toMatch(/Manual pending： 20/);
  expect(plain).toMatch(/Provisional total： 80\/100/);
  expect(plain).toMatch(/AUTOMATED PASS · MANUAL REVIEW PENDING/);
  const nested = plain.split("\n").filter((line) => /^ {2}(?:short|codec-prefix-property)/.test(line));
  expect(nested[0].indexOf("AC")).toBe(nested[1].indexOf("AC"));
});

it("all non-interactive reporters share readable status tokens and remain plain when requested", () => {
  const doctorReport: { environment: EnvironmentReport } = {
    environment: {
      ok: true,
      platform: "win32",
      architecture: "x64",
      node: "v24.0.0",
      tools: [
        {
          name: "Clang",
          command: "clang++",
          available: true,
          meetsMinimum: true,
          version: "21.1.0",
          minimum: "14.0.0",
        },
        { name: "GNU Make", command: "make", available: false, meetsMinimum: false, minimum: "4.0.0" },
      ],
      makeOptional: true,
      makeAvailable: false,
      msvc: { initialized: false },
      fallback: "pnpm lab run <lab-path>",
      issues: [],
    },
  };
  const outputs = [
    formatHelp(colorTheme),
    formatNew(
      {
        labRoot: "/repo/labs/chapter-01/demo",
        relativeRoot: "labs/chapter-01/demo",
        type: "program",
        labId: "01E01",
        order: 1,
      },
      colorTheme,
    ),
    formatValidate(
      {
        reportVersion: 1,
        command: "validate",
        ok: true,
        lab: { path: "labs/demo", type: "program", schemaVersion: 1 },
        cases: 4,
      } satisfies LabReport,
      colorTheme,
    ),
    formatDoctor(doctorReport, colorTheme),
    formatBuild({ ...compiled(), target: "student" }, colorTheme),
    formatVerify("quiz", { ok: true, quiz: { count: 5, totalPoints: 100 } }, colorTheme),
    formatRefresh(
      {
        changed: 1,
        written: 0,
        changes: [
          {
            id: "sample",
            expected: "tests/sample.out",
            difference: { kind: "token", index: 0, expected: "old", actual: "new" },
            diff: "@@ line 1 @@\n- old\n+ new",
          },
        ],
      },
      { theme: colorTheme },
    ),
    formatPack({ packageRoot: "labs/demo/.lab-cache/packages/demo" }, colorTheme),
    formatClean({ cache: "labs/demo/.lab-cache" }, colorTheme),
    formatError(new LabError("ARGUMENT_INVALID", "bad option"), colorTheme),
  ];
  for (const output of outputs) expect(output.includes(ESC)).toBe(true);

  const plainOutputs = [
    formatHelp(plainTheme),
    formatDoctor(doctorReport, plainTheme),
    formatError(new LabError("ARGUMENT_INVALID", "bad option"), plainTheme),
  ];
  for (const output of plainOutputs) expect(output.includes(ESC)).toBe(false);
});
