import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, '../../../..');
const EXERCISE_ROOT = path.join(ROOT, 'labs/chapter-01/exercise');
const REQUIRED_TAGS = ['sample', 'normal', 'boundary', 'stress'];
const mode = process.argv[2] ?? '--check';

if (!['--plan', '--write', '--check'].includes(mode)) {
  throw new Error('Usage: node generate-cases.mjs [--plan|--write|--check]');
}

const LABS = [
  ['E-01-01-sequential-list-deduplication', 4],
  ['E-01-02-sequential-list-rotate', 5],
  ['E-01-03-sequential-list-kth-largest', 5],
  ['E-01-04-singly-linked-list-reverse', 4],
  ['E-01-05-singly-linked-list-remove-nth', 5],
  ['E-01-06-singly-linked-list-merge', 4],
  ['E-01-07-doubly-linked-list-palindrome', 6],
  ['E-01-08-lru-cache-simulation', 4],
  ['E-01-09-doubly-linked-list-swap-pairs', 4],
  ['E-01-10-josephus-problem', 4],
  ['E-01-11-circular-linked-list-split', 4],
  ['E-01-12-circular-linked-list-delete-value', 4],
  ['E-01-13-static-linked-list-insert', 4],
  ['E-01-14-static-linked-list-reverse', 4],
  ['E-01-15-static-linked-list-merge', 4],
].map(([slug, existingCount]) => ({ slug, existingCount }));

const lf = (text) => `${text.replace(/\r\n/g, '\n').replace(/\n*$/, '')}\n`;
const seq = (n, start = 0, step = 1) => Array.from({ length: n }, (_, i) => start + i * step);
const repeat = (n, value) => Array.from({ length: n }, () => value);
const pattern = (n, modulus = 2001, offset = -1000) =>
  Array.from({ length: n }, (_, i) => ((i * 48271 + (i % 97) * 7919 + 17) % modulus) + offset);
const listInput = (values) => lf(`${values.length}\n${values.join(' ')}`);
const nkInput = (values, k) => lf(`${values.length} ${k}\n${values.join(' ')}`);
const removeInput = (values, k) => lf(`${values.length}\n${values.join(' ')}\n${k}`);
const mergeInput = (left, right) =>
  lf(`${left.length}\n${left.join(' ')}\n${right.length}\n${right.join(' ')}`);
const deleteInput = (values, target) => lf(`${values.length}\n${values.join(' ')}\n${target}`);
const lruInput = (capacity, operations) =>
  lf(`${capacity} ${operations.length}\n${operations.map((op) => op.join(' ')).join('\n')}`);

function staticListInput(values, order = seq(values.length)) {
  if (values.length !== order.length || new Set(order).size !== order.length) {
    throw new Error('Static-list order must be a permutation with the same length as values.');
  }
  if (order.some((index) => index < 0 || index >= values.length)) {
    throw new Error('Static-list order contains an out-of-range index.');
  }

  const slots = Array.from({ length: values.length }, () => ({ data: 0, next: -1 }));
  for (let logical = 0; logical < values.length; logical += 1) {
    const slot = order[logical];
    slots[slot] = {
      data: values[logical],
      next: logical + 1 < values.length ? order[logical + 1] : -1,
    };
  }
  const lines = [String(values.length), ...slots.map(({ data, next }) => `${data} ${next}`)];
  lines.push(values.length === 0 ? '-1' : String(order[0]));
  return lf(lines.join('\n'));
}

const staticMergeInput = (leftValues, rightValues, leftOrder, rightOrder) =>
  staticListInput(leftValues, leftOrder) + staticListInput(rightValues, rightOrder);

const c = (id, tags, inputText) => ({ id, tags, inputText });

function buildCases() {
  const cases = new Map();

  cases.set('E-01-01-sequential-list-deduplication', [
    c('005-two-equal', ['boundary', 'duplicates'], listInput([4, 4])),
    c('006-two-distinct', ['boundary'], listInput([4, 5])),
    c('007-duplicate-prefix', ['normal', 'duplicates'], listInput([1, 1, 1, 2, 3, 4])),
    c('008-duplicate-suffix', ['normal', 'duplicates'], listInput([1, 2, 3, 4, 4, 4])),
    c('009-mixed-runs', ['normal', 'duplicates'], listInput([1, 1, 2, 3, 3, 3, 4, 5, 5])),
    c('010-negative-runs', ['special', 'duplicates'], listInput([-5, -5, -3, -3, -1, -1, 0])),
    c('011-zero-crossing', ['special'], listInput([-2, -1, -1, 0, 0, 1, 2, 2])),
    c('012-min-max-values', ['boundary', 'special'], listInput([-1000000000, -1000000000, 0, 1000000000, 1000000000])),
    c('013-long-middle-run', ['normal', 'duplicates'], listInput([-2, -1, ...repeat(20, 0), 1, 2])),
    c('014-each-value-twice', ['normal', 'duplicates'], listInput(seq(10, -5).flatMap((value) => [value, value]))),
    c('015-varied-run-lengths', ['normal', 'duplicates'], listInput([1, 2, 2, 3, 3, 3, 4, 4, 4, 4, 5])),
    c('016-min-value-repeated', ['boundary', 'duplicates'], listInput([-1000000000, -1000000000, -999999999, 0, 1])),
    c('017-max-value-repeated', ['boundary', 'duplicates'], listInput([-1, 0, 999999999, 1000000000, 1000000000])),
    c('018-medium-many-runs', ['normal'], listInput(seq(200).flatMap((value) => repeat((value % 5) + 1, value)))),
    c('019-stress-all-same', ['stress', 'complexity', 'duplicates'], listInput(repeat(100000, 7))),
    c('020-stress-many-runs', ['stress', 'complexity'], listInput(seq(1000).flatMap((value) => repeat(100, value)))),
  ]);

  cases.set('E-01-02-sequential-list-rotate', [
    c('006-two-elements', ['boundary'], nkInput([10, 20], 1)),
    c('007-rotate-one', ['normal'], nkInput([1, 2, 3, 4, 5, 6, 7], 1)),
    c('008-rotate-n-minus-one', ['normal'], nkInput([1, 2, 3, 4, 5, 6, 7], 6)),
    c('009-k-equals-n', ['boundary'], nkInput([-3, -2, -1, 0, 1], 5)),
    c('010-k-multiple-of-n', ['boundary'], nkInput([1, 2, 3, 4, 5, 6], 18)),
    c('011-odd-length', ['normal'], nkInput([9, 8, 7, 6, 5, 4, 3], 3)),
    c('012-even-length', ['normal'], nkInput([9, 8, 7, 6, 5, 4], 3)),
    c('013-duplicates', ['special', 'duplicates'], nkInput([1, 1, 2, 2, 3, 3], 2)),
    c('014-negative-and-extreme', ['boundary', 'special'], nkInput([-1000000000, -1, 0, 1, 1000000000], 2)),
    c('015-k-billion', ['boundary', 'special'], nkInput([1, 2, 3, 4, 5, 6, 7], 1000000000)),
    c('016-all-equal', ['special', 'duplicates'], nkInput(repeat(12, 42), 5)),
    c('017-medium-prime-length', ['normal'], nkInput(pattern(997, 101, -50), 499)),
    c('018-stress-rotate-one', ['stress', 'complexity'], nkInput(seq(100000).map((i) => i % 1000), 1)),
    c('019-stress-rotate-n-minus-one', ['stress', 'complexity'], nkInput(seq(100000).map((i) => i % 997), 99999)),
    c('020-stress-k-billion', ['stress', 'complexity', 'boundary'], nkInput(pattern(100000, 2001, -1000), 1000000000)),
  ]);

  cases.set('E-01-03-sequential-list-kth-largest', [
    c('006-two-k-first', ['boundary'], nkInput([4, 9], 1)),
    c('007-two-k-second', ['boundary'], nkInput([4, 9], 2)),
    c('008-all-equal-small', ['special', 'duplicates', 'regression'], nkInput(repeat(9, 7), 5)),
    c('009-duplicate-answer-band', ['normal', 'duplicates'], nkInput([9, 5, 5, 5, 1, 8, 5], 4)),
    c('010-negative-zero-positive', ['normal'], nkInput([-9, -1, 0, 3, 7, -4], 3)),
    c('011-min-max-values', ['boundary', 'special'], nkInput([-1000000000, 1000000000, 0, 1, -1], 2)),
    c('012-ascending-middle', ['normal'], nkInput(seq(21, -10), 11)),
    c('013-descending-middle', ['normal'], nkInput(seq(20, 20, -1), 10)),
    c('014-odd-median', ['normal'], nkInput([11, 4, 9, 2, 8, 1, 7, 3, 10], 5)),
    c('015-even-middle', ['normal'], nkInput([8, 1, 7, 2, 6, 3, 5, 4], 4)),
    c('016-duplicate-clusters', ['special', 'duplicates'], nkInput([...repeat(8, 10), ...repeat(12, 5), ...repeat(6, 1)], 14)),
    c('017-k-near-n', ['boundary'], nkInput(pattern(31, 101, -50), 30)),
    c('018-medium-all-equal', ['normal', 'duplicates', 'regression'], nkInput(repeat(5000, -17), 2500)),
    c('019-stress-deterministic-mix', ['stress', 'complexity'], nkInput(pattern(100000, 200001, -100000), 50000)),
    c('020-stress-all-equal', ['stress', 'complexity', 'duplicates', 'regression'], nkInput(repeat(100000, 42), 99999)),
  ]);

  cases.set('E-01-04-singly-linked-list-reverse', [
    c('005-three-nodes', ['boundary'], listInput([1, 2, 3])),
    c('006-even-length', ['normal'], listInput([1, 2, 3, 4, 5, 6])),
    c('007-odd-length', ['normal'], listInput([1, 2, 3, 4, 5, 6, 7])),
    c('008-duplicates', ['special', 'duplicates'], listInput([1, 1, 2, 2, 3, 3])),
    c('009-all-equal', ['special', 'duplicates'], listInput(repeat(10, 8))),
    c('010-negative-values', ['normal'], listInput([-1, -2, -3, -4, -5])),
    c('011-min-max-values', ['boundary', 'special'], listInput([-1000000000, 0, 1000000000])),
    c('012-alternating-signs', ['normal'], listInput([1, -1, 2, -2, 3, -3, 4, -4])),
    c('013-ascending', ['normal'], listInput(seq(30, 1))),
    c('014-descending', ['normal'], listInput(seq(30, 30, -1))),
    c('015-zero-values', ['special', 'duplicates'], listInput([0, 1, 0, -1, 0])),
    c('016-medium-pattern', ['normal'], listInput(pattern(1001, 101, -50))),
    c('017-medium-odd', ['normal'], listInput(seq(999).map((i) => i % 37))),
    c('018-medium-even', ['normal'], listInput(seq(1000).map((i) => i % 41))),
    c('019-stress-repeated', ['stress', 'complexity', 'duplicates'], listInput(seq(100000).map((i) => i % 10))),
    c('020-stress-ascending', ['stress', 'complexity'], listInput(seq(100000, -50000))),
  ]);

  cases.set('E-01-05-singly-linked-list-remove-nth', [
    c('006-middle-odd', ['normal'], removeInput([1, 2, 3, 4, 5], 3)),
    c('007-middle-even-left', ['normal'], removeInput([1, 2, 3, 4, 5, 6], 4)),
    c('008-middle-even-right', ['normal'], removeInput([1, 2, 3, 4, 5, 6], 3)),
    c('009-repeated-values', ['special', 'duplicates'], removeInput([7, 7, 7, 7, 7], 3)),
    c('010-negative-values', ['normal'], removeInput([-5, -4, -3, -2, -1], 2)),
    c('011-min-max-values', ['boundary', 'special'], removeInput([-1000000000, 0, 1000000000], 2)),
    c('012-k-two', ['boundary'], removeInput([10, 20, 30, 40, 50], 2)),
    c('013-k-n-minus-one', ['boundary'], removeInput([10, 20, 30, 40, 50, 60], 5)),
    c('014-short-remove-head', ['boundary'], removeInput([1, 2, 3], 3)),
    c('015-short-remove-tail', ['boundary'], removeInput([1, 2, 3], 1)),
    c('016-medium-middle', ['normal'], removeInput(seq(1001), 501)),
    c('017-medium-near-head', ['normal'], removeInput(seq(1000), 999)),
    c('018-medium-near-tail', ['normal'], removeInput(seq(1000), 2)),
    c('019-stress-remove-middle', ['stress', 'complexity'], removeInput(seq(100000).map((i) => i % 1000), 50000)),
    c('020-stress-remove-head', ['stress', 'complexity', 'boundary'], removeInput(pattern(100000, 2001, -1000), 100000)),
  ]);

  cases.set('E-01-06-singly-linked-list-merge', [
    c('005-both-empty', ['boundary', 'special'], mergeInput([], [])),
    c('006-left-empty', ['boundary'], mergeInput([], [-3, -1, 0, 2])),
    c('007-right-empty', ['boundary'], mergeInput([-3, -1, 0, 2], [])),
    c('008-single-single', ['boundary'], mergeInput([1], [2])),
    c('009-interleaved', ['normal'], mergeInput([1, 3, 5, 7], [2, 4, 6, 8])),
    c('010-cross-list-duplicates', ['normal', 'duplicates'], mergeInput([1, 2, 2, 4], [2, 2, 3, 4])),
    c('011-negative-values', ['normal'], mergeInput([-9, -5, -1], [-8, -4, 0])),
    c('012-min-max-values', ['boundary', 'special'], mergeInput([-1000000000, 0], [-1, 1000000000])),
    c('013-left-prefix-dominates', ['normal'], mergeInput([-10, -9, -8, 5], [1, 2, 3, 4])),
    c('014-right-prefix-dominates', ['normal'], mergeInput([1, 2, 3, 4], [-10, -9, -8, 5])),
    c('015-uneven-lengths', ['normal'], mergeInput([1, 100], seq(30, 2, 3))),
    c('016-alternating-runs', ['normal', 'duplicates'], mergeInput([1, 1, 3, 3, 5, 5], [2, 2, 4, 4, 6, 6])),
    c('017-medium-duplicates', ['normal', 'duplicates'], mergeInput(seq(2000).map((i) => Math.floor(i / 10)), seq(1500).map((i) => Math.floor(i / 8)))),
    c('018-medium-skewed', ['normal'], mergeInput(seq(50, -100), seq(5000, 100))),
    c('019-stress-one-empty', ['stress', 'complexity', 'boundary'], mergeInput([], seq(100000).map((i) => Math.floor(i / 100)))),
    c('020-stress-interleaved', ['stress', 'complexity'], mergeInput(seq(100000).map((i) => Math.floor(i / 100)), seq(100000).map((i) => Math.floor(i / 100)))),
  ]);

  const evenPalindrome = [...seq(50000).map((i) => i % 97)];
  const oddHalf = seq(49999).map((i) => i % 89);
  cases.set('E-01-07-doubly-linked-list-palindrome', [
    c('007-odd-palindrome', ['normal'], listInput([1, 2, 3, 4, 3, 2, 1])),
    c('008-odd-center-mismatch', ['normal'], listInput([1, 2, 3, 9, 3, 8, 1])),
    c('009-even-palindrome', ['normal'], listInput([1, 2, 3, 3, 2, 1])),
    c('010-even-end-mismatch', ['normal'], listInput([1, 2, 3, 3, 2, 9])),
    c('011-near-center-mismatch', ['special'], listInput([1, 2, 3, 4, 5, 4, 8, 2, 1])),
    c('012-negative-palindrome', ['normal'], listInput([-1, -2, 0, -2, -1])),
    c('013-min-max-palindrome', ['boundary', 'special'], listInput([-1000000000, 1000000000, 1000000000, -1000000000])),
    c('014-duplicate-non-palindrome', ['special', 'duplicates'], listInput([1, 1, 2, 1, 2, 1])),
    c('015-all-equal', ['special', 'duplicates'], listInput(repeat(101, 5))),
    c('016-medium-palindrome', ['normal'], listInput([...seq(1000), ...seq(1000).reverse()])),
    c('017-medium-mismatch', ['normal'], listInput([...seq(1000), 999999, ...seq(999).reverse()])),
    c('018-stress-even-palindrome', ['stress', 'complexity'], listInput([...evenPalindrome, ...evenPalindrome.slice().reverse()])),
    c('019-stress-odd-palindrome', ['stress', 'complexity'], listInput([...oddHalf, 1000000000, ...oddHalf.slice().reverse()])),
    c('020-stress-middle-mismatch', ['stress', 'complexity', 'special'], listInput([...evenPalindrome, ...evenPalindrome.slice().reverse().map((v, i) => (i === 0 ? v + 1 : v))])),
  ]);

  const stressOps = [];
  for (let key = 0; key < 10000; key += 1) stressOps.push([2, key, key - 5000]);
  for (let i = 10000; i < 100000; i += 1) {
    if (i % 3 === 0) stressOps.push([1, i % 10001]);
    else if (i % 3 === 1) stressOps.push([2, i % 100001, i - 50000]);
    else stressOps.push([1, (i * 17) % 100001]);
  }
  cases.set('E-01-08-lru-cache-simulation', [
    c('005-put-only', ['boundary'], lruInput(3, [[2, 1, 10], [2, 2, 20], [2, 3, 30]])),
    c('006-get-only', ['boundary'], lruInput(3, [[1, 0], [1, 1], [1, 100000]])),
    c('007-hit-refreshes-recency', ['normal', 'regression'], lruInput(2, [[2, 1, 10], [2, 2, 20], [1, 1], [2, 3, 30], [1, 2], [1, 1]])),
    c('008-update-refreshes-recency', ['normal', 'regression'], lruInput(2, [[2, 1, 10], [2, 2, 20], [2, 1, 11], [2, 3, 30], [1, 2], [1, 1]])),
    c('009-multi-eviction-order', ['normal'], lruInput(3, [[2, 1, 1], [2, 2, 2], [2, 3, 3], [2, 4, 4], [2, 5, 5], [1, 1], [1, 3], [1, 5]])),
    c('010-repeated-hit', ['special'], lruInput(2, [[2, 7, 70], [1, 7], [1, 7], [1, 7]])),
    c('011-repeated-update', ['special'], lruInput(1, [[2, 7, 1], [2, 7, 2], [2, 7, 3], [1, 7]])),
    c('012-key-zero', ['boundary'], lruInput(2, [[2, 0, -5], [1, 0]])),
    c('013-key-max', ['boundary'], lruInput(2, [[2, 100000, 7], [1, 100000]])),
    c('014-extreme-values', ['boundary', 'special'], lruInput(2, [[2, 1, -1000000000], [2, 2, 1000000000], [1, 1], [1, 2]])),
    c('015-update-while-full', ['normal'], lruInput(2, [[2, 1, 10], [2, 2, 20], [2, 1, 100], [1, 2], [1, 1]])),
    c('016-hot-cold-alternation', ['normal'], lruInput(3, [[2, 1, 10], [2, 2, 20], [2, 3, 30], [1, 1], [2, 4, 40], [1, 1], [2, 5, 50], [1, 2], [1, 3]])),
    c('017-medium-hit-heavy', ['normal'], lruInput(100, [...seq(100).map((key) => [2, key, key]), ...seq(2000).map((i) => [1, i % 100])])),
    c('018-medium-miss-heavy', ['normal'], lruInput(10, [...seq(10).map((key) => [2, key, key]), ...seq(2000).map((i) => [1, 1000 + i])])),
    c('019-medium-eviction-chain', ['normal'], lruInput(50, [...seq(5000).map((key) => [2, key, -key]), ...seq(100).map((key) => [1, key])])),
    c('020-stress-capacity-and-operations', ['stress', 'complexity'], lruInput(10000, stressOps)),
  ]);

  cases.set('E-01-09-doubly-linked-list-swap-pairs', [
    c('005-two-nodes', ['boundary'], listInput([1, 2])),
    c('006-three-nodes', ['boundary'], listInput([1, 2, 3])),
    c('007-four-nodes', ['normal'], listInput([1, 2, 3, 4])),
    c('008-five-nodes', ['normal'], listInput([1, 2, 3, 4, 5])),
    c('009-duplicates', ['special', 'duplicates'], listInput([1, 1, 2, 2, 3, 3])),
    c('010-negative-values', ['normal'], listInput([-1, -2, -3, -4, -5])),
    c('011-min-max-values', ['boundary', 'special'], listInput([-1000000000, 0, 1000000000, -1])),
    c('012-all-equal', ['special', 'duplicates'], listInput(repeat(11, 9))),
    c('013-alternating-signs', ['normal'], listInput([1, -1, 2, -2, 3, -3, 4])),
    c('014-ascending', ['normal'], listInput(seq(40, 1))),
    c('015-descending', ['normal'], listInput(seq(40, 40, -1))),
    c('016-medium-odd', ['normal'], listInput(pattern(1001, 101, -50))),
    c('017-medium-even', ['normal'], listInput(pattern(1000, 103, -51))),
    c('018-medium-repeated', ['normal', 'duplicates'], listInput(seq(5000).map((i) => i % 7))),
    c('019-stress-odd', ['stress', 'complexity'], listInput(pattern(99999, 2001, -1000))),
    c('020-stress-even', ['stress', 'complexity'], listInput(seq(100000).map((i) => i % 1000))),
  ]);

  cases.set('E-01-10-josephus-problem', [
    c('005-two-m-one', ['boundary'], lf('2 1')),
    c('006-two-m-two', ['boundary'], lf('2 2')),
    c('007-two-m-large', ['boundary'], lf('2 10000')),
    c('008-m-equals-n', ['normal'], lf('10 10')),
    c('009-m-n-plus-one', ['normal'], lf('10 11')),
    c('010-prime-pair', ['normal'], lf('17 13')),
    c('011-power-of-two', ['normal'], lf('64 8')),
    c('012-large-m-small-n', ['special'], lf('7 9999')),
    c('013-n-max-m-one', ['boundary', 'complexity'], lf('10000 1')),
    c('014-n-max-m-two', ['boundary', 'complexity'], lf('10000 2')),
    c('015-medium-balanced', ['normal'], lf('500 500')),
    c('016-m-max-n-one', ['boundary'], lf('1 10000')),
    c('017-m-max-small-n', ['boundary', 'complexity'], lf('50 10000')),
    c('018-stress-balanced', ['stress', 'complexity'], lf('2000 2000')),
    c('019-stress-n-max', ['stress', 'complexity', 'boundary'], lf('10000 3')),
    c('020-stress-m-max', ['stress', 'complexity', 'boundary'], lf('200 10000')),
  ]);

  cases.set('E-01-11-circular-linked-list-split', [
    c('005-three-nodes', ['boundary'], listInput([1, 2, 3])),
    c('006-four-nodes', ['normal'], listInput([1, 2, 3, 4])),
    c('007-five-nodes', ['normal'], listInput([1, 2, 3, 4, 5])),
    c('008-six-nodes', ['normal'], listInput([1, 2, 3, 4, 5, 6])),
    c('009-duplicates', ['special', 'duplicates'], listInput([1, 1, 2, 2, 3, 3, 4])),
    c('010-negative-values', ['normal'], listInput([-1, -2, -3, -4, -5])),
    c('011-min-max-values', ['boundary', 'special'], listInput([-1000000000, 0, 1000000000])),
    c('012-ascending', ['normal'], listInput(seq(31, 1))),
    c('013-descending', ['normal'], listInput(seq(30, 30, -1))),
    c('014-all-equal', ['special', 'duplicates'], listInput(repeat(25, 5))),
    c('015-odd-pattern', ['normal'], listInput(pattern(101, 41, -20))),
    c('016-even-pattern', ['normal'], listInput(pattern(100, 43, -21))),
    c('017-medium-odd', ['normal'], listInput(seq(5001).map((i) => i % 101))),
    c('018-medium-even', ['normal'], listInput(seq(5000).map((i) => i % 103))),
    c('019-stress-repeated', ['stress', 'complexity', 'duplicates'], listInput(seq(100000).map((i) => i % 10))),
    c('020-stress-odd', ['stress', 'complexity'], listInput(pattern(99999, 2001, -1000))),
  ]);

  cases.set('E-01-12-circular-linked-list-delete-value', [
    c('005-delete-tail', ['boundary', 'regression'], deleteInput([1, 2, 3], 3)),
    c('006-delete-middle', ['normal', 'regression'], deleteInput([1, 2, 3, 4, 5], 3)),
    c('007-single-delete', ['boundary', 'regression'], deleteInput([42], 42)),
    c('008-single-keep', ['boundary', 'regression'], deleteInput([42], 7)),
    c('009-consecutive-prefix', ['normal', 'duplicates'], deleteInput([5, 5, 5, 1, 2, 3], 5)),
    c('010-consecutive-suffix', ['normal', 'duplicates'], deleteInput([1, 2, 3, 5, 5, 5], 5)),
    c('011-alternating', ['normal'], deleteInput([1, 9, 2, 9, 3, 9, 4], 9)),
    c('012-multiple-runs', ['normal', 'duplicates'], deleteInput([7, 7, 1, 7, 2, 7, 7, 3], 7)),
    c('013-negative-target', ['special'], deleteInput([-1, -2, -1, 0, 1], -1)),
    c('014-zero-target', ['special'], deleteInput([0, 1, 0, -1, 0], 0)),
    c('015-min-max-values', ['boundary', 'special'], deleteInput([-1000000000, 0, 1000000000, -1000000000], -1000000000)),
    c('016-only-one-remains', ['boundary', 'duplicates'], deleteInput([8, 8, 3, 8, 8], 8)),
    c('017-medium-none', ['normal'], deleteInput(pattern(5000, 1000, 0), -1)),
    c('018-medium-all', ['normal', 'duplicates'], deleteInput(repeat(5000, 6), 6)),
    c('019-stress-alternating', ['stress', 'complexity'], deleteInput(seq(100000).map((i) => i % 2), 1)),
    c('020-stress-sparse', ['stress', 'complexity'], deleteInput(seq(100000).map((i) => (i % 997 === 0 ? 123456 : i % 100)), 123456)),
  ]);

  cases.set('E-01-13-static-linked-list-insert', [
    c('005-two-ascending', ['boundary'], listInput([1, 2])),
    c('006-two-descending', ['boundary'], listInput([2, 1])),
    c('007-ascending', ['normal'], listInput(seq(20, 1))),
    c('008-descending', ['normal'], listInput(seq(20, 20, -1))),
    c('009-deterministic-mix', ['normal'], listInput(pattern(31, 101, -50))),
    c('010-negative-values', ['normal'], listInput([-5, -1, -3, -2, -4])),
    c('011-zero-crossing', ['normal'], listInput([0, -2, 2, -1, 1])),
    c('012-min-max-values', ['boundary', 'special'], listInput([1000000000, 0, -1000000000])),
    c('013-all-equal', ['special', 'duplicates'], listInput(repeat(25, 7))),
    c('014-duplicate-clusters', ['special', 'duplicates'], listInput([5, 1, 5, 3, 1, 3, 5, 1])),
    c('015-nearly-sorted', ['normal'], listInput([1, 2, 3, 5, 4, 6, 7, 8])),
    c('016-reverse-with-duplicates', ['normal', 'duplicates'], listInput([9, 9, 7, 7, 5, 5, 3, 3, 1, 1])),
    c('017-medium-ascending', ['normal'], listInput(seq(300, -150))),
    c('018-medium-descending', ['normal'], listInput(seq(300, 149, -1))),
    c('019-stress-deterministic-mix', ['stress', 'complexity'], listInput(pattern(1000, 2001, -1000))),
    c('020-stress-ascending', ['stress', 'complexity', 'worst-case'], listInput(seq(1000, -500))),
  ]);

  const reverse1000 = seq(1000).reverse();
  const perm1000 = seq(1000).sort((a, b) => ((a * 37) % 1000) - ((b * 37) % 1000));
  cases.set('E-01-14-static-linked-list-reverse', [
    c('005-head-last-index', ['boundary'], staticListInput([1, 2, 3], [2, 0, 1])),
    c('006-scrambled-physical-order', ['normal'], staticListInput([10, 20, 30, 40, 50], [3, 1, 4, 0, 2])),
    c('007-ascending-index-chain', ['normal'], staticListInput(seq(10, 1))),
    c('008-descending-index-chain', ['normal'], staticListInput(seq(10, 1), seq(10).reverse())),
    c('009-odd-length', ['normal'], staticListInput([1, 2, 3, 4, 5], [2, 4, 0, 3, 1])),
    c('010-even-length', ['normal'], staticListInput([1, 2, 3, 4, 5, 6], [5, 1, 3, 0, 4, 2])),
    c('011-negative-values', ['normal'], staticListInput([-1, -2, -3, -4], [1, 3, 0, 2])),
    c('012-min-max-values', ['boundary', 'special'], staticListInput([-1000000000, 0, 1000000000], [1, 2, 0])),
    c('013-repeated-values', ['special', 'duplicates'], staticListInput([7, 7, 7, 7, 7], [4, 2, 0, 3, 1])),
    c('014-head-middle-index', ['normal'], staticListInput(seq(9, 1), [4, 0, 8, 1, 7, 2, 6, 3, 5])),
    c('015-zigzag-indices', ['normal'], staticListInput(seq(12, 1), [0, 11, 1, 10, 2, 9, 3, 8, 4, 7, 5, 6])),
    c('016-medium-permutation', ['normal'], staticListInput(pattern(101, 101, -50), seq(101).sort((a, b) => ((a * 17) % 101) - ((b * 17) % 101)))),
    c('017-medium-reverse-chain', ['normal'], staticListInput(seq(300), seq(300).reverse())),
    c('018-stress-ascending-chain', ['stress', 'complexity'], staticListInput(seq(1000, -500))),
    c('019-stress-random-permutation', ['stress', 'complexity'], staticListInput(pattern(1000, 2001, -1000), perm1000)),
    c('020-stress-repeated-values', ['stress', 'complexity', 'duplicates'], staticListInput(seq(1000).map((i) => i % 10), reverse1000)),
  ]);

  const perm500 = seq(500).sort((a, b) => ((a * 37) % 500) - ((b * 37) % 500));
  cases.set('E-01-15-static-linked-list-merge', [
    c('005-both-empty', ['boundary', 'special'], staticMergeInput([], [])),
    c('006-left-empty', ['boundary'], staticMergeInput([], [-3, -1, 2], undefined, [2, 0, 1])),
    c('007-right-empty', ['boundary'], staticMergeInput([-3, -1, 2], [], [2, 0, 1])),
    c('008-single-single', ['boundary'], staticMergeInput([1], [2])),
    c('009-interleaved', ['normal'], staticMergeInput([1, 3, 5, 7], [2, 4, 6, 8], [2, 0, 3, 1], [1, 3, 0, 2])),
    c('010-equal-heads', ['normal', 'duplicates'], staticMergeInput([1, 3, 5], [1, 2, 4], [1, 2, 0], [2, 0, 1])),
    c('011-cross-list-duplicates', ['normal', 'duplicates'], staticMergeInput([1, 2, 2, 4], [2, 2, 3, 4], [3, 0, 2, 1], [1, 3, 0, 2])),
    c('012-negative-values', ['normal'], staticMergeInput([-9, -5, -1], [-8, -4, 0], [2, 0, 1], [1, 2, 0])),
    c('013-min-max-values', ['boundary', 'special'], staticMergeInput([-1000000000, 0], [-1, 1000000000], [1, 0], [1, 0])),
    c('014-left-scrambled-indices', ['normal'], staticMergeInput([1, 3, 5, 7, 9], [2, 4, 6], [4, 1, 3, 0, 2], [0, 1, 2])),
    c('015-right-scrambled-indices', ['normal'], staticMergeInput([1, 3, 5], [2, 4, 6, 8, 10], [0, 1, 2], [3, 0, 4, 1, 2])),
    c('016-skewed-sizes', ['normal'], staticMergeInput([1, 1000], seq(100, 2, 3), [1, 0], seq(100).reverse())),
    c('017-medium-interleaved', ['normal'], staticMergeInput(seq(200, 0, 2), seq(200, 1, 2), seq(200).sort((a, b) => ((a * 17) % 200) - ((b * 17) % 200)), seq(200).reverse())),
    c('018-medium-one-empty', ['normal', 'boundary'], staticMergeInput(seq(300).map((i) => Math.floor(i / 3)), [], seq(300).reverse())),
    c('019-stress-duplicates', ['stress', 'complexity', 'duplicates'], staticMergeInput(seq(500).map((i) => Math.floor(i / 5)), seq(500).map((i) => Math.floor(i / 5)), perm500, perm500.slice().reverse())),
    c('020-stress-scrambled-indices', ['stress', 'complexity'], staticMergeInput(seq(500, -1000, 2), seq(500, -999, 2), perm500, perm500.slice().reverse())),
  ]);

  return cases;
}

function assertInsideTests(target, testsDir) {
  const resolvedTarget = path.resolve(target);
  const resolvedTests = path.resolve(testsDir);
  if (resolvedTarget !== resolvedTests && !resolvedTarget.startsWith(`${resolvedTests}${path.sep}`)) {
    throw new Error(`Refusing to access path outside allow-listed tests directory: ${target}`);
  }
}

const outputTokens = (text) => {
  const trimmed = text.trim();
  return trimmed === '' ? [] : trimmed.split(/\s+/);
};

function independentOracle(slug, inputText) {
  const tokens = outputTokens(inputText).map(Number);
  let cursor = 0;
  const take = () => tokens[cursor++];
  const takeList = () => {
    const n = take();
    return Array.from({ length: n }, take);
  };
  const asTokens = (values) => values.map(String);
  const mergeSorted = (left, right) => {
    const merged = [];
    let i = 0;
    let j = 0;
    while (i < left.length || j < right.length) {
      if (j >= right.length || (i < left.length && left[i] <= right[j])) merged.push(left[i++]);
      else merged.push(right[j++]);
    }
    return merged;
  };
  const takeStaticList = () => {
    const n = take();
    const slots = Array.from({ length: n }, () => ({ data: take(), next: take() }));
    const head = take();
    const values = [];
    const visited = new Set();
    for (let p = head; p !== -1; p = slots[p].next) {
      if (p < 0 || p >= n || visited.has(p)) throw new Error(`${slug}: malformed static list`);
      visited.add(p);
      values.push(slots[p].data);
    }
    if (visited.size !== n) throw new Error(`${slug}: static list does not contain every slot`);
    return values;
  };

  let result;
  if (slug.startsWith('E-01-01-')) {
    const values = takeList();
    result = values.filter((value, index) => index === 0 || value !== values[index - 1]);
  } else if (slug.startsWith('E-01-02-')) {
    const n = take();
    const k = take() % n;
    const values = Array.from({ length: n }, take);
    result = k === 0 ? values : [...values.slice(-k), ...values.slice(0, -k)];
  } else if (slug.startsWith('E-01-03-')) {
    const n = take();
    const k = take();
    const values = Array.from({ length: n }, take).sort((a, b) => b - a);
    result = [values[k - 1]];
  } else if (slug.startsWith('E-01-04-')) {
    result = takeList().reverse();
  } else if (slug.startsWith('E-01-05-')) {
    const values = takeList();
    const k = take();
    values.splice(values.length - k, 1);
    result = values;
  } else if (slug.startsWith('E-01-06-')) {
    result = mergeSorted(takeList(), takeList());
  } else if (slug.startsWith('E-01-07-')) {
    const values = takeList();
    result = [values.every((value, index) => value === values[values.length - 1 - index]) ? 'YES' : 'NO'];
  } else if (slug.startsWith('E-01-08-')) {
    const capacity = take();
    const operationCount = take();
    const cache = new Map();
    result = [];
    for (let i = 0; i < operationCount; i += 1) {
      const command = take();
      const key = take();
      if (command === 1) {
        if (!cache.has(key)) result.push(-1);
        else {
          const value = cache.get(key);
          cache.delete(key);
          cache.set(key, value);
          result.push(value);
        }
      } else {
        const value = take();
        if (cache.has(key)) cache.delete(key);
        else if (cache.size === capacity) cache.delete(cache.keys().next().value);
        cache.set(key, value);
      }
    }
  } else if (slug.startsWith('E-01-09-')) {
    result = takeList();
    for (let i = 0; i + 1 < result.length; i += 2) [result[i], result[i + 1]] = [result[i + 1], result[i]];
  } else if (slug.startsWith('E-01-10-')) {
    const n = take();
    const m = take();
    const alive = seq(n, 1);
    result = [];
    let index = 0;
    while (alive.length > 0) {
      index = (index + m - 1) % alive.length;
      result.push(alive.splice(index, 1)[0]);
    }
  } else if (slug.startsWith('E-01-11-')) {
    const values = takeList();
    const firstSize = Math.ceil(values.length / 2);
    result = [...values.slice(0, firstSize), ...values.slice(firstSize)];
  } else if (slug.startsWith('E-01-12-')) {
    const values = takeList();
    const target = take();
    result = values.filter((value) => value !== target);
  } else if (slug.startsWith('E-01-13-')) {
    result = takeList().sort((a, b) => a - b);
  } else if (slug.startsWith('E-01-14-')) {
    result = takeStaticList().reverse();
  } else if (slug.startsWith('E-01-15-')) {
    result = mergeSorted(takeStaticList(), takeStaticList());
  } else {
    throw new Error(`${slug}: no independent oracle`);
  }

  if (cursor !== tokens.length) throw new Error(`${slug}: oracle left ${tokens.length - cursor} unread input tokens`);
  return Array.isArray(result) && result.every((value) => typeof value === 'string') ? result : asTokens(result);
}

async function exists(target) {
  try {
    await access(target);
    return true;
  } catch {
    return false;
  }
}

const generatedByLab = buildCases();
let totalCases = 0;

for (const { slug, existingCount } of LABS) {
  const labDir = path.join(EXERCISE_ROOT, slug);
  const testsDir = path.join(labDir, 'tests');
  const manifestPath = path.join(testsDir, 'cases.json');
  assertInsideTests(manifestPath, testsDir);

  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  if (manifest.length !== existingCount && manifest.length !== 20) {
    throw new Error(`${slug}: expected ${existingCount} baseline cases or 20 generated cases, found ${manifest.length}`);
  }
  const existing = manifest.slice(0, existingCount);

  const added = generatedByLab.get(slug);
  if (!added) throw new Error(`${slug}: missing generated case definitions`);
  const generated = added.map(({ id, tags, inputText }) => ({
    id,
    input: `tests/${id}.in`,
    expected: `tests/${id}.out`,
    points: 5,
    tags,
    inputText,
  }));
  const allCases = [
    ...existing.map((entry) => ({ ...entry, points: 5 })),
    ...generated.map(({ inputText: _inputText, ...entry }) => entry),
  ];

  if (allCases.length !== 20) throw new Error(`${slug}: expected 20 cases, found ${allCases.length}`);
  if (new Set(allCases.map(({ id }) => id)).size !== 20) throw new Error(`${slug}: duplicate case IDs`);
  if (allCases.reduce((sum, entry) => sum + entry.points, 0) !== 100) {
    throw new Error(`${slug}: points do not sum to 100`);
  }
  const tagSet = new Set(allCases.flatMap(({ tags = [] }) => tags));
  for (const tag of REQUIRED_TAGS) {
    if (!tagSet.has(tag)) throw new Error(`${slug}: missing required ${tag} coverage`);
  }

  if (mode === '--write') {
    await mkdir(testsDir, { recursive: true });
    await writeFile(manifestPath, `${JSON.stringify(allCases, null, 2)}\n`, 'utf8');
    for (const generatedCase of generated) {
      const inputPath = path.join(labDir, generatedCase.input);
      const outputPath = path.join(labDir, generatedCase.expected);
      assertInsideTests(inputPath, testsDir);
      assertInsideTests(outputPath, testsDir);
      await writeFile(inputPath, generatedCase.inputText, 'utf8');
      if (!(await exists(outputPath))) await writeFile(outputPath, '', 'utf8');
    }
    for (const entry of allCases) {
      const outputPath = path.join(labDir, entry.expected);
      assertInsideTests(outputPath, testsDir);
      if (await exists(outputPath)) {
        const normalized = (await readFile(outputPath, 'utf8')).replace(/\r\n/g, '\n');
        await writeFile(outputPath, normalized, 'utf8');
      }
    }
  } else if (mode === '--check') {
    const onDisk = `${JSON.stringify(JSON.parse(await readFile(manifestPath, 'utf8')), null, 2)}\n`;
    const expectedManifest = `${JSON.stringify(allCases, null, 2)}\n`;
    if (onDisk !== expectedManifest) throw new Error(`${slug}: cases.json differs from generated manifest`);
    for (const generatedCase of generated) {
      const inputPath = path.join(labDir, generatedCase.input);
      const outputPath = path.join(labDir, generatedCase.expected);
      assertInsideTests(inputPath, testsDir);
      assertInsideTests(outputPath, testsDir);
      if ((await readFile(inputPath, 'utf8')).replace(/\r\n/g, '\n') !== generatedCase.inputText) {
        throw new Error(`${slug}/${generatedCase.id}: generated input differs`);
      }
      if (!(await exists(outputPath))) throw new Error(`${slug}/${generatedCase.id}: missing output file`);
    }
    for (const entry of allCases) {
      const inputPath = path.join(labDir, entry.input);
      const outputPath = path.join(labDir, entry.expected);
      assertInsideTests(inputPath, testsDir);
      assertInsideTests(outputPath, testsDir);
      const oracle = independentOracle(slug, await readFile(inputPath, 'utf8'));
      const actual = outputTokens(await readFile(outputPath, 'utf8'));
      if (JSON.stringify(actual) !== JSON.stringify(oracle)) {
        throw new Error(`${slug}/${entry.id}: expected output disagrees with independent oracle`);
      }
    }
  }

  totalCases += allCases.length;
  console.log(`${slug}: 20 cases, 100 points`);
}

if (generatedByLab.size !== LABS.length) {
  throw new Error(`Generator defines ${generatedByLab.size} labs, allow-list contains ${LABS.length}`);
}

console.log(`${mode}: ${LABS.length} labs, ${totalCases} cases`);
