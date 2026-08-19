---
title: "2.1 栈"
description: "受限线性表的后进先出语义，以及顺序栈与链栈的实现取舍。"
order: 1
chapter: 2
chapterTitle: "栈与队列"
updated: "2026-08-19"
contributors: ["qzmqzm123"]
status: "draft"
---

# 2.1 栈

::: definition 定义 · 栈
栈是一种只允许在同一端插入和删除元素的受限线性表。允许操作的一端称为<dfn>栈顶</dfn>（top），另一端称为栈底。最后压入的元素最先弹出，因此栈遵循**后进先出**（Last In First Out，LIFO）语义。
:::

学习栈的重点不是记住某一种数组或链表写法，而是先冻结栈顶操作、空栈失败方式和后进先出顺序，再检查不同实现是否遵守同一契约。

## 学习目标

完成本节后，你应该能够：

- 用 ADT 描述 `push`、`pop`、`top`、`empty` 与 `size` 的行为；
- 写出顺序栈和链栈，并说明两种表示的容量、局部性与所有权取舍；
- 区分单次最坏复杂度与摊还复杂度，准确描述顺序栈扩容；
- 为栈设计空栈、单元素、扩容和混合操作测试；
- 用栈实现括号匹配，并解释算法为什么满足 LIFO 语义。

## 1. 为什么需要栈

很多问题天然满足“后来的先处理”：

- 编辑器撤销：最后一次操作最先撤销；
- 函数调用返回：最后调用的函数先返回；
- 括号匹配：最后遇到的左括号先匹配。

这种顺序约束就是栈：==最后入栈，最先出栈==。

## 2. 栈的 ADT（抽象数据类型）

栈只开放栈顶一端：

| 操作 | 语义 | 前置条件或失败方式 |
| --- | --- | --- |
| `push(value)` | 将 `value` 压入栈顶 | 动态实现可能因分配失败而抛异常 |
| `pop()` | 删除当前栈顶元素 | 本文自实现版本在空栈时抛出 `std::out_of_range` |
| `top()` | 返回栈顶元素但不删除 | 本文自实现版本在空栈时抛出 `std::out_of_range` |
| `empty()` | 判断栈是否为空 | 不修改状态 |
| `size()` | 返回当前元素个数 | 不修改状态 |

::: pitfall 易错点 · 空栈不是一个元素值
不能用 `0`、空字符串或其他合法元素表示“栈为空”，否则调用方无法区分数据与失败状态。本文的自实现示例在空栈上抛异常；`std::stack::top()` 与 `std::stack::pop()` 则要求调用前栈非空，违反此前置条件会产生未定义行为。因此使用标准库时也必须先检查 `empty()`。
:::

## 3. 同一接口，不同实现

栈的语义不变，但实现可变：

- 顺序栈：数组（连续内存）
- 链栈：链表（离散内存）
- `std::stack`：C++ 标准库适配器（默认底层是 `deque`）

不同实现没有绝对的高低之分，只有契约与场景是否匹配。在业务代码中，若只需要标准 LIFO 接口，应优先考虑 `std::stack`；若需要遍历、同时观察多个尾部元素或使用特殊容量策略，则可以直接选择合适的底层容器，或在明确测试责任后自定义实现。

::: info 示例语言
本章代码以 **C++** 为主；理论表述同样适用于 C。使用 C 实现同一接口时，需要显式管理 `malloc/free` 或动态数组扩容，并自行约定错误返回方式。
:::

### 栈的不变量

::: property 性质 · 栈的共同不变量
无论采用顺序存储还是链式存储，每次公开操作结束后都应满足：

- `empty()` 当且仅当 `size() == 0`；
- 非空时，`top()` 返回最后一次尚未被 `pop()` 的 `push()` 元素；
- 成功 `push` 后，原有元素的相对次序不变，新元素成为栈顶；
- 成功 `pop` 后，原栈顶被删除，其下方元素成为新栈顶；
- 失败操作不改变栈的逻辑状态。
:::

下面分别用连续存储与链式存储实现这些约束。

### 3.1 顺序栈（数组实现）

栈顶就在数组尾部，`push/pop/top` 都在尾部操作。

若希望 `std::stack` 明确使用 `std::vector` 作为底层容器，可以写成 `std::stack<int, std::vector<int>> seqStack;`。

::: details C++ 具体实现（点击展开）

```cpp
#include <iostream>
#include <stdexcept>
#include <vector>

template <typename T>
class SeqStack {
public:
    bool empty() const { return data_.empty(); }//判空
    std::size_t size() const { return data_.size(); }//大小

    void push(const T& x) { data_.push_back(x); }//压栈

    void pop() {//弹栈
        if (empty()) throw std::out_of_range("stack is empty");
        data_.pop_back();
    }

    T& top() {//查询栈顶
        if (empty()) throw std::out_of_range("stack is empty");
        return data_.back();
    }
    const T& top() const {//查询栈顶
        if (empty()) throw std::out_of_range("stack is empty");
        return data_.back();
    }

private:
    std::vector<T> data_;
};

int main() {
    SeqStack<int> s;
    s.push(10);
    s.push(20);
    std::cout << s.top() << '\n'; // 20
    s.pop();
    std::cout << s.top() << '\n'; // 10
}
```

:::

#### 扩容与摊还复杂度

::: complexity 复杂度 · 顺序栈扩容
当顺序栈的元素个数达到当前底层容量时，动态数组需要申请更大的连续空间并移动或复制旧元素。单次扩容可能是 $O(n)$；采用成倍增长策略时，连续 $n$ 次 `push` 的总搬移量是 $O(n)$，所以平均到每次操作为摊还 $O(1)$。这不代表每一次 `push` 都是最坏 $O(1)$；完整推导见[第 1 章顺序表](../chapter-01-linear-list/02-sequential-list.md)。
:::

### 3.2 链栈（链表实现）

把链表头当作栈顶，就可以用头插和头删完成 `push` 与 `pop`。若希望 `std::stack` 明确使用 `std::list` 作为底层容器，可以写成 `std::stack<int, std::list<int>> linkStack;`。

为了更清楚地展示两种存储方式的区别，下面直接实现节点所有权，而不使用 `std::list`。

::: details C++ 具体实现示例（点击展开）

```cpp
#include <cstddef>
#include <iostream>
#include <stdexcept>

template <typename T>
class LinkedStack {
public:
    LinkedStack() = default;
    ~LinkedStack() { clear(); }

    LinkedStack(const LinkedStack&) = delete;
    LinkedStack& operator=(const LinkedStack&) = delete;
    //防止出现浅拷贝。实际上，std::list实现了深拷贝，使用指定 list 作为底层容器的 stack 时可以进行拷贝赋值操作。深拷贝具体实现方式不在此赘述。

    bool empty() const { return head_ == nullptr; }//判空
    std::size_t size() const { return size_; }//大小

    void push(const T& x) {//压栈
        Node* node = new Node{x, head_};
        head_ = node;
        ++size_;
    }

    void pop() {//弹栈
        if (empty()) throw std::out_of_range("stack is empty");
        Node* old = head_;
        head_ = head_->next;
        delete old;
        --size_;
    }

    T& top() {//查询栈顶
        if (empty()) throw std::out_of_range("stack is empty");
        return head_->value;
    }
    const T& top() const {//查询栈顶
        if (empty()) throw std::out_of_range("stack is empty");
        return head_->value;
    }

private:
    struct Node {
        T value;
        Node* next;
    };

    void clear() {//清空，防止内存泄漏
        while (head_ != nullptr) {
            Node* old = head_;
            head_ = head_->next;
            delete old;
        }
        size_ = 0;
    }

    Node* head_ = nullptr;
    std::size_t size_ = 0;
};

int main() {
    LinkedStack<int> s;
    s.push(1);
    s.push(2);
    std::cout << s.top() << '\n'; // 2
    s.pop();
    std::cout << s.top() << '\n'; // 1
}
```

:::

该示例通过析构函数释放节点，并显式删除复制操作，避免默认浅拷贝导致重复释放。由于它也没有实现移动操作，因此这是一个安全但不可复制、不可移动的教学版本；需要值语义的工程容器还应完整实现 Rule of Five，或改用智能指针表达所有权。

### 3.3 顺序栈与链栈对比

| 维度 | 顺序栈 | 链栈 |
| --- | --- | --- |
| `push` | 摊还 `O(1)` | `O(1)` |
| `pop/top` | `O(1)` | `O(1)` |
| 空间 | 连续，局部性好 | 分散，每节点多指针 |
| 容量 | 需扩容策略 | 按需增长，不需专门扩容 |
| 适用场景 | 规模可估计、追求性能 | 规模变化大、上限未知 |

## 4. 边界问题与测试

### 4.1 常见边界

1. 空栈调用 `top/pop`
2. 单元素栈入栈后立即出栈
3. 顺序栈触发扩容后顺序是否正确
4. 混合操作后栈顶是否正确

### 4.2 测试用例示例

- **用例 1：空栈**
  - 操作：创建后直接 `top/pop`
  - 预期：失败或抛异常

- **用例 2：单元素**
  - 操作：`push(42) -> top -> pop -> empty`
  - 预期：`top()` 得到 `42`，执行 `pop()` 后 `empty()` 为 `true`

- **用例 3：扩容**
  - 操作：小容量连续 `push`
  - 预期：扩容前后元素顺序不变

- **用例 4：混合**
  - 操作：`push(1), push(2), pop(), push(3)`
  - 预期：最终栈顶为 `3`

## 5. 常见误区

::: pitfall 易错点 · 把语义、实现和复杂度混为一谈
1. **“栈就是数组”**：数组是存储结构，栈是访问语义。
2. **“空栈返回默认值即可”**：默认值可能也是合法元素，必须使用独立失败机制。
3. **“`push` 一定是 $O(1)$”**：动态顺序栈的 `push` 通常是摊还 $O(1)$，触发扩容的单次操作可达 $O(n)$。
4. **“链栈一定更好”**：链栈避免整体扩容，却引入逐节点分配、指针空间和较弱的缓存局部性。
:::

## 6. 经典应用：括号匹配

栈最经典的应用之一是：**判断括号字符串是否匹配**。

- 合法：`()`, `(())`, `[]{}()`, `{[()]}`
- 非法：`(]`, `([)]`, `(()`

给定一个只包含括号与其他普通字符的字符串，可以按下面的规则判断其中的括号是否合法。

::: details 思路（点击展开）

- 遇到左括号，压栈；
- 遇到右括号，检查栈顶是否匹配；
- 匹配就弹栈，否则直接判定失败；
- 最后，所有括号都必须被完全消耗掉。

:::

::: details C++ 代码示例（点击展开）

```cpp
#include <iostream>
#include <stack>
#include <string>

bool isBalanced(const std::string& s) {
    std::stack<char> st;
    for (char ch : s) {
        if (ch == '(' || ch == '[' || ch == '{') {
            st.push(ch);
        } else if (ch == ')' || ch == ']' || ch == '}') {
            if (st.empty()) return false;
            char t = st.top();
            if ((t == '(' && ch == ')') ||
                (t == '[' && ch == ']') ||
                (t == '{' && ch == '}')) {
                st.pop();
            } else {
                return false;
            }
        }
    }
    return st.empty();
}

int main() {
    std::cout << isBalanced("([{}])") << '\n'; // 1
    std::cout << isBalanced("([)]") << '\n';   // 0
}
```

这段代码使用 C++ 标准库中的 `std::stack`。`std::stack` 默认以 `std::deque` 为底层容器；`std::deque` 通常采用分段连续存储，与本节展示的单一连续数组和逐节点链表都不完全相同。
:::

## 7. 小结

- 栈是“只能在栈顶操作”的受限线性表；
- 顺序栈和链栈接口相同、实现不同；
- 理解空栈语义、扩容摊还、边界测试，是写对栈实现的关键。

## 8. 练习与延伸

1. 空栈上调用 `top/pop`，你会选“返回失败”还是“抛异常”？为什么？
2. 若顺序栈每次只扩 1 个单位，连续压栈 `n` 次总复杂度是多少？
3. 入栈序列 `1,2,3,4`，列举合法出栈序列并说明判定思路。
4. 设计一个最小用例，专门验证“扩容后顺序不乱”。
5. 用栈判断 `([{}])`、`([)]`、`(()` 是否匹配，并说明理由。

<!-- > 继续动手可前往 [课程实验区](../labs/)。 -->
