---
title: "Lab 06-E-19：完全连通分量计数"
description: "在分量内部比较实际边数与完全图边数，识别全部完全分量。"
order: 23
chapter: 6
labId: "06E19"
chapterTitle: "图的基础与存储"
updated: "2026-09-12"
contributors: ["Azen"]
status: "draft"
lab: true
difficulty: "基础"
duration: "35～60 分钟"
---

# Lab 06-E-19：完全连通分量计数

> 题目来源：[LeetCode 2685](https://leetcode.com/problems/count-the-number-of-complete-components/)。保留原题图语义，将函数参数与返回值改为标准输入输出。

## 学习目标

- [ ] 遍历每个连通分量，累计顶点数 s 和度数和 D。
- [ ] 利用 D=2e，检查 e 是否达到 s(s-1)/2。
- [ ] 能解释算法正确性与复杂度，并通过正常、边界和回归用例。

## 前置知识

先阅读 [6.3 图的遍历与连通性](../../../../content/chapter-06-graph-foundations/03-graph-traversal-connectivity.md)。环境需要 Node.js、pnpm 和支持 C++17 的编译器；Make 可选，可用下方 pnpm 命令替代。

## 题目

一个连通分量若其中任意两个不同顶点之间都有直接边，则称为完全连通分量。给定简单无向图，输出完全连通分量的数量。孤立顶点也算完全连通分量。

## 输入格式

第一行 `n m`，随后 m 行无向边 `u v`。

### 数据范围

`1 <= n <= 50`，`0 <= m <= n(n-1)/2`，顶点编号 `0..n-1`；无自环重边。

输入为单组有效数据，所有整数和命令按空白分隔。自动评分不包含非法编号、非法命令或违反上述限制的图，不需要额外输出输入校验提示。

## 输出格式

输出完全连通分量数量。

只向标准输出写入答案；调试信息写入标准错误。按题面规定分行，评分按空白分隔的 token 比较。

## 样例

### 样例输入

```text
6 4
0 1
0 2
1 2
3 4
```

### 样例输出

```text
3
```

三点三角形、两点一条边、单个孤立点分别构成一个完全分量，因此答案为 3。

## 实现任务

修改本题目录中的 `student/main.cpp`，完成 TODO 标记的算法。输入输出骨架可以保留，完整参考实现单独位于 `solution/main.cpp`。

1. 遍历每个连通分量，累计顶点数 s 和度数和 D。
2. 利用 D=2e，检查 e 是否达到 s(s-1)/2。

## 正常、边界与错误情况

- 正常情况：按题目定义处理全部输入，输出与输入边的排列顺序无关。
- 单点分量 s=1、e=0 满足公式。
- 两个顶点一条边是完全分量。
- 三点链连通但不完全。
- 常见错误：连通不等于完全；若允许平行边，单看边数达到上限不能推出完全。
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
pnpm lab:doctor -- labs/chapter-06/exercise/E-06-19-complete-components
pnpm lab:run -- labs/chapter-06/exercise/E-06-19-complete-components
pnpm lab:run -- labs/chapter-06/exercise/E-06-19-complete-components --case 001-sample
pnpm lab:score -- labs/chapter-06/exercise/E-06-19-complete-components
```

本题有 20 组测试，每组 5 分，总分 100。起始代码可以编译，但尚未实现完整算法；满分需补齐 TODO。作者检查参考解、骨架与预期输出可使用 `pnpm lab:verify -- labs/chapter-06/exercise/E-06-19-complete-components`。

## 正确性说明

简单图中 s 个顶点之间最多有 s(s-1)/2 条边。实际边数达到此上界当且仅当每个不同点对都有边。连通分量不存在通往其他分量的边，所以在分量内累加度数正好得到其内部边数的两倍。

## 复杂度分析

时间 `O(n+m)`，空间 `O(n+m)`。

## 完成清单

- [ ] 20 组测试全部通过，得分 100。
- [ ] 样例结果能够手工推导，顶点编号和输出规则没有混淆。
- [ ] 已检查本题的空结构、最小规模、最大规模和易错边界。
- [ ] 能说明每个顶点或每条边如何参与计算，复杂度包含输入输出及排序成本。
- [ ] 已使用本题的 Make 或 pnpm 入口运行学生代码。

## 思考与复盘

1. 可以改为检查每个顶点的度均为 s-1 吗？
2. “每个点的度都相同”是否就意味着该分量完全？请给反例。
