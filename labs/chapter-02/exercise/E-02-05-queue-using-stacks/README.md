---
title: "Lab 02-E-05：用栈实现队列"
description: "使用输入栈和输出栈实现先进先出队列，掌握延迟转移与摊还复杂度。"
order: 7
chapter: 2
labId: "02E05"
chapterTitle: "栈与队列"
updated: "2026-08-21"
contributors: ["DSA Mastery Team"]
status: "draft"
lab: true
difficulty: "进阶"
duration: "45～60 分钟"
---

# Lab 02-E-05：用栈实现队列

> 题目来源：改编自 [LeetCode 232：用栈实现队列](https://leetcode.cn/problems/implement-queue-using-stacks/)。本 Lab 使用课程自定义输入输出协议和独立测试，不复制来源站点的代码或测试。

## 学习目标

- 使用 input 和 output 两个栈维护 FIFO 顺序。
- 仅在 output 为空时把 input 全部转移过去。
- 区分单次最坏 O(n) 与一串操作的摊还 O(1)。

## 前置知识

建议先学习[第 2.1 节栈](../../../../content/chapter-02-stack-queue/01-stack.md)与[第 2.2 节队列](../../../../content/chapter-02-stack-queue/02-queue.md)。实现使用 ISO C++17；开始前可运行 `make doctor` 检查环境。

## 题目

只使用两个栈，实现一个先进先出（FIFO）队列。实现后的结构应当像普通队列一样工作：新元素加入队尾，读取和删除操作发生在队头。

栈只能访问和删除栈顶，而队列需要访问最早进入的元素。你需要利用两个栈改变元素顺序，使最早入队的元素能够位于可访问的栈顶。

原题要求实现 `push`、`pop`、`peek` 和 `empty`。本课程将它们映射为下列命令，并增加 `SIZE` 查询。

## 操作定义

| 命令 | 含义 | 输出 |
| --- | --- | --- |
| `ENQUEUE x` | 将 `x` 加入队尾 | 无输出 |
| `DEQUEUE` | 删除队头元素 | 成功输出被删除的值；队空时输出 `EMPTY` |
| `FRONT` | 读取队头元素，但不删除 | 非空时输出队头值；队空时输出 `EMPTY` |
| `SIZE` | 查询当前元素个数 | 输出非负整数 |
| `EMPTY` | 查询队列是否为空 | 队空输出 `YES`，否则输出 `NO` |

空队列上的 `DEQUEUE` 和 `FRONT` 只输出 `EMPTY`，不得改变任何状态。

## 实现要求

- 只能使用两个栈作为核心容器，不得使用 `std::queue` 或 `std::deque`；
- 新元素只进入输入栈；
- 只有输出栈为空且需要访问队头时，才把输入栈中的全部元素依次转移到输出栈；
- 输出栈非空时，不得为了整理结构而把元素提前转移或搬回输入栈。

一次转移可能需要 `O(n)` 时间，但每个元素从输入栈转移到输出栈后不会再搬回，因此一串命令中的每条操作应达到摊还 `O(1)`。

## 输入格式

- 第一行：命令数 `q`；
- 后续 `q` 行：每行一条上述命令。

## 输出格式

按照操作定义，每条需要返回结果的命令输出一行。`ENQUEUE` 不产生输出，因此输出行数不一定等于 `q`。

## 数据范围与限制

| 项目 | 范围或要求 |
| --- | --- |
| 命令数 `q` | `1 ≤ q ≤ 200000` |
| 元素值 | 64 位有符号整数 |
| 可用核心结构 | 两个栈 |
| 单次最坏时间 | 发生整体转移时为 `O(n)` |
| 摊还时间复杂度 | 每条命令 `O(1)` |
| 额外空间限制 | `O(n)` |

## 样例

```input
12
ENQUEUE 1
ENQUEUE 2
FRONT
DEQUEUE
ENQUEUE 3
FRONT
DEQUEUE
FRONT
SIZE
DEQUEUE
EMPTY
SIZE
```

```output
1
1
2
2
3
1
3
YES
0
```

### 样例解释

| 命令 | 执行后的逻辑队列（队头 → 队尾） | 输出 |
| --- | --- | --- |
| `ENQUEUE 1` | `[1]` | — |
| `ENQUEUE 2` | `[1, 2]` | — |
| `FRONT` | `[1, 2]` | `1` |
| `DEQUEUE` | `[2]` | `1` |
| `ENQUEUE 3` | `[2, 3]` | — |
| `FRONT` | `[2, 3]` | `2` |
| `DEQUEUE` | `[3]` | `2` |
| `FRONT` | `[3]` | `3` |
| `SIZE` | `[3]` | `1` |
| `DEQUEUE` | `[]` | `3` |
| `EMPTY` | `[]` | `YES` |
| `SIZE` | `[]` | `0` |

第一次执行 `FRONT` 时，输出栈为空，所以把输入栈中的 `2、1` 依次转移过去，输出栈顶变成最早入队的 `1`。后来入队的 `3` 留在输入栈；只要输出栈中仍有 `2`，队头就仍然来自输出栈。

## 边界与验收重点

- 输出栈尚有元素时继续入队，不得提前转移。
- 空队列读取和删除。
- 重复值、负数及多轮转移。

标准输入均满足题面列出的命令和数据约束。除题面明确规定的失败操作外，不需要为未知命令设计行为。调试日志必须写入标准错误，标准输出只保留判题结果。

## 如何验证

```powershell
# 已进入本 Lab 目录
make doctor
make run
make run CASE=001-lazy-transfer
make interactive
make score
```

Windows 没有安装 Make 时，在仓库根目录运行：

```powershell
pnpm lab:doctor -- labs/chapter-02/exercise/E-02-05-queue-using-stacks
pnpm lab:run -- labs/chapter-02/exercise/E-02-05-queue-using-stacks
pnpm lab:run -- labs/chapter-02/exercise/E-02-05-queue-using-stacks --case 001-lazy-transfer
pnpm lab:score -- labs/chapter-02/exercise/E-02-05-queue-using-stacks
```

`make run` 用于查看各用例；`make score` 只有 100 分才返回成功。样例采用精确输出比较；`006-scale-transfer` 先累积 400 个元素，再交替执行 `FRONT` 与 `DEQUEUE`，回归一次转移后持续从输出栈取队头的状态变化。均摊复杂度要求还需结合实现分析判断。

- [ ] 空队列查询和删除不改变状态
- [ ] 输出栈非空时继续入队不会破坏 FIFO 顺序
- [ ] 多轮转移、重复值和交替操作全部通过
- [ ] 能区分单次最坏 `O(n)` 与摊还 `O(1)`

## 思考与复盘

1. 为什么一次转移后最早入队的元素位于输出栈顶？
2. 怎样用“每个元素被搬几次”证明摊还 `O(1)`？

<details>
<summary>查看参考答案</summary>

1. **因为从一个栈逐个弹出并压入另一个栈会把顺序反转。** 若 `1、2、3` 依次进入输入栈，输入栈从底到顶是 `[1, 2, 3]`。转移时按 `3、2、1` 的顺序弹出并压入输出栈，输出栈从底到顶变成 `[3, 2, 1]`，所以最早入队的 `1` 位于输出栈顶。
2. **每个元素只承担常数次栈操作。** 一个元素先压入输入栈一次；发生转移时，从输入栈弹出一次并压入输出栈一次；最终再从输出栈弹出一次。它不会被搬回输入栈，因此每个元素至多经历常数次操作。处理 `m` 条命令的总工作量是 `O(m)`，平均到每条命令就是摊还 `O(1)`，即使某一次转移本身需要 `O(n)`。

</details>

## 题解

<details>
<summary>点击查看题解</summary>

### 思路与不变量

使用输入栈 `input` 和输出栈 `output`：新元素只进入 `input`；访问队头前，只有在 `output` 为空时才把 `input` 全部倒入 `output`。

`output` 非空时，它的栈顶就是整个队列最早进入的元素；`input` 保存随后到达、尚未反转的元素。因此逻辑队列顺序是“`output` 从栈顶到底，再接 `input` 从栈底到栈顶”。

### 复杂度分析

- `ENQUEUE` 最坏 `O(1)`；
- `FRONT/DEQUEUE` 单次最坏 `O(n)`，但每个元素只会被转移一次，所以摊还 `O(1)`；
- `SIZE/EMPTY` 为 `O(1)`；
- 额外空间为 `O(n)`。

### 边界注意

- `output` 非空时绝不能转移 `input`；
- 空队列操作先检查两个栈是否都为空；
- 不要在每次出队后把剩余元素搬回输入栈。

</details>
<details>
<summary>点击查看参考代码</summary>

```cpp
#include <cstddef>
#include <iostream>
#include <string>
#include <vector>

class StackQueue {
public:
    void enqueue(long long value) { input_.push_back(value); }

    bool dequeue(long long& value) {
        move_if_needed();
        if (output_.empty()) return false;
        value = output_.back();
        output_.pop_back();
        return true;
    }

    bool front(long long& value) {
        move_if_needed();
        if (output_.empty()) return false;
        value = output_.back();
        return true;
    }

    bool empty() const { return input_.empty() && output_.empty(); }
    std::size_t size() const { return input_.size() + output_.size(); }

private:
    void move_if_needed() {
        if (!output_.empty()) return;
        while (!input_.empty()) {
            output_.push_back(input_.back());
            input_.pop_back();
        }
    }

    std::vector<long long> input_;
    std::vector<long long> output_;
};

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    std::size_t q = 0;
    if (!(std::cin >> q)) return 0;
    StackQueue queue;

    for (std::size_t i = 0; i < q; ++i) {
        std::string command;
        std::cin >> command;
        if (command == "ENQUEUE") {
            long long value = 0;
            std::cin >> value;
            queue.enqueue(value);
        } else if (command == "DEQUEUE") {
            long long value = 0;
            if (queue.dequeue(value)) std::cout << value << '\n';
            else std::cout << "EMPTY\n";
        } else if (command == "FRONT") {
            long long value = 0;
            if (queue.front(value)) std::cout << value << '\n';
            else std::cout << "EMPTY\n";
        } else if (command == "SIZE") {
            std::cout << queue.size() << '\n';
        } else if (command == "EMPTY") {
            std::cout << (queue.empty() ? "YES" : "NO") << '\n';
        }
    }
}
```

</details>
