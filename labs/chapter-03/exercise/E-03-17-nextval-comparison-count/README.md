---
title: "Lab 03-E-17：KMP 与 nextval 的比较次数"
description: "按统一伪代码统计朴素匹配、KMP 与 KMP+nextval 的字符比较次数，量化 nextval 到底省下了哪几次比较。"
order: 21
chapter: 3
labId: "03E17"
chapterTitle: "字符串与数组"
updated: "2026-09-14"
contributors: ["Gaoqp123"]
status: "draft"
lab: true
difficulty: "进阶"
duration: "50～70 分钟"
---

# Lab 03-E-17：KMP 与 nextval 的比较次数

> 题目来源：改编自严蔚敏《数据结构（C 语言版）》3.2 的 nextval 推导与 KMP 复杂度论证、王道《数据结构》串的模式匹配习题。

03-E-02 让你算出 next 与 nextval 数组，03-E-03 让你比较朴素匹配与 KMP 的次数；但"nextval 究竟省了多少比较"始终只是个定性结论。本题把它变成可测量的量：**在同一套伪代码与同一套计数口径下**，把朴素 BF、KMP、KMP+nextval 三种算法的字符比较次数全部数出来。

因为次数和"怎么实现"强相关，本题把三份伪代码原样写进题面：**只有严格按题面伪代码计数，答案才是唯一的**。

## 题目

### 计数口径（冻结）

1. 每执行一次 `S[i] == T[j]` 的字符比较计 **1 次**，比较成功与比较失败都计；
2. **构造 `next` / `nextval` 数组过程中的字符比较不计入**；
3. KMP 中 `j == -1` 时的推进（`i++`、`j = 0`）**不发生字符比较，不计次**；
4. 三种算法都在 **`j == |T|` 首次匹配成功的瞬间结束**，不再扫描主串剩余部分；若全程无匹配，则在 `i == |S|` 时结束；
5. `next` / `nextval` 采用 0-based、`next[0] = nextval[0] = -1` 的约定，与 03-E-02 完全一致。

### 三种算法的伪代码

**（A）构造 next 与 nextval（不计比较次数）**

```text
build_next(T):
    m = |T|; next = array(m, -1)
    k = -1; j = 0
    while j < m - 1:
        if k == -1 or T[j] == T[k]:
            j = j + 1; k = k + 1; next[j] = k
        else:
            k = next[k]
    return next

build_nextval(T):
    next = build_next(T); nextval = array(|T|, -1)
    for j = 1 .. |T|-1:
        k = next[j]
        nextval[j] = (k != -1 and T[j] == T[k]) ? nextval[k] : k
    return nextval
```

**（B）朴素 BF：双指针回溯，失配时主串指针回退**

```text
count_naive(S, T):
    i = 0; j = 0; count = 0
    while i < |S| and j < |T|:
        count = count + 1
        if S[i] == T[j]:
            i = i + 1; j = j + 1
        else:
            i = i - j + 1; j = 0
    return count
```

**（C）KMP：失配时 `j = table[j]`，`i` 永不后退**

```text
count_kmp(S, T, table):        # table 取 next 或 nextval
    i = 0; j = 0; count = 0
    while i < |S| and j < |T|:
        if j == -1:            # 只推进，不计次
            i = i + 1; j = 0; continue
        count = count + 1
        if S[i] == T[j]:
            i = i + 1; j = j + 1
        else:
            j = table[j]
    return count
```

KMP+nextval 就是把 `table` 换成 `nextval` 再跑一遍。

### 任务要求

1. 从标准输入读入两行：主串 `S` 与模式串 `T`；
2. 按上面的伪代码分别统计 `count_naive`、`count_kmp(next)`、`count_kmp(nextval)`；
3. 一行输出三个整数，用单个空格分隔，行末无多余空格。

## 输入格式

- 第一行：主串 `S`；
- 第二行：模式串 `T`；
- 两行都可能含空格，必须整行读入（`std::getline`），不能用 `std::cin >>`；
- 保证 `1 ≤ |T| ≤ |S| ≤ 5000`，字符为可打印 ASCII。

## 输出格式

- 一行三个整数：`朴素 BF 比较次数 KMP 比较次数 KMP+nextval 比较次数`。

## 数据范围与限制

| 项目 | 范围 |
| --- | --- |
| `\|S\|` | 1 ≤ \|S\| ≤ 5000 |
| `\|T\|` | 1 ≤ \|T\| ≤ \|S\|（保证非空） |
| 字符集 | 可打印 ASCII，可含空格 |
| 时间复杂度 | KMP 为 O(\|S\|+\|T\|)；朴素计数为 O(\|S\|×\|T\|)，本题要求真的模拟出来 |
| 空间复杂度 | O(\|T\|) |
| 判题限制 | 2000 ms / 输出 1024 KB |

**为什么上限只有 5000：** 本题要求同时输出**朴素匹配**的比较次数，而这个次数没有闭式公式，只能把朴素过程模拟一遍，代价是 `O(|S|×|T|)`。把上界压到 5000 后最坏约 `2.5×10⁷` 次比较，正确解法本身仍是秒级；上界再放大反而会让"正确解法"因为模拟朴素而超时，那样题目就变成考优化而不是考计数了。本题**不设超时压力点**，两个 `stress` 用例考察的是长串上三种计数的稳定性与差异。

## 样例

### 样例输入 1

```input
aaaaaaaaab
aaaab
```

### 样例输出 1

```output
30 15 15
```

### 样例输入 2

```input
aacaac
aaab
```

### 样例输出 2

```output
12 10 6
```

### 样例解释

**样例 1（`S = aaaaaaaaab`，`T = aaaab`，`next = [-1,0,1,2,3]`，`nextval = [-1,-1,-1,-1,3]`）**
- 朴素：起点 `0..4` 的每一趟都要比到 `T[4] = 'b'` 才失配（每趟 5 次，共 25 次），起点 `5` 处整趟匹配成功（5 次），合计 `30`；
- KMP：`i = 0..3` 四次成功；`i = 4` 起每次与 `T[4]` 比较失配后回退到 `j = 3`，再与 `T[3] = 'a'` 比较一次成功，`i = 4..8` 每步 2 次共 10 次；最后 `i = 9` 与 `T[4]` 比较成功 1 次，合计 `4 + 10 + 1 = 15`；
- KMP+nextval：本题**所有失配都发生在 `j = 4`**，而 `nextval[4] = next[4] = 3`，压缩点在 `j = 1..3` 上根本没被触发，所以次数不变，仍是 `15`。这正是"nextval 不是万能加速"的典型反例。

**样例 2（`S = aacaac`，`T = aaab`，`next = [-1,0,1,2]`，`nextval = [-1,-1,-1,2]`）**
- 朴素：`12` 次；
- KMP：`i = 0,1` 两次成功后，`i = 2` 处的 `'c'` 要连续失配三次（`j = 2 → 1 → 0`）才回退到 `-1`；`i = 5` 处重演一次，其余是正常推进，合计 `10` 次；
- KMP+nextval：`nextval[2] = -1`——因为 `T[2] = 'a'` 与 `T[next[2]] = T[1] = 'a'` 相同，回退到 `j = 1` 后必然再次失配，于是直接压到 `-1`。`i = 2` 与 `i = 5` 两处各从 3 次比较降到 1 次，合计 `10 - 4 = 6` 次。

对比两个样例可以看出：**nextval 只在"失配点字符与回退目标字符相同"时才省比较**；像样例 1 那样失配集中在最后一个字符上时，它一次也省不下来。

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
pnpm lab:doctor -- labs/chapter-03/exercise/E-03-17-nextval-comparison-count
pnpm lab:run -- labs/chapter-03/exercise/E-03-17-nextval-comparison-count
pnpm lab:score -- labs/chapter-03/exercise/E-03-17-nextval-comparison-count
```

- [ ] 样例 1、样例 2 都能手工复算出 `30 15 15` 与 `12 10 6`；
- [ ] 自己的实现与题面三份伪代码逐行等价（尤其是 `j == -1` 不计次、首次匹配成功即结束这两条）；
- [ ] `|T| = 1`、`|T| = |S|`、只匹配末位、含空格四类边界都有证据；
- [ ] 在 `|S| = |T| = 5000` 与 `|S| = 5000, |T| = 2500` 两个长串用例上都能在 2000 ms 内输出结果。

## 思考题

1. 为什么"构造 next / nextval 的比较"通常不计入复杂度结论？如果计进去，KMP 的总比较次数会变成什么量级？
2. 样例 1 里 nextval 一次比较都没省下来，而样例 2 省了 4 次。请给出一个判据，说明什么样的模式串上 nextval 的收益最大。
3. 如果把"首次匹配成功即结束"改成"扫完整个主串统计所有匹配"，三种算法的比较次数会怎么变？KMP 还能保持 `O(|S| + |T|)` 吗？

## 题解

<details>
<summary>点击查看题解</summary>

### 思路

按题面伪代码逐行实现即可，关键是**三套计数不能互相复用**：

1. 先按 `build_next` 求出 `next`，再按 `build_nextval` 求出 `nextval`（这两个过程不产生计数）；
2. 用双指针回溯写法数出朴素次数；
3. 用同一份 `count_kmp`，分别传入 `next` 与 `nextval`，得到后两个数字。

`nextval` 的语义是"若 `T[j] == T[next[j]]`，则回退到 `next[j]` 之后必然再次失配，于是直接取 `nextval[next[j]]`"，因此它的比较次数**不会多于** KMP（这一点也在测试数据里被断言校验）。

### 复杂度分析

KMP 的匹配过程是 `O(|S| + |T|)`：`i` 单调不减，`j` 每次回退都严格减小，均摊后总比较次数不超过 `2|S| + |T|` 量级。朴素匹配最坏 `O(|S| × |T|)`，本题把上界压到 5000 就是为了让"模拟朴素计数"本身可行。空间只需 `O(|T|)` 的两张表。

### 边界注意

- 两行都可能含空格（如 `hello world hello` 与 `o w`），必须 `getline`；
- `|T| = |S|` 且完全相等时，三种计数都恰好等于 `|S|`（首次匹配成功即结束）；
- `|T| = |S|` 且最后一位失配时，KMP 会回退到 `j = 0` 后再比较一次，所以 KMP 次数可能略大于 `|S|`；
- 计数用 `long long`：穷举最坏情况下朴素计数可达 `|S| × |T| = 2.5×10⁷`，`int` 够用但保持口径统一；
- `nextval` 构造时 `k` 可能为 `-1`，此时按定义取 `nextval[j] = -1`，**不要**去访问 `T[-1]`。

### 参考代码

```cpp
#include <iostream>
#include <string>
#include <vector>

std::vector<int> buildNext(const std::string &pattern) {
    const int m = static_cast<int>(pattern.size());
    std::vector<int> next(static_cast<std::size_t>(m), -1);
    int k = -1;
    int j = 0;
    while (j < m - 1) {
        if (k == -1 || pattern[j] == pattern[k]) {
            ++j;
            ++k;
            next[static_cast<std::size_t>(j)] = k;
        } else {
            k = next[static_cast<std::size_t>(k)];
        }
    }
    return next;
}

std::vector<int> buildNextval(const std::string &pattern, const std::vector<int> &next) {
    const int m = static_cast<int>(pattern.size());
    std::vector<int> nextval(static_cast<std::size_t>(m), -1);
    for (int j = 1; j < m; ++j) {
        const int k = next[static_cast<std::size_t>(j)];
        nextval[static_cast<std::size_t>(j)] =
            (k >= 0 && pattern[static_cast<std::size_t>(j)] == pattern[static_cast<std::size_t>(k)])
                ? nextval[static_cast<std::size_t>(k)]
                : k;
    }
    return nextval;
}

long long countNaive(const std::string &text, const std::string &pattern) {
    const long long n = static_cast<long long>(text.size());
    const long long m = static_cast<long long>(pattern.size());
    long long i = 0, j = 0, count = 0;
    while (i < n && j < m) {
        ++count;
        if (text[static_cast<std::size_t>(i)] == pattern[static_cast<std::size_t>(j)]) {
            ++i; ++j;
        } else {
            i = i - j + 1; j = 0;
        }
    }
    return count;
}

long long countKmp(const std::string &text, const std::string &pattern, const std::vector<int> &table) {
    const long long n = static_cast<long long>(text.size());
    const long long m = static_cast<long long>(pattern.size());
    long long i = 0, j = 0, count = 0;
    while (i < n && j < m) {
        if (j == -1) { ++i; ++j; continue; }
        ++count;
        if (text[static_cast<std::size_t>(i)] == pattern[static_cast<std::size_t>(j)]) {
            ++i; ++j;
        } else {
            j = table[static_cast<std::size_t>(j)];
        }
    }
    return count;
}

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    std::string text, pattern;
    if (!std::getline(std::cin, text)) text.clear();
    if (!std::getline(std::cin, pattern)) pattern.clear();

    const std::vector<int> next = buildNext(pattern);
    const std::vector<int> nextval = buildNextval(pattern, next);

    std::cout << countNaive(text, pattern) << ' '
              << countKmp(text, pattern, next) << ' '
              << countKmp(text, pattern, nextval) << '\n';
    return 0;
}
```

</details>
