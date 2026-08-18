---
title: "Lab 01-06：有序顺序表去重"
description: "在有序顺序表中原地删除重复元素，练习双指针与元素搬移的边界控制。"
order: 6
chapter: 1
chapterTitle: "线性表"
updated: "2026-08-18"
contributors: ["czjLUCK"]
status: "draft"
lab: true
difficulty: "入门"
duration: "20～30 分钟"
---

# Lab 01-06：有序顺序表去重

给定一个按**非递减顺序**排列的整数序列，删除其中重复出现的元素，使得每个值只保留一次。结果序列必须保持非递减顺序，且要求**原地修改**——不能额外申请与输入规模成正比的辅助数组。

## 题目

### 有序顺序表去重

输入一个已排序的整数序列，原地删除重复元素后输出新序列。

### 任务要求

1. 从标准输入读入序列长度和元素；
2. 在原数组/顺序表上完成去重，不能使用 `O(n)` 级别的额外数组空间；
3. 允许使用少量常数额外变量（如索引指针）；
4. 输出去重后的序列。

## 输入格式

- 第一行：一个整数 `n`，表示序列长度；
- 第二行：`n` 个整数，按非递减顺序排列。

## 输出格式

- 一行若干个整数，为去重后的序列，按非递减顺序排列；
- 相邻整数之间用**单个空格**分隔，行末不要有多余空格。

## 数据范围与限制

| 项目 | 范围 |
| --- | --- |
| 序列长度 `n` | 1 ≤ n ≤ 10⁵ |
| 元素值 | −10⁹ ≤ 元素 ≤ 10⁹ |
| 时间复杂度要求 | O(n) |
| 额外空间限制 | O(1)，仅允许常数级辅助变量 |

## 样例

### 样例输入 1

```input
8
1 1 2 2 3 4 4 5
```

### 样例输出 1

```output
1 2 3 4 5
```

### 样例输入 2

```input
5
7 7 7 7 7
```

### 样例输出 2

```output
7
```

### 样例输入 3

```input
1
42
```

### 样例输出 3

```output
42
```

### 样例解释

以样例 1 为例，输入 `1 1 2 2 3 4 4 5`：

| 快指针位置 | 快指针值 | 慢指针位置 | 慢指针值 | 操作 |
| --- | --- | --- | --- | --- |
| 0 | 1 | 0 | 1 | 初始化，`slow=0` |
| 1 | 1 | 0 | 1 | 与 `slow` 相同，跳过 |
| 2 | 2 | 0 | 1 | 不同，`a[1]=2`，`slow=1` |
| 3 | 2 | 1 | 2 | 与 `slow` 相同，跳过 |
| 4 | 3 | 1 | 2 | 不同，`a[2]=3`，`slow=2` |
| 5 | 4 | 2 | 3 | 不同，`a[3]=4`，`slow=3` |
| 6 | 4 | 3 | 4 | 与 `slow` 相同，跳过 |
| 7 | 5 | 3 | 4 | 不同，`a[4]=5`，`slow=4` |

结束时 `slow=4`，去重后长度为 5，输出 `1 2 3 4 5`。

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
pnpm lab:doctor -- labs/chapter-01/lab-01-06-sequential-list-deduplication
pnpm lab:run -- labs/chapter-01/lab-01-06-sequential-list-deduplication
pnpm lab:run -- labs/chapter-01/lab-01-06-sequential-list-deduplication --case 001-sample
pnpm lab:score -- labs/chapter-01/lab-01-06-sequential-list-deduplication
```

`make run` 在答案尚未全对时仍正常返回，避免 Make 把学习结果显示成工具故障；`make score` 是严格入口，只有 100 分才返回成功。标准输出参与判题，调试信息请写入标准错误。

- [ ] 样例输入与输出完全一致
- [ ] 三组边界自测通过
- [ ] 程序满足 O(n) 时间且未使用 O(n) 辅助数组
- [ ] 能解释为什么"有序"是去重可做到 O(n) 的关键前提

## 思考题

1. 如果输入序列**不是**有序的，原地去重是否仍能在 O(n) 完成？为什么？
2. 顺序表去重与链表去重在指针/索引维护上有什么本质差异？

## 题解

<details>
<summary>点击查看题解</summary>

### 思路

利用数组已有序的性质，使用**双指针（快慢指针）**原地覆盖重复元素。

- `slow` 指向已去重部分的最后一个有效位置；
- `fast` 遍历整个数组；
- 当 `a[fast] != a[slow]` 时，说明发现了新元素，将其复制到 `slow + 1` 处，`slow++`。

因为数组非递减，相同元素必然连续出现，所以只需比较相邻位置即可判断重复。

### 算法步骤

1. 若 `n <= 1`，直接输出原序列；
2. `slow = 0`；
3. `fast` 从 `1` 遍历到 `n-1`：
   - 若 `a[fast] != a[slow]`，则 `a[++slow] = a[fast]`；
4. 输出 `a[0..slow]`，共 `slow + 1` 个元素。

### 复杂度分析

- **时间复杂度**：`O(n)`，每个元素只被访问一次。
- **空间复杂度**：`O(1)`，仅使用两个索引变量。

### 边界注意

- `n = 0`：输出空行；
- 全部相同：最终只保留一个元素；
- 全部不同：`slow` 最终停在 `n-1`，输出全部元素。

</details>
<details>
<summary>点击查看参考代码</summary>

```cpp
#include <cstddef>
#include <iostream>
#include <vector>

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    std::size_t n = 0;
    std::cin >> n;
    if (n == 0) {
        std::cout << "\n";
        return 0;
    }

    std::vector<long long> a(n);
    for (auto& v : a) std::cin >> v;

    std::size_t slow = 0;
    for (std::size_t fast = 1; fast < n; ++fast) {
        if (a[fast] != a[slow]) {
            a[++slow] = a[fast];
        }
    }

    for (std::size_t i = 0; i <= slow; ++i) {
        if (i > 0) std::cout << ' ';
        std::cout << a[i];
    }
    std::cout << '\n';
}
```

</details>


