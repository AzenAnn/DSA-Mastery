---
title: "Lab 12-E-09：Construct Quad Tree"
description: "递归压缩二值网格，并用规范前序序列稳定表达树结构。"
order: 9
chapter: 12
labId: "12E09"
chapterTitle: "分治与递归"
updated: "2026-09-04"
contributors: ["Azen"]
status: "draft"
lab: true
difficulty: "进阶"
duration: "65～85 分钟"
---

# Lab 12-E-09：Construct Quad Tree

## 学习目标

- [ ] 能写清递归函数的输入、返回值、边界条件与规模递减方式。
- [ ] 能识别本题的拆分与合并阶段，并独立完成 C++17 实现。
- [ ] 能用边界或反例解释「本地输出不是 LeetCode 的数组序列化；必须遵守课程定义的 token 与子树顺序。」。

## 前置知识与环境

先阅读 [第 12 章对应小节](../../../../content/chapter-12-divide-conquer-recursion/04-combine-patterns.md)，并确保本机可使用 C++17。首次运行可执行 `make doctor`；Windows 未安装 Make 时可在仓库根使用 pnpm 命令。

## 题目

把 `n×n` 的 0/1 网格构造成四叉树：区域全相同则成为叶结点，否则分成四个象限。

### 输入格式

第一行 `n`，随后 n 行各 n 个 0/1。n 是 2 的幂。

### 输出格式

输出规范前序 token：叶子为 `L0` 或 `L1`，内部结点为 `I`，子树顺序固定为左上、右上、左下、右下，token 以空格分隔。

### 数据范围

`1 ≤ n ≤ 64`。

### 样例输入

```text
2
1 1
1 0
```

### 样例输出

```text
I L1 L1 L1 L0
```

## 递归契约卡

| 问题 | 本题答案 |
| --- | --- |
| 子问题契约 | `build(row,col,size)` 返回恰好表示该正方形区域的最简四叉树。 |
| Divide | 若区域不统一，按左上、右上、左下、右下分成四块。 |
| Conquer | 对规模严格更小的子问题递归求解；达到最小规模时直接返回。 |
| Combine | 创建内部结点并按固定顺序挂接四棵子树。 |
| 终止性检查 | 每次递归都缩短区间、减小规模或把下标映射到更短的一层。 |

::: pitfall 易错点
本地输出不是 LeetCode 的数组序列化；必须遵守课程定义的 token 与子树顺序。
:::

## 复杂度目标

朴素均匀性检查最坏 `O(n² log n)`，空间为树结点与递归栈。

## 测试设计提示

公开测试共 20 组、每组 5 分，总分 100 分。它们覆盖样例、最小规模、边界值、重复值、负数或极值、典型回归输入和适度压力数据。测试只读取标准输出；调试信息请写到标准错误。

## 运行与评分

```powershell
cd labs/chapter-12/exercise/E-12-09-construct-quad-tree
make run

# 没有 Make 时，在仓库根执行
pnpm lab:run -- labs/chapter-12/exercise/E-12-09-construct-quad-tree

# 作者与 CI 的严格检查
pnpm lab:verify -- labs/chapter-12/exercise/E-12-09-construct-quad-tree
```

## 完成清单

- [ ] `student/main.cpp` 已替换占位逻辑，并能通过编译。
- [ ] 20 个公开测试全部通过，严格评分为 100/100。
- [ ] 能口头说明递归契约、基本情况、规模递减与合并不变量。
- [ ] 主动构造了至少一个会击穿常见错误的额外输入。

## 思考与复盘

1. 如果把子问题契约改成另一种区间语义，边界和合并会怎样变化？
2. 哪个最小反例最容易暴露「本地输出不是 LeetCode 的数组序列化；必须遵守课程定义的 token 与子树顺序。」？
3. 递归调用栈保存了哪些信息？能否安全改写成迭代？

## 题目来源与课程化说明

核心问题参考 [LeetCode 427](https://leetcode.cn/problems/construct-quad-tree/)。本 Lab 为统一的标准输入/输出环境重新表述题面，并独立编写参考实现与测试数据；不复制第三方题解、代码或隐藏测试。若本地输出合同与原平台不同，以上“输出格式”和“递归契约卡”是本 Lab 的判定依据。
