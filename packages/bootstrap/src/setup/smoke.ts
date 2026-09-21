import type { SetupContext } from "./context.ts";
import path from "node:path";
import process from "node:process";
import { evaluateProfile } from "../checks.ts";
import { recordCommand, resultFailed, runWithRunner } from "./context.ts";
import { serializeHost, setupError } from "./report.ts";
import { inspectRepository } from "./repository.ts";

async function runLabJson(
  context: SetupContext,
  args: string[],
  label: string,
): Promise<{ ok?: boolean } & Record<string, unknown>> {
  const result = await runWithRunner(
    context,
    context.nodeCommand ?? process.execPath,
    ["packages/lab-cli/dist/cli.js", ...args, "--json", "--no-color"],
    {
      cwd: context.repoDir,
      timeMs: 10 * 60_000,
      outputKb: 8192,
    },
  );
  recordCommand(
    context,
    context.nodeCommand ?? process.execPath,
    ["packages/lab-cli/dist/cli.js", ...args, "--json", "--no-color"],
    result,
  );
  let report: { ok?: boolean };
  try {
    report = JSON.parse(result.stdout) as { ok?: boolean };
  } catch {
    throw setupError("SMOKE_FAILED", `${label} 未返回可解析的 JSON 报告。`, { result });
  }
  if (resultFailed(result) || report.ok !== true) {
    throw setupError("SMOKE_FAILED", `${label} 未通过；请查看报告或日志中的诊断。`, { report, result });
  }
  return report;
}

export async function runSmoke(context: SetupContext) {
  if (context.profile === "runtime") {
    context.smoke = [];
    return context.smoke;
  }
  const program = path.join(context.repoDir, "labs", "chapter-01", "exercise", "E-01-01-sequential-list-deduplication");
  const results = [
    {
      label: "Program doctor",
      report: await runLabJson(context, ["doctor", program], "Program doctor"),
    },
    {
      label: "Program reference sample",
      report: await runLabJson(
        context,
        ["run", program, "--target", "solution", "--case", "001-sample"],
        "Program reference sample",
      ),
    },
  ];
  if (context.profile === "full") {
    const project = path.join(context.repoDir, "labs", "chapter-08", "project", "P-08-01-avl-tree-rotations");
    results.push({ label: "Project doctor", report: await runLabJson(context, ["doctor", project], "Project doctor") });
    results.push({
      label: "Project reference CTest",
      report: await runLabJson(
        context,
        ["run", project, "--target", "solution", "--task", "avl"],
        "Project reference CTest",
      ),
    });
  }
  context.smoke = results;
  return results;
}

export async function runCheckOnly(context: SetupContext): Promise<Record<string, unknown>> {
  const evaluation = evaluateProfile(context.profile, context.host!.tools);
  context.evaluation = evaluation;
  const repository = await inspectRepository(context.repoDir, { runner: context.runner, env: context.env });
  context.repository = repository;
  const issues = [...evaluation.issues];
  if (!repository.valid) issues.push(`有效仓库：${context.repoDir}`);
  if (issues.length) {
    evaluation.ok = false;
    evaluation.issues = issues;
    throw setupError("ENVIRONMENT_NOT_READY", `只读检查未通过：${issues.join("；")}`, {
      evaluation,
      host: serializeHost(context.host),
      repository,
    });
  }
  return { evaluation, repository };
}
