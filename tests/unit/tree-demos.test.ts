import type { BinaryNode, BinaryTree, Forest, NodeId } from "../../public/demos/tree-algorithms.mjs";
import { expect, it } from "vitest";
import {
  BINARY_PRESETS,
  FOREST_PRESETS,
  binaryTree,
  threadingTrace,
  morrisTrace,
  flattenTrace,
  forestTrace,
  forestToBinary,
} from "../../public/demos/tree-algorithms.mjs";

type Shape = readonly [Shape, Shape] | null;

function expected(tree: BinaryTree, order: "pre" | "in"): NodeId[] {
  const map = new Map(tree.nodes.map((node) => [node.id, node]));
  const result: NodeId[] = [];
  function visit(id: NodeId | null) {
    if (id === null) return;
    const node = map.get(id)!;
    if (order === "pre") result.push(id);
    visit(node.left);
    if (order === "in") result.push(id);
    visit(node.right);
  }
  visit(tree.root);
  return result;
}

function walkThreads(tree: BinaryTree, reverse: boolean): NodeId[] {
  const map = new Map(tree.nodes.map((node) => [node.id, node]));
  const result: NodeId[] = [];
  const down = reverse ? "right" : "left",
    next = reverse ? "left" : "right";
  const downTag = reverse ? "rtag" : "ltag",
    nextTag = reverse ? "ltag" : "rtag";
  let id = tree.root;
  while (id !== null && map.get(id)![downTag] === 0) id = map.get(id)![down];
  while (id !== null) {
    expect(result.length < tree.nodes.length, "thread traversal must terminate").toBeTruthy();
    result.push(id);
    const node = map.get(id)!;
    id = node[next];
    if (node[nextTag] === 0) {
      while (id !== null && map.get(id)![downTag] === 0) id = map.get(id)![down];
    }
  }
  return result;
}

function assertThreading(tree: BinaryTree) {
  const frames = threadingTrace(tree),
    final = frames.at(-1)!,
    order = expected(tree, "in");
  expect(final.phase).toBe("done");
  expect(final.output).toStrictEqual(order);
  const byId = new Map(final.nodes.map((node) => [node.id, node]));
  for (const original of tree.nodes) {
    const node = byId.get(original.id)!,
      i = order.indexOf(node.id);
    expect(node.ltag).toBe(original.left === null ? 1 : 0);
    expect(node.rtag).toBe(original.right === null ? 1 : 0);
    expect(node.left).toBe(original.left ?? order[i - 1] ?? null);
    expect(node.right).toBe(original.right ?? order[i + 1] ?? null);
  }
  expect(walkThreads({ ...tree, nodes: final.nodes }, false)).toStrictEqual(order);
  expect(walkThreads({ ...tree, nodes: final.nodes }, true)).toStrictEqual([...order].reverse());
  expect(final.stack).toStrictEqual([]);
  for (const frame of frames) expect(frame.output).toStrictEqual(order.slice(0, frame.output.length));
}

function assertMorris(tree: BinaryTree) {
  const frames = morrisTrace(tree),
    order = expected(tree, "in");
  const original = new Map(tree.nodes.map((node) => [node.id, node]));
  expect(frames.at(-1)!.nodes, "Morris restores every original pointer").toStrictEqual(tree.nodes);
  expect(frames.at(-1)!.output).toStrictEqual(order);
  expect(frames.filter((frame) => frame.phase === "create").length).toBe(
    frames.filter((frame) => frame.phase === "remove").length,
  );
  for (const frame of frames) {
    expect(frame.output).toStrictEqual(order.slice(0, frame.output.length));
    for (const node of frame.nodes) {
      expect(node.left).toBe(original.get(node.id)!.left);
      if (!frame.temporary.includes(node.id)) expect(node.right).toBe(original.get(node.id)!.right);
      else expect(original.get(node.id)!.right, "only a vacant right pointer can be borrowed").toBe(null);
    }
  }
  expect(frames.at(-1)!.temporary).toStrictEqual([]);
}

function assertFlatten(tree: BinaryTree) {
  const frames = flattenTrace(tree),
    final = frames.at(-1)!,
    order = expected(tree, "pre");
  expect(final.output).toStrictEqual(order);
  const byId = new Map(final.nodes.map((node) => [node.id, node]));
  expect(final.scans <= tree.nodes.length, "total predecessor moves stay linear").toBeTruthy();
  order.forEach((id, i) => {
    expect(byId.get(id)!.left).toBe(null);
    expect(byId.get(id)!.right).toBe(order[i + 1] ?? null);
  });
  for (const frame of frames) expect(frame.output).toStrictEqual(order.slice(0, frame.output.length));
  for (let i = 1; i < frames.length; i++) {
    const previous = frames[i - 1];
    for (const change of frames[i]!.changes) {
      const before = previous!.nodes.find((node) => node.id === change.from)!;
      const after = frames[i]!.nodes.find((node) => node.id === change.from)!;
      expect(before[change.slot]).toBe(change.before);
      expect(after[change.slot]).toBe(change.after);
    }
  }
}

function shapes(n: number, memo = new Map<number, Shape[]>([[0, [null]]])): Shape[] {
  const cached = memo.get(n);
  if (cached !== undefined) return cached;
  const result: Shape[] = [];
  for (let left = 0; left < n; left++) {
    for (const l of shapes(left, memo)) {
      for (const r of shapes(n - 1 - left, memo)) result.push([l, r]);
    }
  }
  memo.set(n, result);
  return result;
}
function fromShape(shape: Shape): BinaryTree {
  const nodes: BinaryNode[] = [];
  function build(value: Shape): NodeId | null {
    if (value === null) return null;
    const node: BinaryNode = { id: `N${nodes.length}`, left: null, right: null };
    nodes.push(node);
    node.left = build(value[0]);
    node.right = build(value[1]);
    return node.id;
  }
  return { root: build(shape), nodes };
}
function asForest(tree: BinaryTree): Forest {
  const map = new Map(tree.nodes.map((node) => [node.id, node]));
  function siblings(id: NodeId | null) {
    const ids: NodeId[] = [];
    for (; id !== null; id = map.get(id)!.right) ids.push(id);
    return ids;
  }
  return {
    roots: siblings(tree.root),
    nodes: tree.nodes.map((node) => ({ id: node.id, children: siblings(node.left) })),
  };
}
function expectedForest(forest: Forest, post: boolean): NodeId[] {
  const byId = new Map(forest.nodes.map((node) => [node.id, node]));
  return forest.roots.flatMap(function visit(id: NodeId): NodeId[] {
    const children = byId.get(id)!.children.flatMap(visit);
    return post ? [...children, id] : [id, ...children];
  });
}

it("all 626 binary shapes through seven nodes preserve threading, Morris and flatten invariants", () => {
  let count = 0;
  for (let n = 0; n <= 7; n++) {
    for (const shape of shapes(n)) {
      const tree = fromShape(shape),
        before = structuredClone(tree);
      assertThreading(tree);
      assertMorris(tree);
      assertFlatten(tree);
      expect(tree, "trace creation cannot modify a preset").toStrictEqual(before);
      count++;
    }
  }
  expect(count).toBe(626);
});

it("LCRS conversion and independently computed visit lanes agree on all 626 ordered forests", () => {
  for (let n = 0; n <= 7; n++) {
    for (const shape of shapes(n)) {
      const binary = fromShape(shape),
        forest = asForest(binary);
      expect(forestToBinary(forest)).toStrictEqual(binary);
      for (const mode of ["postorder", "preorder"] as const) {
        const frames = forestTrace(forest, mode),
          order = expectedForest(forest, mode === "postorder");
        expect(frames.at(-1)!.output).toStrictEqual(order);
        expect(frames.at(-1)!.rightOutput).toStrictEqual(order);
        for (const frame of frames) {
          expect(frame.output).toStrictEqual(frame.rightOutput);
          expect(frame.output).toStrictEqual(order.slice(0, frame.output.length));
        }
      }
    }
  }
});

it("every published preset and boundary example satisfies the trace contracts", () => {
  for (const { tree } of Object.values(BINARY_PRESETS)) {
    assertThreading(tree);
    assertMorris(tree);
    assertFlatten(tree);
  }
  for (const forest of Object.values(FOREST_PRESETS)) {
    for (const mode of ["postorder", "preorder"] as const) {
      expect(forestTrace(forest, mode).at(-1)!.output).toStrictEqual(expectedForest(forest, mode === "postorder"));
    }
  }
  const tree = BINARY_PRESETS["textbook"]!.tree;
  expect(threadingTrace(tree).at(-1)!.output).toStrictEqual(["D", "B", "E", "A", "C"]);
  expect(flattenTrace(BINARY_PRESETS["flatten"]!.tree).at(-1)!.output).toStrictEqual(["1", "2", "3", "4", "5", "6"]);
  expect(flattenTrace(BINARY_PRESETS["left"]!.tree).at(-1)!.scans).toBe(0);
  expect(flattenTrace(BINARY_PRESETS["right"]!.tree).at(-1)!.scans).toBe(0);
});

it("frames own their arrays and nodes so seeking backward cannot inherit future mutations", () => {
  for (const makeTrace of [threadingTrace, morrisTrace, flattenTrace]) {
    const frames = makeTrace(BINARY_PRESETS["textbook"]!.tree);
    const first = structuredClone(frames[0]);
    frames.at(-1)!.nodes[0]!.left = "mutated";
    frames.at(-1)!.output.push("mutated");
    expect(frames[0]).toStrictEqual(first);
  }
  const frames = forestTrace(FOREST_PRESETS["textbook"]!);
  frames.at(-1)!.rightOutput.push("mutated");
  expect(frames[0]!.rightOutput).toStrictEqual([]);
});

it("flatten records the three writes separately, including a predecessor that still has a left child", () => {
  const tree = binaryTree([["1", "2", "4"], ["2", "3"], ["3"], ["4"]]);
  const frames = flattenTrace(tree);
  const firstAttach = frames.find((frame) => frame.phase === "attach")!;
  expect(firstAttach.pred).toBe("2");
  expect(firstAttach.nodes.find((node) => node.id === "2")!.left).toBe("3");
  expect(
    frames
      .filter((frame) => ["attach", "promote", "clear"].includes(frame.phase))
      .slice(0, 3)
      .map((frame) => frame.line),
  ).toStrictEqual([3, 4, 5]);
  expect(frames.at(-1)!.output).toStrictEqual(["1", "2", "3", "4"]);
});
