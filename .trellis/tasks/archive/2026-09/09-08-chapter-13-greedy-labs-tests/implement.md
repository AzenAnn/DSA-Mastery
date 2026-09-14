# 第 13 章贪心 Lab 与测试扩充 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 新增 LeetCode 455、435 两道第 13 章 Program Lab，并让本章 5 道题各有 20 条经过独立 oracle 校验的公开测试。

**Architecture:** 用章节级只读检查脚本锁定 5×20 的可执行合同，用确定性生成脚本维护 fixtures；两道新 Lab 复用现有 C++17 stdio/token 判题结构，章节概览继续依赖 ContentIndex 自动发现。

**Tech Stack:** Node.js 22 ESM、C++17、Lab CLI、VitePress、pnpm。

---

### Task 1：建立会失败的第 13 章合同检查

**Files:**

- Create: `scripts/check-chapter-13-greedy-labs.mjs`
- Reference: `.trellis/tasks/09-08-chapter-13-greedy-labs-tests/design.md`

- [x] **Step 1: 编写章节合同测试**

  脚本只读扫描 `labs/chapter-13/exercise`，按稳定 ID 定位 `13E01`～`13E05`。实现以下通用结构：

  ```js
  import assert from 'node:assert/strict'
  import fs from 'node:fs'
  import path from 'node:path'

  const ROOT = process.cwd()
  const EXERCISE_ROOT = path.join(ROOT, 'labs', 'chapter-13', 'exercise')

  function read(file) {
    return fs.readFileSync(file, 'utf8').replaceAll('\r\n', '\n')
  }

  function tokens(text) {
    return text.trim().split(/\s+/).filter(Boolean)
  }

  function locateLab(sequence) {
    const prefix = `E-13-${String(sequence).padStart(2, '0')}-`
    const matches = fs.readdirSync(EXERCISE_ROOT).filter((name) => name.startsWith(prefix))
    assert.equal(matches.length, 1, `expected one Lab for ${prefix}`)
    return path.join(EXERCISE_ROOT, matches[0])
  }
  ```

  对每道题断言：20 个唯一 case、每项 5 分、总分 100、20 对非空 `.in/.out`、无未登记 fixture；README `labId`/H1/样例一致；两个新题的来源 URL 和概览链接存在。五个 oracle 分别按设计文档中的题意重算输出。

- [x] **Step 2: 运行测试并确认正确的 RED**

  Run: `node scripts/check-chapter-13-greedy-labs.mjs`

  Expected: 非零退出，首个错误明确指出 `13E01` 的 case 数是 7 而不是 20；不能是语法错误或路径误判。

- [x] **Step 3: 检查脚本自身质量**

  Run: `pnpm exec eslint scripts/check-chapter-13-greedy-labs.mjs`

  Expected: exit 0。

### Task 2：建立确定性 fixture 生成器并扩充现有三题

**Files:**

- Create: `scripts/generate-chapter-13-greedy-tests.mjs`
- Modify: `labs/chapter-13/exercise/E-13-01-container-with-most-water/tests/cases.json`
- Modify: `labs/chapter-13/exercise/E-13-02-longest-palindrome/tests/cases.json`
- Modify: `labs/chapter-13/exercise/E-13-03-jump-game/tests/cases.json`
- Create: 上述三个 `tests/` 目录中设计文档列出的 `008`～`020` `.in/.out`
- Modify: 上述三个 Lab 的 `README.md`

- [x] **Step 1: 实现限定路径的生成器**

  使用显式 case 数组和纯函数 oracle。写出合同固定为：

  ```js
  function writeCases(labDirectory, cases, oracle) {
    const testsDirectory = path.join(labDirectory, 'tests')
    fs.mkdirSync(testsDirectory, { recursive: true })
    const manifest = cases.map(({ id, input, tags }) => {
      const expected = `${oracle(input)}\n`
      fs.writeFileSync(path.join(testsDirectory, `${id}.in`), input.endsWith('\n') ? input : `${input}\n`)
      fs.writeFileSync(path.join(testsDirectory, `${id}.out`), expected)
      return {
        id,
        input: `tests/${id}.in`,
        expected: `tests/${id}.out`,
        points: 5,
        tags
      }
    })
    fs.writeFileSync(path.join(testsDirectory, 'cases.json'), `${JSON.stringify(manifest, null, 2)}\n`)
  }
  ```

  5 道题的完整 case id、输入语义和压力数据公式严格采用 `design.md` 的五张测试表；现有 001～007 输入保持字节语义不变。生成器只允许写入五个明确的 `labs/chapter-13/exercise/E-13-*` 目录。

- [x] **Step 2: 生成现有三题 20 组数据**

  Run: `node scripts/generate-chapter-13-greedy-tests.mjs`

  Expected: `13E01`、`13E02`、`13E03` 各生成 20 个 manifest 条目及 20 对 fixture；`13E04/13E05` 的测试目录可提前生成，但此时 Lab 合同仍因缺少新题文档/源码而失败。

- [x] **Step 3: 更新现有 README 的公开测试说明**

  在 3 道现有 README 中加入“公开测试共 20 组、每组 5 分、总分 100”的测试设计提示，并把完成清单写成“20 个公开测试全部通过”。不修改题意、算法或原有来源。

- [x] **Step 4: 验证现有三题仍为 GREEN**

  Run individually:

  ```bash
  pnpm lab:verify -- labs/chapter-13/exercise/E-13-01-container-with-most-water --no-color
  pnpm lab:verify -- labs/chapter-13/exercise/E-13-02-longest-palindrome --no-color
  pnpm lab:verify -- labs/chapter-13/exercise/E-13-03-jump-game --no-color
  ```

  Expected: 每道题 solution 为 100/100，starter 可编译且非满分；每个命令 exit 0。

### Task 3：实现 13E04「分发饼干」

**Files:**

- Create: `labs/chapter-13/exercise/E-13-04-assign-cookies/README.md`
- Create: `labs/chapter-13/exercise/E-13-04-assign-cookies/lab.json`
- Create: `labs/chapter-13/exercise/E-13-04-assign-cookies/Makefile`
- Create: `labs/chapter-13/exercise/E-13-04-assign-cookies/student/main.cpp`
- Create: `labs/chapter-13/exercise/E-13-04-assign-cookies/solution/main.cpp`
- Create: `labs/chapter-13/exercise/E-13-04-assign-cookies/tests/*`

- [x] **Step 1: 先落地 manifest、starter 与已生成的 20 组测试**

  `lab.json` 使用 `schemaVersion: 1`、`type: program`、C++17、stdio、token compare、2000 ms；Makefile 使用仓库三行薄模板。starter 只读取完整输入并输出 0：

  ```cpp
  #include <iostream>
  #include <vector>

  int main() {
      std::ios::sync_with_stdio(false);
      std::cin.tie(nullptr);

      int childCount = 0;
      int cookieCount = 0;
      if (!(std::cin >> childCount >> cookieCount)) return 0;

      std::vector<int> greed(childCount);
      std::vector<int> cookies(cookieCount);
      for (int& value : greed) std::cin >> value;
      for (int& value : cookies) std::cin >> value;

      // 学生需要在这里完成排序与贪心匹配。
      std::cout << 0 << '\n';
      return 0;
  }
  ```

- [x] **Step 2: 验证新题测试对未实现 starter 为 RED**

  Run: `pnpm lab:score -- labs/chapter-13/exercise/E-13-04-assign-cookies --target student --no-color`

  Expected: exit 1，输出 `NOT FULL`，且至少样例 `001-sample-shortage` 为 WA；若配置错误导致 exit 2，先修复配置再重跑。

- [x] **Step 3: 编写最小参考实现**

  ```cpp
  #include <algorithm>
  #include <iostream>
  #include <vector>

  int main() {
      std::ios::sync_with_stdio(false);
      std::cin.tie(nullptr);

      int childCount = 0;
      int cookieCount = 0;
      if (!(std::cin >> childCount >> cookieCount)) return 0;

      std::vector<int> greed(childCount);
      std::vector<int> cookies(cookieCount);
      for (int& value : greed) std::cin >> value;
      for (int& value : cookies) std::cin >> value;

      std::sort(greed.begin(), greed.end());
      std::sort(cookies.begin(), cookies.end());

      int child = 0;
      for (int cookie = 0; cookie < cookieCount && child < childCount; ++cookie) {
          if (cookies[cookie] >= greed[child]) ++child;
      }

      std::cout << child << '\n';
      return 0;
  }
  ```

- [x] **Step 4: 编写课程 README**

  frontmatter 使用 `title/H1: Lab 13-E-04：分发饼干`、`order: 4`、`labId: 13E04`、`difficulty: 入门`、`status: draft`、`updated: 2026-09-08`。正文包含学习目标、前置知识、stdio 输入输出、两个官方样例、交换论证提示、复杂度、20×5 分测试说明、运行命令、完成清单、思考题和 LeetCode 455 来源说明。

- [x] **Step 5: 验证 13E04 为 GREEN**

  Run:

  ```bash
  pnpm lab:validate -- labs/chapter-13/exercise/E-13-04-assign-cookies --no-color
  pnpm lab:verify -- labs/chapter-13/exercise/E-13-04-assign-cookies --no-color
  ```

  Expected: 两个命令 exit 0；solution 100/100，starter 非满分。

### Task 4：实现 13E05「无重叠区间」

**Files:**

- Create: `labs/chapter-13/exercise/E-13-05-non-overlapping-intervals/README.md`
- Create: `labs/chapter-13/exercise/E-13-05-non-overlapping-intervals/lab.json`
- Create: `labs/chapter-13/exercise/E-13-05-non-overlapping-intervals/Makefile`
- Create: `labs/chapter-13/exercise/E-13-05-non-overlapping-intervals/student/main.cpp`
- Create: `labs/chapter-13/exercise/E-13-05-non-overlapping-intervals/solution/main.cpp`
- Create: `labs/chapter-13/exercise/E-13-05-non-overlapping-intervals/tests/*`

- [x] **Step 1: 先落地 manifest、starter 与已生成的 20 组测试**

  manifest/Makefile 与 13E04 使用同一 Program Lab 合同。starter 读取全部区间并输出 0：

  ```cpp
  #include <array>
  #include <iostream>
  #include <vector>

  int main() {
      std::ios::sync_with_stdio(false);
      std::cin.tie(nullptr);

      int n = 0;
      if (!(std::cin >> n)) return 0;
      std::vector<std::array<int, 2>> intervals(n);
      for (auto& interval : intervals) std::cin >> interval[0] >> interval[1];

      // 学生需要在这里完成按结束时间排序的区间贪心。
      std::cout << 0 << '\n';
      return 0;
  }
  ```

- [x] **Step 2: 验证新题测试对未实现 starter 为 RED**

  Run: `pnpm lab:score -- labs/chapter-13/exercise/E-13-05-non-overlapping-intervals --target student --no-color`

  Expected: exit 1，输出 `NOT FULL`，且 `001-sample-mixed` 为 WA。

- [x] **Step 3: 编写最小参考实现**

  ```cpp
  #include <algorithm>
  #include <array>
  #include <iostream>
  #include <vector>

  int main() {
      std::ios::sync_with_stdio(false);
      std::cin.tie(nullptr);

      int n = 0;
      if (!(std::cin >> n)) return 0;
      std::vector<std::array<int, 2>> intervals(n);
      for (auto& interval : intervals) std::cin >> interval[0] >> interval[1];

      std::sort(intervals.begin(), intervals.end(), [](const auto& left, const auto& right) {
          if (left[1] != right[1]) return left[1] < right[1];
          return left[0] < right[0];
      });

      int kept = 1;
      int lastEnd = intervals[0][1];
      for (int i = 1; i < n; ++i) {
          if (intervals[i][0] >= lastEnd) {
              ++kept;
              lastEnd = intervals[i][1];
          }
      }

      std::cout << n - kept << '\n';
      return 0;
  }
  ```

- [x] **Step 4: 编写课程 README**

  frontmatter 使用 `title/H1: Lab 13-E-05：无重叠区间`、`order: 5`、`labId: 13E05`、`difficulty: 进阶`、`status: draft`、`updated: 2026-09-08`。正文包含三个官方样例，明确“端点接触不重叠”，说明“最少删除 = 总数 - 最多保留”、最早结束交换论证、复杂度、20×5 分测试说明、命令、完成清单、思考题和 LeetCode 435 来源。

- [x] **Step 5: 验证 13E05 为 GREEN**

  Run:

  ```bash
  pnpm lab:validate -- labs/chapter-13/exercise/E-13-05-non-overlapping-intervals --no-color
  pnpm lab:verify -- labs/chapter-13/exercise/E-13-05-non-overlapping-intervals --no-color
  ```

  Expected: 两个命令 exit 0；solution 100/100，starter 非满分。

### Task 5：接入章节概览并关闭章节合同

**Files:**

- Modify: `content/chapter-13-greedy/00-overview.md`
- Test: `scripts/check-chapter-13-greedy-labs.mjs`

- [x] **Step 1: 增加两条配套 Lab 描述**

  在现有 13E03 后依次加入 13E04、13E05 相对链接；描述分别强调排序匹配与按结束时间的区间调度，不改变课程自动索引。

- [x] **Step 2: 重跑章节合同并确认 GREEN**

  Run: `node scripts/check-chapter-13-greedy-labs.mjs`

  Expected: 输出明确的成功摘要（5 labs、100 cases）并 exit 0。

- [x] **Step 3: 检查生成器幂等性**

  Run: `node scripts/generate-chapter-13-greedy-tests.mjs && git diff --check`

  Expected: 第二次生成不改变 fixture 语义；`git diff --check` exit 0，无尾随空格或冲突标记。

### Task 6：完成全范围验证与审阅

**Files:**

- Verify: 第 13 章全部改动与 Trellis 规划契约

- [x] **Step 1: 逐 Lab 严格验证**

  Run the five `pnpm lab:verify -- <path> --no-color` commands from Tasks 2–4.

  Expected: 5 个命令全部 exit 0；每题 solution 100/100，starter 非满分。

- [x] **Step 2: 运行内容、文档、发现、构建与站点检查**

  Run:

  ```bash
  pnpm run validate
  pnpm run test:lab-docs
  pnpm run test:discovery
  pnpm run test:lab-make
  pnpm run build
  pnpm run check:site
  ```

  Expected: 全部 exit 0，无 lint/type/schema/链接/构建错误。

- [x] **Step 3: 运行最终差异审计**

  Run:

  ```bash
  git status --short
  git diff --stat
  git diff --check
  rg -n 'Downloads|查看原始页面|答案来源：.*Codex|[T]ODO|[T]BD' labs/chapter-13 scripts/check-chapter-13-greedy-labs.mjs scripts/generate-chapter-13-greedy-tests.mjs
  ```

  Expected: 改动仅落在规划文件列出的路径；`git diff --check` exit 0；清洗扫描无个人路径/生成声明，starter 中允许的教学 TODO 若存在必须仅是未实现提示而非完整解答。

- [x] **Step 4: 对照 PRD 逐项验收并记录证据**

  检查 5 道题、100 个 manifest 条目、100 对 fixture、两条官方来源、两条概览链接、五次 100/100 solution 和五个非满分 starter。把命令及结果写入任务 journal，再进入 `trellis-check`。
