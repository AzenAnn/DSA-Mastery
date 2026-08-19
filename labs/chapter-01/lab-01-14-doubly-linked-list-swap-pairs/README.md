---
title: "Lab 01-14：双链表相邻节点交换"
description: "交换双向链表中每对相邻节点，重点练习双向链接的四条指针同步修改。"
order: 14
chapter: 1
chapterTitle: "线性表"
updated: "2026-08-18"
contributors: ["czjLUCK"]
status: "draft"
lab: true
difficulty: "进阶"
duration: "35～50 分钟"
---

# Lab 01-14：双链表相邻节点交换

给定一个双向链表，交换其中**每对相邻的节点**。如果链表长度为奇数，则最后一个节点保持原位。

例如：
- 输入 `1 → 2 → 3 → 4`，交换后变为 `2 → 1 → 4 → 3`；
- 输入 `1 → 2 → 3`，交换后变为 `2 → 1 → 3`。

## 题目

### 双链表相邻节点交换

按对交换双向链表中相邻节点的位置，通过修改链接完成，不允许只交换节点中的值。

### 任务要求

1. 从标准输入读入链表长度和元素值；
2. 通过修改 `prev` 和 `next` 指针完成交换；
3. 输出交换后的链表节点值序列。

## 输入格式

- 第一行：一个整数 `n`，表示链表长度；
- 第二行：`n` 个整数，按从头到尾顺序给出链表节点值。

## 输出格式

- 一行 `n` 个整数，为交换后的链表节点值序列；
- 相邻整数之间用**单个空格**分隔，行末不要有多余空格。

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
4
1 2 3 4
```

### 样例输出 1

```output
2 1 4 3
```

### 样例输入 2

```input
3
1 2 3
```

### 样例输出 2

```output
2 1 3
```

### 样例输入 3

```input
0
```

### 样例输出 3

```output

```

（输出一个空行）

### 样例解释

以样例 1 为例，链表 `1 → 2 → 3 → 4`：

交换节点 1 和 2 时，需要修改的链接：
- `dummy->next` 从 1 改为 2
- `2->prev` 从 `null` 改为 `dummy`
- `2->next` 从 3 改为 1
- `1->prev` 从 `dummy` 改为 2
- `1->next` 从 2 改为 3
- `3->prev` 从 2 改为 1

交换后链表变为 `2 → 1 → 3 → 4`。继续交换 3 和 4，最终得到 `2 → 1 → 4 → 3`。

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
pnpm lab:doctor -- labs/chapter-01/lab-01-14-doubly-linked-list-swap-pairs
pnpm lab:run -- labs/chapter-01/lab-01-14-doubly-linked-list-swap-pairs
pnpm lab:run -- labs/chapter-01/lab-01-14-doubly-linked-list-swap-pairs --case 001-sample
pnpm lab:score -- labs/chapter-01/lab-01-14-doubly-linked-list-swap-pairs
```

`make run` 在答案尚未全对时仍正常返回，避免 Make 把学习结果显示成工具故障；`make score` 是严格入口，只有 100 分才返回成功。标准输出参与判题，调试信息请写入标准错误。

- [ ] 样例输入与输出完全一致
- [ ] 四组边界自测通过
- [ ] 程序通过修改链接而非交换值完成交换
- [ ] 交换后能正向和反向遍历验证链表一致性

## 思考题

1. 如果这道题要求交换单链表的相邻节点，逻辑上有什么简化？有什么额外困难？
2. 双向循环哨兵链表中，哨兵节点在交换过程中需要参与链接修改吗？

## 题解

<details>
<summary>点击查看题解</summary>

### 思路

交换相邻节点 `A` 和 `B` 时，需要同时修改**六条链接**：`A` 的前驱、`B` 的后继、以及 `A` 和 `B` 互相指向的四条。使用哑节点统一处理头节点交换。

### 算法步骤

1. 创建哑节点 `dummy`，`dummy->next = head`；
2. `prev = dummy`，`curr = head`；
3. 循环直到 `curr == nullptr || curr->next == nullptr`：
   - `first = curr`，`second = curr->next`；
   - 保存 `next_pair = second->next`；
   - 修改链接：`prev->next = second`，`second->prev = prev`，`second->next = first`，`first->prev = second`，`first->next = next_pair`；
   - 若 `next_pair != nullptr`，`next_pair->prev = first`；
   - `prev = first`，`curr = next_pair`；
4. 返回 `dummy->next`。

### 复杂度分析

- **时间复杂度**：`O(n)`，遍历链表一次。
- **空间复杂度**：`O(1)`，仅使用常数个指针。

### 边界注意

- 奇数长度时最后一个节点不交换；
- 必须先保存 `second->next`，否则改链接后会断链。

</details>
<details>
<summary>点击查看参考代码</summary>

```cpp
#include <cstddef>
#include <iostream>
#include <vector>

struct Node {
    long long value{};
    Node* prev = nullptr;
    Node* next = nullptr;
};

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    std::size_t n = 0;
    std::cin >> n;

    Node* head = nullptr;
    Node* tail = nullptr;
    for (std::size_t i = 0; i < n; ++i) {
        long long v = 0;
        std::cin >> v;
        Node* node = new Node{v, tail, nullptr};
        if (!head) head = tail = node;
        else { tail->next = node; tail = node; }
    }

    Node* curr = head;
    while (curr && curr->next) {
        Node* a = curr;
        Node* b = curr->next;
        Node* p = a->prev;
        Node* s = b->next;

        b->prev = p;
        b->next = a;
        a->prev = b;
        a->next = s;

        if (p) p->next = b;
        else head = b;
        if (s) s->prev = a;

        curr = a->next;
    }

    bool first = true;
    for (Node* p = head; p; p = p->next) {
        if (!first) std::cout << ' ';
        std::cout << p->value;
        first = false;
    }
    std::cout << '\n';
}
```

</details>


