---
title: "Lab 02-08：设计循环双端队列"
description: "使用循环数组实现双端队列，在固定容量内完成两端插入、删除和双向环绕。"
order: 8
chapter: 2
chapterTitle: "栈与队列"
updated: "2026-08-21"
contributors: ["DSA Mastery Team"]
status: "draft"
lab: true
difficulty: "进阶"
duration: "60～90 分钟"
---

# Lab 02-08：设计循环双端队列

> 题目来源：改编自 [LeetCode 641：设计循环双端队列](https://leetcode.cn/problems/design-circular-deque/)。本 Lab 使用课程自定义输入输出协议和独立测试，不复制来源站点的代码或测试。

## 学习目标

- 在循环数组两端执行最坏 O(1) 插入和删除。
- 让 front 向左、rear 向右都能安全环绕。
- 维持容量、判空判满和逻辑顺序不变量。

## 前置知识

建议先学习[第 2.2 节队列中的双端队列](../../../content/chapter-02-stack-queue/02-queue.md#双端队列)。实现使用 ISO C++17；开始前可运行 `make doctor` 检查环境。

## 题目

实现固定有效容量的循环双端队列。沿用空一格方案：front 指向首元素，rear 指向尾后位置，底层分配 capacity+1 个槽位。不得调用现成 deque。

## 输入格式

- 第一行：有效容量 `capacity` 和命令数 `q`；
- 后续 `q` 行：`INSERT_FRONT x`、`INSERT_LAST x`、`DELETE_FRONT`、`DELETE_LAST`、`FRONT`、`REAR`、`SIZE`、`EMPTY` 或 `FULL`。

## 输出格式

插入输出 `TRUE/FALSE`；删除输出被删除值或 `EMPTY`；FRONT/REAR 输出对应值或 `EMPTY`；SIZE 输出长度；EMPTY/FULL 输出 `TRUE/FALSE`。

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
INSERT_LAST 1
INSERT_LAST 2
INSERT_FRONT 3
FULL
INSERT_FRONT 4
FRONT
REAR
DELETE_LAST
INSERT_FRONT 4
FRONT
REAR
DELETE_FRONT
SIZE
```

```output
TRUE
TRUE
TRUE
TRUE
FALSE
3
2
2
TRUE
4
1
4
2
```

### 样例解释

依次执行两次尾插和一次头插后，逻辑双端队列为 `[3, 1, 2]`，已经满载，因此再次头插失败且状态不变。删除尾部 `2` 后再头插 `4`，队列变为 `[4, 3, 1]`。最后删除头部 `4`，剩余长度为 2。

`front` 指向首元素，`rear` 指向尾后位置。头插先让 `front` 向左环绕再写入；尾删先让 `rear` 向左移动再读取。

## 边界与验收重点

- 容量为 1 时两端操作。
- front 左环绕与 rear 右环绕。
- 满时插入和空时删除均不得改变状态。

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
pnpm lab:doctor -- labs/chapter-02/lab-02-08-circular-deque
pnpm lab:run -- labs/chapter-02/lab-02-08-circular-deque
pnpm lab:run -- labs/chapter-02/lab-02-08-circular-deque --case 001-sample
pnpm lab:score -- labs/chapter-02/lab-02-08-circular-deque
```

`make run` 用于查看各用例；`make score` 只有 100 分才返回成功。样例采用精确输出比较；`006-scale-wraparound` 在满载状态下持续删除头部并插入尾部，使两个下标完成环绕并检查常数时间操作。

- [ ] 容量 1、两端操作和双向环绕均正确
- [ ] 满时插入、空时删除失败后状态不变
- [ ] `FRONT/REAR/SIZE` 与逻辑序列一致
- [ ] 所有操作都只更新常数个下标和槽位

## 思考与复盘

1. `INSERT_FRONT` 为什么要先移动 `front` 再写入？
2. `DELETE_LAST` 为什么要先移动 `rear` 再读取？

## 题解

<details>
<summary>点击查看题解</summary>

### 思路与不变量

使用长度为 `capacity + 1` 的循环数组，`front` 指向首元素，`rear` 指向尾后位置。空和满条件与循环队列相同，但两端都允许更新：

- 头插：`front = previous(front)` 后写入；
- 尾插：在 `rear` 写入后执行 `rear = next(rear)`；
- 头删：读取 `front` 后前移；
- 尾删：先后移 `rear` 再读取。

### 复杂度分析

- 所有接口最坏时间复杂度均为 `O(1)`；
- 空间复杂度为 `O(capacity)`。

### 边界注意

- `previous(0)` 必须环绕到物理数组末端；
- `REAR` 读取 `previous(rear)`；
- 所有失败检查都要发生在修改 `front/rear` 之前。

</details>
<details>
<summary>点击查看参考代码</summary>

```cpp
#include <cstddef>
#include <iostream>
#include <string>
#include <vector>

class CircularDeque {
public:
    explicit CircularDeque(std::size_t capacity) : data_(capacity + 1) {}

    bool insert_front(long long value) {
        if (full()) return false;
        front_ = previous(front_);
        data_[front_] = value;
        return true;
    }

    bool insert_last(long long value) {
        if (full()) return false;
        data_[rear_] = value;
        rear_ = next(rear_);
        return true;
    }

    bool delete_front(long long& value) {
        if (empty()) return false;
        value = data_[front_];
        front_ = next(front_);
        return true;
    }

    bool delete_last(long long& value) {
        if (empty()) return false;
        rear_ = previous(rear_);
        value = data_[rear_];
        return true;
    }

    bool front(long long& value) const {
        if (empty()) return false;
        value = data_[front_];
        return true;
    }

    bool rear(long long& value) const {
        if (empty()) return false;
        value = data_[previous(rear_)];
        return true;
    }

    bool empty() const { return front_ == rear_; }
    bool full() const { return next(rear_) == front_; }
    std::size_t size() const { return (rear_ + data_.size() - front_) % data_.size(); }

private:
    std::size_t next(std::size_t index) const { return (index + 1) % data_.size(); }
    std::size_t previous(std::size_t index) const { return (index + data_.size() - 1) % data_.size(); }

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
    CircularDeque deque(capacity);

    for (std::size_t i = 0; i < q; ++i) {
        std::string command;
        std::cin >> command;
        if (command == "INSERT_FRONT") {
            long long value = 0;
            std::cin >> value;
            std::cout << (deque.insert_front(value) ? "TRUE" : "FALSE") << '\n';
        } else if (command == "INSERT_LAST") {
            long long value = 0;
            std::cin >> value;
            std::cout << (deque.insert_last(value) ? "TRUE" : "FALSE") << '\n';
        } else if (command == "DELETE_FRONT") {
            long long value = 0;
            if (deque.delete_front(value)) std::cout << value << '\n';
            else std::cout << "EMPTY\n";
        } else if (command == "DELETE_LAST") {
            long long value = 0;
            if (deque.delete_last(value)) std::cout << value << '\n';
            else std::cout << "EMPTY\n";
        } else if (command == "FRONT") {
            long long value = 0;
            if (deque.front(value)) std::cout << value << '\n';
            else std::cout << "EMPTY\n";
        } else if (command == "REAR") {
            long long value = 0;
            if (deque.rear(value)) std::cout << value << '\n';
            else std::cout << "EMPTY\n";
        } else if (command == "SIZE") {
            std::cout << deque.size() << '\n';
        } else if (command == "EMPTY") {
            std::cout << (deque.empty() ? "TRUE" : "FALSE") << '\n';
        } else if (command == "FULL") {
            std::cout << (deque.full() ? "TRUE" : "FALSE") << '\n';
        }
    }
}
```

</details>
