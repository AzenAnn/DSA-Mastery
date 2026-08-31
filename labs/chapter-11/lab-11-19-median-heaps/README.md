---
title: "Lab 11-19：中位数（对顶堆）"
description: "用对顶堆把较小的一半和较大的一半分开维护，每次插入后即可 O(1) 取出前缀中位数。"
order: 19
chapter: 11
labId: "11E13"
chapterTitle: "高效排序与外部排序"
updated: "2026-08-29"
contributors: ["fjll-27"]
status: "draft"
lab: true
difficulty: "进阶"
duration: "30～45 分钟"
---

# Lab 11-19：中位数（对顶堆）

难度：进阶。题目原型为洛谷 [P1168 中位数](https://www.luogu.com.cn/problem/P1168)。本题的考点是**用对顶堆动态维护中位数**：大根堆存较小的一半，小根堆存较大的一半，中位数始终落在两个堆顶之间。

## 目标

完成本题后，你应该能够：

- 用「大根堆 + 小根堆」维护动态序列的中位数；
- 解释插入后如何平衡两个堆的大小关系；
- 在 `O(1)` 时间内取出当前前缀的中位数。

## 前置知识

- 11.1 堆与堆序性质；
- `std::priority_queue` 的大小根堆两种声明方式。

## 题目

读入 `n` 和 `n` 个整数，对每个**奇数长度**前缀（长度 `1, 3, 5, …, n`）输出该前缀的中位数，每行一个。

用对顶堆维护。

### 输入格式

- 第一行一个整数 `n`；
- 第二行 `n` 个整数，表示序列。

### 输出格式

对每个奇数长度前缀，输出一行一个整数，表示该前缀的中位数。

## 数据范围

| 项目 | 范围 |
| --- | --- |
| 序列长度 `n` | 1 ≤ n ≤ 10⁵ |
| 元素值 | −10⁹ ≤ a[i] ≤ 10⁹ |

## 样例

### 样例输入

```input
7
1 3 5 7 9 11 6
```

### 样例输出

```output
1
3
5
6
```

### 样例解释

- 前缀 `[1]` 的中位数是 `1`；
- 前缀 `[1, 3, 5]` 的中位数是 `3`；
- 前缀 `[1, 3, 5, 7, 9]` 的中位数是 `5`；
- 前缀 `[1, 3, 5, 7, 9, 11, 6]` 的中位数是 `6`。

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
pnpm lab:run -- labs/chapter-11/lab-11-19-median-heaps
pnpm lab:score -- labs/chapter-11/lab-11-19-median-heaps
```

标准输出参与判题，调试信息请写入标准错误。

## 完成清单

- [ ] 样例输出与题目一致
- [ ] 单元素、逆序、含重复值、含负值四种情况都通过
- [ ] 能说清插入后两个堆大小如何平衡、中位数为何是 `big.top()`

## 思考题

1. 若题目要求输出偶数长度前缀的下中位数，代码需要改哪里？
2. 维护中位数时，为什么两个堆的大小差最多为 1？

## 题解

<details>
<summary>点击查看题解</summary>

### 思路

维护两个堆：

- `big`：大根堆，保存较小的一半；
- `small`：小根堆，保存较大的一半。

插入 `x` 时，若 `big` 为空或 `x <= big.top()` 则放入 `big`，否则放入 `small`。随后平衡两个堆的大小：

- `big.size() > small.size() + 1`：把 `big.top()` 移到 `small`；
- `big.size() < small.size()`：把 `small.top()` 移到 `big`。

当前缀长度为奇数时，`big.size() == small.size() + 1`，中位数即 `big.top()`。

### 复杂度分析

- 每次插入 / 平衡：`O(log n)`；
- 总时间复杂度：`O(n log n)`；
- 空间复杂度：`O(n)`。

</details>
