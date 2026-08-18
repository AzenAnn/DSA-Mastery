---
title: "Lab 01-15：双链表回文判断"
description: "利用双向链表可从两端同时遍历的特性，判断链表是否为回文序列。"
order: 15
chapter: 1
chapterTitle: "线性表"
updated: "2026-08-17"
contributors: ["czjLUCK"]
status: "draft"
lab: true
difficulty: "入门～进阶"
duration: "25～35 分钟"
---

# Lab 01-15：双链表回文判断

给定一个双向链表，判断它是否是**回文**。回文指从前往后读和从后往前读完全相同的序列。例如 `1 → 2 → 3 → 2 → 1` 是回文，`1 → 2 → 3 → 4 → 5` 不是。

## 题目

### 双链表回文判断

判断给定的双向链表是否为回文序列。

### 任务要求

1. 从标准输入读入链表长度和元素值；
2. 利用双向指针，从**首尾同时**向中间遍历进行比较；
3. 输出判断结果。

## 输入格式

- 第一行：一个整数 `n`，表示链表长度；
- 第二行：`n` 个整数，按从头到尾顺序给出链表节点值。

## 输出格式

- 输出一行：`YES` 表示是回文，`NO` 表示不是回文。

## 数据范围与限制

| 项目 | 范围 |
| --- | --- |
| 链表长度 `n` | 0 ≤ n ≤ 10⁵ |
| 节点值 | −10⁹ ≤ 值 ≤ 10⁹ |
| 时间复杂度要求 | O(n) |
| 额外空间限制 | O(1)，仅允许常数级指针变量 |

## 样例

### 样例输入 1

```input
5
1 2 3 2 1
```

### 样例输出 1

```output
YES
```

### 样例输入 2

```input
5
1 2 3 4 5
```

### 样例输出 2

```output
NO
```

### 样例输入 3

```input
0
```

### 样例输出 3

```output
YES
```

### 样例输入 4

```input
1
42
```

### 样例输出 4

```output
YES
```

### 样例解释

以样例 1 为例，链表 `1 → 2 → 3 → 2 → 1`：

| 轮次 | `left` 位置 | `left->val` | `right` 位置 | `right->val` | 比较结果 |
| --- | --- | --- | --- | --- | --- |
| 1 | 头节点 | 1 | 尾节点 | 1 | 相等，继续 |
| 2 | 节点 2 | 2 | 节点 4 | 2 | 相等，继续 |
| 3 | 节点 3 | 3 | 节点 3 | 3 | 相等，相遇 |

全部相等，返回 `YES`。若样例 2 的 `1 → 2 → 3 → 4 → 5`，第一轮 `left=1, right=5` 即不相等，直接返回 `NO`。

## 如何验证

先安装 Node.js、pnpm 和支持 C++17 的编译器。GNU Make 是首选入口，但不是强制依赖。

```powershell
# 已进入本 Lab 目录
make doctor
make run
make run CASE=sample
make interactive
make score
```

Windows 没有安装 Make 时，在仓库根目录使用完全相同的评分内核：

```powershell
pnpm lab:doctor -- labs/chapter-01/lab-01-15-doubly-linked-list-palindrome
pnpm lab:run -- labs/chapter-01/lab-01-15-doubly-linked-list-palindrome
pnpm lab:run -- labs/chapter-01/lab-01-15-doubly-linked-list-palindrome --case sample
pnpm lab:score -- labs/chapter-01/lab-01-15-doubly-linked-list-palindrome
```

`make run` 在答案尚未全对时仍正常返回，避免 Make 把学习结果显示成工具故障；`make score` 是严格入口，只有 100 分才返回成功。标准输出参与判题，调试信息请写入标准错误。

- [ ] 样例输入与输出完全一致
- [ ] 四组边界自测通过
- [ ] 程序满足 O(n) 时间且 O(1) 额外空间
- [ ] 能解释为什么单链表做回文判断通常需要 O(n) 额外空间或两遍遍历

## 思考题

1. 如果把这道题改成单链表，你有哪些方法可以判断回文？各自的时间与空间复杂度是什么？
2. 双向循环哨兵链表中，如何利用哨兵快速定位头尾节点？

## 题解

<details>
<summary>点击查看题解</summary>

### 思路

利用双向链表**既有 `next` 又有 `prev`** 的特性，从首尾同时向中间遍历，逐对比较。

### 算法步骤

1. `left = head`，`right = tail`；
2. 循环直到 `left == right` 或 `left->next == right`（偶数/奇数长度）：
   - 若 `left->val != right->val`，返回 `NO`；
   - `left = left->next`，`right = right->prev`；
3. 全部相等，返回 `YES`。

### 复杂度分析

- **时间复杂度**：`O(n)`，最多遍历半个链表。
- **空间复杂度**：`O(1)`，仅使用两个指针。

### 边界注意

- `n = 0`：空链表视为回文，返回 `YES`；
- `n = 1`：单个节点也是回文。

</details>

