---
title: "Lab 02-06：设计循环队列"
description: "用空出一个物理槽位的循环数组实现固定容量队列，覆盖判空判满和下标环绕。"
order: 6
chapter: 2
chapterTitle: "栈与队列"
updated: "2026-08-21"
contributors: ["DSA Mastery Team"]
status: "draft"
lab: true
difficulty: "进阶"
duration: "60～90 分钟"
---

# Lab 02-06：设计循环队列

> 题目来源：改编自 [LeetCode 622：设计循环队列](https://leetcode.cn/problems/design-circular-queue/)。本 Lab 使用课程自定义输入输出协议和独立测试，不复制来源站点的代码或测试。

## 学习目标

- 使用 front 指向队头、rear 指向下一写入位置的统一约定。
- 为有效容量 capacity 分配 capacity+1 个物理槽位。
- 让失败操作保持 front、rear 和逻辑序列不变。

## 前置知识

建议先学习[第 2.2 节队列](../../../content/chapter-02-stack-queue/02-queue.md)。实现使用 ISO C++17；开始前可运行 `make doctor` 检查环境。

## 题目

设计一个循环队列。循环队列仍然遵循先进先出（FIFO）：新元素从队尾加入，已有元素从队头删除。与普通线性数组不同，循环队列走到数组末端后可以回到数组开头继续使用已经空出的槽位。

队列的有效容量为 `capacity`，也就是最多只能同时保存 `capacity` 个元素。队列已满时，新的入队操作必须失败；队列为空时，删除或读取队头、队尾也必须失败。所有失败操作都不能改变队列原有状态。

原题要求实现 `enQueue`、`deQueue`、`Front`、`Rear`、`isEmpty` 和 `isFull`。本课程将这些接口映射为下列命令，并增加 `SIZE` 查询。

## 操作定义

| 命令 | 含义 | 输出 |
| --- | --- | --- |
| `ENQUEUE x` | 尝试把 `x` 加入队尾 | 成功输出 `TRUE`；队满时输出 `FALSE` |
| `DEQUEUE` | 尝试删除队头元素 | 成功输出被删除的值；队空时输出 `EMPTY` |
| `FRONT` | 读取队头元素，但不删除 | 非空时输出队头值；队空时输出 `EMPTY` |
| `REAR` | 读取队尾元素，但不删除 | 非空时输出队尾值；队空时输出 `EMPTY` |
| `SIZE` | 查询当前元素个数 | 输出 `0` 到 `capacity` 之间的整数 |
| `EMPTY` | 查询队列是否为空 | 输出 `TRUE` 或 `FALSE` |
| `FULL` | 查询队列是否已满 | 输出 `TRUE` 或 `FALSE` |

## 实现要求

必须使用数组自行实现循环队列，不得调用 `std::queue`、`std::deque` 等现成队列容器。本 Lab 固定采用以下下标约定：

- `front` 指向当前队头元素；
- `rear` 指向下一次成功入队时要写入的位置；
- 底层数组分配 `capacity + 1` 个物理槽位，并始终留出一个空槽；
- `front == rear` 表示队空，`(rear + 1) % physicalSize == front` 表示队满。

所有接口都必须在最坏 `O(1)` 时间内完成，出队时不得整体移动数组中的其他元素。

## 输入格式

- 第一行：两个整数 `capacity` 和 `q`，分别表示有效容量和命令数；
- 后续 `q` 行：每行一条上述命令。

## 输出格式

每条命令都按照操作定义输出一行结果，因此本题恰好输出 `q` 行。

## 数据范围与限制

| 项目 | 范围或要求 |
| --- | --- |
| 有效容量 `capacity` | `1 ≤ capacity ≤ 100000` |
| 命令数 `q` | `1 ≤ q ≤ 200000` |
| 元素值 | 64 位有符号整数 |
| 物理槽位数 | `capacity + 1` |
| 时间复杂度要求 | 所有接口最坏 `O(1)` |
| 空间复杂度 | `O(capacity)` |

## 样例

```input
3 13
EMPTY
ENQUEUE 10
ENQUEUE 20
ENQUEUE 30
FULL
ENQUEUE 40
FRONT
REAR
DEQUEUE
ENQUEUE 40
FRONT
REAR
SIZE
```

```output
TRUE
TRUE
TRUE
TRUE
TRUE
FALSE
10
30
10
TRUE
20
40
3
```

### 样例解释

| 命令 | 执行后的逻辑队列（队头 → 队尾） | 输出 |
| --- | --- | --- |
| `EMPTY` | `[]` | `TRUE` |
| `ENQUEUE 10` | `[10]` | `TRUE` |
| `ENQUEUE 20` | `[10, 20]` | `TRUE` |
| `ENQUEUE 30` | `[10, 20, 30]` | `TRUE` |
| `FULL` | `[10, 20, 30]` | `TRUE` |
| `ENQUEUE 40` | `[10, 20, 30]` | `FALSE` |
| `FRONT` | `[10, 20, 30]` | `10` |
| `REAR` | `[10, 20, 30]` | `30` |
| `DEQUEUE` | `[20, 30]` | `10` |
| `ENQUEUE 40` | `[20, 30, 40]` | `TRUE` |
| `FRONT` | `[20, 30, 40]` | `20` |
| `REAR` | `[20, 30, 40]` | `40` |
| `SIZE` | `[20, 30, 40]` | `3` |

前三次入队后队列达到有效容量 3，所以 `ENQUEUE 40` 失败并保持原状态。删除 `10` 后空出一个位置，再次入队 `40` 时，`rear` 可以从底层数组末端环绕到前部继续写入。

## 边界与验收重点

- 有效容量为 1。
- front 和 rear 分别跨越数组末端。
- 满队列入队、空队列出队失败后状态稳定。

标准输入均满足题面列出的命令和数据约束。除题面明确规定的失败操作外，不需要为未知命令设计行为。调试日志必须写入标准错误，标准输出只保留判题结果。

## 如何验证

```powershell
# 已进入本 Lab 目录
make doctor
make run
make run CASE=001-sample
make interactive
make score
```

Windows 没有安装 Make 时，在仓库根目录运行：

```powershell
pnpm lab:doctor -- labs/chapter-02/lab-02-06-circular-queue
pnpm lab:run -- labs/chapter-02/lab-02-06-circular-queue
pnpm lab:run -- labs/chapter-02/lab-02-06-circular-queue --case 001-sample
pnpm lab:score -- labs/chapter-02/lab-02-06-circular-queue
```

`make run` 用于查看各用例；`make score` 只有 100 分才返回成功。样例采用精确输出比较；`006-scale-wraparound` 使用容量 400 的满队列完成一整轮队头、队尾环绕，回归取模更新和满载状态稳定性。常数时间要求还需结合实现分析判断。

- [ ] 容量 1、判空判满和下标环绕均正确
- [ ] 满队列入队、空队列出队失败后状态不变
- [ ] `FRONT/REAR/SIZE` 与逻辑序列一致
- [ ] 没有通过整体移动数组完成出队

## 思考与复盘

1. 为什么物理槽位数必须是 `capacity + 1`？
2. 怎样从 `front`、`rear` 和物理长度推导 `size`？

## 题解

<details>
<summary>点击查看题解</summary>

### 思路与不变量

设物理长度为 `capacity + 1`。`front` 指向队头元素，`rear` 指向下一写入位置：

- 空：`front == rear`；
- 满：`next(rear) == front`；
- 长度：`(rear + physicalSize - front) % physicalSize`。

入队只在 `rear` 写入并向前移动；出队只读取 `front` 并向前移动，不能搬动其他元素。

### 复杂度分析

- 所有接口最坏时间复杂度均为 `O(1)`；
- 空间复杂度为 `O(capacity)`。

### 边界注意

- 有效容量为 1 时仍需要 2 个物理槽位；
- `REAR` 对应 `(rear - 1 + physicalSize) % physicalSize`；
- 失败操作必须在修改下标前返回。

</details>
<details>
<summary>点击查看参考代码</summary>

```cpp
#include <cstddef>
#include <iostream>
#include <string>
#include <vector>

class CircularQueue {
public:
    explicit CircularQueue(std::size_t capacity) : data_(capacity + 1) {}

    bool enqueue(long long value) {
        if (full()) return false;
        data_[rear_] = value;
        rear_ = next(rear_);
        return true;
    }

    bool dequeue(long long& value) {
        if (empty()) return false;
        value = data_[front_];
        front_ = next(front_);
        return true;
    }

    bool front(long long& value) const {
        if (empty()) return false;
        value = data_[front_];
        return true;
    }

    bool rear(long long& value) const {
        if (empty()) return false;
        value = data_[(rear_ + data_.size() - 1) % data_.size()];
        return true;
    }

    bool empty() const { return front_ == rear_; }
    bool full() const { return next(rear_) == front_; }
    std::size_t size() const { return (rear_ + data_.size() - front_) % data_.size(); }

private:
    std::size_t next(std::size_t index) const { return (index + 1) % data_.size(); }

    std::vector<long long> data_;
    std::size_t front_ = 0;
    std::size_t rear_ = 0;
};

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    std::size_t capacity = 0;
    std::size_t q = 0;
    if (!(std::cin >> capacity >> q)) return 0;
    CircularQueue queue(capacity);

    for (std::size_t i = 0; i < q; ++i) {
        std::string command;
        std::cin >> command;
        if (command == "ENQUEUE") {
            long long value = 0;
            std::cin >> value;
            std::cout << (queue.enqueue(value) ? "TRUE" : "FALSE") << '\n';
        } else if (command == "DEQUEUE") {
            long long value = 0;
            if (queue.dequeue(value)) std::cout << value << '\n';
            else std::cout << "EMPTY\n";
        } else if (command == "FRONT") {
            long long value = 0;
            if (queue.front(value)) std::cout << value << '\n';
            else std::cout << "EMPTY\n";
        } else if (command == "REAR") {
            long long value = 0;
            if (queue.rear(value)) std::cout << value << '\n';
            else std::cout << "EMPTY\n";
        } else if (command == "SIZE") {
            std::cout << queue.size() << '\n';
        } else if (command == "EMPTY") {
            std::cout << (queue.empty() ? "TRUE" : "FALSE") << '\n';
        } else if (command == "FULL") {
            std::cout << (queue.full() ? "TRUE" : "FALSE") << '\n';
        }
    }
}
```

</details>
