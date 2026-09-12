---
title: "Lab 04-E-08：二叉树的中序遍历（迭代实现）"
description: "用显式栈模拟中序遍历，正确处理没有右子树时的回退。"
order: 16
chapter: 4
labId: "04E08"
chapterTitle: "树与二叉树"
updated: "2026-09-11"
contributors: ["Azen"]
status: "draft"
lab: true
difficulty: "基础"
duration: "45～60 分钟"
---

# Lab 04-E-08：二叉树的中序遍历（迭代实现）

## 学习目标

- [ ] 用显式栈模拟中序遍历，正确处理没有右子树时的回退。
- [ ] 独立完成给定函数，并解释时间与辅助空间复杂度。
- [ ] 通过 20 个测试点，能说明典型错误在哪个边界失效。

## 前置知识与环境

先学习 [4.3 对应内容](/learn/chapter-04-tree/03-binary-tree-traversal/)。需要 C++17、Node.js 22.13+ 与 pnpm；Make 可选。输入读取、节点分配和结果输出已在本题 support 目录中提供。

## 任务

返回二叉树按“左子树、根、右子树”访问的节点值序列。必须使用迭代和显式栈，不能使用递归，也不能排序节点值。输入是普通二叉树，不保证二叉搜索树性质；不能修改树。

### 待实现接口

在 `student/main.cpp` 中实现：

```cpp
std::vector<long long> inorderTraversal(const TreeNode* root);
```

节点类型 `TreeNode` 含 `long long val` 和左右指针；内存由 `Tree` 的节点池管理。 类型完整定义见 `support/tree.hpp`，固定驱动见 `support/runner.cpp`。无需自行编写 main 或修改驱动。

### 输入格式

输入一行，表示一棵树。每行是空格分隔的层序 token，整数表示节点值，`null` 表示缺失孩子，不带方括号或逗号。按队列依次为每个**非空节点**读取左右孩子，空占位本身不再读取孩子；末尾缺失的孩子可以省略。例如 `1 null 2 3` 表示 1 的右孩子为 2，2 的左孩子为 3。空树必须显式写 `null`。

### 输出格式

按中序输出节点值，以空格分隔；空树输出空行。

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
9 3 15 20 7
```

先访问左子树 9，再访问根 3，最后访问右子树的 15、20、7。

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
-7
```

中序序列只含唯一节点的值 -7。

## 运行与评分

在仓库根目录执行：

```powershell
pnpm lab:doctor -- labs/chapter-04/exercise/E-04-08-binary-tree-inorder-iterative
pnpm lab:run -- labs/chapter-04/exercise/E-04-08-binary-tree-inorder-iterative --case 001-sample
pnpm lab:score -- labs/chapter-04/exercise/E-04-08-binary-tree-inorder-iterative
pnpm lab:run -- labs/chapter-04/exercise/E-04-08-binary-tree-inorder-iterative --target solution --case 001-sample
pnpm lab:verify -- labs/chapter-04/exercise/E-04-08-binary-tree-inorder-iterative
```

也可以进入本 Lab 目录运行 `make doctor`、`make run`、`make score`、`make verify`。每题 20 点，每点 5 分，总分 100。学生骨架可编译，但初始并未完成算法。

## 测试覆盖

20 点包含样例、空结构、单节点、固定种子随机及规模边界。左右链、交替链、非搜索树、重复值和负值检查真实中序；10000 节点深链与宽树检查显式栈。 用例清单位于 `tests/cases.json`，输入和标准输出成对存放。所有输入均合法，不以未定义的错误输入作为测试。

黑盒测试检查输出正确性；本题的迭代、空间与只读要求仍需结合源码检查。

::: details 参考思路、正确性与复杂度

游标不断向左并压栈；到空指针后弹出栈顶访问，再令游标转向它的右孩子。栈保存左侧已经开始、根尚未访问的祖先。弹出的节点左子树已经完成，右子树尚未开始，因此访问次序符合定义。外层条件必须是游标非空或栈非空。

**复杂度：** 时间 O(n)，辅助栈 O(h+1)，另有 O(n) 返回序列。 以上只分析待实现函数，输入存储和固定驱动的打印缓冲另计。

**常见错误：** 外层只写 `while (current)` 会在抵达第一个空左孩子时提前结束；按值排序只对部分搜索树碰巧成立。

参考实现：

<<< ./solution/main.cpp{cpp}

:::

## 完成清单

- [ ] 函数签名和输入输出协议与题面一致。
- [ ] 20 个测试点全部通过，深链与规模边界无崩溃。
- [ ] 能解释至少一种错误写法及其反例。
- [ ] 时间、辅助空间与结果存储分别说明。

## 思考与复盘

为什么每个节点只入栈和出栈一次？右斜树和左斜树的最大栈长度分别是多少？

## 题源

题意据 [LeetCode 94](https://leetcode.cn/problems/binary-tree-inorder-traversal/) 整理。本 Lab 按用户 Ch4 题集约定补全 C++17 函数接口、输入协议和规模范围。
