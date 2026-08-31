---
title: "Lab 03-13：多维数组行优先寻址"
description: "由多维数组的各维长度与下标推导行优先的一维偏移量，理解多维下标到一维地址的映射。"
order: 13
chapter: 3
chapterTitle: "字符串与数组"
updated: "2026-08-27"
contributors: ["Fishman"]
status: "draft"
lab: true
difficulty: "基础"
duration: "30～45 分钟"
---

# Lab 03-13：多维数组行优先寻址

> 题目来源：改编自《数据结构（C 语言版）》数组的顺序存储与寻址、王道 3.3 多维数组寻址公式。

数组逻辑上可能有多维，物理上却占一段连续内存。本题要求你由各维长度与下标，推导行优先（Row Major Order）下的一维偏移量。

## 题目

### 多维数组行优先偏移

3.3 中，n 维数组 `A[b0][b1]…[b_{n-1}]`（下标从 0 开始）行优先的一维偏移为：

$$
\mathrm{offset}(j_0,\dots,j_{n-1}) = \sum_{k=0}^{n-1}\Big(j_k \cdot \prod_{s=k+1}^{n-1} b_s\Big),
$$

其中空乘积（`k = n-1` 时）取 1。

### 任务要求

1. 从标准输入读入维数 `n`、各维长度 `b[0..n-1]` 与下标 `idx[0..n-1]`；
2. 按行优先公式计算并输出一维偏移量。

## 输入格式

- 第一行：`n`（维数）；
- 第二行：n 个整数，各维长度 `b[0..n-1]`；
- 第三行：n 个整数，下标 `idx[0..n-1]`（0-based）。

## 输出格式

- 一行一个整数：行优先偏移量。

## 数据范围与限制

| 项目 | 范围 |
| --- | --- |
| `n` | 1 ≤ n ≤ 10 |
| `b[k]` | 1 ≤ b[k] ≤ 10 |
| 时间复杂度 | O(n²) 或 O(n) |
| 空间复杂度 | O(n) |

## 样例

### 样例输入 1

```input
2
3 4
1 2
```

### 样例输出 1

```output
6
```

### 样例输入 2

```input
3
2 3 4
1 2 3
```

### 样例输出 2

```output
23
```

### 样例解释

样例 1：`offset = 1×4 + 2 = 6`；样例 2：`offset = 1×(3×4) + 2×4 + 3 = 23`。

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
pnpm lab:doctor -- labs/chapter-03/lab-03-13-ndarray-offset
pnpm lab:run -- labs/chapter-03/lab-03-13-ndarray-offset
pnpm lab:score -- labs/chapter-03/lab-03-13-ndarray-offset
```

- [ ] 样例通过；
- [ ] 能手工推导二维与三维的偏移公式；
- [ ] 一维（空乘积取 1）与多维两种边界都有证据。

## 思考题

1. 行优先与列优先的偏移公式差在哪？把行、列角色互换后公式怎么变？
2. 为什么数组被称为"随机存取结构"？偏移公式如何保证 O(1) 访问？
3. 如果各维下标从 1 开始（而不是 0），公式需要怎样调整？

## 题解

<details>
<summary>点击查看题解</summary>

### 思路

对第 k 维，其下标 `j_k` 每增 1，一维偏移就增加"后面所有维长度的乘积"（即 `j_{k}` 之后各维的 stride）。因此逐维累加 `j_k × stride`，`stride` 为 `b[k+1..n-1]` 的连乘，最后一维 stride 为 1。

### 复杂度分析

逐维计算 stride 用两重循环 O(n²)；也可从后往前一趟预处理 stride 做到 O(n)。

### 边界注意

- `n=1` 时 stride 是空乘积，取 1；
- 下标从 0 开始，与 3.3 正文一致。

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
    std::vector<long long> b(n), idx(n);
    for (auto& x : b) std::cin >> x;
    for (auto& x : idx) std::cin >> x;

    long long offset = 0;
    for (int k = 0; k < n; ++k) {
        long long stride = 1;
        for (int s = k + 1; s < n; ++s) stride *= b[s];
        offset += idx[k] * stride;
    }
    std::cout << offset << '\n';
    return 0;
}
```

</details>
