---
title: "2.2 队列"
description: "先进先出的受限线性结构，重点理解循环队列的判空判满与边界约定。"
order: 2
chapter: 2
chapterTitle: "栈与队列"
updated: "2026-08-12"
contributors: ["Azen"]
status: "draft"
---

# 2.2 队列

队列是另一种受限线性表：元素从**队尾**（rear）进入，从**队头**（front）离开。因此队列遵循**先进先出**（First In First Out，FIFO）语义——最早进入的元素最早被取出。这与栈的后进先出正好相对。

## 学习目标

- 能把队列描述为一组数据与操作契约，并说清先进先出语义；
- 解释顺序存储下"假溢出"产生的原因，以及循环队列如何解决它；
- 推导循环队列的判空、判满与元素个数公式；
- 能实现循环队列并设计覆盖空、满与边界的测试用例。

## 队列的抽象数据类型

设队列元素类型为 `T`，当前元素个数为 `n`，队头元素下标为 0（逻辑上），队尾为 `n-1`（逻辑上）。

| 操作 | 行为约定 |
| --- | --- |
| `enqueue(value)` | 把 `value` 加入队尾，`n` 增加 1；容量不足时失败或扩容 |
| `dequeue()` | 移除并返回队头元素；空队列时失败 |
| `front()` | 返回队头元素但不移除；空队列时失败 |
| `is_empty()` | 队列元素个数是否为 0 |
| `size()` | 返回当前元素个数 `n` |

## 假溢出与循环队列

如果用数组 `data[0..cap-1]` 保存队列，队头下标 `front` 指向第一个元素、队尾下标 `rear` 指向最后一个元素的下一个位置，那么直接按线性方式移动下标，会让 `rear` 很快撞到数组末尾——即使数组前半段全是空位。这种现象称为**假溢出**：队列并没有真正装满，却无法继续入队。

解决办法是把数组首尾相接，让 `rear` 越过 `cap-1` 后回到 `0`。下标的推进统一取模：

$$
front' = (front + 1) \bmod cap, \qquad rear' = (rear + 1) \bmod cap.
$$

循环队列牺牲一个存储单元来区分空与满。约定如下：

$$
\text{isEmpty}:\ front = rear,
$$

$$
\text{isFull}:\ (rear + 1) \bmod cap = front,
$$

$$
\text{size} = (rear - front + cap) \bmod cap.
$$

::: warning 为什么必须空出一格
若允许填满整个数组，会出现 `front == rear` 同时代表"空"与"满"两种状态。空出一格后，满时的 `rear` 永远比 `front` 落后一格，两种状态可以被唯一区分。
:::

```cpp:line-numbers [circular-queue.cpp]
template <typename T>
class CircularQueue {
public:
    explicit CircularQueue(std::size_t cap) : data_(cap + 1) {}  // 多留一格

    bool enqueue(const T& value) {
        if (is_full()) return false;         // 满队列失败，由调用方决定扩容或等待
        data_[rear_] = value;
        rear_ = (rear_ + 1) % data_.size();
        return true;
    }
    bool dequeue(T& out) {
        if (is_empty()) return false;
        out = data_[front_];
        front_ = (front_ + 1) % data_.size();
        return true;
    }
    bool is_empty() const { return front_ == rear_; }
    bool is_full() const { return (rear_ + 1) % data_.size() == front_; }
    std::size_t size() const { return (rear_ - front_ + data_.size()) % data_.size(); }

private:
    std::vector<T> data_;
    std::size_t front_ = 0;
    std::size_t rear_ = 0;
};
```

## 链队列

链队列用带头节点与尾指针的单链表实现：入队接在尾节点之后，出队删除头节点之后的节点。维护尾指针后，两端操作都是 `O(1)`，并且不需要"空出一格"的约定——`head == nullptr` 就表示空。

```cpp:line-numbers [linked-queue.cpp]
template <typename T>
class LinkedQueue {
public:
    void enqueue(const T& value) {
        tail_->next = make_shared<Node>(value);
        tail_ = tail_->next;
    }
    bool dequeue(T& out) {
        if (!head_) return false;
        out = head_->value;
        head_ = head_->next;
        if (!head_) tail_ = nullptr;         // 队列被清空时重置尾指针
        return true;
    }
    bool is_empty() const { return head_ == nullptr; }

private:
    struct Node { T value; shared_ptr<Node> next; };
    shared_ptr<Node> head_ = nullptr;
    shared_ptr<Node> tail_ = nullptr;        // 尾指针让 enqueue 保持 O(1)
};
```

## 复杂度预算

| 操作 | 循环队列 | 链队列 | 说明 |
| --- | --- | --- | --- |
| `enqueue` | `O(1)` | `O(1)` | 循环队列满时需扩容，摊还 `O(1)` |
| `dequeue` | `O(1)` | `O(1)` | 链队列需同步维护尾指针 |
| `front` | `O(1)` | `O(1)` | 循环队列直接按下标读 |
| 空间 | 固定容量，多一格 | `O(n)` 分散 | 循环队列无法利用"已出队"的空位 |

::: tip 什么时候该扩容循环队列？
循环队列的容量在构造时固定。若实际负载接近满且出队频繁，扩容时需要复制并重新映射元素位置——但复用数组的"空洞"通常比反复扩容更划算，这也是循环队列最常见的用法场景。
:::

## 小结

队列用"先进先出"的确定语义服务于任何需要按到达顺序处理的任务。循环队列用取模运算与"空一格"约定在固定数组上同时得到 `O(1)` 的入队、出队与队头访问；链队列则用尾指针换同样的复杂度，代价是逐节点分配内存。选择哪一个，取决于容量是否可预估、扩容是否可接受。

## 练习

1. 证明 `size = (rear - front + cap) mod cap` 在 `front <= rear` 与 `front > rear` 两种情况下都成立。
2. 容量为 5 的循环队列（多一格后实际可用 4 格），依次执行 `enqueue`×4、`dequeue`、`enqueue`×2，画出每一步的 `front` 与 `rear` 下标。
3. 如果允许"填满"整个数组，需要引入什么额外信息来区分空与满？给出一种可行方案。
4. 设计三个能暴露循环队列实现缺陷的测试用例（提示：空队列出队、满队列入队、环绕一圈后长度计算）。
