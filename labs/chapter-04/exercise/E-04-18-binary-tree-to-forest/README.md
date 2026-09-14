---
title: "Lab 04-E-18：二叉树转森林"
description: "从二叉链接恢复有序森林的全部根与孩子数组。"
order: 26
chapter: 4
labId: "04E18"
chapterTitle: "树与二叉树"
updated: "2026-09-11"
contributors: ["Azen"]
status: "draft"
lab: true
difficulty: "进阶"
duration: "45～60 分钟"
---

# Lab 04-E-18：二叉树转森林

## 学习目标

- [ ] 从二叉链接恢复有序森林的全部根与孩子数组。
- [ ] 独立完成给定函数，并解释时间与辅助空间复杂度。
- [ ] 通过 20 个测试点，能说明典型错误在哪个边界失效。

## 前置知识与环境

先学习 [4.5 对应内容](/learn/chapter-04-tree/05-trees-and-forests/)。需要 C++17、Node.js 22.13+ 与 pnpm；Make 可选。输入读取、节点分配和结果输出已在本题 support 目录中提供。

## 任务

把输入二叉树按孩子兄弟语义还原为有序森林。从二叉树根开始的连续右链依次构成森林的根；每个节点从左孩子开始的连续右链依次构成它的孩子列表。保留所有编号和顺序，不修改输入二叉树。任意合法二叉树都可以按此规则解释为森林。

### 待实现接口

在 `student/main.cpp` 中实现：

```cpp
std::vector<GeneralNode*> binaryToForest(const BinaryNode* root, std::vector<GeneralNode>& output);
```

`GeneralNode` 含 `id` 和有序 `children` 指针数组，`BinaryNode` 含 `id` 与左右指针。驱动已将 output 分配为 n+1 个节点并设置编号，槽位 0 不使用，所有输出链接或孩子数组初始为空。函数只调用一次，不得 resize output，以免已有输出指针失效。 类型完整定义见 `support/tree.hpp`，固定驱动见 `support/runner.cpp`。无需自行编写 main 或修改驱动。

### 输入格式

第一行 `n root`；随后按节点编号 1..n 输入 n 行 `left right`。输入是普通二叉树，转换时才把左、右链接解释为孩子和兄弟。空树只输入 `0 0`。

### 输出格式

第一行输出 `k root1 ... rootk`；空森林输出单个 0。随后按编号 1..n 各输出一行 `degree child1 ... childDegree`。无孩子节点输出单个 0。

### 数据范围与约定

0 ≤ n ≤ 10000。节点编号唯一且为 1..n，0 只表示空指针；所有非零引用都在合法范围内。输入保证有序、无环、无共享节点，且给定结构覆盖全部 n 个节点。n=0 时 root=0；非空时根可以不是 1，编号不代表遍历顺序。不要求处理非法输入。

![有序森林与二叉链表转换示意](./assets/structure.png)

两边节点编号保持不变；二叉表示的实线为左孩子、虚线为右兄弟，根链顺序为 4、1、6。

## 样例

### 样例 1

输入：

```text
6 4
2 6
0 3
0 0
5 1
0 0
0 0
```

输出：

```text
3 4 1 6
2 2 3
0
0
1 5
0
0
```

从根 4 沿右链得到 [4,1,6]；节点 1 的左链起点为 2，沿右得到孩子 [2,3]。

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
1 1
0
```

单节点二叉树恢复为一棵孩子数组为空的树。

## 运行与评分

在仓库根目录执行：

```powershell
pnpm lab:doctor -- labs/chapter-04/exercise/E-04-18-binary-tree-to-forest
pnpm lab:run -- labs/chapter-04/exercise/E-04-18-binary-tree-to-forest --case 001-sample
pnpm lab:score -- labs/chapter-04/exercise/E-04-18-binary-tree-to-forest
pnpm lab:run -- labs/chapter-04/exercise/E-04-18-binary-tree-to-forest --target solution --case 001-sample
pnpm lab:verify -- labs/chapter-04/exercise/E-04-18-binary-tree-to-forest
```

也可以进入本 Lab 目录运行 `make doctor`、`make run`、`make score`、`make verify`。每题 20 点，每点 5 分，总分 100。学生骨架可编译，但初始并未完成算法。

## 测试覆盖

20 点包含样例、空结构、单节点、固定种子随机及规模边界。多根右链、各根子树、乱序编号、孤立根及随机森林检查有序根数组和完整孩子数组恢复。 用例清单位于 `tests/cases.json`，输入和标准输出成对存放。所有输入均合法，不以未定义的错误输入作为测试。

黑盒测试检查输出正确性；复杂度和接口约束还需结合源码检查。

::: details 参考思路、正确性与复杂度

沿根的右链建立根数组。遍历每个二叉节点，从它的 left 起沿 right 收集孩子。根链与每一条孩子链都保持原出现顺序。二叉表示中每个节点要么在根链中，要么处于唯一父节点的孩子链中，因此每个节点被恢复到恰当位置，没有丢失或重复。

**复杂度：** 时间 O(n)：所有孩子链合计只有 n-k 个成员。辅助遍历栈 O(hb+1)，hb 为输入二叉树高度；输出节点、根与孩子数组合计 O(n)。 以上只分析待实现函数，输入存储和固定驱动的打印缓冲另计。

**常见错误：** 把 right 也当成当前节点的孩子会改变父子关系；只恢复根数组会漏掉各根下面的结构。

参考实现：

<<< ./solution/main.cpp{cpp}

:::

## 完成清单

- [ ] 函数签名和输入输出协议与题面一致。
- [ ] 20 个测试点全部通过，深链与规模边界无崩溃。
- [ ] 能解释至少一种错误写法及其反例。
- [ ] 时间、辅助空间与结果存储分别说明。

## 思考与复盘

为什么循环扫描孩子链再遍历二叉节点的写法仍是 O(n)，而不是 O(n²)？

## 题源

本章教材自编训练题，考查 4.5 的二叉树转森林。接口、样例与测试由本仓库编写。
