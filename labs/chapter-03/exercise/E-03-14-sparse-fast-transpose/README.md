---
title: "Lab 03-E-14：稀疏矩阵三元组快速转置"
description: "用 num 与 cpot 一次扫描完成稀疏矩阵三元组表的快速转置，输出列位置表与转置后的三元组。"
order: 18
chapter: 3
labId: "03E14"
chapterTitle: "字符串与数组"
updated: "2026-09-14"
contributors: ["Gaoqp123"]
status: "draft"
lab: true
difficulty: "进阶"
duration: "50～70 分钟"
---

# Lab 03-E-14：稀疏矩阵三元组快速转置

> 题目来源：改编自严蔚敏《数据结构（C 语言版）》3.3 稀疏矩阵的十字链表与三元组顺序表、王道《数据结构》特殊矩阵与稀疏矩阵的压缩存储。

稀疏矩阵里绝大多数元素是 `0`，为它们预留存储空间并不划算，于是只记录非零元：`(行, 列, 值)` 三个域组成一个三元组，再把所有三元组按行优先顺序排成一张**三元组顺序表**。转置需要交换每个三元组的行与列，问题是转置之后三元组应当按“转置后的行优先”排列，也就是按**原列序**排列。若对每个列都重新扫描整张表，复杂度是 `O(nnz × cols)`；本题要求先把每列的非零元个数统计出来，再求一次前缀和得到每列在转置表中的起始位置，从而一趟扫描完成转置。

## 题目

### 稀疏矩阵的三元组顺序表

设矩阵有 `rows` 行、`cols` 列，非零元个数为 `nnz`。三元组顺序表按**行优先**存放：

$$
\{(r_0, c_0, v_0),\ (r_1, c_1, v_1),\ \dots,\ (r_{nnz-1}, c_{nnz-1}, v_{nnz-1})\},
$$

其中 `(r, c)` 都是 **0-based**，且保证按 `r` 升序排列、同一个 `r` 内按 `c` 升序排列（即行优先严格有序），**坐标不重复**。

### 快速转置需要的两个数组

教科书把快速转置拆成两步：

1. `num[c]`：转置后第 `c` 行（即原矩阵第 `c` 列）的非零元个数。扫描一遍三元组表即可得到。
2. `cpot[c]`：转置后第 `c` 行在转置三元组表中的**起始存放下标**。本题采用 **0-based 前缀和**定义：

$$
\text{cpot}[0] = 0,\qquad \text{cpot}[c] = \text{cpot}[c-1] + \text{num}[c-1]\quad (1 \le c < \text{cols}).
$$

这样 `num` 与 `cpot` 满足 `cpot[c] + num[c] = cpot[c+1]`，`cpot` 的每一段正好指向转置表中连续的一块。

### 任务要求

1. 从标准输入读入 `rows cols nnz` 与 `nnz` 个三元组；
2. 用 `num` 与 `cpot` 完成**快速转置**，输出列位置表 `cpot`、转置矩阵的形状与三元组表；
3. 时间复杂度必须是 `O(nnz + cols)`，不允许对每一列重新扫描整张表；
4. `cpot` 采用上面的 **0-based 前缀和**定义（不是教科书中常见的 1-based 写法），`nnz = 0` 时输出 `cols` 个 `0`。

### 为什么必须输出 cpot

转置后的三元组表本身可以“按列收集再排序”得到，也能用逐列扫描的朴素写法算出来（只是慢）。真正体现“快速”二字的，是 `cpot` 这张位置表：**只有先把每列的起始下标算对，才能在 `O(1)` 时间内把每个三元组一次放到转置表的正确位置**。把 `cpot` 一并输出，判题才能确认你确实走了“计数 + 前缀和 + 一趟定位”的路线，而不是碰巧排对了顺序；否则朴素转置也能拿满分，就考不出“快速”这个考点。

## 输入格式

- 第一行：三个整数 `rows cols nnz`，空格分隔；
- 随后 `nnz` 行：每行三个整数 `r c v`，表示第 `r` 行第 `c` 列有一个值为 `v` 的非零元；
- `r`、`c` 均为 0-based；保证三元组按行优先严格有序（`r` 升序，`r` 相同时 `c` 升序）且坐标不重复；
- `nnz = 0` 时没有后续行。

## 输出格式

- 第一行：`cols` 个整数，依次是 `cpot[0]` 到 `cpot[cols−1]`，用单个空格分隔；`nnz = 0` 时这一行是 `cols` 个 `0`；
- 第二行：三个整数 `cols rows nnz`，即转置后的形状与同一批非零元；
- 随后 `nnz` 行：每行 `c r v`，按**转置后行优先**（即原列序升序；同一列内按原行序升序）排列；
- 行末无多余空格；判分按 token 比较，空行与省略行等价，但请按上面的行数输出。

## 数据范围与限制

| 项目 | 范围 |
| --- | --- |
| `rows` | 0 ≤ rows ≤ 10⁵ |
| `cols` | 0 ≤ cols ≤ 2×10⁵ |
| `nnz` | 0 ≤ nnz ≤ 10⁵ |
| 非零元数值 `v` | \|v\| ≤ 10⁹ |
| 时间复杂度 | O(nnz + cols) |
| 空间复杂度 | O(nnz + cols)，判题限制 2000 ms / 输出 4096 KB |

`cols = 0` 时第一行为空，第二行只输出 `0 rows nnz`。

**关于输出上限 4096 KB：** 本章其余 Lab 沿用默认的 `outputKb = 1024`，本 Lab 单独放宽到 4096 KB。原因是压力点 `019`（`cols = 2×10⁵`、`nnz = 5×10⁴`）的 `cpot` 行本身就有 20 万个数，连同 5 万行转置三元组，标准输出约 2 MB；默认上限会让正确实现因为输出超限被误判为 OLE。`timeMs` 保持默认 2000 ms，参考解在 019 上是毫秒级。

## 样例

### 样例输入 1

```input
3 4 5
0 0 8
0 3 -6
1 1 4
1 2 9
2 2 3
```

### 样例输出 1

```output
0 1 2 4
4 3 5
0 0 8
1 1 4
2 1 9
2 2 3
3 0 -6
```

### 样例输入 2

```input
2 3 0
```

### 样例输出 2

```output
0 0 0
3 2 0
```

### 样例解释

样例 1 的原矩阵是 3 行 4 列：

$$
A=\begin{pmatrix}
8 & 0 & 0 & -6\\
0 & 4 & 9 & 0\\
0 & 0 & 3 & 0
\end{pmatrix}.
$$

**先数每列的非零元个数。** 第 0 列只有 `(0,0,8)`，第 1 列只有 `(1,1,4)`，第 2 列有 `(1,2,9)` 与 `(2,2,3)`，第 3 列只有 `(0,3,-6)`：

| `c` | 0 | 1 | 2 | 3 |
| --- | --- | --- | --- | --- |
| `num[c]` | 1 | 1 | 2 | 1 |

**再做 0-based 前缀和。** `cpot[0] = 0`，之后每一项等于前一项加上前一项对应的 `num`：

| `c` | 0 | 1 | 2 | 3 |
| --- | --- | --- | --- | --- |
| `cpot[c]` | 0 | `0+num[0]=1` | `1+num[1]=2` | `2+num[2]=4` |

所以第一行是 `0 1 2 4`，这四个数是转置三元组表里第 0、1、2、3 行的起始下标：第 0 行占下标 `0`，第 1 行占下标 `1`，第 2 行占下标 `2、3`，第 3 行占下标 `4`。

**再按列取原三元组。** 原表已经按行优先有序，所以依次处理 `(0,0,8)`、`(0,3,-6)`、`(1,1,4)`、`(1,2,9)`、`(2,2,3)` 时，每一列收到的顺序天然就是行序升序，直接放在 `cpot[c]` 处并让 `cpot[c]` 自增即可：`(0,0,8)` 落到下标 `0`；`(0,3,-6)` 落到下标 `4`；`(1,1,4)` 落到下标 `1`；`(1,2,9)` 落到下标 `2`；`(2,2,3)` 落到下标 `3`。转置表就是 `(0,0,8) (1,1,4) (2,1,9) (2,2,3) (3,0,-6)`，写成 `c r v` 即样例输出的后 5 行；转置矩阵是 4 行 3 列，所以第二行是 `4 3 5`。

样例 2 的 `nnz = 0`：没有任何非零元，每一列的 `num` 都是 `0`，前缀和自然全是 `0`，于是第一行输出 3 个 `0`；转置矩阵是 3 行 2 列、同样没有非零元，第二行输出 `3 2 0`，后面没有更多行。

## 如何验证

先安装 Node.js、pnpm 和支持 C++17 的编译器。GNU Make 是首选入口，但不是强制依赖。

```powershell
# 已进入本 Lab 目录
make doctor
make run
make run CASE=001-sample
make interactive
make score
```

Windows 没有安装 Make 时，在仓库根目录使用完全相同的评分内核：

```powershell
pnpm lab doctor labs/chapter-03/exercise/E-03-14-sparse-fast-transpose
pnpm lab run labs/chapter-03/exercise/E-03-14-sparse-fast-transpose
pnpm lab score labs/chapter-03/exercise/E-03-14-sparse-fast-transpose
```

- [ ] 样例通过，且第一行 `cpot` 与手算的前缀和一致；
- [ ] `nnz = 0`、`nnz = 1`、`cols = 1`、`rows = 1`、满矩阵五种边界都有证据；
- [ ] `cols = 2×10⁵`、`nnz = 5×10⁴` 的压力用例在 2000 ms 内跑完（朴素“对每一列扫一遍全表”要 10¹⁰ 次比较，必然超时），即实现确实是 `O(nnz + cols)`。

## 思考题

1. 如果把 `cpot` 改成教科书中常见的 1-based 定义（`cpot[0] = 1`，`cpot[c] = cpot[c-1] + num[c-1]`），快速转置的循环体需要改哪几处？两种定义各自的好处是什么？
2. 为什么快速转置要求输入三元组按行优先有序？如果输入顺序任意，还能在 `O(nnz + cols)` 内完成吗？需要付出什么代价？
3. 十字链表存储稀疏矩阵时，转置只需要交换每个结点的行指针与列指针，不需要重排元素。两种存储结构在“转置”“按行求和非零元”“矩阵相加”三种操作上各有什么优势？

## 题解

<details>
<summary>点击查看题解</summary>

### 思路

快速转置分三步：

1. **计数**：一趟扫描原三元组表，把每个三元组的列 `c` 累加到 `num[c]`，得到 `O(nnz + cols)` 的列计数；
2. **前缀和**：令 `cpot[0] = 0`，随后 `cpot[c] = cpot[c-1] + num[c-1]`，于是 `cpot[c]` 就是转置表中第 `c` 行的起始下标；
3. **定位**：再一趟扫描原三元组表，把 `(r, c, v)` 写成 `(c, r, v)` 放在转置表的 `cpot[c]` 位置，然后 `cpot[c] += 1`，为同一列的下一个元素准备好位置。

第 3 步成立的关键是输入已经按行优先有序：处理到某一列时，先出现的三元组行号一定更小，所以“边扫边放”得到的就是列内行序升序，无需再排序，总复杂度保持 `O(nnz + cols)`。

### 复杂度分析

时间：两次线性扫描加一次 `cols` 长度的前缀和，共 `O(nnz + cols)`；压力点 `cols = 2×10⁵`、`nnz = 5×10⁴` 时快速转置只做约 `2.5×10⁵` 次基本操作，而朴素的“对每一列扫一遍全表”是 `O(nnz × cols) = 1×10¹⁰`，按实测基线（`3×10⁸` 次比较约 303 ms）外推约 10 秒，必然超时。
空间：原表、转置表各 `nnz` 个三元组，外加 `cols` 个 `num` 与 `cols` 个 `cpot`（就地复用 `cpot` 可省一个数组），共 `O(nnz + cols)`。元素值可达 `10⁹`，计数与前缀和最大只有 `10⁵`，用 `int` 足够，但值域用 `long long` 更稳妥。

### 边界注意

- `nnz = 0`：`num` 全为 `0`，`cpot` 全为 `0`，输出 `cols` 个 `0`；`cols = 0` 时第一行为空；
- `cols = 1`：只有一列，第一行只是一个数 `0`，转置矩阵变成 `1 × rows`；
- `rows = 1`：原矩阵只有一行，转置后每列在输出中最多一个元素；
- 满矩阵：`nnz = rows × cols`，`num[c]` 恒等于 `rows`，`cpot[c] = c × rows`；
- 数值可为负，甚至可以是 `-10⁹`，统计 `num` 时只看坐标、不看值；
- 同一列元素特别多（例如 `rows = 3×10⁴` 而非零元全部挤在最后一列，见边界用例 `020`）时，转置表会被这一列占满，`cpot` 自增必须严格按顺序进行；此时 `cpot` 前面绝大多数项都是 `0`，只有最后一列非零。

### 参考代码

```cpp
#include <iostream>
#include <vector>

struct Triple {
    int row;
    int col;
    long long value;
};

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    int rows = 0;
    int cols = 0;
    int nnz = 0;
    std::cin >> rows >> cols >> nnz;

    std::vector<Triple> source(static_cast<std::size_t>(nnz));
    std::vector<int> num(static_cast<std::size_t>(cols), 0);
    for (int index = 0; index < nnz; ++index) {
        std::cin >> source[index].row >> source[index].col >> source[index].value;
        ++num[source[index].col];
    }

    std::vector<int> cpot(static_cast<std::size_t>(cols), 0);
    for (int col = 1; col < cols; ++col) {
        cpot[col] = cpot[col - 1] + num[col - 1];
    }

    for (int col = 0; col < cols; ++col) {
        if (col) std::cout << ' ';
        std::cout << cpot[col];
    }
    std::cout << '\n';

    std::cout << cols << ' ' << rows << ' ' << nnz << '\n';

    std::vector<Triple> transposed(static_cast<std::size_t>(nnz));
    for (const Triple& item : source) {
        transposed[cpot[item.col]++] = Triple{item.col, item.row, item.value};
    }
    for (const Triple& item : transposed) {
        std::cout << item.row << ' ' << item.col << ' ' << item.value << '\n';
    }
    return 0;
}
```

</details>
