---
title: "Lab 03-12：三对角矩阵压缩与取值"
description: "把三对角矩阵按 k=2i+j 压缩到一维数组，练习特殊矩阵的下标换算与随机取值。"
order: 12
chapter: 3
chapterTitle: "字符串与数组"
updated: "2026-08-27"
contributors: ["Fishman"]
status: "draft"
lab: true
difficulty: "基础"
duration: "30～45 分钟"
---

# Lab 03-12：三对角矩阵压缩与取值

> 题目来源：改编自《数据结构（C 语言版）》特殊矩阵的压缩存储、王道 3.3 三对角矩阵下标换算。

三对角矩阵的非零元集中在主对角线及其上、下各一条对角线上（即 `|i-j| ≤ 1`）。本题要求你把它压缩到一维数组，并按 `k = 2i + j` 换算下标后回答查询。

## 题目

### 三对角矩阵压缩

3.3 中，三对角矩阵第 0 行与第 n-1 行各有 2 个非零元，其余各行各有 3 个，共 `3n-2` 个；按行优先压缩后，`A[i][j]`（`|i-j| ≤ 1`）在一维数组中的下标为 `k = 2i + j`。

### 任务要求

1. 从标准输入读入 n 阶完整矩阵（保证 `|i-j| > 1` 的元素为 0）；
2. 把非零元压缩到一维数组（下标 `k = 2i + j`）；
3. 对每个查询 `(i, j)` 输出 `A[i][j]`：`|i-j| ≤ 1` 时从压缩数组取值，否则输出 `0`。

## 输入格式

- 第一行：`n`（矩阵阶数）；
- 接下来 n 行：每行 n 个整数（三对角矩阵）；
- 接下来一行：`q`（查询次数）；
- 接下来 q 行：每行两个整数 `i j`（0-based 下标）。

## 输出格式

- 对每个查询输出一行：`A[i][j]` 的值。

## 数据范围与限制

| 项目 | 范围 |
| --- | --- |
| `n` | 1 ≤ n ≤ 10³ |
| `q` | 1 ≤ q ≤ 10⁴ |
| 元素值 | -10⁹ ≤ a ≤ 10⁹ |
| 时间复杂度 | O(n² + q) |
| 空间复杂度 | O(n)（压缩后） |

## 样例

### 样例输入 1

```input
4
1 2 0 0
3 4 5 0
0 6 7 8
0 0 9 10
3
0 0
1 2
0 3
```

### 样例输出 1

```output
1
5
0
```

### 样例解释

`A[0][0]=1`；`A[1][2]=5`（主对角线右侧一条）；`A[0][3]` 的 `|0-3|=3>1`，落在三对角之外，恒为 0。

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
pnpm lab:doctor -- labs/chapter-03/lab-03-12-tridiagonal-compress
pnpm lab:run -- labs/chapter-03/lab-03-12-tridiagonal-compress
pnpm lab:score -- labs/chapter-03/lab-03-12-tridiagonal-compress
```

- [ ] 样例通过；
- [ ] 能手工推导 `A[i][j]`（`|i-j|≤1`）的压缩下标 `k = 2i + j`；
- [ ] `|i-j|>1` 返回 0、矩阵首尾两行的 2 个非零元两种边界都有证据。

## 思考题

1. 为什么三对角矩阵能压缩到 `3n-2` 而不是 `n²`？省下的空间占比随 n 如何变化？
2. 压缩下标 `k = 2i + j` 是怎么推导出来的？第 i 行的起始位置为什么是 `2i`？
3. 如果改为按列优先压缩，`A[i][j]` 的下标公式会变成什么？

## 题解

<details>
<summary>点击查看题解</summary>

### 思路

第 i 行（i≥1）有 3 个非零元 `A[i][i-1]`、`A[i][i]`、`A[i][i+1]`，第 0 行与第 n-1 行各 2 个。第 i 行的起始偏移为 `2 + 3(i-1) = 3i-1`，元素 `A[i][j]` 在行内是第 `j-(i-1)` 个，故

`k = (3i-1) + (j-i+1) = 2i + j`。

查询时：若 `|i-j| > 1` 直接返回 0，否则返回 `b[2i+j]`。

### 复杂度分析

读入 O(n²)，压缩 O(n²)，每个查询 O(1)；压缩数组空间 O(3n-2) = O(n)。

### 边界注意

- `|i-j| > 1` 的元素不在压缩数组里，直接返回 0；
- 第 0 行只有 `j=0,1`、第 n-1 行只有 `j=n-2,n-1`，`k=2i+j` 依然有效。

</details>
<details>
<summary>点击查看参考代码</summary>

```cpp
#include <iostream>
#include <vector>

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);
    int n;
    std::cin >> n;
    std::vector<std::vector<int>> a(n, std::vector<int>(n));
    for (int i = 0; i < n; ++i)
        for (int j = 0; j < n; ++j)
            std::cin >> a[i][j];

    std::vector<int> b(3 * n - 2, 0);
    for (int i = 0; i < n; ++i)
        for (int j = std::max(0, i - 1); j <= std::min(n - 1, i + 1); ++j)
            b[2 * i + j] = a[i][j];

    int q;
    std::cin >> q;
    while (q--) {
        int i, j;
        std::cin >> i >> j;
        if (std::abs(i - j) <= 1)
            std::cout << b[2 * i + j] << '\n';
        else
            std::cout << 0 << '\n';
    }
    return 0;
}
```

</details>
