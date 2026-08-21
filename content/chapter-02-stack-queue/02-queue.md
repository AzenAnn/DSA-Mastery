---
title: "2.2 队列"
description: "从 Queue ADT 契约出发，推导循环队列公式，并用不变量、测试和工程选型掌握队列实现。"
order: 2
chapter: 2
chapterTitle: "栈与队列"
updated: "2026-08-21"
contributors: ["沃克"]
status: "draft"
---

# 2.2 队列

::: definition 定义 · 队列
队列是一种受限线性表：元素从**队尾**（rear，后端）进入，从**队头**（front，前端）离开。因此队列遵循**先进先出**（First In First Out，FIFO）语义——最早进入的元素最早被取出。这里的 `front` 和 `rear` 先表示队列的两个逻辑位置；它们在具体实现中可能是数组下标，也可能通过指针表示。
:::

实现队列并不只是写出入队和出队。真正容易出错的是状态约定：`front` 指向哪里、`rear` 指向哪里、底层数组长度和可存元素数是否相同，以及失败操作后状态是否保持不变。这些在每次合法操作结束后都必须成立的条件，称为<dfn>不变量</dfn>（invariant）。本节会把它们写成可以直接检查的规则。

本节重点回答四个问题：

1. Queue ADT 怎样把 FIFO、边界和失败语义写成可替换实现共同遵守的契约？
2. 线性数组为什么产生假溢出，取模怎样让有限槽位循环复用？
3. 判空、判满和长度公式从哪里来，怎样用不变量与断言验证它们？
4. 环形缓冲区、链队列、`std::queue` 与 `std::deque` 分别适合什么约束？

## 学习目标

完成本节后，你应该能够：

- 用抽象数据类型（ADT）描述队列的操作与先进先出语义；
- 解释普通顺序队列产生“假溢出”的原因；
- 在统一约定下推导循环队列的判空、判满和长度公式；
- 用顺序存储与链式存储实现队列，并处理空、满、单元素和非法操作；
- 根据不变量设计覆盖下标环绕和失败操作的边界测试；
- 比较循环队列、链队列与双端队列的适用场景。

## 队列的抽象数据类型（ADT）

[抽象数据类型](../chapter-00-introduction/01-data-structure-basics.md#抽象数据类型)（Abstract Data Type，ADT）规定一种数据结构“可以执行哪些操作、每个操作应产生什么结果”，但不限定内部怎样实现。简单地说，ADT 关注**能做什么**，数组或链表关注**怎样做到**。

设队列中的元素类型为 `T`，当前元素个数为 `n`。下面这组操作就是队列对外提供的**接口**，也就是使用者可以调用的操作集合。

| 操作 | 中文名称 | 行为约定 |
| --- | --- | --- |
| `enqueue(value)` | 入队 | 把元素 `value` 加入队尾；成功后 `n` 增加 1 |
| `dequeue()` | 出队 | 移除并返回队头元素；空队列时明确失败 |
| `front()` | 读取队头 | 返回队头元素但不移除；空队列时明确失败 |
| `is_empty()` | 判空 | 返回 `n == 0` 是否成立 |
| `size()` | 取长度 | 返回当前元素个数 `n` |

`front()` 是使用者调用的操作；后文的 `front` 或 `front_` 则是实现内部记录队头位置的状态，二者不要混淆。本节使用教材中常见的 `enqueue/dequeue`；C++ 标准库和部分 Lab 使用 `push/pop`，名称不同但 FIFO 契约相同。一个实现内部应固定一套命名，不能让同名操作表达不同语义。

固定容量实现还可以提供 `is_full()`（判满）和 `capacity()`（取有效容量）。动态实现没有固定的“满”状态，但可能因为分配失败而无法继续增长。接口必须提前规定失败方式，例如返回表示成功或失败的布尔值，或在失败时抛出异常；不能用某个合法元素充当失败标记。

参照第 1 章“先冻结接口，再替换实现”的方式，可以把这份契约写成一个泛型接口：

```cpp:line-numbers [queue-adt.hpp]
#pragma once

#include <cstddef>

template <typename T>
class Queue {
public:
    virtual ~Queue() = default;

    virtual bool enqueue(const T& value) = 0;
    virtual bool dequeue(T& out) = 0;
    virtual bool front(T& out) const = 0;
    virtual bool is_empty() const noexcept = 0;
    virtual std::size_t size() const noexcept = 0;
};
```

这里选择布尔返回值表达“正常边界失败”，并用输出参数交付元素。调用方因此可以依赖同一组可观察行为：

| 操作 | 前置条件 | 成功后的后置条件 | 正常失败保证 |
| --- | --- | --- | --- |
| `enqueue(value)` | `value` 是合法的 `T` | `value` 成为新队尾，`size()` 增加 1 | 固定容量已满时返回 `false`；队列状态不变 |
| `dequeue(out)` | 无 | 非空时把原队头写入 `out`，再将 `size()` 减少 1 | 空队列返回 `false`；`out` 和队列状态不变 |
| `front(out)` | 无 | 非空时把队头写入 `out`，队列状态不变 | 空队列返回 `false`；`out` 和队列状态不变 |
| `is_empty()` / `size()` | 无 | 只查询状态，不修改队列 | 不失败 |

“返回 `false`”只表示容量或空队列这类预期边界。若元素复制或内存分配抛出异常，仍应让队列保持调用前的逻辑状态，再由异常机制向上传播。下面的循环队列与链队列会遵守同一接口，但采用不同的容量和存储契约。

## 普通顺序队列与假溢出

假设底层存储数组为 `data[0..m-1]`，其中 `data` 表示保存元素的数组。`front` 记录当前队头元素的下标，`rear` 记录下一次入队写入位置的下标。如果两个下标只向右移动，不回到数组开头，那么若干次出队后，数组前部会出现空位，而 `rear` 最终仍会到达 `m`。

```text
下标       0    1    2    3    4    5
出队前    [A]  [B]  [C]  [D]  [_]  [_]
出队后    [_]  [_]  [C]  [D]  [_]  [_]
                              rear → 4
```

继续入队两次后，`rear` 到达数组末端。此时前两个位置虽然空闲，线性推进方式却无法利用它们，这就是==假溢出==。

一种做法是在每次出队后把剩余元素整体前移，但一次出队会变成 `O(n)`。更常见的做法是让下标循环移动，使数组首尾在逻辑上相接。

## 循环队列的统一约定

本节采用“**空出一个物理位置**”的方案，并统一使用以下符号：

- `m`：底层数组的物理槽位数，要求 `m >= 2`；
- 有效容量：`m - 1`；
- `front`：记录当前队头元素所在的下标；
- `rear`：记录下一次入队写入位置的下标。

因此，本节循环队列中的 `front` 和 `rear` 都是整数下标。“指向某个位置”只是说下标记录了该位置，并不表示它们是 C++ 指针。

下标推进统一使用**取模**，也就是除以 `m` 后取余数：

$$
next(i) = (i + 1) \bmod m.
$$

例如物理长度 `m = 6` 时，`next(5) = (5 + 1) % 6 = 0`，所以下标越过末尾后会回到开头。公式中的 $\bmod$ 和代码中的 `%` 在这里都表示取余数。

::: property 性质 · 空一格方案的状态公式
由约定可以得到：

$$
\text{判空}:\ front = rear,
$$

$$
\text{判满}:\ (rear + 1) \bmod m = front,
$$

<span id="rev-2-2-full" class="course-review-target"></span>

$$
\text{元素个数} = (rear - front + m) \bmod m.
$$
:::

::: theorem 定理 · 循环距离公式
若 `front` 指向队头元素、`rear` 指向下一写入位置，且队列采用空一格方案，则逻辑元素个数始终等于

$$
size = (rear - front + m) \bmod m,
$$

并且 `size = 0` 当且仅当 `front = rear`，`size = m - 1` 当且仅当 `(rear + 1) mod m = front`。
:::

::: proof 循环距离公式证明
分两种相对位置讨论：

1. 当 `front <= rear` 时，有效元素位于半开区间 `[front, rear)`，数量为 `rear - front`。该值已经落在 `[0, m - 1]`，取模后不变。
2. 当 `front > rear` 时，有效元素跨过数组末端，数量为 `(m - front) + rear`，恰好等于 `rear - front + m`。

两个结果统一写成 `(rear - front + m) mod m`。因为两个下标都在 `[0, m - 1]` 内，所以循环距离为 `0` 当且仅当二者相等；这就是判空条件。空一格方案允许的最大距离是 `m - 1`，此时 `rear` 再前进一步就与 `front` 重合；这就是判满条件。证明完毕。
:::

::: pitfall 易错点 · 物理长度不等于有效容量
物理长度为 `m` 的数组最多保存 `m - 1` 个队列元素。若题目中的 `capacity` 表示“最多可保存的元素数”，底层就需要分配 `capacity + 1` 个槽位。实现前必须先说明参数采用哪一种含义，不能混用。<span id="rev-2-2-capacity" class="course-review-target"></span>
:::

### 为什么空出一个位置

::: intuition 直觉 · 用一个槽位换取无歧义状态
如果允许占满全部 `m` 个槽位，下标绕回后，`front == rear` 可能同时表示“空”和“满”。空出一个位置后：

- 空：`front == rear`；
- 满：`rear` 的下一个位置是 `front`。

因此两种状态可以仅由两个下标区分。其他可行方案还包括额外维护 `size` 计数器，或记录最后一次操作是入队还是出队；这些方案可以使用全部槽位，但增加了需要同步维护的状态。
:::

## 环绕过程示例

物理槽位数 `m = 6`，有效容量为 5。下面用 `_` 表示该槽位当前不属于逻辑队列；它不要求计算机内存中的旧值已经被清除。

| 操作完成后 | 物理数组 `0..5` | `front` | `rear` | 逻辑队列 |
| --- | --- | ---: | ---: | --- |
| 初始 | `[_, _, _, _, _, _]` | 0 | 0 | 空 |
| 入队 A～D | `[A, B, C, D, _, _]` | 0 | 4 | `A B C D` |
| 出队两次 | `[_, _, C, D, _, _]` | 2 | 4 | `C D` |
| 入队 E | `[_, _, C, D, E, _]` | 2 | 5 | `C D E` |
| 入队 F | `[_, _, C, D, E, F]` | 2 | 0 | `C D E F` |
| 入队 G | `[G, _, C, D, E, F]` | 2 | 1 | `C D E F G` |

此时 `(rear + 1) % 6 == front`，队列已满。再次入队必须失败，而且数组、`front`、`rear` 和 `size` 都不能改变。<span id="rev-2-2-failure" class="course-review-target"></span>随后依次出队 C、D、E、F，`front` 会从 5 推进到 0，从而验证队头下标也能正确环绕。

## 循环队列实现

下面的实现接收物理槽位数 `slot_count`（slot count，槽位数量），对应公式中的 `m`。它是**固定容量**队列：满队列入队返回布尔值 `false`（假，表示失败），不会自动扩容。

阅读代码时，可以先记住这些名称：

- `CircularQueue`：循环队列；
- `data_`：保存元素的底层数组；
- `m_`：物理槽位数；
- `front_`、`rear_`：对应公式中的两个循环下标；
- `next(index)`：计算 `index` 的下一个循环下标；
- 成员名末尾的 `_` 只是表示它属于类的内部状态，不是算法符号的一部分。

```cpp:line-numbers [circular-queue.hpp]
#pragma once

#include "queue-adt.hpp"

#include <cstddef>
#include <optional>
#include <stdexcept>
#include <vector>

template <typename T>
class CircularQueue final : public Queue<T> {
public:
    explicit CircularQueue(std::size_t slot_count)
        : m_(slot_count), data_(slot_count) {
        if (m_ < 2) {
            throw std::invalid_argument("slot_count must be at least 2");
        }
    }

    bool enqueue(const T& value) override {
        if (is_full()) return false;
        data_[rear_].emplace(value);
        rear_ = next(rear_);
        return true;
    }

    bool dequeue(T& out) override {
        if (is_empty()) return false;
        out = *data_[front_];
        data_[front_].reset();
        front_ = next(front_);
        return true;
    }

    bool front(T& out) const override {
        if (is_empty()) return false;
        out = *data_[front_];
        return true;
    }

    bool is_empty() const noexcept override { return front_ == rear_; }
    std::size_t size() const noexcept override {
        return (rear_ + m_ - front_) % m_;
    }

    bool is_full() const noexcept { return next(rear_) == front_; }
    std::size_t capacity() const noexcept { return m_ - 1; }

private:
    std::size_t next(std::size_t index) const noexcept {
        return (index + 1) % m_;
    }

    std::size_t m_;
    std::vector<std::optional<T>> data_;
    std::size_t front_ = 0;
    std::size_t rear_ = 0;
};
```

底层使用 `std::optional<T>` 表示每个槽位当前是否构造了元素，因此创建队列时不要求 `T` 可以默认构造；成功出队时调用 `reset()`，也能及时结束该元素的生命周期。当前 `enqueue(const T&)` 仍要求 `T` 可以复制构造，输出参数要求 `T` 可以赋值；若要支持只能移动的类型，还应增加右值重载，而不是把额外能力伪装成现有接口已经提供。

即使不清空旧值，`front_`、`rear_` 和 `size()` 也足以决定逻辑队列；这里重置槽位是为了管理泛型元素的资源生命周期。代码还有三个值得检查的顺序约束：

- 入队先判满，再构造槽位元素，最后推进 `rear_`；
- 出队先完成 `out` 赋值，再销毁槽位元素并推进 `front_`；
- `size()` 写成 `rear_ + m_ - front_` 后再取模，避免无符号整数直接执行 `rear_ - front_` 时下溢。

因此，正常边界失败不会修改状态；元素构造或赋值抛出异常时，下标也尚未推进。每次成功入队只构造一个槽位并推进 `rear_`，每次成功出队只读取并销毁一个槽位元素、再推进 `front_`，二者最坏时间都是 `O(1)`。

### 循环队列的不变量

::: property 性质 · 循环队列的不变量
每次公开操作结束后都应满足：

- `0 <= front < m` 且 `0 <= rear < m`；
- `0 <= size() <= m - 1`；
- `is_empty()` 与 `size() == 0` 等价；
- `is_full()` 与 `size() == m - 1` 等价；
- 从 `front` 开始循环读取 `size()` 个元素，得到的顺序就是逻辑队列顺序；
- 在两个下标中，成功入队只推进 `rear`，成功出队只推进 `front`；
- 失败操作不改变数组和任何状态。
:::

这些不变量比“样例输出看起来正确”更强，适合直接转化为断言和随机测试。下面的确定性测试同时让 `front` 和 `rear` 环绕，并检查失败操作保持状态：

```cpp:line-numbers [circular-queue-test.cpp]
#include "circular-queue.hpp"

#include <cassert>

int main() {
    CircularQueue<int> queue(6);  // 6 个槽位，有效容量为 5
    int out = -1;

    assert(queue.is_empty());
    assert(!queue.dequeue(out));
    assert(out == -1);            // 空队列失败不能改写输出参数

    const int initial[] = {10, 20, 30, 40, 50};
    for (int value : initial) {
        assert(queue.enqueue(value));
    }
    assert(queue.is_full());

    const std::size_t full_size = queue.size();
    assert(!queue.enqueue(60));
    assert(queue.size() == full_size);
    assert(queue.front(out) && out == 10);

    assert(queue.dequeue(out) && out == 10);
    assert(queue.dequeue(out) && out == 20);
    assert(queue.enqueue(60));
    assert(queue.enqueue(70));    // rear 已经绕回数组开头

    const int expected[] = {30, 40, 50, 60, 70};
    for (int value : expected) {
        assert(queue.dequeue(out) && out == value);
    }

    assert(queue.is_empty());     // front 也已经完成环绕
    out = -1;
    assert(!queue.front(out));
    assert(out == -1);
}
```

更强的验证可以把 `std::deque<int>` 当作参考模型：随机生成入队和出队操作，每一步都比较成功/失败、`size()`、队头值和最终出队顺序。这样测试的是完整操作序列，而不是某几个容易“碰巧正确”的样例。

<QuizSet block="circular-queue" />

## 固定容量与动态扩容

固定容量循环队列在满时立即失败，因此一次 `enqueue` 的最坏时间是 `O(1)`。如果业务要求自动扩容，需要在满时：

1. 分配更大的连续空间；
2. 从旧 `front` 开始按逻辑顺序复制现有元素；
3. 把新 `front` 设为 `0`，新 `rear` 设为当前元素数；
4. 再完成本次入队。

::: complexity 复杂度 · 固定容量与动态扩容
单次扩容需要 $O(n)$。<dfn>摊还分析</dfn>不是说每一次操作都是 $O(1)$，而是先计算一串操作的总成本，再平均到其中每一次操作。只有采用成倍增长等策略时，动态循环队列的入队才能描述为摊还 $O(1)$；完整推导可回顾[第 1 章顺序表](../chapter-01-linear-list/02-sequential-list.md)。固定容量和动态容量是两份不同的接口契约，不应混在同一复杂度结论中。
:::

## 链队列

链队列不需要连续空间。本节使用**无哨兵节点**的实现，也就是不额外设置固定的空头节点。这里与循环队列不同：`head_` 和 `tail_` 的类型是 `Node*`，它们是真正保存节点地址的 C++ 指针。

- `Node` 表示链表节点；
- `head_` 是头指针，指向第一个有效节点；
- `tail_` 是尾指针，指向最后一个有效节点；
- 节点中的 `next` 是后继指针，指向下一个节点；
- `nullptr` 表示空指针，也就是当前没有指向任何节点。

维护尾指针后，入队和出队都不需要遍历。

```cpp:line-numbers [linked-queue.hpp]
#pragma once

#include "queue-adt.hpp"

#include <cstddef>

template <typename T>
class LinkedQueue final : public Queue<T> {
public:
    LinkedQueue() = default;
    LinkedQueue(const LinkedQueue&) = delete;
    LinkedQueue& operator=(const LinkedQueue&) = delete;
    LinkedQueue(LinkedQueue&&) = delete;
    LinkedQueue& operator=(LinkedQueue&&) = delete;

    ~LinkedQueue() override { clear(); }

    bool enqueue(const T& value) override {
        Node* node = new Node{value, nullptr};

        if (tail_ == nullptr) {
            head_ = tail_ = node;             // 第一次入队
        } else {
            tail_->next = node;
            tail_ = node;
        }
        ++size_;
        return true;
    }

    bool dequeue(T& out) override {
        if (head_ == nullptr) return false;

        Node* removed = head_;
        out = removed->value;
        head_ = head_->next;
        delete removed;
        --size_;

        if (head_ == nullptr) {
            tail_ = nullptr;                  // 最后一个元素已经出队
        }
        return true;
    }

    bool front(T& out) const override {
        if (head_ == nullptr) return false;
        out = head_->value;
        return true;
    }

    bool is_empty() const noexcept override { return size_ == 0; }
    std::size_t size() const noexcept override { return size_; }

private:
    struct Node {
        T value;
        Node* next;
    };

    void clear() noexcept {
        while (head_ != nullptr) {
            Node* removed = head_;
            head_ = head_->next;
            delete removed;
        }
        tail_ = nullptr;
        size_ = 0;
    }

    Node* head_ = nullptr;
    Node* tail_ = nullptr;
    std::size_t size_ = 0;
};
```

这里沿用第 1 章链表中的裸指针写法：`new` 创建节点，`delete` 释放已经出队的节点，析构函数负责在队列销毁前清空剩余节点。默认复制只会复制指针、导致两个队列重复释放同一批节点，因此示例显式禁用了复制与移动，形成一份安全但不可复制、不可移动的教学实现。工程容器若需要值语义，应完整实现 Rule of Five；若只需要唯一所有权，也可以用智能指针重新表达节点生命周期，不能只恢复默认复制。

::: property 性质 · 链队列的首尾不变量
链队列最重要的边界是空队列与单元素队列：

- 第一次入队后，`head_` 与 `tail_` 必须指向同一节点；
- 最后一个元素出队后，二者必须同时恢复为空；
- 非空时 `tail_->next` 必须为空；
- `size_ == 0`、`head_ == nullptr` 和 `tail_ == nullptr` 必须等价。
:::

## 双端队列

**双端队列**（double-ended queue，简称 deque）允许在两端插入和删除：

| 操作 | 含义 |
| --- | --- |
| `push_front(value)` | 从队头插入 |
| `push_back(value)` | 从队尾插入 |
| `pop_front()` | 从队头删除 |
| `pop_back()` | 从队尾删除 |
| `front()` / `back()` | 读取两端元素 |

循环数组可以通过双向取模移动 `front` 和 `rear` 实现双端操作；双向链表可以通过首尾指针实现同一套接口。设计练习时，可以要求两种底层表示遵守相同 ADT，并让所有主要操作达到 `O(1)`，再比较连续存储的局部性与链式存储的节点开销。

::: pitfall 易错点 · 双端队列不等于优先队列
双端队列仍按两端位置操作；优先队列按元素优先级决定谁先离开，通常使用堆实现。两者的“先出规则”不同。
:::

## 实现与复杂度比较

| 操作或性质 | 固定容量循环队列 | 链队列 |
| --- | --- | --- |
| `enqueue` | 最坏 `O(1)`；满时失败 | 正常情况 `O(1)`；分配可能抛异常 |
| `dequeue` | `O(1)` | `O(1)` |
| `front` | `O(1)` | `O(1)` |
| `size` | `O(1)`，由下标公式计算 | `O(1)`，需要维护计数器 |
| 存储空间 | `O(m)` 连续空间 | `O(n)` 分散节点 |
| 额外开销 | 空出一个槽位 | 每个节点保存链接和分配元数据 |
| 局部性 | 连续槽位通常更利于缓存与预取 | 节点可能分散，存在指针追逐 |
| 主要边界 | 空、满、两个下标环绕 | 第一次入队、最后一次出队、所有权 |
| 容量语义 | 构造时确定，可预测 | 按需增长，受可用内存限制 |

两者主要操作都是 `O(1)`，不代表工程成本相同。环形缓冲区预先承担固定空间，换来无逐节点分配和稳定的最坏延迟；链队列按需分配，换来容量灵活性，同时承担指针、分配器和所有权成本。

### 工程选型：先问约束，再选容器

C++ 标准库中的 `std::queue` 是**容器适配器**：它提供 `push`、`pop`、`front`、`back` 等 FIFO 接口，默认使用 `std::deque` 保存元素。若业务只需要普通 FIFO，通常应先使用标准库，而不是重新维护裸指针。

| 业务约束 | 常见首选 | 选择依据 |
| --- | --- | --- |
| 普通业务 FIFO，不需要遍历内部元素 | `std::queue<T>` | 接口直接表达 FIFO，默认底层实现已处理扩容和边界 |
| 需要直接操作两端或遍历元素 | `std::deque<T>` | 两端操作为 `O(1)`，并提供迭代接口 |
| 容量固定、初始化后不能再次分配、延迟必须可预测 | 固定容量环形缓冲区 | 容量与失败策略明确，入队和出队最坏 `O(1)` |
| 规模变化明显，并要求节点地址在其他节点插删后保持稳定 | 链式容器 | 按需分配，已存在节点不因其他节点入队而搬移 |
| 需要按优先级而不是到达顺序出队 | `std::priority_queue<T>` | 语义已经不是 FIFO，不能用普通队列替代 |

::: tip 标准库优先不等于跳过原理
手写循环队列用于理解状态约定、嵌入式容量控制和特殊失败策略；业务代码则应先检查 `std::queue`、`std::deque` 或成熟环形缓冲区是否已经满足需求。只有契约不匹配时，才承担自实现的测试与维护成本。
:::

做选型时至少回答四个问题：容量是否有上界、满时应该拒绝还是覆盖、运行期能否分配内存、调用方是否需要遍历或长期持有元素引用。容器名称不是结论，访问模式与失败契约才是。

## 常见错误

1. 同一个 `capacity` 在公式中表示物理长度，在构造函数中又表示有效容量。
2. `rear` 有时指向最后一个元素，有时指向下一写入位置，导致判满公式错一位。
3. 下标递增后没有取模，环绕时越界。
4. 满队列入队或空队列出队失败后，仍然修改了下标或计数器。
5. 只测试 `rear` 环绕，没有测试 `front` 环绕。
6. 链队列第一次入队时解引用空的 `tail`。
7. 删除最后一个链式节点后忘记重置 `tail`。
8. 固定容量实现返回失败，却把复杂度解释成自动扩容后的摊还 `O(1)`。

## 小结

队列用先进先出语义表达“先到先处理”。循环队列通过取模，复用空位置，以一个空槽换取简单、可推导的判定空还是满；链队列通过首尾指针在离散节点上实现同样的 `O(1)` 入队和出队。可靠实现的关键不是记住某一条公式，而是心中记住状态约定。

## 练习

1. 分别在 `front <= rear` 与 `front > rear` 两种情况下，证明 `size = (rear - front + m) % m`，其中 `%` 表示取余数。
2. 物理长度为 6、采用空一格方案的循环队列，初始 `front = rear = 0`。依次入队 A～D、出队两次、再入队 E～G。写出最终物理数组、`front`、`rear`、`size` 和逻辑队列顺序。
3. 如果希望使用数组的全部 `m` 个槽位，可以引入什么额外状态来区分空与满？给出至少一种方案及其不变量。
4. 一段链队列代码直接执行 `tail->next = newNode`，其中 `newNode` 表示指向新节点的指针。说明它在什么状态下失败，并写出第一次入队和最后一次出队必须维护的条件。
5. 使用输入栈 `in` 和输出栈 `out` 实现队列：入队压入 `in`；出队时若 `out` 为空，就把 `in` 的元素全部转移到 `out`。解释为什么某次出队可能是 `O(n)`，但一串操作中每个操作仍可达到摊还 `O(1)`。
6. 为双端队列设计一套接口，分别选择循环数组和双向链表实现。说明怎样保证两端插入和删除都是 `O(1)`，并比较两种表示的空间取舍。

::: details 查看参考思路

1. `front <= rear` 时，元素位于连续区间，数量为 `rear - front`；`front > rear` 时，数量为 `(m - front) + rear`。统一写成取模公式就是 `(rear - front + m) % m`。
2. 最终物理数组为 `[G, _, C, D, E, F]`，`front = 2`，`rear = 1`，`size = 5`，逻辑顺序为 `C D E F G`，队列处于满状态。
3. 可以维护 `size`，规定空时 `size == 0`、满时 `size == m`；也可以维护最后一次操作类型，`front == rear` 时根据该标记区分空满。
4. 空队列中 `tail == nullptr`，直接解引用会失败。第一次入队后 `head == tail`；最后一次出队后 `head` 和 `tail` 都必须恢复为空。
5. 一个元素只会压入 `in` 一次、从 `in` 转移到 `out` 一次、从 `out` 弹出一次。对 `k` 个元素，总栈操作数是 `O(k)`，因此平均到每次队列操作是摊还 `O(1)`。
6. 循环数组通过对两端下标做取模实现 `O(1)` 操作；双向链表通过首尾指针和前后链接实现 `O(1)` 操作。前者连续、局部性好但容量受限，后者按需分配但每个节点有额外指针。
:::

## 迁移练习

- [LeetCode 622：设计循环队列](https://leetcode.cn/problems/design-circular-queue/)：检查环形下标、判空与判满。
- [LeetCode 232：用栈实现队列](https://leetcode.cn/problems/implement-queue-using-stacks/)：检查结构组合与摊还分析。

## 进一步阅读

- [`std::queue`](https://en.cppreference.com/w/cpp/container/queue.html)：容器适配器的接口与默认底层容器。
- [`std::deque`](https://en.cppreference.com/w/cpp/container/deque.html)：双端操作、复杂度与迭代器失效规则。

完成理论后，先进入 [Lab 02-02：队列选择题精练](../../labs/chapter-02/lab-02-02-queue-quiz/README.md)检查概念，再完成以下可自动评分的实现练习：

- [Lab 02-09：最近请求计数器](../../labs/chapter-02/lab-02-09-recent-counter/README.md)：用队头淘汰维护时间窗口；
- [Lab 02-10：设计循环队列](../../labs/chapter-02/lab-02-10-circular-queue/README.md)：实现空一格约定、环绕下标和稳定失败状态；
- [Lab 02-11：用栈实现队列](../../labs/chapter-02/lab-02-11-queue-using-stacks/README.md)：通过延迟转移理解摊还 `O(1)`；
- [Lab 02-12：设计循环双端队列](../../labs/chapter-02/lab-02-12-circular-deque/README.md)：把环绕扩展到两端插入和删除；
- [Lab 02-13：滑动窗口最大值](../../labs/chapter-02/lab-02-13-sliding-window-maximum/README.md)：学完 2.3 的单调候选思想后，用双端队列维护窗口最大值。

随后进入 [Lab 02-04：超市收银模拟](../../labs/chapter-02/lab-02-04-supermarket-checkout/README.md)和 [Lab 02-05：停车场管理](../../labs/chapter-02/lab-02-05-parking-lot-management/README.md)，把接口、边界断言和调度状态组合成综合系统。
