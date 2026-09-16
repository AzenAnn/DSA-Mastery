---
title: "11.6 基数排序"
description: "基数排序的 LSD 按位分配收集原理、稳定性关键、正确性证明与突破比较下界的本质。"
order: 6
chapter: 11
chapterTitle: "高效排序与外部排序"
updated: "2026-09-16"
contributors: ["Ph1z"]
status: "draft"
---

# 11.6 基数排序

基数排序适用于"关键字可以表示为若干位"的数据，例如十进制整数、字符串或固定长度字串。它通常采用 LSD（Least Significant Digit，最低位优先）策略：

1. 先按最低位分配到桶里；
2. 再按桶序收集；
3. 继续处理更高位，直到最高位。

> **Ph1zの理解：** 基数排序就像按学号排队——先看最后一位，按最后一位排好；再看倒数第二位，按倒数第二位排好（但保持最后一位的顺序不变）；……最后看第一位。因为每次都是稳定排序，高位排序不会打乱低位已经排好的顺序，所以最终一定正确。这叫"LSD（最低位优先）"——先排低位，后排高位。

## 代码

```text
Algorithm RadixSort(A, n):
    Input: An array A of n elements (non-negative integers)
    Output: Array A sorted in ascending order

    // 1. 找出数组中的最大值，确定最大位数
    maxVal = A[0]
    for i = 1 to n - 1 do
        if A[i] > maxVal then maxVal = A[i]
    end for

    // 2. 从最低位到最高位，逐位进行稳定计数排序
    exp = 1                                 // exp = 10^k，表示当前处理的位
    while maxVal / exp > 0 do
        CountingSortByDigit(A, n, exp)      // 按第 exp 位排序
        exp = exp * 10
    end while

    return A

Algorithm CountingSortByDigit(A, n, exp):
    Input: An array A, size n, current digit exp
    Output: Array A sorted by the digit at exp position

    Create cnt[0...9] initialized to 0      // 十进制每位只有 0-9

    // 1. 统计当前位频次
    for i = 0 to n - 1 do
        digit = (A[i] / exp) % 10
        cnt[digit] = cnt[digit] + 1
    end for

    // 2. 前缀和，确定每个数字的结束位置
    for i = 1 to 9 do
        cnt[i] = cnt[i] + cnt[i - 1]
    end for

    // 3. 从后往前回填（保证稳定性）
    Create out[0...n-1]
    for i = n - 1 down to 0 do
        digit = (A[i] / exp) % 10
        cnt[digit] = cnt[digit] - 1
        out[cnt[digit]] = A[i]
    end for

    // 4. 拷贝回原数组
    for i = 0 to n - 1 do
        A[i] = out[i]
    end for
```

```cpp
// 按当前位进行稳定计数排序
void countingSortByDigit(int a[], int n, int exp) {
    vector<int> cnt(10, 0);                          // 0-9 共 10 个桶
    vector<int> out(n);

    // 1. 统计当前位频次
    for (int i = 0; i < n; ++i) {
        ++cnt[(a[i] / exp) % 10];
    }

    // 2. 前缀和，确定每个数字的结束位置
    for (int i = 1; i < 10; ++i) {
        cnt[i] += cnt[i - 1];
    }

    // 3. 从后往前回填（保证稳定性）
    for (int i = n - 1; i >= 0; --i) {
        int digit = (a[i] / exp) % 10;
        out[--cnt[digit]] = a[i];
    }

    // 4. 拷贝回原数组
    for (int i = 0; i < n; ++i) a[i] = out[i];
}

void radixSort(int a[], int n) {
    int maxVal = *max_element(a, a + n);              // 找最大值
    for (int exp = 1; maxVal / exp > 0; exp *= 10) {  // 从个位到最高位
        countingSortByDigit(a, n, exp);               // 按当前位排序
    }
}
```

## 优化代码

基数排序的核心问题是：**只能处理非负整数，且每一位都需要一次完整的计数排序（需要额外空间）**。以下是几种常见的优化方向：

```cpp
// 优化 1：支持负数（将负数和非负数分开处理，或使用偏移量）
void radixSortWithNegative(int a[], int n) {
    if (n <= 1) return;

    // 分离负数和非负数
    vector<int> neg, pos;
    for (int i = 0; i < n; ++i) {
        if (a[i] < 0) neg.push_back(-a[i]);     // 取绝对值
        else          pos.push_back(a[i]);
    }

    // 分别排序
    if (!neg.empty()) radixSort(neg.data(), neg.size());
    if (!pos.empty()) radixSort(pos.data(), pos.size());

    // 合并：负数逆序放前面，非负数顺序放后面
    int idx = 0;
    for (int i = neg.size() - 1; i >= 0; --i) a[idx++] = -neg[i];
    for (int x : pos) a[idx++] = x;
}
```

```cpp
// 优化 2：使用基数 2^k（如 256）减少排序趟数
// 十进制每位需要 10 个桶，基数 256 只需 4 趟（32 位整数）
void radixSort256(int a[], int n) {
    if (n <= 1) return;

    const int RADIX = 256;                          // 2^8
    const int MASK = RADIX - 1;
    vector<int> out(n);
    vector<int> cnt(RADIX);

    // 32 位整数需 4 趟（每趟 8 位）
    for (int shift = 0; shift < 32; shift += 8) {
        fill(cnt.begin(), cnt.end(), 0);

        // 统计当前字节频次
        for (int i = 0; i < n; ++i) {
            ++cnt[(a[i] >> shift) & MASK];
        }

        // 前缀和
        for (int i = 1; i < RADIX; ++i) {
            cnt[i] += cnt[i - 1];
        }

        // 从后往前回填（保稳定）
        for (int i = n - 1; i >= 0; --i) {
            out[--cnt[(a[i] >> shift) & MASK]] = a[i];
        }

        // 拷回原数组
        for (int i = 0; i < n; ++i) a[i] = out[i];
    }
}
```

```cpp
// 优化 3：MSD 基数排序（从高位到低位，递归分桶）
// 适合字符串排序，且可在高位分桶后提前终止
void radixSortMSD(int a[], int n, int exp) {
    if (n <= 1 || exp == 0) return;

    vector<vector<int>> buckets(10);
    for (int i = 0; i < n; ++i) {
        buckets[(a[i] / exp) % 10].push_back(a[i]);
    }

    int idx = 0;
    for (int i = 0; i < 10; ++i) {
        if (!buckets[i].empty()) {
            // 递归对每个桶按更高位排序
            radixSortMSD(buckets[i].data(), buckets[i].size(), exp / 10);
            for (int x : buckets[i]) a[idx++] = x;
        }
    }
}

void radixSortMSD(int a[], int n) {
    int maxVal = *max_element(a, a + n);
    int exp = 1;
    while (maxVal / exp >= 10) exp *= 10;           // 最高位
    radixSortMSD(a, n, exp);
}
```

```cpp
// 优化 4：原地基数排序（减少 out 数组，但会破坏稳定性）
// 空间从 O(n + k) 降到 O(k)，但实现复杂且不保证稳定
void radixSortInPlace(int a[], int n) {
    if (n <= 1) return;

    int maxVal = *max_element(a, a + n);
    for (int exp = 1; maxVal / exp > 0; exp *= 10) {
        vector<int> cnt(10, 0);
        for (int i = 0; i < n; ++i) ++cnt[(a[i] / exp) % 10];
        for (int i = 1; i < 10; ++i) cnt[i] += cnt[i - 1];

        // 使用"循环置换"方式原地重排（实现复杂，略）
        // 实际中不推荐，因为会破坏稳定性
    }
}
```

## 正确性证明

基数排序的有效性来自"稳定性 + 位级排序"。

- 对当前位做一次稳定排序；
- 稳定排序意味着较高位相同的元素，低位排序结果不会打乱它们的相对顺序；
- 处理完最低位后，数值按最低位有序；
- 再按次低位稳定排序，确保次低位优先于更高位的比较关系被正确保留；
- 最终所有位都处理完成后，整个关键字顺序就正确了。

> **为什么必须稳定？** 假设当前排十位，两个数的十位相同但个位不同（如 23 和 27）。如果排序不稳定，27 可能排到 23 前面——个位的排序白做了。稳定性保证了"低位辛辛苦苦排好的顺序，高位排序不会搞乱"。

因此，若每一位排序都稳定，那么整个基数排序正确。 ✓

## 复杂度分析

若关键字有 $d$ 位，每位基数为 $r$，则每一趟的分配/收集为 $O(n+r)$，总复杂度：

$$
T(n) = O\bigl(d(n+r)\bigr).
$$

若 $d$ 与 $r$ 是常数（如 32 位整数按字节分解：$d = 4, r = 256$），则可看作线性时间 $O(n)$。

**空间复杂度：** $O(n+r)$。

**稳定性：** 稳定（前提是每一位的排序都稳定）。

> **基数排序 vs 比较排序：** 基数排序不是"比较排序"——它不依赖"两个元素之间必须比较大小"，它依赖"按位检查"。所以它不违背比较排序的 $\Omega(n\log n)$ 下界；它只是使用了更强的输入结构信息（关键字可以按位分解）。就像考试不能带计算器（比较排序），但如果你自己心算能力够强（非比较排序），算得比别人快不犯规喵