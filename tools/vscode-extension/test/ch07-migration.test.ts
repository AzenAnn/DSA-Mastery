import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import test from "node:test";
import { build } from "esbuild";
import { CH07_MIGRATION, CH07_RENUMBERING, CH07_RETIRED, ch07IdAliases, ch07LegacyNames } from "../src/ch07Migration.ts";
import { CH04_MIGRATION, CH04_RENUMBERING } from "../src/ch04Migration.ts";
import { remapRecordKeys, remapEventKeys } from "../src/progressKeys.ts";

const pad = (value: number) => String(value).padStart(2, "0");
const labs = CH07_RENUMBERING.map(([, next, slug]) => ({
  id: `07E${pad(next)}`, name: `E-07-${pad(next)}-${slug}`, type: "program",
  legacyNames: ch07LegacyNames(`E-07-${pad(next)}-${slug}`),
}));

test("all 32 original identities survive without mixing retired or overlapping scores", () => {
  const source = Object.fromEntries(Array.from({ length: 32 }, (_, index) => [`07E${pad(index + 1)}`, { old: index + 1 }]));
  const aliases = ch07IdAliases(labs, []);
  const migrated = remapRecordKeys(source, aliases, () => { throw new Error("Unexpected collision"); });
  for (const [old, next] of CH07_RENUMBERING) assert.deepEqual(migrated.records[`07E${pad(next)}`], { old });
  for (const [old, slug] of CH07_RETIRED) assert.deepEqual(migrated.records[`E-07-${pad(old)}-${slug}`], { old });
  assert.equal(Object.keys(migrated.records).length, 32);
  assert.deepEqual(source["07E02"], { old: 2 });
  const events = Object.keys(source).map((labName) => ({ labName, kind: "pass", at: "2026-09-01" }));
  const mapped = remapEventKeys(events, aliases);
  assert.equal(new Set(mapped.events.map((event) => event.labName)).size, 32);
  assert.equal(mapped.events[1].labName, "E-07-02-connected-components");
  assert.equal(mapped.events[4].labName, "07E02");
  assert.equal(mapped.events[4].at, events[4].at);
  assert.deepEqual(ch07IdAliases(labs, [CH07_MIGRATION]), []);
  assert.deepEqual(ch07IdAliases(labs.slice(1), []), []);
  assert.deepEqual(ch07IdAliases([...labs, { id: "07E02", name: "E-07-02-connected-components", type: "program" }], []), []);
  const oldLayout = CH07_RENUMBERING.map(([old, , slug]) => ({ id: `07E${pad(old)}`, name: `E-07-${pad(old)}-${slug}`, type: "program" }));
  assert.deepEqual(ch07IdAliases(oldLayout, []), []);
});

test("real Ch7 discovery has thirty matching identities and legacy directory aliases", async () => {
  const buildRoot = await mkdtemp(path.join(tmpdir(), "dsa-ch07-index-"));
  let discoverProgramLabs: typeof import("../src/labIndex.ts").discoverProgramLabs;
  try {
    const bundle = path.join(buildRoot, "labIndex.cjs");
    await build({ entryPoints: [path.resolve("src/labIndex.ts")], outfile: bundle, bundle: true, platform: "node", format: "cjs" });
    ({ discoverProgramLabs } = createRequire(import.meta.url)(bundle));
  } finally {
    await rm(buildRoot, { recursive: true, force: true });
  }
  const chapters = await discoverProgramLabs(path.resolve("../.."));
  const chapter = chapters.find((entry) => entry.chapter === 7);
  assert.ok(chapter);
  const actual = chapter.labs.filter((lab) => lab.type === "program");
  assert.equal(actual.length, 30);
  for (const [index, expected] of labs.entries()) {
    assert.equal(actual[index].id, expected.id);
    assert.equal(actual[index].name, expected.name);
    for (const legacy of expected.legacyNames) assert.ok(actual[index].legacyNames.includes(legacy));
  }
  assert.ok(ch07IdAliases(actual, []).length > 0);
});

test("tracker backs up, migrates both chapters once, preserves snapshots and survives restart/reset", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "dsa-ch07-progress-"));
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
      labs: {
        "07E05": entry("iterative-id", 60), "E-07-05-iterative-dfs": entry("iterative-dir", 100),
        "07E02": entry("removed-components", 70), "07E03": entry("removed-cycle", 80),
        "07E13": entry("edge-classification", 40), "04E01": entry("ch4-tree", 90),
      },
      quizzes: { "07T01": { passed: true } },
      events: [{ at: "2026-09-01T00:00:00Z", kind: "submit", labName: "07E05", labType: "program" }],
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
    const ch4 = CH04_RENUMBERING.filter(([, next]) => next <= 31).map(([, next, slug]) => ({
      id: `04E${pad(next)}`, name: `E-04-${pad(next)}-${slug}`, type: "program", legacyNames: [],
    }));
    ch4.push({ id: "04E01", name: "E-04-01-lcrs-leaf-count", type: "program", legacyNames: [] });
    const allLabs = [...labs, ...ch4];
    const tracker = new ProgressTracker(context);
    await assert.rejects(tracker.migrateLabKeys(allLabs), /Backup unavailable/);
    assert.deepEqual(memory.get(stateKey), source);
    assert.equal(tracker.get("07E05").bestScore, 60);
    failBackup = false;
    await tracker.migrateLabKeys(allLabs);
    assert.match(writes[0], /backup/);
    assert.equal(writes[1], stateKey);
    assert.deepEqual(memory.get(writes[0]), { ...source, appliedMigrations: [] });
    assert.equal(tracker.get("07E02").bestScore, 100);
    assert.equal(tracker.get("07E03").bestScore, 40);
    assert.equal(tracker.get("E-07-02-connected-components").bestScore, 70);
    assert.equal(tracker.get("E-07-03-directed-cycle-detection").bestScore, 80);
    assert.equal(tracker.get("04E03").bestScore, 90);
    assert.deepEqual(tracker.get("07E02").history.map((item: { snapshot: string }) => item.snapshot).sort(),
      ["submissions/iterative-dir/main.cpp", "submissions/iterative-id/main.cpp"]);
    assert.deepEqual(tracker.events(), [{ ...source.events[0], labName: "07E02" }]);
    const saved = structuredClone(memory.get(stateKey));
    const restarted = new ProgressTracker(context);
    await restarted.migrateLabKeys(allLabs);
    assert.deepEqual(memory.get(stateKey), saved);
    await restarted.resetAll();
    const reset = memory.get(stateKey) as { appliedMigrations: string[]; labs: Record<string, unknown> };
    assert.deepEqual(reset.appliedMigrations, [CH04_MIGRATION, CH07_MIGRATION]);
    reset.labs["07E05"] = entry("new-seven-bridges", 80);
    memory.set(stateKey, reset);
    const afterReset = new ProgressTracker(context);
    await afterReset.migrateLabKeys(allLabs);
    assert.equal(afterReset.get("07E05").bestScore, 80);
    assert.equal(afterReset.get("07E02"), undefined);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
