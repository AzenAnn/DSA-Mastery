# Ch.14 DP Lab 官方来源与课程化映射

核验日期：2026-09-01。官方页面只用于确认题目身份、核心合同、约束和样例；最终 README、C++ 和测试均独立编写。

## 14.1 状态设计

| Lab | 课程标题 / slug | 官方来源 | 已核验约束摘要 | 教学模型与适配 |
| --- | --- | --- | --- | --- |
| `14E01` | 爬楼梯 / `climbing-stairs` | [LeetCode 70](https://leetcode.cn/problems/climbing-stairs/) | `1≤n≤45` | 线性计数；输入 `n`，输出方案数 |
| `14E02` | 最小花费爬楼梯 / `min-cost-climbing-stairs` | [LeetCode 746](https://leetcode.cn/problems/min-cost-climbing-stairs/) | `2≤n≤1000`，费用 `0..999` | 线性最小值；输入 `n` 与费用数组 |
| `14E03` | 数字三角形 / `number-triangle` | [洛谷 P1216](https://www.luogu.com.cn/problem/P1216) | 行数 `≤1000`，权值 `0..100` | 三角形路径最大值；保留三角形输入 |
| `14E04` | 最大子段和 / `maximum-subarray` | [洛谷 P1115](https://www.luogu.com.cn/problem/P1115) | `n≤2×10^5`，`|a_i|≤10^4` | 以 `i` 结尾的最大和；必须覆盖全负数 |
| `14E05` | 打家劫舍 / `house-robber` | [LeetCode 198](https://leetcode.cn/problems/house-robber/) | `n≤100`，金额 `0..400` | 相邻互斥最大值；输入 `n` 与金额数组 |

## 14.2 记忆化搜索

| Lab | 课程标题 / slug | 官方来源 | 已核验约束摘要 | 教学模型与适配 |
| --- | --- | --- | --- | --- |
| `14E06` | 滑雪 / `skiing` | [洛谷 P1434](https://www.luogu.com.cn/problem/P1434) | `R,C≤100`，高度 `0..10000` | 下降边构成 DAG；记忆化 DFS |
| `14E07` | 挖地雷 / `mine-digging` | [洛谷 P2196](https://www.luogu.com.cn/problem/P2196) | `N≤20`，单点地雷 `≤300` | DAG 最大权路径与还原；并列取字典序最小路径 |
| `14E08` | 矩阵中的最长递增路径 / `longest-increasing-path` | [LeetCode 329](https://leetcode.cn/problems/longest-increasing-path-in-a-matrix/) | `m,n≤200`，值 `0..2^31-1` | 四邻接递增 DAG；输入尺寸与矩阵 |

## 14.3 线性 / 网格

| Lab | 课程标题 / slug | 官方来源 | 已核验约束摘要 | 教学模型与适配 |
| --- | --- | --- | --- | --- |
| `14E09` | 最长上升子序列 / `longest-increasing-subsequence` | [洛谷 B3637](https://www.luogu.com.cn/problem/B3637) | `n≤5000`，正整数 `≤10^6` | 严格上升 LIS；主练 `O(n²)` 状态转移 |
| `14E10` | 合唱队形 / `choir-formation` | [洛谷 P1091](https://www.luogu.com.cn/problem/P1091) | `n≤100`，身高 `130..230` | 左 LIS + 右 LIS，最少移除 |
| `14E11` | 尼克的任务 / `nick-tasks` | [洛谷 P1280](https://www.luogu.com.cn/problem/P1280) | 时间与任务数均 `≤10^4` | 从末尾向前 DP；有任务时不能休息 |
| `14E12` | 不同路径 / `unique-paths` | [LeetCode 62](https://leetcode.cn/problems/unique-paths/) | `m,n≤100`，答案 `≤2×10^9` | 右/下网格计数；输入 `m n` |
| `14E13` | 过河卒 / `river-crossing-pawn` | [洛谷 P1002](https://www.luogu.com.cn/problem/P1002) | 终点与马坐标 `0..20` | 棋盘计数 + 马控制点；保留坐标输入 |
| `14E14` | 不同路径 II / `unique-paths-with-obstacles` | [LeetCode 63](https://leetcode.cn/problems/unique-paths-ii/) | `m,n≤100`，格值 0/1，答案 `≤2×10^9` | 障碍清零；输入尺寸与网格 |
| `14E15` | 最小路径和 / `minimum-path-sum` | [LeetCode 64](https://leetcode.cn/problems/minimum-path-sum/) | `m,n≤200`，权值 `0..200` | 网格最小值；输入尺寸与网格 |
| `14E16` | 传纸条 / `message-passing` | [洛谷 P1006](https://www.luogu.com.cn/problem/P1006) | `m,n≤50` | 两人同步步数的三维 DP；避免重复计点 |
| `14E17` | 编辑距离 / `edit-distance` | [洛谷 P2758](https://www.luogu.com.cn/problem/P2758) | 两字符串长度 `≤2000` | 双前缀插入/删除/替换最小值 |

## 14.4 背包

| Lab | 课程标题 / slug | 官方来源 | 已核验约束摘要 | 教学模型与适配 |
| --- | --- | --- | --- | --- |
| `14E18` | 采药 / `herb-gathering` | [洛谷 P1048](https://www.luogu.com.cn/problem/P1048) | 时间 `≤1000`，物品 `≤100` | 0-1 背包最大价值 |
| `14E19` | 装箱问题 / `box-packing` | [洛谷 P1049](https://www.luogu.com.cn/problem/P1049) | 容量 `≤20000`，物品 `≤30` | 0-1 背包最大已用容量，输出剩余 |
| `14E20` | 疯狂的采药 / `unbounded-herb-gathering` | [洛谷 P1616](https://www.luogu.com.cn/problem/P1616) | `m×t≤10^7` | 完全背包最大价值，容量正序 |
| `14E21` | 小 A 点菜 / `exact-menu-count` | [洛谷 P1164](https://www.luogu.com.cn/problem/P1164) | `N≤100`，金额 `≤10000` | 0-1 恰好装满方案数；同价菜按下标区分 |
| `14E22` | 分割等和子集 / `partition-equal-subset-sum` | [LeetCode 416](https://leetcode.cn/problems/partition-equal-subset-sum/) | `n≤200`，正整数 `≤100` | 0-1 可行性；输出 `YES/NO` |
| `14E23` | 零钱兑换 / `coin-change` | [LeetCode 322](https://leetcode.cn/problems/coin-change/) | 面额数 `≤12`，金额 `≤10^4` | 完全背包最少件数；不可达输出 `-1` |
| `14E24` | 零钱兑换 II / `coin-change-combinations` | [LeetCode 518](https://leetcode.cn/problems/coin-change-ii/) | 面额数 `≤300`，金额 `≤5000` | 完全背包无序组合计数 |
| `14E25` | 组合总和 IV / `ordered-combination-count` | [LeetCode 377](https://leetcode.cn/problems/combination-sum-iv/) | 候选数 `≤200`，目标 `≤1000` | 以总和为外层的有序序列计数 |
| `14E26` | 宝物筛选 / `bounded-treasure-selection` | [洛谷 P1776](https://www.luogu.com.cn/problem/P1776) | 种类 `≤100`，容量 `≤4×10^4`，总件数 `≤10^5` | 多重背包二进制拆分 |

## 拓展

| Lab | 课程标题 / slug | 官方来源 | 已核验约束摘要 | 教学模型与适配 |
| --- | --- | --- | --- | --- |
| `14E27` | 通天之分组背包 / `group-knapsack` | [洛谷 P1757](https://www.luogu.com.cn/problem/P1757) | 容量 `≤1000`，物品 `≤1000`，组数 `≤100` | 每组至多一件；候选读取旧层 |
| `14E28` | 樱花 / `cherry-blossom-mixed-knapsack` | [洛谷 P1833](https://www.luogu.com.cn/problem/P1833) | 可用时间 `≤1000`，树数 `≤10000` | 0-1/多重/完全混合背包，解析 `hh:mm` |
| `14E29` | 金明的预算方案 / `budget-with-dependencies` | [洛谷 P1064](https://www.luogu.com.cn/problem/P1064) | 预算 `≤32000`，物品 `≤60` | 主件与最多两个附件的依赖分组背包 |
| `14E30` | Buying Hay / `buying-hay` | [洛谷 P2918](https://www.luogu.com.cn/problem/P2918) | 公司 `≤100`，目标 `≤50000`，包重/费用 `≤5000` | 完全背包最小费用，状态覆盖到“至少目标” |

## 统一 LeetCode 标准输入输出

- `14E01`：一行 `n`；输出方案数。
- `14E02`、`14E05`、`14E22`：第一行 `n`，第二行数组；分别输出最小值、最大值、`YES/NO`。
- `14E08`、`14E14`、`14E15`：第一行 `m n`，后续矩阵；输出单个答案。
- `14E12`：一行 `m n`；输出路径数。
- `14E23`～`14E25`：第一行 `n amount/target`，第二行候选数组；输出最少数、组合数或排列数。

## 来源访问结论

- 11 个 LeetCode 页面可从官方题目页与官方 GraphQL 题目数据读取题名、难度、样例和约束。
- 19 个洛谷页面可从官方 `lentille-context` 题目数据读取题名、输入输出、样例、约束与时空限制。
- 本任务不需要访问题解区；reference 解法由课程教材中的 DP 模型独立推导和实现。
