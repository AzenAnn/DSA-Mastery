---
title: "Lab 01-22：静态链表逆置"
description: "在不借助辅助数组的前提下，通过修改游标完成静态链表的逆置。"
order: 22
chapter: 1
chapterTitle: "线性表"
updated: "2026-08-17"
contributors: ["czjLUCK"]
status: "draft"
lab: true
difficulty: "进阶"
duration: "25～40 分钟"
---

# Lab 01-22：静态链表逆置

给定一个已构建好的**静态链表**（用游标数组表示），将其逻辑顺序逆置。例如原链表逻辑顺序为 `1 → 2 → 3 → 4`，逆置后变为 `4 → 3 → 2 → 1`。

## 题目

### 静态链表逆置

读入静态链表的节点信息，通过修改 `next` 游标完成逆置，输出逆置后的节点值序列。

### 任务要求

1. 从标准输入读入静态链表的节点池大小、各节点的数据和 next 游标、以及头节点游标；
2. 只修改 `next` 游标完成逆置，不允许借助辅助数组或重建节点；
3. 输出逆置后的节点值序列。

## 输入格式

- 第一行：一个整数 `n`，表示节点池中已使用的节点数（不含空闲节点）；
- 接下来 `n` 行，每行两个整数 `data` 和 `next`：
  - `data`：节点值；
  - `next`：下一个节点的下标，`-1` 表示链表末尾；
- 最后一行：一个整数 `head`，表示头节点在节点池中的下标。

## 输出格式

- 一行若干个整数，为逆置后从**新头节点到新尾节点**的节点值序列；
- 相邻整数之间用**单个空格**分隔，行末不要有多余空格。

## 数据范围与限制

| 项目 | 范围 |
| --- | --- |
| 节点数 `n` | 0 ≤ n ≤ 1000 |
| 节点值 | −10⁹ ≤ 值 ≤ 10⁹ |
| 时间复杂度要求 | O(n) |
| 额外空间限制 | O(1)，仅允许常数级辅助变量 |

## 样例

### 样例输入 1

```input
4
1 1
2 2
3 3
4 -1
0
```

### 样例输出 1

```output
4 3 2 1
```

### 样例输入 2

```input
1
42 -1
0
```

### 样例输出 2

```output
42
```

### 样例输入 3

```input
0
-1
```

### 样例输出 3

```output

```

（输出一个空行）

### 样例解释

以样例 1 为例，静态链表 `slots[0..3]` 逻辑顺序 `1 → 2 → 3 → 4`，`head=0`：

| 轮次 | `prev` | `curr` | `nxt` | `slots[curr].next` 修改后 | 逻辑链表状态 |
| --- | --- | --- | --- | --- | --- |
| 初始 | -1 | 0 | — | — | `0→1→2→3` |
| 1 | -1 | 0 | 1 | `slots[0].next = -1` | `0`（断开），剩余 `1→2→3` |
| 2 | 0 | 1 | 2 | `slots[1].next = 0` | `1→0`，剩余 `2→3` |
| 3 | 1 | 2 | 3 | `slots[2].next = 1` | `2→1→0`，剩余 `3` |
| 4 | 2 | 3 | -1 | `slots[3].next = 2` | `3→2→1→0` |

`curr=-1`，结束。新 `head=3`，遍历输出 `4 3 2 1`。

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
pnpm lab:doctor -- labs/chapter-01/lab-01-22-static-linked-list-reverse
pnpm lab:run -- labs/chapter-01/lab-01-22-static-linked-list-reverse
pnpm lab:run -- labs/chapter-01/lab-01-22-static-linked-list-reverse --case sample
pnpm lab:score -- labs/chapter-01/lab-01-22-static-linked-list-reverse
```

`make run` 在答案尚未全对时仍正常返回，避免 Make 把学习结果显示成工具故障；`make score` 是严格入口，只有 100 分才返回成功。标准输出参与判题，调试信息请写入标准错误。

- [ ] 样例输入与输出完全一致
- [ ] 三组边界自测通过
- [ ] 只修改了 next 游标，未交换 data 或重建节点
- [ ] 能说明静态链表逆置与动态单链表逆置在代码上的异同

## 思考题

1. 为什么静态链表的逆置代码结构和动态单链表几乎相同？本质区别在哪里？
2. 如果节点池中不只有链表节点（还有空闲节点），逆置时需要注意什么？

## 题解

<details>
<summary>点击查看题解</summary>

### 思路

与动态单链表逆置逻辑完全相同，只是将指针操作替换为**游标操作**。维护三个游标 `prev`、`curr`、`nxt`，逐轮修改 `slots[curr].next`。

### 算法步骤

1. 初始化 `prev = -1, curr = head`；
2. 循环直到 `curr == -1`：
   - `nxt = slots[curr].next`（保存后继游标）；
   - `slots[curr].next = prev`（反转游标指向）；
   - `prev = curr`（整体后移）；
   - `curr = nxt`；
3. 更新 `head = prev`（新头游标）。

### 复杂度分析

- **时间复杂度**：`O(n)`，遍历静态链表一次。
- **空间复杂度**：`O(1)`，仅使用常数个游标变量。

### 边界注意

- `n = 0`（`head = -1`）：直接输出空行；
- 必须先保存 `nxt` 再改 `slots[curr].next`。

</details>

