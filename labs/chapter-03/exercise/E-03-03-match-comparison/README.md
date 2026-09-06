---
title: "Lab 03-E-03：朴素匹配与 KMP 比较次数"
description: "统计朴素匹配与 KMP 匹配阶段的字符比较次数，用数据对比 O(n·m) 与 O(n+m)。"
order: 7
chapter: 3
labId: "03E03"
chapterTitle: "字符串与数组"
updated: "2026-08-20"
contributors: ["Qing"]
status: "draft"
lab: true
difficulty: "进阶"
duration: "60～90 分钟"
---

# Lab 03-E-03：朴素匹配与 KMP 比较次数

> 题目来源：王道《数据结构》习题集 4.2、408 统考风格（如 2019 年 KMP 比较次数题）。

输入主串 `S` 与模式串 `T`，分别用朴素匹配和 KMP 匹配，统计并输出各自的**字符比较次数**。

## 题目

### 比较次数统计

比较次数是理解两种匹配算法复杂度的关键：朴素匹配最坏 O(n·m)，KMP 只有 O(n+m)。本题要求精确统计，不能只输出算法是否匹配成功。

### 任务要求

1. 从标准输入读入主串 `S` 与模式串 `T`（各占一行）；
2. 第一行输出朴素匹配的比较次数，第二行输出 KMP 匹配阶段的比较次数；
3. 统计口径（必须严格遵守）：
   - **朴素匹配**：每次比较 `S[i]` 与 `T[j]`（相等或不等）计 1 次；失配后 `i = i - j + 1`、`j = 0`；
   - **KMP**：匹配循环中每次比较 `S[i]` 与 `T[j]` 计 1 次；`j == -1` 时直接 `i++`、`j++`（不比较字符，不计次）；失配 `j = next[j]` 本身不计次；
   - KMP 构造 next 阶段的比较**不计入**第二行；
4. 约定 0-based、`next[0] = -1`。

## 输入格式

- 第一行：主串 `S`；
- 第二行：模式串 `T`。

字符为可打印 ASCII（含空格），不含换行符；1 ≤ |T| ≤ |S| ≤ 5000。

## 输出格式

- 第一行：朴素匹配比较次数；
- 第二行：KMP 匹配阶段比较次数。

## 数据范围与限制

| 项目 | 范围 |
| --- | --- |
| `\|S\|` | 1 ≤ \|S\| ≤ 5000 |
| `\|T\|` | 1 ≤ \|T\| ≤ \|S\| |
| 朴素匹配时间 | O(\|S\|·\|T\|)（规模受控，允许模拟） |
| KMP 时间 | O(\|S\| + \|T\|) |

## 样例

### 样例输入 1

```input
abababc
ababc
```

### 样例输出 1

```output
11
8
```

### 样例输入 2

```input
abc
x
```

### 样例输出 2

```output
3
3
```

### 样例输入 3

```input
aaaaaaab
aaaab
```

### 样例输出 3

```output
20
11
```

### 样例解释

样例 1 中 `S=abababc`、`T=ababc`：朴素匹配三趟分别比较 5、1、5 次，共 11 次；KMP 匹配阶段比较 4 + 1 + 3 = 8 次（第一次失配后 `j` 从 4 回退到 2 再比较 3 次成功），与 3.2 正文走查一致。样例 2 每次首字符即失配，两者都只比较 3 次。样例 3 是典型的“大量部分匹配”输入，朴素需要回溯 20 次比较，KMP 仅 11 次。

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
pnpm lab:doctor -- labs/chapter-03/exercise/E-03-03-match-comparison
pnpm lab:run -- labs/chapter-03/exercise/E-03-03-match-comparison
pnpm lab:score -- labs/chapter-03/exercise/E-03-03-match-comparison
```

- [ ] 三个样例全部通过，且能手工复述每一趟的比较次数；
- [ ] 能构造一组让朴素匹配达到最坏 O(n·m) 的输入；
- [ ] 能说明 KMP 的 next 构建比较为什么不计入第二行；
- [ ] 首字符频繁失配的输入下，朴素与 KMP 次数接近的结论有数据支撑。

## 思考题

1. 为什么“主串首字符几乎不出现”时朴素匹配反而更省常数开销？
2. `j == -1` 的分支不计次，会不会让 KMP 的次数被低估？请用一个例子说明。
3. 若把 nextval 用于匹配，比较次数一定不大于用 next 吗？

## 题解

<details>
<summary>点击查看题解</summary>

### 思路

朴素匹配照搬双指针回溯，每进入一次字符比较就计数。KMP 先构造 next，再让 `i` 不回退地扫描，`j == -1` 时只前进不计次，其余每次比较 `S[i]` 与 `T[j]` 都计数。

### 复杂度分析

- 朴素：最坏比较 (n − m + 1)·m 次；
- KMP：匹配阶段比较次数不超过 2n 次（`i` 前进 n 次，回退总量不超过前进总量），构造 next 另计但不输出。

### 边界注意

- 首字符频繁失配时两者次数接近（样例 2）；
- 大量部分匹配时朴素次数接近 (n − m + 1)·m（样例 3）；
- 匹配成功后循环立即结束，不继续扫描剩余字符。

</details>
<details>
<summary>点击查看参考代码</summary>

```cpp
#include <iostream>
#include <string>
#include <vector>

std::vector<int> build_next(const std::string& p) {
    int m = static_cast<int>(p.size());
    std::vector<int> next(m, 0);
    int k = -1, j = 0;
    next[0] = -1;
    while (j < m - 1) {
        if (k == -1 || p[j] == p[k]) {
            ++j;
            ++k;
            next[j] = k;
        } else {
            k = next[k];
        }
    }
    return next;
}

long long bf_count(const std::string& s, const std::string& p) {
    int n = static_cast<int>(s.size());
    int m = static_cast<int>(p.size());
    int i = 0, j = 0;
    long long count = 0;
    while (i < n && j < m) {
        ++count;
        if (s[i] == p[j]) {
            ++i;
            ++j;
        } else {
            i = i - j + 1;
            j = 0;
        }
    }
    return count;
}

long long kmp_count(const std::string& s, const std::string& p) {
    std::vector<int> next = build_next(p);
    int n = static_cast<int>(s.size());
    int m = static_cast<int>(p.size());
    int i = 0, j = 0;
    long long count = 0;
    while (i < n && j < m) {
        if (j == -1) {
            ++i;
            ++j;
            continue;
        }
        ++count;
        if (s[i] == p[j]) {
            ++i;
            ++j;
        } else {
            j = next[j];
        }
    }
    return count;
}

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);
    std::string s, p;
    std::getline(std::cin, s);
    std::getline(std::cin, p);
    std::cout << bf_count(s, p) << '\n';
    std::cout << kmp_count(s, p) << '\n';
    return 0;
}
```

</details>
