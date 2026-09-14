---
title: "Lab 04-E-01：多叉树孩子兄弟表示法：叶子节点统计"
description: "区分孩子与兄弟链接，用一次遍历统计一般树的叶子。"
order: 9
chapter: 4
labId: "04E01"
chapterTitle: "树与二叉树"
updated: "2026-09-11"
contributors: ["Azen"]
status: "draft"
lab: true
difficulty: "基础"
duration: "45～60 分钟"
---

# Lab 04-E-01：多叉树孩子兄弟表示法：叶子节点统计

## 学习目标

- [ ] 区分孩子与兄弟链接，用一次遍历统计一般树的叶子。
- [ ] 独立完成给定函数，并解释时间与辅助空间复杂度。
- [ ] 通过 20 个测试点，能说明典型错误在哪个边界失效。

## 前置知识与环境

先学习 [4.1 对应内容](/learn/chapter-04-tree/01-tree-basics/)。需要 C++17、Node.js 22.13+ 与 pnpm；Make 可选。输入读取、节点分配和结果输出已在本题 support 目录中提供。

## 任务

给定一棵有序多叉树的孩子兄弟链表，统计叶子节点的个数。没有孩子的节点就是叶子，即 `firstChild == nullptr`；它可以有兄弟。空树的答案为 0。

### 待实现接口

在 `student/main.cpp` 中实现：

```cpp
int countLeaves(const Node* root);
```

节点类型 `Node` 含 `int id`、`Node* firstChild` 和 `Node* nextSibling`，函数只读取原树。 类型完整定义见 `support/tree.hpp`，固定驱动见 `support/runner.cpp`。无需自行编写 main 或修改驱动。

### 输入格式

第一行 `n root`。随后按节点编号 1..n 输入 n 行，每行 `firstChild nextSibling`。它们分别表示首孩子和下一兄弟的编号。输入表示**一棵**一般树，非空根的 nextSibling 必须为 0。空树只输入 `0 0`。

### 输出格式

输出一个整数，表示叶子总数。

### 数据范围与约定

0 ≤ n ≤ 10000。节点编号唯一且为 1..n，0 只表示空指针；所有非零引用都在合法范围内。输入保证有序、无环、无共享节点，且给定结构覆盖全部 n 个节点。n=0 时 root=0；非空时根可以不是 1，编号不代表遍历顺序。不要求处理非法输入。

![样例一般树及其孩子兄弟链接](./assets/structure.png)

图中数字为节点编号，左侧是原有序树，右侧实线表示首孩子、虚线表示下一兄弟。

## 样例

### 样例 1

输入：

```text
7 1
2 0
5 3
0 4
7 0
0 6
0 0
0 0
```

输出：

```text
4
```

节点 5、6、3、7 没有孩子，因此输出 4；其中 5 和 3 的兄弟指针并不为空。

### 样例 2：空结构

输入：

```text
0 0
```

输出：

```text
0
```

空结构按本题约定处理。

### 样例 3：单节点

输入：

```text
1 1
0 0
```

输出：

```text
1
```

唯一节点没有孩子，叶子数为 1。

## 运行与评分

在仓库根目录执行：

```powershell
pnpm lab:doctor -- labs/chapter-04/exercise/E-04-01-lcrs-leaf-count
pnpm lab:run -- labs/chapter-04/exercise/E-04-01-lcrs-leaf-count --case 001-sample
pnpm lab:score -- labs/chapter-04/exercise/E-04-01-lcrs-leaf-count
pnpm lab:run -- labs/chapter-04/exercise/E-04-01-lcrs-leaf-count --target solution --case 001-sample
pnpm lab:verify -- labs/chapter-04/exercise/E-04-01-lcrs-leaf-count
```

也可以进入本 Lab 目录运行 `make doctor`、`make run`、`make score`、`make verify`。每题 20 点，每点 5 分，总分 100。学生骨架可编译，但初始并未完成算法。

## 测试覆盖

20 点包含样例、空结构、单节点、固定种子随机及规模边界。星形树检查有兄弟的叶子仍被计入；梳状、乱序编号和非 1 根检查完整遍历。 用例清单位于 `tests/cases.json`，输入和标准输出成对存放。所有输入均合法，不以未定义的错误输入作为测试。

黑盒测试检查输出正确性；复杂度和接口约束还需结合源码检查。

::: details 参考思路、正确性与复杂度

从根开始遍历。弹出一个节点时，若没有首孩子便计数；随后沿首孩子的兄弟链枚举它的所有孩子并压栈。每个非根节点只会由唯一父节点加入一次，所以所有节点恰好被检查一次，计数条件也恰好等价于一般树叶子定义。

**复杂度：** 时间 O(n)，辅助空间最坏 O(n)。星形树可能一次压入全部孩子，不能将此版本写成 O(一般树高度)。 以上只分析待实现函数，输入存储和固定驱动的打印缓冲另计。

**常见错误：** 同时检查 `firstChild` 和 `nextSibling` 是否为空，会漏掉有兄弟的叶子。

参考实现：

<<< ./solution/main.cpp{cpp}

:::

## 完成清单

- [ ] 函数签名和输入输出协议与题面一致。
- [ ] 20 个测试点全部通过，深链与规模边界无崩溃。
- [ ] 能解释至少一种错误写法及其反例。
- [ ] 时间、辅助空间与结果存储分别说明。

## 思考与复盘

能否用“循环枚举兄弟，只为孩子保留调用帧”的方法，把辅助空间限制为 O(h+1)？

## 题源

本章教材自编训练题，考查 4.1 的多叉树孩子兄弟表示法：叶子节点统计。接口、样例与测试由本仓库编写。
