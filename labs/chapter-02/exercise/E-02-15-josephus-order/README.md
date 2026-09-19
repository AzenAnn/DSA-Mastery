---
title: "Lab 02-E-15：Josephus 出列顺序"
description: "用循环队列模拟报数与出列。"
order: 26
chapter: 2
labId: "02E15"
chapterTitle: "栈与队列"
updated: "2026-09-11"
contributors: ["DSA Mastery Team"]
status: "draft"
lab: true
difficulty: "基础"
duration: "35～50 分钟"
---

# Lab 02-E-15：Josephus 出列顺序

## 学习目标

- 用队列轮转模拟循环报数，输出完整出列顺序。
- 明确每轮从当前队头报 1，出列后从下一人重新报 1。
- 分析队列轮转的最坏时间与空间。

## 前置知识与环境

建议先学习[第 2 章栈与队列](../../../../content/chapter-02-stack-queue/00-overview.md)。使用 ISO C++17；开始前可在本目录运行 `make doctor`。

## 任务

编号 `1..n` 的人按编号围成一圈，最初从编号 1 开始报 1；报到 `k` 的人出列，下一轮从刚出列者之后尚在圈中的人重新报 1。每轮可把前 `k-1` 人依次从队头转至队尾，再让队头出列。

## 输入格式

一行两个正整数 `n k`，报数步长为 `k`。

## 输出格式

输出完整出列顺序，各编号以空格分隔，末尾换行。例如 `7 3` 的顺序为 `3 6 2 7 5 1 4`；`k=1` 时顺序为 `1..n`。

## 数据范围与限制

- 除题面另有说明外整数使用 64 位有符号范围。
- `1 <= n <= 5000` 且 `1 <= k <= 5000`；报数从当前队头开始，数到 `k` 的元素出列，下一轮从其后一个元素继续。
- 本题的循环队列模拟允许 `O(nk)` 最坏时间，辅助空间为 `O(n)`。
- 标准输出只保留题目要求的结果；调试信息写入标准错误。
- 目标算法应符合本题给出的 `O(nk)` 循环队列模拟要求。

## 边界与验收重点

- 单人、`k=1`、`k=n` 和 `k>n`。
- 每次出列后队头必须是刚出列者之后的下一位存活者。
- 本题输出完整过程，不只输出最终幸存者。

## 如何验证

```powershell
make doctor
make run
make score
```

未安装 Make 时，在仓库根目录运行：

```powershell
pnpm lab:validate -- labs/chapter-02/exercise/E-02-15-josephus-order
pnpm lab:run -- labs/chapter-02/exercise/E-02-15-josephus-order
pnpm lab:score -- labs/chapter-02/exercise/E-02-15-josephus-order
```

- [ ] 全部 20 个公开测试通过。
- [ ] 能手算 `7 3` 的前两轮 `3、6`。
- [ ] 能解释轮转实现的 `O(nk)` 时间和 `O(n)` 空间。

## 思考与复盘

1. 为什么 `k=1` 时不需要轮转队列？
2. 若每轮都从编号 1 重新开始，会在哪一步与样例不同？

<details><summary>思考题参考</summary>

1. 当前队头就是本轮报 1 的人，应立即出列。
2. 编号 3 出列后应从 4 报 1，下一位出列者是 6，而不是重新从 1 计数。

</details>
