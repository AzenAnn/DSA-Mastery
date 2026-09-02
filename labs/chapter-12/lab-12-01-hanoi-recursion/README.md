---
title: "Lab 12-01：汉诺塔递归演示"
description: "用递归输出移动序列，理解分治框架和递归深度。"
order: 1
chapter: 12
chapterTitle: "分治与递归"
updated: "2026-09-02"
contributors: ["DSA Mastery Team"]
status: "draft"
difficulty: "基础"
duration: "25～35 分钟"
lab: true
---

# Lab 12-01：汉诺塔递归演示

## 题目

给定 `n`（圆盘数，`1 <= n <= 15`），输出标准汉诺塔将所有圆盘从柱子 `A` 移到柱子 `C` 的最小移动序列。

- 柱子编号固定为 `A`、`B`、`C`；
- 每次只能移动一个圆盘；
- 小盘子必须始终在大盘子上方。

## 输入格式

一个整数 `n`。

## 输出格式

- 第一行输出最小步数；
- 后续每一行输出一步：`disk x: from->to`（x 为圆盘编号，1 为最小盘，n 为最大盘）；
- 每一行一个移动；若有额外空格将视为格式错误。

## 数据范围

| 项目 | 约束 |
| --- | --- |
| `n` | `1 ≤ n ≤ 15` |

## 示例

### 输入 1

```input
2
```

### 输出 1

```output
3
disk 1: A->B
disk 2: A->C
disk 1: B->C
```

## 评分点

- 0～3 分：正确处理边界（n=1）；
- 4～30 分：递归基准条件正确；
- 31～60 分：递归过程正确，步数和输出完全一致；
- 61～100 分：算法与题意一致，格式严格，边界稳定。

## 验证命令

```powershell
make doctor
make run
make run CASE=001-sample
make score
```

未装 `make` 时使用：

```powershell
pnpm lab:doctor -- labs/chapter-12/lab-12-01-hanoi-recursion
pnpm lab:run -- labs/chapter-12/lab-12-01-hanoi-recursion
pnpm lab:score -- labs/chapter-12/lab-12-01-hanoi-recursion
```

`make run` 仅做行为验证，`make score` 为严格评分标准；标准输出必须严格匹配期望。

## 思考题

1. 为什么步数是 `2^n - 1`？
2. 如果约束改成“每次可移动任意两个盘子”，递归步骤会如何变化？
