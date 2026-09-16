import { access, cp, mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { beforeAll, describe, expect, it, onTestFinished } from "vitest";
import { runProcess } from "../tools/lab/process.mjs";

const projectRoot = path.resolve(import.meta.dirname, "..");
const lab = "labs/chapter-01/exercise/E-01-01-sequential-list-deduplication";
const labRoot = path.join(projectRoot, lab);
const projectLabRoot = path.join(projectRoot, "labs", "chapter-08", "project", "P-08-01-avl-tree-rotations");

async function chooseMake() {
  for (const command of [process.env.MAKE, "make", "mingw32-make"].filter(Boolean)) {
    const result = await runProcess(command, ["--version"], { cwd: projectRoot, timeMs: 5000, outputKb: 256 });
    if (!result.spawnError && result.code === 0) return command;
  }
  return undefined;
}

async function runJson(command, args, cwd = projectRoot) {
  const result = await runProcess(command, args, { cwd, timeMs: 180_000, outputKb: 8192 });
  expect(result.code, `${command} failed: ${result.stderr || result.stdout}`).toBe(0);
  return JSON.parse(result.stdout);
}

function stable(report) {
  return {
    type: report.lab.type,
    verdict: report.result.verdict,
    score: report.result.score,
    maxScore: report.result.maxScore,
    cases: report.result.cases.map((item) => ({
      id: item.id,
      verdict: item.verdict,
      points: item.points,
      maxPoints: item.maxPoints,
    })),
  };
}

// GNU Make 未安装时按 Windows-first 合同跳过：pnpm 是官方兜底入口。
const make = await chooseMake();

describe.skipIf(!make)("Make and CLI stay consistent", () => {
  let cliReport;

  beforeAll(async () => {
    cliReport = await runJson(process.execPath, [
      "tools/lab/cli.mjs",
      "run",
      lab,
      "--case",
      "001-sample",
      "--target",
      "solution",
      "--json",
    ]);
  });

  it("root Make, lab-local Make and the direct CLI produce the same verdicts and score", async () => {
    const rootReport = await runJson(make, ["run", `LAB=${lab}`, "CASE=001-sample", "TARGET=solution", "JSON=1"]);
    const localReport = await runJson(make, ["run", "CASE=001-sample", "TARGET=solution", "JSON=1"], labRoot);
    expect(stable(rootReport)).toStrictEqual(stable(cliReport));
    expect(stable(localReport)).toStrictEqual(stable(cliReport));
  });

  it("help, doctor and build entry points succeed", async () => {
    const help = await runProcess(make, ["help"], { cwd: labRoot, timeMs: 10_000, outputKb: 1024 });
    expect(help.code, help.stderr || help.stdout).toBe(0);
    expect(help.stdout).toMatch(/DSA Mastery Lab CLI/);
    const doctor = await runProcess(make, ["doctor"], { cwd: labRoot, timeMs: 30_000, outputKb: 2048 });
    expect(doctor.code, doctor.stderr || doctor.stdout).toBe(0);
    const build = await runProcess(make, ["build", "TARGET=solution"], {
      cwd: labRoot,
      timeMs: 60_000,
      outputKb: 4096,
    });
    expect(build.code, build.stderr || build.stdout).toBe(0);
  });

  it("the interactive target pipes stdin into the built target", async () => {
    const interactive = await runProcess(make, ["interactive", "TARGET=solution"], {
      cwd: labRoot,
      input: "8\n1 1 2 2 3 4 4 5\n",
      timeMs: 60_000,
      outputKb: 4096,
    });
    expect(interactive.code, interactive.stderr || interactive.stdout).toBe(0);
    expect(interactive.stdout).toMatch(/1 2 3 4 5/);
  });

  it("make run hides a non-full-score exit status while make score stays strict", async () => {
    const learnerRun = await runProcess(make, ["run", "TARGET=student", "JSON=1"], {
      cwd: labRoot,
      timeMs: 60_000,
      outputKb: 4096,
    });
    expect(
      learnerRun.code,
      `make run must hide non-full-score exit status: ${learnerRun.stderr || learnerRun.stdout}`,
    ).toBe(0);
    expect(JSON.parse(learnerRun.stdout).result.score, "starter should remain non-full under make run").toBeLessThan(
      100,
    );
    expect(
      `${learnerRun.stdout}\n${learnerRun.stderr}`,
      "make run must not print Make failure noise for WA",
    ).not.toMatch(/\*\*\*/i);
    const strict = await runProcess(make, ["score", `LAB=${lab}`, "CASE=001-sample", "TARGET=student", "JSON=1"], {
      cwd: projectRoot,
      timeMs: 60_000,
      outputKb: 4096,
    });
    expect(strict.code, "make score must be strict when the student is not full score").not.toBe(0);
  });

  it("a standalone student package uses its embedded runner, including from a path with spaces", async () => {
    const packed = await runJson(process.execPath, [
      "tools/lab/cli.mjs",
      "pack",
      lab,
      "--profile",
      "student",
      "--json",
    ]);
    const packedMake = await runJson(make, ["run", "JSON=1"], packed.package.packageRoot);
    expect(packedMake.result.score, "standalone student-package Makefile must use its embedded runner").toBeLessThan(
      packedMake.result.maxScore,
    );

    const parent = await mkdtemp(path.join(os.tmpdir(), "dsa lab make "));
    onTestFinished(() => rm(parent, { recursive: true, force: true }));
    const spacedPackage = path.join(parent, "student package with spaces");
    await cp(packed.package.packageRoot, spacedPackage, { recursive: true });
    const spacedLocal = await runJson(make, ["run", "JSON=1"], spacedPackage);
    expect(spacedLocal.result.score, "Lab-local Make must support paths containing spaces").toBeLessThan(
      spacedLocal.result.maxScore,
    );
    const spacedRoot = await runJson(make, ["run", `LAB=${spacedPackage}`, "JSON=1"]);
    expect(stable(spacedRoot), "root Make LAB must preserve a path containing spaces").toStrictEqual(
      stable(spacedLocal),
    );
  });

  it("Project TASK selects exactly one task and the stdio oracle stays stable", async () => {
    const projectTask = await runJson(make, ["run", "TASK=bst", "TARGET=solution", "JSON=1"], projectLabRoot);
    expect(
      projectTask.result.tasks.map((task) => task.id),
      "Project Make TASK must select exactly one task",
    ).toStrictEqual(["bst"]);
    expect(projectTask.result.automatedScore).toBe(30);
    expect(projectTask.result.automatedMax).toBe(30);
    const refresh = await runJson(make, ["refresh-expected", "TASK=bst", "JSON=1"], projectLabRoot);
    expect(refresh.refresh.changed, "Project stdio oracle must be stable through Make").toBe(0);
  });

  it("clean removes lab and task-local caches", async () => {
    const clean = await runProcess(make, ["clean"], { cwd: labRoot, timeMs: 30_000, outputKb: 2048 });
    expect(clean.code, clean.stderr || clean.stdout).toBe(0);
    const cleanProject = await runProcess(make, ["clean"], { cwd: projectLabRoot, timeMs: 30_000, outputKb: 2048 });
    expect(cleanProject.code, cleanProject.stderr || cleanProject.stdout).toBe(0);
    await expect(
      access(path.join(projectLabRoot, "tasks", "task-01-bst", ".lab-cache")),
      "Project clean must remove task-local caches",
    ).rejects.toThrow();
  });
});
