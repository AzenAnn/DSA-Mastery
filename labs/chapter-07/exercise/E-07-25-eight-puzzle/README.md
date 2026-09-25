---
title: "Lab 07-E-25：八数码问题（A*）"
description: "比较初态与目标的非零数字逆序奇偶，无解立即返回，完成八数码问题（A*）的实现与边界验证。"
order: 125
chapter: 7
labId: "07E25"
chapterTitle: "图的遍历与应用"
updated: "2026-09-19"
contributors: ["Azen", "qzm123"]
status: "draft"
lab: true
difficulty: "挑战"
duration: "90～120 分钟"
---

# Lab 07-E-25：八数码问题（A*）

> 题目来源：改编自 [洛谷 P1379 八数码难题](https://www.luogu.com.cn/problem/P1379)。保留目标 123804765；课程版额外加入无解输入，输出 -1。

## 学习目标

- [ ] 能根据输入约定建立正确的图或状态表示。
- [ ] 能解释本题的核心步骤：比较初态与目标的非零数字逆序奇偶，无解立即返回。
- [ ] 能说明易错反例为何需要单独测试。

## 前置知识与环境

先阅读[A* 寻路：从直觉到实现](../../../../content/chapter-07-graph-traversal/05-astar-visualization.md)。需要 C++17 编译器，运行前可执行 `make doctor`。

## 题目

3×3 棋盘上包含数字 0..8 各一次，0 是空格。每次可将空格与上下左右相邻数字交换。目标固定为 `123804765`（按行展开），求最少交换次数。使用每个非零数字到其目标位置的曼哈顿距离之和作为 A* 启发式。

## 输入格式

一行恰好九个连续数字，表示从上到下、从左到右的布局；可能以 0 开头，必须用字符串读入。保证是 0..8 的排列。

## 输出格式

一行最少移动次数；已是目标输出 0，无法到达目标输出 -1。

### 样例输入

```input
123840765
```

### 样例输出

```output
1
```

### 样例解释

把中间一行的空格向左交换一次，即得到目标 123804765。

## 任务

1. 比较初态与目标的非零数字逆序奇偶，无解立即返回。
2. 预计算每个数字在目标中的位置。
3. 维护最小 g，按 f=g+h 搜索并跳过过期队列条目。

在 `student/main.cpp` 的 TODO 处完成算法。起始代码可以编译，但不代表已经实现题目；参考实现位于 `solution/main.cpp`。

## 正常、边界与错误情况

目标不是常见的 123456780；启发式不计算空格，逆序奇偶必须相对本题目标判断。

输入保证符合上述格式与范围，不要求处理损坏输入。无解、不可达等情况按本题输出合同处理，不视为格式错误。测试点包含如下场景，每点 5 分，共 100 分：

| 测试点 | 类型 |
| --- | --- |
| `001-sample` | 样例 |
| `002-already-goal` | 边界 |
| `003-leading-zero` | 边界 |
| `004-opposite-parity` | 易错反例 |
| `005-usual-goal-is-not-this-goal` | 易错反例 |
| `006-optimal-distance-2` | 正常 |
| `007-optimal-distance-3` | 正常 |
| `008-optimal-distance-4` | 正常 |
| `009-optimal-distance-5` | 正常 |
| `010-optimal-distance-6` | 正常 |
| `011-optimal-distance-7` | 正常 |
| `012-optimal-distance-8` | 正常 |
| `013-optimal-distance-9` | 正常 |
| `014-optimal-distance-10` | 正常 |
| `015-optimal-distance-11` | 正常 |
| `016-optimal-distance-12` | 正常 |
| `017-optimal-distance-13` | 正常 |
| `018-optimal-distance-14` | 规模 |
| `019-optimal-distance-15` | 规模 |
| `020-maximum-distance` | 规模 |


## 运行与评分

在本 Lab 目录执行：

```powershell
make doctor
make run CASE=001-sample
make score
```

未安装 Make 时，在仓库根目录执行：

```powershell
pnpm lab doctor labs/chapter-07/exercise/E-07-25-eight-puzzle
pnpm lab run labs/chapter-07/exercise/E-07-25-eight-puzzle --case 001-sample
pnpm lab score labs/chapter-07/exercise/E-07-25-eight-puzzle
```

## 解题思路

先用非零数字逆序奇偶性判断目标是否可达，不可达时直接输出无解。可达时用 A* 搜索状态，优先扩展 `g+h` 最小的节点，并用父状态记录路径。

## 复杂度分析

最多 9! 个排列，可达的一类有 9!/2 个状态。令 S 为探索状态数，堆搜索 O(S log S) 时间、O(S) 空间；每个状态的启发式计算是常数。

## 完成清单

- [ ] 所有 20 个测试点通过，达到 100 分。
- [ ] 输出符合题面约定，未将样例结果写死。
- [ ] 能手工复现一个边界场景和一个易错反例。
- [ ] 能解释所用数据结构、状态更新与复杂度。

## 思考与复盘

1. 本题最容易遗漏的约束是什么？

::: details 参考思路
目标不是常见的 123456780；启发式不计算空格，逆序奇偶必须相对本题目标判断。
:::

2. 为什么要先做逆序奇偶性判定再运行 A*？如果跳过这一步，对不可解状态会发生什么？

::: details 参考思路
八数码状态空间分成不同奇偶性类别，类别不同的状态无法互达。跳过判定会让 A* 在有限状态空间中反复扩展大量状态，最后只能无效地搜索到空队列。
:::
