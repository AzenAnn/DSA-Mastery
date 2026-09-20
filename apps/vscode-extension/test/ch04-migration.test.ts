import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";
import { expect, it } from "vitest";
import { CH04_MIGRATION, CH04_RENUMBERING, ch04IdAliases, ch04LegacyNames } from "../src/ch04Migration.ts";
import type { LabProgress } from "../src/progress.ts";
import { remapRecordKeys } from "../src/progressKeys.ts";

// vitest 从仓库根运行，路径不能再相对 cwd 解析。
const extensionRoot = path.resolve(fileURLToPath(new URL(".", import.meta.url)), "..");

const pad = (value: number) => String(value).padStart(2, "0");
const labs = CH04_RENUMBERING.map(([, next, slug]) => ({
  id: `04E${pad(next)}`, name: `E-04-${pad(next)}-${slug}`, type: "program", legacyNames: ch04LegacyNames(`E-04-${pad(next)}-${slug}`),
}));
labs.push({ id: "04E01", name: "E-04-01-lcrs-leaf-count", type: "program", legacyNames: [] });

it("simultaneously remaps all overlapping IDs without consuming moved records", () => {
  const source = Object.fromEntries(CH04_RENUMBERING.map(([old]) => [`04E${pad(old)}`, { old }]));
  const migrated = remapRecordKeys(source, ch04IdAliases(labs, []), () => { throw new Error("Unexpected collision"); });
  for (const [old, next] of CH04_RENUMBERING) expect(migrated.records[`04E${pad(next)}`]).toStrictEqual({ old });
  expect(Object.keys(migrated.records).length).toBe(17);
  expect(source["04E01"].old).toBe(1);
  expect(ch04IdAliases(labs, [CH04_MIGRATION])).toStrictEqual([]);
  expect(ch04IdAliases(labs.slice(1), [])).toStrictEqual([]);
  const oldLayout = CH04_RENUMBERING.map(([old, , slug]) => ({ id: `04E${pad(old)}`, name: `E-04-${pad(old)}-${slug}`, type: "program" }));
  expect(ch04IdAliases(oldLayout, [])).toStrictEqual([]);
});

it("tracker awaits backup, persists marker, merges aliases, preserves snapshots and survives reset", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "dsa-ch04-progress-"));
  try {
    const bundle = path.join(root, "progress.cjs");
    await build({
      entryPoints: [path.join(extensionRoot, "src/progress.ts")], outfile: bundle, bundle: true, platform: "node", format: "cjs",
      plugins: [{ name: "vscode-test", setup(builder) {
        builder.onResolve({ filter: /^vscode$/ }, () => ({ path: "vscode", namespace: "mock" }));
        builder.onLoad({ filter: /.*/, namespace: "mock" }, () => ({ contents: "module.exports = {};" }));
      } }],
    });
    // 打包产物只被这个用例按下面这组接口驱动，替身也只实现到这个程度。
    interface Tracker {
      migrateLabKeys: (labs: { id: string; name: string; legacyNames: string[] }[]) => Promise<void>;
      get: (id: string) => LabProgress;
      events: () => unknown[];
      resetAll: () => Promise<void>;
    }
    const { ProgressTracker } = createRequire(import.meta.url)(bundle) as {
      ProgressTracker: new (context: object) => Tracker;
    };
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
    await expect(tracker.migrateLabKeys(labs)).rejects.toThrow(/Backup unavailable/);
    expect(memory.get(stateKey)).toStrictEqual(source);
    expect(tracker.get("04E01").bestScore).toBe(60);
    failBackup = false;
    await tracker.migrateLabKeys(labs);
    expect(writes[0]).toMatch(/backup/);
    expect(writes[1]).toBe(stateKey);
    expect(memory.get(writes[0])).toStrictEqual(sourceWithMarker(source));
    expect(tracker.get("04E03").bestScore).toBe(100);
    expect(tracker.get("04E07").bestScore).toBe(40);
    expect(tracker.get("04E03").history.map((item: { snapshot: string }) => item.snapshot).sort()).toStrictEqual(["submissions/old-dir/main.cpp", "submissions/old-id/main.cpp"]);
    expect(tracker.events()).toStrictEqual([{ ...source.events[0], labName: "04E03" }]);
    const saved = structuredClone(memory.get(stateKey));
    const restarted = new ProgressTracker(context);
    await restarted.migrateLabKeys(labs);
    expect(memory.get(stateKey)).toStrictEqual(saved);
    await restarted.resetAll();
    const reset = memory.get(stateKey) as { appliedMigrations: string[]; labs: Record<string, unknown> };
    expect(reset.appliedMigrations).toStrictEqual([CH04_MIGRATION]);
    reset.labs["04E01"] = entry("new-leaf-count", 80);
    memory.set(stateKey, reset);
    const afterReset = new ProgressTracker(context);
    await afterReset.migrateLabKeys(labs);
    expect(afterReset.get("04E01").bestScore).toBe(80);
    expect(afterReset.get("04E03")).toBe(undefined);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

function sourceWithMarker<T>(source: T) { return { ...source, appliedMigrations: [] }; }
