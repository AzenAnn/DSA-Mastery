---
title: "Lab 02-10：柱状图中最大的矩形"
description: "使用单调栈确定每根柱子的左右边界，并计算最大矩形面积。"
order: 10
chapter: 2
chapterTitle: "栈与队列"
updated: "2026-08-21"
contributors: ["DSA Mastery Team"]
status: "draft"
lab: true
difficulty: "进阶"
duration: "60～75 分钟"
---

# Lab 02-10：柱状图中最大的矩形

> 题目来源：改编自 [LeetCode 84：柱状图中最大的矩形](https://leetcode.cn/problems/largest-rectangle-in-histogram/)。本 Lab 使用课程自定义输入输出协议和独立测试，不复制来源站点的代码或测试。

## 学习目标

- 使用单调递增下标栈确定柱子的可扩展宽度。
- 在出栈时正确计算左边界、右边界和矩形面积。
- 使用哨兵统一处理扫描结束后仍在栈中的柱子，并用 64 位整数保存面积。

## 前置知识

建议先复习[第 2.3 节的单调栈](../../../content/chapter-02-stack-queue/03-applications.md#单调栈下一个更大元素)。实现使用 ISO C++17；开始前可运行 `make doctor` 检查环境。

## 题目

给定 `n` 根相邻的柱子。每根柱子的宽度都是 `1`，第 `i` 根柱子的高度是 `heights[i]`。

你可以选择一段连续柱子，并在这些柱子覆盖的范围内画一个矩形。矩形不能超出任何一根被选中柱子的高度，因此这段区间能够使用的最大矩形高度等于区间中的最小柱高。

如果选择区间 `[left, right]`，那么：

- 矩形宽度为 `right-left+1`；
- 矩形高度为 `min(heights[left..right])`；
- 矩形面积为“宽度 × 高度”。

请计算整个柱状图中能够得到的最大矩形面积。要求使用单调栈在 `O(n)` 时间内完成，不得枚举所有可能的左右边界。

## 输入格式

- 第一行：柱子数量 `n`；
- 第二行：`n` 个非负整数 `heights[0] ... heights[n-1]`。

## 输出格式

输出一个整数，表示柱状图中能够形成的最大矩形面积。

## 数据范围与限制

| 项目 | 范围或要求 |
| --- | --- |
| 柱子数量 `n` | `1 ≤ n ≤ 200000` |
| 柱高 `heights[i]` | `0 ≤ heights[i] ≤ 10^9` |
| 柱子宽度 | 每根均为 `1` |
| 最大答案 | 不超过 `2 × 10^14`，必须使用 64 位整数 |
| 时间复杂度要求 | `O(n)` |
| 额外空间限制 | `O(n)` |

## 样例

```input
6
2 1 5 6 2 3
```

```output
10
```

### 样例解释

输入对应的柱高为 `[2, 1, 5, 6, 2, 3]`。例如：

| 选择的连续区间 | 区间柱高 | 可用高度 | 宽度 | 面积 |
| --- | --- | ---: | ---: | ---: |
| `[0, 0]` | `[2]` | 2 | 1 | 2 |
| `[0, 5]` | `[2, 1, 5, 6, 2, 3]` | 1 | 6 | 6 |
| `[2, 3]` | `[5, 6]` | 5 | 2 | 10 |

区间 `[2, 3]` 可以画出高度为 `5`、宽度为 `2` 的矩形，面积为 `10`，这是所有连续区间中的最大值。

在线性算法中，栈保存柱子下标，并让对应高度保持严格递增。扫描到下标 `4`、高度 `2` 时：

1. 高度 `6` 的柱子出栈，它只能向左右扩展到宽度 `1`，面积为 `6`；
2. 高度 `5` 的柱子继续出栈，它可以覆盖下标 `2..3`，宽度为 `2`，面积为 `10`；
3. 高度 `2` 随后入栈，继续等待右边界确定。

扫描结束后，还需要使用一个比所有合法柱高都小的哨兵，把栈中尚未结算的柱子依次弹出。

## 边界与验收重点

- 栈中保存下标，对应高度严格递增。
- 当前高度小于或等于栈顶高度时，栈顶柱子的右侧扩展在当前位置停止。
- 柱子出栈后，若栈为空则左边界为 `0`；否则左边界为新栈顶下标加 `1`。
- 相等高度可弹出旧下标并保留新下标；新下标继承相同的更低左边界，并能继续向右扩展。
- 扫描结束时使用比所有合法高度都小的哨兵，结算剩余柱子。

标准输入均满足题面列出的数据约束。调试日志必须写入标准错误，标准输出只保留判题结果。

## 如何验证

```powershell
make doctor
make run
make run CASE=001-sample
make interactive
make score
```

Windows 没有安装 Make 时，在仓库根目录运行：

```powershell
pnpm lab:doctor -- labs/chapter-02/lab-02-10-largest-rectangle-histogram
pnpm lab:run -- labs/chapter-02/lab-02-10-largest-rectangle-histogram
pnpm lab:run -- labs/chapter-02/lab-02-10-largest-rectangle-histogram --case 001-sample
pnpm lab:score -- labs/chapter-02/lab-02-10-largest-rectangle-histogram
```

`make run` 用于查看各用例；`make score` 只有 100 分才返回成功。样例采用精确输出比较；`009-scale` 使用两千根等高柱子，回归相等高度的左边界保留和统一结算。线性复杂度要求仍需结合实现分析判断，不依赖易受机器性能影响的极限超时。

- [ ] 单柱、递增、递减、等高、零高度和大面积均通过
- [ ] 面积计算使用 64 位整数
- [ ] 能画出样例中每次出栈时的左右边界
- [ ] 能证明每根柱子最多入栈和出栈各一次

## 思考与复盘

1. 为什么最大面积通常在某根柱子出栈时结算？
2. 若扫描结束后不添加哨兵，会漏掉哪些柱子？
3. 为什么面积必须使用 64 位整数，而下标差仍可由 `n` 的范围保证安全？

<details>
<summary>查看参考答案</summary>

1. **因为出栈时这根柱子的最大可扩展宽度已经确定。** 当前柱子高度小于或等于栈顶高度时，当前位置就是被弹出柱子不能跨越的右侧边界；弹出后新的栈顶是左侧第一个更矮的柱子。因此左右边界同时已知，可以立即计算“以被弹出高度为矩形高度”的最大面积。等高柱子采用弹出旧下标的策略时，后入栈的等高柱子会继续代表这个高度向右扩展。
2. **会漏掉右侧一直没有遇到更矮柱子的候选。** 例如高度严格递增的 `[1, 2, 3]`，正常扫描过程中没有柱子触发出栈；若扫描结束就直接返回，三根柱子的面积都没有完整结算。末尾加入概念上的高度 `-1` 哨兵，可以触发所有剩余柱子依次出栈。
3. **面积的乘积会超过 32 位范围。** 柱高最大为 `10^9`，宽度最大为 `2×10^5`，乘积可达 `2×10^14`，远大于 32 位有符号整数上限。下标和宽度最多为 `n ≤ 200000`，本身不会达到这个量级，但在乘法前仍应把宽度转换为 64 位整数，确保整个乘法按 64 位执行。

</details>

## 题解

<details>
<summary>点击查看题解</summary>

### 思路与不变量

维护高度严格递增的下标栈。扫描到高度 `current` 时，只要栈顶高度大于或等于它，就弹出栈顶柱子并结算：当前位置 `i` 是该柱子第一个更矮的右边界；弹出后的新栈顶是左侧第一个更矮的柱子。

若弹出后栈为空，左边界为 0；否则为新栈顶下标加 1。扫描末尾使用高度 `-1` 的概念哨兵，统一弹出所有剩余柱子。

### 复杂度分析

- 时间复杂度：`O(n)`；每根柱子最多入栈和出栈各一次；
- 额外空间：`O(n)`；
- 面积使用 64 位整数计算。

### 边界注意

- 等高柱子也弹出旧下标，避免重复候选并保留可扩展宽度；
- 全递增序列要依靠末尾哨兵完成结算；
- 零高度会自然切断跨越它的正面积矩形。

</details>
<details>
<summary>点击查看参考代码</summary>

```cpp
#include <algorithm>
#include <cstddef>
#include <cstdint>
#include <iostream>
#include <vector>

std::int64_t largestRectangleArea(const std::vector<std::int64_t>& heights) {
    std::vector<std::size_t> increasing;
    increasing.reserve(heights.size());
    std::int64_t best = 0;

    for (std::size_t i = 0; i <= heights.size(); ++i) {
        const std::int64_t current = i == heights.size() ? -1 : heights[i];
        while (!increasing.empty() && heights[increasing.back()] >= current) {
            const std::int64_t height = heights[increasing.back()];
            increasing.pop_back();
            const std::size_t left = increasing.empty() ? 0 : increasing.back() + 1;
            const std::int64_t width = static_cast<std::int64_t>(i - left);
            best = std::max(best, height * width);
        }
        if (i < heights.size()) {
            increasing.push_back(i);
        }
    }

    return best;
}

int main() {
    std::size_t n = 0;
    std::cin >> n;

    std::vector<std::int64_t> heights(n);
    for (std::int64_t& height : heights) {
        std::cin >> height;
    }

    std::cout << largestRectangleArea(heights) << '\n';
}
```

</details>
