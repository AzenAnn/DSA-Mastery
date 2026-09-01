---
title: "Lab 02-E-07：滑动窗口最大值"
description: "使用单调队列在线性时间内求出每个固定长度窗口的最大值。"
order: 9
chapter: 2
labId: "02E07"
chapterTitle: "栈与队列"
updated: "2026-08-21"
contributors: ["DSA Mastery Team"]
status: "draft"
lab: true
difficulty: "进阶"
duration: "45～60 分钟"
---

# Lab 02-E-07：滑动窗口最大值

> 题目来源：改编自 [LeetCode 239：滑动窗口最大值](https://leetcode.cn/problems/sliding-window-maximum/)。本 Lab 使用课程自定义输入输出协议和独立测试，不复制来源站点的代码或测试。

## 学习目标

- 使用双端队列同时维护窗口有效范围和最大值候选。
- 建立“下标递增、对应值严格递减”的单调队列不变量。
- 证明每个下标最多从队尾删除一次、从队头过期一次，因此总时间为 `O(n)`。

## 前置知识

建议先学习[第 2.2 节队列](../../../../content/chapter-02-stack-queue/02-queue.md)和[第 2.3 节的单调候选思想](../../../../content/chapter-02-stack-queue/03-applications.md#单调栈下一个更大元素)。实现使用 ISO C++17；开始前可运行 `make doctor` 检查环境。

## 题目

给定一个长度为 `n` 的整数序列 `nums`，以及一个长度为 `k` 的滑动窗口。窗口最开始覆盖 `nums[0..k-1]`，之后每次向右移动一个位置，直到覆盖序列末尾。

对于窗口经过的每一个位置，输出当前窗口中的最大元素。长度为 `n` 的序列一共会产生 `n-k+1` 个窗口，因此也应产生 `n-k+1` 个答案。

要求使用单调双端队列在 `O(n)` 时间内完成。不得对每个窗口重新扫描全部 `k` 个元素，也不得反复排序窗口内容。

## 输入格式

- 第一行：两个整数 `n` 和 `k`，分别表示序列长度和窗口长度；
- 第二行：`n` 个整数 `nums[0] ... nums[n-1]`。

## 输出格式

输出一行 `n-k+1` 个整数。第 `i` 个答案是窗口 `nums[i..i+k-1]` 中的最大值。

## 数据范围与限制

| 项目 | 范围或要求 |
| --- | --- |
| 序列长度 `n` | `1 ≤ n ≤ 200000` |
| 窗口长度 `k` | `1 ≤ k ≤ n` |
| 元素值 | `-10^9 ≤ nums[i] ≤ 10^9` |
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

窗口长度为 3，各窗口及其最大值如下：

| 窗口范围 | 窗口内容 | 最大值 |
| --- | --- | ---: |
| `nums[0..2]` | `[1, 3, -1]` | 3 |
| `nums[1..3]` | `[3, -1, -3]` | 3 |
| `nums[2..4]` | `[-1, -3, 5]` | 5 |
| `nums[3..5]` | `[-3, 5, 3]` | 5 |
| `nums[4..6]` | `[5, 3, 6]` | 6 |
| `nums[5..7]` | `[3, 6, 7]` | 7 |

为了避免重复扫描，双端队列保存“仍可能成为当前或后续窗口最大值”的元素下标。下标从队头到队尾递增，对应的元素值严格递减，因此队头始终是当前窗口最大值的下标。

处理前五个元素时，候选变化如下：

| 下标 `i` | 新值 | 候选下标（队头 → 队尾） | 本轮输出 |
| ---: | ---: | --- | ---: |
| 0 | 1 | `[0]` | — |
| 1 | 3 | `[1]` | — |
| 2 | -1 | `[1, 2]` | 3 |
| 3 | -3 | `[1, 2, 3]` | 3 |
| 4 | 5 | `[4]` | 5 |

值 `5` 到来时，下标 `2、3` 对应的较小值不可能再成为后续窗口最大值，下标 `1` 也已经离开新窗口，所以候选最终只剩下 `[4]`。

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
pnpm lab:doctor -- labs/chapter-02/exercise/E-02-07-sliding-window-maximum
pnpm lab:run -- labs/chapter-02/exercise/E-02-07-sliding-window-maximum
pnpm lab:run -- labs/chapter-02/exercise/E-02-07-sliding-window-maximum --case 001-sample
pnpm lab:score -- labs/chapter-02/exercise/E-02-07-sliding-window-maximum
```

`make run` 用于查看各用例；`make score` 只有 100 分才返回成功。样例采用精确输出比较；`008-scale` 使用两千个元素和宽窗口，回归候选过期、重复淘汰与连续输出。线性复杂度要求仍需结合实现分析判断，不依赖易受机器性能影响的极限超时。

- [ ] `k=1`、`k=n`、重复最大值、递增和递减序列均通过
- [ ] 队头始终位于当前窗口，候选值严格递减
- [ ] 相等值保留更新下标
- [ ] 能用每个下标至多进队、出队各一次证明 `O(n)`

## 思考与复盘

1. 为什么只保存数值无法判断队头是否已经离开窗口？
2. 遇到相等值时，为什么删除旧下标、保留新下标更简单？
3. 若改为求窗口最小值，队尾的比较条件应如何改变？

<details>
<summary>查看参考答案</summary>

1. **窗口过期由位置决定，而不是由数值决定。** 处理下标 `i` 时，需要删除所有小于 `i-k+1` 的候选。若队列只保存数值，就不知道某个值来自哪个下标；存在重复值时甚至无法判断过期的是哪一次出现。保存下标后，既能检查是否过期，也能通过 `nums[index]` 取得候选值。
2. **相等时新下标不会比旧下标更差。** 两者数值相同，但新下标进入窗口更晚，也会更晚过期；只要新下标仍在窗口内，旧下标就不可能提供更大的答案或更长的有效期。因此删除旧下标、保留新下标可以消除重复候选，并让队列中的对应值保持严格递减。
3. **把单调方向反过来。** 求窗口最小值时，队列中的对应值应从队头到队尾严格递增；插入新值前，从队尾删除所有大于或等于新值的候选。队头过期规则不变，处理完成后队头就是当前窗口最小值的下标。

</details>

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
