---
title: "Lab 03-E-11：KMP 全部匹配位置（允许重叠）"
description: "在 KMP 匹配成功之后继续滑动模式串，统计主串中所有允许重叠的出现位置。"
order: 15
chapter: 3
labId: "03E11"
chapterTitle: "字符串与数组"
updated: "2026-09-14"
contributors: ["Gaoqp123"]
status: "draft"
lab: true
difficulty: "进阶"
duration: "45～60 分钟"
---

# Lab 03-E-11：KMP 全部匹配位置（允许重叠）

> 题目来源：改编自 LeetCode 28「找出字符串中第一个匹配项的下标」的全匹配变体、洛谷 P3375【模板】KMP 字符串匹配、PTA 串的模式匹配。

03-E-01 只要求 KMP 给出**首次**出现位置，本题把它推进到**全部**出现位置，并且允许匹配之间相互重叠。关键改动只有一处，但很容易写错：匹配成功之后不能把模式串指针清零重新开始，而要按 `next` 数组回退，让模式串只向右滑动一格，否则 `ABABABA` 里 `ABA` 的 `0 2 4` 三处重叠匹配会漏掉中间那一处。

## 题目

### 允许重叠的全部匹配

给定主串 `S` 和模式串 `T`，统计 `T` 在 `S` 中所有出现位置的 0-based 起始下标。出现位置之间**允许重叠**：例如 `S = aaaaa`、`T = aa` 时，起始下标 `0 1 2 3` 都算，共 4 处。

KMP 在 `j == |T|` 时的处理是本题的核心：

```text
记录起点 i - |T| + 1
j = next[j - 1]      // 只回退一位的等价写法，而不是 j = 0
```

这样模式串相当于只向右滑动一格，被跳过的重叠匹配就能被继续统计。

### 与 03-E-01 的差异（必须注意）

| 项目 | 03-E-01 | 本题 |
| --- | --- | --- |
| 输出 | 首次出现位置，找不到输出 `-1` | 出现次数 + 全部出现位置，找不到输出 `0` 与空行 |
| 空模式 `T` | 约定出现在位置 `0` | **排除空模式**，保证 `1 ≤ \|T\|` |
| 重叠匹配 | 无关（只有首次出现） | **允许重叠**，必须统计 |
| 规模 | `\|S\|, \|T\| ≤ 10⁵` | `\|S\| ≤ 3×10⁵`，`\|T\| ≤ 3×10⁵` |

### 任务要求

1. 从标准输入读入两行：第一行主串 `S`，第二行模式串 `T`；
2. 用 KMP 统计 `T` 在 `S` 中所有允许重叠的出现位置；
3. 第一行输出出现次数 `c`；
4. 第二行输出 `c` 个升序排列的 0-based 起始下标，用单个空格分隔；`c = 0` 时第二行输出**空行**；
5. 复杂度要求 `O(|S| + |T|)`，朴素 `O(|S| × |T|)` 会在压力点超时。

## 输入格式

- 第一行：主串 `S`；
- 第二行：模式串 `T`；
- 两行都可能含空格，也可能有一行是空串，因此必须整行读入（`std::getline`），不能用 `std::cin >>`；
- 保证 `1 ≤ |T| ≤ 3×10⁵`、`0 ≤ |S| ≤ 3×10⁵`，字符为可打印 ASCII（含空格），不含换行符。

## 输出格式

- 第一行：一个整数 `c`，即 `T` 在 `S` 中出现的次数（允许重叠）；
- 第二行：`c` 个升序的 0-based 起始下标，空格分隔；`c = 0` 时该行为空行；
- 行末无多余空格。判分按 token 比较，空行与省略行等价，但仍请按上面两行输出。

## 数据范围与限制

| 项目 | 范围 |
| --- | --- |
| `\|S\|` | 0 ≤ \|S\| ≤ 3×10⁵ |
| `\|T\|` | 1 ≤ \|T\| ≤ 3×10⁵（保证非空） |
| 字符集 | 可打印 ASCII，可含空格 |
| 时间复杂度 | O(\|S\| + \|T\|) |
| 空间复杂度 | O(\|T\|)（next 数组）+ O(c)（输出位置） |
| 判题限制 | 2000 ms / 输出 1024 KB |

压力点的规模是刻意放大的：在 `|S|, |T| ≤ 10⁵` 时，朴素算法最坏约 `2.5×10⁹` 次比较，本机实测只要约 0.6 s，压不住 `O(|S|×|T|)`；把上界提到 `3×10⁵`（`019` 取 `|S| = 3×10⁵`、`|T| ≈ 1.5×10⁵`，`020` 取 `|S| = 3×10⁵`、`|T| = 2.5×10⁵`）后，朴素的比较次数升到 `10¹⁰` 量级、实测约 30 s，必然超时，而 KMP 仍在几十毫秒内完成。上界只放到 3×10⁵ 而不是更大，是为了同时控制测试数据的体积（两个压力点输入合计约 1 MB）。

## 样例

### 样例输入 1

```input
ABABABA
ABA
```

### 样例输出 1

```output
3
0 2 4
```

### 样例输入 2

```input
ABCDE
XY
```

### 样例输出 2

```output
0

```

### 样例解释

样例 1：`ABA` 出现在下标 `0`、`2`、`4` 三处，其中 `0` 与 `2`、`2` 与 `4` 都是重叠的——第一处占用 `0..2`，第二处占用 `2..4`。第一次匹配成功后若把 `j` 清零，位置 `2` 就会被跳过，因此必须写 `j = next[j - 1]`。

样例 2：`XY` 不在 `ABCDE` 中，出现次数为 `0`，第二行为空行。

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
pnpm lab:doctor -- labs/chapter-03/exercise/E-03-11-kmp-all-occurrences
pnpm lab:run -- labs/chapter-03/exercise/E-03-11-kmp-all-occurrences
pnpm lab:score -- labs/chapter-03/exercise/E-03-11-kmp-all-occurrences
```

- [ ] 样例通过，且 `ABABABA` 中重叠的 `0 2 4` 都被统计到；
- [ ] `c = 0` 时第二行确实为空行；
- [ ] 空主串、`|T| > |S|`、`|S| = |T| = 1` 三种边界都有证据；
- [ ] 两个压力点（`|S| = 3×10⁵`）在 2000 ms 内跑完，即实现确实是 `O(|S| + |T|)`。

## 思考题

1. 为什么匹配成功后要写 `j = next[j - 1]` 而不是 `j = 0`？如果把 `next` 换成 `nextval`，还能统计出全部重叠位置吗？为什么？
2. 本题统计的是**允许重叠**的出现位置。若要求“出现位置互不重叠”，匹配成功后应如何调整 `j`？两种口径下KMP 的复杂度还是一样的吗？
3. 输出 `c` 个位置本身就需要 `O(c)` 时间与空间；当 `c = O(|S|)` 时，这个下界能否避免？如果题目只要求输出次数而不要求输出位置，算法还需要额外空间吗？

## 题解

<details>
<summary>点击查看题解</summary>

### 思路

先用标准的前缀函数（`next[j]` 表示 `T[0..j]` 的最长相等真前后缀长度，0-based、`next[0] = 0`）预处理模式串，然后线性扫描主串：

1. 维护 `j` 表示当前已经匹配上的模式串前缀长度；
2. 失配时 `j` 沿 `next` 回退，主串指针 `i` 永不后退；
3. `j == |T|` 时记录起点 `i - |T| + 1`，然后令 `j = next[j - 1]` 继续扫描——这一步让模式串只滑动一格，从而统计到重叠匹配。

### 复杂度分析

预处理 `O(|T|)`，扫描 `O(|S|)`，总时间 `O(|S| + |T|)`；额外空间是 `O(|T|)` 的 `next` 数组和 `O(c)` 的输出缓冲（`c` 为出现次数）。朴素算法每次失配都可能从头比较，最坏 `O(|S| × |T|)`，本题压力点会明显超时。

### 边界注意

- `c = 0` 时第二行必须是空行，不能省略整行以外的结构；
- `|T| > |S|` 时不可能匹配，直接输出 `0` 与空行；
- `|S| = 0`（空行输入）时同理输出 `0` 与空行，因此必须用 `getline` 而不是 `cin >>`；
- 两行都允许含空格（如 `"a b a b a"` 与 `"a b"`），用 `cin >>` 会截断成 `"a"` 而出错；
- 本题保证 `|T| ≥ 1`，与 03-E-01 的空模式约定不同，不需要处理空模式。

### 参考代码

```cpp
#include <iostream>
#include <string>
#include <vector>

std::vector<int> buildNext(const std::string &pattern) {
    const int m = static_cast<int>(pattern.size());
    std::vector<int> next(m, 0);
    for (int j = 1; j < m; ++j) {
        int k = next[j - 1];
        while (k > 0 && pattern[j] != pattern[k]) k = next[k - 1];
        if (pattern[j] == pattern[k]) ++k;
        next[j] = k;
    }
    return next;
}

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    std::string text, pattern;
    if (!std::getline(std::cin, text)) text.clear();
    if (!std::getline(std::cin, pattern)) pattern.clear();

    const int n = static_cast<int>(text.size());
    const int m = static_cast<int>(pattern.size());
    if (m == 0 || m > n) {
        std::cout << 0 << '\n' << '\n';
        return 0;
    }

    const std::vector<int> next = buildNext(pattern);
    std::vector<int> occurrences;
    occurrences.reserve(static_cast<std::size_t>(n) / static_cast<std::size_t>(m) + 1);

    int j = 0;
    for (int i = 0; i < n; ++i) {
        while (j > 0 && text[i] != pattern[j]) j = next[j - 1];
        if (text[i] == pattern[j]) ++j;
        if (j == m) {
            occurrences.push_back(i - m + 1);
            j = next[j - 1];  // 允许重叠：只回退一位
        }
    }

    std::cout << occurrences.size() << '\n';
    for (std::size_t index = 0; index < occurrences.size(); ++index) {
        if (index > 0) std::cout << ' ';
        std::cout << occurrences[index];
    }
    std::cout << '\n';
    return 0;
}
```

</details>
