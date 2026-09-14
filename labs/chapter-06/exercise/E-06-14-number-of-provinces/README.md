---
title: "Lab 06-E-14：省份数量"
description: "从对称连接矩阵出发，统计包含孤立城市的全部连通分量。"
order: 18
chapter: 6
labId: "06E14"
chapterTitle: "图的基础与存储"
updated: "2026-09-12"
contributors: ["Azen"]
status: "draft"
lab: true
difficulty: "基础"
duration: "35～60 分钟"
---

# Lab 06-E-14：省份数量

> 题目来源：[LeetCode 547](https://leetcode.com/problems/number-of-provinces/)。保留原题图语义，将函数参数与返回值改为标准输入输出。

## 学习目标

- [ ] 扫描所有城市，遇到尚未访问的城市时建立一个新省份。
- [ ] 从该城市遍历矩阵中的邻居，标记整个省份后再继续外层扫描。
- [ ] 能解释算法正确性与复杂度，并通过正常、边界和回归用例。

## 前置知识

先阅读 [6.3 图的遍历与连通性](../../../../content/chapter-06-graph-foundations/03-graph-traversal-connectivity.md)。环境需要 Node.js、pnpm 和支持 C++17 的编译器；Make 可选，可用下方 pnpm 命令替代。

## 题目

若两座城市直接相连，或能通过其他城市间接相连，则它们属于同一个省份。给定直接连接矩阵，请输出省份总数；每座城市恰属于一个省份。

## 输入格式

第一行 n；接下来 n 行，每行 n 个 0/1，矩阵元素 A[i][j] 表示城市 i 与 j 是否直接相连。

### 数据范围

`1 <= n <= 200`；矩阵为 n 行 n 列、对称且主对角线为 1，城市内部编号 `0..n-1`。

输入为单组有效数据，所有整数和命令按空白分隔。自动评分不包含非法编号、非法命令或违反上述限制的图，不需要额外输出输入校验提示。

## 输出格式

输出省份总数。

只向标准输出写入答案；调试信息写入标准错误。按题面规定分行，评分按空白分隔的 token 比较。

## 样例

### 样例输入

```text
3
1 1 0
1 1 0
0 0 1
```

### 样例输出

```text
2
```

城市 0、1 相连，城市 2 只与自身相连，因此共有 2 个省份。

## 实现任务

修改本题目录中的 `student/main.cpp`，完成 TODO 标记的算法。输入输出骨架可以保留，完整参考实现单独位于 `solution/main.cpp`。

1. 扫描所有城市，遇到尚未访问的城市时建立一个新省份。
2. 从该城市遍历矩阵中的邻居，标记整个省份后再继续外层扫描。

## 正常、边界与错误情况

- 正常情况：按题目定义处理全部输入，输出与输入边的排列顺序无关。
- n=1：矩阵为 [1]，输出 1。
- 只有对角线为 1：n 个省份。
- 所有元素均为 1：只有 1 个省份。
- 常见错误：只数矩阵中的 1 或只统计直接连接组都不够；间接连接也属于同一省份。
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
pnpm lab:doctor -- labs/chapter-06/exercise/E-06-14-number-of-provinces
pnpm lab:run -- labs/chapter-06/exercise/E-06-14-number-of-provinces
pnpm lab:run -- labs/chapter-06/exercise/E-06-14-number-of-provinces --case 001-sample
pnpm lab:score -- labs/chapter-06/exercise/E-06-14-number-of-provinces
```

本题有 20 组测试，每组 5 分，总分 100。起始代码可以编译，但尚未实现完整算法；满分需补齐 TODO。作者检查参考解、骨架与预期输出可使用 `pnpm lab:verify -- labs/chapter-06/exercise/E-06-14-number-of-provinces`。

## 正确性说明

每次遍历恰好访问一个连通分量。该分量内的其他城市已被标记，不会再次增加计数；所有城市最终都会被外层扫描覆盖，因此计数正好等于省份数。

## 复杂度分析

时间 `O(n^2)`，输入矩阵空间 `O(n^2)`，额外遍历空间 `O(n)`。

## 完成清单

- [ ] 20 组测试全部通过，得分 100。
- [ ] 样例结果能够手工推导，顶点编号和输出规则没有混淆。
- [ ] 已检查本题的空结构、最小规模、最大规模和易错边界。
- [ ] 能说明每个顶点或每条边如何参与计算，复杂度包含输入输出及排序成本。
- [ ] 已使用本题的 Make 或 pnpm 入口运行学生代码。

## 思考与复盘

1. 为什么对角线的 1 不会产生额外省份？
2. 将矩阵先转成邻接表能否消除读取矩阵所需的 O(n^2) 时间？
