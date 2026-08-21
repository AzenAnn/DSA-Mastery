---
title: "Lab 02-06：最近请求计数器"
description: "使用队列维护递增时间流中的滑动窗口，计算最近 3000 时间单位内的请求数量。"
order: 6
chapter: 2
chapterTitle: "栈与队列"
updated: "2026-08-21"
contributors: ["DSA Mastery Team"]
status: "draft"
lab: true
difficulty: "基础"
duration: "30～45 分钟"
---

# Lab 02-06：最近请求计数器

> 题目来源：改编自 [LeetCode 933：最近的请求次数](https://leetcode.cn/problems/number-of-recent-calls/)。本 Lab 使用课程自定义输入输出协议和独立测试，不复制来源站点的代码或测试。

## 学习目标

- 用队尾接收新请求并从队头淘汰过期请求。
- 正确处理闭区间左端点 t-3000。
- 说明每个请求最多入队和出队一次，因此单次操作摊还 O(1)。

## 前置知识

建议先学习[第 2.2 节队列](../../../content/chapter-02-stack-queue/02-queue.md)。实现使用 ISO C++17；开始前可运行 `make doctor` 检查环境。

## 题目

时间戳严格递增。每读取一个新请求时间 `t`，把它加入队列，移除所有早于 `t-3000` 的时间戳，再报告闭区间 `[t-3000, t]` 中的请求数。

## 输入格式

- 第一行：请求数 `n`；
- 第二行：`n` 个严格递增的 64 位整数时间戳。

## 输出格式

一行 `n` 个整数，第 `i` 个整数是处理第 `i` 个请求后窗口中的请求数量。

## 数据范围与限制

| 项目 | 范围或要求 |
| --- | --- |
| 请求数 `n` | `1 ≤ n ≤ 200000` |
| 时间戳 `t` | `0 ≤ t ≤ 10^15`，严格递增 |
| 有效窗口 | 闭区间 `[t-3000, t]` |
| 总时间复杂度要求 | `O(n)` |
| 额外空间限制 | 最坏 `O(n)` |

## 样例

```input
4
1 100 3001 3002
```

```output
1 2 3 3
```

### 样例解释

| 当前时间 `t` | 淘汰后队列 | 窗口内请求数 |
| ---: | --- | ---: |
| 1 | `[1]` | 1 |
| 100 | `[1, 100]` | 2 |
| 3001 | `[1, 100, 3001]` | 3 |
| 3002 | `[100, 3001, 3002]` | 3 |

当 `t = 3001` 时，左端点是 `1`，时间 `1` 仍在闭区间中；到 `t = 3002` 时它才过期。

## 边界与验收重点

- 恰好位于 t-3000 的请求仍有效。
- 相邻请求间隔大于 3000 时队列只剩新请求。
- 使用 64 位时间戳避免大值溢出。

标准输入均满足题面列出的命令和数据约束。除题面明确规定的失败操作外，不需要为未知命令设计行为。调试日志必须写入标准错误，标准输出只保留判题结果。

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
pnpm lab:doctor -- labs/chapter-02/lab-02-06-recent-counter
pnpm lab:run -- labs/chapter-02/lab-02-06-recent-counter
pnpm lab:run -- labs/chapter-02/lab-02-06-recent-counter --case 001-sample
pnpm lab:score -- labs/chapter-02/lab-02-06-recent-counter
```

`make run` 用于查看各用例；`make score` 只有得到 100 分才返回成功。样例采用精确输出比较；`006-scale` 使用五万个密集时间戳，避免每次重新扫描全部历史请求的低效实现获得满分。

- [ ] 正确保留恰好位于 `t-3000` 的请求
- [ ] 稀疏、密集及大时间戳情况全部通过
- [ ] 队列中不存在已经过期的时间戳
- [ ] 能用每个请求至多入队、出队各一次证明总时间 `O(n)`

## 思考与复盘

1. 为什么淘汰条件是 `< t-3000` 而不是 `≤ t-3000`？
2. 一次请求中可能弹出很多元素，为什么仍可称为摊还 `O(1)`？

## 题解

<details>
<summary>点击查看题解</summary>

### 思路与不变量

时间戳严格递增，因此队列也按时间递增。处理新时间 `t` 时先把它加入队尾，再从队头删除所有小于 `t-3000` 的时间戳。

清理结束后，队列恰好保存 `[t-3000, t]` 内的全部请求，所以队列长度就是答案。

### 复杂度分析

- 总时间复杂度：`O(n)`；每个时间戳只入队一次、至多出队一次；
- 单次请求摊还 `O(1)`，最坏单次可能弹出多个旧请求；
- 额外空间：最坏 `O(n)`。

### 边界注意

- 窗口是闭区间，只有 `< t-3000` 才过期；
- 时间戳和减法都应使用 64 位整数；
- 严格递增保证过期元素只可能出现在队头。

</details>
<details>
<summary>点击查看参考代码</summary>

```cpp
#include <cstddef>
#include <iostream>
#include <queue>

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    std::size_t n = 0;
    if (!(std::cin >> n)) return 0;

    std::queue<long long> requests;
    for (std::size_t i = 0; i < n; ++i) {
        long long time = 0;
        std::cin >> time;
        requests.push(time);
        while (!requests.empty() && requests.front() < time - 3000) requests.pop();
        if (i > 0) std::cout << ' ';
        std::cout << requests.size();
    }
    std::cout << '\n';
}
```

</details>
