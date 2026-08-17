---
title: "2.1 栈"
description: "受限线性表的后进先出语义，以及顺序栈与链栈的实现取舍。"
order: 1
chapter: 2
chapterTitle: "栈与队列"
updated: "2026-08-16"
contributors: ["qzmqzm123"]
status: "draft"
---

# 2.1 栈

> **本节概述**：栈是最基础的受限线性结构之一。它把“任意位置操作”限制为“只能在栈顶操作”，由此形成后进先出（LIFO）语义。你将学会它的抽象接口、两种典型实现、复杂度与常见坑。

## 1. 为什么需要栈

很多问题天然满足“后来的先处理”：

- 编辑器撤销：最后一次操作最先撤销；
- 函数调用返回：最后调用的函数先返回；
- 括号匹配：最后遇到的左括号先匹配。

这种顺序约束就是栈：**最后入栈，最先出栈**。

---

## 2. 栈的 ADT（抽象数据类型）

栈只开放栈顶一端：

- `push(x)`：压栈（将 `value` 压入栈顶）
- `pop()`：弹栈（删除栈顶元素）
- `top()`：查看栈顶但不弹出
- `empty()`：判空
- `size()`：元素个数

**注意**：空栈语义必须明确

- 空栈 `pop/top` 不能“偷偷返回默认值”；
- 应显式返回失败（如 `bool + out`）或抛异常。

这能避免把合法值（如 `0`）和“空栈状态”混淆。

---

## 3. 同一接口，不同实现

栈的语义不变，但实现可变：

- 顺序栈：数组（连续内存）
- 链栈：链表（离散内存）
- `std::stack`：C++ 标准库适配器（默认底层是 `deque`）

**注意**：不同实现没有高低贵贱之分，只有是否适合之分。在 C++ 中，我们也并不总是使用封装好的 `std::stack`，对于某些情况（如需关心栈顶多个元素的变种），自己实现可能更加简洁方便。

> 本章代码以 **C++** 为主；理论表述与 C 课程一致。  
> 在 C 中实现同样接口时，通常需要手工管理内存（`malloc/free` 或动态数组扩容）。

### 3.1 顺序栈（数组实现）

**核心思想**：栈顶就在数组尾部，`push/pop/top` 都在尾部操作。

对应 `std::stack` 明确指定 vector 作为底层容器，即：`std::stack<int, std::vector<int>> seqStack;`

<details>
<summary><strong>C++ 具体实现示例（可展开）</strong></summary>

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

</details>

#### 扩容与摊还复杂度（详见 [1.2 顺序表](/learn/chapter-01-linear-list/02-sequential-list/#_2-2-动态扩容机制与摊还分析-amortized-analysis)）

顺序栈满时需要扩容并复制旧元素。单次扩容可能是 `O(n)`，但若按“翻倍扩容”，长期平均每次 `push` 仍是摊还 `O(1)`。

### 3.2 链栈（链表实现）

**核心思想**：把链表头当栈顶，头插入、头删除。

对应 `std::stack` 明确指定 list 作为底层容器，即 `std::stack<int, std::list<int>> linkStack;`

为了更清楚地展示链栈与顺序栈的区别，下面的实现示例采用了自己实现链表的方式，没有直接使用 `std::list`。

<details>
<summary><strong>C++ 具体实现示例（可展开）</strong></summary>

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

</details>

### 3.3 顺序栈与链栈对比

| 维度 | 顺序栈 | 链栈 |
| --- | --- | --- |
| `push` | 摊还 `O(1)` | `O(1)` |
| `pop/top` | `O(1)` | `O(1)` |
| 空间 | 连续，局部性好 | 分散，每节点多指针 |
| 容量 | 需扩容策略 | 按需增长，不需专门扩容 |
| 适用场景 | 规模可估计、追求性能 | 规模变化大、上限未知 |

---

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
  - 预期：依次得到 `42`、`42`、最终为空

- **用例 3：扩容**
  - 操作：小容量连续 `push`
  - 预期：扩容前后元素顺序不变

- **用例 4：混合**
  - 操作：`push(1), push(2), pop(), push(3)`
  - 预期：最终栈顶为 `3`

---

## 5. 常见误区

1. **“栈就是数组”**：错。数组是存储结构，栈是访问语义。
2. **空栈返回默认值就行**：错。会混淆“合法值”和“失败状态”。
3. **“push 一定是 O(1)”**：错。应说“顺序栈 push 摊还 `O(1)`”，单次扩容可达 `O(n)`。
4. **链栈一定更好**：错。两者是场景取舍，不是高低之分。

---

## 6. 经典应用：括号匹配

栈最经典的应用之一是：**判断括号字符串是否匹配**。

- 合法：`()`, `(())`, `[]{}()`, `{[()]}`
- 非法：`(]`, `([)]`, `(()`

给你一个括号字符串，怎么样可以知道它是否合法呢？

<details>
<summary><strong>思路（可展开）</strong></summary>

- 遇到左括号，压栈；
- 遇到右括号，检查栈顶是否匹配；
- 匹配就弹栈，否则直接判定失败；
- 最后，所有括号都必须被完全消耗掉。

</details>

<details>
<summary><strong>C++ 代码示例（可展开）</strong></summary>

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

这段代码里我们使用了 C++ 标准库中的 `std::stack`，其默认底层容器是 `std::deque<T>`，介于顺序栈和链栈二者之间。

</details>

---

## 7. 小结

- 栈是“只能在栈顶操作”的受限线性表；
- 顺序栈和链栈接口相同、实现不同；
- 理解空栈语义、扩容摊还、边界测试，是写对栈实现的关键。

---

## 8. 练习与延伸

1. 空栈上调用 `top/pop`，你会选“返回失败”还是“抛异常”？为什么？
2. 若顺序栈每次只扩 1 个单位，连续压栈 `n` 次总复杂度是多少？
3. 入栈序列 `1,2,3,4`，列举合法出栈序列并说明判定思路。
4. 设计一个最小用例，专门验证“扩容后顺序不乱”。
5. 用栈判断 `([{}])`、`([)]`、`(()` 是否匹配，并说明理由。

> 继续动手可前往 [课程实验区](../labs/)。
