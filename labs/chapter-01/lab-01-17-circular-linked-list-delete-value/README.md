---
title: "Lab 01-17：循环链表删除指定值"
description: "在循环链表中删除所有值为给定目标的节点，练习循环结构的遍历与删除边界。"
order: 17
chapter: 1
labId: "01E12"
chapterTitle: "线性表"
updated: "2026-08-18"
contributors: ["czjLUCK"]
status: "draft"
lab: true
difficulty: "进阶"
duration: "30～40 分钟"
---

# Lab 01-17：循环链表删除指定值

给定一个**单向循环链表**和一个整数 `x`，删除链表中**所有值等于 `x` 的节点**。删除后若链表非空，仍须保持循环性质；若全部删除，则输出空行。

## 题目

### 循环链表删除指定值

输入一个循环链表和一个目标值，删除所有匹配节点后输出剩余序列。

### 任务要求

1. 从标准输入读入链表长度、元素序列和目标值 `x`；
2. 使用循环链表完成删除；
3. 输出删除后的链表节点值序列（从第一个剩余节点开始，输出完整一圈）。

## 输入格式

- 第一行：一个整数 `n`，表示链表长度；
- 第二行：`n` 个整数，按从头到尾顺序给出循环链表的节点值；
- 第三行：一个整数 `x`，表示要删除的目标值。

## 输出格式

- 一行若干个整数，为删除后的循环链表节点值序列；
- 若全部删除，输出一个空行；
- 相邻整数之间用**单个空格**分隔，行末不要有多余空格。

## 数据范围与限制

| 项目 | 范围 |
| --- | --- |
| 链表长度 `n` | 1 ≤ n ≤ 10⁵ |
| 节点值和目标值 `x` | −10⁹ ≤ 值 ≤ 10⁹ |
| 时间复杂度要求 | O(n) |
| 额外空间限制 | O(1)，仅允许常数级指针变量 |

## 样例

### 样例输入 1

```input
5
1 2 3 2 4
2
```

### 样例输出 1

```output
1 3 4
```

### 样例输入 2

```input
4
5 5 5 5
5
```

### 样例输出 2

```output

```

（输出一个空行）

### 样例输入 3

```input
3
1 2 3
4
```

### 样例输出 3

```output
1 2 3
```

### 样例解释

以样例 1 为例，链表 `1 → 2 → 3 → 2 → 4 → (回到 1)`，删除值为 2 的节点：

使用哑节点 `dummy → 1 → 2 → 3 → 2 → 4 → (回到 1)`：

| 当前 `curr` | `curr->val` | 是否等于 2 | 操作 | 链表变化 |
| --- | --- | --- | --- | --- |
| 1 | 1 | 否 | `prev` 前移 | 无变化 |
| 2 | 2 | 是 | 删除，`prev->next` 指向 3 | `1 → 3 → 2 → 4` |
| 3 | 3 | 否 | `prev` 前移 | 无变化 |
| 2 | 2 | 是 | 删除，`prev->next` 指向 4 | `1 → 3 → 4` |
| 4 | 4 | 否 | `prev` 前移 | 无变化 |
| 回到 1 | 1 | 否 | 遍历结束 | — |

最终链表：`1 → 3 → 4 → (回到 1)`，输出 `1 3 4`。

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
pnpm lab:doctor -- labs/chapter-01/lab-01-17-circular-linked-list-delete-value
pnpm lab:run -- labs/chapter-01/lab-01-17-circular-linked-list-delete-value
pnpm lab:run -- labs/chapter-01/lab-01-17-circular-linked-list-delete-value --case 001-sample
pnpm lab:score -- labs/chapter-01/lab-01-17-circular-linked-list-delete-value
```

`make run` 在答案尚未全对时仍正常返回，避免 Make 把学习结果显示成工具故障；`make score` 是严格入口，只有 100 分才返回成功。标准输出参与判题，调试信息请写入标准错误。

- [ ] 样例输入与输出完全一致
- [ ] 能正确删除头节点、中间节点和尾节点
- [ ] 全部删除时输出空行
- [ ] 没有要删除的值时链表保持不变
- [ ] 程序满足 O(n) 时间且 O(1) 额外空间

## 思考题

1. 为什么循环链表的删除操作需要比单链表更注意终止条件？
2. 如果不使用哨兵节点，删除循环链表的头节点需要多少分支判断？

## 题解

<details>
<summary>点击查看题解</summary>

### 思路

使用**哑节点 + 循环遍历**删除所有值为 `x` 的节点。循环链表的终止条件不能用 `curr != nullptr`（否则无限循环），需要记录起始节点或利用 `curr->next == head` 判断。

### 算法步骤

1. 创建哑节点 `dummy`，将原链表接在 `dummy` 后面（处理头节点删除的统一逻辑）；
2. `prev = dummy`，`curr = head`；
3. 循环遍历（至少遍历一圈）：
   - 若 `curr->val == x`，`prev->next = curr->next`，删除 `curr`；
   - 否则 `prev = curr`；
   - `curr = curr->next`；
   - 终止条件：`curr == head` 且已遍历完整一圈；
4. 返回 `dummy->next`，注意维护新的循环结构。

### 复杂度分析

- **时间复杂度**：`O(n)`，每个节点访问一次。
- **空间复杂度**：`O(1)`，仅使用常数个指针。

### 边界注意

- 全部删除：输出空行；
- 删除头节点：哑节点确保逻辑统一；
- 连续多个 `x`：删除后 `prev` 不动，继续检查下一个；
- 无匹配值：原链表保持不变。

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
    long long x = 0;
    std::cin >> x;

    if (n == 0) {
        std::cout << "\n";
        return 0;
    }

    // Build circular linked list
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

    // Count how many nodes will remain
    std::size_t remaining = 0;
    Node* curr = head;
    do {
        if (curr->value != x) ++remaining;
        curr = curr->next;
    } while (curr != head);

    if (remaining == 0) {
        std::cout << "\n";
        return 0;
    }

    // Find the first node that is not x, to be the new head
    Node* new_head = head;
    while (new_head->value == x) new_head = new_head->next;

    // Traverse one full circle from new_head, deleting x nodes
    Node dummy{0, new_head};
    Node* prev = &dummy;
    curr = new_head;
    do {
        Node* nxt = curr->next;
        if (curr->value == x) {
            prev->next = nxt;
            delete curr;
        } else {
            prev = curr;
        }
        curr = nxt;
    } while (curr != new_head);

    // Output one full circle from new_head
    bool first = true;
    Node* p = dummy.next;
    do {
        if (!first) std::cout << ' ';
        std::cout << p->value;
        first = false;
        p = p->next;
    } while (p != dummy.next);
    std::cout << '\n';
}
```

</details>


