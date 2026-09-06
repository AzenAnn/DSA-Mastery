# Chapter 1 Program Case Matrix

## Inventory

- Scope: `01E01`～`01E15`; `01P01` excluded by user decision.
- Current: 65 cases total, 4～6 per Lab.
- Target: 20 cases per Lab, 300 total, 5 points each.
- Existing IDs and semantics remain; new IDs continue numerically to `020-*`.
- Every Lab receives `sample`, `normal`, `boundary`, `stress`, plus problem-specific `special` or `regression` tags.

## Scale policy

- Linear algorithms with `n <= 100000`: at least one deterministic `n = 100000` case, using compact values so stdout remains below `outputKb`.
- LRU: one `100000`-operation workload with capacity up to `10000`, containing enough hits, updates and evictions to reject linear scans.
- Static linked-list exercises: use their documented maxima (`1000`, or `500 + 500`).
- Josephus: cover `n = 10000` and `m = 10000` in separate stable cases; do not combine both maxima when that turns the documented `O(n*m)` reference into a platform-dependent 100-million-step timing test.
- Random-looking data is produced by a fixed formula/seed and is reproducible; no runtime randomness enters committed fixtures.

## Planned 20-case suites

### 01E01 — ordered sequential-list deduplication

`001-sample` (existing); `002-single` (existing); `003-all-same` (existing); `004-no-duplicates` (existing); `005-two-equal`; `006-two-distinct`; `007-duplicate-prefix`; `008-duplicate-suffix`; `009-mixed-runs`; `010-negative-runs`; `011-zero-crossing`; `012-min-max-values`; `013-long-middle-run`; `014-each-value-twice`; `015-varied-run-lengths`; `016-min-value-repeated`; `017-max-value-repeated`; `018-medium-many-runs`; `019-stress-all-same`; `020-stress-many-runs`.

Key faults: losing first/last value, comparing against the wrong write position, mishandling extreme values, quadratic shifting, output separators.

### 01E02 — sequential-list right rotation

`001-sample` (existing); `002-no-rotate` (existing); `003-single` (existing); `004-k-larger` (existing); `005-k-zero` (existing); `006-two-elements`; `007-rotate-one`; `008-rotate-n-minus-one`; `009-k-equals-n`; `010-k-multiple-of-n`; `011-odd-length`; `012-even-length`; `013-duplicates`; `014-negative-and-extreme`; `015-k-billion`; `016-all-equal`; `017-medium-prime-length`; `018-stress-rotate-one`; `019-stress-rotate-n-minus-one`; `020-stress-k-billion`.

Key faults: missing `k %= n`, off-by-one reverse ranges, wrong direction, odd/even split, large-`k` overflow.

### 01E03 — kth largest in a sequential list

`001-sample` (existing); `002-single` (existing); `003-all-negative` (existing); `004-max-element` (existing); `005-min-element` (existing); `006-two-k-first`; `007-two-k-second`; `008-all-equal-small`; `009-duplicate-answer-band`; `010-negative-zero-positive`; `011-min-max-values`; `012-ascending-middle`; `013-descending-middle`; `014-odd-median`; `015-even-middle`; `016-duplicate-clusters`; `017-k-near-n`; `018-medium-all-equal`; `019-stress-deterministic-mix`; `020-stress-all-equal`.

Key faults: confusing kth largest/smallest, treating duplicates as distinct ranks, `k` endpoint errors, two-way partition degeneration on equal values. Valid stress failures may require a minimal three-way partition correction in the reference and its README snippet.

### 01E04 — singly linked-list reverse

`001-sample` (existing); `002-single` (existing); `003-two-nodes` (existing); `004-empty` (existing); `005-three-nodes`; `006-even-length`; `007-odd-length`; `008-duplicates`; `009-all-equal`; `010-negative-values`; `011-min-max-values`; `012-alternating-signs`; `013-ascending`; `014-descending`; `015-zero-values`; `016-medium-pattern`; `017-medium-odd`; `018-medium-even`; `019-stress-repeated`; `020-stress-ascending`.

Key faults: dropping the old head, creating a cycle, failing empty/single lists, using recursion that overflows at maximum length.

### 01E05 — remove kth node from the end

`001-sample` (existing); `002-remove-head` (existing); `003-single` (existing); `004-remove-tail` (existing); `005-two-nodes` (existing); `006-middle-odd`; `007-middle-even-left`; `008-middle-even-right`; `009-repeated-values`; `010-negative-values`; `011-min-max-values`; `012-k-two`; `013-k-n-minus-one`; `014-short-remove-head`; `015-short-remove-tail`; `016-medium-middle`; `017-medium-near-head`; `018-medium-near-tail`; `019-stress-remove-middle`; `020-stress-remove-head`.

Key faults: advancing fast pointer by the wrong count, deleting head without a dummy, wrong `k=1`/`k=n`, two-pass implementations hidden by small data.

### 01E06 — merge two sorted singly linked lists

`001-sample` (existing); `002-one-empty` (existing); `003-all-same` (existing); `004-separated` (existing); `005-both-empty`; `006-left-empty`; `007-right-empty`; `008-single-single`; `009-interleaved`; `010-cross-list-duplicates`; `011-negative-values`; `012-min-max-values`; `013-left-prefix-dominates`; `014-right-prefix-dominates`; `015-uneven-lengths`; `016-alternating-runs`; `017-medium-duplicates`; `018-medium-skewed`; `019-stress-one-empty`; `020-stress-interleaved`.

Key faults: forgetting the remaining tail, unstable/equal-value branch mistakes, allocating unnecessary arrays, empty-list handling.

### 01E07 — doubly linked-list palindrome

`001-sample-yes` (existing); `002-sample-no` (existing); `003-empty` (existing); `004-single` (existing); `005-two-same` (existing); `006-two-diff` (existing); `007-odd-palindrome`; `008-odd-center-mismatch`; `009-even-palindrome`; `010-even-end-mismatch`; `011-near-center-mismatch`; `012-negative-palindrome`; `013-min-max-palindrome`; `014-duplicate-non-palindrome`; `015-all-equal`; `016-medium-palindrome`; `017-medium-mismatch`; `018-stress-even-palindrome`; `019-stress-odd-palindrome`; `020-stress-middle-mismatch`.

Key faults: wrong crossing condition, skipping/overchecking the center, checking only endpoints, storing a forbidden full copy.

### 01E08 — LRU cache simulation

`001-sample` (existing); `002-capacity-one` (existing, oracle corrected); `003-update-existing` (existing); `004-miss-all` (existing); `005-put-only`; `006-get-only`; `007-hit-refreshes-recency`; `008-update-refreshes-recency`; `009-multi-eviction-order`; `010-repeated-hit`; `011-repeated-update`; `012-key-zero`; `013-key-max`; `014-extreme-values`; `015-update-while-full`; `016-hot-cold-alternation`; `017-medium-hit-heavy`; `018-medium-miss-heavy`; `019-medium-eviction-chain`; `020-stress-capacity-and-operations`.

Key faults: FIFO instead of LRU, get/update not refreshing recency, duplicate nodes on update, capacity-one eviction, key-range endpoints, `O(capacity)` operations.

### 01E09 — swap adjacent nodes in a doubly linked list

`001-sample` (existing); `002-odd-length` (existing); `003-empty` (existing); `004-single` (existing); `005-two-nodes`; `006-three-nodes`; `007-four-nodes`; `008-five-nodes`; `009-duplicates`; `010-negative-values`; `011-min-max-values`; `012-all-equal`; `013-alternating-signs`; `014-ascending`; `015-descending`; `016-medium-odd`; `017-medium-even`; `018-medium-repeated`; `019-stress-odd`; `020-stress-even`.

Key faults: swapping values instead of links, losing the odd tail, broken `prev` pointers, wrong dummy-head reconnection.

### 01E10 — Josephus elimination order

`001-sample` (existing); `002-single` (existing); `003-m-equals-one` (existing); `004-larger-m` (existing); `005-two-m-one`; `006-two-m-two`; `007-two-m-large`; `008-m-equals-n`; `009-m-n-plus-one`; `010-prime-pair`; `011-power-of-two`; `012-large-m-small-n`; `013-n-max-m-one`; `014-n-max-m-two`; `015-medium-balanced`; `016-m-max-n-one`; `017-m-max-small-n`; `018-stress-balanced`; `019-stress-n-max`; `020-stress-m-max`.

Key faults: starting count from the wrong node, off-by-one deletion, failing `m=1`, not preserving the circular predecessor, unstable double-maximum timing.

### 01E11 — split a circular singly linked list

`001-sample-even` (existing); `002-sample-odd` (existing); `003-single` (existing); `004-two-nodes` (existing); `005-three-nodes`; `006-four-nodes`; `007-five-nodes`; `008-six-nodes`; `009-duplicates`; `010-negative-values`; `011-min-max-values`; `012-ascending`; `013-descending`; `014-all-equal`; `015-odd-pattern`; `016-even-pattern`; `017-medium-odd`; `018-medium-even`; `019-stress-repeated`; `020-stress-odd`.

Key faults: wrong odd split size, not closing both circles, fast-pointer termination errors, single-node second-list formatting.

### 01E12 — delete all matching values from a circular list

`001-sample` (existing); `002-delete-all` (existing); `003-delete-head` (existing); `004-delete-none` (existing); `005-delete-tail`; `006-delete-middle`; `007-single-delete`; `008-single-keep`; `009-consecutive-prefix`; `010-consecutive-suffix`; `011-alternating`; `012-multiple-runs`; `013-negative-target`; `014-zero-target`; `015-min-max-values`; `016-only-one-remains`; `017-medium-none`; `018-medium-all`; `019-stress-alternating`; `020-stress-sparse`.

Key faults: solution input order mismatch, deleting head/tail in a circle, all-deleted termination, consecutive matches, use-after-free or infinite traversal.

### 01E13 — ordered insertion in a static linked list

`001-sample` (existing); `002-duplicates` (existing); `003-empty` (existing); `004-single` (existing); `005-two-ascending`; `006-two-descending`; `007-ascending`; `008-descending`; `009-deterministic-mix`; `010-negative-values`; `011-zero-crossing`; `012-min-max-values`; `013-all-equal`; `014-duplicate-clusters`; `015-nearly-sorted`; `016-reverse-with-duplicates`; `017-medium-ascending`; `018-medium-descending`; `019-stress-deterministic-mix`; `020-stress-ascending`.

Key faults: wrong head insertion, incorrect placement after equals, static-index link corruption, documented `O(n²)` boundary at `n=1000`.

### 01E14 — reverse a static linked list

`001-sample` (existing); `002-single` (existing); `003-empty` (existing); `004-two-nodes` (existing); `005-head-last-index`; `006-scrambled-physical-order`; `007-ascending-index-chain`; `008-descending-index-chain`; `009-odd-length`; `010-even-length`; `011-negative-values`; `012-min-max-values`; `013-repeated-values`; `014-head-middle-index`; `015-zigzag-indices`; `016-medium-permutation`; `017-medium-reverse-chain`; `018-stress-ascending-chain`; `019-stress-random-permutation`; `020-stress-repeated-values`.

Key faults: assuming head is zero, confusing physical and logical order, mishandling `-1`, traversing array order instead of next links.

### 01E15 — merge two ordered static linked lists

`001-sample` (existing); `002-one-empty` (existing); `003-duplicates` (existing); `004-separated` (existing); `005-both-empty`; `006-left-empty`; `007-right-empty`; `008-single-single`; `009-interleaved`; `010-equal-heads`; `011-cross-list-duplicates`; `012-negative-values`; `013-min-max-values`; `014-left-scrambled-indices`; `015-right-scrambled-indices`; `016-skewed-sizes`; `017-medium-interleaved`; `018-medium-one-empty`; `019-stress-duplicates`; `020-stress-scrambled-indices`.

Key faults: forgetting to offset second-pool indices, assuming head zero/physical order, equal-value branch errors, empty-list tail handling.

## Baseline defects to close

1. `01E08/002-capacity-one`: after inserting key 2 into a capacity-one cache, `get(2)` must return `2`; existing oracle incorrectly says `-1`.
2. `01E12`: README and existing fixtures provide `n`, values, then `x`; reference currently reads `n`, `x`, then values.
3. `01E03`: the two-way Lomuto partition has quadratic degeneration for all-equal input; the planned maximum duplicate case must either pass after a minimal three-way partition correction or be recorded as a blocker. The preferred design is the correction, because all-equal input is fully valid and directly exercises the stated expected-linear selection goal.
