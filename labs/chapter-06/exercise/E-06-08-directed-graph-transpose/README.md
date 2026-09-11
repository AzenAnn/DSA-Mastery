---
title: "Lab 06-E-08：有向图的转置"
description: "反转全部有向边，在规范化输出中保留自环和平行边。"
order: 12
chapter: 6
labId: "06E08"
chapterTitle: "图的基础与存储"
updated: "2026-09-12"
contributors: ["Azen"]
status: "draft"
lab: true
difficulty: "基础"
duration: "35～60 分钟"
---

# Lab 06-E-08：有向图的转置

> 题目来源：[DSA Mastery 6.3](https://azenann.github.io/DSA-Mastery/learn/chapter-06-graph-foundations/03-graph-traversal-connectivity/)。本题为根据课程知识点设计的独立练习，输入输出和数据范围由本 Lab 定义。

## 学习目标

- [ ] 逐条反转输入边并插入新的邻接表。
- [ ] 排序各出边列表，但不要去重；核对转置前后边数相同。
- [ ] 能解释算法正确性与复杂度，并通过正常、边界和回归用例。

## 前置知识

先阅读 [6.3 图的遍历与连通性](../../../../content/chapter-06-graph-foundations/03-graph-traversal-connectivity.md)。环境需要 Node.js、pnpm 和支持 C++17 的编译器；Make 可选，可用下方 pnpm 命令替代。

## 题目

有向图的转置图保持顶点集不变，将每条 u 到 v 的边替换为 v 到 u。输入可能包含自环和平行边，每条输入边都要对应一条转置边。请输出转置图的邻接表。

## 输入格式

第一行 `n m`，随后 `m` 行为有向边 `u v`。

### 数据范围

`1 <= n <= 100000`，`0 <= m <= 200000`，顶点编号 `0..n-1`；允许自环、平行边。

输入为单组有效数据，所有整数和命令按空白分隔。自动评分不包含非法编号、非法命令或违反上述限制的图，不需要额外输出输入校验提示。

## 输出格式

输出 `n` 行，依次对应 `0..n-1`。每行先输出出边条数 k，再输出 k 个升序终点。平行边的终点应重复输出；无出边时输出 `0`。

只向标准输出写入答案；调试信息写入标准错误。按题面规定分行，评分按空白分隔的 token 比较。

## 样例

### 样例输入

```text
3 4
0 1
0 1
1 1
2 0
```

### 样例输出

```text
1 2
3 0 0 1
0
```

输入中有两条 0 到 1 的边，转置后顶点 1 的列表中有两个 0；1 到 1 的自环仍在该列表中。

## 实现任务

修改本题目录中的 `student/main.cpp`，完成 TODO 标记的算法。输入输出骨架可以保留，完整参考实现单独位于 `solution/main.cpp`。

1. 逐条反转输入边并插入新的邻接表。
2. 排序各出边列表，但不要去重；核对转置前后边数相同。

## 正常、边界与错误情况

- 正常情况：按题目定义处理全部输入，输出与输入边的排列顺序无关。
- 空图：输出 n 行 0。
- 自环：转置后仍保留。
- 重边：重复终点不能删去。
- 常见错误：转置不等于把图变无向；使用 set 会错误丢弃平行边。
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
pnpm lab:doctor -- labs/chapter-06/exercise/E-06-08-directed-graph-transpose
pnpm lab:run -- labs/chapter-06/exercise/E-06-08-directed-graph-transpose
pnpm lab:run -- labs/chapter-06/exercise/E-06-08-directed-graph-transpose --case 001-sample
pnpm lab:score -- labs/chapter-06/exercise/E-06-08-directed-graph-transpose
```

本题有 20 组测试，每组 5 分，总分 100。起始代码可以编译，但尚未实现完整算法；满分需补齐 TODO。作者检查参考解、骨架与预期输出可使用 `pnpm lab:verify -- labs/chapter-06/exercise/E-06-08-directed-graph-transpose`。

## 正确性说明

映射 (u,v) 到 (v,u) 是双射，连续转置两次恢复原边，因此不会丢失或增加边。自环仍映射到自身，多条相同边也逐条保留。

## 复杂度分析

建图时间 `O(n+m)`，排序后总时间 `O(n+m+sum(d_v log(d_v+1)))`，d_v 是转置图出度；空间 `O(n+m)`。

## 完成清单

- [ ] 20 组测试全部通过，得分 100。
- [ ] 样例结果能够手工推导，顶点编号和输出规则没有混淆。
- [ ] 已检查本题的空结构、最小规模、最大规模和易错边界。
- [ ] 能说明每个顶点或每条边如何参与计算，复杂度包含输入输出及排序成本。
- [ ] 已使用本题的 Make 或 pnpm 入口运行学生代码。

## 思考与复盘

1. 转置图的出度与原图的哪一种度相同？
2. 为什么在原邻接表上边遍历边追加反向边容易出错？
