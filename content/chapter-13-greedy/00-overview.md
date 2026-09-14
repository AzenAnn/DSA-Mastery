---
title: "第 13 章 贪心算法"
description: "理解局部最优选择、最优子结构与贪心算法的正确性边界。"
order: 0
chapter: 13
chapterTitle: "贪心算法"
updated: "2026-09-08"
contributors: ["Shuoyuchen"]
status: "draft"
---
# 第 13 章 贪心算法

## 本章定位

严格来说，贪心算法并不是一种具体的算法，而是一类解题策略。面对一个需要多步决策的问题时，贪心方法在每一步都从**当前可行的候选项**中选择局部上最有利的选项，然后继续处理剩余问题。

如果问题具有合适的结构，这些局部选择可以累积成全局最优解；但==局部最优不自动等于全局最优==。学习贪心算法的重点，不只是记住“每次选最大的”或“每次选最小的”，还要说明选择为什么安全，以及它在什么条件下会失败。

## 学习目标

完成本章后，你应该能够：

- 解释贪心选择性质和最优子结构；
- 从候选项、可行性约束和优化目标中提炼贪心策略；
- 使用交换论证或归纳方法说明贪心选择的正确性；
- 构造反例，判断某个看似合理的贪心策略为什么失败；
- 区分贪心、动态规划和穷举搜索的适用边界。

## 学习路线

1. [贪心算法基础](./01-greedy-basics.md)：理解基本框架、两个关键性质和常见应用类型。
2. [经典问题](./02-classic-problems.md)：通过找零、活动选择、分数背包、Huffman 和图算法观察不同贪心规则。
3. [正确性证明](./03-correctness-proof.md)：学习如何判断策略是否可靠，并使用反例和交换论证完成证明。
4. [贪心与动态规划](./04-greedy-vs-dp.md)：比较两类方法的建模方式与适用条件。

## 配套 Lab

完成 [Lab 13-E-01：盛最多水的容器](../../labs/chapter-13/exercise/E-13-01-container-with-most-water/README.md)，把“移动短板”的贪心选择落实为可运行程序，并用边界测试检查面积与指针更新。

完成 [Lab 13-E-02：最长回文串](../../labs/chapter-13/exercise/E-13-02-longest-palindrome/README.md)，把“优先使用成对字符、保留一个中心字符”的贪心选择落实为可运行程序，并用测试检查奇偶计数与大小写区分。

完成 [Lab 13-E-03：跳跃游戏](../../labs/chapter-13/exercise/E-13-03-jump-game/README.md)，把“维护最远可达位置”的贪心选择落实为可运行程序，并用障碍与边界测试检查可达性判断。

完成 [Lab 13-E-04：分发饼干](../../labs/chapter-13/exercise/E-13-04-assign-cookies/README.md)，通过排序与双指针匹配，把最小可行饼干分给当前胃口最小的孩子。

完成 [Lab 13-E-05：无重叠区间](../../labs/chapter-13/exercise/E-13-05-non-overlapping-intervals/README.md)，按结束时间完成区间调度，从最多保留区间数推导最少删除数。

完成 [Lab 13-E-06：种花问题](../../labs/chapter-13/exercise/E-13-06-can-place-flowers/README.md)，在局部可行时立即种植，并检查相邻约束。

完成 [Lab 13-E-07：柠檬水找零](../../labs/chapter-13/exercise/E-13-07-lemonade-change/README.md)，维护零钱计数，并在 20 元找零时优先保留 5 元零钱。

完成 [Lab 13-E-08：K 次取反后最大化的数组和](../../labs/chapter-13/exercise/E-13-08-maximize-sum-after-k-negations/README.md)，通过排序与剩余次数奇偶性最大化总和。

完成 [Lab 13-E-09：买卖股票的最佳时机](../../labs/chapter-13/exercise/E-13-09-best-time-to-buy-and-sell-stock/README.md)，维护历史最低价格并在线更新单次交易收益。

完成 [Lab 13-E-10：卡车上的最大单元数](../../labs/chapter-13/exercise/E-13-10-maximum-units-on-a-truck/README.md)，按每箱单元数排序完成容量受限的装载。

完成 [Lab 13-E-11：跳跃游戏 II](../../labs/chapter-13/exercise/E-13-11-jump-game-ii/README.md)，按可达区间分层扩展，求到终点的最少跳数。

完成 [Lab 13-E-12：划分字母区间](../../labs/chapter-13/exercise/E-13-12-partition-labels/README.md)，用字符末次出现位置闭合尽可能多的片段。

完成 [Lab 13-E-13：根据身高重建队列](../../labs/chapter-13/exercise/E-13-13-queue-reconstruction-by-height/README.md)，按身高排序并在第 k 位插入。

完成 [Lab 13-E-14：分发糖果](../../labs/chapter-13/exercise/E-13-14-candy/README.md)，通过双向扫描同时满足左右相邻约束。

完成 [Lab 13-E-15：最低加油次数](../../labs/chapter-13/exercise/E-13-15-minimum-number-of-refueling-stops/README.md)，在燃料不足时从已过站点选择最大油量。

::: intuition 直觉 · 先做眼前最好的选择

贪心算法像是在每个路口都选择当前看起来最好的方向。真正困难的地方不是“如何选择”，而是证明这一步选择不会破坏最终的最优解。

:::

## 本章小结

贪心算法的核心不是“每次都选最大的”，而是：在明确可行性约束和优化目标后，找到一个能够安全执行的局部选择，并证明它不会破坏全局最优性。

后续专题会分别讨论算法框架、经典问题、正确性证明，以及贪心和动态规划的边界。
