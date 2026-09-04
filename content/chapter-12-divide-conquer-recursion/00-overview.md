---
title: "第 12 章：从自相似问题到分治框架"
description: "先建立可验证的递归契约，再学习 Divide–Conquer–Combine、正确性证明与复杂度分析。"
order: 0
chapter: 12
chapterTitle: "分治与递归"
updated: "2026-09-04"
contributors: ["Zhangyf0325", "Azen"]
status: "draft"
---

# 第 12 章：从自相似问题到分治框架

递归最容易给人一种错觉：函数“神奇地调用自己”，答案就出现了。真正可靠的理解恰好相反——递归不是魔法，而是一份严格的函数合同：**当前调用承诺解决什么问题，何时能直接回答，交给下一层的任务为什么更小，返回后如何得到当前答案。**

分治建立在这份合同之上。它选择若干个相对独立的子问题，分别求解，再在合并阶段恢复原问题的答案。归并排序、快速选择、四叉树、棋盘覆盖和归并计数外观不同，却都能用同一张设计图来解释。

::: definition 定义 · 递归

<dfn>递归</dfn>是用同一个问题的更小实例定义当前实例的计算方式。一个完整递归必须同时给出基本情况、规模递减规则和返回阶段的组合规则。

:::

::: definition 定义 · 分治

<dfn>分治</dfn>把规模为 $n$ 的问题拆成若干个规模更小、结构相同或相近的子问题，独立求解后合并答案。其骨架是 **Divide → Conquer → Combine**。

:::

## 本章结束时你应当做到

- 用一句完整的话定义递归函数的参数与返回值；
- 为递归写出覆盖最小规模的基本情况，并证明每条路径都会到达它；
- 区分“递归是一种表达机制”和“分治是一种算法策略”；
- 找出分治算法真正的工作量位于拆分、子调用还是合并；
- 用数学归纳法证明递归正确性，用递归树或主定理估算复杂度；
- 判断问题更适合递归、迭代、动态规划、回溯还是其他方法；
- 在 C++17 中处理区间边界、递归深度、整数溢出与确定性输出。

## 先建立一张全章地图

| 层次 | 核心问题 | 对应文章 |
| --- | --- | --- |
| 表达 | 当前调用究竟承诺什么？ | [递归建模：函数契约、边界与规模递减](./01-recursion-contracts.md) |
| 执行 | 调用时保存了什么，返回时发生了什么？ | [递与归：调用栈、递归树和迭代改写](./02-call-stack-and-iteration.md) |
| 设计 | 怎样从题意得到 Divide–Conquer–Combine？ | [分治建模：Divide–Conquer–Combine](./03-divide-conquer-modeling.md) |
| 组合 | 为什么很多分治题难在 Combine？ | [合并答案：分治算法真正困难的部分](./04-combine-patterns.md) |
| 证明 | 程序为什么终止，答案为什么正确？ | [递归算法的终止性与正确性证明](./05-recursive-correctness.md) |
| 分析 | 递推式怎样变成时间复杂度？ | [从递推式到复杂度：递归树与主定理](./06-recurrence-complexity.md) |
| 选择 | 什么时候不该使用递归或分治？ | [方法选择：递归、分治、迭代、DP 与回溯](./07-strategy-boundaries.md) |

::: intuition 直觉 · 先假设子问题已正确，再完成当前层

读递归代码时，不要试图同时追踪所有调用。先相信更小规模的调用能履行合同，然后只问当前层三件事：传下去的参数对不对、规模是否真的变小、拿回子答案后是否正确组合。

这就是数学归纳法在代码中的对应物。

:::

## 一个贯穿示例：归并排序

对区间 `[left,right)` 排序，可以先把它平分成两个更短的区间：

1. Divide：取 `middle=(left+right)/2`；
2. Conquer：递归排好 `[left,middle)` 和 `[middle,right)`；
3. Combine：线性合并两个有序区间；
4. Base：区间长度不超过 1 时天然有序。

这里的递归契约是“函数返回时，指定半开区间已经有序”。只要两次子调用履行合同，当前层的正确性就集中在合并不变量：临时数组前缀始终是两段未处理元素中的最小若干个。

递推式为

$$
T(n)=2T(n/2)+\Theta(n),
$$

因此总时间为 $\Theta(n\log n)$。注意这个结论不是因为“用了递归”，而是因为共有对数层，每层合并总工作量为线性。

::: counterexample 反例 · 写了两个递归调用不等于分治

斐波那契朴素递归也会拆成 `fib(n-1)` 与 `fib(n-2)`，但两个子问题高度重叠，同一状态被反复计算。它更适合记忆化或迭代动态规划，而不是把指数递归当成高效分治。

:::

## 16 个 Lab 的训练梯度

### 第一阶段：递归合同与自相似结构

| Lab | 训练焦点 |
| --- | --- |
| [12E01 · Function](../../labs/chapter-12/exercise/E-12-01-function-memoization/README.md) | 多参数边界、定义域裁剪与记忆化 |
| [12E02 · 幂次方](../../labs/chapter-12/exercise/E-12-02-power-expression/README.md) | 输出型递归与规范字符串 |
| [12E03 · 南蛮图腾](../../labs/chapter-12/exercise/E-12-03-south-barbarian-totem/README.md) | 自相似图形与返回后组合 |
| [12E04 · Pow(x,n)](../../labs/chapter-12/exercise/E-12-04-pow-x-n/README.md) | 规模减半与负指数边界 |
| [12E05 · 赦免战俘](../../labs/chapter-12/exercise/E-12-05-pardon-prisoners/README.md) | 二维象限递归 |
| [12E06 · Secret Cow Code](../../labs/chapter-12/exercise/E-12-06-secret-cow-code/README.md) | 逆向映射下标，避免构造巨大对象 |

### 第二阶段：划分、结构与标准合并

| Lab | 训练焦点 |
| --- | --- |
| [12E07 · 求第 k 小的数](../../labs/chapter-12/exercise/E-12-07-kth-smallest-quickselect/README.md) | 三路划分与单侧递归 |
| [12E08 · Sort an Array](../../labs/chapter-12/exercise/E-12-08-sort-array-merge/README.md) | 归并排序的完整 D–C–C |
| [12E09 · Construct Quad Tree](../../labs/chapter-12/exercise/E-12-09-construct-quad-tree/README.md) | 区域判定与四叉结构 |
| [12E10 · 地毯填补](../../labs/chapter-12/exercise/E-12-10-carpet-tromino/README.md) | 用中心骨牌制造四个同构子问题 |
| [12E11 · 逆序对](../../labs/chapter-12/exercise/E-12-11-inversion-count/README.md) | 合并阶段批量统计跨区间关系 |
| [12E12 · Different Ways to Add Parentheses](../../labs/chapter-12/exercise/E-12-12-different-ways-add-parentheses/README.md) | 枚举最后运算并组合结果集合 |
| [12E13 · Beautiful Array](../../labs/chapter-12/exercise/E-12-13-beautiful-array/README.md) | 通过奇偶映射保持全局性质 |

### 第三阶段：归并计数进阶

| Lab | 训练焦点 |
| --- | --- |
| [12E14 · Reverse Pairs](../../labs/chapter-12/exercise/E-12-14-reverse-pairs/README.md) | 有序两半上的单调指针 |
| [12E15 · Count Smaller After Self](../../labs/chapter-12/exercise/E-12-15-count-smaller-after-self/README.md) | 携带原下标累计逐元素答案 |
| [12E16 · Count of Range Sum](../../labs/chapter-12/exercise/E-12-16-count-range-sum/README.md) | 前缀和变换与双边界计数 |

每个 Lab 都包含可编译但不满分的 starter、独立参考实现和 20 个公开测试点。Theory 与 Project 分类暂时保持空目录，不为填满导航制造占位内容。

## 学习时使用同一张检查卡

遇到任何递归题，先回答：

| 顺序 | 必答问题 |
| --- | --- |
| 1 | 函数参数精确描述了哪个子问题？ |
| 2 | 返回值或副作用承诺了什么？ |
| 3 | 最小合法规模是什么？基本情况是否覆盖它？ |
| 4 | 每个递归分支用什么度量证明规模严格减小？ |
| 5 | 子问题是否独立，是否存在大量重复？ |
| 6 | 返回阶段怎样组合？会不会漏、重或溢出？ |
| 7 | 递归深度和总调用数分别是多少？ |
| 8 | 是否需要确定输出顺序，或需要特殊判题？ |

::: pitfall 易错点 · 只看调用次数，不看每层工作量

`T(n)=2T(n/2)+O(1)` 与 `T(n)=2T(n/2)+O(n)` 都有两次半规模递归，但复杂度分别是 $O(n)$ 与 $O(n\log n)$。Combine 的成本是递推式不可缺少的一部分。

:::

## 自检

1. 递归和分治是否是同一个概念？
2. 为什么“子问题规模变小”必须用可比较的量明确表达？
3. 归并排序的正确性证明为什么可以只集中检查基本情况和合并？

::: details 参考答案

1. 不是。递归是函数通过更小实例定义自身的表达机制；分治是拆分独立子问题并合并的算法策略。分治常用递归实现，但也可以用显式栈或自底向上迭代。
2. 只有给出自然数度量并证明每次严格下降，才能排除某条调用路径无限继续，从而证明终止。
3. 归纳假设保证两个更短区间在子调用返回时已排序；当前层只需证明合并不会漏元素且保持有序，便能推出整个区间有序。

:::

## 参考与延伸

- [OI Wiki：分治](https://oi-wiki.org/basic/divide-and-conquer/)用于校验分治定义、二分规模与主定理入口。
- [Hello 算法：迭代与递归](https://www.hello-algo.com/chapter_computational_complexity/iteration_and_recursion/#3)提供调用、递归树和空间代价的直观解释。
- [Hello 算法：分治](https://www.hello-algo.com/chapter_divide_and_conquer/)展示分治问题的判断条件与常见应用。

外部资料用于校验概念边界；本章的教学顺序、示例、代码和测试均按本站课程合同独立组织。
