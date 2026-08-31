---
title: "Lab 04-26：通信基站选址"
description: "利用树的直径性质，求允许中心落在边上时的最小覆盖半径与绝对中心位置。"
order: 26
chapter: 4
chapterTitle: "树与二叉树"
updated: "2026-08-25"
contributors: ["czjLUCK"]
status: "draft"
lab: true
difficulty: "挑战"
duration: "45～60 分钟"
---

# Lab 04-26：通信基站选址

某区域通信网络是一棵 $n$ 个节点的树，边权为信号传输延迟。现要选址建一个基站，**基站可以建在节点上，也可以建在链路的任意位置**。要求基站到最远节点的传输延迟尽可能小。

## 题目

### 通信基站选址

给定一棵带权树，求最小覆盖半径（使得到所有节点的最大距离最小），以及所有达到该半径的候选位置。由于基站可以建在边上，最优中心可能落在某条边的内部。

### 任务要求

1. 从标准输入读入树的节点数和边权信息；
2. 使用**树的直径性质**在 $O(n)$ 时间内求出绝对中心；
3. 输出最小半径和中心位置。

## 输入格式

- 第一行：一个整数 $n$（$1 \le n \le 10^5$），表示节点数；
- 接下来 $n-1$ 行，每行三个整数 $u\; v\; w$，表示节点 $u$ 和 $v$ 之间有一条权值为 $w$ 的边。

## 输出格式

- 第一行：最小覆盖半径（保留 2 位小数）；
- 第二行：中心位置描述
  - 若中心落在**节点** $x$ 上，输出 `NODE x`；
  - 若中心落在**边 $(u,v)$ 内部**，距 $u$ 为 $d$，输出 `EDGE u v d`。

**输出顺序规范**：若中心在边上，保证 $u < v$；$d$ 保留 2 位小数。

## 数据范围与限制

| 项目 | 范围 |
| --- | --- |
| 节点数 $n$ | $1 \le n \le 10^5$ |
| 边权 $w$ | $1 \le w \le 10^4$ |
| 时间复杂度要求 | $O(n)$ |
| 额外空间限制 | $O(n)$ |

::: tip 关于绝对中心
对于任意一棵树，其**绝对中心**（允许在边上的点）恰好是**直径的中点**。从直径端点 $A$ 出发沿唯一路径走 $D/2$ 距离（$D$ 为直径长度）即可到达。
:::

## 样例

### 样例输入 1

```input
4
1 2 1
2 3 1
3 4 1
```

### 样例输出 1

```output
1.50
EDGE 2 3 0.50
```

### 样例解释 1

树为链 $1-2-3-4$，直径为 $1 \rightsquigarrow 4$，长度 $D = 3$。  
直径中点距节点 2 为 $0.5$（在边 $(2,3)$ 上），到四个节点的最远距离均为 $1.5$。

| 位置 | 到 1 | 到 2 | 到 3 | 到 4 | 最大距离 |
| --- | --- | --- | --- | --- | --- |
| 节点 2 | 1 | 0 | 1 | 2 | 2 |
| 节点 3 | 2 | 1 | 0 | 1 | 2 |
| 边 $(2,3)$ 中点 | 1.5 | 0.5 | 0.5 | 1.5 | **1.5** |

### 样例输入 2

```input
3
1 2 2
2 3 2
```

### 样例输出 2

```output
2.00
NODE 2
```

### 样例解释 2

树为链 $1-2-3$，直径为 $1 \rightsquigarrow 3$，长度 $D = 4$。直径中点恰好是节点 2。

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
pnpm lab:doctor -- labs/chapter-04/lab-04-26-communication-base-station
pnpm lab:run -- labs/chapter-04/lab-04-26-communication-base-station
pnpm lab:run -- labs/chapter-04/lab-04-26-communication-base-station --case 001-sample
pnpm lab:score -- labs/chapter-04/lab-04-26-communication-base-station
```

`make run` 在答案尚未全对时仍正常返回，避免 Make 把学习结果显示成工具故障；`make score` 是严格入口，只有 100 分才返回成功。标准输出参与判题，调试信息请写入标准错误。

## 题解

<details>
<summary>点击查看题解</summary>

### 思路

利用**树的直径性质**求绝对中心。

**关键定理**：对于任意树，其绝对中心（允许边上的点）恰好是直径的中点。

> **证明简述**：设直径为 $A \rightsquigarrow B$，长度 $D$。对直径上任意点 $q$，若 $dist(A,q)=d$，则 $dist(q,B)=D-d$，离心率 $ecc(q)=\max(d, D-d)$，在 $d=D/2$ 时取最小值 $D/2$。对任意不在直径上的点 $p$，设其到直径的垂足为 $q$，则 $ecc(p)=dist(p,q)+ecc(q) > D/2$。

### 算法步骤

1. **找直径端点 $A$**：任选一个起点 $s$，DFS/BFS 找最远点 $A$；
2. **找直径端点 $B$ 并记录路径**：从 $A$ 出发 DFS/BFS，记录距离数组 $distA[]$ 和父节点数组，找到最远点 $B$，得直径长度 $D = distA[B]$；
3. **定位中心**：从 $A$ 出发沿父节点数组回溯到 $B$，累加边权，找到累计距离首次 $\ge D/2$ 的边 $(u,v)$：
   - 若恰好等于 $D/2$，中心为节点 $v$，输出 `NODE v`；
   - 否则中心在边 $(u,v)$ 内部，距 $u$ 为 $d = D/2 - sum$，输出 `EDGE u v d`（保证 $u < v$）。

### 复杂度分析

- **时间复杂度**：$O(n)$，两次 DFS/BFS 加一次路径回溯。
- **空间复杂度**：$O(n)$，存储邻接表、距离数组和父节点数组。

### 边界注意

- $n = 1$：直径长度为 0，中心就是节点 1，半径为 0；
- 精度处理：直径长度 $D$ 和 $D/2$ 可能为小数（如 $D=3$ 时 $D/2=1.5$），建议使用 `double` 或分数运算；
- 边输出顺序：务必保证 $u < v$，若算法得到的是 $(v,u)$ 需要交换。

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

    if (n == 1) {
        cout << "0.00\nNODE 1\n";
        return 0;
    }

    auto bfs = [&](int src, vector<ll>& dist, vector<int>& parent, vector<int>& pw) {
        dist.assign(n + 1, -1);
        parent.assign(n + 1, -1);
        pw.assign(n + 1, 0);
        queue<int> q;
        dist[src] = 0;
        q.push(src);
        while (!q.empty()) {
            int u = q.front(); q.pop();
            for (auto [v, w] : adj[u]) {
                if (dist[v] == -1) {
                    dist[v] = dist[u] + w;
                    parent[v] = u;
                    pw[v] = w;
                    q.push(v);
                }
            }
        }
    };

    vector<ll> dist;
    vector<int> parent, pw;

    bfs(1, dist, parent, pw);
    int A = 1;
    for (int i = 1; i <= n; ++i) if (dist[i] > dist[A]) A = i;

    bfs(A, dist, parent, pw);
    int B = A;
    for (int i = 1; i <= n; ++i) if (dist[i] > dist[B]) B = i;

    ll D = dist[B];
    double halfD = D / 2.0;

    vector<int> path;
    for (int u = B; u != -1; u = parent[u]) path.push_back(u);

    ll sum = 0;
    for (int i = 0; i < (int)path.size() - 1; ++i) {
        int v = path[i];
        int u = path[i + 1];
        int w = pw[v];
        if (sum + w == D / 2 && D % 2 == 0) {
            cout << fixed << setprecision(2) << halfD << "\nNODE " << u << "\n";
            return 0;
        }
        if (sum + w > halfD) {
            double d = halfD - sum;
            cout << fixed << setprecision(2) << halfD << "\nEDGE ";
            if (u < v) cout << u << " " << v << " " << fixed << setprecision(2) << d << "\n";
            else cout << v << " " << u << " " << fixed << setprecision(2) << (w - d) << "\n";
            return 0;
        }
        sum += w;
    }

    cout << fixed << setprecision(2) << halfD << "\nNODE " << B << "\n";
    return 0;
}
```

</details>
