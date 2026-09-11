import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cp, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const source = path.resolve("labs/chapter-04/exercise/E-04-16-threaded-inorder-successor/.lab-cache/packages/E-04-16-threaded-inorder-successor-student");
const root = await mkdtemp(path.join(tmpdir(), "dsa-ch04-student-pack-"));
const reports = [];
try {
  await cp(source, root, { recursive: true });
  assert(!(await readdir(root)).includes("solution"));
  const manifest = JSON.parse(await readFile(path.join(root, "lab.json"), "utf8"));
  assert.equal(manifest.distribution, "student");
  assert.equal(manifest.targets.solution, undefined);
  assert.deepEqual(manifest.targets.student.sources, ["student/main.cpp", "support/runner.cpp"]);
  for (const command of ["validate", "build", "score"]) {
    const run = spawnSync(process.execPath, [path.join(root, "tools/lab/cli.mjs"), command, root, "--json"], { cwd: root, encoding: "utf8", maxBuffer: 4 * 1024 * 1024 });
    const report = JSON.parse(run.stdout);
    assert.equal(run.status, command === "score" ? 1 : 0, run.stdout + run.stderr);
    if (command === "score") {
      assert(report.result.compilation.ok);
      assert(report.result.score < report.result.maxScore);
    }
    reports.push({ command, exitCode: run.status, report });
    console.log(`${command}: PASS outside repository`);
  }
} finally {
  await rm(root, { recursive: true, force: true });
}
await writeFile(new URL("student-pack-verification.json", import.meta.url), JSON.stringify(reports, null, 2) + "\n");
