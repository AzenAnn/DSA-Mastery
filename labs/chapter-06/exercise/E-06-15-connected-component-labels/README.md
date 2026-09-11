---
title: "Lab 06-E-15：无向图连通分量标号"
description: "完整遍历无向图，为所有顶点分配稳定的连通分量编号。"
order: 19
chapter: 6
labId: "06E15"
chapterTitle: "图的基础与存储"
updated: "2026-09-12"
contributors: ["Azen"]
status: "draft"
lab: true
difficulty: "基础"
duration: "35～60 分钟"
---

# Lab 06-E-15：无向图连通分量标号

> 题目来源：[DSA Mastery 6.3](https://azenann.github.io/DSA-Mastery/learn/chapter-06-graph-foundations/03-graph-traversal-connectivity/)。本题为根据课程知识点设计的独立练习，输入输出和数据范围由本 Lab 定义。

## 学习目标

- [ ] 按顶点递增扫描，对每个未标记顶点启动一次完整分量遍历。
- [ ] 使用同一编号标记本次遍历所有顶点，再递增分量编号。
- [ ] 能解释算法正确性与复杂度，并通过正常、边界和回归用例。

## 前置知识

先阅读 [6.3 图的遍历与连通性](../../../../content/chapter-06-graph-foundations/03-graph-traversal-connectivity.md)。环境需要 Node.js、pnpm 和支持 C++17 的编译器；Make 可选，可用下方 pnpm 命令替代。

## 题目

给定简单无向图，将互相可达的顶点划入同一连通分量。输出分量数和每个顶点的分量编号。为了使答案唯一，按每个分量中最小顶点的编号从小到大，将分量依次编号为 1..k。

## 输入格式

第一行 `n m`；随后 m 行无向边 `u v`。

### 数据范围

`1 <= n <= 100000`，`0 <= m <= 200000`，顶点编号 `0..n-1`；无自环重边。

输入为单组有效数据，所有整数和命令按空白分隔。自动评分不包含非法编号、非法命令或违反上述限制的图，不需要额外输出输入校验提示。

## 输出格式

第一行分量数 k；第二行 n 个整数，按顶点 0..n-1 的顺序输出其分量编号。编号必须满足上述最小顶点排序规则。

只向标准输出写入答案；调试信息写入标准错误。按题面规定分行，评分按空白分隔的 token 比较。

## 样例

### 样例输入

```text
6 3
0 2
2 4
1 3
```

### 样例输出

```text
3
1 2 1 2 1 3
```

三个分量分别为 {0,2,4}、{1,3}、{5}，最小顶点为 0、1、5，因此标签为 1 2 1 2 1 3。

## 实现任务

修改本题目录中的 `student/main.cpp`，完成 TODO 标记的算法。输入输出骨架可以保留，完整参考实现单独位于 `solution/main.cpp`。

1. 按顶点递增扫描，对每个未标记顶点启动一次完整分量遍历。
2. 使用同一编号标记本次遍历所有顶点，再递增分量编号。

## 正常、边界与错误情况

- 正常情况：按题目定义处理全部输入，输出与输入边的排列顺序无关。
- 孤立点也有独立编号。
- 分量中的顶点可在编号轴上交错，不能按连续区间分组。
- 空图的输出标签是 1..n。
- 常见错误：编号从 1 开始，顶点从 0 开始；不能按输入边首次出现的顺序给分量编号。
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
pnpm lab:doctor -- labs/chapter-06/exercise/E-06-15-connected-component-labels
pnpm lab:run -- labs/chapter-06/exercise/E-06-15-connected-component-labels
pnpm lab:run -- labs/chapter-06/exercise/E-06-15-connected-component-labels --case 001-sample
pnpm lab:score -- labs/chapter-06/exercise/E-06-15-connected-component-labels
```

本题有 20 组测试，每组 5 分，总分 100。起始代码可以编译，但尚未实现完整算法；满分需补齐 TODO。作者检查参考解、骨架与预期输出可使用 `pnpm lab:verify -- labs/chapter-06/exercise/E-06-15-connected-component-labels`。

## 正确性说明

按顶点递增扫描时，每次新遍历的起点恰好是该分量的最小顶点。一次遍历访问且仅访问该分量，所以起点顺序自然给出规范编号。

## 复杂度分析

时间 `O(n+m)`，空间 `O(n+m)`。

## 完成清单

- [ ] 20 组测试全部通过，得分 100。
- [ ] 样例结果能够手工推导，顶点编号和输出规则没有混淆。
- [ ] 已检查本题的空结构、最小规模、最大规模和易错边界。
- [ ] 能说明每个顶点或每条边如何参与计算，复杂度包含输入输出及排序成本。
- [ ] 已使用本题的 Make 或 pnpm 入口运行学生代码。

## 思考与复盘

1. 如果 DFS 邻居遍历顺序改变，规范编号还会改变吗？
2. 已经保存所有标签后，如何在 O(1) 时间回答两点是否连通？
