---
title: "第 10 章 排序"
description: "掌握 O(n²) 与 O(n log n) 两类比较排序、稳定性与复杂度下界，以及突破下界的基数排序。"
order: 0
chapter: 10
chapterTitle: "排序"
updated: "2026-08-12"
contributors: ["Azen"]
status: "draft"
---

# 第 10 章 排序

排序是数据结构课程的收官主题：它把前面所有章节的结构（数组、树、堆）串起来，也引出算法分析的核心问题——**一个问题的下界是多少**。

## 本章定位

前面章节反复用到"有序"：二分查找要求有序，BST 的中序有序，Dijkstra 依赖优先队列。本章回答三个问题：怎么把数据排好序？每种方法的代价是多少？"最快"能快到什么程度？比较排序存在 $\Omega(n \log n)$ 的下界，而基数排序跳出"比较"的框架，揭示了问题本身比方法更重要的分析视角。

## 学习目标

完成本章后，你应该能够：

- 实现插入、冒泡、选择三种 $O(n^2)$ 排序，说出它们的稳定性差异；
- 实现归并排序与快速排序，分析平均与最坏复杂度；
- 用决策树论证比较排序的 $\Omega(n \log n)$ 下界；
- 实现堆排序与基数排序，说出各自突破"下界"的方式；
- 针对数据规模、初始顺序与内存约束选择排序算法。

## 本章文章如何分工

第 10 章拆成两部分：Ch.10「基础排序算法」覆盖插入、选择、冒泡、希尔四种基础方法；Ch.11「高效排序与外部排序」覆盖归并、快排、堆以及计数、桶、基数这些高效与非比较方法。

| 学习问题 | 对应文章 | 完成后的可检查能力 |
| --- | --- | --- |
| 最简单的排序怎么做？ | [10.1 插入排序](./01-insertion-sort.md)、[10.2 选择排序](./02-selection-sort.md)、[10.3 冒泡排序](./03-bubble-sort.md) | 能实现三种 $O(n^2)$ 排序并分析稳定性 |
| 插入排序能再快一点吗？ | [10.4 希尔排序](./04-shell-sort.md) | 能实现希尔排序并解释复杂度对增量序列的依赖 |
| 如何达到比较下界？ | [11.1 归并排序](../chapter-11-advanced-sort/01-merge-sort.md)、[11.2 快速排序](../chapter-11-advanced-sort/02-quick-sort.md)、[11.3 堆排序](../chapter-11-advanced-sort/03-heap-sort.md) | 能实现 $O(n\log n)$ 排序并比较各自代价 |
| 如何突破比较下界？ | [11.4 计数排序](../chapter-11-advanced-sort/04-counting-sort.md)、[11.5 桶排序](../chapter-11-advanced-sort/05-bucket-sort.md)、[11.6 基数排序](../chapter-11-advanced-sort/06-radix-sort.md) | 能实现非比较排序并说出各自前提 |

## 推荐学习顺序

1. 先学基础：从[10.1 插入排序](./01-insertion-sort.md)、[10.2 选择排序](./02-selection-sort.md)、[10.3 冒泡排序](./03-bubble-sort.md)开始，再到[10.4 希尔排序](./04-shell-sort.md)。
2. 再学高效：从[11.1 归并排序](../chapter-11-advanced-sort/01-merge-sort.md)、[11.2 快速排序](../chapter-11-advanced-sort/02-quick-sort.md)、[11.3 堆排序](../chapter-11-advanced-sort/03-heap-sort.md)开始。
3. 然后学非比较：[11.4 计数排序](../chapter-11-advanced-sort/04-counting-sort.md)、[11.5 桶排序](../chapter-11-advanced-sort/05-bucket-sort.md)、[11.6 基数排序](../chapter-11-advanced-sort/06-radix-sort.md)。
4. 最后完成配套 Lab：稳定性对比实验与多算法性能基准。

## 配套 Labs

- [Lab 10-01：排序稳定性对比](../../labs/chapter-10/lab-10-01-stability-compare/README.md)
- [Lab 10-02：排序性能基准](../../labs/chapter-10/lab-10-02-performance-benchmark/README.md)

## 学习建议

::: tip 排序是"选型"的考试
排序算法没有绝对最优：数据规模小用插入排序最快（常数小），内存紧张用堆排序（原地），要稳定用归并，数据随机且可递归用快排。学习时把"时间复杂度、稳定性、额外空间"三个维度做成表格反复对比。
:::

准备好后，从[10.1 插入排序](./01-insertion-sort.md)开始。
