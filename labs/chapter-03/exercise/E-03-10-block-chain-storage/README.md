---
title: "Lab 03-E-10：串的块链存储与结点定位"
description: "按块链存储的分块方式定位第 i 个字符所在结点与块内偏移，并统计结点总数与填充槽位。"
order: 14
chapter: 3
labId: "03E10"
chapterTitle: "字符串与数组"
updated: "2026-09-14"
contributors: ["Gaoqp123"]
status: "draft"
lab: true
difficulty: "基础"
duration: "30～45 分钟"
---

# Lab 03-E-10：串的块链存储与结点定位

> 题目来源：改编自严蔚敏《数据结构（C 语言版）》3.1 串的块链存储、王道《数据结构》串的存储结构。

定长顺序存储要预留最大长度，堆分配存储需要一整段连续空间；块链存储把串切成等长的小块，再用指针把块串起来，插入删除时不必整体搬移字符，代价是每个结点都要额外保存指针。本题按“每 `k` 个字符一个块”的分块方式，计算下标 `i` 落在哪个结点、块内偏移是多少，并统计结点总数与填充槽位。

## 题目

### 串的块链存储

块链存储中，每个结点容纳固定 `k` 个字符，结点之间用指针相连。长度 `n` 的串占用 `⌈n/k⌉` 个结点，最后一个结点中没有放字符的空槽称为**填充槽位**（补空字符）。

$$
\text{结点数}=\left\lceil \frac{n}{k} \right\rceil,\qquad \text{填充槽位}=\text{结点数}\times k-n .
$$

### 任务要求

1. 从标准输入读入结点容量 `k`、串 `S` 与下标 `i`；
2. 输出 `i` 所在结点的序号（从 `1` 开始）、`i` 在块内的偏移（从 `0` 开始）、结点总数、填充槽位数；
3. **本题只要求按块定位，不要求建立真实的链式结点或 `next` 指针**；
4. 四个整数用单个空格分隔，行末无多余空格。

## 输入格式

- 第一行：结点容量 `k`；
- 第二行：串 `S`（非空白可打印 ASCII，不含空格与制表符）；
- 第三行：下标 `i`（0-based，保证 `0 ≤ i < |S|`）。

## 输出格式

- 一行四个整数：结点序号、块内偏移、结点总数、填充槽位数。

## 数据范围与限制

| 项目 | 范围 |
| --- | --- |
| `k` | 1 ≤ k ≤ 100 |
| `\|S\|` | 1 ≤ \|S\| ≤ 2×10⁵ |
| `i` | 0 ≤ i < \|S\|，保证合法 |
| 时间复杂度 | O(1)；也接受 O(⌈\|S\|/k⌉) 的分块模拟 |
| 空间复杂度 | O(1) 或 O(\|S\|) |

## 样例

### 样例输入 1

```input
4
ABCDEFGHIJ
6
```

### 样例输出 1

```output
2 2 3 2
```

### 样例输入 2

```input
1
abc
2
```

### 样例输出 2

```output
3 0 3 0
```

### 样例解释

样例 1：串长 10、`k=4`，分成 `ABCD`、`EFGH`、`IJ` 三块；下标 `6` 是第二块的第 3 个字符，块内偏移为 `2`，所以结点序号是 `2`；总容量 `3×4=12`，填充 `12−10=2`。样例 2：`k=1` 时每个结点只放一个字符，结点数等于串长，没有填充。

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
pnpm lab doctor labs/chapter-03/exercise/E-03-10-block-chain-storage
pnpm lab run labs/chapter-03/exercise/E-03-10-block-chain-storage
pnpm lab score labs/chapter-03/exercise/E-03-10-block-chain-storage
```

- [ ] 样例通过；
- [ ] `i` 落在块首、块尾、最后一块三种情况都有证据；
- [ ] `k=1`、`k>|S|`、`|S|` 恰为 `k` 整数倍三种边界都有证据。

## 思考题

1. 若每个结点除 `k` 个字符外还要保存一个 8 字节的 `next` 指针，存储密度如何随 `k` 变化？`k` 越大越好吗？
2. 块链存储中访问第 `i` 个字符的代价是 `O(⌈i/k⌉)`，那么求子串 `SubString` 的复杂度是多少？与堆分配存储相比谁更优？
3. 在块链存储上做插入时，什么情况下必须新建结点？什么情况下可以复用填充槽位？

## 题解

<details>
<summary>点击查看题解</summary>

### 思路

第 `i` 个字符（0-based）位于第 `i / k` 个块中，因此结点序号是 `i / k + 1`，块内偏移是 `i % k`。结点总数是 `⌈|S|/k⌉`，用整数上取整写成 `(|S| + k − 1) / k`。填充槽位是总容量减去实际字符数。

### 复杂度分析

闭式公式是 `O(1)` 时间、`O(1)` 额外空间；若改成真的把串切成块再顺序查找，则是 `O(⌈|S|/k⌉)` 时间与 `O(|S|)` 空间，本题两种写法都能通过，但闭式写法更贴近“结点编号由下标直接算出”的考点。

### 边界注意

- `k > |S|` 时只有一个结点，填充槽位可能远多于字符数；
- `|S|` 恰为 `k` 的整数倍时填充为 `0`；
- `|S|` 最大 2×10⁵，`结点数 × k` 仍在 32 位整数范围内，但用 `long long` 更稳妥；
- 本题不涉及错误输入：`i` 始终合法。

### 参考代码

```cpp
#include <iostream>
#include <string>

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    long long blockSize = 0;
    long long index = 0;
    std::string text;
    std::cin >> blockSize >> text >> index;

    const long long length = static_cast<long long>(text.size());
    const long long nodeCount = (length + blockSize - 1) / blockSize;
    const long long padding = nodeCount * blockSize - length;

    std::cout << index / blockSize + 1 << ' '
              << index % blockSize << ' '
              << nodeCount << ' '
              << padding << '\n';
    return 0;
}
```

</details>
