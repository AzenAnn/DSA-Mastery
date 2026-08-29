---
title: "Lab 07-02：最小生成树"
description: "实现 Kruskal 算法求无向图的最小生成树，输出边权之和，并正确处理多重边与自环。"
order: 2
chapter: 7
chapterTitle: "图的遍历与应用"
updated: "2026-08-29"
contributors: ["Fishman"]
status: "draft"
lab: true
difficulty: "基础"
duration: "120～150 分钟"
---

# Lab 07-02：最小生成树

> 题目来源：参考 [GeeksforGeeks 的经典 Kruskal 练习](https://www.geeksforgeeks.org/dsa/kruskals-minimum-spanning-tree-algorithm-greedy-algo-2/)与 [LeetCode 1135：最低成本联通所有城市](https://leetcode.cn/problems/connecting-cities-with-minimum-cost/)进行课程化改编。本 Lab 使用从 `0` 开始的顶点编号、保证图连通，并采用独立输入输出与测试。

## 学习目标

- [ ] 能说明最小生成树的定义，以及切分定理与环性质；
- [ ] 能用路径压缩和按秩（或按大小）合并的并查集实现 Kruskal；
- [ ] 能正确处理多重边、自环与边权范围；
- [ ] 能说明最小生成树以图连通为前提，并分析算法复杂度。

## 前置知识

完成前建议先阅读[第 7.2 节 最小生成树](../../../content/chapter-07-graph-traversal/02-minimum-spanning-tree.md)。你需要准备支持 C++17 的编译器；可先运行 `make doctor` 检查环境。

## 输入格式

第一行包含两个整数 `n m`，分别表示顶点数和无向边数。顶点编号为 `0` 到 `n-1`。

接下来 `m` 行，每行包含三个整数 `u v w`，表示一条连接 `u` 与 `v` 的无向边，边权为 `w`。输入保证：

- `1 <= n <= 100000`；
- `n - 1 <= m <= 200000`；
- `0 <= u, v < n`（允许自环，即 `u == v`）；
- `1 <= w <= 100000`；
- 图是连通的；可能存在多重边或自环。

## 输出格式

输出一个整数：最小生成树的边权之和。边权之和可能超过 32 位整数，请使用 64 位整数类型。

### 样例输入

```input
4 5
0 1 10
0 2 6
0 3 5
1 3 15
2 3 4
```

### 样例输出

```output
19
```

## 任务

1. 读入全部边，按边权从小到大排序；
2. 用并查集维护顶点所属连通分量，避免加入使当前森林成环的边；
3. 依次把不构成环的最小边加入生成树，累计边权；
4. 当选中 `n - 1` 条边时停止，输出累计的边权和。

## 正常、边界与错误情况

| 情况 | 预期行为 |
| --- | --- |
| 一般连通图 | 恰好选中 `n - 1` 条边，输出最小边权和 |
| 含环图 | 会跳过使当前森林成环的候选边；并列权重时 MST 可能不唯一，但最小总权重一致 |
| 多重边 | 无需预先去重；较轻平行边先处理，较重平行边不会改善最优解 |
| 自环 | 自环不改变连通分量，被并查集直接跳过 |
| 单顶点图 | 没有边可选，输出 `0` |
| 输入图本身是树（包括链或星形） | 唯一生成树就是原图，输出全部边权之和 |
| 稠密图 | Kruskal 排序后贪心选择，答案与 Prim 一致 |

## 运行与评分

在本 Lab 目录执行：

```powershell
make doctor
make run
make run CASE=001-sample
make score
```

未安装 Make 时，在仓库根目录执行：

```powershell
pnpm lab:doctor -- labs/chapter-07/lab-07-02-minimum-spanning-tree
pnpm lab:run -- labs/chapter-07/lab-07-02-minimum-spanning-tree
pnpm lab:score -- labs/chapter-07/lab-07-02-minimum-spanning-tree
```

## 完成清单

- [ ] 所有测试用例全部通过；
- [ ] 并查集同时实现路径压缩与按秩（或按大小）合并；
- [ ] 边权用 64 位整数累加，避免溢出；
- [ ] 多重边无需预先去重，答案不受平行边输入顺序影响；
- [ ] README 中的命令已从干净检出验证。

## 复杂度分析

本 Lab 要求使用 Kruskal：边排序需要 `O(m log m)`；同时使用路径压缩与按秩（或按大小）合并时，并查集操作的均摊复杂度为 `O(α(n))`。总时间复杂度为 `O(m log m)`，空间复杂度为 `O(n + m)`。

作为算法对比，Prim 在邻接矩阵下为 `O(n²)`，适合顶点数较小的稠密图；在堆优化邻接表下为 `O((n + m) log n)`，适合稀疏图，但不属于本 Lab 的实现要求。

## 思考与复盘

1. 为什么 Kruskal 只考虑“不构成环”就能得到最小生成树？它对应哪条定理？
2. 存在多重边时，为什么可以只保留最小边权而不影响答案？
3. 稠密图和稀疏图分别更适合 Prim 还是 Kruskal？依据是什么？
4. 本题保证图连通；若扩展到不连通图，最小生成树应如何定义，又该如何报告“不存在生成树”？
