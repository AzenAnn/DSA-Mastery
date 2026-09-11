---
title: "Lab 04-E-24：二叉树的坡度"
description: "在一次后序处理中同时维护子树和与全树坡度。"
order: 32
chapter: 4
labId: "04E24"
chapterTitle: "树与二叉树"
updated: "2026-09-11"
contributors: ["Azen"]
status: "draft"
lab: true
difficulty: "进阶"
duration: "45～60 分钟"
---

# Lab 04-E-24：二叉树的坡度

## 学习目标

- [ ] 在一次后序处理中同时维护子树和与全树坡度。
- [ ] 独立完成给定函数，并解释时间与辅助空间复杂度。
- [ ] 通过 20 个测试点，能说明典型错误在哪个边界失效。

## 前置知识与环境

先学习 [4.6 对应内容](/learn/chapter-04-tree/06-binary-tree-classic-problems/)。需要 C++17、Node.js 22.13+ 与 pnpm；Make 可选。输入读取、节点分配和结果输出已在本题 support 目录中提供。

## 任务

一个节点的坡度等于它的左子树节点值总和与右子树节点值总和之差的绝对值，空子树和为 0。返回所有节点坡度的总和。叶子的坡度为 0，空树答案为 0。节点值可以为负，不能用孩子个数或孩子根值代替子树和。

### 待实现接口

在 `student/main.cpp` 中实现：

```cpp
long long findTilt(const TreeNode* root);
```

节点类型 `TreeNode` 含 `long long val` 和左右指针；内存由 `Tree` 的节点池管理。 类型完整定义见 `support/tree.hpp`，固定驱动见 `support/runner.cpp`。无需自行编写 main 或修改驱动。

### 输入格式

输入一行，表示一棵树。每行是空格分隔的层序 token，整数表示节点值，`null` 表示缺失孩子，不带方括号或逗号。按队列依次为每个**非空节点**读取左右孩子，空占位本身不再读取孩子；末尾缺失的孩子可以省略。例如 `1 null 2 3` 表示 1 的右孩子为 2，2 的左孩子为 3。空树必须显式写 `null`。

### 输出格式

输出全树坡度之和，用 long long 保存子树和、中间差值和最终结果。

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
41
```

根的左右子树和为 9 和 42，坡度 33；节点 20 的坡度为 |15-7|=8，总坡度为 41。

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

左右子树和均为 0，单节点的坡度为 0。

## 运行与评分

在仓库根目录执行：

```powershell
pnpm lab:doctor -- labs/chapter-04/exercise/E-04-24-binary-tree-tilt
pnpm lab:run -- labs/chapter-04/exercise/E-04-24-binary-tree-tilt --case 001-sample
pnpm lab:score -- labs/chapter-04/exercise/E-04-24-binary-tree-tilt
pnpm lab:run -- labs/chapter-04/exercise/E-04-24-binary-tree-tilt --target solution --case 001-sample
pnpm lab:verify -- labs/chapter-04/exercise/E-04-24-binary-tree-tilt
```

也可以进入本 Lab 目录运行 `make doctor`、`make run`、`make score`、`make verify`。每题 20 点，每点 5 分，总分 100。学生骨架可编译，但初始并未完成算法。

## 测试覆盖

20 点包含样例、空结构、单节点、固定种子随机及规模边界。负值、抵消、不平衡分支、宽层和深链检查完整子树和；10000 节点深链末叶设为 999999999，构造 double 无法精确表示的总坡度。 用例清单位于 `tests/cases.json`，输入和标准输出成对存放。所有输入均合法，不以未定义的错误输入作为测试。

黑盒测试检查输出正确性；复杂度和接口约束还需结合源码检查。

::: details 参考思路、正确性与复杂度

用显式后序帧保存状态、左子树和与右子树和。左右处理完成后，累加两和之差的绝对值，再把当前节点值加上两侧和传给父帧。后序顺序保证当前节点结算时两个子树信息完整，且每个节点只贡献自己的坡度一次。

**复杂度：** 时间 O(n)，辅助栈 O(h+1)。单棵树子树和绝对值至多 10^13；总坡度小于 10^17，可由有符号 64 位整数精确表示。 以上只分析待实现函数，输入存储和固定驱动的打印缓冲另计。

**常见错误：** 只取左右孩子的值会漏掉更深节点；重复扫描每个子树可能退化为 O(n²)。

参考实现：

<<< ./solution/main.cpp{cpp}

:::

## 完成清单

- [ ] 函数签名和输入输出协议与题面一致。
- [ ] 20 个测试点全部通过，深链与规模边界无崩溃。
- [ ] 能解释至少一种错误写法及其反例。
- [ ] 时间、辅助空间与结果存储分别说明。

## 思考与复盘

一条 10000 节点单链，除末端叶子值为 999999999 外，其余值均为 10^9。求它的总坡度，并说明为何 int 会溢出、double 无法精确表示这个整数。

## 题源

题意据 [LeetCode 563](https://leetcode.cn/problems/binary-tree-tilt/) 整理。本 Lab 按用户 Ch4 题集约定补全 C++17 函数接口、输入协议和规模范围。
