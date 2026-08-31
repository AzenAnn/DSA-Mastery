---
title: "Lab 04-25：科研团队组建"
description: "在树形依赖结构上做背包动态规划，求满足依赖约束的最大价值选择方案。"
order: 25
chapter: 4
labId: "04E17"
chapterTitle: "树与二叉树"
updated: "2026-08-25"
contributors: ["czjLUCK"]
status: "draft"
lab: true
difficulty: "挑战"
duration: "50～70 分钟"
---

# Lab 04-25：科研团队组建

某研究院有 $n$ 名研究员，形成一棵树形的汇报关系。现在要组建一支 $k$ 人的精英团队，规则是：**如果选了某位研究员，其直属上级也必须入选**（否则无法协调）。每名研究员有一个能力值，求团队能力值总和的最大值。

## 题目

### 科研团队组建

给定一棵有根树（根为 1 号节点），每个节点有一个能力值（可正可负）。需要恰好选择 $k$ 个节点，满足依赖规则：若选了某个节点，则其父节点也必须被选中。求最大能力值总和。

### 任务要求

1. 从标准输入读入树的结构、节点能力值和团队人数 $k$；
2. 使用**树形背包动态规划**求解；
3. 输出最大能力值总和。

## 输入格式

- 第一行：两个整数 $n$ 和 $k$（$1 \le k \le n \le 10^3$）；
- 接下来 $n-1$ 行，每行两个整数 $u\; v$，表示 $v$ 是 $u$ 的子节点（即 $u$ 是 $v$ 的上级）；
- 最后一行：$n$ 个整数，第 $i$ 个整数表示节点 $i$ 的能力值 $val_i$。

## 输出格式

- 输出一个整数，表示满足条件的 $k$ 人团队的最大能力值总和。
- 若无法组建（如 $k$ 小于最小必需人数），输出 `IMPOSSIBLE`。

## 数据范围与限制

| 项目 | 范围 |
| --- | --- |
| 节点数 $n$ | $1 \le n \le 10^3$ |
| 团队人数 $k$ | $1 \le k \le n$ |
| 能力值 $val_i$ | $-10^4 \le val_i \le 10^4$ |
| 时间复杂度要求 | $O(n \cdot k^2)$ 或更优 |
| 额外空间限制 | $O(n \cdot k)$ |

::: tip 关于根节点
树以节点 1 为根。根节点 1 若被选中，不需要满足额外的父节点约束。若根节点 1 的能力值为负，可以选择不包含它——但此时它的子节点都无法被选中。设计 DP 状态时需要考虑这一边界情况。
:::

## 样例

### 样例输入 1

```input
5 3
1 2
1 3
2 4
2 5
10 5 3 2 1
```

### 样例输出 1

```output
18
```

### 样例解释 1

树结构：

```
      1(10)
     /     \
   2(5)   3(3)
  /    \
4(2)  5(1)
```

选节点 $\{1, 2, 4\}$：总和 $= 10 + 5 + 2 = 17$。  
选节点 $\{1, 2, 5\}$：总和 $= 10 + 5 + 1 = 16$。  
选节点 $\{1, 3, 2\}$：总和 $= 10 + 3 + 5 = 18$。  
选节点 $\{1, 2, 3\}$：总和 $= 10 + 5 + 3 = 18$。

最大值为 18。

### 样例输入 2

```input
3 2
1 2
1 3
-5 3 4
```

### 样例输出 2

```output
2
```

### 样例解释 2

根节点 1 能力值为 $-5$。若选 1，则最多再选一个子节点，最大总和 $= -5 + 4 = -1$。  
若不选 1，则无法选任何节点（依赖约束）。  
但题目要求恰好选 $k=2$ 个节点，所以必须选 1 和其中一个子节点，最大为 $-5 + 4 = -1$？等等...

实际上应该选1和2：-5+3=-2，或1和3：-5+4=-1。最大值是-1。但样例输出是2...  

让我重新设计样例2。

### 样例输入 2（修正）

```input
3 2
1 2
1 3
5 -1 -2
```

### 样例输出 2（修正）

```output
4
```

### 样例解释 2（修正）

选节点 $\{1, 2\}$：总和 $= 5 + (-1) = 4$。  
选节点 $\{1, 3\}$：总和 $= 5 + (-2) = 3$。  
最大值为 4。

## 如何验证

先安装 Node.js、pnpm 和支持 C++17 的编译器。GNU Make 是首选入口，但不是强制依赖。

```powershell
# 已进入本 Lab 目录
make doctor
make run
make run CASE=001-sample
make interactive
make score
```

Windows 没有安装 Make 时，在仓库根目录使用完全相同的评分内核：

```powershell
pnpm lab:doctor -- labs/chapter-04/lab-04-25-research-team-formation
pnpm lab:run -- labs/chapter-04/lab-04-25-research-team-formation
pnpm lab:run -- labs/chapter-04/lab-04-25-research-team-formation --case 001-sample
pnpm lab:score -- labs/chapter-04/lab-04-25-research-team-formation
```

`make run` 在答案尚未全对时仍正常返回，避免 Make 把学习结果显示成工具故障；`make score` 是严格入口，只有 100 分才返回成功。标准输出参与判题，调试信息请写入标准错误。

## 题解

<details>
<summary>点击查看题解</summary>

### 思路

使用**树形背包**（Tree Knapsack）。定义状态：

$$dp[u][j] = \text{以 } u \text{ 为根的子树中恰好选 } j \text{ 个节点（且 } u \text{ 必选）的最大价值}$$

**初始化**：$dp[u][1] = val[u]$（只选 $u$ 自己）。

**转移**：逐个合并子树 $v$。设当前 $u$ 的子树已分配 $j$ 个节点，给子树 $v$ 分配 $t$ 个节点：
$$dp[u][j+t] = \max(dp[u][j+t],\; dp[u][j] + dp[v][t])$$

注意枚举顺序：$j$ 倒序，$t$ 正序，避免重复计算。

**最终答案**：由于根节点 1 必须选才能选其他节点，答案为 $dp[1][k]$。若 $dp[1][k]$ 不可达（保持为 $-\infty$），输出 `IMPOSSIBLE`。

### 算法步骤

1. 建树，以节点 1 为根；
2. 后序遍历（DFS），对每个节点 $u$：
   - 初始化 $dp[u][1] = val[u]$，其余为 $-\infty$；
   - 对每个子节点 $v$，先递归计算 $dp[v][*]$；
   - 将 $v$ 合并到 $u$：倒序枚举 $j$，正序枚举 $t$，更新 $dp[u][j+t]$；
3. 输出 $dp[1][k]$（若为 $-\infty$ 则输出 `IMPOSSIBLE`）。

### 复杂度分析

- **时间复杂度**：$O(n \cdot k^2)$。每对节点 $(u, v)$ 的合并需要 $O(k^2)$，共 $n-1$ 条边。
- **空间复杂度**：$O(n \cdot k)$，存储 DP 数组。

### 边界注意

- 能力值可能为负，初始化不能用 0，要用 $-\infty$；
- $k = 1$ 时只能选根节点；
- 若根节点价值为负且 $k > 1$，根仍然必须选（否则无法选其他节点）。

</details>
<details>
<summary>点击查看参考代码</summary>

```cpp
#include <bits/stdc++.h>
using namespace std;

const int INF = -1e9;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n, k;
    cin >> n >> k;

    vector<vector<int>> adj(n + 1);
    for (int i = 0; i < n - 1; ++i) {
        int u, v;
        cin >> u >> v;
        adj[u].push_back(v);
    }

    vector<int> val(n + 1);
    for (int i = 1; i <= n; ++i) cin >> val[i];

    vector<vector<int>> dp(n + 1, vector<int>(k + 1, INF));

    function<void(int)> dfs = [&](int u) {
        dp[u][1] = val[u];
        for (int v : adj[u]) {
            dfs(v);
            for (int j = k; j >= 1; --j) {
                if (dp[u][j] == INF) continue;
                for (int t = 1; t <= k - j; ++t) {
                    if (dp[v][t] == INF) continue;
                    dp[u][j + t] = max(dp[u][j + t], dp[u][j] + dp[v][t]);
                }
            }
        }
    };

    dfs(1);

    if (dp[1][k] == INF) {
        cout << "IMPOSSIBLE\n";
    } else {
        cout << dp[1][k] << '\n';
    }

    return 0;
}
```

</details>
