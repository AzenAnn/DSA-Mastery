---
title: "Lab 01-15：约瑟夫环"
description: "用循环链表模拟经典约瑟夫环问题，理解循环结构的遍历与节点删除。"
order: 15
chapter: 1
chapterTitle: "线性表"
updated: "2026-08-18"
contributors: ["czjLUCK"]
status: "draft"
lab: true
difficulty: "入门～进阶"
duration: "30～45 分钟"
---

# Lab 01-15：约瑟夫环

`n` 个人围成一圈，从第一个人开始报数。报到 `m` 的人出列，然后从下一个人重新开始报数，直到所有人出列。求依次出列的人的编号。

## 题目

### 约瑟夫环

给定 `n` 和 `m`，模拟约瑟夫环过程，输出依次出列的编号序列。

### 任务要求

1. 从标准输入读入 `n` 和 `m`；
2. 使用**循环链表**模拟报数与出列过程；
3. 输出出列顺序。

## 输入格式

- 一行两个整数 `n` 和 `m`。

## 输出格式

- 一行 `n` 个整数，表示依次出列的人的编号；
- 相邻整数之间用**单个空格**分隔，行末不要有多余空格。

## 数据范围与限制

| 项目 | 范围 |
| --- | --- |
| 人数 `n` | 1 ≤ n ≤ 10⁴ |
| 报数上限 `m` | 1 ≤ m ≤ 10⁴ |
| 时间复杂度要求 | O(n × m)，循环链表模拟可接受 |
| 额外空间限制 | O(n)，用于存储循环链表 |

## 样例

### 样例输入 1

```input
5 2
```

### 样例输出 1

```output
2 4 1 5 3
```

### 样例解释

以样例 1 为例，`n=5, m=2`：

5 个人围成一圈：`1 → 2 → 3 → 4 → 5 → (回到 1)`

| 轮次 | 从谁开始 | 报数过程 | 出列 | 剩余 |
| --- | --- | --- | --- | --- |
| 1 | 1 | 1, **2** | 2 | `1 → 3 → 4 → 5` |
| 2 | 3 | 3, **4** | 4 | `1 → 3 → 5` |
| 3 | 5 | 5, **1** | 1 | `3 → 5` |
| 4 | 3 | 3, **5** | 5 | `3` |
| 5 | 3 | **3** | 3 | 空 |

出列顺序：`2 4 1 5 3`。

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
pnpm lab:doctor -- labs/chapter-01/lab-01-15-josephus-problem
pnpm lab:run -- labs/chapter-01/lab-01-15-josephus-problem
pnpm lab:run -- labs/chapter-01/lab-01-15-josephus-problem --case 001-sample
pnpm lab:score -- labs/chapter-01/lab-01-15-josephus-problem
```

`make run` 在答案尚未全对时仍正常返回，避免 Make 把学习结果显示成工具故障；`make score` 是严格入口，只有 100 分才返回成功。标准输出参与判题，调试信息请写入标准错误。

- [ ] 样例输入与输出完全一致
- [ ] 三组边界自测通过
- [ ] 使用循环链表模拟（而非数学公式直接计算）
- [ ] 能说明为什么循环链表天然适合描述"围成一圈"的场景

## 思考题

1. 约瑟夫环存在数学递推解法（动态规划），其时间复杂度是 O(n)。与循环链表模拟相比，各有什么优缺点？
2. 如果用顺序表（数组）模拟约瑟夫环，删除操作的复杂度是多少？对于大输入会面临什么问题？

## 题解

<details>
<summary>点击查看题解</summary>

### 思路

用**循环链表**模拟报数过程。`n` 个人围成一圈，从第一个开始报数，报到 `m` 的人出列，从下一个人重新报数，直到全部出列。

### 算法步骤

1. 构建循环链表：`1 -> 2 -> ... -> n -> (回到 1)`；
2. 从节点 `1` 开始，循环报数：
   - 每轮移动 `m-1` 步（当前节点算第 1 个）；
   - 到达目标节点，记录其值，删除该节点；
   - 从下一个节点继续报数；
3. 直到链表为空。

### 复杂度分析

- **时间复杂度**：`O(n × m)`，每次删除需要遍历 `m` 步，共删除 `n` 个节点。
- **空间复杂度**：`O(n)`，循环链表占用空间。

### 边界注意

- `n = 1, m = 1`：直接输出 `1`；
- 删除节点时注意维护前驱指针，确保循环链表不断裂。

</details>
<details>
<summary>点击查看参考代码</summary>

```cpp
#include <cstddef>
#include <iostream>

struct Node {
    int value{};
    Node* next = nullptr;
};

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    int n = 0, m = 0;
    std::cin >> n >> m;

    if (n == 0) {
        std::cout << "\n";
        return 0;
    }

    Node* head = new Node{1, nullptr};
    Node* curr = head;
    for (int i = 2; i <= n; ++i) {
        curr->next = new Node{i, nullptr};
        curr = curr->next;
    }
    curr->next = head;

    Node* prev = curr;
    curr = head;
    bool first_out = true;

    while (n-- > 0) {
        for (int i = 1; i < m; ++i) {
            prev = curr;
            curr = curr->next;
        }
        if (!first_out) std::cout << ' ';
        std::cout << curr->value;
        first_out = false;

        prev->next = curr->next;
        Node* to_del = curr;
        curr = curr->next;
        delete to_del;
    }
    std::cout << '\n';
}
```

</details>


