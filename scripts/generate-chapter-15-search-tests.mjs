import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const exerciseRoot = path.join(root, "labs/chapter-15/exercise");
const write = process.argv.includes("--write");
const selected = process.argv.find((arg) => /^--only=/.test(arg))?.slice(7);
const normalize = (text) => text.replaceAll("\r\n", "\n").trimEnd() + "\n";
const tokens = (text) => text.trim().split(/\s+/).filter(Boolean);
const numbers = (text) => tokens(text).map(Number);
const numericOrder = (a, b) => {
  for (let i = 0; i < Math.min(a.length, b.length); ++i) {
    if (a[i] !== b[i]) return a[i] - b[i];
  }
  return a.length - b.length;
};
const textOrder = (a, b) => {
  for (let i = 0; i < Math.min(a.length, b.length); ++i) {
    if (a[i] !== b[i]) return a[i] < b[i] ? -1 : 1;
  }
  return a.length - b.length;
};
const rowsOutput = (rows, compare = numericOrder) => {
  rows.sort(compare);
  return `${rows.length}\n${rows.map((row) => [row.length, ...row].join(" ")).join("\n")}\n`;
};
const stringsOutput = (values) => `${values.length}\n${values.sort().join("\n")}\n`;
const arrayInput = (a, target) => `${a.length}${target === undefined ? "" : ` ${target}`}\n${a.join(" ")}\n`;
const knightSteps = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];

// Independent oracles use iterative permutations, bit masks and count-based DP.
function permutations(values) {
  const current = [...values].sort((a, b) => a - b);
  const result = [];
  for (;;) {
    result.push([...current]);
    let pivot = current.length - 2;
    while (pivot >= 0 && current[pivot] >= current[pivot + 1]) --pivot;
    if (pivot < 0) break;
    let successor = current.length - 1;
    while (current[successor] <= current[pivot]) --successor;
    [current[pivot], current[successor]] = [current[successor], current[pivot]];
    const suffix = current.splice(pivot + 1).reverse();
    current.push(...suffix);
  }
  return result;
}

function combinations(n, r) {
  if (!r) return [[]];
  const current = Array.from({ length: r }, (_, i) => i + 1);
  const result = [];
  for (;;) {
    result.push([...current]);
    let i = r - 1;
    while (i >= 0 && current[i] === n - r + i + 1) --i;
    if (i < 0) break;
    ++current[i];
    for (let j = i + 1; j < r; ++j) current[j] = current[j - 1] + 1;
  }
  return result;
}

function subsets(values) {
  const unique = new Map();
  for (let mask = 0; mask < 2 ** values.length; ++mask) {
    const row = values.filter((_, i) => mask & (1 << i)).sort((a, b) => a - b);
    unique.set(JSON.stringify(row), row);
  }
  return [...unique.values()];
}

const primeCache = new Map();
function isPrime(value) {
  if (primeCache.has(value)) return primeCache.get(value);
  let prime = value >= 2;
  for (let d = 2; d * d <= value && prime; ++d) if (value % d === 0) prime = false;
  primeCache.set(value, prime);
  return prime;
}

function sumCombinations(values, target, reusable) {
  const counts = new Map();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  let ways = new Map([[0, [[]]]]);
  for (const [value, frequency] of [...counts].sort((a, b) => a[0] - b[0])) {
    const next = new Map();
    for (const [sum, rows] of ways) {
      const maximum = Math.min(reusable ? Math.floor(target / value) : frequency, Math.floor((target - sum) / value));
      for (let count = 0; count <= maximum; ++count) {
        const newSum = sum + value * count;
        if (!next.has(newSum)) next.set(newSum, []);
        for (const row of rows) next.get(newSum).push([...row, ...Array(count).fill(value)]);
      }
    }
    ways = next;
  }
  const answer = ways.get(target) ?? [];
  if (reusable) assert.ok(answer.length < 150, "LC39 input must have fewer than 150 answers");
  return answer;
}

function maze(input) {
  const [n, m, t, sx, sy, fx, fy, ...obstacles] = numbers(input);
  assert.ok(t >= 1 && t <= 10 && obstacles.length === t * 2);
  let blocked = 0n;
  for (let i = 0; i < obstacles.length; i += 2) blocked |= 1n << BigInt((obstacles[i] - 1) * m + obstacles[i + 1] - 1);
  const start = (sx - 1) * m + sy - 1, goal = (fx - 1) * m + fy - 1;
  if (blocked & (1n << BigInt(goal))) return 0;
  const stack = [[start, blocked | (1n << BigInt(start))]];
  let answer = 0;
  while (stack.length) {
    const [position, used] = stack.pop();
    if (position === goal) { ++answer; continue; }
    for (const next of [position - m, position + m, position % m ? position - 1 : -1, position % m + 1 < m ? position + 1 : -1]) {
      if (next < 0 || next >= n * m || (used & (1n << BigInt(next)))) continue;
      stack.push([next, used | (1n << BigInt(next))]);
    }
  }
  return answer;
}

function elevator(input) {
  const [n, start, goal, ...jumps] = numbers(input);
  const distance = Array(n).fill(Infinity);
  distance[start - 1] = 0;
  // Repeated relaxation is independent of the reference queue traversal.
  for (let round = 0; round < n; ++round) {
    for (let from = 0; from < n; ++from) {
      for (const to of [from - jumps[from], from + jumps[from]]) {
        if (to >= 0 && to < n) distance[to] = Math.min(distance[to], distance[from] + 1);
      }
    }
  }
  return Number.isFinite(distance[goal - 1]) ? distance[goal - 1] : -1;
}

function knightDistances(input) {
  const [n, m, x, y] = numbers(input);
  const distances = Array(n * m).fill(-1), queue = [(x - 1) * m + y - 1];
  distances[queue[0]] = 0;
  for (let head = 0; head < queue.length; ++head) {
    const p = queue[head];
    for (const [dx, dy] of knightSteps) {
      const r = Math.floor(p / m) + dx, c = p % m + dy, next = r * m + c;
      if (r < 0 || r >= n || c < 0 || c >= m || distances[next] !== -1) continue;
      distances[next] = distances[p] + 1;
      queue.push(next);
    }
  }
  return Array.from({ length: n }, (_, r) => distances.slice(r * m, (r + 1) * m).join(" ")).join("\n") + "\n";
}

function wordSearch(input) {
  const [mText, nText, ...parts] = tokens(input), m = Number(mText), n = Number(nText);
  const grid = parts.slice(0, m).join(""), word = parts[m];
  for (const letter of new Set(word)) if ([...word].filter((x) => x === letter).length > [...grid].filter((x) => x === letter).length) return false;
  const pending = [];
  for (let p = 0; p < grid.length; ++p) if (grid[p] === word[0]) pending.push([p, 1, 1n << BigInt(p)]);
  while (pending.length) {
    const [p, depth, used] = pending.pop();
    if (depth === word.length) return true;
    for (const next of [p - n, p + n, p % n ? p - 1 : -1, p % n + 1 < n ? p + 1 : -1]) {
      if (next < 0 || next >= m * n || grid[next] !== word[depth] || (used & (1n << BigInt(next)))) continue;
      pending.push([next, depth + 1, used | (1n << BigInt(next))]);
    }
  }
  return false;
}

function partitions(s) {
  const answers = [];
  for (let mask = 0; mask < 2 ** (s.length - 1); ++mask) {
    const row = [];
    let start = 0;
    for (let end = 1; end <= s.length; ++end) {
      if (end === s.length || (mask & (1 << (end - 1)))) { row.push(s.slice(start, end)); start = end; }
    }
    if (row.every((part) => [...part].reverse().join("") === part)) answers.push(row);
  }
  return answers;
}

function queens(n) {
  const solutions = permutations(Array.from({ length: n }, (_, i) => i)).filter((row) => {
    for (let i = 0; i < n; ++i) for (let j = 0; j < i; ++j) if (Math.abs(row[i] - row[j]) === i - j) return false;
    return true;
  });
  assert.equal(solutions.length, [0, 1, 0, 0, 2, 10, 4, 40, 92, 352][n]);
  return `${solutions.length}\n${solutions.flatMap((row) => row.map((col) => ".".repeat(col) + "Q" + ".".repeat(n - col - 1))).join("\n")}\n`;
}

// Algorithm X checks both uniqueness and optimal scores without the C++ masks/heuristic.
function sudokuAnswers(board, maximum = Infinity) {
  const rowColumns = [], rows = [], columns = Array.from({ length: 324 }, () => new Set());
  for (let r = 0; r < 9; ++r) for (let c = 0; c < 9; ++c) for (let d = 1; d <= 9; ++d) {
    if (board[r * 9 + c] && board[r * 9 + c] !== d) continue;
    const id = rows.length, box = Math.floor(r / 3) * 3 + Math.floor(c / 3);
    rows.push([r, c, d]);
    rowColumns.push([r * 9 + c, 81 + r * 9 + d - 1, 162 + c * 9 + d - 1, 243 + box * 9 + d - 1]);
    for (const col of rowColumns[id]) columns[col].add(id);
  }
  const active = new Set(Array.from({ length: 324 }, (_, i) => i)), chosen = [], answers = [];
  function search() {
    if (!active.size) {
      const answer = Array(81).fill(0);
      for (const id of chosen) { const [r, c, d] = rows[id]; answer[r * 9 + c] = d; }
      answers.push(answer);
      return;
    }
    let best = -1;
    for (const col of active) if (best < 0 || columns[col].size < columns[best].size) best = col;
    for (const id of [...columns[best]]) {
      const removed = [];
      for (const col of rowColumns[id]) {
        active.delete(col);
        for (const conflict of [...columns[col]]) {
          for (const other of rowColumns[conflict]) {
            if (columns[other].delete(conflict)) removed.push([other, conflict]);
          }
        }
      }
      chosen.push(id);
      search();
      chosen.pop();
      for (const [col, conflict] of removed.reverse()) columns[col].add(conflict);
      for (const col of rowColumns[id]) active.add(col);
      if (answers.length >= maximum) return;
    }
  }
  search();
  return answers;
}

const sudokuScore = (board) => board.reduce((sum, digit, p) => sum + digit * (6 + Math.min(Math.floor(p / 9), p % 9, 8 - Math.floor(p / 9), 8 - p % 9)), 0);
const sudokuText = (board, spaced = false) => Array.from({ length: 9 }, (_, r) => board.slice(r * 9, r * 9 + 9).map((v) => spaced ? v : v || ".").join(spaced ? " " : "")).join("\n") + "\n";

let puzzleDistances;
function eightPuzzleDistances() {
  if (puzzleDistances) return puzzleDistances;
  puzzleDistances = new Map([["123804765", 0]]);
  const queue = ["123804765"];
  for (let head = 0; head < queue.length; ++head) {
    const state = queue[head], blank = state.indexOf("0"), depth = puzzleDistances.get(state);
    for (const next of [blank - 3, blank + 3, blank % 3 ? blank - 1 : -1, blank % 3 < 2 ? blank + 1 : -1]) {
      if (next < 0 || next >= 9) continue;
      const chars = [...state];
      [chars[blank], chars[next]] = [chars[next], chars[blank]];
      const key = chars.join("");
      if (!puzzleDistances.has(key)) { puzzleDistances.set(key, depth + 1); queue.push(key); }
    }
  }
  assert.equal(puzzleDistances.size, 181440);
  return puzzleDistances;
}

function sticks(values) {
  const sum = values.reduce((a, b) => a + b, 0), largest = Math.max(...values);
  if (values.every((v) => v === largest)) return largest;
  if (values.length > 20) {
    // Large fixtures have constructive lower-bound or prime-total proofs.
    if (values.every((v) => v === 25 || v === 50) && values.filter((v) => v === 25).length % 2 === 0) return 50;
    if (values[0] === 50 && values.slice(1).every((v) => v === 1) && values.length === 65) return 57;
    if (isPrime(sum) && sum > largest) return sum;
    throw new Error("Large sticks input needs an independent proof");
  }
  for (let target = largest; target <= sum; ++target) {
    if (sum % target) continue;
    const dp = new Int16Array(2 ** values.length).fill(-1);
    dp[0] = 0;
    for (let mask = 0; mask < dp.length; ++mask) {
      if (dp[mask] < 0) continue;
      for (let i = 0; i < values.length; ++i) if (!(mask & (1 << i)) && dp[mask] + values[i] <= target) dp[mask | (1 << i)] = (dp[mask] + values[i]) % target;
    }
    if (dp.at(-1) === 0) return target;
  }
  return sum;
}

const knightGoal = "111110111100*110000100000";
const knightMoves = Array.from({ length: 25 }, (_, p) => knightSteps.map(([dr, dc]) => [Math.floor(p / 5) + dr, p % 5 + dc]).filter(([r, c]) => r >= 0 && r < 5 && c >= 0 && c < 5).map(([r, c]) => r * 5 + c));
const knightEncode = (state) => [...state].reduce((bits, value, p) => value === "1" ? bits | (1 << p) : bits, 0) * 32 + state.indexOf("*");
const knightDecode = (key) => Array.from({ length: 25 }, (_, p) => p === (key & 31) ? "*" : (key >>> 5) & (1 << p) ? "1" : "0").join("");
function knightNeighbors(key) {
  const blank = key & 31, bits = key >>> 5;
  return knightMoves[blank].map((next) => ((bits & (1 << next)) ? bits ^ (1 << blank) ^ (1 << next) : bits) * 32 + next);
}
function boundedKnightBfs(initial, maximum) {
  const distance = new Map([[initial, 0]]), queue = [initial];
  for (let head = 0; head < queue.length; ++head) {
    const key = queue[head], depth = distance.get(key);
    if (depth === maximum) continue;
    for (const next of knightNeighbors(key)) if (!distance.has(next)) { distance.set(next, depth + 1); queue.push(next); }
  }
  return distance;
}
let knightReverse;
function knightMinimum(state) {
  if ([...state].filter((value, p) => value !== "*" && value !== knightGoal[p]).length > 15) return -1;
  const initial = knightEncode(state);
  knightReverse ??= boundedKnightBfs(knightEncode(knightGoal), 8);
  if (knightReverse.has(initial)) return knightReverse.get(initial);
  let best = 16;
  for (const [key, depth] of boundedKnightBfs(initial, 7)) {
    if (knightReverse.has(key)) best = Math.min(best, depth + knightReverse.get(key));
  }
  return best <= 15 ? best : -1;
}

const solvedSudoku = [..."534678912672195348198342567859761423426853791713924856961537284287419635345286179"].map(Number);
const classicSudoku = [..."53..7....6..195....98....6.8...6...34..8.3..17...2...6.6....28....419..5....8..79"].map((v) => v === "." ? 0 : Number(v));
let sparseSudoku;
function unique24Clues() {
  if (sparseSudoku) return sparseSudoku;
  sparseSudoku = [...classicSudoku];
  for (let p = 0; p < 81 && sparseSudoku.filter(Boolean).length > 24; ++p) {
    if (!sparseSudoku[p]) continue;
    const value = sparseSudoku[p];
    sparseSudoku[p] = 0;
    if (sudokuAnswers(sparseSudoku, 2).length !== 1) sparseSudoku[p] = value;
  }
  assert.equal(sparseSudoku.filter(Boolean).length, 24, "sparse Sudoku boundary must have 24 clues");
  return sparseSudoku;
}

let randomState = 150021;
function random(maximum) {
  randomState = (Math.imul(randomState, 1664525) + 1013904223) >>> 0;
  return randomState % maximum;
}
const knightCase = (states) => `${states.length}\n${states.map((s) => s.match(/.{5}/g).join("\n")).join("\n")}\n`;
function exact15Knight() {
  for (let attempt = 0; attempt < 200; ++attempt) {
    let key = knightEncode(knightGoal), previous = -1;
    for (let step = 0; step < 15; ++step) {
      const choices = knightNeighbors(key).filter((next) => (next & 31) !== previous);
      previous = key & 31;
      key = choices[random(choices.length)];
    }
    const state = knightDecode(key);
    if (knightMinimum(state) === 15) return state;
  }
  throw new Error("Could not construct a proven distance-15 knight fixture");
}

function extraInputs(id) {
  switch (id) {
    case 1: return Array.from({ length: 9 }, (_, i) => `${i + 1}\n`);
    case 2: return [[2, 0], [2, 1], [2, 2], [5, 3], [8, 1], [8, 7], [8, 8], [10, 4], [20, 0], [20, 1], [20, 19], [20, 20], [20, 10]].map((a) => `${a.join(" ")}\n`);
    case 3: return [[0], [-10], [-10, 10], [3, 1, 2], [9, 0, -9], [5, 4, 3, 2, 1], [10, -10, 0, 5, -5], Array.from({ length: 10 }, (_, i) => i - 5)].map((a) => arrayInput(a));
    case 4: return [[[1], 0], [[1, 1], 1], [[2, 2], 1], [[1, 1, 1, 1], 2], [[2, 4, 6, 8, 10], 3], [[1, 2, 3, 4, 5], 2], [[5000000, 4999999, 1, 2], 3], [Array(20).fill(5000000), 19], [Array(20).fill(1), 2], [Array.from({ length: 20 }, (_, i) => i + 1), 10], [Array.from({ length: 20 }, (_, i) => i * 101 + 2), 19]].map(([a, k]) => arrayInput(a, k));
    case 5: return ["2", "7", "9", "79", "92", "2222", "7777", "9999", "2345", "267", "9876"].map((s) => s + "\n");
    case 6: return [
      "2 2 1\n1 1 1 1\n2 2", "2 2 1\n1 1 2 2\n2 2", "1 5 1\n1 1 1 5\n1 3",
      "5 1 1\n1 1 5 1\n3 1", "3 3 1\n1 1 3 3\n2 2", "3 3 2\n1 1 3 3\n1 2\n2 1",
      "3 4 2\n1 1 3 4\n2 2\n2 3", "5 5 1\n1 1 5 5\n3 3", "5 5 1\n2 2 4 4\n1 1",
      "5 5 10\n1 1 5 5\n1 2\n1 3\n1 4\n1 5\n2 2\n2 3\n2 4\n2 5\n3 2\n3 3"
    ].map((s) => s + "\n");
    case 7: return [
      "1 1 1\n0", "2 1 2\n0 0", "2 1 2\n1 1", "5 5 1\n1 1 1 1 1", "4 1 4\n2 2 1 0",
      "4 2 4\n4 0 1 0", `200 1 200\n${Array(200).fill(1).join(" ")}`, `200 1 200\n${Array(200).fill(200).join(" ")}`,
      `200 200 1\n${Array(200).fill(1).join(" ")}`, "6 2 5\n0 2 0 1 0 0"
    ].map((s) => s + "\n");
    case 8: return [[1, 1, 1, 1], [1, 8, 1, 4], [8, 1, 4, 1], [2, 3, 1, 1], [2, 10, 1, 5], [4, 4, 2, 2], [8, 8, 8, 8], [10, 13, 5, 7], [400, 400, 1, 1], [400, 400, 200, 201]].map((a) => a.join(" ") + "\n");
    case 9: return Array.from({ length: 8 }, (_, i) => `${i + 1}\n`);
    case 10: return [[[2], 1], [[2], 40], [[40], 40], [[3, 2, 5], 8], [[2, 4], 7], [[8, 2], 8], [[2, 3, 5], 30], [[37, 38, 39, 40], 40], [Array.from({ length: 30 }, (_, i) => i + 2), 1], [[7, 3, 11], 40], [[4, 6, 9], 18]].map(([a, target]) => arrayInput(a, target));
    case 11: return [[0], [-10, -10], [2, 2, 2], [2, 1, 2, 1], [0, 0, -1, 1], Array(10).fill(3), Array.from({ length: 10 }, (_, i) => i - 5), [-10, 10, -10, 10], [3, 2, 1, 3, 2, 1]].map((a) => arrayInput(a));
    case 12: return [[1], [-10], [2, 1], [0, 0], [1, 2, 3], [0, -1, -1, 2], Array(8).fill(1), [-10, -9, -8, -7, -6, -5, -4, -3], [1, 1, 2, 2, 3, 3, 4, 4]].map((a) => arrayInput(a));
    case 13: return [[[1], 1], [[2], 1], [[1], 2], [[1, 1], 2], [[2, 5, 2, 1, 2], 5], [[1, 2, 3, 4, 5], 10], [Array(100).fill(1), 30], [Array(100).fill(50), 30], [Array.from({ length: 100 }, (_, i) => i % 2 + 1), 30], [[10, 10, 10], 30], [[1, 1, 2, 2, 3, 3, 4, 4], 8]].map(([a, target]) => arrayInput(a, target));
    case 14: return [
      "1 1\nA\nA", "1 1\nA\na", "1 2\nAA\nAAA", "2 2\nAB\nCD\nAD", "1 6\nabcdef\nfedcba",
      "3 4\nABCE\nSFCS\nADEE\nSEE", "3 4\nABCE\nSFCS\nADEE\nABCB", "2 3\naBc\nDef\naBcf",
      `6 6\n${Array(6).fill("AAAAAA").join("\n")}\n${"A".repeat(15)}`, `6 6\n${Array(6).fill("AAAAAA").join("\n")}\n${"A".repeat(14)}B`,
      "3 3\nAAA\nABA\nAAA\nABAAAAAAA"
    ].map((s) => s + "\n");
    case 15: return ["a", "aa", "ab", "aba", "abba", "banana", "racecar", "abcdefghijklmnop", "a".repeat(16), "abababababababab"].map((s) => s + "\n");
    case 16: return Array.from({ length: 9 }, (_, i) => `${i + 1}\n`);
    case 17: return [
      solvedSudoku, solvedSudoku.map((d, p) => p === 40 ? 0 : d),
      ...[0, 4, 8].map((r) => solvedSudoku.map((d, p) => Math.floor(p / 9) === r ? 0 : d)),
      ...[1, 4, 8].map((shift) => classicSudoku.map((d) => d ? (d - 1 + shift) % 9 + 1 : 0)),
      Array.from({ length: 81 }, (_, p) => classicSudoku[p % 9 * 9 + Math.floor(p / 9)]), unique24Clues()
    ].map((board) => sudokuText(board));
    case 18: {
      const distance = eightPuzzleDistances(), targets = new Set([0, 1, 2, 8, 12, 16, 20, 24, 28, 30, 31]);
      const inputs = ["012345678\n"];
      for (const [state, depth] of distance) if (targets.delete(depth)) inputs.push(state + "\n");
      return inputs.filter((state) => distance.has(state.trim()));
    }
    case 19: return [[1], [50], [1, 1], [2, 2, 2], [1, 2, 3, 4, 5, 6], [4, 4, 4, 3, 3], [8, 7, 6, 5, 4], [1, 2, 2, 3, 3, 4, 4, 5], [7, 7, 7, 7, 3, 3, 3, 3], Array(65).fill(1), Array(65).fill(50), [50, ...Array(64).fill(25)], [50, ...Array(64).fill(1)], [49, ...Array(64).fill(1)]].map((a) => arrayInput(a));
    case 20: return [
      solvedSudoku, solvedSudoku.map((d, p) => p === 40 ? 0 : d),
      ...[[1, 2], [1, 3], [2, 4]].map((digits) => solvedSudoku.map((d) => digits.includes(d) ? 0 : d)),
      solvedSudoku.map((d, p) => p === 0 ? 6 : d), unique24Clues(),
      [0,0,0,7,0,2,4,5,3,9,0,0,0,0,8,0,0,0,7,4,0,0,0,5,0,1,0,1,9,5,0,8,0,0,0,0,0,7,0,0,0,0,0,2,5,0,3,0,5,7,9,1,0,8,0,0,0,6,0,1,0,0,0,0,6,0,9,0,0,0,0,1,0,0,0,0,0,0,0,0,6]
    ].map((board) => sudokuText(board, true));
    case 21: {
      const one = knightDecode(knightNeighbors(knightEncode(knightGoal))[0]), exact15 = exact15Knight();
      const far = [...knightGoal].map((ch) => ch === "*" ? ch : ch === "0" ? "1" : "0").join("");
      const atEight = knightDecode([...knightReverse].find(([, depth]) => depth === 8)[0]);
      console.log(`P2324 proven distance-15 state: ${exact15}`);
      return [[knightGoal], [one], [atEight], [exact15], [far], [knightGoal, one, atEight, exact15, far], [knightGoal, one, knightGoal, atEight, one, exact15, far, knightGoal, one, atEight]].map(knightCase);
    }
    default: throw new Error(`Unknown Lab ${id}`);
  }
}

function oracle(id, input) {
  const values = numbers(input);
  switch (id) {
    case 1: return permutations(Array.from({ length: values[0] }, (_, i) => i + 1)).map((row) => row.map((v) => String(v).padStart(5)).join("")).join("\n") + "\n";
    case 2: return combinations(...values).map((row) => row.map((v) => String(v).padStart(3)).join("")).join("\n") + "\n";
    case 3: case 11: return rowsOutput(subsets(values.slice(1)));
    case 4: return combinations(values[0], values[1]).filter((positions) => isPrime(positions.reduce((sum, p) => sum + values[p + 1], 0))).length + "\n";
    case 5: {
      const letters = ["", "", "abc", "def", "ghi", "jkl", "mno", "pqrs", "tuv", "wxyz"];
      let words = [""];
      for (const digit of input.trim()) words = words.flatMap((word) => [...letters[Number(digit)]].map((letter) => word + letter));
      return stringsOutput(words);
    }
    case 6: return maze(input) + "\n";
    case 7: return elevator(input) + "\n";
    case 8: return knightDistances(input);
    case 9: {
      const n = values[0], answers = [];
      for (let bits = 0; bits < 2 ** (2 * n); ++bits) {
        let balance = 0, word = "";
        for (let i = 0; i < 2 * n; ++i) { const open = bits & (1 << i); balance += open ? 1 : -1; word += open ? "(" : ")"; if (balance < 0) break; }
        if (balance === 0 && word.length === 2 * n) answers.push(word);
      }
      assert.equal(answers.length, [1, 1, 2, 5, 14, 42, 132, 429, 1430][n]);
      return stringsOutput(answers);
    }
    case 10: case 13: return rowsOutput(sumCombinations(values.slice(2), values[1], id === 10));
    case 12: return rowsOutput(permutations(values.slice(1)));
    case 14: return wordSearch(input) + "\n";
    case 15: return rowsOutput(partitions(input.trim()), textOrder);
    case 16: return queens(values[0]);
    case 17: {
      const board = [...input.replace(/\s/g, "")].map((ch) => ch === "." ? 0 : Number(ch));
      const answers = sudokuAnswers(board, 2);
      assert.equal(answers.length, 1, "LC37 fixture must have exactly one solution");
      return sudokuText(answers[0]);
    }
    case 18: {
      const result = eightPuzzleDistances().get(input.trim());
      assert.notEqual(result, undefined, "P1379 promises a reachable board");
      return result + "\n";
    }
    case 19: return sticks(values.slice(1)) + "\n";
    case 20: {
      assert.ok(values.filter(Boolean).length >= 24);
      const answers = sudokuAnswers(values);
      return (answers.length ? Math.max(...answers.map(sudokuScore)) : -1) + "\n";
    }
    case 21: {
      const parts = tokens(input), count = Number(parts.shift());
      assert.equal(parts.length, count * 5);
      return Array.from({ length: count }, (_, i) => {
        const state = parts.slice(i * 5, i * 5 + 5).join("");
        assert.equal([...state].filter((ch) => ch === "1").length, 12);
        assert.equal([...state].filter((ch) => ch === "0").length, 12);
        assert.equal([...state].filter((ch) => ch === "*").length, 1);
        return knightMinimum(state);
      }).join("\n") + "\n";
    }
    default: throw new Error(`Unknown Lab ${id}`);
  }
}

const directories = fs.readdirSync(exerciseRoot).filter((name) => /^E-15-\d{2}-/.test(name)).sort();
assert.equal(directories.length, 21);
let total = 0;
for (const directory of directories) {
  const id = Number(directory.slice(5, 7));
  if (selected && Number(selected) !== id) continue;
  const labRoot = path.join(exerciseRoot, directory);
  const readme = fs.readFileSync(path.join(labRoot, "README.md"), "utf8").replaceAll("\r\n", "\n");
  assert.ok(readme.includes(`labId: "15E${String(id).padStart(2, "0")}"`));
  const inputMatch = readme.match(/### 样例输入\s+```text\n([\s\S]*?)\n```/);
  const outputMatch = readme.match(/### 样例输出\s+```text\n([\s\S]*?)\n```/);
  assert.ok(inputMatch && outputMatch, `${directory}: missing README sample`);
  const input = normalize(inputMatch[1]), expectedSample = normalize(outputMatch[1]);
  const inputs = [input, ...extraInputs(id).map(normalize)];
  const uniqueInputs = [...new Map(inputs.map((text) => [tokens(text).join(" "), text])).values()];
  const points = Math.floor(100 / uniqueInputs.length), remainder = 100 % uniqueInputs.length;
  const cases = uniqueInputs.map((inputText, i) => {
    const caseId = `${String(i + 1).padStart(3, "0")}-${i === 0 ? "sample" : "coverage"}`;
    const expected = normalize(oracle(id, inputText));
    if (i === 0) assert.deepEqual(tokens(expected), tokens(expectedSample), `${directory}: README sample disagrees with independent oracle`);
    const item = { id: caseId, input: `tests/${caseId}.in`, expected: `tests/${caseId}.out`, points: points + (i < remainder ? 1 : 0), tags: [i === 0 ? "sample" : "boundary", "independent-oracle"] };
    if (write) {
      fs.writeFileSync(path.join(labRoot, item.input), inputText);
      fs.writeFileSync(path.join(labRoot, item.expected), expected);
    } else {
      assert.equal(fs.readFileSync(path.join(labRoot, item.input), "utf8").replaceAll("\r\n", "\n"), inputText, `${directory}/${item.input}: input drift`);
      assert.equal(fs.readFileSync(path.join(labRoot, item.expected), "utf8"), expected, `${directory}/${item.expected}: oracle drift or non-LF output`);
    }
    return item;
  });
  assert.equal(cases.reduce((sum, item) => sum + item.points, 0), 100);
  if (write) fs.writeFileSync(path.join(labRoot, "tests/cases.json"), JSON.stringify(cases, null, 2) + "\n");
  else assert.deepEqual(JSON.parse(fs.readFileSync(path.join(labRoot, "tests/cases.json"), "utf8")), cases);
  total += cases.length;
  console.log(`${directory}: ${cases.length} independently checked cases, 100 points${write ? " written" : " verified"}`);
}
console.log(`Chapter 15: ${total} cases ${write ? "generated" : "verified"}.`);
