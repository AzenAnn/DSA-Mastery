---
title: "Lab 11-E-10：堆排序模板"
description: "利用堆维护未排序元素的最小值，把堆排序写成模板：每次取堆顶即得到当前最小元素。"
order: 16
chapter: 11
labId: "11E10"
chapterTitle: "高效排序与外部排序"
updated: "2026-08-29"
contributors: ["fjll-27"]
status: "draft"
lab: true
difficulty: "基础"
duration: "20～30 分钟"
---

# Lab 11-E-10：堆排序模板

难度：基础。题目原型为洛谷 [T625390 堆排序](https://www.luogu.com.cn/problem/T625390)（私题，题面自定）。本题的考点是**用堆完成排序**：把所有元素入堆，再不断取出堆顶，即可按从小到大依次得到有序序列。

## 目标

完成本题后，你应该能够：

- 用 `std::priority_queue` 或手写小根堆完成一次排序；
- 解释为什么「入堆 + 反复取堆顶」等价于堆排序；
- 说出堆排序的时间复杂度 `O(n log n)` 与空间开销。

## 前置知识

- 11.1 归并排序、快速排序等比较排序的基本思路；
- 堆（完全二叉树）与堆序性质：小根堆中父节点不大于子节点。

## 题目

读入 `n` 和 `n` 个整数，用堆排序（手写堆或 `std::priority_queue` 均可）把它们**从小到大**输出到一行。

### 输入格式

- 第一行一个整数 `n`；
- 第二行 `n` 个整数，表示待排序序列。

### 输出格式

一行 `n` 个整数，从小到大排列，数与数之间用空格分隔。

## 数据范围

| 项目 | 范围 |
| --- | --- |
| 序列长度 `n` | 1 ≤ n ≤ 10⁵ |
| 元素值 | −10⁹ ≤ a[i] ≤ 10⁹ |

## 样例

### 样例输入

```input
5
4 2 4 5 1
```

### 样例输出

```output
1 2 4 4 5
```

### 样例解释

把 `4 2 4 5 1` 依次入小根堆，再依次弹出堆顶，得到 `1 2 4 4 5`。

## 如何验证

先安装 Node.js、pnpm 和支持 C++17 的编译器。

```powershell
# 已进入本 Lab 目录
make doctor
make run
make run CASE=001-sample
make interactive
make score
```

Windows 没有安装 Make 时，在仓库根目录使用等价的 pnpm 入口：

```powershell
pnpm lab:run -- labs/chapter-11/exercise/E-11-10-heap-sort-template
pnpm lab:score -- labs/chapter-11/exercise/E-11-10-heap-sort-template
```

标准输出参与判题，调试信息请写入标准错误。

## 完成清单

- [ ] 样例输出与题目一致
- [ ] 单元素、逆序、含重复值三种情况都通过
- [ ] 能说出堆排序与快速排序时间复杂度的异同

## 思考题

1. `std::priority_queue` 默认是大根堆，要用它排升序时应该怎么做？
2. 堆排序是稳定的吗？为什么？

## 题解

<details>
<summary>点击查看题解</summary>

### 思路

有两种写法：

- **手写堆**：先把数组建成小根堆（`buildHeap`），再反复把堆顶交换到末尾并 `siftDown`；
- **`std::priority_queue`**：声明 `priority_queue<int, vector<int>, greater<int>>` 得到小根堆，全部入堆后不断输出 `top()` 并 `pop()`。

### 复杂度分析

- 时间复杂度：`O(n log n)`；
- 空间复杂度：`O(n)`（堆存储）。

</details>
