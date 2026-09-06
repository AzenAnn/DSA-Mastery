---
title: "Lab 01-E-02：顺序表循环右移"
description: "在不借助与输入规模成正比的辅助空间前提下，将顺序表循环右移 k 位。"
order: 7
chapter: 1
labId: "01E02"
chapterTitle: "线性表"
updated: "2026-08-18"
contributors: ["czjLUCK"]
status: "draft"
lab: true
difficulty: "入门～进阶"
duration: "25～40 分钟"
---

# Lab 01-E-02：顺序表循环右移

给定一个长度为 `n` 的顺序表和一个非负整数 `k`，把表中元素循环右移 `k` 位。右移 `1` 位指最后一个元素移到最前面，其余元素依次后移一位。

## 题目

### 顺序表循环右移

将顺序表整体向右循环移动 `k` 个位置。

### 任务要求

1. 从标准输入读入 `n`、`k` 和序列元素；
2. **原地完成**右移操作，额外空间复杂度为 `O(1)`；
3. 输出右移后的序列。

## 输入格式

- 第一行：两个整数 `n` 和 `k`，分别表示序列长度和右移位数；
- 第二行：`n` 个整数，表示顺序表的元素。

## 输出格式

- 一行 `n` 个整数，为循环右移后的序列；
- 相邻整数之间用**单个空格**分隔，行末不要有多余空格。

## 数据范围与限制

| 项目 | 范围 |
| --- | --- |
| 序列长度 `n` | 1 ≤ n ≤ 10⁵ |
| 右移位数 `k` | 0 ≤ k ≤ 10⁹ |
| 元素值 | −10⁹ ≤ 元素 ≤ 10⁹ |
| 时间复杂度要求 | O(n) |
| 额外空间限制 | O(1)，仅允许常数级辅助变量 |

::: tip 关于 k 的范围
`k` 可能大于 `n`。右移 `k` 位与右移 `k mod n` 位等价，因此实际只需移动 `k % n` 位。当 `n = 0` 时按题意不会出现（n ≥ 1）。
:::

## 样例

### 样例输入 1

```input
5 2
1 2 3 4 5
```

### 样例输出 1

```output
4 5 1 2 3
```

### 样例输入 2

```input
4 4
10 20 30 40
```

### 样例输出 2

```output
10 20 30 40
```

### 样例输入 3

```input
6 7
1 2 3 4 5 6
```

### 样例输出 3

```output
6 1 2 3 4 5
```

### 样例解释

以样例 1 为例，输入 `n=5, k=2, a=[1,2,3,4,5]`：

1. `k = 2 % 5 = 2`；
2. 整体翻转 `[0..4]`：`[5,4,3,2,1]`；
3. 翻转前 `k=2` 个 `[0..1]`：`[4,5,3,2,1]`；
4. 翻转后 `n-k=3` 个 `[2..4]`：`[4,5,1,2,3]`。

输出 `4 5 1 2 3`。三次翻转后，原数组最后 `k` 个元素被移到了最前面。

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
pnpm lab:doctor -- labs/chapter-01/exercise/E-01-02-sequential-list-rotate
pnpm lab:run -- labs/chapter-01/exercise/E-01-02-sequential-list-rotate
pnpm lab:run -- labs/chapter-01/exercise/E-01-02-sequential-list-rotate --case 001-sample
pnpm lab:score -- labs/chapter-01/exercise/E-01-02-sequential-list-rotate
```

`make run` 在答案尚未全对时仍正常返回，避免 Make 把学习结果显示成工具故障；`make score` 是严格入口，只有 100 分才返回成功。标准输出参与判题，调试信息请写入标准错误。

- [ ] 样例输入与输出完全一致
- [ ] 三组边界自测通过
- [ ] 程序满足 O(n) 时间且 O(1) 额外空间
- [ ] 能解释三次翻转法为什么能得到正确结果

## 思考题

1. 如果允许 `O(n)` 辅助空间，你会如何更简单地实现？与原地法相比各有什么适用场景？
2. 循环左移 `k` 位能否复用同样的思路？需要改变什么？

## 题解

<details>
<summary>点击查看题解</summary>

### 思路

利用**三次翻转法**实现原地循环右移。

以右移 `k=2` 为例：`[1,2,3,4,5]` → 先整体翻转 `[5,4,3,2,1]` → 前 `k` 个翻转 `[4,5,3,2,1]` → 后 `n-k` 个翻转 `[4,5,1,2,3]`。

两次局部翻转的交界恰好就是循环右移的分界点。

### 算法步骤

1. `k = k % n`（`k` 可能大于 `n`）；
2. 翻转整个数组 `[0, n-1]`；
3. 翻转前 `k` 个 `[0, k-1]`；
4. 翻转后 `n-k` 个 `[k, n-1]`。

### 复杂度分析

- **时间复杂度**：`O(n)`，三次翻转各遍历数组一次。
- **空间复杂度**：`O(1)`，原地操作，仅需交换用的临时变量。

### 边界注意

- `k % n == 0`：数组不变；
- 翻转子区间时注意左右端点的闭区间处理。

</details>
<details>
<summary>点击查看参考代码</summary>

```cpp
#include <cstddef>
#include <iostream>
#include <vector>

void reverse(std::vector<long long>& a, std::size_t left, std::size_t right) {
    while (left < right) {
        std::swap(a[left], a[right - 1]);
        ++left;
        --right;
    }
}

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    std::size_t n = 0, k = 0;
    std::cin >> n >> k;
    if (n == 0) {
        std::cout << "\n";
        return 0;
    }

    std::vector<long long> a(n);
    for (auto& v : a) std::cin >> v;

    k %= n;
    reverse(a, 0, n);
    reverse(a, 0, k);
    reverse(a, k, n);

    for (std::size_t i = 0; i < n; ++i) {
        if (i > 0) std::cout << ' ';
        std::cout << a[i];
    }
    std::cout << '\n';
}
```

</details>


