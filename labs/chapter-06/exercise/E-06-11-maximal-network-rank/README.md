---
title: "Lab 06-E-11：最大网络秩"
description: "枚举城市对，用度数求道路并集大小，并消除共享道路的重复计数。"
order: 15
chapter: 6
labId: "06E11"
chapterTitle: "图的基础与存储"
updated: "2026-09-12"
contributors: ["Azen"]
status: "draft"
lab: true
difficulty: "基础"
duration: "35～60 分钟"
---

# Lab 06-E-11：最大网络秩

> 题目来源：[LeetCode 1615](https://leetcode.com/problems/maximal-network-rank/)。保留原题图语义，将函数参数与返回值改为标准输入输出。

## 学习目标

- [ ] 计算度数并记录相邻关系。
- [ ] 枚举 u<v，求两座城市关联道路的并集大小并维护最大值。
- [ ] 能解释算法正确性与复杂度，并通过正常、边界和回归用例。

## 前置知识

先阅读 [6.1 图的基本概念](../../../../content/chapter-06-graph-foundations/01-graph-basics.md)。环境需要 Node.js、pnpm 和支持 C++17 的编译器；Make 可选，可用下方 pnpm 命令替代。

## 题目

n 座城市之间存在若干双向道路，任意两座城市最多一条道路。两座不同城市的网络秩是至少与其中一座城市相连的道路总数，它们之间的直接道路只计算一次。求所有城市对中的最大网络秩。

## 输入格式

第一行 `n m`，随后 m 行为无向道路 `u v`。

### 数据范围

`2 <= n <= 100`，`0 <= m <= n(n-1)/2`，顶点编号 `0..n-1`；无自环重边。

输入为单组有效数据，所有整数和命令按空白分隔。自动评分不包含非法编号、非法命令或违反上述限制的图，不需要额外输出输入校验提示。

## 输出格式

输出最大网络秩。

只向标准输出写入答案；调试信息写入标准错误。按题面规定分行，评分按空白分隔的 token 比较。

## 样例

### 样例输入

```text
4 4
0 1
0 3
1 2
1 3
```

### 样例输出

```text
4
```

城市 1 的度为 3，城市 0 和 3 的度都为 2；选择 0、1 时共享的 0-1 道路只计一次，网络秩为 4。

## 实现任务

修改本题目录中的 `student/main.cpp`，完成 TODO 标记的算法。输入输出骨架可以保留，完整参考实现单独位于 `solution/main.cpp`。

1. 计算度数并记录相邻关系。
2. 枚举 u<v，求两座城市关联道路的并集大小并维护最大值。

## 正常、边界与错误情况

- 正常情况：按题目定义处理全部输入，输出与输入边的排列顺序无关。
- m=0：答案为 0。
- 只有两城一条路：答案为 1，不是 2。
- 常见错误：不能总是减 1，也不能把“最高度数的两个编号”未经并列分析就当成最优组合。
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
pnpm lab:doctor -- labs/chapter-06/exercise/E-06-11-maximal-network-rank
pnpm lab:run -- labs/chapter-06/exercise/E-06-11-maximal-network-rank
pnpm lab:run -- labs/chapter-06/exercise/E-06-11-maximal-network-rank --case 001-sample
pnpm lab:score -- labs/chapter-06/exercise/E-06-11-maximal-network-rank
```

本题有 20 组测试，每组 5 分，总分 100。起始代码可以编译，但尚未实现完整算法；满分需补齐 TODO。作者检查参考解、骨架与预期输出可使用 `pnpm lab:verify -- labs/chapter-06/exercise/E-06-11-maximal-network-rank`。

## 正确性说明

degree[u]+degree[v] 对两城之间的道路计了两次，对其他关联道路只计一次，因此存在直接道路时减 1，否则不减。枚举全部不同城市对即可得到最大值。

## 复杂度分析

时间 `O(n^2+m)`，空间 `O(n^2)`。

## 完成清单

- [ ] 20 组测试全部通过，得分 100。
- [ ] 样例结果能够手工推导，顶点编号和输出规则没有混淆。
- [ ] 已检查本题的空结构、最小规模、最大规模和易错边界。
- [ ] 能说明每个顶点或每条边如何参与计算，复杂度包含输入输出及排序成本。
- [ ] 已使用本题的 Make 或 pnpm 入口运行学生代码。

## 思考与复盘

1. 为什么只需枚举 u<v？
2. 最高度数有多人并列时，相邻关系会如何影响答案？
