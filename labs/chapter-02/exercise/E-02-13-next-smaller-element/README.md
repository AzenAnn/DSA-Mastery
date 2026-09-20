---
title: "Lab 02-E-13：下一个更小元素"
description: "维护单调递增候选栈，求右侧第一个严格更小值。"
order: 24
chapter: 2
labId: "02E13"
chapterTitle: "栈与队列"
updated: "2026-09-11"
contributors: ["DSA Mastery Team"]
status: "draft"
lab: true
difficulty: "基础"
duration: "35～50 分钟"
---

# Lab 02-E-13：下一个更小元素

## 学习目标

- 用单调栈保存尚未找到右侧严格更小值的下标。
- 正确处理相等值与不存在答案的 `-1`。
- 证明线性扫描时每个位置最多入栈、出栈各一次。

## 前置知识与环境

建议先学习[第 2 章栈与队列](../../../../content/chapter-02-stack-queue/00-overview.md)。使用 ISO C++17；开始前可在本目录运行 `make doctor`。

## 任务

对每个位置 `i`，在右侧下标 `j>i` 中找最小的、满足 `a[j]<a[i]` 的 `j`，输出值 `a[j]`。不循环回数组开头；相等值不算更小。

## 输入格式

第一行 `n`；第二行 `n` 个整数。

## 输出格式

输出每个位置右侧第一个严格更小值；不存在输出 `-1`。各答案以空格分隔，末尾换行。例如 `[2,1,2]` 输出 `1 -1 -1`；`n=0` 只输出空行。

## 数据范围与限制

- `0 <= n <= 200000`；当 `n=0` 时第二行为空，输出空行。
- 输入规模不超过 `200000`，除题面另有说明外整数使用 64 位有符号范围。
- 标准输出只保留题目要求的结果；调试信息写入标准错误。
- 目标算法应为线性或摊还线性时间，辅助空间不超过 `O(n)`。

## 边界与验收重点

- 全递减、全递增、等高平台及负数。
- 等于栈顶的值不能触发“严格更小”的结算。
- 未找到答案的下标保持 `-1`；`n=0` 输出空行。

## 如何验证

```powershell
make doctor
make run
make score
```

未安装 Make 时，在仓库根目录运行：

```powershell
pnpm lab validate labs/chapter-02/exercise/E-02-13-next-smaller-element
pnpm lab run labs/chapter-02/exercise/E-02-13-next-smaller-element
pnpm lab score labs/chapter-02/exercise/E-02-13-next-smaller-element
```

- [ ] 全部 20 个公开测试通过。
- [ ] 能手算 `[2,1,2]` 与 `[2,2]`。
- [ ] 能说明时间 `O(n)`、额外空间 `O(n)`。

## 思考与复盘

1. 为什么比较条件必须是 `<`，不能是 `<=`？
2. 为什么扫描结束后栈中剩余位置的答案均为 `-1`？

<details><summary>思考题参考</summary>

1. 相等不是严格更小；`[2,2]` 没有满足条件的右侧元素。
2. 扫描过全部右侧元素后仍未触发出栈，说明不存在严格更小值。

</details>
