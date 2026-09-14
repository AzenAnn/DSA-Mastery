import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import test from "node:test";
import { build } from "esbuild";
import { CH04_MIGRATION, CH04_RENUMBERING, ch04IdAliases, ch04LegacyNames } from "../src/ch04Migration.ts";
import { remapRecordKeys } from "../src/progressKeys.ts";

const pad = (value: number) => String(value).padStart(2, "0");
const labs = CH04_RENUMBERING.map(([, next, slug]) => ({
  id: `04E${pad(next)}`, name: `E-04-${pad(next)}-${slug}`, type: "program", legacyNames: ch04LegacyNames(`E-04-${pad(next)}-${slug}`),
}));
labs.push({ id: "04E01", name: "E-04-01-lcrs-leaf-count", type: "program", legacyNames: [] });

test("simultaneously remaps all overlapping IDs without consuming moved records", () => {
  const source = Object.fromEntries(CH04_RENUMBERING.map(([old]) => [`04E${pad(old)}`, { old }]));
  const migrated = remapRecordKeys(source, ch04IdAliases(labs, []), () => { throw new Error("Unexpected collision"); });
  for (const [old, next] of CH04_RENUMBERING) assert.deepEqual(migrated.records[`04E${pad(next)}`], { old });
  assert.equal(Object.keys(migrated.records).length, 20);
  assert.equal(source["04E01"].old, 1);
  assert.deepEqual(ch04IdAliases(labs, [CH04_MIGRATION]), []);
  assert.deepEqual(ch04IdAliases(labs.slice(1), []), []);
  const oldLayout = CH04_RENUMBERING.map(([old, , slug]) => ({ id: `04E${pad(old)}`, name: `E-04-${pad(old)}-${slug}`, type: "program" }));
  assert.deepEqual(ch04IdAliases(oldLayout, []), []);
});

test("tracker awaits backup, persists marker, merges aliases, preserves snapshots and survives reset", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "dsa-ch04-progress-"));
  try {
    const bundle = path.join(root, "progress.cjs");
    await build({
      entryPoints: [path.resolve("src/progress.ts")], outfile: bundle, bundle: true, platform: "node", format: "cjs",
      plugins: [{ name: "vscode-test", setup(builder) {
        builder.onResolve({ filter: /^vscode$/ }, () => ({ path: "vscode", namespace: "mock" }));
        builder.onLoad({ filter: /.*/, namespace: "mock" }, () => ({ contents: "module.exports = {};" }));
      } }],
    });
    const { ProgressTracker } = createRequire(import.meta.url)(bundle);
    const stateKey = "dsaMastery.progress.v1";
    const entry = (name: string, score: number) => ({
      passed: score === 100, bestScore: score, maxScore: 100, submissionCount: 1,
      history: [{ id: name, at: "2026-09-01T00:00:00Z", verdict: "AC", score, maxScore: 100, snapshot: `submissions/${name}/main.cpp` }],
    });
    const source = {
      schemaVersion: 3,
      labs: { "04E01": entry("old-id", 60), "E-04-01-complete-binary-tree-check": entry("old-dir", 100), "04E03": entry("preorder", 40) },
      quizzes: { "04T01": { passed: true } },
      events: [{ at: "2026-09-01T00:00:00Z", kind: "submit", labName: "04E01", labType: "program" }],
    };
    const memory = new Map<string, unknown>([[stateKey, structuredClone(source)]]);
    const writes: string[] = [];
    let failBackup = true;
    const context = {
      globalStorageUri: { fsPath: root },
      globalState: {
        get(key: string) { return structuredClone(memory.get(key)); },
        async update(key: string, value: unknown) {
          if (key.includes("backup") && failBackup) throw new Error("Backup unavailable");
          writes.push(key);
          memory.set(key, structuredClone(value));
        },
      },
    };
    const tracker = new ProgressTracker(context);
    await assert.rejects(tracker.migrateLabKeys(labs), /Backup unavailable/);
    assert.deepEqual(memory.get(stateKey), source);
    assert.equal(tracker.get("04E01").bestScore, 60);
    failBackup = false;
    await tracker.migrateLabKeys(labs);
    assert.match(writes[0], /backup/);
    assert.equal(writes[1], stateKey);
    assert.deepEqual(memory.get(writes[0]), sourceWithMarker(source));
    assert.equal(tracker.get("04E03").bestScore, 100);
    assert.equal(tracker.get("04E07").bestScore, 40);
    assert.deepEqual(tracker.get("04E03").history.map((item: { snapshot: string }) => item.snapshot).sort(), ["submissions/old-dir/main.cpp", "submissions/old-id/main.cpp"]);
    assert.deepEqual(tracker.events(), [{ ...source.events[0], labName: "04E03" }]);
    const saved = structuredClone(memory.get(stateKey));
    const restarted = new ProgressTracker(context);
    await restarted.migrateLabKeys(labs);
    assert.deepEqual(memory.get(stateKey), saved);
    await restarted.resetAll();
    const reset = memory.get(stateKey) as { appliedMigrations: string[]; labs: Record<string, unknown> };
    assert.deepEqual(reset.appliedMigrations, [CH04_MIGRATION]);
    reset.labs["04E01"] = entry("new-leaf-count", 80);
    memory.set(stateKey, reset);
    const afterReset = new ProgressTracker(context);
    await afterReset.migrateLabKeys(labs);
    assert.equal(afterReset.get("04E01").bestScore, 80);
    assert.equal(afterReset.get("04E03"), undefined);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

function sourceWithMarker<T>(source: T) { return { ...source, appliedMigrations: [] }; }
