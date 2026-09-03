---
title: "分治模式：分解、解决与合并"
description: "掌握 Divide-Conquer 三步法，在实践中把递归结构转成可执行方案。"
order: 2
chapter: 12
chapterTitle: "分治与递归"
updated: "2026-09-02"
contributors: ["Zhangyf0325"]
status: "draft"
---

# 分治模式：分解、解决与合并

分治法把“一个复杂问题”转成“两个或多个同类子问题”，再把子问题结果拼起来。常见模板是：

- Divide：划分问题；
- Conquer：递归求解；
- Combine：合并解。

当子问题之间独立且结构同型时，分治更容易成立；如果子问题有交叠，通常要引入记忆化或动态规划。

## 二分搜索：最朴素的分治

虽然规模每次减半后只剩一边，但它也符合分治：先分区（与中点比较），再继续求解一侧，合并只是一位数返回。

## 归并排序：标准分治案例

归并排序的本质是：左半部有序、右半部有序后，把两条有序链合并。
这里 `Divide` 和 `Combine` 的成本都可清晰建模。

对应练习：[12E07 · 归并排序](../../labs/chapter-12/exercise/E-12-07-merge-sort/README.md)。

## 快速排序：合并几乎为空的分治

快速排序先用 `partition` 把数组划分成“小于枢轴、等于枢轴、大于枢轴”三段，再递归处理左右两段。与归并排序不同，主要工作发生在分解阶段，递归返回时不需要线性合并。

```cpp
void quickSort(std::vector<int>& a, int left, int right) {
    if (left >= right) return;
    int pivot = a[left + (right - left) / 2];
    int less = left, current = left, greater = right;

    while (current <= greater) {
        if (a[current] < pivot) std::swap(a[less++], a[current++]);
        else if (a[current] > pivot) std::swap(a[current], a[greater--]);
        else ++current;
    }

    quickSort(a, left, less - 1);
    quickSort(a, greater + 1, right);
}
```

三向划分能避免全相等数组不断产生规模为 `n-1` 的子问题。划分较均匀时递推式为 `T(n)=2T(n/2)+Θ(n)`，时间复杂度为 O(n log n)；持续极不均匀时最坏为 O(n²)。

对应练习：[12E08 · 快速排序](../../labs/chapter-12/exercise/E-12-08-quicksort/README.md)。

## 快速选择：只递归一侧

快速选择同样执行划分，但只继续处理包含目标下标的一侧。求第 `k` 大元素时，可将目标转换为升序下标 `n-k`。它的平均时间复杂度为 O(n)，最坏仍可能达到 O(n²)。

对应练习：[12E09 · 快速选择：第 K 大元素](../../labs/chapter-12/exercise/E-12-09-kth-largest-quickselect/README.md)。

## 汉诺塔与三元分治

汉诺塔看上去只有一个目标，但其过程天然是三个递归动作的嵌套：
1. 把上面 `n-1` 个盘子移到辅助柱；
2. 移动最底盘；
3. 再把 `n-1` 个盘子移到目标柱。

其时间复杂度递推是 `T(n)=2T(n-1)+1`。

## 归并计数类问题

逆序对计数在合并时顺手统计：左半部分和右半部分都已排好序，若右边一个元素比左边当前元素小，就形成一段连续的新逆序对。

这个“边处理边合并”的技巧在竞赛和工程里都很常见：不加一层额外循环，也能在 O(n log n) 里统计全局结果。

对应练习：[12E03 · 逆序对计数](../../labs/chapter-12/exercise/E-12-03-inversion-count/README.md)。

## 合并阶段决定答案形态

分治并不总是返回一个数：

- 最大子数组和合并左侧、右侧与跨中点三类候选；
- 多数元素合并左右候选，并统计它们在当前区间的出现次数；
- 合并 K 个有序链表把链表编号区间二分，再复用两链表合并；
- 表达式计算以每个运算符为分割点，把左右结果集合做笛卡尔积运算。

对应练习：

- [12E02 · 最大子数组和](../../labs/chapter-12/exercise/E-12-02-maximum-subarray/README.md)
- [12E11 · 多数元素](../../labs/chapter-12/exercise/E-12-11-majority-element/README.md)
- [12E12 · 合并 K 个有序链表](../../labs/chapter-12/exercise/E-12-12-merge-k-sorted-lists/README.md)
- [12E13 · 表达式的所有可能计算结果](../../labs/chapter-12/exercise/E-12-13-different-ways-to-compute/README.md)

::: pitfall 常见误区

分治中的 `Combine` 常被忽略。很多同学只会写子问题，却在合并阶段把复杂度带爆掉或结果丢失。

:::

## 练习

1. 写出归并排序在 `n=8` 的递归分解树。
2. 用一句话描述汉诺塔的递推关系。
3. 逆序对为什么不能在每层合并后用两个 for 做暴力统计（复杂度为什么会变？）。
4. 快速排序与快速选择都使用 partition，为什么前者递归两侧而后者只递归一侧？
5. 合并 K 个链表若从左到右依次合并，和按链表数量二分相比，最坏代价有何差异？
