---
title: "Lab 04-E-05：合并二叉树"
description: "按结构位置合并两棵树，完整保留仅存在于一侧的子树。"
order: 13
chapter: 4
labId: "04E05"
chapterTitle: "树与二叉树"
updated: "2026-09-11"
contributors: ["Azen"]
status: "draft"
lab: true
difficulty: "基础"
duration: "45～60 分钟"
---

# Lab 04-E-05：合并二叉树

## 学习目标

- [ ] 按结构位置合并两棵树，完整保留仅存在于一侧的子树。
- [ ] 独立完成给定函数，并解释时间与辅助空间复杂度。
- [ ] 通过 20 个测试点，能说明典型错误在哪个边界失效。

## 前置知识与环境

先学习 [4.2 对应内容](/learn/chapter-04-tree/02-binary-tree/)。需要 C++17、Node.js 22.13+ 与 pnpm；Make 可选。输入读取、节点分配和结果输出已在本题 support 目录中提供。

## 任务

两棵二叉树从根对齐。相同位置都存在节点时，结果节点值为两值之和；仅一侧存在时，复制该侧节点以及后续结构；两侧都空时结果也空。必须创建独立的新树，输入树不可修改，不能把输入节点直接接到结果上。

### 待实现接口

在 `student/main.cpp` 中实现：

```cpp
TreeNode* mergeTrees(const TreeNode* first, const TreeNode* second, Tree& output);
```

节点类型 `TreeNode` 含 `long long val` 和左右指针；内存由 `Tree` 的节点池管理。 `output` 初始为空，只能通过 `output.make(value)` 建立新节点，返回结果根。结果最多有 n1+n2 个节点，值范围为 [-2×10^9, 2×10^9]。 类型完整定义见 `support/tree.hpp`，固定驱动见 `support/runner.cpp`。无需自行编写 main 或修改驱动。

### 输入格式

输入两行，每行表示一棵树，先 first 后 second。每行是空格分隔的层序 token，整数表示节点值，`null` 表示缺失孩子，不带方括号或逗号。按队列依次为每个**非空节点**读取左右孩子，空占位本身不再读取孩子；末尾缺失的孩子可以省略。例如 `1 null 2 3` 表示 1 的右孩子为 2，2 的左孩子为 3。空树必须显式写 `null`。

### 输出格式

输出结果树的层序序列，保留中间的 `null` 并去掉末尾连续 `null`；空结果输出 `null`。

### 数据范围与约定

每棵输入树 0 ≤ n ≤ 10000，节点值在 [-10^9, 10^9] 内。输入保证为合法二叉树，不存在环、共享节点或多余 token。每行对应一次树读取，不跨行拼接。

## 样例

### 样例 1

输入：

```text
1 3 2 5
2 1 3 null 4 null 7
```

输出：

```text
3 4 5 5 4 null 7
```

根为 1+2=3；左孩子为 3+1=4，右孩子为 2+3=5。仅一侧存在的 5、4、7 保留。

### 样例 2：空结构

输入：

```text
null
null
```

输出：

```text
null
```

空结构按本题约定处理。

### 样例 3：单节点

输入：

```text
7
7
```

输出：

```text
14
```

两个值为 7 的根合并为值为 14 的独立新节点。

## 运行与评分

在仓库根目录执行：

```powershell
pnpm lab:doctor -- labs/chapter-04/exercise/E-04-05-merge-binary-trees
pnpm lab:run -- labs/chapter-04/exercise/E-04-05-merge-binary-trees --case 001-sample
pnpm lab:score -- labs/chapter-04/exercise/E-04-05-merge-binary-trees
pnpm lab:run -- labs/chapter-04/exercise/E-04-05-merge-binary-trees --target solution --case 001-sample
pnpm lab:verify -- labs/chapter-04/exercise/E-04-05-merge-binary-trees
```

也可以进入本 Lab 目录运行 `make doctor`、`make run`、`make score`、`make verify`。每题 20 点，每点 5 分，总分 100。学生骨架可编译，但初始并未完成算法。

## 测试覆盖

20 点包含样例、空结构、单节点、固定种子随机及规模边界。双空、单空、互补形状和局部重叠检查结构并集；负值抵消、大值相加和两棵 10000 节点树检查数值与容量。 用例清单位于 `tests/cases.json`，输入和标准输出成对存放。所有输入均合法，不以未定义的错误输入作为测试。

黑盒测试检查输出正确性；复杂度和接口约束还需结合源码检查。

::: details 参考思路、正确性与复杂度

队列项保存两个输入位置及一个输出节点。对左右位置分别取输入孩子：至少一个非空就通过 `output.make(value)` 分配新节点，连接到当前结果并入队。根先按相同规则创建。每个结果位置恰好建立一次，其值来自该位置的全部输入贡献，结构则是两个输入结构的并集。

**复杂度：** 时间 O(n1+n2)，辅助队列最坏 O(n1+n2)，另需 O(n1+n2) 输出节点。不得把保存结果节点的空间宣称为 O(1)。 以上只分析待实现函数，输入存储和固定驱动的打印缓冲另计。

**常见错误：** 一侧为空时直接返回另一侧节点，数值虽然正确，但结果会与输入共享存储，违反本题接口要求。

参考实现：

<<< ./solution/main.cpp{cpp}

:::

## 完成清单

- [ ] 函数签名和输入输出协议与题面一致。
- [ ] 20 个测试点全部通过，深链与规模边界无崩溃。
- [ ] 能解释至少一种错误写法及其反例。
- [ ] 时间、辅助空间与结果存储分别说明。

## 思考与复盘

如果允许修改第一棵输入树并共享节点，时间和空间合同会发生哪些变化？

## 题源

题意据 [LeetCode 617](https://leetcode.cn/problems/merge-two-binary-trees/) 整理，采用本章统一的 C++17 函数接口、输入协议和规模范围，并增加独立结果树的所有权要求。
