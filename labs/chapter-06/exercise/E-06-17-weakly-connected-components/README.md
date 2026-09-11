---
title: "Lab 06-E-17：有向图的弱连通分量"
description: "忽略边的方向后计算分量，区分弱连通与有向可达。"
order: 21
chapter: 6
labId: "06E17"
chapterTitle: "图的基础与存储"
updated: "2026-09-12"
contributors: ["Azen"]
status: "draft"
lab: true
difficulty: "基础"
duration: "35～60 分钟"
---

# Lab 06-E-17：有向图的弱连通分量

> 题目来源：[DSA Mastery 6.3](https://azenann.github.io/DSA-Mastery/learn/chapter-06-graph-foundations/03-graph-traversal-connectivity/)。本题为根据课程知识点设计的独立练习，输入输出和数据范围由本 Lab 定义。

## 学习目标

- [ ] 为每条有向边补上可反向遍历的邻接记录，得到底层无向图。
- [ ] 完整遍历并按最小顶点顺序标号。
- [ ] 能解释算法正确性与复杂度，并通过正常、边界和回归用例。

## 前置知识

先阅读 [6.3 图的遍历与连通性](../../../../content/chapter-06-graph-foundations/03-graph-traversal-connectivity.md)。环境需要 Node.js、pnpm 和支持 C++17 的编译器；Make 可选，可用下方 pnpm 命令替代。

## 题目

给定有向图，将所有边视作无向边后得到底层无向图；它的连通分量称为原图的弱连通分量。输出弱连通分量数和每个顶点的规范标签。标签按各分量最小顶点递增，从 1 开始。

## 输入格式

第一行 `n m`，随后 m 行有向边 `u v`。

### 数据范围

`1 <= n <= 100000`，`0 <= m <= 200000`，顶点编号 `0..n-1`；允许自环和平行边。

输入为单组有效数据，所有整数和命令按空白分隔。自动评分不包含非法编号、非法命令或违反上述限制的图，不需要额外输出输入校验提示。

## 输出格式

第一行分量数 k，第二行按顶点 0..n-1 输出 n 个规范标签。

只向标准输出写入答案；调试信息写入标准错误。按题面规定分行，评分按空白分隔的 token 比较。

## 样例

### 样例输入

```text
6 3
2 0
2 1
4 3
```

### 样例输出

```text
3
1 1 1 2 2 3
```

边 2 到 0、2 到 1 虽不能让三点沿原方向互达，但忽略方向后它们连通；3、4 属于另一分量，5 独立。

## 实现任务

修改本题目录中的 `student/main.cpp`，完成 TODO 标记的算法。输入输出骨架可以保留，完整参考实现单独位于 `solution/main.cpp`。

1. 为每条有向边补上可反向遍历的邻接记录，得到底层无向图。
2. 完整遍历并按最小顶点顺序标号。

## 正常、边界与错误情况

- 正常情况：按题目定义处理全部输入，输出与输入边的排列顺序无关。
- 反向链仍属于一个弱连通分量。
- 孤立点和仅有自环的点各形成一个分量。
- 平行边不重复计数顶点。
- 常见错误：在原图中仅沿出边遍历不能求弱连通分量；弱连通也不意味着强连通。
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
pnpm lab:doctor -- labs/chapter-06/exercise/E-06-17-weakly-connected-components
pnpm lab:run -- labs/chapter-06/exercise/E-06-17-weakly-connected-components
pnpm lab:run -- labs/chapter-06/exercise/E-06-17-weakly-connected-components --case 001-sample
pnpm lab:score -- labs/chapter-06/exercise/E-06-17-weakly-connected-components
```

本题有 20 组测试，每组 5 分，总分 100。起始代码可以编译，但尚未实现完整算法；满分需补齐 TODO。作者检查参考解、骨架与预期输出可使用 `pnpm lab:verify -- labs/chapter-06/exercise/E-06-17-weakly-connected-components`。

## 正确性说明

忽略方向后的每条边均可双向经过，与底层无向图的路径定义一致。因此计算该无向图连通分量恰好得到弱连通分量。自环和重边不改变可达集合。

## 复杂度分析

时间 `O(n+m)`，空间 `O(n+m)`。

## 完成清单

- [ ] 20 组测试全部通过，得分 100。
- [ ] 样例结果能够手工推导，顶点编号和输出规则没有混淆。
- [ ] 已检查本题的空结构、最小规模、最大规模和易错边界。
- [ ] 能说明每个顶点或每条边如何参与计算，复杂度包含输入输出及排序成本。
- [ ] 已使用本题的 Make 或 pnpm 入口运行学生代码。

## 思考与复盘

1. 强连通分量是否一定包含于某个弱连通分量？为什么？
2. 不显式构造底层无向图，使用并查集应如何处理每条边？
