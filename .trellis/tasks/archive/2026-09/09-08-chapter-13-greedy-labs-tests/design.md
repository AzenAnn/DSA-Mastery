# 技术设计：第 13 章贪心 Lab 与测试扩充

## 方案选择

采用“章节级合同检查 + 确定性测试生成 + 标准 Program Lab”方案。

- 方案 A（采用）：新增独立的第 13 章合同检查脚本，并用确定性生成脚本维护 5 道题的 20 组公开数据。优点是能持续防止 case 数量、分值、文件配对、README 样例和 oracle 输出漂移；代价是新增两个小型维护脚本。
- 方案 B：只提交 `.in/.out/cases.json`，完全依赖逐 Lab `verify`。文件更少，但无法一次断言“第 13 章恰有目标 5 题且每题恰好 20 组”，也缺少独立 oracle 复核。
- 方案 C：修改通用 Lab CLI，让所有章节强制 20 组。会改变其他章节合同，明显超出本任务范围。

仓库已有 `scripts/generate-chapter-12-divide-conquer-labs.mjs`、`scripts/generate-chapter-14-dp-labs.mjs` 与 `scripts/check-chapter-12-lab-contracts.mjs`，因此方案 A 与现有维护方式一致，又不改变共享判题器。

## 改动边界与文件职责

```text
scripts/
├── generate-chapter-13-greedy-tests.mjs  # 单一测试数据源；确定性写出 5×20 组 fixtures
└── check-chapter-13-greedy-labs.mjs      # 章节合同、文件配对、分值和独立 oracle 检查

labs/chapter-13/exercise/
├── E-13-01-container-with-most-water/    # 保留题意/实现，测试从 7 扩至 20
├── E-13-02-longest-palindrome/           # 保留题意/实现，测试从 7 扩至 20
├── E-13-03-jump-game/                    # 保留题意/实现，测试从 7 扩至 20
├── E-13-04-assign-cookies/               # 新增 LeetCode 455 Program Lab
└── E-13-05-non-overlapping-intervals/    # 新增 LeetCode 435 Program Lab

content/chapter-13-greedy/00-overview.md   # 增加 13E04、13E05 配套 Lab 链接
```

现有 3 道 Lab 只修改 README 的测试说明和 `tests/`；不改变其输入输出、starter、solution、manifest 或稳定 ID。新 Lab 保持 `status: draft`，由 ContentIndex 自动发现，不新增手工导航数据。

## 新题接口与算法

### 13E04：分发饼干

- 来源：[LeetCode 455](https://leetcode.cn/problems/assign-cookies/)，难度“简单”。
- 输入：第一行 `n m`；第二行 `n` 个正整数胃口值；第三行 `m` 个正整数饼干尺寸。`1 ≤ n ≤ 30000`、`0 ≤ m ≤ 30000`；`m = 0` 时第三行可为空。
- 输出：最多能满足的孩子数。
- 参考实现：分别升序排序胃口和饼干，用两个指针扫描；当前饼干能满足当前最小胃口时同时前进，否则只跳过该饼干。
- 复杂度：时间 `O(n log n + m log m)`，额外空间由输入数组和排序实现决定。
- starter：完成输入并固定输出 `0`，可编译但不能满分。

### 13E05：无重叠区间

- 来源：[LeetCode 435](https://leetcode.cn/problems/non-overlapping-intervals/)，难度“中等”。
- 输入：第一行 `n`；随后 `n` 行各为 `start end`。`1 ≤ n ≤ 100000`，`-50000 ≤ start < end ≤ 50000`。
- 输出：使剩余区间互不重叠所需删除的最少数量；`[1,2]` 与 `[2,3]` 视为不重叠。
- 参考实现：按结束时间升序排序，结束时间相同时按开始时间升序；贪心保留当前最早结束且与已选区间不冲突的区间，答案为 `n - kept`。
- 复杂度：时间 `O(n log n)`，额外空间由输入数组和排序实现决定。
- starter：完成输入并固定输出 `0`，可编译但不能满分。

两题均使用 C++17、stdio judge、token compare、2000 ms 与 1024 KB 输出上限；README 明确本地 stdio 适配，不复制第三方题解或隐藏测试。

## 测试数据设计

每个 Lab 的 `cases.json` 恰有 20 项，每项 5 分。所有 `.in/.out` 均提交到仓库；生成脚本只使用固定数组或显式公式，不使用随机数、当前时间或网络。

### 13E01：盛最多水的容器

| 编号 | case id | 覆盖点 |
| --- | --- | --- |
| 001–007 | `sample`、`minimum`、`all-zero`、`equal-ends`、`increasing`、`local-peak`、`large-values` | 保留现有数据 |
| 008 | `decreasing` | 单调递减 |
| 009 | `best-interior` | 最优双边均不在端点 |
| 010 | `adjacent-tall` | 窄但极高的相邻边胜出 |
| 011 | `single-positive` | 只有一条正高度，答案为 0 |
| 012 | `alternating-peaks` | 重复峰值与跨距选择 |
| 013 | `equal-plateau` | 全部等高 |
| 014–015 | `leading-zeros`、`trailing-zeros` | 前后零高度不应截断扫描 |
| 016 | `wide-shorter-wins` | 更宽的较短边优于窄高边 |
| 017 | `equal-short-ties` | 两端等高时任移一侧均安全 |
| 018 | `mixed-regression` | 非单调混合回归 |
| 019 | `max-span` | `n=100000`，仅两端为 10000，答案 999990000 |
| 020 | `stress-pattern` | `n=100000`，`height[i]=(37i+17) mod 10001` |

### 13E02：最长回文串

| 编号 | case id | 覆盖点 |
| --- | --- | --- |
| 001–007 | `sample`、`single`、`all-even`、`multiple-odd`、`case-sensitive`、`repeated`、`count-boundary` | 保留现有数据 |
| 008–009 | `all-unique-lowercase`、`all-unique-both-cases` | 无可配对字符与大小写独立计数 |
| 010–011 | `single-char-even`、`single-char-odd` | 单一字符的偶数/奇数长度 |
| 012–013 | `two-odd-groups`、`many-odd-with-pairs` | 多个奇数频次只增加一个中心 |
| 014 | `balanced-case-pairs` | 大小写各自成对 |
| 015 | `one-even-rest-odd` | 偶数贡献与中心共存 |
| 016 | `alphabet-pairs` | 52 种大小写字符全部成对 |
| 017 | `mixed-regression` | `bananas` 频次回归 |
| 018 | `max-even` | 2000 个相同字符 |
| 019 | `max-two-odds` | 1999 个 `a` 加 1 个 `b` |
| 020 | `max-mixed-case` | 999 个 `a`、999 个 `A`、`bB` |

### 13E03：跳跃游戏

| 编号 | case id | 覆盖点 |
| --- | --- | --- |
| 001–007 | 两个样例、`single`、`zero-barrier`、`early-finish`、`exact-reach`、`long-reachable` | 保留现有数据 |
| 008 | `all-zero` | 起点立刻停滞 |
| 009–010 | `two-reachable`、`two-unreachable` | 两元素最小边界 |
| 011 | `overshoot` | 允许越过末尾 |
| 012 | `large-after-gap` | 不可达位置上的大数不能参与更新 |
| 013–014 | `skip-zero`、`late-skip` | 可跨过零位置 |
| 015 | `preserve-max-reach` | 最远可达位置不能被较小值覆盖 |
| 016–017 | `late-barrier`、`alternating-barrier` | 后段障碍与交替障碍 |
| 018 | `large-jump` | 最大步长数量级 |
| 019 | `stress-reachable` | `n=10000`，全部为 1 |
| 020 | `stress-unreachable` | `n=10000`，倒数第二项为 0 |

### 13E04：分发饼干

| 编号 | case id | 覆盖点 |
| --- | --- | --- |
| 001–002 | `sample-shortage`、`sample-surplus` | LeetCode 两个公开样例 |
| 003 | `no-cookies` | `m=0` |
| 004–005 | `single-exact`、`single-too-small` | 单孩子成功/失败 |
| 006 | `unsorted` | 输入不能假设有序 |
| 007 | `duplicate-demand` | 重复胃口和饼干 |
| 008–009 | `all-too-small`、`all-satisfied` | 全失败/全成功 |
| 010 | `skip-small-cookies` | 不合格饼干只前进饼干指针 |
| 011 | `one-large-cookie` | 稀缺大饼干只能匹配一人 |
| 012 | `match-small-first` | 最小可行饼干应留给最小胃口 |
| 013–014 | `int-max`、`mixed-extremes` | `INT_MAX` 边界与无溢出比较 |
| 015–017 | `fewer-cookies`、`extra-unusable`、`descending` | 数量不等、无效小饼干、逆序输入 |
| 018 | `mixed-regression` | 不连续匹配回归 |
| 019 | `stress-exact` | `n=m=30000`，全部精确匹配 |
| 020 | `stress-shortage` | `n=30000,m=29999`，短缺一块 |

### 13E05：无重叠区间

| 编号 | case id | 覆盖点 |
| --- | --- | --- |
| 001–003 | `sample-mixed`、`sample-duplicates`、`sample-touching` | LeetCode 三个公开样例 |
| 004 | `single` | 单区间 |
| 005 | `disjoint-unsorted` | 无重叠但输入无序 |
| 006 | `nested` | 全嵌套区间 |
| 007–008 | `same-start`、`same-end` | 端点并列 |
| 009 | `overlap-chain` | 链式交叠 |
| 010 | `negative-touching` | 负坐标与端点接触 |
| 011 | `unsorted-mixed` | 短区间优于覆盖它们的长区间 |
| 012 | `across-zero` | 跨零区间 |
| 013 | `coordinate-bounds` | `-50000` 与 `50000` 边界 |
| 014–015 | `long-vs-short`、`contained-touching` | 最早结束选择的反例保护 |
| 016 | `mixed-duplicates` | 重复区间与端点接触组合 |
| 017 | `all-overlap` | 10 个共同覆盖 0 的区间，只能保留 1 个 |
| 018 | `mixed-regression` | 负数、嵌套、接触和交叠混合 |
| 019 | `stress-identical` | 100000 个 `[-1,1]`，删除 99999 个 |
| 020 | `stress-two-groups` | 50000 个 `[0,1]` 与 50000 个 `[1,2]`，删除 99998 个 |

## 章节合同检查

`scripts/check-chapter-13-greedy-labs.mjs` 将执行以下只读断言：

1. `13E01` 至 `13E05` 各自存在且目录、README `labId`、标题和 manifest 类型一致。
2. 每题 `cases.json` 恰有 20 个唯一 id、每项 5 分、总分 100。
3. `tests/` 恰有与 manifest 一一对应的 20 个 `.in` 和 20 个 `.out`，内容非空。
4. 用独立 JavaScript oracle 重新计算五题所有期望输出；小规模数据优先使用直观枚举，压力数据使用线性/排序 oracle。
5. README 的首个样例与 `001` fixture 一致，现有 README 明示 20 组公开测试。
6. 两道新 README 保留 LeetCode 题号和官方链接，章节概览包含两个可解析的相对链接。

## TDD、兼容性与回滚

- RED：先加入合同检查脚本并在当前仓库运行，预期因 `13E01` 只有 7 组测试而失败。
- GREEN：生成 fixtures、新增两道 Lab、更新 README/概览后重跑合同检查，再逐个执行 5 次 `lab:verify`。
- starter 使用真实编译与评分验证“可编译但非满分”；solution 必须 100/100，不能只验证编译。
- 不修改 schema、Lab CLI、ContentIndex、共享组件或其他章节。生成脚本只写固定的第 13 章目标路径。
- 回滚可分为三块：撤销两个脚本；删除 `13E04/13E05` 并撤销概览链接；将现有三题 `tests/` 与 README 恢复到原版本。三块之间没有共享运行时状态。
