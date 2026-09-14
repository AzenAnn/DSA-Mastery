---
title: "Lab 04-E-19：树的后根遍历"
description: "按原有兄弟次序完成一般树的后根遍历，区别于二叉树后序。"
order: 27
chapter: 4
labId: "04E19"
chapterTitle: "树与二叉树"
updated: "2026-09-11"
contributors: ["Azen"]
status: "draft"
lab: true
difficulty: "进阶"
duration: "45～60 分钟"
---

# Lab 04-E-19：树的后根遍历

## 学习目标

- [ ] 按原有兄弟次序完成一般树的后根遍历，区别于二叉树后序。
- [ ] 独立完成给定函数，并解释时间与辅助空间复杂度。
- [ ] 通过 20 个测试点，能说明典型错误在哪个边界失效。

## 前置知识与环境

先学习 [4.5 对应内容](/learn/chapter-04-tree/05-trees-and-forests/)。需要 C++17、Node.js 22.13+ 与 pnpm；Make 可选。输入读取、节点分配和结果输出已在本题 support 目录中提供。

## 任务

给定一棵孩子兄弟表示的有序多叉树，按顺序完成每个孩子子树的后根遍历后，再访问当前节点。输出节点编号，严格保留兄弟的从左到右次序。空树输出空序列。要求迭代实现，使用每层一个状态帧，辅助空间限制为 O(h+1)，h 为原一般树高度。

### 待实现接口

在 `student/main.cpp` 中实现：

```cpp
std::vector<int> postorder(const Node* root);
```

节点类型 `Node` 含 `int id`、`Node* firstChild` 和 `Node* nextSibling`，函数只读取原树。 类型完整定义见 `support/tree.hpp`，固定驱动见 `support/runner.cpp`。无需自行编写 main 或修改驱动。

### 输入格式

第一行 `n root`。随后按节点编号 1..n 输入 n 行，每行 `firstChild nextSibling`。它们分别表示首孩子和下一兄弟的编号。输入表示**一棵**一般树，非空根的 nextSibling 必须为 0。空树只输入 `0 0`。

### 输出格式

输出后根遍历的节点编号序列，以空格分隔；空树输出空行。

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
5 6 2 3 7 4 1
```

先输出 2 的孩子 5、6，再输出 2；接着是 3、7、4，最后是根 1。

### 样例 2：空结构

输入：

```text
0 0
```

输出：

```text

```

输出为空行。

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

唯一节点直接输出，后根序列为 1。

## 运行与评分

在仓库根目录执行：

```powershell
pnpm lab:doctor -- labs/chapter-04/exercise/E-04-19-general-tree-postorder
pnpm lab:run -- labs/chapter-04/exercise/E-04-19-general-tree-postorder --case 001-sample
pnpm lab:score -- labs/chapter-04/exercise/E-04-19-general-tree-postorder
pnpm lab:run -- labs/chapter-04/exercise/E-04-19-general-tree-postorder --target solution --case 001-sample
pnpm lab:verify -- labs/chapter-04/exercise/E-04-19-general-tree-postorder
```

也可以进入本 Lab 目录运行 `make doctor`、`make run`、`make score`、`make verify`。每题 20 点，每点 5 分，总分 100。学生骨架可编译，但初始并未完成算法。

## 测试覆盖

20 点包含样例、空结构、单节点、固定种子随机及规模边界。星形与混合兄弟检查访问次序，梳状和 10000 节点链检查帧栈，乱序编号防止排序输出。 用例清单位于 `tests/cases.json`，输入和标准输出成对存放。所有输入均合法，不以未定义的错误输入作为测试。

黑盒测试检查输出正确性；本题的迭代、空间与只读要求仍需结合源码检查。

::: details 参考思路、正确性与复杂度

一个帧保存当前节点与下一个待访问孩子。有孩子未处理时，先把当前帧游标推进到兄弟，再压入这个孩子的新帧；孩子全部结束后才输出当前节点并弹出。帧只沿父子路径增长，所以兄弟很多也不会同时占满栈。每个父节点严格等待所有孩子依次完成，故序列符合后根定义。

**复杂度：** 时间 O(n)，辅助栈 O(h+1)，另有 O(n) 返回序列。这里 h 是一般树高度，不是孩子兄弟二叉表示的高度。 以上只分析待实现函数，输入存储和固定驱动的打印缓冲另计。

**常见错误：** 直接做孩子兄弟二叉树的后序会颠倒部分兄弟访问关系；一般树后根对应其孩子兄弟二叉树的中序。

参考实现：

<<< ./solution/main.cpp{cpp}

:::

## 完成清单

- [ ] 函数签名和输入输出协议与题面一致。
- [ ] 20 个测试点全部通过，深链与规模边界无崩溃。
- [ ] 能解释至少一种错误写法及其反例。
- [ ] 时间、辅助空间与结果存储分别说明。

## 思考与复盘

用只有根和三个孩子的星形树，分别写出一般树后根与孩子兄弟二叉树后序序列。

## 题源

本章教材自编训练题，考查 4.5 的树的后根遍历。接口、样例与测试由本仓库编写。
