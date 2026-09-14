import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

const lab = "labs/chapter-02/theory/T-02-03-stack-queue-comprehensive";
const questions = JSON.parse(readFileSync(`${lab}/quiz.json`, "utf8"));
const byId = Object.fromEntries(questions.map((q) => [q.id, q]));
assert.equal(questions.length, 20);
assert.equal(questions.reduce((sum, q) => sum + q.points, 0), 40);
const readme = readFileSync(`${lab}/README.md`, "utf8");
assert.equal((readme.match(/^### 综合题 [1-5]：/gm) ?? []).length, 5);
assert.equal((readme.match(/^::: details 综合题 [1-5] 参考答案与评分要点$/gm) ?? []).length, 5);

// Enumerate legal operations, retaining the least capacity needed for each output.
function stackOutputs(n, popLimit = Infinity) {
  const outputs = new Map();
  function visit(next, stack, output, consecutive, peak) {
    if (output.length === n) {
      const key = output.join(",");
      outputs.set(key, Math.min(peak, outputs.get(key) ?? Infinity));
      return;
    }
    if (next <= n) visit(next + 1, [...stack, next], output, 0, Math.max(peak, stack.length + 1));
    if (stack.length && consecutive < popLimit) {
      visit(next, stack.slice(0, -1), [...output, stack.at(-1)], consecutive + 1, peak);
    }
  }
  visit(1, [], [], 0, 0);
  return outputs;
}

function dequeOutputs(n, mode, allInFirst = false) {
  const outputs = new Set();
  function visit(next, queue, output) {
    if (output.length === n) {
      outputs.add(output.join(","));
      return;
    }
    if (next <= n) {
      visit(next + 1, [...queue, next], output);
      if (mode === "output") visit(next + 1, [next, ...queue], output);
    }
    if (queue.length && (!allInFirst || next > n)) {
      visit(next, queue.slice(1), [...output, queue[0]]);
      if (mode === "input") visit(next, queue.slice(0, -1), [...output, queue.at(-1)]);
    }
  }
  visit(1, [], []);
  return outputs;
}

function numericSequence(option) {
  return option.replaceAll("`", "").split(/[,，]/).map((value) => {
    const item = value.trim();
    return /^[a-z]$/.test(item) ? item.charCodeAt(0) - 96 : Number(item);
  }).join(",");
}

function checkImpossible(id, outputs) {
  if (!byId[id]) return;
  const q = byId[id];
  const impossible = q.options.map((option) => !outputs.has(numericSequence(option)));
  assert.deepEqual(impossible, q.options.map((_, i) => i === q.answer), id);
}

assert.equal([...stackOutputs(5).keys()].filter((s) => s.startsWith("4,")).length, 4);
assert.equal(stackOutputs(7).get("2,4,3,6,5,1,7"), 3);
checkImpossible("ds-2010-01", stackOutputs(6, 2));
checkImpossible("ds-2010-02", dequeOutputs(5, "output", true));
checkImpossible("ds-2021-02", dequeOutputs(5, "output"));
checkImpossible("ds-drill-queue-014", new Set([
  ...dequeOutputs(4, "input"), ...dequeOutputs(4, "output"),
]));

const nine = stackOutputs(9);
assert.equal(nine.has("2,3,1,6,4,7,5,9,8"), false);
assert.equal(nine.has("2,3,1,5,6,7,4,9,8"), true);
assert.deepEqual([...stackOutputs(4).keys()].filter((s) => s.startsWith("2,")).sort(), [
  "2,1,3,4", "2,1,4,3", "2,3,1,4", "2,3,4,1", "2,4,3,1",
]);
let previous = 1;
for (let n = 1; n <= 8; n += 1) {
  const outputs = stackOutputs(n);
  assert.equal(outputs.size, previous * (4 * n - 2) / (n + 1));
  if (n >= 2) {
    assert.equal([...outputs.keys()].filter((s) => s.startsWith("1,")).length, previous);
    assert.equal([...outputs.keys()].filter((s) => s.startsWith("2,")).length, previous);
  }
  if (n >= 3) {
    const third = new Set([...outputs.keys()].map((s) => s.split(",")).filter((a) => a[1] === "3").map((a) => a[2]));
    assert.equal(third.size, n - 1);
  }
  previous = outputs.size;
}
for (let n = 1; n <= 6; n += 1) {
  for (const mode of ["input", "output"]) assert.equal(dequeOutputs(n, mode, true).size, 2 ** (n - 1));
}
assert.equal(dequeOutputs(4, "output", true).has("3,1,2,4"), true);
assert.equal(dequeOutputs(4, "input", true).has("3,1,2,4"), false);
assert.equal(dequeOutputs(4, "input", true).has("1,4,2,3"), true);
assert.equal(dequeOutputs(4, "output", true).has("1,4,2,3"), false);

const depths = byId["ds-2025-02"].options.map((option) => {
  const stack = [];
  let peak = 0;
  const matching = { ")": "(", "]": "[", "}": "{" };
  for (const char of option) {
    if ("([{".includes(char)) stack.push(char);
    else if (")]}".includes(char)) assert.equal(stack.pop(), matching[char]);
    peak = Math.max(peak, stack.length);
  }
  assert.equal(stack.length, 0);
  return peak;
});
assert.deepEqual(depths, [3, 3, 3, 4]);

// Content-wide exact normalization catches duplicate IDs/stems; semantic audit is documented separately.
function* files(root) {
  for (const item of readdirSync(root, { withFileTypes: true })) {
    const full = path.join(root, item.name);
    if (item.isDirectory()) yield* files(full);
    else if (item.name === "quiz.json" || item.name.endsWith(".review.json")) yield full;
  }
}
const normalize = (s) => s.normalize("NFKC").replace(/[\p{P}\p{S}\s]/gu, "").toLowerCase();
let compared = 0;
for (const file of [...files("labs"), ...files("content")]) {
  if (path.resolve(file) === path.resolve(`${lab}/quiz.json`)) continue;
  const data = JSON.parse(readFileSync(file, "utf8"));
  const oldQuestions = Array.isArray(data) ? data : data.questions ?? [];
  for (const old of oldQuestions) {
    if (!old.stem) continue;
    compared += 1;
    for (const q of questions) {
      assert.notEqual(q.id, old.targetId ?? old.id, `${q.id}: duplicate source ID in ${file}`);
      assert.notEqual(normalize(q.stem), normalize(old.stem), `${q.id}: duplicate stem in ${file}`);
    }
  }
}
console.log(`PASS: 20 choices / 40 points, 5 written problems; compared ${compared} existing questions.`);
console.log("PASS: exhaustive stack/deque sequences, capacity, Catalan ratios, conditional counts, bracket depths and written counterexamples.");
