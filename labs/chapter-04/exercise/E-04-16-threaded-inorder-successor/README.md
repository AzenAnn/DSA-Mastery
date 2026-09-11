---
title: "Lab 04-E-16：中序线索树查找后继与遍历"
description: "利用已有线索求后继，用常数辅助空间完成中序遍历。"
order: 24
chapter: 4
labId: "04E16"
chapterTitle: "树与二叉树"
updated: "2026-09-11"
contributors: ["Azen"]
status: "draft"
lab: true
difficulty: "进阶"
duration: "45～60 分钟"
---

# Lab 04-E-16：中序线索树查找后继与遍历

## 学习目标

- [ ] 利用已有线索求后继，用常数辅助空间完成中序遍历。
- [ ] 独立完成给定函数，并解释时间与辅助空间复杂度。
- [ ] 通过 20 个测试点，能说明典型错误在哪个边界失效。

## 前置知识与环境

先学习 [4.4 对应内容](/learn/chapter-04-tree/04-threaded-binary-tree/)。需要 C++17、Node.js 22.13+ 与 pnpm；Make 可选。输入读取、节点分配和结果输出已在本题 support 目录中提供。

## 任务

输入已经正确中序线索化且无头结点的二叉树，先输出完整中序序列，再回答 q 个节点的中序后继。标签 0 表示真实孩子，1 表示线索。查询 0 或查询末节点时后继为 0。必须直接使用输入线索，不允许递归、显式栈、建立全量中序数组或重新线索化；任何输入指针及标签均不可修改。

### 待实现接口

在 `student/main.cpp` 中实现：

```cpp
const ThreadNode* inorderSuccessor(const ThreadNode* node);
void traverseInorderThreaded(const ThreadNode* root, std::ostream& output);
```

`ThreadNode` 含 `int id`、左右指针和整型 `ltag`、`rtag`；标签只取 0 或 1，不设置额外头结点。 类型完整定义见 `support/tree.hpp`，固定驱动见 `support/runner.cpp`。无需自行编写 main 或修改驱动。

### 输入格式

第一行 `n root q`；随后按编号 1..n 输入 n 行 `left ltag right rtag`，表示已经线索化的节点；最后输入 q 个查询编号，可用空格或换行分隔。0 标签的指针一定指向真实孩子，1 标签的指针指向对应中序前驱或后继，序列两端允许为 0。

### 输出格式

第一行输出完整中序编号序列，空树为空行；随后 q 行分别输出后继编号。遍历函数只向 output 写第一行，后继查询的输出由驱动完成。

### 数据范围与约定

0 ≤ n ≤ 10000。节点编号唯一且为 1..n，0 只表示空指针；所有非零引用都在合法范围内。输入保证有序、无环、无共享节点，且给定结构覆盖全部 n 个节点。n=0 时 root=0；非空时根可以不是 1，编号不代表遍历顺序。不要求处理非法输入。 0 ≤ q ≤ 10000，每个查询编号在 0..n，允许重复查询。空树的查询只能为 0。

![中序线索化样例的孩子和线索](./assets/structure.png)

实线是原有孩子，虚线是中序前驱或后继线索；最左前驱和最右后继仍为空。

## 样例

### 样例 1

输入：

```text
3 2 4
0 1 2 1
1 0 3 0
2 1 0 1
1 2 3 0
```

输出：

```text
1 2 3
2
3
0
0
```

完整序列为 1 2 3；查询 1、2、3、0 的后继分别为 2、3、0、0。

### 样例 2：空结构

输入：

```text
0 0 4
0 0 0 0
```

输出：

```text

0
0
0
0
```

空结构按本题约定处理。

### 样例 3：单节点

输入：

```text
1 1 5
0 1 0 1
0 1 1 1 1
```

输出：

```text
1
0
0
0
0
0
```

单节点没有后继，查询它或 0 时都返回 0。

## 运行与评分

在仓库根目录执行：

```powershell
pnpm lab:doctor -- labs/chapter-04/exercise/E-04-16-threaded-inorder-successor
pnpm lab:run -- labs/chapter-04/exercise/E-04-16-threaded-inorder-successor --case 001-sample
pnpm lab:score -- labs/chapter-04/exercise/E-04-16-threaded-inorder-successor
pnpm lab:run -- labs/chapter-04/exercise/E-04-16-threaded-inorder-successor --target solution --case 001-sample
pnpm lab:verify -- labs/chapter-04/exercise/E-04-16-threaded-inorder-successor
```

也可以进入本 Lab 目录运行 `make doctor`、`make run`、`make score`、`make verify`。每题 20 点，每点 5 分，总分 100。学生骨架可编译，但初始并未完成算法。

## 测试覆盖

20 点包含样例、空结构、单节点、固定种子随机及规模边界。右子树含左链、前驱线索、首末节点、0 和重复查询检查后继规则；输出序列与指针表快照检查遍历和只读约定。 用例清单位于 `tests/cases.json`，输入和标准输出成对存放。所有输入均合法，不以未定义的错误输入作为测试。

黑盒测试检查输出正确性；本题的迭代、空间与只读要求仍需结合源码检查。

::: details 参考思路、正确性与复杂度

若 rtag=1，right 就是后继。否则进入真实右子树，再沿 ltag=0 的真实左孩子走到最左节点。完整遍历先找到整树最左节点，然后反复调用后继函数并流式输出。中序下一个节点只可能是右子树最左节点或已建好的后继线索，这两种情况覆盖全部节点。

**复杂度：** 完整遍历 O(n)，单次后继最坏 O(h+1)，加上任意 q 次查询总时间 O(n+q(h+1))；两个待实现函数均为 O(1) 辅助空间。驱动为输入和只读检查分配的 O(n) 空间不计入算法空间。 以上只分析待实现函数，输入存储和固定驱动的打印缓冲另计。

**常见错误：** 后继不总是 right：真实右孩子还可能有左子树。沿左指针走时忽略 ltag 则可能沿前驱线索回到已访问节点。

参考实现：

<<< ./solution/main.cpp{cpp}

:::

## 完成清单

- [ ] 函数签名和输入输出协议与题面一致。
- [ ] 20 个测试点全部通过，深链与规模边界无崩溃。
- [ ] 能解释至少一种错误写法及其反例。
- [ ] 时间、辅助空间与结果存储分别说明。

## 思考与复盘

单次后继查询为什么不是总为 O(1)，而连续完成整树中序遍历仍然是 O(n)？

## 题源

本章教材自编训练题，考查 4.4 的中序线索树查找后继与遍历。接口、样例与测试由本仓库编写。
