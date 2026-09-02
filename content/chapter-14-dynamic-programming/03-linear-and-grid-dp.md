---
title: "14.3 线性与网格动态规划"
description: "用一维序列与二维网格练习最后一步、答案位置、遍历方向和空间压缩。"
order: 3
chapter: 14
chapterTitle: "动态规划"
updated: "2026-08-31"
contributors: ["Azen"]
status: "draft"
---
# 14.3 线性与网格动态规划

线性和网格题是动态规划最好的训练场：状态坐标肉眼可见，依赖箭头也容易画出来。但“长得像数组”并不意味着共享同一模板。有人把状态定义为前缀最优，有人要求以当前位置结尾；有些网格从左上向右下算，有些题必须从终点反推。

本节不按公式背题，而按三个问题组织：

1. **当前位置是否足以描述未来？**
2. **当前状态依赖哪几个方向？**
3. **状态承诺的是局部末态，还是完整前缀答案？**

## 1. 依赖几何决定循环，不是数组维度决定循环

| 依赖形状 | 常见状态 | 典型计算顺序 |
| --- | --- | --- |
| `i←i-1,i-2` | 前缀、结尾 | 下标递增 |
| `(r,c)←(r-1,c),(r,c-1)` | 从起点到当前格 | 左上到右下 |
| `(r,c)←(r+1,c),(r,c+1)` | 从当前格到终点 | 右下到左上 |
| `(r,c,s)←...` | 位置 + 有限历史 | 位置按依赖方向，状态维独立枚举 |

::: property 性质 · 压缩方向来自时间层

二维表压成一维时，同一个槽位会先后代表“上一层”和“当前层”。循环方向必须保证转移读取的是想要的时间层；只看数组下标大小无法判断安全性。

:::

## 完整案例 1 · 使用最小花费爬楼梯：入口和出口也属于状态设计

### 题意与暴力选择

`cost[i]` 是踩上第 `i` 级台阶需支付的花费。可以从台阶 0 或 1 出发，每次上 1 或 2 级；楼顶位于下标 `n`，到达楼顶不付费，求最小花费。

最后到达位置 `i` 时，只可能来自 `i-1` 或 `i-2`。把楼顶也视作一个位置，比在最后临时比较两个状态更统一。

### 状态设计卡

| 问题 | 答案 |
| --- | --- |
| 状态 | `f[i]`：到达位置 `i` 的最小总花费，`i=n` 表示楼顶 |
| 决策 | 最后一步来自 `i-1` 或 `i-2` |
| 转移 | `f[i]=min(f[i-1]+cost[i-1], f[i-2]+cost[i-2])` |
| 边界 | `f[0]=f[1]=0`，表示可免费从两处起步 |
| 顺序 | `i=2..n` |
| 答案 | `f[n]` |

对 `cost=[10,15,20]`：`f[2]=min(15,10)=10`，`f[3]=min(10+20,0+15)=15`。

```cpp:line-numbers {8-13} [min-cost-climbing-stairs.cpp]
#include <algorithm>
#include <iostream>
#include <vector>

long long minCostToTop(const std::vector<int>& cost) {
    long long twoBack = 0;
    long long oneBack = 0;
    for (int i = 2; i <= static_cast<int>(cost.size()); ++i) {
        const long long current = std::min(oneBack + cost[i - 1],
                                           twoBack + cost[i - 2]);
        twoBack = oneBack;
        oneBack = current;
    }
    return oneBack;
}

int main() {
    std::cout << minCostToTop({10, 15, 20}) << '\n';
}
```

::: proof

任何到达位置 `i` 的路径，最后一步恰来自两个前驱之一。去掉最后一步前的路径必须是到该前驱的最小花费，否则可以替换得到更优完整路径。两个入口的真实最小花费均为 0，按位置递增归纳可得 `f[n]`。

:::

::: complexity 复杂度 · 最小花费爬楼梯

共有 `n+1` 个位置状态，每个状态常数转移，时间 $O(n)$；滚动保存两个前驱，空间 $O(1)$。

:::

::: pitfall 易错点 · `cost[i]` 是踩入费用，不是离开费用

若状态定义改成“站在台阶 `i` 且已支付 `cost[i]`”，公式和边界都会变化。代码下标正确不代表语义正确；先明确费用在进入还是离开时发生。

:::

**迁移：** 若一次可跨最多 `k` 级，则 `f[i]` 枚举最近 `k` 个前驱，时间变为 $O(nk)$；再考虑用单调队列维护窗口最小值，是后续 DP 优化的入口。

## 完整案例 2 · 打家劫舍：选/不选与滚动状态

本题已在[状态设计](./01-dp-thinking-and-state-design.md)中证明前缀递推。这里换成两个明确末态，观察有限历史如何进入状态。

令：

- `skip`：处理到当前房屋且不选当前房屋的最大金额；
- `take`：处理到当前房屋且选择当前房屋的最大金额。

处理金额 `x` 时：

$$
newSkip=\max(skip,take),\qquad newTake=skip+x
$$

选择当前房屋时只能从旧 `skip` 转移；不选则两种旧末态都允许。

### 状态设计卡

| 问题 | 答案 |
| --- | --- |
| 状态 | 处理完前缀后，按最后一间选/不选分类的最大金额 |
| 转移 | `newSkip=max(skip,take)`，`newTake=skip+x` |
| 边界 | 空前缀 `skip=0`，`take=-INF` |
| 答案 | `max(skip,take)` |

```cpp:line-numbers {10-16} [house-robber-state-machine.cpp]
#include <algorithm>
#include <iostream>
#include <limits>
#include <vector>

long long rob(const std::vector<int>& money) {
    const long long NEG = std::numeric_limits<long long>::lowest() / 4;
    long long skip = 0;
    long long take = NEG;
    for (int value : money) {
        const long long newSkip = std::max(skip, take);
        const long long newTake = skip + value;
        skip = newSkip;
        take = newTake;
    }
    return std::max(skip, take);
}

int main() {
    std::cout << rob({2, 7, 9, 3, 1}) << '\n';
}
```

::: theorem 定理 · 两末态与前缀递推等价

每个合法选择集合按最后一间房是否被选分入唯一末态。`take` 只能来自旧 `skip`，恰好排除相邻选择；`skip` 接受两种旧末态。两者最大值就是此前缀的无条件最优值，因此与 `f[i]=max(f[i-1],f[i-2]+a[i-1])` 等价。

:::

::: complexity 复杂度 · 两末态打家劫舍

每间房更新两个常数状态，时间 $O(n)$、空间 $O(1)$。

:::

::: pitfall 易错点 · 同一轮覆盖旧 `skip`

必须先算 `newSkip` 和 `newTake`，再同时覆盖旧值。若先执行 `skip=max(skip,take)`，随后 `take=skip+x`，当前房屋可能从“已经选择上一间”的路径转来，破坏约束。

:::

**迁移：** 股票买卖会把“是否持股、已完成几次交易、是否冷却”等有限历史写成更多末态；方法仍是列出合法状态转移，而不是为每道题重新猜公式。

## 完整案例 3 · 最大子数组和：局部结尾与全局聚合

### 状态与反例

定义 `ending` 为必须以当前位置结尾的最大非空子数组和。处理 `x` 时，要么把 `x` 接到旧结尾，要么从 `x` 重新开始：

$$
ending=\max(x,ending+x)
$$

但最终答案是处理过程中所有 `ending` 的最大值。数组 `[5,-100,1]` 再次提醒我们：最后一个结尾状态为 1，全局答案为 5。

### 手算

对 `[-2,1,-3,4,-1,2,1,-5,4]`：

| 当前值 | 最佳结尾和 | 历史最大 |
| --- | --- | --- |
| `-2` | `-2` | `-2` |
| `1` | `1` | `1` |
| `-3` | `-2` | `1` |
| `4` | `4` | `4` |
| `-1,2,1` | `3,5,6` | `4,5,6` |
| `-5,4` | `1,5` | `6,6` |

```cpp:line-numbers {11-15} [kadane.cpp]
#include <algorithm>
#include <iostream>
#include <stdexcept>
#include <vector>

long long maximumSubarray(const std::vector<int>& a) {
    if (a.empty()) throw std::invalid_argument("non-empty array required");
    long long ending = a.front();
    long long answer = a.front();
    for (std::size_t i = 1; i < a.size(); ++i) {
        ending = std::max<long long>(a[i], ending + a[i]);
        answer = std::max(answer, ending);
    }
    return answer;
}

int main() {
    std::cout << maximumSubarray({-2, 1, -3, 4, -1, 2, 1, -5, 4}) << '\n';
}
```

::: proof

所有以当前位置结尾的非空连续段按是否包含前一位置分成两类：只含当前值，或由某个以前一位置结尾的连续段延长。后者取最优时必须使用旧 `ending`。每个非空连续段都有唯一右端点，因此对所有结尾状态取最大得到全局答案。

:::

::: complexity 复杂度 · Kadane

`n` 个结尾状态、常数转移，时间 $O(n)$；滚动状态和历史最大值占 $O(1)$ 空间。

:::

::: pitfall 易错点 · 空子数组是否允许

若题目明确允许空子数组，答案可至少为 0；若要求非空，初始化为 0 会错误处理全负数组。边界是题意的一部分，不是代码习惯。

:::

**迁移：** 最大乘积子数组不能只保留最大结尾积，因为负数乘负数可能让最小值翻成最大值。本节后面的迁移案例会保留一对极值。

## 完整案例 4 · 不同路径 II：障碍如何进入边界

### 题意与状态

机器人从左上走到右下，只能向右或向下；部分格子是障碍，求路径数。令 `f[c]` 表示处理到当前行时，到达当前格的路径数。

无障碍格接收上方旧 `f[c]` 与左方新 `f[c-1]`：

$$
f[c]\leftarrow f[c]+f[c-1]
$$

障碍格不可到达，应立即令 `f[c]=0`。这一步同时阻断从上方进入和向右继续传播。

### 状态设计卡

| 问题 | 答案 |
| --- | --- |
| 状态 | `f[c]`：到达当前行第 `c` 格的路径数 |
| 转移 | 非障碍时，上方路径数 + 左方路径数 |
| 边界 | 起点非障碍时 `f[0]=1`；障碍格归零 |
| 顺序 | 行从上到下，列从左到右 |
| 答案 | 最后一列的滚动状态 |

对网格

```text
0 0 0
0 1 0
0 0 0
```

路径数表为：

```text
1 1 1
1 0 1
1 1 2
```

```cpp:line-numbers {11-18} [unique-paths-with-obstacles.cpp]
#include <iostream>
#include <vector>

long long countPaths(const std::vector<std::vector<int>>& blocked) {
    const int rows = static_cast<int>(blocked.size());
    const int cols = static_cast<int>(blocked[0].size());
    std::vector<long long> f(cols, 0);
    f[0] = blocked[0][0] ? 0 : 1;

    for (int r = 0; r < rows; ++r) {
        for (int c = 0; c < cols; ++c) {
            if (blocked[r][c]) {
                f[c] = 0;
            } else if (c > 0) {
                f[c] += f[c - 1];
            }
        }
    }
    return f.back();
}

int main() {
    std::vector<std::vector<int>> grid{{0, 0, 0}, {0, 1, 0}, {0, 0, 0}};
    std::cout << countPaths(grid) << '\n';
}
```

::: proof

到达非障碍格的最后一步来自上方或左方，两类路径因最后一条边不同而互斥。障碍格没有合法路径，值为 0；起点的空前缀路径计为 1。左到右更新时两个前驱分别保存在旧 `f[c]` 与新 `f[c-1]` 中，归纳成立。

:::

::: complexity 复杂度 · 障碍路径计数

时间 $O(rows\cdot cols)$，一维滚动空间 $O(cols)$。若题目要求取模，每次相加后取模；若不取模，需根据规模评估 `long long` 是否溢出。

:::

::: pitfall 易错点 · 首行首列无需特殊循环

用 `f[0]=1` 配合障碍归零，可以统一处理首行和首列。一旦首列遇到障碍，`f[0]` 变成 0，后续行不会凭空恢复。

:::

**迁移：** 若路径还必须满足“总和模 `k` 为 0”，位置不再概括完整历史，需要增加余数维度，而不是修改一个障碍判断。

## 完整案例 5 · 最小路径和：同一依赖，不同状态值代数

障碍路径保存的是数量，用加法聚合；最小路径保存最优代价，用 `min` 聚合。状态坐标相同，不代表初值和不可达值相同。

### 状态设计卡

| 问题 | 答案 |
| --- | --- |
| 状态 | 到达当前格的最小路径和 |
| 转移 | 当前权值 + `min(上方,左方)` |
| 边界 | 起点为自身权值；不存在的前驱为 `INF` |
| 顺序 | 左上到右下；一维时列从左到右 |
| 答案 | 右下角状态 |

```cpp:line-numbers {14-22} [grid-minimum-path-sum.cpp]
#include <algorithm>
#include <iostream>
#include <limits>
#include <vector>

long long minPathSum(const std::vector<std::vector<int>>& grid) {
    const long long INF = std::numeric_limits<long long>::max() / 4;
    const int rows = static_cast<int>(grid.size());
    const int cols = static_cast<int>(grid[0].size());
    std::vector<long long> f(cols, INF);

    for (int r = 0; r < rows; ++r) {
        for (int c = 0; c < cols; ++c) {
            if (r == 0 && c == 0) {
                f[c] = grid[r][c];
            } else {
                const long long up = f[c];
                const long long left = c > 0 ? f[c - 1] : INF;
                f[c] = grid[r][c] + std::min(up, left);
            }
        }
    }
    return f.back();
}

int main() {
    std::vector<std::vector<int>> grid{{1, 3, 1}, {1, 5, 1}, {4, 2, 1}};
    std::cout << minPathSum(grid) << '\n';
}
```

::: proof

到达任意非起点格的路径按最后一步来自上或左分成两类。固定前驱时，使用其最小路径是必要的最优子结构；取两类较小值再加当前权值，既可构造又不会漏掉更优路径。

:::

::: complexity 复杂度 · 网格最小路径

时间 $O(rows\cdot cols)$，空间 $O(cols)$。若需要方案路径，则通常保留二维前驱表，空间回到 $O(rows\cdot cols)$。

:::

::: pitfall 易错点 · `INF + weight`

若格子权值可能很大，直接给 `LLONG_MAX` 加权会溢出。使用留有加法余量的哨兵，并在一般图或含负权扩展中先判断前驱是否可达。

:::

**迁移：** 把 `min` 换成 `max` 可以求最大路径和，但若允许任意四方向移动，依赖可能成环；那已经不是简单网格递推。

## 完整案例 6 · 三角形最小路径和：反向状态让答案落在一个点

### 两种定义的取舍

可以正向定义“到达 `(i,j)` 的最小和”，最终对底层取最小；也可以反向定义：

> `f[i][j]` 表示从 `(i,j)` 出发到底层的最小路径和。

反向定义的答案直接是 `f[0][0]`，边界是整个底层。压缩后，旧 `f[j]` 与 `f[j+1]` 都表示下一行状态。

$$
f[j]\leftarrow triangle[i][j]+\min(f[j],f[j+1])
$$

### 手算

对 `{2},{3,4},{6,5,7},{4,1,8,3}`：

```text
底层: 4 1 8 3
合并: 7 6 10
合并: 9 10
合并: 11
```

```cpp:line-numbers {8-12} [triangle-minimum-path.cpp]
#include <algorithm>
#include <iostream>
#include <vector>

long long triangleMinPath(const std::vector<std::vector<int>>& triangle) {
    std::vector<long long> f(triangle.back().begin(), triangle.back().end());
    for (int r = static_cast<int>(triangle.size()) - 2; r >= 0; --r) {
        for (int c = 0; c <= r; ++c) {
            f[c] = triangle[r][c] + std::min(f[c], f[c + 1]);
        }
    }
    return f[0];
}

int main() {
    std::vector<std::vector<int>> triangle{{2}, {3, 4}, {6, 5, 7}, {4, 1, 8, 3}};
    std::cout << triangleMinPath(triangle) << '\n';
}
```

::: proof

底层状态没有后继，其最小和就是自身权值。对任意上层格，第一步只能到下一行的两个相邻格；按归纳假设，两后继状态均已最优，取较小者并加当前权值即得到当前最优。最终顶点状态代表完整问题。

:::

::: complexity 复杂度 · 三角形最小路径

状态总数 $O(n^2)$，每个状态常数转移，时间 $O(n^2)$；保存底层长度的一维数组，空间 $O(n)$。

:::

::: pitfall 易错点 · 从左到右为何安全

更新 `f[c]` 后，下一次需要旧 `f[c+1]`，它尚未被覆盖；因此从左到右安全。从右到左会使后续读取的 `f[c]` 混入当前行。循环方向必须用旧/新层语义解释。

:::

**迁移：** 若每个位置还允许走到下一行距离不超过 `k` 的任意格，单状态转移变成窗口最小值，朴素 $O(n^2k)$；这为单调队列优化提供结构。

## 2. 迁移案例：同一坐标为什么还要增加状态

### 迁移案例 A · 下降路径最小和

从首行任意格开始，每步走到下一行的左下、正下或右下，终点可在末行任意格。

- 状态：`f[r][c]` 为到达 `(r,c)` 的最小和；
- 转移：当前值加上一行三个合法前驱的最小值；
- 边界：首行等于自身权值，越界前驱为 `INF`；
- 答案：末行所有状态的最小值；
- 复杂度：$O(rows\cdot cols)$ 时间，可用 $O(cols)$ 空间。

与普通最小路径和相比，改变的是前驱集合和答案聚合，不是“二维 DP 模板”。

### 迁移案例 B · 地下城游戏：正向最优值丢失未来约束

骑士的生命值必须始终至少为 1，格子可能加血或扣血。若正向只保存“到达当前格的最大剩余生命”，它不足以比较路径：一条路径当前生命更高，却可能曾经需要更高的初始生命才能活下来。

反向定义更自然：

> `need[r][c]` 表示进入 `(r,c)` 时，为保证能活到终点所需的最少生命。

$$
need[r][c]=\max(1,\min(need[r+1][c],need[r][c+1])-dungeon[r][c])
$$

终点边界为 `max(1,1-dungeon[last])`，计算从右下到左上。这个案例展示：当正向状态无法概括“全过程不得越界”的约束时，可以从终点倒推需求。

### 迁移案例 C · 路径和模 `k`：位置之外增加余数

若问到右下角且路径和能被 `k` 整除的路径数，只保存 `(r,c)` 会把不同余数的历史错误合并。增加：

> `f[r][c][rem]`：到达 `(r,c)` 且路径和模 `k` 为 `rem` 的路径数。

从前驱余数 `old` 加当前值 `v` 后进入 `(old+v)%k`。状态数增为 $O(rows\cdot cols\cdot k)$，每个状态仍常数转移。

::: property 性质 · 附加维度的判断标准

不是看到“模 `k`”就机械加维，而是因为余数不同会影响未来能否最终得到 0；它是恢复无后效性所需的有限历史摘要。

:::

### 迁移案例 D · 最大非负积：同时保留最大与最小

网格含负数，求最大非负路径积。若只保留到达当前格的最大积，乘一个负数后，原来的最小负数可能变成最大正数。

所以每格保存一对状态：

- `hi[r][c]`：到达当前格的最大积；
- `lo[r][c]`：到达当前格的最小积。

枚举上、左前驱的 `hi/lo` 与当前值相乘，再取新最大和新最小。状态数仍是格子数，但每个状态的摘要从一个极值扩为两个极值。

::: counterexample 反例 · 单一最大值失效

路径前缀积为 `-100` 与 `-2` 时，若下一格是 `-10`，较小的 `-100` 会产生更大的 `1000`。在存在符号翻转的乘法中，“当前较差”不代表“未来永远较差”。

:::

### 训练入口 · 摘樱桃 II

两个机器人从首行不同列同步向下，每步列变化为 `-1,0,1`，同格只计一次。可定义 `f[row][c1][c2]`，因为同一行两台机器人的列位置足以决定未来；每个状态枚举 9 组下一步。

这是把“一个位置”扩展为“两个同步位置”的典型多维 DP。先写记忆化搜索，确认同格计分和越界，再翻成滚动二维表；不要直接复制三维模板。

## 3. 模型对照：看起来相似，合同不同

| 题型 | 状态值 | 不可达/边界 | 答案位置 |
| --- | --- | --- | --- |
| 障碍路径 | 方案数 | 障碍为 0，起点为 1 | 右下角 |
| 最小路径和 | 最小代价 | 越界 `INF`，起点自身权值 | 右下角 |
| 三角形反向 | 从当前到底层的最小代价 | 底层自身权值 | 顶点 |
| 最大子数组 | 以当前位置结尾的最大和 | 首元素，非空 | 所有结尾取最大 |
| 打家劫舍末态 | 选/不选当前的最大金额 | 空前缀 `skip=0,take=-INF` | 两末态取最大 |
| 模 `k` 路径 | 各余数方案数 | 起点对应余数为 1 | 右下角余数 0 |

## 4. 本节复盘与自测

对任何线性或网格题，画出一个 3～4 个元素的小实例，然后回答：

- 状态是“到达当前”“从当前出发”“前缀最优”还是“以当前结尾”？
- 最后一步/第一步的候选是否互斥并覆盖全部方案？
- 越界前驱应当是 0、`INF`、`-INF`，还是根本不参与？
- 一维数组中，更新前后的同一个槽位分别代表哪一层？
- 终点是单个状态，还是一行、一列或所有末态的聚合？
- 如果加上障碍、余数、符号、生命下界或第二个机器人，当前位置还足够吗？

::: tip 对拍建议

网格不超过 `4×4` 时，用 DFS 枚举所有合法路径，随机生成小权值和障碍，与 DP 比较。空间压缩前后也应互相对拍。最有效的测试不是再跑一个大样例，而是让独立实现对同一批小状态达成一致。

:::

下一节[背包动态规划](./04-knapsack-dp.md)会把“时间层覆盖”推到最容易出错的地方：同一个一维转移，仅仅改变容量循环方向，就会在“每件只能一次”和“每件无限次”之间切换。

## 参考与训练入口

- [灵茶山艾府：动态规划题单](https://leetcode.cn/discuss/post/3581838/fen-xiang-gun-ti-dan-dong-tai-gui-hua-ru-007o/)中的网格图 DP 与入门 DP 提供由单状态到多状态的练习梯度。
- [OI Wiki：动态规划基础](https://oi-wiki.org/dp/basic/)可用于复习阶段、状态、决策与无后效性。
- 本文只压缩改写题意并独立实现代码；训练时请回到题目原页核对完整输入范围与溢出约束。
