---
title: "14.2 从记忆化搜索到递推"
description: "把递归参数、缓存维度、状态依赖和循环顺序连成一条可逆的推导链。"
order: 2
chapter: 14
chapterTitle: "动态规划"
updated: "2026-08-31"
contributors: ["Azen"]
status: "draft"
---
# 14.2 从记忆化搜索到递推

很多初学者能写出递归，却在面对 `dp` 表时不知道第一层循环该从哪里开始；也有人背下递推，一旦题目没有明显的从左到右顺序就无从下手。

其实，记忆化搜索和递推是在给**同一张状态依赖图**求值：

- 记忆化搜索从目标状态出发，沿依赖边按需访问，返回时完成计算；
- 递推先选定一种拓扑顺序，从边界状态开始，主动填满需要的表。

本节的目标是让这条翻译可逆，而不是让你偏爱其中一种语法。

## 1. 四步翻译法

假设已经写出正确但缓慢的递归：

```text
answer = dfs(parameters)
```

可以按四步变成 DP：

1. **递归参数 → 状态坐标**：哪些参数会变化，就可能对应表的维度；只读输入通常不是维度。
2. **递归返回值 → 状态语义**：`dfs(...)` 承诺什么，`f[...]` 就承诺什么。
3. **递归出口 → 初始状态**：出口不是特殊补丁，而是最小子问题的真实答案。
4. **调用关系 → 计算顺序**：若 `dfs(x)` 调用 `dfs(y)`，递推中必须先得到 `f[y]` 再计算 `f[x]`。

::: definition 定义 · 记忆化搜索

<dfn>记忆化搜索</dfn>在递归求解状态时缓存其结果；再次访问同一状态时直接返回缓存，使每个可达状态至多真正计算一次。

:::

::: property 性质 · 状态 DAG 与拓扑序

当状态依赖图无环时，递归的返回顺序天然是一种逆拓扑求值；递推循环则显式选择一种拓扑序。若依赖存在未处理的环，两种写法都不会因“使用了 DP”而自动正确。

:::

## 完整案例 1 · 斐波那契/爬楼梯的四种形态

用 `ways(n)` 表示爬到第 `n` 级的方案数，递归关系为：

$$
ways(n)=ways(n-1)+ways(n-2),\quad ways(0)=ways(1)=1
$$

### 形态 A：暴力递归

调用树会反复计算 `ways(3)`、`ways(2)` 等状态。若只统计调用次数，增长量级与答案同阶，约为指数级。

### 形态 B：记忆化搜索

增加数组 `memo[n]`。第一次求状态时递归并缓存，之后直接返回。递归参数 `n` 对应一维缓存坐标。

### 形态 C：自底向上递推

观察到 `n` 只依赖更小的 `n-1,n-2`，于是从 0 到目标按升序填表。

### 形态 D：滚动变量

若只需要最终数值，不需要查询整张表，当前状态只依赖前两个值，可以覆盖更早状态。

```cpp:line-numbers [four-forms-of-dp.cpp]
#include <iostream>
#include <vector>

long long bruteForce(int n) {
    if (n <= 1) return 1;
    return bruteForce(n - 1) + bruteForce(n - 2);
}

long long memoizedDfs(int n, std::vector<long long>& memo) {
    if (n <= 1) return 1;
    if (memo[n] != -1) return memo[n];
    return memo[n] = memoizedDfs(n - 1, memo) + memoizedDfs(n - 2, memo);
}

long long tabulation(int n) {
    std::vector<long long> f(n + 1, 1);
    for (int i = 2; i <= n; ++i) {
        f[i] = f[i - 1] + f[i - 2];
    }
    return f[n];
}

long long rolling(int n) {
    if (n <= 1) return 1;
    long long older = 1, previous = 1;
    for (int i = 2; i <= n; ++i) {
        const long long current = older + previous;
        older = previous;
        previous = current;
    }
    return previous;
}

int main() {
    const int n = 10;
    std::vector<long long> memo(n + 1, -1);
    std::cout << bruteForce(n) << ' '
              << memoizedDfs(n, memo) << ' '
              << tabulation(n) << ' '
              << rolling(n) << '\n';
}
```

::: theorem 定理 · 四种形态的结果一致

四个函数使用完全相同的状态语义、边界和递推。区别只在状态求值是否重复、顺序由调用栈还是循环管理、以及旧状态是否保留。因此对所有非负 `n`，它们返回相同结果。

:::

::: complexity 复杂度 · 四种形态

暴力递归重复展开，时间约 $O(2^n)$，递归栈 $O(n)$。记忆化与表格都只有 `n+1` 个状态，每个状态常数转移，时间 $O(n)$；前者缓存和调用栈、后者表格均为 $O(n)$ 空间。滚动变量仍是 $O(n)$ 时间，但额外空间为 $O(1)$。

:::

::: pitfall 易错点 · 缓存值与“尚未计算”冲突

若合法答案可能是 `0`，不能用 `0` 同时表示“未计算”。可以使用题目值域之外的哨兵，或单独维护 `visited`。最小值可能为负时同理。

:::

## 完整案例 2 · 最小路径和：二维参数如何变成循环

### 1. 从目标状态反向问

给定非负网格，只能向右或向下，从左上走到右下，求路径和最小值。令：

> `dfs(r,c)` 表示从左上角到达 `(r,c)` 的最小路径和。

到达 `(r,c)` 的最后一步来自上方或左方：

$$
dfs(r,c)=grid[r][c]+\min(dfs(r-1,c),dfs(r,c-1))
$$

递归参数 `(r,c)` 直接对应二维表坐标。依赖边都从较小行/列指向当前格，因此行优先或列优先的正向遍历都可行，只要上方和左方已计算。

### 2. 状态设计卡

| 问题 | 答案 |
| --- | --- |
| 状态 | `f[r][c]`：从左上到 `(r,c)` 的最小路径和 |
| 转移 | 当前值 + 上方/左方中的较小值 |
| 边界 | `f[0][0]=grid[0][0]`；越界前驱为 `INF` |
| 顺序 | 行、列均从小到大 |
| 答案 | `f[rows-1][cols-1]` |

### 3. 一维压缩的读写图

把上一行和当前行放入同一个 `f[c]`：

- 更新前的 `f[c]` 是上方状态；
- 更新后的 `f[c-1]` 是左方状态。

所以列必须从左到右。若从右到左，`f[c-1]` 仍是上一行左上方，并不是当前行左方。

```cpp:line-numbers {14-21} [minimum-path-sum.cpp]
#include <algorithm>
#include <iostream>
#include <limits>
#include <vector>

long long minimumPathSum(const std::vector<std::vector<int>>& grid) {
    const long long INF = std::numeric_limits<long long>::max() / 4;
    const int rows = static_cast<int>(grid.size());
    const int cols = static_cast<int>(grid[0].size());
    std::vector<long long> f(cols, INF);

    for (int r = 0; r < rows; ++r) {
        for (int c = 0; c < cols; ++c) {
            if (r == 0 && c == 0) {
                f[c] = grid[r][c];
                continue;
            }
            const long long fromUp = f[c];
            const long long fromLeft = (c > 0 ? f[c - 1] : INF);
            f[c] = grid[r][c] + std::min(fromUp, fromLeft);
        }
    }
    return f.back();
}

int main() {
    std::vector<std::vector<int>> grid{{1, 3, 1}, {1, 5, 1}, {4, 2, 1}};
    std::cout << minimumPathSum(grid) << '\n';
}
```

### 4. 手算

对网格

```text
1 3 1
1 5 1
4 2 1
```

逐格最小和表为：

```text
1 4 5
2 7 6
6 8 7
```

答案为 7，对应路径 `1→3→1→1→1`。

::: proof

任意到达非起点格 `(r,c)` 的合法路径最后一步必来自上方或左方；两类路径由最后一条边区分且覆盖全部候选。若选定一个前驱，其前缀必须是到该前驱的最小路径，否则可替换得到更小总和。按左上到右下顺序归纳即可。

:::

::: complexity 复杂度 · 最小路径和

状态数为 `rows×cols`，每个状态比较两个前驱，时间 $O(rows\cdot cols)$。一维表空间 $O(cols)$；若列数远大于行数且允许转置思考，可沿较短维压缩。

:::

**迁移：** 允许向右下对角线移动时，多一个前驱；允许任意四方向移动时，依赖可能成环，此时不能直接按网格顺序填表，应重新判断是否是最短路问题。

## 完整案例 3 · 矩阵中的最长递增路径：拓扑顺序不直观时先记忆化

### 1. 为什么普通双循环不够

从任意格出发，可向四邻格移动，但下一个值必须严格更大，求最长路径长度。依赖方向由数值大小而非坐标决定：一个格可能依赖上、下、左、右，行优先遍历无法保证后继已算完。

严格递增提供了关键性质：沿依赖边数值一直变大，因此不可能回到原状态，状态图无环。

令 `dfs(r,c)` 表示从 `(r,c)` 出发的最长递增路径长度。第一步枚举四个更大的邻居：

$$
dfs(r,c)=1+\max dfs(nr,nc)
$$

若不存在更大的邻居，答案为 1。

### 2. 状态设计卡

| 问题 | 答案 |
| --- | --- |
| 状态 | 从 `(r,c)` 出发的最长严格递增路径长度 |
| 决策 | 走向哪个值更大的四邻格 |
| 边界 | 无合法后继时长度为 1 |
| 求值顺序 | DFS 自动先求后继；缓存避免重复 |
| 答案 | 所有起点状态的最大值 |

```cpp:line-numbers {16-31} [longest-increasing-path.cpp]
#include <algorithm>
#include <iostream>
#include <vector>

class IncreasingPathSolver {
public:
    int solve(const std::vector<std::vector<int>>& matrix) {
        a = &matrix;
        rows = static_cast<int>(matrix.size());
        cols = static_cast<int>(matrix[0].size());
        memo.assign(rows, std::vector<int>(cols, 0));
        int answer = 0;
        for (int r = 0; r < rows; ++r) {
            for (int c = 0; c < cols; ++c) answer = std::max(answer, dfs(r, c));
        }
        return answer;
    }

private:
    int dfs(int r, int c) {
        if (memo[r][c] != 0) return memo[r][c];
        int best = 1;
        static const int dr[4]{-1, 1, 0, 0};
        static const int dc[4]{0, 0, -1, 1};
        for (int k = 0; k < 4; ++k) {
            const int nr = r + dr[k], nc = c + dc[k];
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols
                && (*a)[nr][nc] > (*a)[r][c]) {
                best = std::max(best, 1 + dfs(nr, nc));
            }
        }
        return memo[r][c] = best;
    }

    const std::vector<std::vector<int>>* a{};
    int rows{}, cols{};
    std::vector<std::vector<int>> memo;
};

int main() {
    std::vector<std::vector<int>> matrix{{9, 9, 4}, {6, 6, 8}, {2, 1, 1}};
    IncreasingPathSolver solver;
    std::cout << solver.solve(matrix) << '\n';
}
```

### 3. 手算一条依赖链

在样例中可取 `1→2→6→9`，长度 4。多个起点都会访问值为 6 或 9 的格子，但缓存让每个坐标只展开一次。

::: proof

严格递增保证依赖图无环。对按数值从大到小排列的状态归纳：最大值格没有更大后继，长度为 1；对任意其它格，所有更大邻居的最优值已成立，选择其中最大者再加当前格，恰好得到从当前格出发的最长路径。对所有起点取最大覆盖任意合法路径。

:::

::: complexity 复杂度 · 最长递增路径

共有 `rows×cols` 个状态，每个状态最多检查 4 个邻居，记忆化后时间 $O(rows\cdot cols)$、缓存 $O(rows\cdot cols)$；最坏递归深度同状态数，极端大网格可改用按值排序或入度拓扑 BFS。

:::

::: pitfall 易错点 · 记忆化不是访问标记

本题的 `memo` 存储最终最长长度。因为严格递增保证无环，不需要用普通 DFS 的灰色标记断环。若移动条件改为“大于等于”，相等格可能形成环，原状态定义和递归都必须重审。

:::

## 完整案例 4 · 输出一条最小路径：值表之外还缺什么

最小路径和若只要求数值，`f[r][c]` 足够。但若题目要求输出路径坐标，还需要知道每个状态的最优值来自哪个前驱。

### 1. 前驱表

使用字符表 `parent[r][c]`：

- `'U'`：当前格从上方到达；
- `'L'`：当前格从左方到达；
- `'S'`：起点。

从终点沿前驱反向走到起点，再翻转路径。若上下前驱同样优，可以制定稳定规则，例如优先从上方，确保输出可复现。

### 2. 状态设计卡

| 层 | 保存内容 | 作用 |
| --- | --- | --- |
| 值状态 `f[r][c]` | 到达当前格的最小和 | 判断最优值 |
| 前驱 `parent[r][c]` | 一个达到最优值的前驱方向 | 还原一条具体方案 |
| 并列规则 | 相等时优先上方 | 使输出确定，不影响最优值 |

```cpp:line-numbers {25-44} [reconstruct-grid-path.cpp]
#include <algorithm>
#include <iostream>
#include <limits>
#include <utility>
#include <vector>

struct PathAnswer {
    long long cost;
    std::vector<std::pair<int, int>> cells;
};

PathAnswer minimumPath(const std::vector<std::vector<int>>& grid) {
    const long long INF = std::numeric_limits<long long>::max() / 4;
    const int rows = static_cast<int>(grid.size());
    const int cols = static_cast<int>(grid[0].size());
    std::vector<std::vector<long long>> f(rows, std::vector<long long>(cols, INF));
    std::vector<std::vector<char>> parent(rows, std::vector<char>(cols, '?'));
    f[0][0] = grid[0][0];
    parent[0][0] = 'S';

    for (int r = 0; r < rows; ++r) {
        for (int c = 0; c < cols; ++c) {
            if (r == 0 && c == 0) continue;
            const long long fromUp = r > 0 ? f[r - 1][c] : INF;
            const long long fromLeft = c > 0 ? f[r][c - 1] : INF;
            if (fromUp <= fromLeft) {
                f[r][c] = fromUp + grid[r][c];
                parent[r][c] = 'U';
            } else {
                f[r][c] = fromLeft + grid[r][c];
                parent[r][c] = 'L';
            }
        }
    }

    std::vector<std::pair<int, int>> path;
    int r = rows - 1, c = cols - 1;
    while (true) {
        path.push_back({r, c});
        if (parent[r][c] == 'S') break;
        if (parent[r][c] == 'U') --r;
        else --c;
    }
    std::reverse(path.begin(), path.end());
    return {f[rows - 1][cols - 1], path};
}

int main() {
    std::vector<std::vector<int>> grid{{1, 3, 1}, {1, 5, 1}, {4, 2, 1}};
    const PathAnswer answer = minimumPath(grid);
    std::cout << answer.cost << '\n';
    for (const auto& [r, c] : answer.cells) std::cout << '(' << r << ',' << c << ") ";
    std::cout << '\n';
}
```

::: theorem 定理 · 前驱还原的正确性

每个非起点状态记录一个确实产生 `f[r][c]` 的前驱，且前驱的行列之和严格减一。因此反向追踪必在有限步后到达起点；把这些边翻转后得到一条合法路径，其权值正是终点最优值。

:::

::: complexity 复杂度 · 值与路径

填表和追踪分别为 $O(rows\cdot cols)$ 与 $O(rows+cols)$ 时间。为了还原路径，保留完整值表和前驱表，空间 $O(rows\cdot cols)$。只压缩值表到一维通常无法直接恢复完整路径，这体现了空间优化与输出能力的取舍。

:::

**迁移：** 若要求输出所有最优路径，单个 `parent` 不够，需要保存所有最优前驱，或用值表进行受约束的二次搜索；路径数量可能指数级，输出复杂度必须单独计算。

## 2. 迁移案例：把 `dfs(i)` 机械翻译成 `f[i]`

打家劫舍的递归可写为：

```text
dfs(i) = 只考虑下标 0..i 的最大金额
dfs(i) = max(dfs(i-1), dfs(i-2) + money[i])
dfs(-1) = 0, dfs(-2) = 0
```

负下标适合递归出口，却不适合数组。把前缀长度整体右移一位：

```text
f[0] = 0
f[1] = money[0]
f[i] = max(f[i-1], f[i-2] + money[i-1])
```

也可以开 `n+2` 个状态，把 `dfs(i)` 映射到 `f[i+2]`，从而统一边界。数组多开的 1～2 个位置不是魔法，而是在把负坐标或空前缀映射到合法下标。

## 3. 迁移案例：滚动数组前先画依赖箭头

空间压缩的安全性取决于三个问题：

1. 当前状态需要读哪些旧状态？
2. 当前写入会覆盖哪个旧状态？
3. 后续转移是否还需要被覆盖的值？

| 模型 | 一维更新时读取 | 常见安全方向 |
| --- | --- | --- |
| 网格 `f[r][c]←up,left` | 旧 `f[c]`、新 `f[c-1]` | 列从左到右 |
| 0-1 背包 `f[c]←f[c-w]` | 本轮开始前的 `f[c-w]` | 容量从大到小 |
| 完全背包 `f[c]←f[c-w]` | 本轮已经更新的 `f[c-w]` | 容量从小到大 |
| 三角形自底向上 | 旧 `f[j]`、旧 `f[j+1]` | `j` 从小到大 |

::: counterexample 反例 · “一维数组一定更好”

若仍在调试状态语义、需要还原方案，或压缩后的同名元素同时代表“上一层”和“当前层”，二维表通常更清楚。先写正确的完整表并打印小样例，再压缩，是可靠的工程顺序。

:::

## 4. 失败边界：有缓存不等于会终止

考虑错误递归：

```text
dfs(x) -> dfs(y) -> dfs(x)
```

若缓存只在函数返回时写入，两个状态会在任何一个完成前无限互相调用。即使提前标记“正在访问”，你也只是发现了环，还没有定义环上的方程如何求解。

::: pitfall 易错点 · 先证明依赖可求值

DP 通常要求依赖图可按某种顺序求值：规模严格变小、数值严格递增、区间严格缩短，或显式 DAG 拓扑序。一般有环图上的最短路、概率方程或博弈状态可能需要 Dijkstra、Bellman-Ford、线性方程组或强连通分量等其它工具。

:::

## 5. 何时优先记忆化，何时优先递推

| 情况 | 更自然的起点 | 原因 |
| --- | --- | --- |
| 从目标很容易写递归，依赖坐标不规则 | 记忆化 | 按需访问，不必先发明循环顺序 |
| 大部分状态不可达 | 记忆化 | 只计算从目标能访问到的状态 |
| 状态表稠密、顺序规则 | 递推 | 无递归开销，缓存局部性更好 |
| 需要严格控制空间 | 递推 | 更容易分析覆盖时机 |
| 递归深度可能很大 | 递推/显式栈 | 避免调用栈溢出 |
| 需要方案还原 | 两者皆可 | 关键是保存前驱，不取决于求值语法 |

==先选择最容易证明正确的求值方式，再根据规模和输出要求优化。==

## 6. 本节复盘卡

- 递归的每个变化参数是否都真的需要成为状态维度？
- 缓存哨兵是否与合法答案冲突？
- 递归出口能否解释为最小子问题，而非临时补丁？
- 依赖图为什么无环？循环顺序是哪一种拓扑序？
- 一维覆盖后，被覆盖的旧值是否还会被后续状态读取？
- 只保存最优值是否足够满足输出，还是需要前驱、计数或全部方案？

下一节[线性与网格动态规划](./03-linear-and-grid-dp.md)会把依赖箭头练得更熟：同是数组与网格，不同状态定义会导出正向、反向、双状态与额外维度。

## 参考与训练入口

- [OI Wiki：记忆化搜索](https://oi-wiki.org/dp/memo/)与[动态规划基础](https://oi-wiki.org/dp/basic/)可用于复习状态 DAG、递归与递推的关系。
- [灵茶山艾府：动态规划题单](https://leetcode.cn/discuss/post/3581838/fen-xiang-gun-ti-dan-dong-tai-gui-hua-ru-007o/)中的入门与网格题适合练习“先写 DFS，再翻译递推”。
- 本文示例代码均为独立 C++17 实现；训练时建议为小规模输入写暴力版本，与 DP 随机对拍。
