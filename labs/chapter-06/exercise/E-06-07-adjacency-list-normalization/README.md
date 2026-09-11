---
title: "Lab 06-E-07：邻接表的构建与规范化输出"
description: "在稀疏图中构建双向邻接记录，并输出排序后的邻接表。"
order: 11
chapter: 6
labId: "06E07"
chapterTitle: "图的基础与存储"
updated: "2026-09-12"
contributors: ["Azen"]
status: "draft"
lab: true
difficulty: "基础"
duration: "35～60 分钟"
---

# Lab 06-E-07：邻接表的构建与规范化输出

> 题目来源：[洛谷 T419391](https://www.luogu.com.cn/problem/T419391)。原题“【数据结构】图的存储”同时输出矩阵和邻接表。本 Lab 专练邻接表，省略矩阵输出、允许空图，并将 n 上限扩大到 100000。

## 学习目标

- [ ] 为每条无向边写入两个邻接记录。
- [ ] 分别排序每个顶点的邻居，并以“数量 + 内容”输出，包括空邻接表。
- [ ] 能解释算法正确性与复杂度，并通过正常、边界和回归用例。

## 前置知识

先阅读 [6.2 图的存储结构](../../../../content/chapter-06-graph-foundations/02-graph-storage.md)。环境需要 Node.js、pnpm 和支持 C++17 的编译器；Make 可选，可用下方 pnpm 命令替代。

## 题目

给定一张简单无向图。请按顶点编号递增输出每个顶点的度数及全部邻居，邻居必须按编号递增排列，输出不得依赖输入边的先后顺序。

## 输入格式

第一行 `n m`，随后 `m` 行给出无向边 `u v`。

### 数据范围

`1 <= n <= 100000`，`0 <= m <= min(200000,n(n-1)/2)`，顶点编号 `1..n`；无自环、无重边。

输入为单组有效数据，所有整数和命令按空白分隔。自动评分不包含非法编号、非法命令或违反上述限制的图，不需要额外输出输入校验提示。

## 输出格式

输出 `n` 行，第 i 行先输出顶点 i 的度数 `k`，再输出 k 个升序邻居。孤立点单独输出 `0`。

只向标准输出写入答案；调试信息写入标准错误。按题面规定分行，评分按空白分隔的 token 比较。

## 样例

### 样例输入

```text
5 5
1 2
2 3
3 5
1 3
3 4
```

### 样例输出

```text
2 2 3
2 1 3
4 1 2 4 5
1 3
1 3
```

顶点 3 与 1、2、4、5 相邻，虽然输入顺序不同，其输出仍为 4 1 2 4 5。

## 实现任务

修改本题目录中的 `student/main.cpp`，完成 TODO 标记的算法。输入输出骨架可以保留，完整参考实现单独位于 `solution/main.cpp`。

1. 为每条无向边写入两个邻接记录。
2. 分别排序每个顶点的邻居，并以“数量 + 内容”输出，包括空邻接表。

## 正常、边界与错误情况

- 正常情况：按题目定义处理全部输入，输出与输入边的排列顺序无关。
- 孤立点：该行仍必须存在，内容为 0。
- 高编号顶点或星型中心：邻居数量可能远大于其他点。
- 常见错误：输入边未排序；仅输出出现过的顶点会漏掉孤立点。
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
pnpm lab:doctor -- labs/chapter-06/exercise/E-06-07-adjacency-list-normalization
pnpm lab:run -- labs/chapter-06/exercise/E-06-07-adjacency-list-normalization
pnpm lab:run -- labs/chapter-06/exercise/E-06-07-adjacency-list-normalization --case 001-sample
pnpm lab:score -- labs/chapter-06/exercise/E-06-07-adjacency-list-normalization
```

本题有 20 组测试，每组 5 分，总分 100。起始代码可以编译，但尚未实现完整算法；满分需补齐 TODO。作者检查参考解、骨架与预期输出可使用 `pnpm lab:verify -- labs/chapter-06/exercise/E-06-07-adjacency-list-normalization`。

## 正确性说明

每条边在两个端点处分别登记，所以每个顶点的列表恰好包含其邻居。简单图没有重复邻居，列表长度就是度。排序只改变顺序，不改变图。

## 复杂度分析

时间 `O(n+m+sum(d_v log(d_v+1)))`，其中 d_v 为顶点 v 的度；空间 `O(n+m)`，邻接记录总数为 `2m`。

## 完成清单

- [ ] 20 组测试全部通过，得分 100。
- [ ] 样例结果能够手工推导，顶点编号和输出规则没有混淆。
- [ ] 已检查本题的空结构、最小规模、最大规模和易错边界。
- [ ] 能说明每个顶点或每条边如何参与计算，复杂度包含输入输出及排序成本。
- [ ] 已使用本题的 Make 或 pnpm 入口运行学生代码。

## 思考与复盘

1. 为什么不能声称包含排序的整个过程始终是 O(n+m)？
2. 若无向自环也被允许，列表长度与图论中的度还能直接等同吗？
