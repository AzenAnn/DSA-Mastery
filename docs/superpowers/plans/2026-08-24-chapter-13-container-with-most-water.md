# Chapter 13 Container With Most Water Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add LeetCode 11 as a runnable, auto-graded C++17 Program Lab under Chapter 13 Greedy Algorithms, including the supplied diagram and automatic course discovery.

**Architecture:** Keep the problem as a standard-input/standard-output Lab under `labs/chapter-13/`. Reuse the existing Lab v1 manifest, thin Makefile, shared compiler/judge, and `CourseIndex`; enable `autoLabChapter: 13` so the same discovered entry feeds the chapter landing page, Labs index, sidebar, and search.

**Tech Stack:** Markdown/VitePress, TypeScript ContentIndex, Node Lab CLI, C++17, JSON manifest/cases, PNG asset.

---

## File map

- Create `labs/chapter-13/lab-13-01-container-with-most-water/README.md` — learner-facing Chinese problem statement, constraints, greedy explanation, image, commands, checklist, and reflection questions.
- Create `labs/chapter-13/lab-13-01-container-with-most-water/lab.json` — Program Lab v1 manifest.
- Create `labs/chapter-13/lab-13-01-container-with-most-water/Makefile` — exact three-line thin Lab entry point.
- Create `labs/chapter-13/lab-13-01-container-with-most-water/assets/container-with-most-water.png` — supplied 801×383 diagram copied into the Lab.
- Create `labs/chapter-13/lab-13-01-container-with-most-water/student/main.cpp` — compile-safe incomplete learner starter.
- Create `labs/chapter-13/lab-13-01-container-with-most-water/solution/main.cpp` — reviewed O(n), O(1) two-pointer reference.
- Create `labs/chapter-13/lab-13-01-container-with-most-water/tests/cases.json` — seven cases whose points total 100.
- Create `labs/chapter-13/lab-13-01-container-with-most-water/tests/*.in` and `tests/*.out` — stable input/oracle fixtures.
- Modify `content/chapter-13-greedy/00-overview.md` — add the Chapter 13 Lab learning link.
- Modify `.vitepress/content-index.ts` — add `autoLabChapter: 13` to the Chapter 13 curriculum definition.

## Task 1: Scaffold the Lab and preserve the supplied image

**Files:** create the Lab directory and generated files listed above.

- [ ] **Step 1: Generate the standard Program skeleton.**

Run:

```bash
pnpm lab:new -- --type program --chapter 13 --order 1 --slug container-with-most-water
```

Expected result: the command creates `labs/chapter-13/lab-13-01-container-with-most-water/` with `README.md`, `lab.json`, `Makefile`, `student/main.cpp`, `solution/main.cpp`, and one sample case. It must not overwrite an existing directory.

- [ ] **Step 2: Create the Lab asset directory and copy the user-provided diagram.**

Run:

```bash
mkdir -p labs/chapter-13/lab-13-01-container-with-most-water/assets
cp /var/folders/jc/gqs_c8zs6jj4hlskmm2lm9080000gn/T/codex-clipboard-BG9pvE.png labs/chapter-13/lab-13-01-container-with-most-water/assets/container-with-most-water.png
file labs/chapter-13/lab-13-01-container-with-most-water/assets/container-with-most-water.png
```

Expected result: the destination is a local 801×383 PNG and no README reference points to `/var/folders`.

- [ ] **Step 3: Check the scaffold before authoring.**

Run:

```bash
find labs/chapter-13/lab-13-01-container-with-most-water -maxdepth 3 -type f -print | sort
```

Expected result: only the generated Lab files, the `assets/` image, and later the planned tests are present; no unrelated files are created.

## Task 2: Author the machine contract, learner starter, reference solution, and tests

**Files:** modify the generated Lab files and create all seven test fixtures.

- [ ] **Step 1: Replace the generated `lab.json` with the repository Program contract.**

Write exactly this manifest to `labs/chapter-13/lab-13-01-container-with-most-water/lab.json`:

```json
{
  "$schema": "../../../schemas/lab.schema.json",
  "schemaVersion": 1,
  "type": "program",
  "language": "cpp",
  "toolchain": {
    "standard": "c++17",
    "profile": "course-default"
  },
  "targets": {
    "student": {
      "sources": ["student/main.cpp"]
    },
    "solution": {
      "sources": ["solution/main.cpp"]
    }
  },
  "judge": {
    "kind": "stdio",
    "cases": "tests/cases.json",
    "compare": { "mode": "tokens" },
    "limits": { "timeMs": 2000, "outputKb": 1024 }
  }
}
```

- [ ] **Step 2: Keep the generated Makefile as the exact thin entry point.**

The file `labs/chapter-13/lab-13-01-container-with-most-water/Makefile` must contain exactly:

```makefile
LAB_DIR := $(CURDIR)
REPO_ROOT := $(LAB_DIR)/../../..
include ../../../tools/lab/lab.mk
```

- [ ] **Step 3: Write a compile-safe but incomplete student starter.**

Write `student/main.cpp` as:

```cpp
#include <iostream>
#include <vector>

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    int n = 0;
    if (!(std::cin >> n)) return 0;

    std::vector<long long> height(n);
    for (long long& value : height) std::cin >> value;

    // 学生需要在这里完成最大容水量算法。
    std::cout << 0 << '\n';
    return 0;
}
```

This starter compiles, reads the declared input, and is intentionally not a complete solution.

- [ ] **Step 4: Write the reviewed O(n), O(1) reference solution.**

Write `solution/main.cpp` as:

```cpp
#include <algorithm>
#include <iostream>
#include <vector>

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    int n = 0;
    if (!(std::cin >> n)) return 0;

    std::vector<long long> height(n);
    for (long long& value : height) std::cin >> value;

    int left = 0;
    int right = n - 1;
    long long answer = 0;

    while (left < right) {
        const long long width = right - left;
        const long long boundedHeight = std::min(height[left], height[right]);
        answer = std::max(answer, width * boundedHeight);

        if (height[left] < height[right]) {
            ++left;
        } else {
            --right;
        }
    }

    std::cout << answer << '\n';
    return 0;
}
```

The equal-height branch moves the right pointer consistently. The implementation uses `long long` for the area while retaining the problem's O(n) time and O(1) auxiliary-space algorithm.

- [ ] **Step 5: Replace `tests/cases.json` with seven 100-point cases.**

Write:

```json
[
  {
    "id": "001-sample",
    "input": "tests/001-sample.in",
    "expected": "tests/001-sample.out",
    "points": 20,
    "tags": ["sample"],
    "compare": { "mode": "exact" }
  },
  {
    "id": "002-minimum",
    "input": "tests/002-minimum.in",
    "expected": "tests/002-minimum.out",
    "points": 10,
    "tags": ["boundary", "minimum"]
  },
  {
    "id": "003-all-zero",
    "input": "tests/003-all-zero.in",
    "expected": "tests/003-all-zero.out",
    "points": 10,
    "tags": ["boundary", "zero"]
  },
  {
    "id": "004-equal-ends",
    "input": "tests/004-equal-ends.in",
    "expected": "tests/004-equal-ends.out",
    "points": 15,
    "tags": ["normal", "equal-height"]
  },
  {
    "id": "005-increasing",
    "input": "tests/005-increasing.in",
    "expected": "tests/005-increasing.out",
    "points": 15,
    "tags": ["normal", "monotonic"]
  },
  {
    "id": "006-local-peak",
    "input": "tests/006-local-peak.in",
    "expected": "tests/006-local-peak.out",
    "points": 15,
    "tags": ["normal", "greedy-choice"]
  },
  {
    "id": "007-large-values",
    "input": "tests/007-large-values.in",
    "expected": "tests/007-large-values.out",
    "points": 15,
    "tags": ["boundary", "numeric-range"]
  }
]
```

The points total exactly 100. Create the matching fixtures with these exact contents:

| File | Contents |
| --- | --- |
| `001-sample.in` | `9\n1 8 6 2 5 4 8 3 7\n` |
| `001-sample.out` | `49\n` |
| `002-minimum.in` | `2\n1 1\n` |
| `002-minimum.out` | `1\n` |
| `003-all-zero.in` | `4\n0 0 0 0\n` |
| `003-all-zero.out` | `0\n` |
| `004-equal-ends.in` | `5\n4 3 2 1 4\n` |
| `004-equal-ends.out` | `16\n` |
| `005-increasing.in` | `5\n1 2 3 4 5\n` |
| `005-increasing.out` | `6\n` |
| `006-local-peak.in` | `7\n2 3 4 5 18 17 6\n` |
| `006-local-peak.out` | `17\n` |
| `007-large-values.in` | `3\n10000 0 10000\n` |
| `007-large-values.out` | `20000\n` |

Use `apply_patch` for text fixtures so the committed files have LF line endings. Do not use the downloaded source file as a runtime dependency.

- [ ] **Step 6: Author the learner README without duplicating the solution source.**

Write `README.md` with this frontmatter:

```yaml
---
title: "Lab 13-01：盛最多水的容器"
description: "使用相向双指针和贪心选择求解最大容水量，理解为什么应该移动短板。"
order: 1
chapter: 13
chapterTitle: "贪心算法"
updated: "2026-08-24"
contributors: ["Shuoyuchen"]
status: "draft"
lab: true
difficulty: "基础"
duration: "30～45 分钟"
---
```

The body must contain these sections and facts:

1. H1 exactly matching the frontmatter title.
2. 学习目标: compute maximum area, implement O(n) two pointers, and explain the greedy safety argument.
3. 题目: for `height`, choose two vertical lines and return the largest non-tilted container.
4. The formula `min(height[l], height[r]) × (r - l)` and a diagram reference:

   ```md
   ![数组示例中由两条高线围成的最大盛水区域](./assets/container-with-most-water.png)
   ```

5. Input/output format matching the fixtures: first `n`, then `n` non-negative heights, then one integer.
6. Constraints `2 ≤ n ≤ 10^5` and `0 ≤ height[i] ≤ 10^4`, with O(n) time and O(1) extra-space requirements.
7. The sample input/output for the official sample, plus at least one boundary example.
8. Algorithm explanation: width decreases on every move; moving the taller side cannot increase the limiting height, so only the shorter side can reveal a better candidate. State that equal heights may move either side.
9. Complexity analysis and a short note that the problem source is LeetCode 11 with a link to `https://leetcode.cn/problems/container-with-most-water/`.
10. Verification commands using `make` and the repository-root `pnpm lab:*` fallback, completion checklist, and two reflection questions about the greedy choice and why brute force is unsuitable.

Do not include the downloaded local path, crawl/API metadata, multi-language function signatures, or a second full reference implementation.

- [ ] **Step 7: Validate the Lab contract before course integration.**

Run:

```bash
pnpm lab:validate -- labs/chapter-13/lab-13-01-container-with-most-water --no-color
```

Expected result: `VALIDATION PASS`, type `program`, seven tests, and `100/100` points. If it fails, fix only the Lab files before touching the course index.

## Task 3: Connect the Lab to Chapter 13 discovery and learning flow

**Files:** modify `content/chapter-13-greedy/00-overview.md` and `.vitepress/content-index.ts`.

- [ ] **Step 1: Add the overview learning link.**

In `content/chapter-13-greedy/00-overview.md`, add a `## 配套 Lab` section after the learning route and before the intuition callout:

```md
## 配套 Lab

完成 [Lab 13-01：盛最多水的容器](../../labs/chapter-13/lab-13-01-container-with-most-water/README.md)，把“移动短板”的贪心选择落实为可运行程序，并用边界测试检查面积与指针更新。
```

- [ ] **Step 2: Enable automatic Chapter 13 Lab collection.**

In `.vitepress/content-index.ts`, inside the `chapter-13-greedy` definition immediately after its `lessonSources` array, add:

```ts
autoLabChapter: 13,
```

Do not add a `labSources` list or hard-code the Lab title. The existing `collectCourseIndex()` path will derive `program → exercise` and filter all chapter-13 Labs through the same `CourseIndex`.

- [ ] **Step 3: Verify discovery data before building.**

Run:

```bash
pnpm run validate:content
pnpm run test:discovery
```

Expected result: content validation reports one additional Lab and one additional manifest; discovery completes without a missing relative link or route error.

## Task 4: Compile, score, inspect the built site, and deliver the branch

**Files:** no new product files; update task checkboxes and commit metadata only after verification.

- [ ] **Step 1: Build both Program targets.**

Run:

```bash
pnpm lab:build -- labs/chapter-13/lab-13-01-container-with-most-water --target student --no-color
pnpm lab:build -- labs/chapter-13/lab-13-01-container-with-most-water --target solution --no-color
```

Expected result: both targets compile with C++17 and only `.lab-cache/` receives generated build artifacts.

- [ ] **Step 2: Run and strictly verify the reference implementation.**

Run:

```bash
pnpm lab:run -- labs/chapter-13/lab-13-01-container-with-most-water --target solution --no-color
pnpm lab:verify -- labs/chapter-13/lab-13-01-container-with-most-water --no-color
```

Expected result: all seven cases pass, the reference scores `100/100`, and verification confirms the student target compiles but is not full score.

- [ ] **Step 3: Run repository quality checks.**

Run:

```bash
pnpm run typecheck
pnpm run lint
pnpm run build
pnpm run check:site
```

Expected result: type checking, lint, VitePress production build, and built-site route/content audits pass. The generated `dist/pages/` and `.vitepress/.temp/`/cache outputs remain untracked and are not committed.

- [ ] **Step 4: Run browser validation when the local environment supports it.**

Run:

```bash
pnpm run test:pages
```

Expected result: the Chapter 13 outline opens, the Lab appears in the relevant discovery surfaces, the Lab page renders its image, and the run has no page, console, or same-origin network errors. If Playwright browsers are unavailable, record the environment error separately without treating it as a product failure.

- [ ] **Step 5: Check scope, status, and generated files.**

Run:

```bash
git diff --check
git status --short --branch
git diff --name-only main...HEAD
find labs/chapter-13/lab-13-01-container-with-most-water -type f -path '*/.lab-cache/*' -prune -o -type f -print | sort
```

Expected result: only the new Lab, the two Chapter 13 integration files, and task/planning commits are in scope; no temporary source path, binary build output, `dist/`, screenshot, or trace is staged.

- [ ] **Step 6: Commit the product implementation.**

Run:

```bash
git add .vitepress/content-index.ts content/chapter-13-greedy/00-overview.md labs/chapter-13/lab-13-01-container-with-most-water
git commit -m "feat(ch13): add container with most water lab"
```

- [ ] **Step 7: Report handoff without remote mutation.**

Report the branch name, implementation commit, changed files, validation commands/results, and explicitly state that the branch was not pushed and no remote PR was created. Wait for a separate user request before `git push` or PR creation.

## Review checklist

- [ ] PRD requirements R1–R4 each map to Tasks 1–4.
- [ ] Design data flow is preserved: README → ContentIndex/rewrite and manifest → shared judge.
- [ ] No placeholder wording remains in this plan.
- [ ] The starter, solution, manifest, cases, paths, points, and validation commands use consistent names.
