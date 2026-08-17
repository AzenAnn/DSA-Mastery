---
title: "Lab 01-03：编程题页面样板"
description: "用一道有序表合并编程题演示学生骨架、参考实现、公开测试、本地评分与统一 Make 工作流。"
order: 3
chapter: 1
chapterTitle: "线性表"
updated: "2026-08-17"
contributors: ["DSA Mastery Team", "Azen"]
status: "draft"
lab: true
difficulty: "入门"
duration: "15～20 分钟"
---

# Lab 01-03：编程题页面样板

本 Lab 是统一 Program 工作流的 Golden 示例。仓库提供可编译但未完成的 `student/main.cpp`、公开测试、参考实现和标准输出；你可以进入本目录后用一条命令编译、运行并看到 `0～100` 分。

## 题目

### 有序表合并

给定两个按**非递减顺序**排列的整数序列 A 和 B，将它们合并成一个新的按非递减顺序排列的序列 C。合并必须**一趟完成**：依次比较 A、B 的当前元素，每次把较小的一个放入 C，直到两个序列都被取完。

### 任务要求

1. 从标准输入读入两个序列 A 和 B；
2. 使用双指针一趟合并，**不允许**把两个序列拼接后整体排序；
3. 将合并结果按非递减顺序输出到标准输出。

## 输入格式

- 第一行：一个整数 `n`，表示序列 A 的长度；
- 第二行：`n` 个整数，表示序列 A，已按非递减顺序排列；
- 第三行：一个整数 `m`，表示序列 B 的长度；
- 第四行：`m` 个整数，表示序列 B，已按非递减顺序排列。

## 输出格式

- 一行 `n + m` 个整数，为合并后的序列，按非递减顺序排列；
- 相邻整数之间用**单个空格**分隔，行末不要有多余空格。

## 数据范围与限制

| 项目 | 范围 |
| --- | --- |
| 序列 A 长度 `n` | 1 ≤ n ≤ 10⁵ |
| 序列 B 长度 `m` | 1 ≤ m ≤ 10⁵ |
| 元素值 | −10⁹ ≤ 元素 ≤ 10⁹ |
| 时间复杂度建议 | O(n + m)，一次遍历完成合并 |

## 样例

### 样例输入

```input
4
1 3 5 7
3
2 4 6
```

### 样例输出

```output
1 2 3 4 5 6 7
```

### 样例解释

用指针 `i`、`j` 分别指向 A、B 的开头，每步取较小的元素放入结果：

| 步数 | 比较 | 放入 C |
| --- | --- | --- |
| 1 | A[0]=1 与 B[0]=2 | 1 |
| 2 | A[1]=3 与 B[0]=2 | 2 |
| 3 | A[1]=3 与 B[1]=4 | 3 |
| 4 | A[2]=5 与 B[1]=4 | 4 |
| 5 | A[2]=5 与 B[2]=6 | 5 |
| 6 | A[3]=7 与 B[2]=6 | 6 |
| 7 | B 已取完，A 剩余 7 | 7 |

当某个序列先取完时，直接把另一个序列的剩余部分依次接上即可。

## 如何验证

先安装 Node.js、pnpm 和支持 C++17 的编译器。GNU Make 是首选入口，但不是强制依赖。

```powershell
# 已进入本 Lab 目录
make doctor
make run
make run CASE=sample
make interactive
make score
```

Windows 没有安装 Make 时，在仓库根目录使用完全相同的评分内核：

```powershell
pnpm lab:doctor -- labs/chapter-01/lab-01-03-problem-template
pnpm lab:run -- labs/chapter-01/lab-01-03-problem-template
pnpm lab:run -- labs/chapter-01/lab-01-03-problem-template --case sample
pnpm lab:score -- labs/chapter-01/lab-01-03-problem-template
```

`make run` 在答案尚未全对时仍正常返回，避免 Make 把学习结果显示成工具故障；`make score` 是严格入口，只有 100 分才返回成功。标准输出参与判题，调试信息请写入标准错误。

- [ ] 样例输入与输出完全一致
- [ ] 四组公开测试均通过并得到 100 分
- [ ] 程序满足 O(n + m) 且未使用拼接后排序
