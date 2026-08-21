---
title: "Lab 02-13：滑动窗口最大值"
description: "使用单调队列在线性时间内求出每个固定长度窗口的最大值。"
order: 13
chapter: 2
chapterTitle: "栈与队列"
updated: "2026-08-21"
contributors: ["DSA Mastery Team"]
status: "draft"
lab: true
difficulty: "进阶"
duration: "45～60 分钟"
---

# Lab 02-13：滑动窗口最大值

> 题目来源：改编自 [LeetCode 239：滑动窗口最大值](https://leetcode.cn/problems/sliding-window-maximum/)。本 Lab 使用课程自定义输入输出协议和独立测试，不复制来源站点的代码或测试。

## 学习目标

- 使用双端队列同时维护窗口有效范围和最大值候选。
- 建立“下标递增、对应值严格递减”的单调队列不变量。
- 证明每个下标最多从队尾删除一次、从队头过期一次，因此总时间为 `O(n)`。

## 前置知识

建议先学习[第 2.2 节队列](../../../content/chapter-02-stack-queue/02-queue.md)和[第 2.3 节的单调候选思想](../../../content/chapter-02-stack-queue/03-applications.md#单调栈下一个更大元素)。实现使用 ISO C++17；开始前可运行 `make doctor` 检查环境。

## 题目

给定长度为 `n` 的整数序列和窗口长度 `k`。窗口从左向右每次移动一位，请依次输出每个窗口中的最大值。

要求使用单调队列完成，不得为每个窗口重新线性扫描或排序。

## 输入格式

- 第一行：两个整数 `n` 和 `k`；
- 第二行：`n` 个整数，表示原序列。

## 输出格式

一行 `n-k+1` 个整数，依次表示各窗口的最大值。

## 数据范围与限制

| 项目 | 范围或要求 |
| --- | --- |
| 序列长度 `n` | `1 ≤ n ≤ 200000` |
| 窗口长度 `k` | `1 ≤ k ≤ n` |
| 元素值 | `-10^9 ≤ value[i] ≤ 10^9` |
| 时间复杂度要求 | `O(n)` |
| 额外空间限制 | `O(k)` |

## 样例

```input
8 3
1 3 -1 -3 5 3 6 7
```

```output
3 3 5 5 6 7
```

### 样例解释

队列保存候选下标而不是数值，并保持对应值严格递减。例如处理前四个元素时：

| 下标 `i` | 新值 | 候选下标（队头 → 队尾） | 本轮输出 |
| ---: | ---: | --- | ---: |
| 0 | 1 | `[0]` | — |
| 1 | 3 | `[1]` | — |
| 2 | -1 | `[1, 2]` | 3 |
| 3 | -3 | `[1, 2, 3]` | 3 |
| 4 | 5 | `[4]` | 5 |

值 `5` 到来时，队尾较小的候选都不可能再成为后续窗口最大值，因此被依次删除。

## 边界与验收重点

- 队列保存下标，队头下标必须始终位于当前窗口内。
- 插入新元素前，从队尾删除所有小于或等于新值的候选，使对应值严格递减。
- 相等值保留更新的下标，因为它能在窗口中存活更久。
- `k=1` 时输出应等于原序列；`k=n` 时只输出全局最大值。

标准输入均满足题面列出的数据约束。调试日志必须写入标准错误，标准输出只保留判题结果。

## 如何验证

```powershell
# 已进入本 Lab 目录
make doctor
make run
make run CASE=001-sample
make interactive
make score
```

Windows 没有安装 Make 时，在仓库根目录运行：

```powershell
pnpm lab:doctor -- labs/chapter-02/lab-02-13-sliding-window-maximum
pnpm lab:run -- labs/chapter-02/lab-02-13-sliding-window-maximum
pnpm lab:run -- labs/chapter-02/lab-02-13-sliding-window-maximum --case 001-sample
pnpm lab:score -- labs/chapter-02/lab-02-13-sliding-window-maximum
```

`make run` 用于查看各用例；`make score` 只有 100 分才返回成功。样例采用精确输出比较；`008-scale` 使用五万个元素和宽窗口，使逐窗口扫描或排序的实现难以在时限内完成。

- [ ] `k=1`、`k=n`、重复最大值、递增和递减序列均通过
- [ ] 队头始终位于当前窗口，候选值严格递减
- [ ] 相等值保留更新下标
- [ ] 能用每个下标至多进队、出队各一次证明 `O(n)`

## 思考与复盘

1. 为什么只保存数值无法判断队头是否已经离开窗口？
2. 遇到相等值时，为什么删除旧下标、保留新下标更简单？
3. 若改为求窗口最小值，队尾的比较条件应如何改变？

## 题解

<details>
<summary>点击查看题解</summary>

### 思路与不变量

维护候选下标双端队列，并始终满足：下标从队头到队尾递增，对应值严格递减，所有下标都位于当前窗口内。因此队头对应值就是窗口最大值。

处理下标 `i` 时，先从队头删除已经离开窗口的下标，再从队尾删除值小于或等于 `values[i]` 的候选，最后把 `i` 入队。

### 复杂度分析

- 时间复杂度：`O(n)`；每个下标入队一次，至多从一端出队一次；
- 额外空间：`O(k)`。

### 边界注意

- 过期条件可写为 `front + k <= i`；
- 删除小于或等于新值的旧候选，可以让队列中的值严格递减；
- 必须保存下标，才能判断候选是否离开窗口。

</details>
<details>
<summary>点击查看参考代码</summary>

```cpp
#include <cstddef>
#include <cstdint>
#include <deque>
#include <iostream>
#include <vector>

std::vector<std::int64_t> slidingWindowMaximum(
    const std::vector<std::int64_t>& values,
    std::size_t windowSize) {
    std::deque<std::size_t> candidates;
    std::vector<std::int64_t> answers;
    answers.reserve(values.size() - windowSize + 1);

    for (std::size_t i = 0; i < values.size(); ++i) {
        while (!candidates.empty() && candidates.front() + windowSize <= i) {
            candidates.pop_front();
        }
        while (!candidates.empty() && values[candidates.back()] <= values[i]) {
            candidates.pop_back();
        }
        candidates.push_back(i);

        if (i + 1 >= windowSize) {
            answers.push_back(values[candidates.front()]);
        }
    }

    return answers;
}

int main() {
    std::size_t n = 0;
    std::size_t windowSize = 0;
    std::cin >> n >> windowSize;

    std::vector<std::int64_t> values(n);
    for (std::int64_t& value : values) {
        std::cin >> value;
    }

    const std::vector<std::int64_t> answers = slidingWindowMaximum(values, windowSize);
    for (std::size_t i = 0; i < answers.size(); ++i) {
        if (i != 0) {
            std::cout << ' ';
        }
        std::cout << answers[i];
    }
    std::cout << '\n';
}
```

</details>
