---
title: "Lab 04-E-04：二叉树的最小深度"
description: "在单侧子树和空树条件下正确识别第一片叶子。"
order: 12
chapter: 4
labId: "04E04"
chapterTitle: "树与二叉树"
updated: "2026-09-11"
contributors: ["Azen"]
status: "draft"
lab: true
difficulty: "基础"
duration: "45～60 分钟"
---

# Lab 04-E-04：二叉树的最小深度

## 学习目标

- [ ] 在单侧子树和空树条件下正确识别第一片叶子。
- [ ] 独立完成给定函数，并解释时间与辅助空间复杂度。
- [ ] 通过 20 个测试点，能说明典型错误在哪个边界失效。

## 前置知识与环境

先学习 [4.2 对应内容](/learn/chapter-04-tree/02-binary-tree/)。需要 C++17、Node.js 22.13+ 与 pnpm；Make 可选。输入读取、节点分配和结果输出已在本题 support 目录中提供。

## 任务

返回从根到最近叶子的最短路径上的节点数。叶子必须同时没有左、右孩子。空树的最小深度为 0，单节点树为 1。这里的深度按节点数计算，与一般树高度题的边数口径不同。

### 待实现接口

在 `student/main.cpp` 中实现：

```cpp
int minDepth(const TreeNode* root);
```

节点类型 `TreeNode` 含 `long long val` 和左右指针；内存由 `Tree` 的节点池管理。 类型完整定义见 `support/tree.hpp`，固定驱动见 `support/runner.cpp`。无需自行编写 main 或修改驱动。

### 输入格式

输入一行，表示一棵树。每行是空格分隔的层序 token，整数表示节点值，`null` 表示缺失孩子，不带方括号或逗号。按队列依次为每个**非空节点**读取左右孩子，空占位本身不再读取孩子；末尾缺失的孩子可以省略。例如 `1 null 2 3` 表示 1 的右孩子为 2，2 的左孩子为 3。空树必须显式写 `null`。

### 输出格式

输出一个整数，表示最小深度。

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
2
```

节点 9 是深度为 2 的叶子，比 15、7 更近，所以答案为 2。

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
1
```

唯一节点即为叶子，最短根叶路径含 1 个节点。

## 运行与评分

在仓库根目录执行：

```powershell
pnpm lab:doctor -- labs/chapter-04/exercise/E-04-04-binary-tree-minimum-depth
pnpm lab:run -- labs/chapter-04/exercise/E-04-04-binary-tree-minimum-depth --case 001-sample
pnpm lab:score -- labs/chapter-04/exercise/E-04-04-binary-tree-minimum-depth
pnpm lab:run -- labs/chapter-04/exercise/E-04-04-binary-tree-minimum-depth --target solution --case 001-sample
pnpm lab:verify -- labs/chapter-04/exercise/E-04-04-binary-tree-minimum-depth
```

也可以进入本 Lab 目录运行 `make doctor`、`make run`、`make score`、`make verify`。每题 20 点，每点 5 分，总分 100。学生骨架可编译，但初始并未完成算法。

## 测试覆盖

20 点包含样例、空结构、单节点、固定种子随机及规模边界。左右单侧、转折单链和深浅不等的分支检查真实叶子；宽树与 10000 节点链检查 BFS 边界。 用例清单位于 `tests/cases.json`，输入和标准输出成对存放。所有输入均合法，不以未定义的错误输入作为测试。

黑盒测试检查输出正确性；复杂度和接口约束还需结合源码检查。

::: details 参考思路、正确性与复杂度

BFS 保存节点及其深度，根深度为 1；第一次遇到真正的叶子便返回。队列按深度非递减访问，所以此时不可能还有更浅的未访问叶子。只把真实孩子加入队列，缺失的孩子不会形成一条根叶路径。

**复杂度：** 时间 O(n)，辅助空间 O(w)，w 为二叉树最大层宽。 以上只分析待实现函数，输入存储和固定驱动的打印缓冲另计。

**常见错误：** 对单侧节点使用 `1 + min(leftDepth, rightDepth)` 会把空孩子的 0 当成叶子路径。

参考实现：

<<< ./solution/main.cpp{cpp}

:::

## 完成清单

- [ ] 函数签名和输入输出协议与题面一致。
- [ ] 20 个测试点全部通过，深链与规模边界无崩溃。
- [ ] 能解释至少一种错误写法及其反例。
- [ ] 时间、辅助空间与结果存储分别说明。

## 思考与复盘

若改用后序递推，只有一侧孩子存在时应如何合并？

## 题源

题意据 [LeetCode 111](https://leetcode.cn/problems/minimum-depth-of-binary-tree/) 整理，采用本章统一的 C++17 函数接口、输入协议和规模范围。
