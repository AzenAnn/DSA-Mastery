---
title: "第 12 章 分治与递归"
description: "把大问题拆成小问题，再合并答案。学习递归建模、分治步骤与复杂度分析。"
order: 0
chapter: 12
chapterTitle: "分治与递归"
updated: "2026-09-02"
contributors: ["Zhangyf0325"]
status: "draft"
---

# 第 12 章 分治与递归

## 本章定位

你已经完成了很多数据结构的基础与查找、排序基础知识，本章把“将问题结构化分解”这一能力前移到算法设计中。
递归和分治是算法设计的共同语言：递归描述了“问题自我相似”的求解方式，分治强调“分开处理再合并”。

大学课程中这两者非常关键，尤其在 408 的高级课程里，几乎所有高复杂度算法都会回到这个思路上来。

## 学习目标

本章结束后，你应该能够：

- 清晰定义递归函数并给出正确的基准条件；
- 建立分治模型：Divide-Conquer-Combine；
- 用递归树或主定理分析时间复杂度；
- 用归纳或替换法说明递归正确性；
- 判断何时应选递归/分治，何时该退回到迭代、动态规划或回溯；
- 完成 2 组理论选择题自测与 13 个可自动评分的 C++17 实验，并能用解析和测试反例检查边界错误。

## 学习路线

1. [递归基础与调用语义](./01-recursion-foundations.md)：理解递归函数的五个核心问题（输入、输出、边界、递进和返回）。
2. [分治模式与典型路径](./02-divide-and-conquer-patterns.md)：用“分解-解决-合并”理解问题重构。
3. [正确性与复杂度分析](./03-correctness-complexity.md)：递归公式、递归树、主定理与归纳。
4. [边界与方法选择](./04-boundaries-with-other-strategies.md)：对比递归、DP、迭代、回溯的适用场景。

## 本章理论自测

| Lab | 题量 | 核心能力 |
| --- | --- | --- |
| [12T01 · 递归基础与分治思想](../../labs/chapter-12/theory/T-12-01-recursion-foundations-quiz/README.md) | 10 题 | 递归边界、调用栈、记忆化、汉诺塔与分治模型 |
| [12T02 · 典型分治算法](../../labs/chapter-12/theory/T-12-02-divide-conquer-applications-quiz/README.md) | 10 题 | 主定理、归并排序、快速排序及综合分治分析 |

两组测验均为四选一题。提交后会显示答案、推导与提示，适合在开始编程 Lab 前诊断概念漏洞，也适合完成本章后的集中复习。

## 本章 13 个编程 Lab

| 阶段 | Lab | 核心能力 |
| --- | --- | --- |
| 递归入门 | [12E01 · 汉诺塔](../../labs/chapter-12/exercise/E-12-01-hanoi-recursion/README.md) | 定义递归过程与输出调用轨迹 |
| 标准分治 | [12E02 · 最大子数组和](../../labs/chapter-12/exercise/E-12-02-maximum-subarray/README.md) | 合并左、右、跨中点三类答案 |
| 归并应用 | [12E03 · 逆序对计数](../../labs/chapter-12/exercise/E-12-03-inversion-count/README.md) | 在合并阶段批量统计 |
| 递归优化 | [12E04 · 爬楼梯](../../labs/chapter-12/exercise/E-12-04-stair-climbing/README.md) | 比较朴素递归与记忆化调用次数 |
| 区间递归 | [12E05 · 递归折半查找](../../labs/chapter-12/exercise/E-12-05-recursive-binary-search/README.md) | 维护闭区间语义和重复值边界 |
| 规模减半 | [12E06 · 快速幂](../../labs/chapter-12/exercise/E-12-06-fast-power/README.md) | 把线性递归降为对数深度 |
| 标准分治 | [12E07 · 归并排序](../../labs/chapter-12/exercise/E-12-07-merge-sort/README.md) | 完整实践 Divide–Conquer–Combine |
| 划分递归 | [12E08 · 快速排序](../../labs/chapter-12/exercise/E-12-08-quicksort/README.md) | 维护 partition 不变量 |
| 单侧递归 | [12E09 · 第 K 大元素](../../labs/chapter-12/exercise/E-12-09-kth-largest-quickselect/README.md) | 只递归目标所在一侧 |
| 结构递归 | [12E10 · 合并两个有序链表](../../labs/chapter-12/exercise/E-12-10-merge-two-sorted-lists/README.md) | 在返回阶段连接节点 |
| 候选合并 | [12E11 · 多数元素](../../labs/chapter-12/exercise/E-12-11-majority-element/README.md) | 合并并验证左右候选 |
| 多路分治 | [12E12 · 合并 K 个有序链表](../../labs/chapter-12/exercise/E-12-12-merge-k-sorted-lists/README.md) | 按链表数量二分，达到 O(N log K) |
| 结果集合 | [12E13 · 表达式所有可能结果](../../labs/chapter-12/exercise/E-12-13-different-ways-to-compute/README.md) | 分割表达式并组合左右结果 |

每个 Lab 都提供可编译的学生 TODO、完整参考实现和至少 10 个公开测试。学生完成代码后，可以运行 `pnpm lab:score -- <Lab 路径>` 查看逐测试点得分。

::: intuition 递归思路的核心

递归并不是“先写再猜”，而是在数学上定义了一个可终止的函数：
先把规模为 `n` 的问题映射到规模更小的问题，再把子问题答案组装回去。

:::

## 小结

本章是“如何组织计算过程”的入口。递归让我们先表达过程，再分析复杂度，最后评估边界。后续到动态规划、图算法、搜索，你会反复使用本章的抽象能力。
