---
title: "Lab 01-20：静态链表合并两个有序表"
description: "用静态链表实现两个有序序列的合并，练习游标级别的链接拼接与边界处理。"
order: 20
chapter: 1
chapterTitle: "线性表"
updated: "2026-08-18"
contributors: ["czjLUCK"]
status: "draft"
lab: true
difficulty: "进阶"
duration: "35～50 分钟"
---

# Lab 01-20：静态链表合并两个有序表

给定两个用**静态链表**表示的有序序列，将它们合并成一个新的有序静态链表。两个输入链表都按升序排列，合并后的链表也必须按升序排列。

## 题目

### 静态链表合并两个有序表

读入两个静态链表的节点信息，通过修改游标完成合并，输出合并后的节点值序列。

### 任务要求

1. 从标准输入读入两个静态链表的节点池信息和头节点游标；
2. 通过修改 `next` 游标完成合并，不新建额外节点；
3. 输出合并后的有序节点值序列。

## 输入格式

- 第一行：一个整数 `n`，表示第一个链表的节点数；
- 接下来 `n` 行，每行两个整数 `data` 和 `next`：
  - `data`：节点值；
  - `next`：下一个节点的下标，`-1` 表示末尾；
- 下一行：一个整数 `head_a`，表示第一个链表的头节点下标；
- 下一行：一个整数 `m`，表示第二个链表的节点数；
- 接下来 `m` 行，每行两个整数 `data` 和 `next`；
- 最后一行：一个整数 `head_b`，表示第二个链表的头节点下标。

## 输出格式

- 一行 `n + m` 个整数，为合并后的升序节点值序列；
- 相邻整数之间用**单个空格**分隔，行末不要有多余空格。

## 数据范围与限制

| 项目 | 范围 |
| --- | --- |
| 链表 A 长度 `n` | 0 ≤ n ≤ 500 |
| 链表 B 长度 `m` | 0 ≤ m ≤ 500 |
| 节点值 | −10⁹ ≤ 值 ≤ 10⁹ |
| 时间复杂度要求 | O(n + m) |
| 额外空间限制 | O(1)，仅允许常数级辅助变量 |

## 样例

### 样例输入 1

```input
3
1 1
3 2
5 -1
0
3
2 1
4 2
6 -1
0
```

### 样例输出 1

```output
1 2 3 4 5 6
```

### 样例输入 2

```input
0
-1
2
1 1
2 -1
0
```

### 样例输出 2

```output
1 2
```

### 样例解释

以样例 1 为例，链表 A：`1 → 3 → 5`（`head_a=0`），链表 B：`2 → 4 → 6`（`head_b=0`，在另一数组中）：

| 步骤 | `pa` 指向 | `pb` 指向 | `slots[pa].data` | `slots[pb].data` | 较小者 | `tail->next` 更新 |
| --- | --- | --- | --- | --- | --- | --- |
| 初始 | 0 | 0 | 1 | 2 | — | `dummy` |
| 1 | 0 | 0 | 1 | 2 | A | `tail->next = 0`（A 的节点 1） |
| 2 | 1 | 0 | 3 | 2 | B | `tail->next = 0`（B 的节点 2） |
| 3 | 1 | 1 | 3 | 4 | A | `tail->next = 1`（A 的节点 3） |
| 4 | 2 | 1 | 5 | 4 | B | `tail->next = 1`（B 的节点 4） |
| 5 | 2 | 2 | 5 | 6 | A | `tail->next = 2`（A 的节点 5） |
| 6 | -1 | 2 | — | 6 | B | `tail->next = 2`（B 的节点 6） |

从 `dummy->next` 开始遍历，输出 `1 2 3 4 5 6`。

## 如何验证

先安装 Node.js、pnpm 和支持 C++17 的编译器。GNU Make 是首选入口，但不是强制依赖。

```powershell
# 已进入本 Lab 目录
make doctor
make run
make run CASE=001-sample
make interactive
make score
```

Windows 没有安装 Make 时，在仓库根目录使用完全相同的评分内核：

```powershell
pnpm lab:doctor -- labs/chapter-01/lab-01-20-static-linked-list-merge
pnpm lab:run -- labs/chapter-01/lab-01-20-static-linked-list-merge
pnpm lab:run -- labs/chapter-01/lab-01-20-static-linked-list-merge --case 001-sample
pnpm lab:score -- labs/chapter-01/lab-01-20-static-linked-list-merge
```

`make run` 在答案尚未全对时仍正常返回，避免 Make 把学习结果显示成工具故障；`make score` 是严格入口，只有 100 分才返回成功。标准输出参与判题，调试信息请写入标准错误。

- [ ] 样例输入与输出完全一致
- [ ] 四组边界自测通过
- [ ] 程序满足 O(n + m) 时间且只修改游标
- [ ] 能解释静态链表合并与动态链表合并的核心差异

## 思考题

1. 如果两个链表的节点存储在同一个数组池中，合并时是否需要注意游标冲突？如果分别存储在不同数组中呢？
2. 静态链表合并后，未被使用的节点槽位应如何处理？工程中常见的做法是什么？

## 题解

<details>
<summary>点击查看题解</summary>

### 思路

与动态链表合并逻辑相同，使用**游标**代替指针，逐次取两链表当前头的较小者接到结果尾部。

### 算法步骤

1. 创建虚拟头游标 `dummy = -1`，`tail = dummy`；
2. `pa = head_a`，`pb = head_b`；
3. 当 `pa != -1` 且 `pb != -1`：
   - 若 `slots[pa].data <= slots[pb].data`，`slots[tail].next = pa`，`pa = slots[pa].next`；
   - 否则 `slots[tail].next = pb`，`pb = slots[pb].next`；
   - `tail = slots[tail].next`；
4. 将剩余非空链表接上；
5. 从 `slots[dummy].next` 开始遍历输出。

### 复杂度分析

- **时间复杂度**：`O(n + m)`，每个节点只访问一次。
- **空间复杂度**：`O(1)`，仅使用常数个游标，复用原有节点。

### 边界注意

- 其中一个链表为空：直接输出另一个；
- 两个输入链表使用同一数组池时，注意游标不冲突。

</details>
<details>
<summary>点击查看参考代码</summary>

```cpp
#include <cstddef>
#include <iostream>
#include <vector>

struct Slot {
    long long data{};
    int next = -1;
};

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    std::size_t n = 0;
    std::cin >> n;
    std::vector<Slot> sa(n);
    for (std::size_t i = 0; i < n; ++i) std::cin >> sa[i].data >> sa[i].next;
    int head_a = -1;
    if (n > 0) std::cin >> head_a;

    std::size_t m = 0;
    std::cin >> m;
    std::vector<Slot> sb(m);
    for (std::size_t i = 0; i < m; ++i) std::cin >> sb[i].data >> sb[i].next;
    int head_b = -1;
    if (m > 0) std::cin >> head_b;

    std::vector<long long> result;
    int pa = head_a, pb = head_b;
    while (pa != -1 || pb != -1) {
        long long va = (pa != -1) ? sa[pa].data : (1LL << 60);
        long long vb = (pb != -1) ? sb[pb].data : (1LL << 60);
        if (va <= vb) {
            result.push_back(va);
            pa = sa[pa].next;
        } else {
            result.push_back(vb);
            pb = sb[pb].next;
        }
    }

    bool first = true;
    for (auto v : result) {
        if (!first) std::cout << ' ';
        std::cout << v;
        first = false;
    }
    std::cout << '\n';
}
```

</details>


