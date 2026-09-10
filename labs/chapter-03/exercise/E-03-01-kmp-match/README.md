---
title: "Lab 03-E-01：KMP 模式匹配（首次出现位置）"
description: "用 KMP 求模式串在主串中首次出现的位置，练习 next 数组构造与匹配指针不回退。"
order: 5
chapter: 3
labId: "03E01"
chapterTitle: "字符串与数组"
updated: "2026-08-20"
contributors: ["Qing"]
status: "draft"
lab: true
difficulty: "进阶"
duration: "45～60 分钟"
---

# Lab 03-E-01：KMP 模式匹配（首次出现位置）

> 题目来源：改编自 LeetCode 28「找出字符串中第一个匹配项的下标」、洛谷 P3375【模板】KMP 字符串匹配、PTA 7-2 串的模式匹配。

给定主串 `S` 和模式串 `T`，用 KMP 算法求出 `T` 在 `S` 中**首次出现**的位置（0-based 下标）。

## 题目

### KMP 模式匹配

3.2 中朴素匹配在部分匹配后要回溯主串指针，KMP 用 next 数组让主串指针只增不减。本题要求把 KMP 完整实现出来。

### 任务要求

1. 从标准输入读入主串 `S` 与模式串 `T`（各占一行）；
2. 用 KMP 求 `T` 在 `S` 中首次出现的位置，0-based 下标；
3. `T` 不在 `S` 中时输出 `-1`；
4. 空模式串 `T` 约定出现在位置 `0`（与 3.2 正文约定一致）；
5. 匹配采用 0-based、`next[0] = -1` 的约定。

## 输入格式

- 第一行：主串 `S`；
- 第二行：模式串 `T`。

字符为可打印 ASCII（含空格），不含换行符。

## 输出格式

- 一行一个整数：`T` 在 `S` 中首次出现的 0-based 下标；未找到输出 `-1`。

## 数据范围与限制

| 项目 | 范围 |
| --- | --- |
| `\|S\|` | 0 ≤ \|S\| ≤ 10⁵ |
| `\|T\|` | 0 ≤ \|T\| ≤ 10⁵ |
| 时间复杂度 | O(\|S\| + \|T\|) |
| 空间复杂度 | O(\|T\|) |

## 样例

### 样例输入 1

```input
ABABABC
ABABC
```

### 样例输出 1

```output
2
```

### 样例输入 2

```input
BBC ABCDAB ABCDABCDABDE
ABCDABD
```

### 样例输出 2

```output
15
```

### 样例输入 3

```input
hello
llx
```

### 样例输出 3

```output
-1
```

### 样例输入 4

```input
abc

```

### 样例输出 4

```output
0
```

### 样例解释

样例 1 中 `ABABC` 从 `ABABABC` 的下标 2 开始整体匹配；样例 2 是 KMP 经典走查例（返回 15）；样例 3 未找到，返回 -1；样例 4 中 `T` 为空串，按约定返回位置 0。

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
pnpm lab:doctor -- labs/chapter-03/exercise/E-03-01-kmp-match
pnpm lab:run -- labs/chapter-03/exercise/E-03-01-kmp-match
pnpm lab:score -- labs/chapter-03/exercise/E-03-01-kmp-match
```

- [ ] 四个样例全部通过；
- [ ] 能手工推导 `ABABABC` / `ABABC` 的 next 数组并模拟匹配过程；
- [ ] 代码中主串指针 `i` 不回退，且能解释为什么不会漏掉匹配；
- [ ] 空模式、模式在串首、模式在串尾、未找到四种边界都有证据。

## 思考题

1. 为什么失配时 `j = next[j]` 不会漏掉可能成功的匹配？
2. 空模式按位置 0 处理，与 3.2 正文的哪个边界约定一致？
3. 如果主串只能顺序读一遍（网络流输入），KMP 相比朴素匹配有什么本质优势？

## 题解

<details>
<summary>点击查看题解</summary>

### 思路

先对模式串构造 next 数组（`next[0] = -1`），再让主串指针 `i` 只增不减地扫描：匹配成功时 `i`、`j` 同时前进；失配时 `j` 回退到 `next[j]`，`i` 不动；`j == -1` 时主串前进一格、模式从头开始。

### 复杂度分析

- 构造 next：O(\|T\|)；
- 匹配：O(\|S\|)；
- 总时间 O(\|S\| + \|T\|)，空间 O(\|T\|)。

### 边界注意

- `T` 为空串：按约定返回 0；
- `|T| > |S|`：循环自然结束，返回 -1；
- 模式串大量重复字符时 nextval 能减少必然失败的比较，但本题只要求 next。

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

int kmp_match(const std::string& s, const std::string& p) {
    int n = static_cast<int>(s.size());
    int m = static_cast<int>(p.size());
    if (m == 0) return 0;
    std::vector<int> next = build_next(p);
    int i = 0, j = 0;
    while (i < n && j < m) {
        if (j == -1 || s[i] == p[j]) {
            ++i;
            ++j;
        } else {
            j = next[j];
        }
    }
    return j == m ? i - m : -1;
}

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);
    std::string s, p;
    std::getline(std::cin, s);
    std::getline(std::cin, p);
    std::cout << kmp_match(s, p) << '\n';
    return 0;
}
```

</details>
