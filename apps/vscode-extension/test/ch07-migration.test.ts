import type { LabProgress } from "../src/progress/tracker.ts";
import { mkdtemp, rm } from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";
import { expect, it } from "vitest";
import { remapEventKeys, remapRecordKeys } from "../src/progress/keys.ts";
import { CH04_MIGRATION, CH04_RENUMBERING } from "../src/progress/migrations/ch04.ts";
import {
  CH07_MIGRATION,
  CH07_RENUMBERING,
  CH07_RETIRED,
  ch07IdAliases,
  ch07LegacyNames,
} from "../src/progress/migrations/ch07.ts";

// vitest 从仓库根运行，路径不能再相对 cwd 解析。
const extensionRoot = path.resolve(fileURLToPath(new URL(".", import.meta.url)), "..");

const pad = (value: number) => String(value).padStart(2, "0");
const labs = CH07_RENUMBERING.map(([, next, slug]) => ({
  id: `07E${pad(next)}`,
  name: `E-07-${pad(next)}-${slug}`,
  type: "program",
  legacyNames: ch07LegacyNames(`E-07-${pad(next)}-${slug}`),
}));

it("all 32 original identities survive without mixing retired or overlapping scores", () => {
  const source = Object.fromEntries(
    Array.from({ length: 32 }, (_, index) => [`07E${pad(index + 1)}`, { old: index + 1 }]),
  );
  const aliases = ch07IdAliases(labs, []);
  const migrated = remapRecordKeys(source, aliases, () => {
    throw new Error("Unexpected collision");
  });
  for (const [old, next] of CH07_RENUMBERING) expect(migrated.records[`07E${pad(next)}`]).toStrictEqual({ old });
  for (const [old, slug] of CH07_RETIRED) expect(migrated.records[`E-07-${pad(old)}-${slug}`]).toStrictEqual({ old });
  expect(Object.keys(migrated.records).length).toBe(32);
  expect(source["07E02"]).toStrictEqual({ old: 2 });
  const events = Object.keys(source).map((labName) => ({ labName, kind: "pass", at: "2026-09-01" }));
  const mapped = remapEventKeys(events, aliases);
  expect(new Set(mapped.events.map((event) => event.labName)).size).toBe(32);
  expect(mapped.events[1].labName).toBe("E-07-02-connected-components");
  expect(mapped.events[4].labName).toBe("07E02");
  expect(mapped.events[4].at).toBe(events[4].at);
  expect(ch07IdAliases(labs, [CH07_MIGRATION])).toStrictEqual([]);
  expect(ch07IdAliases(labs.slice(1), [])).toStrictEqual([]);
  expect(
    ch07IdAliases([...labs, { id: "07E02", name: "E-07-02-connected-components", type: "program" }], []),
  ).toStrictEqual([]);
  const oldLayout = CH07_RENUMBERING.map(([old, , slug]) => ({
    id: `07E${pad(old)}`,
    name: `E-07-${pad(old)}-${slug}`,
    type: "program",
  }));
  expect(ch07IdAliases(oldLayout, [])).toStrictEqual([]);
});

it("real Ch7 discovery has thirty matching identities and legacy directory aliases", async () => {
  const buildRoot = await mkdtemp(path.join(tmpdir(), "dsa-ch07-index-"));
  let discoverProgramLabs: typeof import("../src/labs/discovery.ts").discoverProgramLabs;
  try {
    const bundle = path.join(buildRoot, "labIndex.cjs");
    await build({
      entryPoints: [path.join(extensionRoot, "src/labs/discovery.ts")],
      outfile: bundle,
      bundle: true,
      platform: "node",
      format: "cjs",
    });
    ({ discoverProgramLabs } = createRequire(import.meta.url)(bundle) as typeof import("../src/labs/discovery.ts"));
  } finally {
    await rm(buildRoot, { recursive: true, force: true });
  }
  const chapters = await discoverProgramLabs(path.resolve(extensionRoot, "../.."));
  const chapter = chapters.find((entry) => entry.chapter === 7);
  if (!chapter) throw new Error("Ch7 missing from discovery");
  const actual = chapter.labs.filter((lab) => lab.type === "program");
  expect(actual.length).toBe(30);
  for (const [index, expected] of labs.entries()) {
    expect(actual[index].id).toBe(expected.id);
    expect(actual[index].name).toBe(expected.name);
    for (const legacy of expected.legacyNames) expect(actual[index].legacyNames).toContain(legacy);
  }
  expect(ch07IdAliases(actual, []).length).toBeGreaterThan(0);
});

it("tracker backs up, migrates both chapters once, preserves snapshots and survives restart/reset", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "dsa-ch07-progress-"));
  try {
    const bundle = path.join(root, "progress.cjs");
    await build({
      entryPoints: [path.join(extensionRoot, "src/progress/tracker.ts")],
      outfile: bundle,
      bundle: true,
      platform: "node",
      format: "cjs",
      plugins: [
        {
          name: "vscode-test",
          setup(builder) {
            builder.onResolve({ filter: /^vscode$/ }, () => ({ path: "vscode", namespace: "mock" }));
            builder.onLoad({ filter: /.*/, namespace: "mock" }, () => ({ contents: "module.exports = {};" }));
          },
        },
      ],
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
      passed: score === 100,
      bestScore: score,
      maxScore: 100,
      submissionCount: 1,
      history: [
        {
          id: name,
          at: "2026-09-01T00:00:00Z",
          verdict: "AC",
          score,
          maxScore: 100,
          snapshot: `submissions/${name}/main.cpp`,
        },
      ],
    });
    const source = {
      schemaVersion: 3,
      labs: {
        "07E05": entry("iterative-id", 60),
        "E-07-05-iterative-dfs": entry("iterative-dir", 100),
        "07E02": entry("removed-components", 70),
        "07E03": entry("removed-cycle", 80),
        "07E13": entry("edge-classification", 40),
        "04E01": entry("ch4-tree", 90),
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
        get(key: string) {
          return structuredClone(memory.get(key));
        },
        async update(key: string, value: unknown) {
          if (key.includes("backup") && failBackup) throw new Error("Backup unavailable");
          writes.push(key);
          memory.set(key, structuredClone(value));
        },
      },
    };
    const ch4 = CH04_RENUMBERING.filter(([, next]) => next <= 31).map(([, next, slug]) => ({
      id: `04E${pad(next)}`,
      name: `E-04-${pad(next)}-${slug}`,
      type: "program",
      legacyNames: [] as string[],
    }));
    ch4.push({ id: "04E01", name: "E-04-01-lcrs-leaf-count", type: "program", legacyNames: [] });
    const allLabs = [...labs, ...ch4];
    const tracker = new ProgressTracker(context);
    await expect(tracker.migrateLabKeys(allLabs)).rejects.toThrow(/Backup unavailable/);
    expect(memory.get(stateKey)).toStrictEqual(source);
    expect(tracker.get("07E05").bestScore).toBe(60);
    failBackup = false;
    await tracker.migrateLabKeys(allLabs);
    expect(writes[0]).toMatch(/backup/);
    expect(writes[1]).toBe(stateKey);
    expect(memory.get(writes[0])).toStrictEqual({ ...source, appliedMigrations: [] });
    expect(tracker.get("07E02").bestScore).toBe(100);
    expect(tracker.get("07E03").bestScore).toBe(40);
    expect(tracker.get("E-07-02-connected-components").bestScore).toBe(70);
    expect(tracker.get("E-07-03-directed-cycle-detection").bestScore).toBe(80);
    expect(tracker.get("04E03").bestScore).toBe(90);
    expect(
      tracker
        .get("07E02")
        .history.map((item: { snapshot: string }) => item.snapshot)
        .sort(),
    ).toStrictEqual(["submissions/iterative-dir/main.cpp", "submissions/iterative-id/main.cpp"]);
    expect(tracker.events()).toStrictEqual([{ ...source.events[0], labName: "07E02" }]);
    const saved = structuredClone(memory.get(stateKey));
    const restarted = new ProgressTracker(context);
    await restarted.migrateLabKeys(allLabs);
    expect(memory.get(stateKey)).toStrictEqual(saved);
    await restarted.resetAll();
    const reset = memory.get(stateKey) as { appliedMigrations: string[]; labs: Record<string, unknown> };
    expect(reset.appliedMigrations).toStrictEqual([CH04_MIGRATION, CH07_MIGRATION]);
    reset.labs["07E05"] = entry("new-seven-bridges", 80);
    memory.set(stateKey, reset);
    const afterReset = new ProgressTracker(context);
    await afterReset.migrateLabKeys(allLabs);
    expect(afterReset.get("07E05").bestScore).toBe(80);
    expect(afterReset.get("07E02")).toBe(undefined);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
