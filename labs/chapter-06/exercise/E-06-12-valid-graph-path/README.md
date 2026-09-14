---
title: "Lab 06-E-12：寻找图中是否存在路径"
description: "在无向图中进行单源遍历，判断终点是否属于起点的连通分量。"
order: 16
chapter: 6
labId: "06E12"
chapterTitle: "图的基础与存储"
updated: "2026-09-12"
contributors: ["Azen"]
status: "draft"
lab: true
difficulty: "基础"
duration: "35～60 分钟"
---

# Lab 06-E-12：寻找图中是否存在路径

> 题目来源：[LeetCode 1971](https://leetcode.com/problems/find-if-path-exists-in-graph/)。保留原题图语义，将函数参数与返回值改为标准输入输出。

## 学习目标

- [ ] 从 source 开始 DFS 或 BFS，在顶点加入待处理集合时标记。
- [ ] 检查 destination 是否被访问；无需输出实际路径。
- [ ] 能解释算法正确性与复杂度，并通过正常、边界和回归用例。

## 前置知识

先阅读 [6.3 图的遍历与连通性](../../../../content/chapter-06-graph-foundations/03-graph-traversal-connectivity.md)。环境需要 Node.js、pnpm 和支持 C++17 的编译器；Make 可选，可用下方 pnpm 命令替代。

## 题目

给定简单无向图和两个顶点 source、destination，判断是否能沿图中的边从起点到达终点。允许长度为 0 的路径，即顶点总能到达自身。

## 输入格式

第一行 `n m`，随后 m 行无向边 `u v`，最后一行 `source destination`。

### 数据范围

`1 <= n <= 200000`，`0 <= m <= 200000`，顶点编号和起终点均在 `0..n-1`；无自环重边。

输入为单组有效数据，所有整数和命令按空白分隔。自动评分不包含非法编号、非法命令或违反上述限制的图，不需要额外输出输入校验提示。

## 输出格式

存在路径输出 `1`，否则输出 `0`。

只向标准输出写入答案；调试信息写入标准错误。按题面规定分行，评分按空白分隔的 token 比较。

## 样例

### 样例输入

```text
3 3
0 1
1 2
2 0
0 2
```

### 样例输出

```text
1
```

0 与 2 之间存在直接边，也可经 1 到达，因此输出 1。

## 实现任务

修改本题目录中的 `student/main.cpp`，完成 TODO 标记的算法。输入输出骨架可以保留，完整参考实现单独位于 `solution/main.cpp`。

1. 从 source 开始 DFS 或 BFS，在顶点加入待处理集合时标记。
2. 检查 destination 是否被访问；无需输出实际路径。

## 正常、边界与错误情况

- 正常情况：按题目定义处理全部输入，输出与输入边的排列顺序无关。
- source=destination：即使 m=0 也输出 1。
- 起终点在不同分量：输出 0。
- 环：visited 必须防止重复处理。
- 常见错误：起点必须先标记；只检查是否直接有边不能判断路径。
- 非法输入不在评分范围；不要在标准输出中添加提示词、调试标记或额外解释。

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
pnpm lab:doctor -- labs/chapter-06/exercise/E-06-12-valid-graph-path
pnpm lab:run -- labs/chapter-06/exercise/E-06-12-valid-graph-path
pnpm lab:run -- labs/chapter-06/exercise/E-06-12-valid-graph-path --case 001-sample
pnpm lab:score -- labs/chapter-06/exercise/E-06-12-valid-graph-path
```

本题有 20 组测试，每组 5 分，总分 100。起始代码可以编译，但尚未实现完整算法；满分需补齐 TODO。作者检查参考解、骨架与预期输出可使用 `pnpm lab:verify -- labs/chapter-06/exercise/E-06-12-valid-graph-path`。

## 正确性说明

被发现的每个顶点都由已可达顶点沿一条边进入，因此不会标记不可达点。反过来，对任意一条从起点出发的路径逐边归纳，路径上所有点都会被发现，故标记集合恰好是可达集合。

## 复杂度分析

时间 `O(n+m)`，空间 `O(n+m)`；参考实现使用显式栈以支持长链。

## 完成清单

- [ ] 20 组测试全部通过，得分 100。
- [ ] 样例结果能够手工推导，顶点编号和输出规则没有混淆。
- [ ] 已检查本题的空结构、最小规模、最大规模和易错边界。
- [ ] 能说明每个顶点或每条边如何参与计算，复杂度包含输入输出及排序成本。
- [ ] 已使用本题的 Make 或 pnpm 入口运行学生代码。

## 思考与复盘

1. 能否在首次发现终点时提前结束遍历？
2. 如果有很多次静态连通查询，先标号所有分量会带来什么收益？
