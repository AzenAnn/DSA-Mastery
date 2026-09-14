---
title: "Lab 06-E-18：无法互达的点对数"
description: "按连通分量统计跨分量无序点对，避免二次枚举并处理 64 位答案。"
order: 22
chapter: 6
labId: "06E18"
chapterTitle: "图的基础与存储"
updated: "2026-09-12"
contributors: ["Azen"]
status: "draft"
lab: true
difficulty: "基础"
duration: "35～60 分钟"
---

# Lab 06-E-18：无法互达的点对数

> 题目来源：[LeetCode 2316](https://leetcode.com/problems/count-unreachable-pairs-of-nodes-in-an-undirected-graph/)。保留原题图语义，将函数参数与返回值改为标准输入输出。

## 学习目标

- [ ] 求出每个连通分量的大小 s。
- [ ] 设此前分量共包含 seen 个顶点，累加 seen*s 后更新 seen，避免每对计算两次。
- [ ] 能解释算法正确性与复杂度，并通过正常、边界和回归用例。

## 前置知识

先阅读 [6.3 图的遍历与连通性](../../../../content/chapter-06-graph-foundations/03-graph-traversal-connectivity.md)。环境需要 Node.js、pnpm 和支持 C++17 的编译器；Make 可选，可用下方 pnpm 命令替代。

## 题目

给定简单无向图，统计不同顶点组成的无序点对 {u,v} 中，无法通过路径互达的点对数量。{u,v} 与 {v,u} 是同一对，顶点不能与自身配对。

## 输入格式

第一行 `n m`，随后 m 行无向边 `u v`。

### 数据范围

`1 <= n <= 100000`，`0 <= m <= 200000`，顶点编号 `0..n-1`；无自环重边。

输入为单组有效数据，所有整数和命令按空白分隔。自动评分不包含非法编号、非法命令或违反上述限制的图，不需要额外输出输入校验提示。

## 输出格式

输出无法互达的无序点对数，使用 64 位整数。

只向标准输出写入答案；调试信息写入标准错误。按题面规定分行，评分按空白分隔的 token 比较。

## 样例

### 样例输入

```text
7 5
0 2
0 5
2 4
1 6
5 4
```

### 样例输出

```text
14
```

分量大小为 4、2、1，跨分量点对数为 4*2+4*1+2*1=14。

## 实现任务

修改本题目录中的 `student/main.cpp`，完成 TODO 标记的算法。输入输出骨架可以保留，完整参考实现单独位于 `solution/main.cpp`。

1. 求出每个连通分量的大小 s。
2. 设此前分量共包含 seen 个顶点，累加 seen*s 后更新 seen，避免每对计算两次。

## 正常、边界与错误情况

- 正常情况：按题目定义处理全部输入，输出与输入边的排列顺序无关。
- n=1：输出 0。
- 全连通：输出 0。
- n=100000、m=0：输出 4999950000。
- 常见错误：先以 int 相乘再赋给 long long 仍会溢出；无序点对不能重复累计两个方向。
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
pnpm lab:doctor -- labs/chapter-06/exercise/E-06-18-unreachable-pairs
pnpm lab:run -- labs/chapter-06/exercise/E-06-18-unreachable-pairs
pnpm lab:run -- labs/chapter-06/exercise/E-06-18-unreachable-pairs --case 001-sample
pnpm lab:score -- labs/chapter-06/exercise/E-06-18-unreachable-pairs
```

本题有 20 组测试，每组 5 分，总分 100。起始代码可以编译，但尚未实现完整算法；满分需补齐 TODO。作者检查参考解、骨架与预期输出可使用 `pnpm lab:verify -- labs/chapter-06/exercise/E-06-18-unreachable-pairs`。

## 正确性说明

同一分量内所有点对可达，不同分量之间所有点对不可达。处理新分量时，它与此前分量构成 seen*s 对，每个跨分量点对只在后出现的那个分量被处理时计入一次。

## 复杂度分析

时间 `O(n+m)`，空间 `O(n+m)`。不需要枚举 n(n-1)/2 个点对。

## 完成清单

- [ ] 20 组测试全部通过，得分 100。
- [ ] 样例结果能够手工推导，顶点编号和输出规则没有混淆。
- [ ] 已检查本题的空结构、最小规模、最大规模和易错边界。
- [ ] 能说明每个顶点或每条边如何参与计算，复杂度包含输入输出及排序成本。
- [ ] 已使用本题的 Make 或 pnpm 入口运行学生代码。

## 思考与复盘

1. 如何用总点对数减去各分量内部点对数得到同一结果？
2. 为什么使用 size*(n-size) 求和时最后需要除以 2？
