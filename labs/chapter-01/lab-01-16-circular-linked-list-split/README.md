---
title: "Lab 01-16：循环链表拆分"
description: "将一个循环链表按长度均分为两个循环链表，练习循环结构的断开与重连。"
order: 16
chapter: 1
labId: "01E11"
chapterTitle: "线性表"
updated: "2026-08-18"
contributors: ["czjLUCK"]
status: "draft"
lab: true
difficulty: "进阶"
duration: "30～40 分钟"
---

# Lab 01-16：循环链表拆分

给定一个**单向循环链表**，将其拆分为两个循环链表。若原链表长度为 `n`：
- 当 `n` 为偶数时，两个新链表各含 `n/2` 个节点；
- 当 `n` 为奇数时，第一个链表含 `⌈n/2⌉` 个节点，第二个链表含 `⌊n/2⌋` 个节点。

两个新链表都必须是循环链表。

## 题目

### 循环链表拆分

将单向循环链表拆分为两个长度尽可能均等的循环链表。

### 任务要求

1. 从标准输入读入链表长度和元素值；
2. 将循环链表拆分为两个循环链表；
3. 依次输出两个链表的节点值序列。

## 输入格式

- 第一行：一个整数 `n`，表示链表长度；
- 第二行：`n` 个整数，按从头到尾顺序给出循环链表的节点值。

## 输出格式

- 第一行：第一个循环链表的节点值序列；
- 第二行：第二个循环链表的节点值序列；
- 每行相邻整数之间用**单个空格**分隔，行末不要有多余空格。

## 数据范围与限制

| 项目 | 范围 |
| --- | --- |
| 链表长度 `n` | 1 ≤ n ≤ 10⁵ |
| 节点值 | −10⁹ ≤ 值 ≤ 10⁹ |
| 时间复杂度要求 | O(n) |
| 额外空间限制 | O(1)，原地拆分，不新建大量节点 |

## 样例

### 样例输入 1

```input
6
1 2 3 4 5 6
```

### 样例输出 1

```output
1 2 3
4 5 6
```

### 样例输入 2

```input
5
1 2 3 4 5
```

### 样例输出 2

```output
1 2 3
4 5
```

### 样例输入 3

```input
1
42
```

### 样例输出 3

```output
42

```

（第二行为空行，表示第二个链表为空）

### 样例解释

以样例 1 为例，链表 `1 → 2 → 3 → 4 → 5 → 6 → (回到 1)`，`n=6`：

快慢指针找中点：
- 初始：`slow=1, fast=1`
- 第 1 步：`slow=2, fast=3`
- 第 2 步：`slow=3, fast=5`
- 第 3 步：`slow=4, fast=1`（绕完一圈，`fast` 回到起点）

此时 `slow=3` 为中点（第 3 个节点）。

- `second_head = slow->next = 4`
- `slow->next = head`（`3->next = 1`，前半段闭合）
- 找到原链表尾节点（`second_head` 的前驱，即节点 6），使其指向 `second_head`（`6->next = 4`，后半段闭合）

结果：链表 A：`1 → 2 → 3 → (回到 1)`；链表 B：`4 → 5 → 6 → (回到 4)`。

## 如何验证

先安装 Node.js、pnpm 和支持 C++17 的编译器。GNU Make 是首选入口，但不是强制依赖。

```powershell
# 已进入本 Lab 目录
make doctor
make run
make run CASE=001-sample-even
make interactive
make score
```

Windows 没有安装 Make 时，在仓库根目录使用完全相同的评分内核：

```powershell
pnpm lab:doctor -- labs/chapter-01/lab-01-16-circular-linked-list-split
pnpm lab:run -- labs/chapter-01/lab-01-16-circular-linked-list-split
pnpm lab:run -- labs/chapter-01/lab-01-16-circular-linked-list-split --case 001-sample-even
pnpm lab:score -- labs/chapter-01/lab-01-16-circular-linked-list-split
```

`make run` 在答案尚未全对时仍正常返回，避免 Make 把学习结果显示成工具故障；`make score` 是严格入口，只有 100 分才返回成功。标准输出参与判题，调试信息请写入标准错误。

- [ ] 样例输入与输出完全一致
- [ ] 四组边界自测通过
- [ ] 两个结果都是循环链表（遍历时不会无限循环）
- [ ] 能画出拆分时链接修改前后的结构变化

## 思考题

1. 如果用双向循环链表拆分，操作会比单向循环链表更简单还是更复杂？为什么？
2. 拆分时为什么要先保存 `second_head` 再断开链接？如果顺序反过来会发生什么？

## 题解

<details>
<summary>点击查看题解</summary>

### 思路

使用**快慢指针**找中间节点，然后断开循环链表为两个独立的循环链表。

- 慢指针每次走一步，快指针每次走两步；
- 快指针绕完一圈时，慢指针恰好在中点。

### 算法步骤

1. 若 `n <= 1`，第二个链表为空；
2. 快慢指针找中点：`slow` 走一步，`fast` 走两步；
3. 记录 `second_head = slow->next`；
4. `slow->next = head`（前半段闭合为循环链表）；
5. 找到原链表尾节点（即 `second_head` 的前驱），使其指向 `second_head`（后半段闭合）；
6. 分别输出两个循环链表的节点值。

### 复杂度分析

- **时间复杂度**：`O(n)`，快慢指针遍历一遍。
- **空间复杂度**：`O(1)`，原地拆分，不新建节点。

### 边界注意

- `n = 1`：第二个链表为空，输出空行；
- 断开前必须先保存 `second_head`，否则找不到后半段起点。

</details>
<details>
<summary>点击查看参考代码</summary>

```cpp
#include <cstddef>
#include <iostream>

struct Node {
    long long value{};
    Node* next = nullptr;
};

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    std::size_t n = 0;
    std::cin >> n;

    if (n == 0) {
        std::cout << "\n\n";
        return 0;
    }

    Node* head = nullptr;
    Node* tail = nullptr;
    for (std::size_t i = 0; i < n; ++i) {
        long long v = 0;
        std::cin >> v;
        Node* node = new Node{v, nullptr};
        if (!head) head = tail = node;
        else { tail->next = node; tail = node; }
    }
    tail->next = head;

    if (head->next == head) {
        std::cout << head->value << "\n\n";
        return 0;
    }

    Node* slow = head;
    Node* fast = head;
    while (fast->next != head && fast->next->next != head) {
        fast = fast->next->next;
        slow = slow->next;
    }
    if (fast->next->next == head) {
        fast = fast->next;
    }

    Node* head1 = head;
    Node* head2 = slow->next;

    slow->next = head1;
    fast->next = head2;

    auto print_circle = [](Node* h) {
        bool first = true;
        Node* p = h;
        do {
            if (!first) std::cout << ' ';
            std::cout << p->value;
            first = false;
            p = p->next;
        } while (p != h);
        std::cout << '\n';
    };

    print_circle(head1);
    print_circle(head2);
}
```

</details>


