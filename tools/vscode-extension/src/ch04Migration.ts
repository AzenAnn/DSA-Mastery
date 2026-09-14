import type { LabKeyAlias } from "./progressKeys";

export const CH04_MIGRATION = "ch04-exercise-order-2026-09-11";

// Old and new IDs overlap; the unchanged slug identifies the original problem.
export const CH04_RENUMBERING = [
  [1, 3, "complete-binary-tree-check"],
  [2, 20, "binary-tree-maximum-width"],
  [3, 7, "binary-tree-preorder-traversal"],
  [4, 9, "binary-tree-level-and-zigzag-order"],
  [5, 10, "binary-tree-right-side-view"],
  [6, 13, "construct-binary-tree-pre-in"],
  [7, 14, "construct-binary-tree-in-post"],
  [8, 22, "flatten-binary-tree-to-linked-list"],
  [9, 21, "symmetric-tree"],
  [10, 32, "subtree-of-another-tree"],
  [11, 33, "sum-root-to-leaf-numbers"],
  [12, 23, "path-sum-all-paths"],
  [13, 26, "diameter-of-binary-tree"],
  [14, 25, "lowest-common-ancestor"],
  [15, 34, "binary-tree-maximum-path-sum"],
  [16, 29, "network-optimal-location"],
  [17, 28, "research-team-formation"],
  [18, 30, "communication-base-station"],
  [19, 27, "longest-zigzag-path"],
  [20, 31, "tree-isomorphism"],
] as const;

const pad = (number: number) => String(number).padStart(2, "0");

export function ch04LegacyNames(name: string): string[] {
  const row = CH04_RENUMBERING.find(([, next, slug]) => name === `E-04-${pad(next)}-${slug}`);
  return row ? [`E-04-${pad(row[0])}-${row[2]}`, `lab-04-${pad(row[0] + 8)}-${row[2]}`] : [];
}

export function ch04IdAliases(
  labs: readonly { id: string; name: string; type: string }[],
  appliedMigrations: readonly string[],
): LabKeyAlias[] {
  if (appliedMigrations.includes(CH04_MIGRATION)) return [];
  const expected = CH04_RENUMBERING.map(([, next, slug]) => ({ id: `04E${pad(next)}`, name: `E-04-${pad(next)}-${slug}` }));
  expected.push({ id: "04E01", name: "E-04-01-lcrs-leaf-count" });
  if (!expected.every((entry) => labs.some((lab) => lab.type === "program" && lab.id === entry.id && lab.name === entry.name))) return [];
  return CH04_RENUMBERING.map(([old, next]) => ({ name: `04E${pad(old)}`, id: `04E${pad(next)}` }));
}
