---
title: "Lab 07-E-29：二分图最大匹配（匈牙利）"
description: "维护每个右顶点当前匹配的左顶点，完成二分图最大匹配（匈牙利）的实现与边界验证。"
order: 127
chapter: 7
labId: "07E29"
chapterTitle: "图的遍历与应用"
updated: "2026-09-14"
contributors: ["Azen"]
status: "draft"
lab: true
difficulty: "进阶"
duration: "60～90 分钟"
---

# Lab 07-E-29：二分图最大匹配（匈牙利）

> 题集 T27 · 规划节 7.6。题目来源：参考 [AcWing 861 二分图的最大匹配](https://www.acwing.com/problem/content/863/) 的模板主题。原站核对时要求登录，题面与测试按下列课程合同独立编写。

## 学习目标

- [ ] 能根据输入约定建立正确的图或状态表示。
- [ ] 能解释本题的核心步骤：维护每个右顶点当前匹配的左顶点。
- [ ] 能说明易错反例为何需要单独测试。

## 前置知识与环境

先阅读[图的遍历基础](../../../../content/chapter-07-graph-traversal/01-dfs-and-bfs.md)。对应新节的完整文章尚未纳入当前版本，可先按本题任务步骤完成练习。需要 C++17 编译器，运行前可执行 `make doctor`。全章顺序和重编映射见[Ch7 题目清单](../../../../content/chapter-07-graph-traversal/00-exercise-guide.md)。

## 题目

左右两侧顶点构成二分图，每条边连接一左一右。选择尽量多条没有公共端点的边，输出最大匹配数。练习使用增广路形式的匈牙利算法。

## 输入格式

第一行 `n1 n2 m`，随后 m 行 `u v`。左侧编号 `1..n1`，右侧编号 `1..n2`，两侧编号彼此独立。`1 ≤ n1,n2 ≤ 500`，`0 ≤ m ≤ 100000`，不含重复边。

## 输出格式

一行最大匹配数；无边输出 0。

### 样例输入

```input
2 2 3
1 1
1 2
2 1
```

### 样例输出

```output
2
```

### 样例解释

先把左 1 配给右 1 后，左 2 需要增广重配：最终左 1 配右 2、左 2 配右 1，匹配数为 2。

## 任务

1. 维护每个右顶点当前匹配的左顶点。
2. 为每个左顶点进行一次 DFS 增广。
3. 成功增广一次，匹配数增加 1。

在 `student/main.cpp` 的 TODO 处完成算法。起始代码可以编译，但不代表已经实现题目；参考实现位于 `solution/main.cpp`。

## 正常、边界与错误情况

遇到已匹配右顶点时需要尝试为原左顶点重新配对；每次增广都必须重置访问标记。

输入保证符合上述格式与范围，不要求处理损坏输入。无解、不可达等情况按本题输出合同处理，不视为格式错误。测试点包含如下场景，每点 5 分，共 100 分：

| 测试点 | 类型 |
| --- | --- |
| `001-sample` | 样例 |
| `002-no-edges` | 边界 |
| `003-single-pair` | 边界 |
| `004-many-left-one-right` | 易错反例 |
| `005-one-left-many-right` | 易错反例 |
| `006-augment-long-chain` | 易错反例 |
| `007-complete-ties` | 易错反例 |
| `008-hall-deficient` | 易错反例 |
| `009-seeded-matching-0` | 正常 |
| `010-seeded-matching-1` | 正常 |
| `011-seeded-matching-2` | 正常 |
| `012-seeded-matching-3` | 正常 |
| `013-seeded-matching-4` | 正常 |
| `014-seeded-matching-5` | 正常 |
| `015-seeded-matching-6` | 正常 |
| `016-seeded-matching-7` | 正常 |
| `017-seeded-matching-8` | 正常 |
| `018-dense` | 规模 |
| `019-large-sparse` | 规模 |
| `020-large-deficient` | 规模 |


## 运行与评分

在本 Lab 目录执行：

```powershell
make doctor
make run CASE=001-sample
make score
```

未安装 Make 时，在仓库根目录执行：

```powershell
pnpm lab doctor labs/chapter-07/exercise/E-07-29-bipartite-matching
pnpm lab run labs/chapter-07/exercise/E-07-29-bipartite-matching --case 001-sample
pnpm lab score labs/chapter-07/exercise/E-07-29-bipartite-matching
```

## 复杂度分析

逐左顶点 DFS 增广 O(n1·m+n1·n2) 时间，邻接表与访问/匹配数组 O(n1+n2+m) 空间。

## 完成清单

- [ ] 所有 20 个测试点通过，达到 100 分。
- [ ] 输出符合题面约定，未将样例结果写死。
- [ ] 能手工复现一个边界场景和一个易错反例。
- [ ] 能解释所用数据结构、状态更新与复杂度。

## 思考与复盘

1. 本题最容易遗漏的约束是什么？

::: details 参考思路
遇到已匹配右顶点时需要尝试为原左顶点重新配对；每次增广都必须重置访问标记。
:::

2. 如何证明程序并非只对样例有效？

::: details 参考思路
先按上表选取与样例结构不同的边界和反例，手算答案，再运行单测试点。最后改变规模，检查时间和空间是否符合复杂度分析。测试设计与独立答案核对见[全章测试规范](../../../../content/chapter-07-graph-traversal/00-exercise-guide.md#测试与独立核验)。
:::
