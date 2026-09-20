---
title: "Lab 03-E-12：最小循环节与周期"
description: "用一个串的最长公共前后缀长度求出它的最短循环节与重复次数，并区分“循环节”与“周期函数”两个不同概念。"
order: 16
chapter: 3
labId: "03E12"
chapterTitle: "字符串与数组"
updated: "2026-09-14"
contributors: ["Gaoqp123"]
status: "draft"
lab: true
difficulty: "进阶"
duration: "45～60 分钟"
---

# Lab 03-E-12：最小循环节与周期

> 题目来源：改编自严蔚敏《数据结构（C 语言版）》3.2 串的模式匹配、KMP 算法的 next 数组性质；王道《数据结构》串的模式匹配。

若一个串可以写成某个更短子串的整数次重复，就称那个子串是它的一个**循环节**。求最短循环节最朴素的做法是枚举长度 `p` 再逐段比较，代价是 `O(|S|²)`；而 KMP 的 `next` 数组恰好保存了每个前缀的**最长公共前后缀**（border），于是 `|S| − next[|S|]` 就是候选的最短循环节长度，只需再做一次整除判断即可在 `O(|S|)` 内判定。本题就考察这个经典推论。

## 题目

### 循环节与周期

设串为 `S`，长度为 `n`。

- 若存在串 `T`（`1 ≤ |T| < n`）与整数 `k ≥ 2`，使得 `S = T^k`（`T` 连续拼接 `k` 次），则称 `T` 是 `S` 的一个**循环节**，`|T|` 是**循环节长度**；
- 本题要求的是**最短循环节**及其**重复次数** `k`；
- 若不存在任何循环节，则认为“整串自己”就是循环节，输出 `|S| 1`。因此本题的结果恒有 `k ≥ 1`，**没有 `−1` 分支**。

有两种极易混淆的概念，本 Lab 将其冻结如下：

> **术语冻结**：本题问的是**循环节**（必须整除），不是周期函数；例如 `abcab` 的最小周期是 `3`，但它不能写成某个真子串的整数次重复，因此本题输出 `5 1`。

所谓**周期**，指使 `S[i] = S[i+p]` 对一切 `0 ≤ i < n − p` 都成立的最小正整数 `p`；它只要求“错开 `p` 位后能对齐”，**不要求 `p` 整除 `n`**。`abcab` 满足 `S[0..1] = "ab" = S[3..4]`，所以它的最小周期是 `3`；但 `5 % 3 ≠ 0`，它写不成 `"abc"` 的若干次重复，因此**不是**循环节，本题输出 `5 1`。做题时必须先判断整除性，再决定是否输出循环节。

### 任务要求

1. 从标准输入读入一行串 `S`（不含空白字符）；
2. 输出最短循环节长度 `p` 与重复次数 `k`，满足 `S = T^k`、`|T| = p`；
3. 算法必须使用 0-based、`next[0] = −1` 的 `next` 数组：先取 `p = n − next[n]`，**仅当 `n % p == 0`** 时才认 `k = n / p`，否则输出 `n 1`；
4. 两个整数用单个空格分隔，行末无多余空格。

## 输入格式

- 一行：串 `S`（非空白可打印 ASCII，不含空格、制表符等空白字符），保证 `1 ≤ |S| ≤ 3×10⁵`。

## 输出格式

- 一行两个整数 `p k`：`p` 为最短循环节长度，`k` 为重复次数；不存在真循环节时输出 `|S| 1`。

## 数据范围与限制

| 项目 | 范围 |
| --- | --- |
| `\|S\|` | 1 ≤ \|S\| ≤ 3×10⁵ |
| 字符集 | 非空白可打印 ASCII，串中不含空白字符 |
| 时间复杂度 | O(\|S\|)；朴素枚举循环节 O(\|S\|²) 会在压力点超时 |
| 空间复杂度 | O(\|S\|)（`next` 数组） |
| 输出 | 恒有 k ≥ 1，无 `−1` 分支 |

## 样例

### 样例输入 1

```input
abcabcabc
```

### 样例输出 1

```output
3 3
```

### 样例输入 2

```input
abcab
```

### 样例输出 2

```output
5 1
```

### 样例解释

样例 1：`abcabcabc` 是 `abc` 重复 3 次，`|S| = 9`，其最长公共前后缀是 `abcabc`（长度 `6`），于是候选循环节长度 `p = 9 − 6 = 3`，且 `9 % 3 == 0`，所以重复次数 `k = 9 / 3 = 3`，输出 `3 3`。

样例 2：`abcab` 的最长公共前后缀是 `ab`（长度 `2`），候选 `p = 5 − 2 = 3`，但 `5 % 3 ≠ 0`，说明这个“错开 3 位能对齐”的**最小周期**并不能把整串整除成重复块，因此它不是循环节，只能输出 `5 1`。这正是本题与本 Lab 之外常见“求周期”题目的区别所在：**周期看对齐，循环节看整除**。

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
pnpm lab doctor labs/chapter-03/exercise/E-03-12-smallest-period
pnpm lab run labs/chapter-03/exercise/E-03-12-smallest-period
pnpm lab score labs/chapter-03/exercise/E-03-12-smallest-period
```

- [ ] 样例通过；
- [ ] `abcab`、`ababa`、`abcabcab` 一类“有最小周期但不是循环节”的反例都有证据；
- [ ] `|S| = 1`、`|S| = 2`、全同字符、整串恰为基串整数倍四种边界都有证据。

## 思考题

1. 若把题目改成“输出最小周期”（不要求整除），`p = n − next[n]` 这个式子还够用吗？在 `abcab` 上得到的 `3` 为什么恰好就是最小周期？
2. 为什么当 `n % (n − next[n]) == 0` 时，`S[0 .. n − next[n] − 1]` 一定是循环节？请用 border 的定义说明“错开 `p` 位后能对齐”如何传递到每一段。
3. 求最小循环节还有“枚举 `n` 的约数并哈希比较”的做法，复杂度 `O(σ(n) · |S|)` 或带哈希的 `O(σ(n))`。与 KMP 的做法相比，它在什么规模下更有优势？

## 题解

<details>
<summary>点击查看题解</summary>

### 思路

设 `next[i]` 表示前缀 `S[0 .. i−1]` 的**最长公共前后缀长度**（0-based 记法下 `next[0] = −1`）。那么 `next[n]` 就是整串的最长公共前后缀长度，记作 `b`。可以证明：`p = n − b` 是 `S` 的**最小周期**。

- 若 `n % p == 0`，则 `S` 由 `n / p` 段长度为 `p` 的相同块拼成，`p` 就是最短循环节长度，输出 `p n/p`；
- 若 `n % p ≠ 0`，说明这个周期跨不过整串的整数倍，`S` 不是任何真子串的整数次重复，输出 `n 1`。

注意 `next[n]` 是**最长** border，因此 `n − next[n]` 是**最小**周期；无需再枚举其它 border。

### 复杂度分析

KMP 的 `next` 数组递推中，`i` 单调递增、`j` 每次回退都严格减小，均摊后是 `O(|S|)` 时间；`next` 数组占用 `O(|S|)` 空间，`|S| = 3×10⁵` 时只有几 MB，安全。枚举长度 `p` 并逐段比较的朴素做法最坏是 `O(|S|²)`（压力点上约 `9×10¹⁰` 次比较），必然超时。

### 边界注意

- `|S| = 1`：`next[1] = 0`，`p = 1`，`1 % 1 == 0`，输出 `1 1`；
- 全同字符（如 `a`×3×10⁵）：`next[n] = n − 1`，`p = 1`，输出 `1 n`；
- “有最小周期但不能整除”必须走 `n 1` 分支：`abcab`（周期 3）、`ababa`（周期 2）、`abcabcab`（周期 3，但 `8 % 3 ≠ 0`）；
- 输入用 `getline` 整行读取，避免 `cin >>` 在空行等情况下与题面“一行串”的语义不一致；若运行环境是 Windows 且文件带 `\r`，需自行剥掉行尾的 `\r`；
- 候选 `p = n − next[n]` 恒为正（`next[n] < n`），不需要额外判 `p > 0`，但保留判断更稳妥。

### 参考代码

```cpp
#include <iostream>
#include <string>
#include <vector>

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    std::string text;
    std::getline(std::cin, text);
    if (!text.empty() && text.back() == '\r') text.pop_back();

    const long long length = static_cast<long long>(text.size());

    // 0-based next 数组：next[i] 为前缀 text[0 .. i-1] 的最长公共前后缀长度。
    std::vector<long long> next(length + 1, 0);
    next[0] = -1;
    long long i = 0;
    long long j = -1;
    while (i < length) {
        if (j == -1 || text[i] == text[j]) {
            ++i;
            ++j;
            next[i] = j;
        } else {
            j = next[j];
        }
    }

    const long long period = length - next[length];
    if (length % period == 0) {
        std::cout << period << ' ' << length / period << '\n';
    } else {
        std::cout << length << ' ' << 1 << '\n';
    }
    return 0;
}
```

</details>
