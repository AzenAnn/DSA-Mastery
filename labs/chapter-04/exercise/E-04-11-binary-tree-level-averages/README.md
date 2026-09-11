---
title: "Lab 04-E-11：二叉树的层平均值"
description: "固定每一层的范围，避免整数除法和层和溢出。"
order: 19
chapter: 4
labId: "04E11"
chapterTitle: "树与二叉树"
updated: "2026-09-11"
contributors: ["Azen"]
status: "draft"
lab: true
difficulty: "基础"
duration: "45～60 分钟"
---

# Lab 04-E-11：二叉树的层平均值

## 学习目标

- [ ] 固定每一层的范围，避免整数除法和层和溢出。
- [ ] 独立完成给定函数，并解释时间与辅助空间复杂度。
- [ ] 通过 20 个测试点，能说明典型错误在哪个边界失效。

## 前置知识与环境

先学习 [4.3 对应内容](/learn/chapter-04-tree/03-binary-tree-traversal/)。需要 C++17、Node.js 22.13+ 与 pnpm；Make 可选。输入读取、节点分配和结果输出已在本题 support 目录中提供。

## 任务

从根层开始，依次返回每层所有节点值的算术平均数。每层平均数等于本层节点值总和除以本层节点数，负数和重复值都按正常数值参与。空树返回空序列。

### 待实现接口

在 `student/main.cpp` 中实现：

```cpp
std::vector<double> averageOfLevels(const TreeNode* root);
```

节点类型 `TreeNode` 含 `long long val` 和左右指针；内存由 `Tree` 的节点池管理。 类型完整定义见 `support/tree.hpp`，固定驱动见 `support/runner.cpp`。无需自行编写 main 或修改驱动。

### 输入格式

输入一行，表示一棵树。每行是空格分隔的层序 token，整数表示节点值，`null` 表示缺失孩子，不带方括号或逗号。按队列依次为每个**非空节点**读取左右孩子，空占位本身不再读取孩子；末尾缺失的孩子可以省略。例如 `1 null 2 3` 表示 1 的右孩子为 2，2 的左孩子为 3。空树必须显式写 `null`。

### 输出格式

按层输出浮点数，以空格分隔。驱动保留小数点后 10 位；评测接受绝对误差 1e-6 或相对误差 1e-12 范围内的值。空树输出空行。

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
3.0000000000 14.5000000000 11.0000000000
```

三层依次为 [3]、[9,20]、[15,7]，平均值为 3、14.5、11。

### 样例 2：空结构

输入：

```text
null
```

输出：

```text

```

输出为空行。

### 样例 3：单节点

输入：

```text
-7
```

输出：

```text
-7.0000000000
```

单节点一层的平均值等于自身的值 -7。

## 运行与评分

在仓库根目录执行：

```powershell
pnpm lab:doctor -- labs/chapter-04/exercise/E-04-11-binary-tree-level-averages
pnpm lab:run -- labs/chapter-04/exercise/E-04-11-binary-tree-level-averages --case 001-sample
pnpm lab:score -- labs/chapter-04/exercise/E-04-11-binary-tree-level-averages
pnpm lab:run -- labs/chapter-04/exercise/E-04-11-binary-tree-level-averages --target solution --case 001-sample
pnpm lab:verify -- labs/chapter-04/exercise/E-04-11-binary-tree-level-averages
```

也可以进入本 Lab 目录运行 `make doctor`、`make run`、`make score`、`make verify`。每题 20 点，每点 5 分，总分 100。学生骨架可编译，但初始并未完成算法。

## 测试覆盖

20 点包含样例、空结构、单节点、固定种子随机及规模边界。非整数平均值、全负值、抵消、重复值和宽层大数检查分层、浮点除法及 64 位层和。 用例清单位于 `tests/cases.json`，输入和标准输出成对存放。所有输入均合法，不以未定义的错误输入作为测试。

黑盒测试检查输出正确性；复杂度和接口约束还需结合源码检查。

::: details 参考思路、正确性与复杂度

每轮 BFS 开始时固定 `count = queue.size()`，累加并弹出恰好 count 个节点，加入的孩子留待下一轮。整数层和用 long long，最后转 double 再除以 count。固定计数保证新加入的下一层节点不会污染本层分母或分子。

**复杂度：** 时间 O(n)，辅助队列 O(w)，另有 O(h+1) 返回序列。层和绝对值不超过 10^13，long long 足够。 以上只分析待实现函数，输入存储和固定驱动的打印缓冲另计。

**常见错误：** 除法完成后才转 double 会丢失小数；循环过程中不断读取 queue.size() 会混合两层。

参考实现：

<<< ./solution/main.cpp{cpp}

:::

## 完成清单

- [ ] 函数签名和输入输出协议与题面一致。
- [ ] 20 个测试点全部通过，深链与规模边界无崩溃。
- [ ] 能解释至少一种错误写法及其反例。
- [ ] 时间、辅助空间与结果存储分别说明。

## 思考与复盘

用 int 保存层和时，哪种节点值和层宽组合最先触发溢出？

## 题源

题意据 [LeetCode 637](https://leetcode.cn/problems/average-of-levels-in-binary-tree/) 整理。本 Lab 按用户 Ch4 题集约定补全 C++17 函数接口、输入协议和规模范围。
