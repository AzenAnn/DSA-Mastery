---
title: "Lab 04-E-06：左叶子之和"
description: "结合父子方向与叶子判定，计算可能包含负数的左叶子和。"
order: 14
chapter: 4
labId: "04E06"
chapterTitle: "树与二叉树"
updated: "2026-09-11"
contributors: ["Azen"]
status: "draft"
lab: true
difficulty: "基础"
duration: "45～60 分钟"
---

# Lab 04-E-06：左叶子之和

## 学习目标

- [ ] 结合父子方向与叶子判定，计算可能包含负数的左叶子和。
- [ ] 独立完成给定函数，并解释时间与辅助空间复杂度。
- [ ] 通过 20 个测试点，能说明典型错误在哪个边界失效。

## 前置知识与环境

先学习 [4.2 对应内容](/learn/chapter-04-tree/02-binary-tree/)。需要 C++17、Node.js 22.13+ 与 pnpm；Make 可选。输入读取、节点分配和结果输出已在本题 support 目录中提供。

## 任务

返回所有左叶子节点值之和。左叶子必须是某个节点的左孩子，并且自身没有任何孩子。根节点即使单独成树也不是左叶子；左子树中的所有叶子并不一定都是左叶子。空树结果为 0。

### 待实现接口

在 `student/main.cpp` 中实现：

```cpp
long long sumOfLeftLeaves(const TreeNode* root);
```

节点类型 `TreeNode` 含 `long long val` 和左右指针；内存由 `Tree` 的节点池管理。 类型完整定义见 `support/tree.hpp`，固定驱动见 `support/runner.cpp`。无需自行编写 main 或修改驱动。

### 输入格式

输入一行，表示一棵树。每行是空格分隔的层序 token，整数表示节点值，`null` 表示缺失孩子，不带方括号或逗号。按队列依次为每个**非空节点**读取左右孩子，空占位本身不再读取孩子；末尾缺失的孩子可以省略。例如 `1 null 2 3` 表示 1 的右孩子为 2，2 的左孩子为 3。空树必须显式写 `null`。

### 输出格式

输出一个整数，表示左叶子值的总和。

### 数据范围与约定

每棵输入树 0 ≤ n ≤ 10000，节点值在 [-10^9, 10^9] 内。输入保证为合法二叉树，不存在环、共享节点或多余 token。每行对应一次树读取，不跨行拼接。

## 样例

### 样例 1

输入：

```text
3 9 20 null null 15 7
```

输出：

```text
24
```

9 和 15 是左叶子，7 是右叶子；答案为 9+15=24。

### 样例 2：空结构

输入：

```text
null
```

输出：

```text
0
```

空结构按本题约定处理。

### 样例 3：单节点

输入：

```text
-7
```

输出：

```text
0
```

根节点不是左叶子，因此总和为 0。

## 运行与评分

在仓库根目录执行：

```powershell
pnpm lab:doctor -- labs/chapter-04/exercise/E-04-06-sum-of-left-leaves
pnpm lab:run -- labs/chapter-04/exercise/E-04-06-sum-of-left-leaves --case 001-sample
pnpm lab:score -- labs/chapter-04/exercise/E-04-06-sum-of-left-leaves
pnpm lab:run -- labs/chapter-04/exercise/E-04-06-sum-of-left-leaves --target solution --case 001-sample
pnpm lab:verify -- labs/chapter-04/exercise/E-04-06-sum-of-left-leaves
```

也可以进入本 Lab 目录运行 `make doctor`、`make run`、`make score`、`make verify`。每题 20 点，每点 5 分，总分 100。学生骨架可编译，但初始并未完成算法。

## 测试覆盖

20 点包含样例、空结构、单节点、固定种子随机及规模边界。根叶子、左右链、右子树内的左叶子和左内部节点检查方向与叶子条件；宽层大值检查 64 位求和。 用例清单位于 `tests/cases.json`，输入和标准输出成对存放。所有输入均合法，不以未定义的错误输入作为测试。

黑盒测试检查输出正确性；复杂度和接口约束还需结合源码检查。

::: details 参考思路、正确性与复杂度

遍历每个父节点，检查其左孩子是否为叶子，满足则把值加入答案。左孩子不是叶子时继续向下，右孩子也继续遍历，以发现位于右子树中的左叶子。每片左叶子有且仅有一个父节点，因而恰好被加一次。

**复杂度：** 时间 O(n)，辅助空间 O(h+1)，h 为二叉树高度；求和使用 long long。 以上只分析待实现函数，输入存储和固定驱动的打印缓冲另计。

**常见错误：** 只遍历根的左子树会漏掉右子树内的左叶子；把所有左孩子相加会误计内部节点。

参考实现：

<<< ./solution/main.cpp{cpp}

:::

## 完成清单

- [ ] 函数签名和输入输出协议与题面一致。
- [ ] 20 个测试点全部通过，深链与规模边界无崩溃。
- [ ] 能解释至少一种错误写法及其反例。
- [ ] 时间、辅助空间与结果存储分别说明。

## 思考与复盘

怎样用携带“是否来自左边”的 DFS 状态得到同样结果？

## 题源

题意据 [LeetCode 404](https://leetcode.cn/problems/sum-of-left-leaves/) 整理。本 Lab 按用户 Ch4 题集约定补全 C++17 函数接口、输入协议和规模范围。
