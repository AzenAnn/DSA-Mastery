import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import MarkdownIt from "markdown-it";
import matter from "gray-matter";

const lab = "labs/chapter-01/theory/T-01-06-linear-list-written";
const source = readFileSync(`${lab}/README.md`, "utf8");
const { data, content } = matter(source);
assert.equal(data.labId, "01T06");
assert.equal(data.labCategory, "theory");
const tokens = new MarkdownIt().parse(content, {});
const titles = tokens.flatMap((t, i) => t.type === "heading_open" && t.tag === "h3" ? [tokens[i + 1].content] : []);
assert.equal(titles.length, 15);
titles.forEach((title, i) => assert.match(title, new RegExp(`^第 ${i + 1} 题：`)));
assert.equal((content.match(/^::: details 第 \d+ 题参考答案与评分要点$/gm) ?? []).length, 15);
assert.equal((content.match(/评分要点（10 分）/g) ?? []).length, 15);
const ids = [...content.matchAll(/题目标识：`([^`]+)`/g)].map((m) => m[1]);
assert.equal(ids.length, 15);
assert.equal(new Set(ids).size, 15);
let comparedFiles = 0;
for (const root of ["labs", "content"]) {
  for (const entry of readdirSync(root, { recursive: true })) {
    const file = path.join(root, entry).replaceAll("\\", "/");
    if (file.startsWith(`${lab}/`) || !/(?:\.md|quiz\.json|review\.json)$/.test(file)) continue;
    const existing = readFileSync(file, "utf8");
    comparedFiles += 1;
    for (const id of ids) assert.ok(!existing.includes(id), `${id} already appears in ${file}`);
  }
}

function* arrays(pool, n, prefix = []) {
  if (!n) { yield prefix; return; }
  for (const value of pool) yield* arrays(pool, n - 1, [...prefix, value]);
}
const sorted = (a) => a.toSorted((x, y) => x - y);
function median(A, B) {
  const n = A.length;
  let lo = 0, hi = n;
  while (lo <= hi) {
    const i = lo + Math.floor((hi - lo) / 2), j = n - i;
    const al = i ? A[i - 1] : -Infinity, ar = i === n ? Infinity : A[i];
    const bl = j ? B[j - 1] : -Infinity, br = j === n ? Infinity : B[j];
    if (al > br) hi = i - 1;
    else if (bl > ar) lo = i + 1;
    else return Math.max(al, bl);
  }
  assert.fail("No median partition");
}
function majority(A) {
  let candidate, count = 0;
  for (const x of A) {
    if (!count) { candidate = x; count = 1; }
    else count += x === candidate ? 1 : -1;
  }
  return A.filter((x) => x === candidate).length > Math.floor(A.length / 2) ? candidate : -1;
}
function missing(A) {
  const mark = Array(A.length + 1).fill(false);
  for (const x of A) if (1 <= x && x <= A.length) mark[x] = true;
  for (let x = 1; x <= A.length; x++) if (!mark[x]) return x;
  return A.length + 1;
}
function distance(A, B, C) {
  let i = 0, j = 0, k = 0, best = Infinity;
  while (i < A.length && j < B.length && k < C.length) {
    const x = Math.min(A[i], B[j], C[k]), z = Math.max(A[i], B[j], C[k]);
    best = Math.min(best, 2 * (z - x));
    if (!best) return 0;
    if (A[i] === x) i++;
    else if (B[j] === x) j++;
    else k++;
  }
  return best;
}
function products(A) {
  let min = A.at(-1), max = min;
  const res = [];
  for (let i = A.length - 1; i >= 0; i--) {
    min = Math.min(min, A[i]); max = Math.max(max, A[i]);
    res[i] = Math.max(A[i] * min, A[i] * max);
  }
  return res;
}
function filter(A, x) {
  let write = 0;
  for (let read = 0; read < A.length; read++) {
    assert.ok(write <= read);
    if (A[read] !== x) A[write++] = A[read];
  }
  return A.slice(0, write);
}
function searchSwap(A, x) {
  const n = A.length;
  let lo = 0, hi = n;
  while (lo < hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    if (A[mid] < x) lo = mid + 1;
    else hi = mid;
  }
  if (lo < n && A[lo] === x) {
    if (lo + 1 < n) [A[lo], A[lo + 1]] = [A[lo + 1], A[lo]];
    return A;
  }
  for (let j = n; j > lo; j--) A[j] = A[j - 1];
  A[lo] = x;
  return A;
}
let arrayCases = 0;
for (let n = 1; n <= 5; n++) {
  const candidates = [...arrays([-1, 0, 1], n)].filter((a) => a.every((x, i) => !i || a[i - 1] <= x));
  for (const A of candidates) for (const B of candidates) {
    assert.equal(median(A, B), sorted([...A, ...B])[n - 1]); arrayCases++;
  }
}
for (let n = 1; n <= 7; n++) for (const A of arrays(Array.from({ length: Math.min(n, 3) }, (_, i) => i), n)) {
  const expected = A.find((x) => A.filter((v) => v === x).length > n / 2) ?? -1;
  assert.equal(majority(A), expected); arrayCases++;
}
for (let n = 0; n <= 6; n++) for (const A of arrays([-2, 0, 1, 2, 6], n)) {
  let wanted = 1;
  while (A.includes(wanted)) wanted++;
  assert.equal(missing(A), wanted);
  if (n) assert.deepEqual(products(A), A.map((x, i) => Math.max(...A.slice(i).map((y) => x * y))));
  for (const x of [-2, 0, 1]) assert.deepEqual(filter([...A], x), A.filter((v) => v !== x));
  arrayCases++;
}
const sets = Array.from({ length: 32 }, (_, mask) => [-2, -1, 0, 1, 2].filter((_, i) => mask & (1 << i)));
for (const A of sets.slice(1)) for (const B of sets.slice(1)) for (const C of sets.slice(1)) {
  const brute = Math.min(...A.flatMap((a) => B.flatMap((b) => C.map((c) => Math.abs(a - b) + Math.abs(b - c) + Math.abs(c - a)))));
  assert.equal(distance(A, B, C), brute); arrayCases++;
}
for (const A of sets) for (const x of [-3, -2, -1, 0, 1, 2, 3]) {
  const found = A.indexOf(x), expected = [...A];
  if (found < 0) expected.push(x), expected.sort((a, b) => a - b);
  else if (found + 1 < A.length) [expected[found], expected[found + 1]] = [expected[found + 1], expected[found]];
  assert.deepEqual(searchSwap([...A], x), expected); arrayCases++;
}

let serial = 0;
function node(data) { return { id: serial++, data, next: null, pre: null, freq: 0, freed: false }; }
function list(values) {
  const head = node(undefined), nodes = values.map(node);
  let tail = head;
  for (const p of nodes) { tail.next = p; p.pre = tail; tail = p; }
  return { head, nodes };
}
function walk(head) {
  const seen = new Set(), result = [];
  for (let p = head.next; p; p = p.next) {
    assert.ok(!seen.has(p) && !p.freed, "Cycle or freed node in result");
    seen.add(p); result.push(p);
  }
  return result;
}
function release(p) { assert.ok(!p.freed); p.freed = true; p.next = null; }
function dedupAbs(H, bound) {
  const seen = Array(bound + 1).fill(false);
  let pre = H;
  while (pre.next) {
    const p = pre.next, key = Math.abs(p.data);
    if (seen[key]) { pre.next = p.next; release(p); }
    else { seen[key] = true; pre = p; }
  }
}
function reorder(H) {
  if (!H.next?.next) return;
  let slow = H.next, fast = H.next;
  while (fast.next?.next) { slow = slow.next; fast = fast.next.next; }
  let cur = slow.next, right = null;
  slow.next = null;
  while (cur) { const saved = cur.next; cur.next = right; right = cur; cur = saved; }
  let p = H.next, q = right;
  while (q) { const pn = p.next, qn = q.next; p.next = q; q.next = pn; p = pn; q = qn; }
}
function split(C, A, B) {
  let p = C.next, tail = A, odd = true;
  C.next = null;
  while (p) {
    const saved = p.next;
    if (odd) { p.next = null; tail.next = p; tail = p; }
    else { p.next = B.next; B.next = p; }
    odd = !odd; p = saved;
    assert.ok(walk(A).every((a) => !walk(B).includes(a)));
  }
}
function common(A, B, C, failAfter = Infinity) {
  let p = A.next, q = B.next, tail = C;
  const allocated = [];
  while (p && q) {
    if (p.data < q.data) p = p.next;
    else if (p.data > q.data) q = q.next;
    else {
      if (allocated.length === failAfter) {
        const all = walk(C); C.next = null; all.forEach(release);
        return { ok: false, allocated };
      }
      const s = node(p.data); allocated.push(s); tail.next = s; tail = s;
      p = p.next; q = q.next;
    }
  }
  return { ok: true, allocated };
}
function intersect(A, B) {
  let pre = A, p = A.next, q = B.next;
  while (p && q) {
    if (p.data === q.data) { pre = p; p = p.next; q = q.next; }
    else if (p.data < q.data) { const saved = p.next; pre.next = saved; release(p); p = saved; }
    else q = q.next;
  }
  pre.next = null;
  while (p) { const saved = p.next; release(p); p = saved; }
}
function sublist(A, B) {
  if (!B.next) return true;
  let start = A.next;
  while (start) {
    let p = start, q = B.next;
    while (p && q && p.data === q.data) { p = p.next; q = q.next; }
    if (!q) return true;
    if (!p) return false;
    start = start.next;
  }
  return false;
}
function hasCycle(head) {
  let slow = head, fast = head, rounds = 0;
  while (fast?.next) {
    slow = slow.next; fast = fast.next.next;
    assert.ok(++rounds < 100);
    if (slow === fast) return { cycle: true, rounds };
  }
  return { cycle: false, rounds };
}
function locate(H, x) {
  let p = H.next;
  while (p.data !== x) p = p.next;
  p.freq++;
  let q = p.pre;
  while (q !== H && q.freq <= p.freq) q = q.pre;
  if (q === p.pre) return p;
  p.pre.next = p.next;
  if (p.next) p.next.pre = p.pre;
  const after = q.next;
  p.pre = q; p.next = after;
  if (after) after.pre = p;
  q.next = p;
  return p;
}
let linkedCases = 0;
for (let n = 0; n <= 5; n++) for (const values of arrays([-2, 0, 2], n)) {
  const { head, nodes } = list(values);
  const expected = nodes.filter((p, i) => !nodes.slice(0, i).some((q) => Math.abs(q.data) === Math.abs(p.data)));
  dedupAbs(head, 2);
  assert.deepEqual(walk(head), expected);
  for (const p of nodes) assert.equal(p.freed, !expected.includes(p));
  linkedCases++;
}
for (let n = 0; n <= 30; n++) {
  const { head, nodes } = list(Array.from({ length: n }, (_, i) => i % 3));
  const expected = [];
  for (let l = 0, r = n - 1; l <= r; l++, r--) { expected.push(nodes[l]); if (l !== r) expected.push(nodes[r]); }
  reorder(head); assert.deepEqual(walk(head), expected);
  nodes.forEach((p, i) => assert.equal(p.data, i % 3));
  const c = list(Array.from({ length: 2 * n }, (_, i) => i % 3)), a = list([]), b = list([]);
  split(c.head, a.head, b.head);
  assert.equal(c.head.next, null);
  assert.deepEqual(walk(a.head), c.nodes.filter((_, i) => i % 2 === 0));
  assert.deepEqual(walk(b.head), c.nodes.filter((_, i) => i % 2 === 1).reverse());
  linkedCases++;
}
for (const av of sets) for (const bv of sets) {
  const a = list(av), b = list(bv), wanted = av.filter((x) => bv.includes(x));
  const snapshot = [...a.nodes, ...b.nodes].map((p) => ({ p, next: p.next, data: p.data }));
  for (let fail = 0; fail <= wanted.length; fail++) {
    const c = list([]), result = common(a.head, b.head, c.head, fail);
    assert.equal(result.ok, fail === wanted.length);
    assert.deepEqual(walk(c.head).map((p) => p.data), result.ok ? wanted : []);
    result.allocated.forEach((p) => { assert.ok(!a.nodes.includes(p) && !b.nodes.includes(p)); assert.equal(p.freed, !result.ok); });
    snapshot.forEach(({ p, next, data }) => { assert.equal(p.next, next); assert.equal(p.data, data); });
  }
  intersect(a.head, b.head);
  assert.deepEqual(walk(a.head), a.nodes.filter((p) => bv.includes(p.data)));
  a.nodes.forEach((p) => assert.equal(p.freed, !bv.includes(p.data)));
  snapshot.filter(({ p }) => b.nodes.includes(p)).forEach(({ p, next, data }) => {
    assert.equal(p.next, next); assert.equal(p.data, data); assert.equal(p.freed, false);
  });
  linkedCases++;
}
const binaryArrays = Array.from({ length: 7 }, (_, n) => [...arrays([0, 1], n)]).flat();
for (const av of binaryArrays) for (const bv of binaryArrays) {
  const a = list(av), b = list(bv);
  const expected = !bv.length || av.some((_, i) => bv.every((x, j) => av[i + j] === x));
  assert.equal(sublist(a.head, b.head), expected);
  assert.deepEqual(walk(a.head), a.nodes); assert.deepEqual(walk(b.head), b.nodes);
  linkedCases++;
}
for (let n = 0; n <= 40; n++) for (let entry = -1; entry < n; entry++) {
  const { nodes } = list(Array(n).fill(7));
  if (n && entry >= 0) nodes.at(-1).next = nodes[entry];
  const result = hasCycle(nodes[0] ?? null);
  assert.equal(result.cycle, entry >= 0);
  assert.ok(result.rounds <= n);
  linkedCases++;
}
for (const accesses of arrays([0, 1, 2, 3, 4], 6)) {
  const { head, nodes } = list([0, 1, 2, 3, 4]);
  const counts = Array(5).fill(0), times = Array(5).fill(-1);
  accesses.forEach((x, time) => {
    counts[x]++; times[x] = time;
    assert.equal(locate(head, x), nodes[x]);
    const expected = [...nodes].sort((a, b) => counts[b.data] - counts[a.data] || times[b.data] - times[a.data] || a.data - b.data);
    const actual = walk(head); assert.deepEqual(actual, expected);
    actual.forEach((p, i) => { assert.equal(p.pre, i ? actual[i - 1] : head); assert.equal(p.freq, counts[p.data]); });
    assert.equal(actual.at(-1).next, null);
  });
  linkedCases++;
}
const single = list([9]); locate(single.head, 9); assert.equal(single.nodes[0].pre, single.head);
const shared = list([3, 5, 7]), aliasA = list([1]), aliasB = list([2]);
aliasA.nodes[0].next = shared.head.next;
aliasB.nodes[0].next = shared.head.next;
const originalB = walk(aliasB.head), originalLinks = originalB.map((p) => p.next);
intersect(aliasA.head, aliasB.head);
assert.deepEqual(walk(aliasA.head), shared.nodes);
assert.deepEqual(walk(aliasB.head), originalB);
originalB.forEach((p, i) => assert.equal(p.next, originalLinks[i]));
console.log(JSON.stringify({ status: "PASS", questions: 15, writtenPoints: 150, comparedFiles, arrayCases, linkedCases }, null, 2));
