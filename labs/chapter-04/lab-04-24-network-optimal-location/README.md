---
title: "Lab 04-24：网络最优选址"
description: "利用换根动态规划，高效计算以每个节点为根时的全树距离和。"
order: 24
chapter: 4
chapterTitle: "树与二叉树"
updated: "2026-08-25"
contributors: ["czjLUCK"]
status: "draft"
lab: true
difficulty: "挑战"
duration: "45～60 分钟"
---

# Lab 04-24：网络最优选址

某物流公司的配送网络是一棵 $n$ 个节点的树，每条边有单位距离运输成本。需要为每个候选配送中心计算：若以该节点为中心，到所有仓库的总运输成本是多少？

## 题目

### 网络最优选址

给定一棵带权树，计算以**每个节点**为配送中心时的总运输成本。

### 任务要求

1. 从标准输入读入树的节点数和边权信息；
2. 使用**换根动态规划**在 $O(n)$ 时间内计算出所有答案；
3. 输出每个节点作为中心时的总运输成本。

## 输入格式

- 第一行：一个整数 $n$（$1 \le n \le 10^5$），表示节点数；
- 接下来 $n-1$ 行，每行三个整数 $u\; v\; w$，表示节点 $u$ 和 $v$ 之间有一条权值为 $w$ 的边。

## 输出格式

- 输出 $n$ 行，第 $i$ 行（$1 \le i \le n$）输出以节点 $i$ 为中心时的总运输成本；
- 每个答案使用**64 位整数**输出。

## 数据范围与限制

| 项目 | 范围 |
| --- | --- |
| 节点数 $n$ | $1 \le n \le 10^5$ |
| 边权 $w$ | $1 \le w \le 10^4$ |
| 时间复杂度要求 | $O(n)$ |
| 额外空间限制 | $O(n)$ |

::: tip 关于答案范围
总运输成本最大可达 $n \times (n-1) \times w_{\max} \approx 10^{14}$，超出 32 位整数范围，请使用 `long long`。
:::

## 样例

### 样例输入 1

```input
3
1 2 1
2 3 2
```

### 样例输出 1

```output
4
3
5
```

### 样例解释 1

树为链 $1-2-3$，边 $(1,2)$ 权值为 1，边 $(2,3)$ 权值为 2：

| 中心 | 到节点 1 | 到节点 2 | 到节点 3 | 总和 |
| --- | --- | --- | --- | --- |
| 1 | 0 | 1 | 1+2=3 | 4 |
| 2 | 1 | 0 | 2 | 3 |
| 3 | 2+1=3 | 2 | 0 | 5 |

### 样例输入 2

```input
1
```

### 样例输出 2

```output
0
```

### 样例解释 2

只有一个节点，到自己距离为 0。

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
pnpm lab:doctor -- labs/chapter-04/lab-04-24-network-optimal-location
pnpm lab:run -- labs/chapter-04/lab-04-24-network-optimal-location
pnpm lab:run -- labs/chapter-04/lab-04-24-network-optimal-location --case 001-sample
pnpm lab:score -- labs/chapter-04/lab-04-24-network-optimal-location
```

`make run` 在答案尚未全对时仍正常返回，避免 Make 把学习结果显示成工具故障；`make score` 是严格入口，只有 100 分才返回成功。标准输出参与判题，调试信息请写入标准错误。

## 题解

<details>
<summary>点击查看题解</summary>

### 思路

使用**换根动态规划**（Re-rooting DP / 二次扫描法）。

核心观察：设以节点 $u$ 为根时的总距离和为 $dp[u]$。当根从 $u$ 移动到其邻居 $v$（边权为 $w$）时：
- 子树 $v$ 中的 $size[v]$ 个节点，到根的距离都减少了 $w$；
- 子树 $v$ 外的 $n - size[v]$ 个节点，到根的距离都增加了 $w$。

因此递推公式为：
$$dp[v] = dp[u] + (n - 2 \times size[v]) \times w$$

### 算法步骤

1. **第一次 DFS**：以节点 1 为根，计算每个节点的子树大小 $size[u]$ 和以 1 为根时的总距离和 $dp[1]$；
2. **第二次 DFS**：从根出发遍历整棵树，利用换根公式计算所有 $dp[v]$；
3. 输出 $dp[1], dp[2], \dots, dp[n]$。

### 复杂度分析

- **时间复杂度**：$O(n)$，两次 DFS 各遍历一次树。
- **空间复杂度**：$O(n)$，存储邻接表、子树大小和 DP 数组。

### 边界注意

- $n = 1$：只有一个节点，答案为 0；
- 使用 `long long` 避免溢出；
- 换根公式中 $size[v]$ 是 $v$ 作为 1 的子树时的大小，不要搞混方向。

</details>
<details>
<summary>点击查看参考代码</summary>

```cpp
#include <bits/stdc++.h>
using namespace std;

using ll = long long;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    cin >> n;

    vector<vector<pair<int, int>>> adj(n + 1);
    for (int i = 0; i < n - 1; ++i) {
        int u, v, w;
        cin >> u >> v >> w;
        adj[u].push_back({v, w});
        adj[v].push_back({u, w});
    }

    vector<ll> dp(n + 1, 0);
    vector<int> sz(n + 1, 0);

    // 第一次 DFS：计算子树大小和 dp[1]
    function<void(int, int)> dfs1 = [&](int u, int p) {
        sz[u] = 1;
        for (auto [v, w] : adj[u]) {
            if (v == p) continue;
            dfs1(v, u);
            sz[u] += sz[v];
            dp[1] += (ll)w * sz[v];
        }
    };

    if (n > 1) dfs1(1, 0);

    // 第二次 DFS：换根 DP
    function<void(int, int)> dfs2 = [&](int u, int p) {
        for (auto [v, w] : adj[u]) {
            if (v == p) continue;
            dp[v] = dp[u] + (ll)(n - 2 * sz[v]) * w;
            dfs2(v, u);
        }
    };

    if (n > 1) dfs2(1, 0);

    for (int i = 1; i <= n; ++i) {
        cout << dp[i] << '\n';
    }

    return 0;
}
```

</details>
