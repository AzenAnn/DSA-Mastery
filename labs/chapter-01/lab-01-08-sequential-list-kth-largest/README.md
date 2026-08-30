---
title: "Lab 01-08：顺序表第 k 大元素"
description: "在无序顺序表中查找第 k 大的元素，理解基于划分的选择算法与排序取值的取舍。"
order: 8
chapter: 1
chapterTitle: "线性表"
updated: "2026-08-18"
contributors: ["czjLUCK"]
status: "draft"
lab: true
difficulty: "进阶"
duration: "35～50 分钟"
---

# Lab 01-08：顺序表第 k 大元素

给定一个**未排序**的整数顺序表，找出其中第 `k` 大的元素。例如序列 `[3, 2, 1, 5, 6, 4]` 中第 `2` 大的元素是 `5`。

## 题目

### 第 k 大元素

输入无序序列，输出第 `k` 大的元素值。

### 任务要求

1. 从标准输入读入 `n`、`k` 和序列元素；
2. 输出第 `k` 大的元素值；
3. 鼓励实现平均 `O(n)` 的快速选择算法，但先写一个正确版本（如排序后取值）再优化也可以接受。

## 输入格式

- 第一行：两个整数 `n` 和 `k`；
- 第二行：`n` 个整数，表示无序顺序表。

## 输出格式

- 一行一个整数，表示第 `k` 大的元素值。

## 数据范围与限制

| 项目 | 范围 |
| --- | --- |
| 序列长度 `n` | 1 ≤ n ≤ 10⁵ |
| k | 1 ≤ k ≤ n |
| 元素值 | −10⁹ ≤ 元素 ≤ 10⁹ |
| 时间复杂度要求 | 期望 O(n)，排序解法 O(n log n) 可作为起点 |
| 额外空间限制 | O(1) 或 O(log n)（递归栈） |

## 样例

### 样例输入 1

```input
6 2
3 2 1 5 6 4
```

### 样例输出 1

```output
5
```

### 样例输入 2

```input
1 1
42
```

### 样例输出 2

```output
42
```

### 样例输入 3

```input
5 3
-1 -5 -3 -2 -4
```

### 样例输出 3

```output
-3
```

### 样例解释

以样例 1 为例，输入 `n=6, k=2, a=[3,2,1,5,6,4]`：

目标是找升序排列后下标为 `n-k=4` 的元素（即第 5 小的元素）。

1. 随机选 `pivot=4`，三向切分后：左侧 `[5,6]`，中间 `[4]`，右侧 `[3,2,1]`；
2. 左侧有 2 个元素，`n-k=4` 不在左侧；
3. 中间有 1 个元素，2+1=3 < 4，也不在中间；
4. 递归右侧 `[3,2,1]`，找下标 `4-3=1` 的元素；
5. 在 `[3,2,1]` 中选 `pivot=2`，切分后左侧 `[3]`，中间 `[2]`，右侧 `[1]`；
6. 左侧 1 个元素，`1` 恰好等于目标下标，答案为 `5`。

（实际执行中 pivot 选择是随机的，以上仅为一种可能路径。）

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
pnpm lab:doctor -- labs/chapter-01/lab-01-08-sequential-list-kth-largest
pnpm lab:run -- labs/chapter-01/lab-01-08-sequential-list-kth-largest
pnpm lab:run -- labs/chapter-01/lab-01-08-sequential-list-kth-largest --case 001-sample
pnpm lab:score -- labs/chapter-01/lab-01-08-sequential-list-kth-largest
```

`make run` 在答案尚未全对时仍正常返回，避免 Make 把学习结果显示成工具故障；`make score` 是严格入口，只有 100 分才返回成功。标准输出参与判题，调试信息请写入标准错误。

- [ ] 样例输入与输出完全一致
- [ ] 四组边界自测通过
- [ ] 能说明排序解法与快速选择的时间复杂度差异
- [ ] （选做）实现了快速选择并理解为什么期望复杂度是 O(n)

## 思考题

1. 如果要求第 `k` 大和第 `m` 大（`k < m`）同时输出，能否在一次快速选择中完成？
2. 快速选择在什么输入下会退化到最坏情况 O(n²)？如何缓解？

## 题解

<details>
<summary>点击查看题解</summary>

### 思路

使用**快速选择（Quickselect）**算法，期望 `O(n)` 找到第 `k` 大元素。

核心思想与快速排序相同：选一个 `pivot`，将数组划分为大于、等于、小于三部分。但快速选择**只递归包含答案的那一侧**，因此期望复杂度为 `O(n)`。

### 算法步骤

1. 将问题转化为找升序排列下标为 `n - k` 的元素；
2. 随机选 `pivot`；
3. 三向切分：`> pivot` 放左边，`== pivot` 放中间，`< pivot` 放右边；
4. 若 `n - k` 落在左侧区间，递归左侧；落在右侧，递归右侧；落在中间，直接返回 `pivot`。

### 复杂度分析

- **期望时间复杂度**：`O(n)`，每次问题规模期望减半。
- **最坏时间复杂度**：`O(n²)`，极端不平衡的划分。
- **空间复杂度**：`O(log n)`，递归栈深度。

### 边界注意

- 随机选 `pivot` 可极大降低退化为最坏情况的概率；
- `k` 的范围保证 `1 <= k <= n`，无需额外判断。

</details>
<details>
<summary>点击查看参考代码</summary>

```cpp
#include <cstddef>
#include <cstdlib>
#include <iostream>
#include <vector>

std::size_t partition(std::vector<long long>& a, std::size_t left, std::size_t right) {
    std::size_t pivot_idx = left + std::rand() % (right - left + 1);
    std::swap(a[pivot_idx], a[right]);

    long long pivot = a[right];
    std::size_t i = left;
    for (std::size_t j = left; j < right; ++j) {
        if (a[j] <= pivot) {
            std::swap(a[i++], a[j]);
        }
    }
    std::swap(a[i], a[right]);
    return i;
}

long long quickselect(std::vector<long long>& a, std::size_t left, std::size_t right, std::size_t target) {
    while (left < right) {
        std::size_t p = partition(a, left, right);
        if (p == target) return a[p];
        if (p < target) left = p + 1;
        else right = p - 1;
    }
    return a[left];
}

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    std::size_t n = 0, k = 0;
    std::cin >> n >> k;
    std::vector<long long> a(n);
    for (auto& v : a) std::cin >> v;

    std::cout << quickselect(a, 0, n - 1, n - k) << '\n';
}
```

</details>


