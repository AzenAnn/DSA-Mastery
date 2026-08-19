---
title: "Lab 01-09：单链表逆置"
description: "反转单链表中所有节点的链接方向，练习迭代或递归方式修改 next 指针。"
order: 9
chapter: 1
chapterTitle: "线性表"
updated: "2026-08-18"
contributors: ["czjLUCK"]
status: "draft"
lab: true
difficulty: "入门"
duration: "20～30 分钟"
---

# Lab 01-09：单链表逆置

给定一个单链表，将其所有节点的链接方向反转。例如链表 `1 → 2 → 3 → 4` 逆置后变为 `4 → 3 → 2 → 1`。

## 题目

### 单链表逆置

输入一个单链表，输出逆置后的链表。

### 任务要求

1. 从标准输入读入链表长度和各节点值；
2. 使用**迭代**方式实现逆置，不允许借助辅助数组或新建链表复制全部节点；
3. 输出逆置后的链表节点值序列。

## 输入格式

- 第一行：一个整数 `n`，表示链表长度；
- 第二行：`n` 个整数，按从头到尾的顺序给出链表中各节点的值。

## 输出格式

- 一行 `n` 个整数，为逆置后链表从**新头节点到新尾节点**的节点值序列；
- 相邻整数之间用**单个空格**分隔，行末不要有多余空格。

## 数据范围与限制

| 项目 | 范围 |
| --- | --- |
| 链表长度 `n` | 0 ≤ n ≤ 10⁵ |
| 节点值 | −10⁹ ≤ 值 ≤ 10⁹ |
| 时间复杂度要求 | O(n) |
| 额外空间限制 | O(1)，仅允许常数级指针变量 |

::: tip 关于 n = 0
当 `n = 0` 时输入第二行可能为空，输出应为空行（不输出任何内容）。
:::

## 样例

### 样例输入 1

```input
4
1 2 3 4
```

### 样例输出 1

```output
4 3 2 1
```

### 样例输入 2

```input
1
42
```

### 样例输出 2

```output
42
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

以样例 1 为例，链表为 `1 → 2 → 3 → 4`：

| 轮次 | `prev` | `curr` | `nxt` | 操作后链表状态 |
| --- | --- | --- | --- | --- |
| 初始 | `null` | 1 | — | `1 → 2 → 3 → 4` |
| 1 | `null` | 1 | 2 | `1 ← 2 → 3 → 4`（`1` 已反转） |
| 2 | 1 | 2 | 3 | `1 ← 2 ← 3 → 4` |
| 3 | 2 | 3 | 4 | `1 ← 2 ← 3 ← 4` |
| 4 | 3 | 4 | `null` | `1 ← 2 ← 3 ← 4`（全部反转） |

最后 `prev=4`，为新头节点，输出 `4 3 2 1`。

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
pnpm lab:doctor -- labs/chapter-01/lab-01-09-singly-linked-list-reverse
pnpm lab:run -- labs/chapter-01/lab-01-09-singly-linked-list-reverse
pnpm lab:run -- labs/chapter-01/lab-01-09-singly-linked-list-reverse --case 001-sample
pnpm lab:score -- labs/chapter-01/lab-01-09-singly-linked-list-reverse
```

`make run` 在答案尚未全对时仍正常返回，避免 Make 把学习结果显示成工具故障；`make score` 是严格入口，只有 100 分才返回成功。标准输出参与判题，调试信息请写入标准错误。

- [ ] 样例输入与输出完全一致
- [ ] 三组边界自测通过
- [ ] 程序满足 O(n) 时间且 O(1) 额外空间
- [ ] 能画出三次指针更新的顺序，并说明为什么先保存 next 再改链接

## 思考题

1. 如果允许 `O(n)` 额外空间，用递归实现逆置会是什么样？递归深度会有什么风险？
2. 逆置带哨兵节点的单链表时，哨兵本身是否需要参与链接反转？

## 题解

<details>
<summary>点击查看题解</summary>

### 思路

使用**三指针迭代**逐个反转节点的 `next` 指向。

维护三个指针：`prev`（已反转部分的头）、`curr`（当前处理节点）、`nxt`（暂存后继，防止断链）。

### 算法步骤

1. 初始化 `prev = nullptr, curr = head`；
2. 循环直到 `curr == nullptr`：
   - `nxt = curr->next`（先保存后继）；
   - `curr->next = prev`（反转指向）；
   - `prev = curr`（整体后移）；
   - `curr = nxt`；
3. 返回 `prev`（新头节点）。

### 复杂度分析

- **时间复杂度**：`O(n)`，遍历链表一次。
- **空间复杂度**：`O(1)`，仅使用常数个指针变量。

### 边界注意

- 必须先保存 `nxt` 再改链接，否则后半段链表丢失；
- `n = 0`：返回空指针。

</details>
<details>
<summary>点击查看参考代码</summary>

```cpp
#include <cstddef>
#include <iostream>
#include <vector>

struct Node {
    long long value{};
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
        Node* node = new Node{v, nullptr};
        if (!head) head = tail = node;
        else { tail->next = node; tail = node; }
    }

    Node* prev = nullptr;
    Node* curr = head;
    while (curr) {
        Node* nxt = curr->next;
        curr->next = prev;
        prev = curr;
        curr = nxt;
    }

    bool first = true;
    for (Node* p = prev; p; p = p->next) {
        if (!first) std::cout << ' ';
        std::cout << p->value;
        first = false;
    }
    std::cout << '\n';
}
```

</details>


