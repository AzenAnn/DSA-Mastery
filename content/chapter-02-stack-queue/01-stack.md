---
title: "2.1 栈"
description: "受限线性表的后进先出语义，以及顺序栈与链栈的实现取舍。"
order: 1
chapter: 2
chapterTitle: "栈与队列"
updated: "2026-08-12"
contributors: ["Azen"]
status: "draft"
---

# 2.1 栈

栈是一种受限的线性表：所有插入与删除都只发生在表的一端，这一端称为**栈顶**（top），另一端称为**栈底**（bottom）。因此栈遵循**后进先出**（Last In First Out，LIFO）语义——最后压入的元素最先被弹出。

## 学习目标

- 能把栈描述为一组数据与操作契约，并说清后进先出语义；
- 能用顺序存储与链式存储分别实现栈，正确处理空栈与扩容；
- 能分析各操作的时间与空间复杂度，解释"摊还 `O(1)`"的含义；
- 能为栈设计覆盖空栈、满栈和单元素栈的测试用例。

## 栈的抽象数据类型

设栈中元素类型为 `T`，栈内元素个数为 `n`。规定：下标 `0` 处为栈底，下标 `n-1` 处为栈顶，所有修改操作只允许作用于栈顶位置。

| 操作 | 行为约定 |
| --- | --- |
| `push(value)` | 把 `value` 压入栈顶，`n` 增加 1；容量不足时先扩容 |
| `pop()` | 移除并返回栈顶元素；空栈时失败 |
| `top()` | 返回栈顶元素但不移除；空栈时失败 |
| `is_empty()` | 栈内元素个数是否为 0 |
| `size()` | 返回当前元素个数 `n` |

::: warning 空栈操作不是"返回一个默认值"
`pop` 与 `top` 在空栈时是未定义还是返回特殊值，必须在接口设计阶段定死。常见做法是抛异常、返回可空结果，或由调用方先检查 `is_empty()`。把"空栈返回 0"当成约定，会让 0 这个合法元素无法被区分。
:::

## 顺序栈

顺序栈用一段连续存储区保存元素，栈顶对应数组的当前尾部。压栈时把元素写到尾部并移动栈顶下标；弹栈时退回栈顶下标。

```cpp:line-numbers [sequential-stack.cpp]
template <typename T>
class SequentialStack {
public:
    void push(const T& value) {
        if (size_ == capacity_) grow();      // 扩容后继续
        data_[size_++] = value;
    }
    bool pop(T& out) {
        if (is_empty()) return false;        // 空栈失败，由调用方决定如何处理
        out = data_[--size_];
        return true;
    }
    bool is_empty() const { return size_ == 0; }
    std::size_t size() const { return size_; }

private:
    void grow() { /* 容量翻倍并复制，见下文复杂度分析 */ }
    std::vector<T> data_;                    // 简化：用 vector 管理存储
    std::size_t size_ = 0;
    std::size_t capacity_ = 0;
};
```

当容量不足时，顺序栈需要**扩容**：分配一块更大的连续空间并把旧元素全部复制过去。若按固定比例（如翻倍）扩容，那么连续 `n` 次压栈的总复制量约为 `O(n)`，平均到每次压栈只有 `O(1)`——这就是摊还分析下的 `O(1)`。

## 链栈

链栈用带头节点的单链表实现，链表头部作为栈顶。这样 `push` 与 `pop` 都在头节点之后完成，无需遍历，也无需扩容。

```cpp:line-numbers [linked-stack.cpp]
template <typename T>
class LinkedStack {
public:
    void push(const T& value) { head_ = make_shared<Node>(value, head_); }
    bool pop(T& out) {
        if (!head_) return false;
        out = head_->value;
        head_ = head_->next;
        return true;
    }
    bool is_empty() const { return head_ == nullptr; }

private:
    struct Node { T value; shared_ptr<Node> next; };
    shared_ptr<Node> head_ = nullptr;
};
```

## 复杂度预算

| 操作 | 顺序栈 | 链栈 | 说明 |
| --- | --- | --- | --- |
| `push` | 摊还 `O(1)` | `O(1)` | 顺序栈扩容单次 `O(n)`，摊还 `O(1)` |
| `pop` | `O(1)` | `O(1)` | 链栈需释放或回收节点 |
| `top` | `O(1)` | `O(1)` | 链栈直接读头节点 |
| 空间 | `O(n)` 连续 | `O(n)` 分散 | 顺序栈更省指针开销，缓存局部性更好 |

::: tip 顺序栈还是链栈？
如果最大规模可预估且压栈频繁，顺序栈通常更快：连续内存访问友好、无节点分配开销。如果元素规模动态且变化剧烈，链栈按需分配、没有扩容峰值，代价是每个元素多一个链接域。
:::

## 小结

栈把"任意位置操作"收缩为"栈顶操作"，用更小的接口换来确定性的语义：后进先出。顺序栈与链栈在复杂度上几乎等价，真正的取舍在于内存布局、扩容策略与缓存局部性。栈也是后续递归、表达式求值等内容的实现基础。

## 练习

1. `pop` 与 `top` 的合法调用前提分别是什么？为什么两者都不能在空栈上调用？
2. 若扩容策略改为"每次只加一个位置"，连续 `n` 次压栈的总复杂度是多少？为什么翻倍策略更优？
3. 用栈判断一个序列是否是合法出栈序列（给定入栈顺序 `1,2,3`，哪些出栈序列合法？）。
4. 设计三个能暴露顺序栈实现缺陷的测试用例（提示：扩容、空栈、单元素）。
