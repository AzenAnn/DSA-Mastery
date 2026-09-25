import type { LabCase } from "@dsa/lab-core";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { loadLab } from "@dsa/lab-core";
import { REPO_ROOT } from "@dsa/lab-testkit";
import { expect, it } from "vitest";

const root = REPO_ROOT;
const directory = path.join(root, "labs/chapter-07/exercise");
const sequence = [
  "dfs-timestamps",
  "iterative-dfs",
  "dfs-edge-classification",
  "eulerian-classification",
  "seven-bridges",
  "course-schedule",
  "course-schedule-ii",
  "eventual-safe-states",
  "food-chain-count",
  "parallel-courses",
  "critical-path",
  "minimum-spanning-tree",
  "connect-cities",
  "connect-points",
  "minimum-effort-path",
  "dijkstra-trace",
  "dijkstra-matrix-path",
  "network-delay-time",
  "bellman-ford-negative",
  "floyd-all-pairs",
  "emergency-rescue",
  "wormholes",
  "astar-grid",
  "heuristic-validation",
  "eight-puzzle",
  "bfs-bipartite",
  "bipartite-matching",
  "pilot-pairing",
  "edmonds-karp",
  "min-cost-max-flow",
];
// 只有这些题配了独立 oracle 和完整 20 点用例，其余题不做用例断言。
const oracleIds = new Set([3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 14, 15, 22, 23, 24, 25, 27, 28, 29, 30]);
const normalize = (text: string) => text.replace(/\r\n?/g, "\n");

it("Ch7 contains exactly thirty exercises in learning order", async () => {
  const folders = (await readdir(directory)).filter((name) => /^E-07-\d+-/.test(name));
  const expectedFolders = sequence.map((slug, index) => `E-07-${String(index + 1).padStart(2, "0")}-${slug}`);
  expect(folders.sort()).toStrictEqual(expectedFolders);
  const seen = new Set<number>();
  for (const folder of folders) {
    const labRoot = path.join(directory, folder);
    const lab = await loadLab(labRoot);
    expect(lab.manifest.type).toBe("program");
    const readme = normalize(await readFile(path.join(labRoot, "README.md"), "utf8"));
    const id = Number(/^labId: "07E(\d+)"/m.exec(readme)?.[1]);
    expect(seen.has(id)).toBe(false);
    seen.add(id);
    expect(Number(/^E-07-(\d+)-/.exec(folder)![1])).toBe(id);
    const order = Number(/^order: (\d+)/m.exec(readme)?.[1]);
    expect(order, folder).toBe(100 + id);
    const title = /^title: "(.+)"$/m.exec(readme)![1];
    expect(title).toMatch(new RegExp(`^Lab 07-E-${String(id).padStart(2, "0")}：`));
    expect(readme.includes(`# ${title}\n`)).toBeTruthy();
    expect(readme).toMatch(/## 解题思路\n\n\S/);
    if (!oracleIds.has(id)) continue;
    const cases = JSON.parse(await readFile(path.join(labRoot, "tests/cases.json"), "utf8")) as LabCase[];
    expect(cases.length >= 20, folder).toBeTruthy();
    expect(cases.reduce((sum, item) => sum + item.points, 0)).toBe(100);
    const tags = new Set(cases.flatMap((item) => item.tags ?? []));
    for (const tag of ["sample", "normal", "boundary", "regression", "stress"]) {
      expect(tags.has(tag), `${folder}: missing ${tag}`).toBeTruthy();
    }
    for (const item of cases) {
      const output = await readFile(path.join(labRoot, item.expected));
      expect(output.includes(13), `${folder}: expected output must be LF`).toBe(false);
    }
    for (const [fence, key] of [
      ["input", "input"],
      ["output", "expected"],
    ] as const) {
      const sample = new RegExp(`\x60\x60\x60${fence}\\n([\\s\\S]*?)\x60\x60\x60`).exec(readme);
      expect(sample, `${folder}: missing sample ${fence}`).toBeTruthy();
      const expectedText = normalize(await readFile(path.join(labRoot, cases[0]![key]), "utf8"));
      expect(sample![1]!.trim(), `${folder}: sample drift`).toBe(expectedText.trim());
    }
    expect(await readFile(path.join(labRoot, "student/main.cpp"), "utf8")).toMatch(/TODO/);
  }
  expect(seen.size).toBe(30);
});
