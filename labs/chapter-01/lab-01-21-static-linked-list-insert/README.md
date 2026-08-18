---
title: "Lab 01-21：静态链表有序插入"
description: "用游标数组模拟单链表，练习静态空间中的节点分配、链接修改与有序维护。"
order: 21
chapter: 1
chapterTitle: "线性表"
updated: "2026-08-17"
contributors: ["czjLUCK"]
status: "draft"
lab: true
difficulty: "进阶"
duration: "35～50 分钟"
---

# Lab 01-21：静态链表有序插入

使用**静态链表**（游标数组）维护一个升序序列。静态链表的节点预先存放在数组中，用数组下标（游标）代替指针表示逻辑链接关系。

## 题目

### 静态链表有序插入

给定 `n` 个整数，将它们依次插入静态链表中，始终保持链表按升序排列。最后输出有序序列。

### 任务要求

1. 从标准输入读入 `n` 和 `n` 个整数；
2. 使用**静态链表**完成插入和有序维护，不允许使用动态指针（如 `malloc`/`new`）或语言内置链表容器；
3. 输出最终的有序序列。

## 输入格式

- 第一行：一个整数 `n`，表示元素个数；
- 第二行：`n` 个整数，为待插入的值。

## 输出格式

- 一行 `n` 个整数，为按升序排列后的序列；
- 相邻整数之间用**单个空格**分隔，行末不要有多余空格。

## 数据范围与限制

| 项目 | 范围 |
| --- | --- |
| 元素个数 `n` | 0 ≤ n ≤ 1000 |
| 元素值 | −10⁹ ≤ 值 ≤ 10⁹ |
| 时间复杂度要求 | O(n²) 可接受（静态链表每次插入需定位前驱） |
| 额外空间限制 | O(n)，使用固定大小的数组模拟 |

## 静态链表定义

静态链表用数组存储节点，用数组下标（游标）代替指针表示逻辑顺序。每个节点包含 `data` 和 `next` 两个字段，`next` 为 `-1` 表示链表末尾。

## 样例

### 样例输入 1

```input
5
3 1 4 2 5
```

### 样例输出 1

```output
1 2 3 4 5
```

### 样例输入 2

```input
6
5 5 3 3 1 1
```

### 样例输出 2

```output
1 1 3 3 5 5
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

以样例 1 为例，依次插入 `3, 1, 4, 2, 5`：

| 插入值 | 查找前驱过程 | 分配槽位 | `slots` 变化 | `head` |
| --- | --- | --- | --- | --- |
| 3 | 空表，插入头部 | `idx=0` | `[3, -1]` | 0 |
| 1 | `1 < 3`，插入头部 | `idx=1` | `[3, 1]` `[1, -1]` | 1 |
| 4 | `1 < 4`，`3 < 4`，插在 3 后 | `idx=2` | `[3, 2]` `[1, 0]` `[4, -1]` | 1 |
| 2 | `1 < 2`，`2 < 3`，插在 1 后 | `idx=3` | `[3, 2]` `[1, 3]` `[4, -1]` `[2, 0]` | 1 |
| 5 | `1 < 2 < 3 < 4 < 5`，插在尾部 | `idx=4` | `[3, 2]` `[1, 3]` `[4, 4]` `[2, 0]` `[5, -1]` | 1 |

遍历：`head=1` → `slots[1]=1` → `slots[3]=2` → `slots[0]=3` → `slots[2]=4` → `slots[4]=5`，输出 `1 2 3 4 5`。

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
pnpm lab:doctor -- labs/chapter-01/lab-01-21-static-linked-list-insert
pnpm lab:run -- labs/chapter-01/lab-01-21-static-linked-list-insert
pnpm lab:run -- labs/chapter-01/lab-01-21-static-linked-list-insert --case sample
pnpm lab:score -- labs/chapter-01/lab-01-21-static-linked-list-insert
```

`make run` 在答案尚未全对时仍正常返回，避免 Make 把学习结果显示成工具故障；`make score` 是严格入口，只有 100 分才返回成功。标准输出参与判题，调试信息请写入标准错误。

- [ ] 样例输入与输出完全一致
- [ ] 五组边界自测通过
- [ ] 未使用动态指针或内置链表容器
- [ ] 能解释静态链表中"数组下标"与"逻辑顺序"的关系

## 思考题

1. 静态链表相比动态链表，在节点分配和回收上各有什么优劣？
2. 如果要支持删除操作，静态链表需要一个「空闲链表」来管理回收的槽位。请描述其基本设计。

## 题解

<details>
<summary>点击查看题解</summary>

### 思路

静态链表用数组模拟链式结构，每个节点包含 `data` 和 `next` 两个字段。插入时先找到插入位置的前驱，再修改游标完成链接。

### 算法步骤

1. 初始化空闲槽位管理（可用简单数组下标递增分配）；
2. 对每个待插入值 `v`：
   - 从 `head` 开始遍历，找到第一个 `data > v` 的节点的前驱；
   - 分配新槽位 `idx`，`slots[idx].data = v`；
   - `slots[idx].next = slots[prev].next`；
   - `slots[prev].next = idx`；
3. 遍历输出有序序列。

### 复杂度分析

- **时间复杂度**：`O(n²)`，每次插入需线性查找前驱位置。
- **空间复杂度**：`O(n)`，固定大小的数组。

### 边界注意

- 插入到头部：`prev` 为虚拟头游标；
- 插入到尾部：`next = -1`；
- `n = 0`：输出空行。

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

    std::vector<Slot> slots(n);
    int head = -1;

    for (std::size_t i = 0; i < n; ++i) {
        long long v = 0;
        std::cin >> v;
        slots[i].data = v;
        slots[i].next = -1;

        if (head == -1 || v < slots[head].data) {
            slots[i].next = head;
            head = static_cast<int>(i);
        } else {
            int prev = head;
            while (slots[prev].next != -1 && slots[slots[prev].next].data <= v) {
                prev = slots[prev].next;
            }
            slots[i].next = slots[prev].next;
            slots[prev].next = static_cast<int>(i);
        }
    }

    bool first = true;
    for (int p = head; p != -1; p = slots[p].next) {
        if (!first) std::cout << ' ';
        std::cout << slots[p].data;
        first = false;
    }
    std::cout << '\n';
}
```

</details>


