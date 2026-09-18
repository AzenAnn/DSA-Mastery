---
title: "Lab 02-E-12：循环数组下一个更大元素"
description: "练习循环数组下一个更大元素，强化栈与队列的不变量、边界和复杂度。"
order: 19
chapter: 2
labId: "02E12"
chapterTitle: "栈与队列"
updated: "2026-09-16"
contributors: ["DSA Mastery Team"]
status: "draft"
lab: true
difficulty: "基础"
duration: "45～60 分钟"
---

# Lab 02-E-12：循环数组下一个更大元素

## 学习目标

掌握循环数组下一个更大元素的栈/队列建模，明确空、满、重复、循环或不可达边界，并能说明时间与空间复杂度。

## 前置知识

建议先阅读[栈](../../../../content/chapter-02-stack-queue/01-stack.md)、[队列](../../../../content/chapter-02-stack-queue/02-queue.md)和[栈与队列应用](../../../../content/chapter-02-stack-queue/03-applications.md)。实现使用 ISO C++17。

## 题目与输入输出

请完成“循环数组下一个更大元素”。第一行 n，第二行数组；对每项找右侧循环第一个严格更大值，无则 -1。 输出只保留题目要求的结果，调试信息写入标准错误。

## 数据范围与复杂度

规模不超过 200000，数值使用 64 位整数；按题面要求使用线性或允许的摊还复杂度，额外空间不超过输入规模。每个测试点 5 分，共 20 个测试点、100 分。

## 样例输入

```text
3
1 2 1
```

## 样例输出

```text
2 -1 2
```

## 边界与验收重点

- [ ] 空输入、单元素、最小规模和最大值按协议处理；
- [ ] 空/满结构、相等值、重复操作和失败操作不会破坏不变量；
- [ ] 输出顺序、字面量（EMPTY/FULL/-1/0）与协议一致；
- [ ] 能解释每个元素的入栈、出栈、入队和出队次数及复杂度。

## 如何验证

```powershell
pnpm lab:doctor -- labs/chapter-02/exercise/E-02-12-circular-next-greater
pnpm lab:run -- labs/chapter-02/exercise/E-02-12-circular-next-greater
pnpm lab:score -- labs/chapter-02/exercise/E-02-12-circular-next-greater
```

## 思考与复盘

1. 哪个状态量表达了本题的不变量？
2. 哪个边界最容易让错误实现输出看似合理的结果？
3. 如何证明参考算法的复杂度满足限制？

## 题解与参考代码

<details><summary>查看参考思路</summary>

先处理空、满和失败分支，再更新结构；循环扫描或扩散题在入队时标记，表达式题按优先级和操作数顺序处理。约瑟夫轮转按题面规模使用 O(nm)，其余题目可做到 O(n) 或摊还 O(1) 操作。

</details>

<details><summary>查看参考代码</summary>

完整参考实现位于同目录 `solution/main.cpp`，测试期望由独立模型生成。

</details>
