---
title: "Lab 12-E-12：Different Ways to Add Parentheses"
description: "枚举最后执行的运算符，组合左右子表达式的全部结果。"
order: 12
chapter: 12
labId: "12E12"
chapterTitle: "分治与递归"
updated: "2026-09-04"
contributors: ["Azen"]
status: "draft"
lab: true
difficulty: "进阶"
duration: "60～85 分钟"
---

# Lab 12-E-12：Different Ways to Add Parentheses

## 学习目标

- [ ] 能写清递归函数的输入、返回值、边界条件与规模递减方式。
- [ ] 能识别本题的拆分与合并阶段，并独立完成 C++17 实现。
- [ ] 能用边界或反例解释「不能用 set 去重；题目按括号化方式计数，相同数值可能出现多次。」。

## 前置知识与环境

先阅读 [第 12 章对应小节](../../../../content/chapter-12-divide-conquer-recursion/04-combine-patterns.md)，并确保本机可使用 C++17。首次运行可执行 `make doctor`；Windows 未安装 Make 时可在仓库根使用 pnpm 命令。

## 题目

给定由非负整数与 `+`、`-`、`*` 组成的表达式，返回所有不同括号化方式得到的结果。

### 输入格式

一行一个合法表达式。

### 输出格式

把所有结果按非递减顺序输出，空格分隔；重复结果必须保留。

### 数据范围

表达式长度不超过 20，单个数在 `0..99`，结果数量不超过 `10^4`。

### 样例输入

```text
2*3-4*5
```

### 样例输出

```text
-34 -14 -10 -10 10
```

## 递归契约卡

| 问题 | 本题答案 |
| --- | --- |
| 子问题契约 | `solve(l,r)` 返回子串 `[l,r)` 的全部计算结果，包含重复值。 |
| Divide | 枚举每个运算符作为最后一次运算，递归求左右结果集合。 |
| Conquer | 对规模严格更小的子问题递归求解；达到最小规模时直接返回。 |
| Combine | 对左右结果做笛卡尔积并执行当前运算，再汇总所有分割点。 |
| 终止性检查 | 每次递归都缩短区间、减小规模或把下标映射到更短的一层。 |

::: pitfall 易错点
不能用 set 去重；题目按括号化方式计数，相同数值可能出现多次。
:::

## 复杂度目标

输出规模可能呈 Catalan 增长；记忆化避免重复解析同一子串。

## 测试设计提示

公开测试共 20 组、每组 5 分，总分 100 分。它们覆盖样例、最小规模、边界值、重复值、负数或极值、典型回归输入和适度压力数据。测试只读取标准输出；调试信息请写到标准错误。

## 运行与评分

```powershell
cd labs/chapter-12/exercise/E-12-12-different-ways-add-parentheses
make run

# 没有 Make 时，在仓库根执行
pnpm lab:run -- labs/chapter-12/exercise/E-12-12-different-ways-add-parentheses

# 作者与 CI 的严格检查
pnpm lab:verify -- labs/chapter-12/exercise/E-12-12-different-ways-add-parentheses
```

## 完成清单

- [ ] `student/main.cpp` 已替换占位逻辑，并能通过编译。
- [ ] 20 个公开测试全部通过，严格评分为 100/100。
- [ ] 能口头说明递归契约、基本情况、规模递减与合并不变量。
- [ ] 主动构造了至少一个会击穿常见错误的额外输入。

## 思考与复盘

1. 如果把子问题契约改成另一种区间语义，边界和合并会怎样变化？
2. 哪个最小反例最容易暴露「不能用 set 去重；题目按括号化方式计数，相同数值可能出现多次。」？
3. 递归调用栈保存了哪些信息？能否安全改写成迭代？

## 题目来源与课程化说明

核心问题参考 [LeetCode 241](https://leetcode.cn/problems/different-ways-to-add-parentheses/)。本 Lab 为统一的标准输入/输出环境重新表述题面，并独立编写参考实现与测试数据；不复制第三方题解、代码或隐藏测试。若本地输出合同与原平台不同，以上“输出格式”和“递归契约卡”是本 Lab 的判定依据。
