---
title: "Lab 04-E-12：叶子相似的树"
description: "比较按从左到右排列的叶子序列，保留次序与重复次数。"
order: 20
chapter: 4
labId: "04E12"
chapterTitle: "树与二叉树"
updated: "2026-09-11"
contributors: ["Azen"]
status: "draft"
lab: true
difficulty: "基础"
duration: "45～60 分钟"
---

# Lab 04-E-12：叶子相似的树

## 学习目标

- [ ] 比较按从左到右排列的叶子序列，保留次序与重复次数。
- [ ] 独立完成给定函数，并解释时间与辅助空间复杂度。
- [ ] 通过 20 个测试点，能说明典型错误在哪个边界失效。

## 前置知识与环境

先学习 [4.3 对应内容](/learn/chapter-04-tree/03-binary-tree-traversal/)。需要 C++17、Node.js 22.13+ 与 pnpm；Make 可选。输入读取、节点分配和结果输出已在本题 support 目录中提供。

## 任务

如果两棵树的叶子值从左到右构成完全相同的序列，则称为叶子相似。只比较叶子值，内部节点值和树形可以不同；顺序、长度和重复次数必须一致。两棵空树相似，只有一棵为空时不相似。

### 待实现接口

在 `student/main.cpp` 中实现：

```cpp
bool leafSimilar(const TreeNode* first, const TreeNode* second);
```

节点类型 `TreeNode` 含 `long long val` 和左右指针；内存由 `Tree` 的节点池管理。 类型完整定义见 `support/tree.hpp`，固定驱动见 `support/runner.cpp`。无需自行编写 main 或修改驱动。

### 输入格式

输入两行，每行表示一棵树，先 first 后 second。每行是空格分隔的层序 token，整数表示节点值，`null` 表示缺失孩子，不带方括号或逗号。按队列依次为每个**非空节点**读取左右孩子，空占位本身不再读取孩子；末尾缺失的孩子可以省略。例如 `1 null 2 3` 表示 1 的右孩子为 2，2 的左孩子为 3。空树必须显式写 `null`。

### 输出格式

相似输出 `true`，否则输出 `false`。

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
false
```

第一棵树的叶子序列为 [5,2]，第二棵为 [4,7]，因此输出 false。

### 样例 2：空结构

输入：

```text
null
null
```

输出：

```text
true
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
true
```

两棵树的叶子序列均为 [7]，因此相似。

## 运行与评分

在仓库根目录执行：

```powershell
pnpm lab:doctor -- labs/chapter-04/exercise/E-04-12-leaf-similar-trees
pnpm lab:run -- labs/chapter-04/exercise/E-04-12-leaf-similar-trees --case 001-sample
pnpm lab:score -- labs/chapter-04/exercise/E-04-12-leaf-similar-trees
pnpm lab:run -- labs/chapter-04/exercise/E-04-12-leaf-similar-trees --target solution --case 001-sample
pnpm lab:verify -- labs/chapter-04/exercise/E-04-12-leaf-similar-trees
```

也可以进入本 Lab 目录运行 `make doctor`、`make run`、`make score`、`make verify`。每题 20 点，每点 5 分，总分 100。学生骨架可编译，但初始并未完成算法。

## 测试覆盖

20 点包含样例、空结构、单节点、固定种子随机及规模边界。异形同叶、叶子逆序、重复次数不同、相同根不同叶子、双空与单空检查序列相等；深宽树检查流式遍历。 用例清单位于 `tests/cases.json`，输入和标准输出成对存放。所有输入均合法，不以未定义的错误输入作为测试。

黑盒测试检查输出正确性；复杂度和接口约束还需结合源码检查。

::: details 参考思路、正确性与复杂度

为两棵树各维护一个 DFS 栈，每次只取下一片叶子。先压右、后压左，弹出顺序便是从左到右。同步比较叶子值；只要不同就返回 false，只有两侧同时耗尽才返回 true。该过程逐项比较完整叶子序列，与定义等价，不需要存储所有叶子。

**复杂度：** 时间 O(n1+n2)，辅助空间 O(h1+h2+1)，不使用保存全部叶子的数组。 以上只分析待实现函数，输入存储和固定驱动的打印缓冲另计。

**常见错误：** 比较集合会丢失顺序和重复次数；只检查共同前缀会把 [1] 与 [1,1] 判为相似。

参考实现：

<<< ./solution/main.cpp{cpp}

:::

## 完成清单

- [ ] 函数签名和输入输出协议与题面一致。
- [ ] 20 个测试点全部通过，深链与规模边界无崩溃。
- [ ] 能解释至少一种错误写法及其反例。
- [ ] 时间、辅助空间与结果存储分别说明。

## 思考与复盘

为什么必须先压右孩子再压左孩子？举一个树形不同但叶子相似的例子。

## 题源

题意据 [LeetCode 872](https://leetcode.cn/problems/leaf-similar-trees/) 整理。本 Lab 按用户 Ch4 题集约定补全 C++17 函数接口、输入协议和规模范围。
