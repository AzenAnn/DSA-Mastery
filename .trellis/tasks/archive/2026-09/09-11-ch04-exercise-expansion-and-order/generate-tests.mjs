import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const mapping = JSON.parse(await readFile(new URL("mapping.json", import.meta.url), "utf8"));
const node = (value, left = null, right = null) => ({ value, left, right });
let seed = 20260911;
const random = (n) => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed % n; };
function fromTokens(text) {
  const tokens = text.trim().split(/\s+/);
  if (!tokens[0] || tokens[0] === "null") return null;
  const root = node(Number(tokens[0])), queue = [root];
  let next = 1;
  for (let i = 0; i < queue.length && next < tokens.length; i++) {
    for (const side of ["left", "right"]) {
      const token = tokens[next++];
      if (token !== undefined && token !== "null") queue.push(queue[i][side] = node(Number(token)));
    }
  }
  return root;
}
function serialize(root) {
  if (!root) return "null\n";
  const queue = [root], tokens = [];
  for (let i = 0; i < queue.length; i++) {
    const current = queue[i];
    tokens.push(current ? String(current.value) : "null");
    if (current) queue.push(current.left, current.right);
  }
  while (tokens.at(-1) === "null") tokens.pop();
  return `${tokens.join(" ")}\n`;
}
function visit(root, order = "pre") {
  const result = [], pending = root ? [[root, false]] : [];
  while (pending.length) {
    const [current, emit] = pending.pop();
    if (!current) continue;
    if (emit) { result.push(current); continue; }
    if (order === "pre") pending.push([current.right, false], [current.left, false], [current, true]);
    if (order === "in") pending.push([current.right, false], [current, true], [current.left, false]);
    if (order === "post") pending.push([current, true], [current.right, false], [current.left, false]);
  }
  return result;
}
function chain(n, side, value = 1) {
  let root = null;
  for (let i = n - 1; i >= 0; i--) {
    const current = node(typeof value === "function" ? value(i) : value);
    current[side === "zigzag" ? (i % 2 ? "right" : "left") : side] = root;
    root = current;
  }
  return root;
}
function complete(n, value = (i) => i + 1) {
  const nodes = Array.from({ length: n }, (_, i) => node(value(i)));
  nodes.forEach((current, i) => { current.left = nodes[2 * i + 1] ?? null; current.right = nodes[2 * i + 2] ?? null; });
  return nodes[0] ?? null;
}
function randomTree(n) {
  if (!n) return null;
  const root = node(random(2001) - 1000), slots = [[root, "left"], [root, "right"]];
  for (let i = 1; i < n; i++) {
    const index = random(slots.length), [parent, side] = slots[index];
    slots[index] = slots.at(-1); slots.pop();
    const current = parent[side] = node(random(2001) - 1000);
    slots.push([current, "left"], [current, "right"]);
  }
  return root;
}
const baseBinary = [
  ["sample", fromTokens("3 9 20 null null 15 7")], ["empty", null], ["single-negative", node(-7)],
  ["only-left", node(1, node(2))], ["only-right", node(1, null, node(2))],
  ["two-leaves", fromTokens("1 2 3")], ["left-chain", chain(9, "left", (i) => i - 4)],
  ["right-chain", chain(10, "right", (i) => 10 - i)], ["zigzag", chain(31, "zigzag", (i) => i % 3 - 1)],
  ["deep-right-left", fromTokens("5 1 9 null null 7 null 6 null 4")],
  ["duplicate-values", complete(15, () => 4)], ["zeros", complete(7, () => 0)],
  ["negative-values", complete(31, (i) => -i - 1)], ["cancellation", complete(63, (i) => i % 2 ? -1000000000 : 1000000000)],
  ["noninteger-averages", fromTokens("0 -2 3 5 null -7 3")], ["sparse-random", randomTree(73)],
  ["wide-random", randomTree(257)], ["deep-boundary", chain(10000, "left", 1000000000)],
  ["wide-boundary", complete(10000, () => 1000000000)], ["mixed-boundary", randomTree(10000)],
];
const leaves = (root) => visit(root).filter((n) => !n.left && !n.right).map((n) => n.value);
function depths(root) {
  const result = [], pending = root ? [[root, 1]] : [];
  while (pending.length) {
    const [current, depth] = pending.pop(); result.push([current, depth]);
    if (current.left) pending.push([current.left, depth + 1]);
    if (current.right) pending.push([current.right, depth + 1]);
  }
  return result;
}
function scalarOracle(root, kind) {
  if (kind === 4) return root ? Math.min(...depths(root).filter(([n]) => !n.left && !n.right).map(([, d]) => d)) : 0;
  if (kind === 6) return visit(root).reduce((sum, n) => sum + (n.left && !n.left.left && !n.left.right ? BigInt(n.left.value) : 0n), 0n);
  const sums = new Map(); let tilt = 0n;
  for (const current of visit(root, "post")) {
    const left = sums.get(current.left) ?? 0n, right = sums.get(current.right) ?? 0n;
    const difference = left - right;
    tilt += difference < 0n ? -difference : difference;
    sums.set(current, BigInt(current.value) + left + right);
  }
  return tilt;
}
function averages(root) {
  const levels = [];
  for (const [current, depth] of depths(root)) {
    levels[depth - 1] ??= { sum: 0n, count: 0 };
    levels[depth - 1].sum += BigInt(current.value); levels[depth - 1].count++;
  }
  return levels.map(({ sum, count }) => (Number(sum) / count).toFixed(10));
}
function mergeOracle(a, b) {
  // Independent position union: nodes are keyed by their root-to-node L/R address.
  const positions = new Map();
  for (const root of [a, b]) {
    const pending = root ? [[root, ""]] : [];
    while (pending.length) {
      const [current, address] = pending.pop();
      positions.set(address, (positions.get(address) ?? 0) + current.value);
      if (current.left) pending.push([current.left, `${address}L`]);
      if (current.right) pending.push([current.right, `${address}R`]);
    }
  }
  if (!positions.size) return null;
  const nodes = new Map([...positions].map(([address, value]) => [address, node(value)]));
  for (const [address, current] of nodes) { current.left = nodes.get(`${address}L`) ?? null; current.right = nodes.get(`${address}R`) ?? null; }
  return nodes.get("");
}
const pairs = [
  ["sample", fromTokens("1 3 2 5"), fromTokens("2 1 3 null 4 null 7")],
  ["both-empty", null, null], ["equal-single", node(7), node(7)], ["first-empty", null, fromTokens("2 3 4")],
  ["second-empty", fromTokens("2 3 4"), null], ["different-single", node(-1), node(1)],
  ["same-leaves-different-shape", fromTokens("1 2 3"), fromTokens("9 0 3 2")],
  ["reversed-leaves", fromTokens("0 1 2"), fromTokens("0 2 1")],
  ["duplicate-leaf-count", fromTokens("0 1 1"), node(1)], ["same-root-different-leaves", fromTokens("1 2 3"), fromTokens("1 2 4")],
  ["negative-leaves", fromTokens("0 -4 -2"), fromTokens("7 -4 -2")], ["zero-leaves", complete(7, () => 0), complete(7, () => 0)],
  ["unequal-leaf-counts", complete(7), complete(15)], ["opposite-chains", chain(50, "left", 4), chain(30, "right", 4)],
  ["mixed-overlap", randomTree(50), randomTree(60)], ["sum-boundary", complete(63, () => 1000000000), complete(63, () => 1000000000)],
  ["positive-negative-cancel", complete(127, () => -1000000000), complete(127, () => 1000000000)],
  ["deep-shapes", chain(1500, "zigzag", 5), chain(1500, "right", 5)],
  ["wide-boundary", complete(10000, () => 9), complete(10000, () => -9)], ["random-boundary", randomTree(10000), randomTree(10000)],
];

function general(n, edges, roots = n ? [1] : []) {
  const children = Array.from({ length: n + 1 }, () => []);
  for (const [parent, child] of edges) children[parent].push(child);
  return { n, roots, children };
}
const gChain = (n) => general(n, Array.from({ length: Math.max(0, n - 1) }, (_, i) => [i + 1, i + 2]));
const star = (n) => general(n, Array.from({ length: Math.max(0, n - 1) }, (_, i) => [1, i + 2]));
const gRandom = (n) => general(n, Array.from({ length: Math.max(0, n - 1) }, (_, i) => [random(i + 1) + 1, i + 2]));
function permutation(tree) {
  const labels = Array.from({ length: tree.n }, (_, i) => i + 1);
  for (let i = labels.length - 1; i > 0; i--) { const j = random(i + 1); [labels[i], labels[j]] = [labels[j], labels[i]]; }
  const remap = [0, ...labels];
  return general(tree.n, tree.children.flatMap((list, parent) => list.map((child) => [remap[parent], remap[child]])), tree.roots.map((r) => remap[r]));
}
const sampleGeneral = general(7, [[1,2],[1,3],[1,4],[2,5],[2,6],[4,7]]);
const combEdges = Array.from({ length: 499 }, (_, i) => [[i + 1, i + 2], [i + 1, i + 501]]).flat();
const generalCases = [
  ["sample", sampleGeneral], ["empty", general(0, [])], ["single", general(1, [])],
  ["two-nodes", gChain(2)], ["three-siblings", star(4)], ["small-star", star(11)],
  ["wide-boundary", star(10000)], ["short-chain", gChain(8)], ["deep-boundary", gChain(10000)],
  ["ternary-tree", general(40, Array.from({ length: 39 }, (_, i) => [Math.floor(i / 3) + 1, i + 2]))],
  ...[2,3,4].map((branch) => [`deep-branch-${branch}`, general(9, [[1,2],[1,3],[1,4],[branch,5],[5,6],[6,7],[7,8],[8,9]])]),
  ["mixed-siblings", general(10, [[1,2],[1,3],[1,4],[2,5],[3,6],[4,7],[7,8],[7,9],[9,10]])],
  ["comb", general(999, combEdges)], ["permuted-root", permutation(sampleGeneral)],
  ["permuted-star", permutation(star(16))], ["random-small", permutation(gRandom(63))],
  ["random-medium", permutation(gRandom(257))], ["random-boundary", permutation(gRandom(10000))],
];
function encodeForest(tree) {
  const links = Array.from({ length: tree.n + 1 }, () => [0, 0]);
  for (let id = 1; id <= tree.n; id++) {
    const children = tree.children[id]; links[id][0] = children[0] ?? 0;
    children.forEach((child, i) => { links[child][1] = children[i + 1] ?? 0; });
  }
  tree.roots.forEach((root, i) => { links[root][1] = tree.roots[i + 1] ?? 0; });
  return { n: tree.n, root: tree.roots[0] ?? 0, links };
}
const table = (rows) => rows.map((r) => r.join(" ")).join("\n") + (rows.length ? "\n" : "");
const binaryTable = ({ n, root, links }) => `${n} ${root}\n${table(links.slice(1))}`;
const generalTable = (tree) => `${tree.n} ${tree.roots.length}\n${tree.roots.length ? tree.roots.join(" ") + "\n" : ""}${table(tree.children.slice(1).map((c) => [c.length, ...c]))}`;
function generalPostorder(tree) {
  const result = [], stack = tree.roots.toReversed().map((id) => [id, false]);
  while (stack.length) {
    const [id, emitted] = stack.pop();
    if (emitted) result.push(id);
    else { stack.push([id, true]); for (const child of tree.children[id].toReversed()) stack.push([child, false]); }
  }
  return result;
}
function generalHeight(tree) {
  const depth = Array(tree.n + 1).fill(-1), queue = [...tree.roots];
  for (const id of tree.roots) depth[id] = 0;
  for (let i = 0; i < queue.length; i++) for (const child of tree.children[queue[i]]) { depth[child] = depth[queue[i]] + 1; queue.push(child); }
  return Math.max(...depth);
}
const forestCases = generalCases.map(([name, tree]) => [name, tree]);
forestCases[0] = ["sample", general(6, [[1,2],[1,3],[4,5]], [4,1,6])];
forestCases[4] = ["isolated-roots", general(5, [], [5,3,1,4,2])];
forestCases[5] = ["later-tree-larger", general(8, [[2,3],[2,4],[4,5],[4,6],[6,7],[7,8]], [1,2])];
forestCases[6] = ["many-roots", general(10000, [], Array.from({ length: 10000 }, (_, i) => 10000 - i))];
forestCases[10] = ["unequal-components", general(9, [[1,2],[3,4],[3,5],[5,6],[7,8],[8,9]], [7,1,3])];
forestCases[16] = ["permuted-forest", permutation(forestCases[0][1])];
function indexed(root, shuffle = true) {
  const nodes = visit(root), labels = Array.from({ length: nodes.length }, (_, i) => i + 1);
  if (shuffle) for (let i = labels.length - 1; i > 0; i--) { const j = random(i + 1); [labels[i], labels[j]] = [labels[j], labels[i]]; }
  const ids = new Map(nodes.map((n, i) => [n, labels[i]])), links = Array.from({ length: nodes.length + 1 }, () => [0,0]);
  for (const current of nodes) links[ids.get(current)] = [ids.get(current.left) ?? 0, ids.get(current.right) ?? 0];
  return { n: nodes.length, root: ids.get(root) ?? 0, links, inorder: visit(root, "in").map((n) => ids.get(n)) };
}
const threadCases = baseBinary.map(([name, root]) => [name, indexed(root)]);
threadCases[0] = ["sample", { n: 3, root: 2, links: [[0,0],[0,0],[1,3],[0,0]], inorder: [1,2,3] }];
threadCases[5] = ["four-nodes", indexed(fromTokens("1 2 3 4"))];
function threadRows(tree) {
  const positions = new Map(tree.inorder.map((id, i) => [id, i]));
  return tree.links.slice(1).map(([left,right], i) => {
    const at = positions.get(i + 1);
    return [left || tree.inorder[at - 1] || 0, left ? 0 : 1, right || tree.inorder[at + 1] || 0, right ? 0 : 1];
  });
}

const samples = {};
for (const row of mapping.filter((m) => !m.old)) {
  const dir = `labs/chapter-04/exercise/E-04-${String(row.number).padStart(2, "0")}-${row.slug}`;
  const cases = [];
  const add = (name, input, output) => cases.push({ name, input, output: String(output) });
  if ([4,6,8,11,24].includes(row.number)) {
    for (const [name, original] of baseBinary) {
      const root = row.number === 24 && name === "deep-boundary"
        ? chain(10000, "left", (i) => i === 9999 ? 999999999 : 1000000000) : original;
      const answer = row.number === 8 ? visit(root, "in").map((n) => n.value).join(" ")
        : row.number === 11 ? averages(root).join(" ") : scalarOracle(root, row.number);
      add(name, serialize(root), `${answer}\n`);
    }
  } else if ([5,12].includes(row.number)) {
    for (const [name, a, b] of pairs) add(name, serialize(a) + serialize(b), row.number === 5 ? serialize(mergeOracle(a,b)) : `${JSON.stringify(leaves(a)) === JSON.stringify(leaves(b))}\n`);
  } else if ([1,2,19].includes(row.number)) {
    for (const [name, tree] of generalCases) {
      const answer = row.number === 1 ? tree.children.slice(1).filter((c) => !c.length).length
        : row.number === 2 ? generalHeight(tree) : generalPostorder(tree).join(" ");
      add(name, binaryTable(encodeForest(tree)), `${answer}\n`);
    }
  } else if ([15,16].includes(row.number)) {
    for (const [name, tree] of threadCases) {
      const rows = threadRows(tree);
      if (row.number === 15) add(name, binaryTable(tree), `${tree.n} ${tree.root}\n${table(rows)}`);
      else {
        const queries = name === "sample" ? [1,2,3,0] : [0, tree.root, ...tree.inorder.slice(0, 512), tree.inorder.at(-1) ?? 0, tree.root];
        const successor = new Map(tree.inorder.map((id, i) => [id, tree.inorder[i + 1] ?? 0]));
        add(name, `${tree.n} ${tree.root} ${queries.length}\n${table(rows)}${queries.join(" ")}\n`, `${tree.inorder.join(" ")}\n${queries.map((id) => successor.get(id) ?? 0).join("\n")}\n`);
      }
    }
  } else {
    for (const [name, tree] of forestCases) {
      const binary = encodeForest(tree);
      if (row.number === 17) add(name, generalTable(tree), `${binary.root}\n${table(binary.links.slice(1))}`);
      else add(name, binaryTable(binary), `${tree.roots.length}${tree.roots.length ? " " + tree.roots.join(" ") : ""}\n${table(tree.children.slice(1).map((c) => [c.length, ...c]))}`);
    }
  }
  assert.equal(cases.length, 20, row.slug);
  assert.equal(new Set(cases.map((c) => c.input)).size, 20, `duplicate input in ${row.slug}`);
  await mkdir(path.join(dir, "tests"), { recursive: true });
  const compare = row.number === 11 ? { mode: "float", absTol: 1e-6, relTol: 1e-12 } : { mode: "tokens" };
  const manifest = JSON.parse(await readFile(path.join(dir, "lab.json"), "utf8"));
  for (const target of ["student", "solution"]) manifest.targets[target] = { sources: [`${target}/main.cpp`, "support/runner.cpp"], includeDirs: ["support"] };
  manifest.judge.compare = compare;
  await writeFile(path.join(dir, "lab.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  const metadata = [];
  for (const [i, testCase] of cases.entries()) {
    const id = `${String(i + 1).padStart(3, "0")}-${testCase.name}`;
    const input = `tests/${id}.in`, expected = `tests/${id}.out`;
    await writeFile(path.join(dir, input), testCase.input);
    await writeFile(path.join(dir, expected), testCase.output);
    metadata.push({ id, input, expected, points: 5, tags: [i === 0 ? "sample" : testCase.name.includes("boundary") ? "stress" : i < 5 ? "boundary" : "regression"], compare });
  }
  await writeFile(path.join(dir, "tests/cases.json"), `${JSON.stringify(metadata, null, 2)}\n`);
  samples[row.number] = cases.slice(0, 3);
  console.log(`${row.number}: ${row.slug}: 20 independent expected outputs`);
}
await writeFile(new URL("samples.json", import.meta.url), `${JSON.stringify(samples, null, 2)}\n`);
