---
title: "递归基础：定义、边界与调用栈"
description: "从函数定义到终止条件，完整学习递归设计与调用栈视角。"
order: 1
chapter: 12
chapterTitle: "分治与递归"
updated: "2026-09-02"
contributors: ["Zhangyf0325"]
status: "draft"
---

# 递归基础：定义、边界与调用栈

递归（Recursion）指在函数内部直接或间接调用自身。它的关键是：问题被映射为规模更小的同类问题，直到可直接返回。

## 一个可复用的递归设计模板

```cpp
Result solve(const Problem& problem) {
    if (isBaseCase(problem)) {
        return baseAnswer(problem);
    }

    std::vector<Problem> subproblems = decompose(problem);
    std::vector<Result> answers;

    for (const Problem& subproblem : subproblems) {
        answers.push_back(solve(subproblem));
    }

    return combine(answers);
}
```

要点有 4 个：

- 输入参数必须完整描述子问题；
- 基准条件必须能直接给出结果；
- 每次递归必须缩小问题规模；
- 返回值要能被上层直接使用。

::: warning 递归安全性第一原则

如果基准条件写错，最常见是两个问题：要么栈无限增长导致溢出，要么提前返回导致逻辑错误。
“能不能停”是递归是否成立的第一课。

:::

## 递归调用栈与空间复杂度

每次递归会进入一个新栈帧，保存参数、局部变量与返回点。

- 时间复杂度来自“函数被调用次数 × 单次调用代价”；
- 空间复杂度常见项之一是递归深度（最深栈长度）。

例如：
- 线性递归 `f(n)=f(n-1)+O(1)` 的深度是 O(n)；
- 对半递归 `f(n)=f(n/2)+O(1)` 的深度是 O(log n)。

## 经典问题中的递归视角

### 阶乘

`n! = n * (n-1)!`，递归基准 `n<=1`，是最小递归模型，常用于验证递归基准和返回路径。

### 二分搜索

每次只保留一半区间，不断缩小规模，是对“规模减半”递归的标准例子。若要求返回第一次出现的位置，找到目标后仍要递归检查左半区间。

```cpp
int firstOccurrence(const std::vector<int>& a, int target, int left, int right) {
    if (left > right) return -1;
    int mid = left + (right - left) / 2;
    if (a[mid] >= target) {
        int earlier = firstOccurrence(a, target, left, mid - 1);
        return earlier != -1 ? earlier : (a[mid] == target ? mid : -1);
    }
    return firstOccurrence(a, target, mid + 1, right);
}
```

对应练习：[12E05 · 递归折半查找](../../labs/chapter-12/exercise/E-12-05-recursive-binary-search/README.md)。

### 爬楼梯：重复子问题为什么昂贵

设 `ways(n)` 表示爬到第 `n` 级的方法数，则 `ways(n)=ways(n-1)+ways(n-2)`。朴素递归会反复计算同一个 `ways(k)`；记忆化数组让每个 `k` 只被完整求值一次。

自动测试不比较墙钟时间，因为机器负载会使时间结果不稳定；实验改为输出两种算法的递归调用次数，用确定性数据观察指数级与线性级差异。

对应练习：[12E04 · 爬楼梯：递归与记忆化](../../labs/chapter-12/exercise/E-12-04-stair-climbing/README.md)。

### 快速幂：递归也可以很快

当指数为偶数时，`a^n=(a^(n/2))^2`；指数为奇数时再乘一个 `a`。每次都把指数减半，因此递归深度为 O(log n)。

对应练习：[12E06 · 递归快速幂](../../labs/chapter-12/exercise/E-12-06-fast-power/README.md)。

### 链表上的递归返回

合并两个有序链表时，每次选择较小的头节点，并让它的 `next` 指向剩余两条链表的递归合并结果。空链表是自然边界，节点连接发生在递归返回阶段。

对应练习：[12E10 · 递归合并两个有序链表](../../labs/chapter-12/exercise/E-12-10-merge-two-sorted-lists/README.md)。

### 归并排序（预告）

前半段和后半段递归排序后再合并，天然是“递归+合并”的组合范式，后续章节会重点分析其代价。

## 小练习

1. 写出 `f(n)=f(n-1)+1` 的递归树，说明它的深度和总调用次数。
2. 改写一个“指数增长”的递归调用（如斐波那契）并分析其栈深度风险。
3. 为什么 `n==0` 与 `n==1` 常常同时出现为基准条件？你会选哪个更稳？
4. 为什么“实际运行时间”不适合作为公开判题输出？递归调用次数能替代观察什么性质？
