---
title: "Lab 06-E-16：连通分量规模统计"
description: "对每个连通分量统计顶点数，并按规模降序输出。"
order: 20
chapter: 6
labId: "06E16"
chapterTitle: "图的基础与存储"
updated: "2026-09-12"
contributors: ["Azen"]
status: "draft"
lab: true
difficulty: "基础"
duration: "35～60 分钟"
---

# Lab 06-E-16：连通分量规模统计

> 题目来源：[DSA Mastery 6.3](https://azenann.github.io/DSA-Mastery/learn/chapter-06-graph-foundations/03-graph-traversal-connectivity/)。本题为根据课程知识点设计的独立练习，输入输出和数据范围由本 Lab 定义。

## 学习目标

- [ ] 每次新分量遍历时重置本次计数，只统计首次访问的顶点。
- [ ] 收集全部大小并排序，验证大小总和为 n。
- [ ] 能解释算法正确性与复杂度，并通过正常、边界和回归用例。

## 前置知识

先阅读 [6.3 图的遍历与连通性](../../../../content/chapter-06-graph-foundations/03-graph-traversal-connectivity.md)。环境需要 Node.js、pnpm 和支持 C++17 的编译器；Make 可选，可用下方 pnpm 命令替代。

## 题目

给定简单无向图，统计所有连通分量的大小。大小指其中不同顶点的数量，不是边数。按非增序输出各分量大小，相同大小需分别保留。

## 输入格式

第一行 `n m`，随后 m 行无向边 `u v`。

### 数据范围

`1 <= n <= 100000`，`0 <= m <= 200000`，顶点编号 `0..n-1`；无自环重边。

输入为单组有效数据，所有整数和命令按空白分隔。自动评分不包含非法编号、非法命令或违反上述限制的图，不需要额外输出输入校验提示。

## 输出格式

第一行分量数 k；第二行 k 个分量大小，按非增序排列。

只向标准输出写入答案；调试信息写入标准错误。按题面规定分行，评分按空白分隔的 token 比较。

## 样例

### 样例输入

```text
8 5
0 1
2 3
3 4
4 5
6 7
```

### 样例输出

```text
3
4 2 2
```

各分量大小为 2、4、2，降序后输出 4 2 2，保留两个大小为 2 的分量。

## 实现任务

修改本题目录中的 `student/main.cpp`，完成 TODO 标记的算法。输入输出骨架可以保留，完整参考实现单独位于 `solution/main.cpp`。

1. 每次新分量遍历时重置本次计数，只统计首次访问的顶点。
2. 收集全部大小并排序，验证大小总和为 n。

## 正常、边界与错误情况

- 正常情况：按题目定义处理全部输入，输出与输入边的排列顺序无关。
- 全是孤立点：输出 n 个 1。
- 同样大小的多个分量：保留每一个。
- 一个分量：第二行只有 n。
- 常见错误：有环时不能在每次遇到顶点就累加；相同大小不能去重。
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
pnpm lab:doctor -- labs/chapter-06/exercise/E-06-16-component-size-statistics
pnpm lab:run -- labs/chapter-06/exercise/E-06-16-component-size-statistics
pnpm lab:run -- labs/chapter-06/exercise/E-06-16-component-size-statistics --case 001-sample
pnpm lab:score -- labs/chapter-06/exercise/E-06-16-component-size-statistics
```

本题有 20 组测试，每组 5 分，总分 100。起始代码可以编译，但尚未实现完整算法；满分需补齐 TODO。作者检查参考解、骨架与预期输出可使用 `pnpm lab:verify -- labs/chapter-06/exercise/E-06-16-component-size-statistics`。

## 正确性说明

完整遍历把顶点集划分为不重叠的可达集合，每个顶点只在所属分量中计数一次，所以所有大小之和为 n。排序只重新排列各大小，不改变分量数量或重复大小的重数。

## 复杂度分析

时间 `O(n+m+k log(k+1))`，空间 `O(n+m)`，k 为分量数。

## 完成清单

- [ ] 20 组测试全部通过，得分 100。
- [ ] 样例结果能够手工推导，顶点编号和输出规则没有混淆。
- [ ] 已检查本题的空结构、最小规模、最大规模和易错边界。
- [ ] 能说明每个顶点或每条边如何参与计算，复杂度包含输入输出及排序成本。
- [ ] 已使用本题的 Make 或 pnpm 入口运行学生代码。

## 思考与复盘

1. 为什么边数不能唯一决定分量大小？
2. 如果只需要最大分量大小，哪些步骤和空间可以省略？
