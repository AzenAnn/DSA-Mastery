---
title: "Lab 02-E-12：下一个更大元素"
description: "维护单调递减候选栈，求右侧第一个严格更大值。"
order: 23
chapter: 2
labId: "02E12"
chapterTitle: "栈与队列"
updated: "2026-09-11"
contributors: ["DSA Mastery Team"]
status: "draft"
lab: true
difficulty: "基础"
duration: "35～50 分钟"
---

# Lab 02-E-12：下一个更大元素

## 学习目标

- 用单调栈保存还没有找到右侧严格更大值的位置。
- 区分“更大”和“相等”，并说明不存在答案时的 `-1`。
- 证明每个下标只入栈、出栈各一次。

## 前置知识与环境

建议先学习[第 2 章栈与队列](../../../../content/chapter-02-stack-queue/00-overview.md)。使用 ISO C++17；开始前可在本目录运行 `make doctor`。

## 任务

对每个位置 `i`，只在下标 `j>i` 中找最小的、满足 `a[j]>a[i]` 的 `j`，输出该位置的值 `a[j]`。不循环回数组开头；相等值不算更大。

## 输入格式

第一行 `n`；第二行 `n` 个整数。

## 输出格式

输出每个位置右侧第一个严格更大值；不存在输出 `-1`。各答案以空格分隔，末尾输出换行。例如 `[2,1,2]` 输出 `-1 2 -1`；`n=0` 只输出空行。

## 数据范围与限制

- `0 <= n <= 200000`；当 `n=0` 时第二行为空，输出空行。
- 输入规模不超过 `200000`，除题面另有说明外整数使用 64 位有符号范围。
- 标准输出只保留题目要求的结果；调试信息写入标准错误。
- 目标算法应为线性或摊还线性时间，辅助空间不超过 `O(n)`。

## 边界与验收重点

- 全递增、全递减、相等值和重复的局部峰值。
- 栈内保存下标，以便给之前等待的元素回填答案。
- 右边没有更大值时保留 `-1`；`n=0` 输出空行。

## 如何验证

```powershell
make doctor
make run
make score
```

未安装 Make 时，在仓库根目录运行：

```powershell
pnpm lab validate labs/chapter-02/exercise/E-02-12-next-greater-element
pnpm lab run labs/chapter-02/exercise/E-02-12-next-greater-element
pnpm lab score labs/chapter-02/exercise/E-02-12-next-greater-element
```

- [ ] 全部 20 个公开测试通过。
- [ ] 能手算 `[2,1,2]` 和 `[2,2]`。
- [ ] 能说明时间 `O(n)`、额外空间 `O(n)`。

## 思考与复盘

1. 为什么读到相等值时不能弹出栈顶？
2. 为什么出栈时遇到的当前值一定是该位置右侧第一个严格更大值？

<details><summary>思考题参考</summary>

1. 题目要求严格大于；等于不满足条件，`[2,2]` 两个答案都为 `-1`。
2. 从左到右扫描，在当前元素之前没有任何满足条件的元素触发该下标出栈。

</details>
