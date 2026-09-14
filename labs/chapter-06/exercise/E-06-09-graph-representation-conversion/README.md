---
title: "Lab 06-E-09：图的三种表示转换"
description: "从边集、矩阵或邻接表读入同一张图，并输出三种规范表示。"
order: 13
chapter: 6
labId: "06E09"
chapterTitle: "图的基础与存储"
updated: "2026-09-12"
contributors: ["Azen"]
status: "draft"
lab: true
difficulty: "进阶"
duration: "75～100 分钟"
---

# Lab 06-E-09：图的三种表示转换

> 题目来源：[DSA Mastery 6.2](https://azenann.github.io/DSA-Mastery/learn/chapter-06-graph-foundations/02-graph-storage/)。本题为根据课程知识点设计的独立练习，输入输出和数据范围由本 Lab 定义。

## 学习目标

- [ ] 根据 format 解码输入，注意无向边在 E 中一次、在 M/L 中双向出现。
- [ ] 生成矩阵和升序邻接表，再枚举规范边集，防止无向边重复计数。
- [ ] 能解释算法正确性与复杂度，并通过正常、边界和回归用例。

## 前置知识

先阅读 [6.2 图的存储结构](../../../../content/chapter-06-graph-foundations/02-graph-storage.md)。环境需要 Node.js、pnpm 和支持 C++17 的编译器；Make 可选，可用下方 pnpm 命令替代。

## 题目

给定一张无权简单图及其一种存储表示。图可能有向或无向，输入表示可能是边集 E、邻接矩阵 M 或邻接表 L。请输出该图的三种标准表示，使结果与输入表示及输入边顺序无关。

## 输入格式

首行 `type format n`，type 为 `U`（无向）或 `D`（有向），format 为 `E`、`M` 或 `L`。

- E：下一行 m，随后 m 行 `u v`；无向边仅输入一次，端点顺序任意。
- M：接下来 n 行，每行 n 个 0/1；U 的矩阵保证对称。
- L：接下来 n 行，对应顶点 0..n-1；每行 k 加 k 个互异邻居，邻居可乱序。U 的邻接记录保证双向一致。

### 数据范围

`1 <= n <= 500`，顶点编号 `0..n-1`；无自环、无重边，矩阵对角线为 0。U 有 `0 <= m <= n(n-1)/2` 条逻辑边，D 有 `0 <= m <= n(n-1)` 条边。三种输入都保证有效。

输入为单组有效数据，所有整数和命令按空白分隔。自动评分不包含非法编号、非法命令或违反上述限制的图，不需要额外输出输入校验提示。

## 输出格式

依次输出三个区段：

1. 一行 `MATRIX`，再输出 n 行 n 列矩阵。
2. 一行 `LIST`，再输出 n 行“邻居数量 + 升序邻居”，无邻居输出 0。
3. 一行 `EDGES m`，再输出 m 行边；按起点升序、起点相同时按终点升序。U 仅输出 `u<v` 的逻辑边，D 输出全部有向边。

只向标准输出写入答案；调试信息写入标准错误。按题面规定分行，评分按空白分隔的 token 比较。

## 样例

### 样例输入

```text
U E 3
2
2 0
1 0
```

### 样例输出

```text
MATRIX
0 1 1
1 0 0
1 0 0
LIST
2 1 2
1 0
1 0
EDGES 2
0 1
0 2
```

边集输入两条无向边，矩阵写入四个 1；邻接表共有四条记录，但 EDGES 区段仍只有两条边，并统一输出较小端点在前。

## 实现任务

修改本题目录中的 `student/main.cpp`，完成 TODO 标记的算法。输入输出骨架可以保留，完整参考实现单独位于 `solution/main.cpp`。

1. 根据 format 解码输入，注意无向边在 E 中一次、在 M/L 中双向出现。
2. 生成矩阵和升序邻接表，再枚举规范边集，防止无向边重复计数。

## 正常、边界与错误情况

- 正常情况：按题目定义处理全部输入，输出与输入边的排列顺序无关。
- n=1 或空图：矩阵为 0，邻接表为空，EDGES 后的计数为 0。
- 同一图的 E/M/L 输入：三个区段的输出必须一致。
- 常见错误：无向边的逻辑条数 m 不等于邻接记录总数 2m；D 不能强制补反向边。
- 非法输入不在评分范围；不要在标准输出中添加提示词、调试标记或额外解释。

## 运行与评分

在本 Lab 目录执行：

```powershell
make doctor
make run
make run CASE=001-sample
make score
```

未安装 Make 时，在仓库根目录执行：

```powershell
pnpm lab:doctor -- labs/chapter-06/exercise/E-06-09-graph-representation-conversion
pnpm lab:run -- labs/chapter-06/exercise/E-06-09-graph-representation-conversion
pnpm lab:run -- labs/chapter-06/exercise/E-06-09-graph-representation-conversion --case 001-sample
pnpm lab:score -- labs/chapter-06/exercise/E-06-09-graph-representation-conversion
```

本题有 20 组测试，每组 5 分，总分 100。起始代码可以编译，但尚未实现完整算法；满分需补齐 TODO。作者检查参考解、骨架与预期输出可使用 `pnpm lab:verify -- labs/chapter-06/exercise/E-06-09-graph-representation-conversion`。

## 正确性说明

可以将“是否存在 u 到 v 的边”作为共同状态。三种输入的每项都准确还原这一关系，再按固定的顶点顺序枚举该关系，所得三种输出描述相同的图。

## 复杂度分析

时间 `O(n^2+m)`，空间 `O(n^2+m)`；参考实现按矩阵行列递增枚举，因此邻接表和边集无需额外排序。

## 完成清单

- [ ] 20 组测试全部通过，得分 100。
- [ ] 样例结果能够手工推导，顶点编号和输出规则没有混淆。
- [ ] 已检查本题的空结构、最小规模、最大规模和易错边界。
- [ ] 能说明每个顶点或每条边如何参与计算，复杂度包含输入输出及排序成本。
- [ ] 已使用本题的 Make 或 pnpm 入口运行学生代码。

## 思考与复盘

1. 只把 E 转成 M/L 是否完成本题？另外两种输入需要处理什么？
2. 若引入权值 0，为什么不能再直接用矩阵 0 表示“没有边”？
