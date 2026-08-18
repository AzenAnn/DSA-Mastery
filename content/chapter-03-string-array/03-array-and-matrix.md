---
title: "3.3 数组寻址与特殊矩阵"
description: "数组的定义与顺序存储寻址，以及对称、三角、三对角与稀疏矩阵的压缩存储。"
order: 3
chapter: 3
chapterTitle: "字符串与数组"
updated: "2026-08-18"
contributors: ["Azen", "Fishman"]
status: "draft"
---

# 3.3 数组寻址与特殊矩阵

数组是"按下标随机存取"的数据结构：逻辑上它可能有多维，物理上它占据一段连续内存。理解**多维下标到一维地址的映射**，是掌握数组存储的关键；理解**特殊矩阵的压缩**，则是空间优化的典型练习。

## 学习目标

- 写出数组的 ADT，说明数组是线性表的推广；
- 由行优先/列优先推导二维与 n 维数组的寻址公式；
- 用压缩存储表示对称、三角、三对角矩阵，并推导下标换算；
- 用三元组与十字链表表示稀疏矩阵，比较转置算法的复杂度。

## 数组的定义与 ADT

数组是由 $n\ (n>1)$ 个相同类型元素组成的有序序列，是线性表的推广：二维数组可看作"元素是一维数组的一维数组"，n 维数组可看作"元素是 $n-1$ 维数组的一维数组"。数组一旦建立，元素个数与元素间关系就不再变化，因此**一般只做存取、不做插入删除**，采用顺序存储。

```
ADT Array {
  数据对象：D = { a[j1][j2]…[jn] | n>0 为维数，bi 是第 i 维长度，ji 是第 i 维下标 }
  数据关系：每个维度上相邻元素构成一个线性关系（共 n 个）
  基本操作：
    InitArray(&A, n, bound1, …, boundn)   // 构造 n 维数组
    DestroyArray(&A)                      // 销毁数组
    Value(A, &e, index1, …, indexn)        // 按下标取元素值
    Assign(&A, e, index1, …, indexn)       // 按下标存元素值
}
```

## 顺序存储与寻址

多维数组要映射到一维内存，有两种次序约定：

- **行优先（Row Major Order）**：先排最右下标，从左到右逐维收缩；C/C++ 采用。
- **列优先（Column Major Order）**：先排最左下标；Fortran 采用。

设二维数组 `A[m][n]` 首地址为 `base`、每个元素占 `size` 字节，行优先下 `A[i][j]` 的地址为：

$$
\mathrm{addr}(A[i][j]) = base + (i \times n + j) \times size.
$$

```cpp:line-numbers [row-major.cpp]
// 下标 (i, j) 在行优先一维数组中的偏移
std::size_t row_major_offset(std::size_t i, std::size_t j, std::size_t cols) {
    return i * cols + j;
}

// 列优先：把行、列角色互换
std::size_t col_major_offset(std::size_t i, std::size_t j, std::size_t rows) {
    return j * rows + i;
}
```

`O(1)` 的随机访问正是由这一固定公式保证的。推广到 n 维数组 $A[b_0][b_1]\cdots[b_{n-1}]$（下标从 0 开始），行优先的偏移为：

$$
\mathrm{offset}(j_0,\dots,j_{n-1}) = \sum_{k=0}^{n-1}\Big(j_k \cdot \prod_{s=k+1}^{n-1} b_s\Big),
$$

其中空乘积（$k=n-1$ 时）取 1。由于计算任一元素地址的时间相等，数组被称为**随机存取结构**。

## 对称矩阵压缩

若 `A` 是 $n \times n$ 对称矩阵（`A[i][j] = A[j][i]`），只需存储下三角（含对角线）共：

$$
\frac{n(n+1)}{2}
$$

个元素，用一维数组 `B` 保存。访问 `A[i][j]`（$i \ge j$）时按下三角行优先换算：

$$
k = \frac{i(i+1)}{2} + j.
$$

当 `i < j` 时利用对称性交换下标即可。

## 三角矩阵

三角矩阵的主对角线一侧（不含对角线）的元素全为常数 `c`（常取 0）。除存三角区元素外，再额外用一个位置存 `c`。

- **下三角矩阵**（$i \ge j$ 存元素，$i < j$ 为常数）：

$$
k = \begin{cases}
\dfrac{i(i+1)}{2} + j, & i \ge j \\[4pt]
\dfrac{n(n+1)}{2}, & i < j \ (\text{常数 } c)
\end{cases}
$$

- **上三角矩阵**（$i \le j$ 存元素，$i > j$ 为常数）：`A[i][j]`（$i \le j$）映射为

$$
k = \frac{i(2n - i + 1)}{2} + (j - i).
$$

## 三对角矩阵

三对角矩阵的非零元集中在主对角线及其上、下各一条对角线上，即 $|i-j| \le 1$ 时 $A[i][j]$ 可能非零。第 0 行与第 $n-1$ 行各 2 个非零元，其余各行 3 个，共 $3n-2$ 个。按行优先压缩到一维数组时：

$$
k = 2i + j.
$$

```cpp:line-numbers [tridiagonal.cpp]
// 三对角矩阵按行优先压缩存储的下标换算（0 起始）
std::size_t tridiagonal_offset(std::size_t i, std::size_t j) {
    return 2 * i + j;   // 仅当 |i - j| <= 1 时有效
}
```

## 稀疏矩阵

当非零元个数 `t` 远小于 $m \times n$（如稀疏因子 $\delta = t/(mn) \le 0.05$），直接存二维数组会浪费大量空间。稀疏矩阵只存每个非零元的三元组 `(row, col, value)` 及行列数。

### 三元组顺序表

```cpp:line-numbers [sparse-triple.cpp]
struct Triple { std::size_t row, col; int value; };

// 稀疏矩阵：行数、列数、非零元个数 + 三元组表
struct SparseMatrix {
    std::size_t rows, cols;
    std::vector<Triple> data;   // 按 (row, col) 有序
};
```

空间代价从 $O(n^2)$ 降到 `O(t)`。代价是随机访问 `A[i][j]` 需要查找三元组，无法直接寻址——若按行存储可在行内二分，最坏 `O(\log t)`。

### 转置与快速转置

转置只需把每个三元组的行列互换，但要**重排**成行优先。普通转置按「M 的列序」逐列扫描 `M.data`，把列号为 `col` 的三元组依次放入 `T.data`，需两重循环，复杂度 $O(\text{cols} \times t)$。

**快速转置**先统计 M 每列非零元个数 `num[col]`，再求出每列首元素在 `T.data` 中的位置 `cpot[col]`：

$$
cpot[0] = 0,\qquad cpot[col] = cpot[col-1] + num[col-1].
$$

之后对 `M.data` 一趟扫描，直接放到 `T.data` 的恰当位置，复杂度降到 $O(\text{rows} + \text{cols} + t)$。实现细节见配套 Lab 03-02。

### 十字链表

当非零元个数与位置在运算中变化较大（如矩阵相加），顺序表会因插入删除而频繁移动元素，改用链式存储。每个非零元结点含五个域：`row`、`col`、`value`、`right`（指向同行下一个非零元）、`down`（指向同列下一个非零元），构成十字交叉链表。

```cpp:line-numbers [cross-list.cpp]
struct OLNode {
    std::size_t row, col;
    int value;
    OLNode *right, *down;   // 同行后继、同列后继
};
```

两个十字链表表示的稀疏矩阵相加，只需逐行扫描两条链，复杂度 $O(t_a + t_b)$。

::: warning 压缩是有代价的
压缩把空间换成时间：对称矩阵的下标换算保持 `O(1)` 访问，而稀疏矩阵三元组的访问依赖查找。不要只看空间收益，操作模式（随机访问 vs 批量处理）决定哪种方案合适。
:::

## 小结

数组的寻址公式是"连续内存 + 固定步长"的直接产物；特殊矩阵的压缩利用的是矩阵的结构规律；稀疏矩阵把空间换成查找时间。判断能否压缩、如何换算下标，比死记公式更重要——遇到新类型的结构矩阵时，方法是一样的。

## 练习

1. 推导列优先存储下 `A[i][j]` 的地址公式（下标从 0 开始）。
2. 对称矩阵压缩存储后，访问 `A[j][i]`（`j < i`）时下标如何换算？
3. 三对角矩阵中元素 `A[i][j]`（`|i-j| > 1`）的值一定是什么？为什么能直接跳过存储？
4. 稀疏度 $\delta = t/(mn)$ 达到多少时，三元组表才比二维数组省空间（按字节估算）？
5. 说明快速转置比普通转置快在哪里，并写出 `num` 与 `cpot` 的计算过程。
