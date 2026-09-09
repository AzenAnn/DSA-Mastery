import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BINARY_PRESETS, FOREST_PRESETS, binaryTree, threadingTrace,
  morrisTrace, flattenTrace, forestTrace, forestToBinary,
} from "../public/demos/tree-algorithms.mjs";

function expected(tree, order) {
  const map = new Map(tree.nodes.map(node => [node.id, node]));
  const result = [];
  function visit(id) {
    if (id === null) return;
    const node = map.get(id);
    if (order === "pre") result.push(id);
    visit(node.left);
    if (order === "in") result.push(id);
    visit(node.right);
  }
  visit(tree.root);
  return result;
}

function walkThreads(tree, reverse) {
  const map = new Map(tree.nodes.map(node => [node.id, node]));
  const result = [];
  const down = reverse ? "right" : "left", next = reverse ? "left" : "right";
  const downTag = reverse ? "rtag" : "ltag", nextTag = reverse ? "ltag" : "rtag";
  let id = tree.root;
  while (id !== null && map.get(id)[downTag] === 0) id = map.get(id)[down];
  while (id !== null) {
    assert(result.length < tree.nodes.length, "thread traversal must terminate");
    result.push(id);
    const node = map.get(id);
    id = node[next];
    if (node[nextTag] === 0) while (id !== null && map.get(id)[downTag] === 0) id = map.get(id)[down];
  }
  return result;
}

function assertThreading(tree) {
  const frames = threadingTrace(tree), final = frames.at(-1), order = expected(tree, "in");
  assert.equal(final.phase, "done");
  assert.deepEqual(final.output, order);
  const byId = new Map(final.nodes.map(node => [node.id, node]));
  for (const original of tree.nodes) {
    const node = byId.get(original.id), i = order.indexOf(node.id);
    assert.equal(node.ltag, original.left === null ? 1 : 0);
    assert.equal(node.rtag, original.right === null ? 1 : 0);
    assert.equal(node.left, original.left ?? order[i - 1] ?? null);
    assert.equal(node.right, original.right ?? order[i + 1] ?? null);
  }
  assert.deepEqual(walkThreads({ ...tree, nodes: final.nodes }, false), order);
  assert.deepEqual(walkThreads({ ...tree, nodes: final.nodes }, true), [...order].reverse());
  assert.deepEqual(final.stack, []);
  for (const frame of frames) assert.deepEqual(frame.output, order.slice(0, frame.output.length));
}

function assertMorris(tree) {
  const frames = morrisTrace(tree), order = expected(tree, "in");
  const original = new Map(tree.nodes.map(node => [node.id, node]));
  assert.deepEqual(frames.at(-1).nodes, tree.nodes, "Morris restores every original pointer");
  assert.deepEqual(frames.at(-1).output, order);
  assert.equal(frames.filter(frame => frame.phase === "create").length, frames.filter(frame => frame.phase === "remove").length);
  for (const frame of frames) {
    assert.deepEqual(frame.output, order.slice(0, frame.output.length));
    for (const node of frame.nodes) {
      assert.equal(node.left, original.get(node.id).left);
      if (!frame.temporary.includes(node.id)) assert.equal(node.right, original.get(node.id).right);
      else assert.equal(original.get(node.id).right, null, "only a vacant right pointer can be borrowed");
    }
  }
  assert.deepEqual(frames.at(-1).temporary, []);
}

function assertFlatten(tree) {
  const frames = flattenTrace(tree), final = frames.at(-1), order = expected(tree, "pre");
  assert.deepEqual(final.output, order);
  const byId = new Map(final.nodes.map(node => [node.id, node]));
  assert(final.scans <= tree.nodes.length, "total predecessor moves stay linear");
  order.forEach((id, i) => {
    assert.equal(byId.get(id).left, null);
    assert.equal(byId.get(id).right, order[i + 1] ?? null);
  });
  for (const frame of frames) assert.deepEqual(frame.output, order.slice(0, frame.output.length));
  for (let i = 1; i < frames.length; i++) {
    const previous = frames[i - 1];
    for (const change of frames[i].changes) {
      const before = previous.nodes.find(node => node.id === change.from);
      const after = frames[i].nodes.find(node => node.id === change.from);
      assert.equal(before[change.slot], change.before);
      assert.equal(after[change.slot], change.after);
    }
  }
}

function shapes(n, memo = new Map([[0, [null]]])) {
  if (memo.has(n)) return memo.get(n);
  const result = [];
  for (let left = 0; left < n; left++) {
    for (const l of shapes(left, memo)) for (const r of shapes(n - 1 - left, memo)) result.push([l, r]);
  }
  memo.set(n, result);
  return result;
}
function fromShape(shape) {
  const nodes = [];
  function build(value) {
    if (value === null) return null;
    const node = { id: `N${nodes.length}`, left: null, right: null };
    nodes.push(node);
    node.left = build(value[0]); node.right = build(value[1]);
    return node.id;
  }
  return { root: build(shape), nodes };
}
function asForest(tree) {
  const map = new Map(tree.nodes.map(node => [node.id, node]));
  function siblings(id) { const ids = []; for (; id !== null; id = map.get(id).right) ids.push(id); return ids; }
  return { roots: siblings(tree.root), nodes: tree.nodes.map(node => ({ id: node.id, children: siblings(node.left) })) };
}
function expectedForest(forest, post) {
  const byId = new Map(forest.nodes.map(node => [node.id, node]));
  return forest.roots.flatMap(function visit(id) {
    const children = byId.get(id).children.flatMap(visit);
    return post ? [...children, id] : [id, ...children];
  });
}

test("all 626 binary shapes through seven nodes preserve threading, Morris and flatten invariants", () => {
  let count = 0;
  for (let n = 0; n <= 7; n++) for (const shape of shapes(n)) {
    const tree = fromShape(shape), before = structuredClone(tree);
    assertThreading(tree); assertMorris(tree); assertFlatten(tree);
    assert.deepEqual(tree, before, "trace creation cannot modify a preset");
    count++;
  }
  assert.equal(count, 626);
});

test("LCRS conversion and independently computed visit lanes agree on all 626 ordered forests", () => {
  for (let n = 0; n <= 7; n++) for (const shape of shapes(n)) {
    const binary = fromShape(shape), forest = asForest(binary);
    assert.deepEqual(forestToBinary(forest), binary);
    for (const mode of ["postorder", "preorder"]) {
      const frames = forestTrace(forest, mode), order = expectedForest(forest, mode === "postorder");
      assert.deepEqual(frames.at(-1).output, order);
      assert.deepEqual(frames.at(-1).rightOutput, order);
      for (const frame of frames) {
        assert.deepEqual(frame.output, frame.rightOutput);
        assert.deepEqual(frame.output, order.slice(0, frame.output.length));
      }
    }
  }
});

test("every published preset and boundary example satisfies the trace contracts", () => {
  for (const { tree } of Object.values(BINARY_PRESETS)) { assertThreading(tree); assertMorris(tree); assertFlatten(tree); }
  for (const forest of Object.values(FOREST_PRESETS)) for (const mode of ["postorder", "preorder"]) {
    assert.deepEqual(forestTrace(forest, mode).at(-1).output, expectedForest(forest, mode === "postorder"));
  }
  const tree = BINARY_PRESETS.textbook.tree;
  assert.deepEqual(threadingTrace(tree).at(-1).output, ["D", "B", "E", "A", "C"]);
  assert.deepEqual(flattenTrace(BINARY_PRESETS.flatten.tree).at(-1).output, ["1", "2", "3", "4", "5", "6"]);
  assert.equal(flattenTrace(BINARY_PRESETS.left.tree).at(-1).scans, 0);
  assert.equal(flattenTrace(BINARY_PRESETS.right.tree).at(-1).scans, 0);
});

test("frames own their arrays and nodes so seeking backward cannot inherit future mutations", () => {
  for (const makeTrace of [threadingTrace, morrisTrace, flattenTrace]) {
    const frames = makeTrace(BINARY_PRESETS.textbook.tree);
    const first = structuredClone(frames[0]);
    frames.at(-1).nodes[0].left = "mutated";
    frames.at(-1).output.push("mutated");
    assert.deepEqual(frames[0], first);
  }
  const frames = forestTrace(FOREST_PRESETS.textbook);
  frames.at(-1).rightOutput.push("mutated");
  assert.deepEqual(frames[0].rightOutput, []);
});

test("flatten records the three writes separately, including a predecessor that still has a left child", () => {
  const tree = binaryTree([["1", "2", "4"], ["2", "3"], ["3"], ["4"]]);
  const frames = flattenTrace(tree);
  const firstAttach = frames.find(frame => frame.phase === "attach");
  assert.equal(firstAttach.pred, "2");
  assert.equal(firstAttach.nodes.find(node => node.id === "2").left, "3");
  assert.deepEqual(frames.filter(frame => ["attach", "promote", "clear"].includes(frame.phase)).slice(0, 3).map(frame => frame.line), [3, 4, 5]);
  assert.deepEqual(frames.at(-1).output, ["1", "2", "3", "4"]);
});
