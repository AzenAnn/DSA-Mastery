---
title: "1.2 第一种实现——顺序表 (动态数组)"
description: "深入物理连续内存映射、CPU Cache 局部性加速、乘法扩容聚合分析摊还 O(1) 证明与 25% 延迟缩容防抖动机制。"
order: 2
chapter: 1
chapterTitle: "线性表"
updated: "2026-08-18"
contributors: ["Wanderer0"]
status: "draft"
---

# 1.2 第一种实现——顺序表 (动态数组)

在 [1.1 线性表抽象数据类型](./01-abstract-data-type.md) 中，我们确立了线性表的逻辑模型与 List ADT 接口契约，并看到计算机物理内存本质上是一排带连续地址编号的字节盒子。

本节我们将探讨线性表的第一种物理实现——**顺序表（Sequential List / 动态数组 Vector）**，重点回答四个核心问题：
1. 为什么物理连续内存能够带来 $O(1)$ 随机存取，以及 CPU Cache 为何能加速连续访问？
2. 静态数组容量固定，动态数组如何实现动态扩容？
3. 为什么加法扩容开销高昂，而乘法 2 倍扩容能达成摊还 $O(1)$？
4. 为什么 50% 对称缩容会引发高频反复重分配，25% 缩容阈值如何消除抖动（Thrashing）？

---

## 学习目标

完成本节后，你应该能够：

- **理解物理寻址**：根据基地址和元素大小推导出任意下标的物理内存地址公式，解释 $O(1)$ 随机存取的底层硬件成因；
- **掌握缓存加速**：从 CPU Cache 空间局部性（Spatial Locality）解释为什么顺序表遍历常数小、访问效率高；
- **对比扩容策略**：对比加法扩容与乘法扩容的代码实现，解释为什么加法扩容会导致 $O(n^2)$ 的累积复制开销；
- **掌握聚合分析**：说明为什么普通最坏情况分析会“失真”，并运用聚合分析法（Aggregate Analysis）严密证明 2 倍扩容的**摊还 $O(1)$**；
- **分析抖动成因**：分析 50% 对称缩容引发“性能抖动（Thrashing）”的机制，说明 25% 延迟缩容阈值如何通过滞后阻尼消除高频振荡；
- **实现核心操作**：正确编写具备完整动态扩缩容、边界防御与平移逻辑的顺序表代码。

---

## 2.1 物理连续性与硬件红利

### 2.1.1 连续存储与顺序表类声明
面对内存中一排排带编号的字节盒子，要把一维逻辑序列 $L = (a_0, a_1, \dots, a_{n-1})$ 存入计算机，人类最自然的第一反应是：**把数据元素一个挨着一个、紧密无缝地塞进连续的内存盒子里**。

::: definition 顺序表 (Sequential List)
**顺序表 (Sequential List)** 是指用一段==物理地址连续==的存储单元依次存放线性表数据元素的数据结构。
:::

```text
逻辑序列:      a₀         a₁         a₂        ...        aₙ₋₁
               │          │          │                     │
               ▼          ▼          ▼                     ▼
物理内存: ┌──────────┬──────────┬──────────┬──────────┬──────────┐
          │  元素 a₀ │  元素 a₁ │  元素 a₂ │   ...    │ 元素 aₙ₋₁│
          └──────────┴──────────┴──────────┴──────────┴──────────┘
物理地址:   Loc(a₀)    Loc(a₁)    Loc(a₂)               Loc(aₙ₋₁)
           ←  L 字节 → ←  L 字节 →
```

为了在程序中管理这段物理连续内存并实现 [1.1 节定义的 List ADT 接口契约](./01-abstract-data-type.md)，顺序表类（通常称为 `Vector`）需要维护三个核心成员变量：
* **`_data`**：指向堆内存连续存储块的首地址指针；
* **`_size`**：当前已保存的有效元素数量（逻辑长度）；
* **`_capacity`**：底层实际分配的物理内存总容量。

其完整的 C++ 类声明骨架如下：

```cpp:line-numbers [vector.hpp]
#pragma once
#include "list-adt.hpp"

const int DEFAULT_CAPACITY = 8;

template <typename T>
class Vector : public List<T> {
private:
    T*  _data;      // 物理连续存储空间首地址指针
    int _size;      // 当前有效元素数量 (逻辑长度)
    int _capacity;  // 实际分配的内存容量 (物理空间)

    // 私有辅助方法：动态容量管理
    void expand();  // 空间耗尽时扩容
    void shrink();  // 空间过剩时缩容

public:
    // 构造与析构
    Vector(int cap = DEFAULT_CAPACITY);
    virtual ~Vector();

    // 1. 状态查询 (实现 List 接口)
    int size() const override { return _size; }
    bool isEmpty() const override { return _size == 0; }

    // 2. 元素存取 (实现 List 接口)
    T get(int rank) const override;
    void set(int rank, const T& elem) override;
    T& operator[](int rank);
    const T& operator[](int rank) const;

    // 3. 结构变更 (实现 List 接口)
    void insert(int rank, const T& elem) override;
    T remove(int rank) override;

    // 4. 按值检索 (实现 List 接口)
    int find(const T& value) const override;

    // 尾部快捷操作 (基于 insert/remove)
    void push_back(const T& elem) { insert(_size, elem); }
    T pop_back() { return remove(_size - 1); }
};
```

---

### 2.1.2 寻址原理：硬件级 $O(1)$ 随机存取（循秩访问）
因为物理内存是严格连续且每个元素占用相同字节数 $L$（`sizeof(T)`），任意第 $i$ 个元素 $a_i$ 的物理内存地址可以直接通过初等数学公式计算：

$$
Loc(a_i) = Loc(a_0) + i \times L
$$

::: property 寻址性质 · 循秩访问 (Call-by-Rank)
CPU 的算术逻辑单元（ALU）用一条基址变址寻址指令（如 x86 的 `[base + index * scale]`），只需 **1 次乘法 + 1 次加法** 就能在单个时钟周期内直达目标地址。无论表长 $n$ 是一百还是一亿，访问任意位置耗时恒定，时间复杂度为严格的 $O(1)$。
:::

---

### 2.1.3 缓存加速：CPU Cache 与空间局部性 (Spatial Locality)
在现代计算机体系中，CPU 运算速度极快（纳秒级），而访问主存 RAM 极慢（需要上百个时钟周期，称为“内存墙”）。为了缓解这一瓶颈，现代 CPU 配备了多级高速缓存（L1/L2/L3 Cache）。

```text
CPU 寄存器 (0.5 ns)  <--->  L1 Cache (1 ns)  <--->  L2/L3 Cache (3-10 ns)  <--->  主存 RAM (50-100 ns)
                                  ▲
                         每次加载 64 字节 Cache Line
```

::: intuition 缓存加速 · 空间局部性与 Cache Line 预加载
1. **Cache Line 机制**：CPU 从主存读取数据时，从来不是单个字节读取，而是一次性将相邻的 **64 字节块（Cache Line）** 整个搬进高速缓存。
2. **空间局部性 (Spatial Locality)**：如果程序访问了内存地址 $A$，极大概率很快会访问 $A$ 附近的内存地址。
3. **连续存储的缓存优势**：因为顺序表物理内存完全连续，当 CPU 读取 $a_0$ 时，$a_1, a_2, a_3, \dots$ 已经被硬件自动顺手预载进了 L1 Cache。后续的顺序遍历几乎 **100% 命中 Cache**。
:::

---

## 2.2 动态扩容与数学博弈

### 2.2.1 物理连续的局限：空间的不可就地扩展
物理连续带来了极致的速度，但也带来了一个核心限制：**内存空间的不可就地扩展**。

在静态数组中，如果你向操作系统申请了 10 个连续内存盒子，第 11 个盒子可能已经被系统的其他变量占用了。当第 11 个数据到来时，你**无法在原地向后延长空间**。

为了解决这一矛盾，工业级线性表必须从“静态数组”跨越到 <dfn>动态顺序表（Dynamic Array / Vector）</dfn>。

::: property 动态数组的三元不变量 (Class Invariants)
在任何操作发生的前后，顺序表必须恒满足：

$$
0 \le \text{\_size} \le \text{\_capacity}
$$

当 $\text{\_size} == \text{\_capacity}$ 时，容量耗尽，必须触发私有辅助函数 `expand()` 执行**扩容机制**：向操作系统堆内存申请一块更大的新空间，将原数据全量拷贝过去，释放旧空间，并让 `_data` 指向新空间。
:::

---

### 2.2.2 扩容策略的代码对比：加法扩容 vs 乘法扩容

在实现私有辅助函数 `expand()` 时，核心抉择在于新容量（`new_capacity`）的增长策略。业界存在两种典型的设计思路：

#### 策略 A：加法扩容（Fixed Increment / 每次固定增加 $K$）

```cpp:line-numbers [expand-additive.cpp]
void Vector<T>::expand() {
    int new_capacity = _capacity + INCREMENT; // 每次固定增加常数 K // [!code highlight]
    T* new_data = new T[new_capacity];
    for (int i = 0; i < _size; i++) {
        new_data[i] = _data[i];               // 全量复制旧元素
    }
    delete[] _data;                           // 释放旧内存
    _data = new_data;
    _capacity = new_capacity;
}
```

#### 策略 B：乘法扩容（Geometric Doubling / 每次容量翻倍 $\times 2$）

```cpp:line-numbers [expand-multiplicative.cpp]
void Vector<T>::expand() {
    int new_capacity = (_capacity == 0) ? DEFAULT_CAPACITY : _capacity * 2; // 翻倍扩容 // [!code highlight]
    T* new_data = new T[new_capacity];
    for (int i = 0; i < _size; i++) {
        new_data[i] = _data[i];                          // 全量复制旧元素
    }
    delete[] _data;                                      // 释放旧内存
    _data = new_data;
    _capacity = new_capacity;
}
```

表面上看，加法扩容每次只多要一点空间，似乎更节省内存；乘法扩容每次翻倍，看似消耗了更多空闲空间。然而，严密的渐进复杂度分析将揭示出两种策略在累积开销上的本质差异。

---

### 2.2.3 为什么需要“摊还分析”？——单次最坏分析的失真与破局

如果我们使用传统的**单次最坏情况时间复杂度 (Worst-Case Analysis)** 来评估 `push_back`（尾部追加元素）：
* 当某一次操作恰好触发扩容时，需要拷贝 $n$ 个元素，单次耗时为 $O(n)$；
* 传统分析因此会得出结论：“`push_back` 的最坏时间复杂度是 $O(n)$。”

**为什么这个结论严重失真？**
因为 $O(n)$ 的扩容**在正常乘法扩容策略下不会频繁连续发生**——两次扩容之间至少隔着 $O(n)$ 次常规插入操作。孤立地看单次最坏情况，完全脱离了实际运行规律。触发一次扩容后，底层留出了大量的空余槽位，紧接着的许多次插入操作都是代价极小的纯 $O(1)$ 赋值。孤立地看单次最坏情况，完全脱离了操作序列的真实运行规律。

为了科学评估**由一系列连续操作组成的序列中，单次操作的真实平均成本**，算法分析引入了 <dfn>摊还分析 (Amortized Analysis)</dfn>。

::: definition 摊还分析 (Amortized Analysis) 与 聚合分析法 (Aggregate Method)
* **摊还分析 (Amortized Analysis)**：在最坏情况下，评估执行一个包含连续 $n$ 个操作的序列时，每个操作所分摊到的**平均保证开销（摊还成本 Amortized Cost）**。它不同于依赖概率假设的“平均情况分析”，具有确定性的最坏序列保证。
* **聚合分析法 (Aggregate Analysis)**：摊还分析中最直接的数学计算工具。其核心思路是“先算总账，再除以次数”：先求出 $n$ 个连续操作在最坏情况下的**总时间成本上界 $T(n)$**，则单次操作的摊还成本定义为：

$$
\text{Amortized Cost} = \frac{T(n)}{n}
$$
:::

---

### 2.2.4 渐近开销推导：加法扩容 vs 乘法扩容

假设我们从空数组开始，连续执行 $n$ 次 `push_back` 插入 $n$ 个元素。

#### 1. 加法扩容的累积开销推导
设初始容量为 $0$，每次增加 $K$。扩容将发生在第 $K, 2K, 3K, \dots, \frac{n}{K} \cdot K$ 次插入时。全量拷贝的元素总次数为等差数列求和：

$$
T_{copy}(n) = K + 2K + 3K + \dots + \left(\frac{n}{K}\right)K = K \cdot \frac{\left(1 + \frac{n}{K}\right) \frac{n}{K}}{2} \approx \frac{n^2}{2K} = O(n^2)
$$

算上 $n$ 次常规写入，总代价 $T(n) = n + O(n^2) = O(n^2)$。

::: pitfall 加法扩容的累积复制开销
加法扩容单次操作的摊还成本为 $\frac{O(n^2)}{n} = O(n)$。随着数据量增长，插入操作的平均时间开销退化为线性阶，频繁扩容带来的大量元素搬移会导致效率显著降低。
:::

#### 2. 乘法扩容的摊还 $O(1)$ 证明

::: theorem 乘法扩容摊还定理
采用乘法几何翻倍扩容的动态顺序表，连续执行 $n$ 次尾部插入操作的总时间复杂度为 $O(n)$，单次插入的==摊还时间复杂度为 $O(1)$==。
:::

::: proof 乘法扩容摊还定理证明
设初始容量为 1，每次扩容为原来的 2 倍。扩容将发生在第 $1, 2, 4, 8, \dots, 2^k$ 次插入时（其中 $2^k \le n$）。
全量拷贝的元素总次数为等比数列求和：

$$
T_{copy}(n) = 1 + 2 + 4 + 8 + \dots + 2^k = \sum_{j=0}^{k} 2^j = 2^{k+1} - 1 < 2n = O(n)
$$

算上 $n$ 次常规写入，连续插入 $n$ 个元素的总时间开销 $T(n) < n + 2n = 3n = O(n)$。
单次插入的摊还成本为：

$$
\text{Amortized Cost} = \frac{T(n)}{n} < \frac{3n}{n} = 3 = O(1)
$$
证明完毕。
:::

---

### 2.2.5 缩容的陷阱：什么是“性能抖动（Thrashing）”？

有扩容自然就该有缩容。为了防止大量元素被删除后占用无效内存，我们需要在数据变少时释放多余空间。

#### 边界缺陷：对称扩缩容
* **扩容规则**：当 $\text{\_size} == \text{\_capacity}$（满载 100%）时，容量扩大为 2 倍（$200\%$）；
* **缩容规则**：当 $\text{\_size} == \text{\_capacity} / 2$（半满 50%）时，容量立即减半（$50\%$）。

```text
[边界振荡场景] 假设当前 capacity = 8, size = 8 (满载):
1. push_back()  --> 触发扩容！申请容量 16，全量拷贝 8 个元素 (耗时 O(n))  --> size=9, cap=16
2. pop_back()   --> size 变为 8 (恰好等于 16/2 = 50%)！
                    触发缩容！申请容量 8，全量拷贝 8 个元素 (耗时 O(n))   --> size=8, cap=8
3. push_back()  --> 又满了！再次触发扩容，拷贝 8 个元素 (耗时 O(n))       --> size=9, cap=16
4. pop_back()   --> 又半满了！再次触发缩容，拷贝 8 个元素 (耗时 O(n))     --> size=8, cap=8
```

::: pitfall 性能抖动 (Thrashing / 颠簸)
在容量临界点附近交替执行插入与删除时，每一次操作都会触发内存重新分配与全量数据搬移，导致单次操作时间复杂度退化为 $O(n)$，形成高频的反复重分配。
:::

#### 改进方案：25% 滞后阻尼机制 (Hysteresis)

```text
装载因子 α = _size / _capacity:

  0%               25%              50%                               100%
  ├─────────────────┼────────────────┼─────────────────────────────────┤
  │                 │                │                                 │
  │   触发 50% 缩容  │  安全阻尼缓冲区  │             正常工作区间         │ 触发 200% 扩容
  │ (缩容后装载变为 50%)│  (可自由增删)  │                                 │
```

::: property 滞后阻尼机制 (Hysteresis)
* **规则**：当装载因子 $\alpha = \text{\_size} / \text{\_capacity} \le 25\%$（四分之一满）时，才将容量减半到原来的 $50\%$。
* **阻尼效果**：缩容完成后，装载因子刚好回到 $\frac{25\%}{50\%} = 50\%$。此时无论是想继续插入直到装满（需要再加 $50\%$ 的数据），还是想继续删除直到再次缩容（需要再删 $25\%$ 的数据），都必须经过大量的常规操作缓冲，==从数学上彻底消除了震荡抖动==。
:::

其私有辅助函数 `shrink()` 的实现如下：

```cpp:line-numbers [shrink.cpp]
void Vector<T>::shrink() {
    if (_capacity <= DEFAULT_CAPACITY) return; // 维持基础容量
    if (_size > 0 && _size <= _capacity / 4) {
        int new_capacity = _capacity / 2;
        T* new_data = new T[new_capacity];
        for (int i = 0; i < _size; i++) {
            new_data[i] = _data[i];           // 复制剩余元素
        }
        delete[] _data;                       // 释放多余空间
        _data = new_data;
        _capacity = new_capacity;
    }
}
```

---

## 2.3 结构操作的实现与平移开销

在完成物理寻址与容量管理后，我们可以实现 List ADT 中定义的核心接口。其中：
* `size()` 与 `isEmpty()` 仅需读取 `_size` 成员，耗时为 $O(1)$；
* `get(rank)` 与 `set(rank, elem)` 依托寻址公式直接读写 `_data[rank]`，耗时为 $O(1)$。

接下来，我们需要实现改变表结构的两个核心操作以及一个重要操作：在任意位置插入元素 `insert(rank, elem)` 、删除元素 `remove(rank)`与按值查找`find(value)`。

### 2.3.1 插入操作（`insert`）：倒序平移

::: property 插入平移原则 · 必须倒序
在指定位置 `rank` 插入新元素时，平移必须**从最后一个元素 $\text{\_size}-1$ 开始向前遍历到 $\text{rank}$**。如果正序平移，前一个元素的值会直接覆盖掉后一个元素，导致原有数据被覆盖。
:::

```cpp:line-numbers [vector-insert.cpp]
void Vector<T>::insert(int rank, const T& elem) {
    // 1. 前置条件越界检查: 允许在 0 到 _size 之间插入 (rank == _size 为尾插)
    if (rank < 0 || rank > _size) {
        throw std::out_of_range("Insert rank out of bounds");
    }
    
    // 2. 容量检查与动态扩容
    if (_size == _capacity) {
        expand();
    }
    
    // 3. 倒序平移: 将 [rank, _size - 1] 范围内的元素向后平移一格
    for (int i = _size - 1; i >= rank; i--) { // [!code focus]
        _data[i + 1] = _data[i];
    }
    
    // 4. 写入新元素并维护不变量
    _data[rank] = elem;
    _size++;
}
```

* **最好情况**：尾部追加（$\text{rank} = \text{\_size}$），无需移动任何元素，摊还 **$O(1)$**；
* **最坏情况**：头部插入（$\text{rank} = 0$），需要平移全部 $n$ 个元素，耗时 **$O(n)$**；
* **平均情况**：假设插入各个位置的概率均等，平均移动次数为 $\frac{1}{n+1}\sum_{i=0}^n (n-i) = \frac{n}{2}$，耗时 **$O(n)$**。

---

### 2.3.2 删除操作（`remove`）：正序平移

::: property 删除平移原则 · 必须正序
删除指定位置 `rank` 的元素后，原位置留出空洞，平移必须**从 $\text{rank}+1$ 开始向后遍历到 $\text{\_size}-1$**，依次向前覆盖 `_data[i-1] = _data[i]`。
:::

```cpp:line-numbers [vector-remove.cpp]
T Vector<T>::remove(int rank) {
    // 1. 前置条件越界检查: 空表不可删，rank 必须在 [0, _size - 1]
    if (rank < 0 || rank >= _size) {
        throw std::out_of_range("Remove rank out of bounds");
    }
    
    T removed_elem = _data[rank]; // 暂存被删除元素
    
    // 2. 正序平移: 将 [rank + 1, _size - 1] 范围内的元素向前平移一格
    for (int i = rank + 1; i < _size; i++) { // [!code focus]
        _data[i - 1] = _data[i];
    }
    
    _size--; // 维护表长不变量
    
    // 3. 滞后缩容检查
    shrink();
    
    return removed_elem;
}
```

* **最好情况**：尾部删除（$\text{rank} = \text{\_size}-1$），无需移动任何元素，耗时 **$O(1)$**；
* **最坏情况**：头部删除（$\text{rank} = 0$），需要平移前移剩余全部 $n-1$ 个元素，耗时 **$O(n)$**；
* **平均情况**：平均移动次数为 $\frac{1}{n}\sum_{i=0}^{n-1} (n-1-i) = \frac{n-1}{2}$，耗时 **$O(n)$**。

---

### 2.3.3 按值查找（`find`）

```cpp:line-numbers [vector-find.cpp]
template <typename T>
int Vector<T>::find(const T& value) const {
    for (int i = 0; i < _size; i++) {
        if (_data[i] == value) {
            return i; // 找到首个匹配项，返回其秩
        }
    }
    return -1; // 遍历结束仍未找到，安全返回 -1
}
```

* **最好情况**：所寻找的元素恰好在表头，只需 1 次比对，耗时 **$O(1)$**；
* **最坏情况**：所寻找的元素恰好在表末尾或根本不存在，需要遍历整个表并进行 $n$ 次比对，耗时 **$O(n)$**；
* **平均情况**：假设目标元素存在且等概率分布在 $n$ 个位置上（每个位置概率为 $\frac{1}{n}$），平均查找长度（ASL）为：
  $$
  \text{ASL} = \sum_{i=1}^{n} i \cdot \frac{1}{n} = \frac{n + 1}{2}
  $$
  平均时间复杂度为 **$O(n)$**。

::: tip 知识延伸：从无序表到有序表的二分查找
在无序顺序表中，查找只能通过线性扫描逐个比对。如果数据元素预先按大小维护为**有序状态**，依托顺序表具备的 $O(1)$ 随机访问中点 `_data[mid]` 的能力，便可以使用**二分查找（Binary Search）**将单次查找复杂度大幅降低至 $O(\log n)$。
:::

---

## 2.4 性能全景与设计反思

### 2.4.1 复杂度全景矩阵

::: complexity 顺序表核心操作复杂度矩阵
| 操作接口 | 时间复杂度 (最好) | 时间复杂度 (最坏) | 时间复杂度 (平均/摊还) | 核心成因 |
| :--- | :--- | :--- | :--- | :--- |
| **`get(rank)` / `set(rank, e)`** | $O(1)$ | $O(1)$ | **$O(1)$** | 连续物理内存，地址直接公式计算 |
| **`push_back(e)` (尾插)** | $O(1)$ | $O(n)$ | **$O(1)$ 摊还** | 几何乘法扩容稀释搬移代价 |
| **`pop_back()` (尾删)** | $O(1)$ | $O(n)$ | **$O(1)$ 摊还** | 25% 延迟缩容消除抖动震荡 |
| **`find(value)` (无序查找)** | $O(1)$ | $O(n)$ | **$O(n)$** | 逐个比对，平均检查半数元素 |
| **`insert(rank, e)` (头/中插)**| $O(1)$ (尾插) | $O(n)$ (头插) | **$O(n)$** | 维持无缝隙特征必须倒序批量平移 |
| **`remove(rank)` (头/中删)** | $O(1)$ (尾删) | $O(n)$ (头删) | **$O(n)$** | 填补空洞必须正序批量平移 |
:::

---

### 2.4.2 连续存储的物理局限

顺序表在物理连续性上展现了极致的特性，但其利弊同样鲜明：
* **核心优势**：$O(1)$ 随机存取 + CPU Cache 空间局部性硬件加速；
* **物理局限**：只要涉及**头部或中间的插入与删除**，为了维持物理内存的无缝连续，就必须付出 $O(n)$ 的批量元素搬移代价。

如果业务场景需要频繁在头部或任意中间位置插入、删除数据，顺序表的平移开销将成为系统的性能瓶颈。要打破这一桎梏，就必须放弃物理连续的假设，转向允许节点离散存放、通过指针链接的结构——[1.3 链表与演进设计](./03-linked-list.md)。
