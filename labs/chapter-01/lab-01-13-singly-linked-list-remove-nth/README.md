---
title: "Lab 01-13：删除单链表倒数第 k 个节点"
description: "用快慢指针一次遍历找到并删除单链表的倒数第 k 个节点。"
order: 13
chapter: 1
chapterTitle: "线性表"
updated: "2026-08-17"
contributors: ["czjLUCK"]
status: "draft"
lab: true
difficulty: "入门～进阶"
duration: "25～40 分钟"
---

# Lab 01-13：删除单链表倒数第 k 个节点

给定一个单链表和一个整数 `k`，删除该链表的**倒数第 `k` 个节点**。例如链表 `1 → 2 → 3 → 4 → 5` 中，删除倒数第 `2` 个节点后变为 `1 → 2 → 3 → 5`。

## 题目

### 删除倒数第 k 个节点

删除单链表中从尾部数第 `k` 个节点，并输出删除后的链表。

### 任务要求

1. 从标准输入读入 `n`（链表长度）、链表元素序列和 `k`；
2. **只遍历一次链表**，定位并删除目标节点；
3. 输出删除后的链表节点值序列。

## 输入格式

- 第一行：一个整数 `n`，表示链表长度；
- 第二行：`n` 个整数，按从头到尾顺序给出链表节点值；
- 第三行：一个整数 `k`。

## 输出格式

- 一行若干个整数，为删除后的链表节点值序列；
- 若删除后链表为空，输出一个空行；
- 相邻整数之间用**单个空格**分隔，行末不要有多余空格。

## 数据范围与限制

| 项目 | 范围 |
| --- | --- |
| 链表长度 `n` | 0 ≤ n ≤ 10⁵ |
| k | 1 ≤ k ≤ n |
| 节点值 | −10⁹ ≤ 值 ≤ 10⁹ |
| 时间复杂度要求 | O(n)，只能遍历一次 |
| 额外空间限制 | O(1)，仅允许常数级指针变量 |

## 样例

### 样例输入 1

```input
5
1 2 3 4 5
2
```

### 样例输出 1

```output
1 2 3 5
```

### 样例输入 2

```input
4
1 2 3 4
4
```

### 样例输出 2

```output
2 3 4
```

### 样例输入 3

```input
1
42
1
```

### 样例输出 3

```output

```

（输出一个空行）

### 样例解释

以样例 1 为例，链表 `1 → 2 → 3 → 4 → 5`，删除倒数第 2 个（即节点 4）：

1. 创建哑节点 `dummy`，`dummy → 1 → 2 → 3 → 4 → 5`；
2. `fast` 先走 `k+1=3` 步，到达节点 3；
3. `slow` 从 `dummy` 出发，快慢一起走：
   - `fast=3, slow=dummy`
   - `fast=4, slow=1`
   - `fast=5, slow=2`
   - `fast=null, slow=3`
4. `slow` 停在节点 3，即待删节点 4 的前驱；
5. `slow->next = slow->next->next`，跳过节点 4；
6. 返回 `dummy->next`，链表变为 `1 → 2 → 3 → 5`。

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
pnpm lab:doctor -- labs/chapter-01/lab-01-13-singly-linked-list-remove-nth
pnpm lab:run -- labs/chapter-01/lab-01-13-singly-linked-list-remove-nth
pnpm lab:run -- labs/chapter-01/lab-01-13-singly-linked-list-remove-nth --case sample
pnpm lab:score -- labs/chapter-01/lab-01-13-singly-linked-list-remove-nth
```

`make run` 在答案尚未全对时仍正常返回，避免 Make 把学习结果显示成工具故障；`make score` 是严格入口，只有 100 分才返回成功。标准输出参与判题，调试信息请写入标准错误。

- [ ] 样例输入与输出完全一致
- [ ] 三组边界自测通过
- [ ] 程序只遍历一次链表
- [ ] 能解释为什么哑节点能统一处理"删除头节点"的边界情况

## 思考题

1. 如果不使用哑节点，删除头节点时需要多少分支判断？这些分支会带来什么风险？
2. 如果要找到"倒数第 k 个节点"而不删除它，快慢指针的终止条件需要改变吗？

## 题解

<details>
<summary>点击查看题解</summary>

### 思路

**快慢指针 + 哑节点**一次遍历完成删除。

快指针先走 `k` 步，然后快慢一起走。快指针到达链表末尾时，慢指针正好在待删节点的前驱。使用哑节点可以统一处理删除头节点的情况。

### 算法步骤

1. 创建哑节点 `dummy`，`dummy->next = head`；
2. `fast = dummy`，先走 `k + 1` 步（包含哑节点）；
3. `slow = dummy`，快慢一起走，直到 `fast == nullptr`；
4. 此时 `slow` 指向待删节点的前驱，`slow->next = slow->next->next`；
5. 返回 `dummy->next`。

### 复杂度分析

- **时间复杂度**：`O(n)`，只遍历一次链表。
- **空间复杂度**：`O(1)`，仅使用常数个指针。

### 边界注意

- `k = n`（删除头节点）：哑节点确保逻辑统一；
- `n = 1, k = 1`：删除后链表为空，返回空指针。

</details>

