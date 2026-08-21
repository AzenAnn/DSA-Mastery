import assert from "node:assert/strict";
import test from "node:test";
import { formatJudge } from "../tools/lab/judge.mjs";
import { formatProject } from "../tools/lab/project.mjs";
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
} from "../tools/lab/reporter.mjs";
import { cleanTerminalText, createTheme, shouldUseColor } from "../tools/lab/terminal.mjs";

const ESC = "\u001B[";
const colorTheme = createTheme({ color: true });
const plainTheme = createTheme({ color: false });

function sampleCase(overrides = {}) {
  return {
    id: "001-sample",
    verdict: "AC",
    points: 20,
    maxPoints: 20,
    durationMs: 27,
    stderr: "",
    comparison: { equal: true },
    ...overrides,
  };
}

test("color activation respects TTY, --no-color, NO_COLOR, and TERM=dumb", () => {
  const tty = { isTTY: true };
  assert.equal(shouldUseColor({ stream: tty, environment: {} }), true);
  assert.equal(shouldUseColor({ stream: tty, noColor: true, environment: {} }), false);
  assert.equal(shouldUseColor({ stream: tty, environment: { NO_COLOR: "" } }), false);
  assert.equal(shouldUseColor({ stream: tty, environment: { TERM: "dumb" } }), false);
  assert.equal(shouldUseColor({ stream: { isTTY: false }, environment: {} }), false);
});

test("verdicts, pending state, and score parts use stable semantic colors", () => {
  assert.equal(colorTheme.verdict("AC").includes(`${ESC}1;32mAC`), true);
  for (const verdict of ["WA", "CE", "RE", "IE"]) assert.equal(colorTheme.verdict(verdict).includes(`${ESC}1;31m`), true);
  for (const verdict of ["TLE", "OLE", "PENDING"]) assert.equal(colorTheme.verdict(verdict).includes(`${ESC}1;33m`), true);
  assert.equal(colorTheme.score(100, 100).includes(`${ESC}1;32m100/100`), true);
  assert.equal(colorTheme.score(80, 100).includes(`${ESC}1;31m80${ESC}0m${ESC}1;32m/100`), true);
  assert.equal(cleanTerminalText(colorTheme.cell("AC", 8, colorTheme.verdict)), "AC      ");
});

test("Program formatter shows an aligned green PASS summary", () => {
  const result = {
    verdict: "AC",
    score: 100,
    maxScore: 100,
    compilation: { ok: true },
    cases: [
      sampleCase(),
      sampleCase({ id: "002-single", points: 80, maxPoints: 80, durationMs: 33 }),
    ],
  };
  const output = formatJudge(result, { theme: colorTheme, labPath: "labs/chapter-01/lab-01-06-demo" });
  const plain = cleanTerminalText(output);
  assert.equal(output.includes(`${ESC}1;32mAC`), true);
  assert.equal(output.includes(`${ESC}1;32mPASS`), true);
  assert.equal(output.includes(`${ESC}1;32m100/100`), true);
  assert.match(plain, /^CASE\s+RESULT\s+TIME\s+SCORE/m);
  assert.match(plain, /PASS {2}2\/2 cases · 100\/100 · 60 ms/);
  assert.doesNotMatch(plain, /Retry/);
});

test("Program formatter expands WA diagnostics and gives a copyable retry", () => {
  const result = {
    verdict: "WA",
    score: 20,
    maxScore: 100,
    compilation: { ok: true },
    cases: [
      sampleCase(),
      sampleCase({
        id: "002-single",
        verdict: "WA",
        points: 0,
        maxPoints: 80,
        durationMs: 18,
        comparison: { equal: false, difference: { kind: "token", index: 1, expected: "42", actual: "<end of output>" } },
      }),
    ],
  };
  const output = formatJudge(result, { theme: colorTheme, command: "pnpm lab:score", labPath: "labs/chapter-01/demo" });
  const plain = cleanTerminalText(output);
  assert.equal(output.includes(`${ESC}1;31mWA`), true);
  assert.equal(output.includes(`${ESC}1;31m20${ESC}0m${ESC}1;32m/100`), true);
  assert.match(plain, /首处差异：第 1 个 token/);
  assert.match(plain, /期望： "42"/);
  assert.match(plain, /实际： "<end of output>"/);
  assert.match(plain, /NOT FULL {2}1\/2 cases/);
  assert.match(plain, /Retry： pnpm lab:score -- labs\/chapter-01\/demo --case 002-single/);
});

test("compiler diagnostics stay plain and have terminal controls removed", () => {
  const output = formatJudge({
    verdict: "CE",
    score: 0,
    maxScore: 100,
    cases: [],
    compilation: { stderr: "\u001B[31mstudent/main.cpp:1: error\u001B[0m" },
  }, { theme: colorTheme });
  assert.match(output, /COMPILE ERROR/);
  assert.match(cleanTerminalText(output), /student\/main\.cpp:1: error/);
  assert.equal(output.includes(`${ESC}31mstudent`), false);
});

test("Project formatter distinguishes automated full score from manual pending", () => {
  const result = {
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
        judge: { cases: [sampleCase({ points: 100, maxPoints: 100 })] },
      },
      {
        id: "codec",
        kind: "ctest",
        status: "AC",
        weight: 50,
        weightedScore: 50,
        tests: [
          { name: "short", verdict: "AC", points: 50, maxPoints: 50 },
          { name: "codec-prefix-property", verdict: "AC", points: 50, maxPoints: 50 },
        ],
      },
      { id: "report", kind: "manual", status: "PENDING", weight: 20, weightedScore: 0 },
    ],
  };
  const output = formatProject(result, { theme: colorTheme, labPath: "labs/golden/project" });
  const plain = cleanTerminalText(output);
  assert.equal(output.includes(`${ESC}1;33mPENDING`), true);
  assert.equal(output.includes(`${ESC}1;31m80${ESC}0m${ESC}1;32m/100`), true);
  assert.match(plain, /Automated： 80\/80/);
  assert.match(plain, /Manual pending： 20/);
  assert.match(plain, /Provisional total： 80\/100/);
  assert.match(plain, /AUTOMATED PASS · MANUAL REVIEW PENDING/);
  const nested = plain.split("\n").filter((line) => /^ {2}(?:short|codec-prefix-property)/.test(line));
  assert.equal(nested[0].indexOf("AC"), nested[1].indexOf("AC"));
});

test("all non-interactive reporters share readable status tokens and remain plain when requested", () => {
  const doctorReport = {
    environment: {
      ok: true,
      platform: "win32",
      architecture: "x64",
      node: "v24.0.0",
      tools: [
        { name: "Clang", available: true, meetsMinimum: true, version: "21.1.0", minimum: "14.0.0" },
        { name: "GNU Make", available: false, meetsMinimum: false, minimum: "4.0.0" },
      ],
      issues: [],
    },
  };
  const outputs = [
    formatHelp(colorTheme),
    formatNew({ type: "program", relativeRoot: "labs/chapter-01/demo" }, colorTheme),
    formatValidate({ lab: { path: "labs/demo", type: "program", schemaVersion: 1 }, cases: 4 }, colorTheme),
    formatDoctor(doctorReport, colorTheme),
    formatBuild({ ok: true, target: "student", executable: "demo.exe" }, colorTheme),
    formatVerify("quiz", { ok: true, quiz: { count: 5, totalPoints: 100 } }, colorTheme),
    formatRefresh({ changed: 1, written: 0, changes: [{ id: "sample", expected: "tests/sample.out", diff: "@@ line 1 @@\n- old\n+ new" }] }, { theme: colorTheme }),
    formatPack({ packageRoot: "labs/demo/.lab-cache/packages/demo" }, colorTheme),
    formatClean({ cache: "labs/demo/.lab-cache" }, colorTheme),
    formatError({ code: "ARGUMENT_INVALID", message: "bad option" }, colorTheme),
  ];
  for (const output of outputs) assert.equal(output.includes(ESC), true);

  const plainOutputs = [
    formatHelp(plainTheme),
    formatDoctor(doctorReport, plainTheme),
    formatError({ code: "ARGUMENT_INVALID", message: "bad option" }, plainTheme),
  ];
  for (const output of plainOutputs) assert.equal(output.includes(ESC), false);
});
