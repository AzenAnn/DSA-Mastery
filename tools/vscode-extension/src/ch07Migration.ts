import type { LabKeyAlias } from "./progressKeys";

export const CH07_MIGRATION = "ch07-exercise-order-2026-09-16";

// Explicit maintainer migration. Slugs distinguish overlapping old/new numbers.
export const CH07_RENUMBERING = [
  [1, 1, "dfs-timestamps"], [5, 2, "iterative-dfs"],
  [13, 3, "dfs-edge-classification"], [14, 4, "eulerian-classification"],
  [15, 5, "seven-bridges"], [16, 6, "course-schedule"],
  [17, 7, "course-schedule-ii"], [18, 8, "eventual-safe-states"],
  [19, 9, "food-chain-count"], [20, 10, "parallel-courses"],
  [21, 11, "critical-path"], [4, 12, "minimum-spanning-tree"],
  [22, 13, "connect-cities"], [23, 14, "connect-points"],
  [24, 15, "minimum-effort-path"], [7, 16, "dijkstra-trace"],
  [8, 17, "dijkstra-matrix-path"], [9, 18, "network-delay-time"],
  [11, 19, "bellman-ford-negative"], [12, 20, "floyd-all-pairs"],
  [10, 21, "emergency-rescue"], [25, 22, "wormholes"],
  [26, 23, "astar-grid"], [27, 24, "heuristic-validation"],
  [28, 25, "eight-puzzle"], [6, 26, "bfs-bipartite"],
  [29, 27, "bipartite-matching"], [30, 28, "pilot-pairing"],
  [31, 29, "edmonds-karp"], [32, 30, "min-cost-max-flow"],
] as const;

export const CH07_RETIRED = [
  [2, "connected-components"], [3, "directed-cycle-detection"],
] as const;

const pad = (value: number) => String(value).padStart(2, "0");

export function ch07LegacyNames(name: string): string[] {
  const row = CH07_RENUMBERING.find(([, next, slug]) => name === `E-07-${pad(next)}-${slug}`);
  if (!row) return [];
  const [old, , slug] = row;
  return [`E-07-${pad(old)}-${slug}`, `lab-07-${pad(100 + old)}-${slug}`];
}

export function ch07IdAliases(
  labs: readonly { id: string; name: string; type: string }[],
  appliedMigrations: readonly string[],
): LabKeyAlias[] {
  if (appliedMigrations.includes(CH07_MIGRATION)) return [];
  const chapter = labs.filter((lab) => lab.type === "program" && /^07E\d+$/.test(lab.id));
  if (chapter.some((lab) => CH07_RETIRED.some(([old, slug]) => lab.name === `E-07-${pad(old)}-${slug}`))) return [];
  if (!CH07_RENUMBERING.every(([, next, slug]) =>
    chapter.some((lab) => lab.id === `07E${pad(next)}` && lab.name === `E-07-${pad(next)}-${slug}`))) return [];
  return [
    ...CH07_RENUMBERING.map(([old, next]) => ({ name: `07E${pad(old)}`, id: `07E${pad(next)}` })),
    // Preserve retired history under unambiguous directory keys, never new E02/E03.
    ...CH07_RETIRED.flatMap(([old, slug]) => [
      { name: `07E${pad(old)}`, id: `E-07-${pad(old)}-${slug}` },
      { name: `lab-07-${pad(100 + old)}-${slug}`, id: `E-07-${pad(old)}-${slug}` },
    ]),
  ];
}
