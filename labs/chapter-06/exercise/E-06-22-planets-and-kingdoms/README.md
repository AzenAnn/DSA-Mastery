---
title: "Lab 06-E-22：Planets and Kingdoms"
description: "用 Kosaraju 划分全部强连通分量，并消除遍历顺序对编号的影响。"
order: 26
chapter: 6
labId: "06E22"
chapterTitle: "图的基础与存储"
updated: "2026-09-12"
contributors: ["Azen"]
status: "draft"
lab: true
difficulty: "进阶"
duration: "75～100 分钟"
---

# Lab 06-E-22：Planets and Kingdoms

> 题目来源：[CSES 1683](https://cses.fi/problemset/task/1683/)。本 Lab 使用下述本地数据范围与规范化输出。原题允许任意有效答案，本地评分按明确的规范化规则比较；样例为课程样例。

## 学习目标

- [ ] 第一次完整 DFS 记录顶点的退出顺序，用显式栈帧保留邻居游标。
- [ ] 按退出顺序逆序在转置图遍历，每次得到一个 SCC。
- [ ] 按原顶点升序扫描，将原始 SCC 编号转换为最小顶点升序编号。
- [ ] 能解释算法正确性与复杂度，并通过正常、边界和回归用例。

## 前置知识

先阅读 [6.3 图的遍历与连通性](../../../../content/chapter-06-graph-foundations/03-graph-traversal-connectivity.md)。环境需要 Node.js、pnpm 和支持 C++17 的编译器；Make 可选，可用下方 pnpm 命令替代。

## 题目

星球间存在有向通道。若两个星球能够互相到达，它们属于同一个王国；每个王国就是一个强连通分量。求王国数量及每个星球所属编号。本 Lab 按每个王国最小星球编号的升序，将王国规范编号为 1..k；编号不一定是拓扑序。

## 输入格式

第一行 `n m`，随后 m 行有向通道 `u v`。

### 数据范围

本 Lab：`1 <= n <= 100000`，`0 <= m <= 200000`，星球编号 `1..n`；允许自环和平行边。

输入为单组有效数据，所有整数和命令按空白分隔。自动评分不包含非法编号、非法命令或违反上述限制的图，不需要额外输出输入校验提示。

## 输出格式

第一行王国数 k；第二行 n 个整数，按星球 1..n 的顺序输出其规范王国编号。

只向标准输出写入答案；调试信息写入标准错误。按题面规定分行，评分按空白分隔的 token 比较。

## 样例

### 样例输入

```text
5 6
1 3
3 1
2 4
4 2
3 2
4 5
```

### 样例输出

```text
3
1 2 1 2 3
```

{1,3} 互达、{2,4} 互达、5 单独成组，虽有跨组单向通道，仍分成三个王国，标签是 1 2 1 2 3。

## 实现任务

修改本题目录中的 `student/main.cpp`，完成 TODO 标记的算法。输入输出骨架可以保留，完整参考实现单独位于 `solution/main.cpp`。

1. 第一次完整 DFS 记录顶点的退出顺序，用显式栈帧保留邻居游标。
2. 按退出顺序逆序在转置图遍历，每次得到一个 SCC。
3. 按原顶点升序扫描，将原始 SCC 编号转换为最小顶点升序编号。

## 正常、边界与错误情况

- 正常情况：按题目定义处理全部输入，输出与输入边的排列顺序无关。
- DAG：每点都是独立王国。
- 一整个有向环：一个王国。
- 多个 SCC 单向连接：不能合并成一个。
- 常见错误：入栈或发现顺序不是退出顺序；第一次 DFS 遇到已访问点必须跳过，第二次要使用反图。
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
pnpm lab:doctor -- labs/chapter-06/exercise/E-06-22-planets-and-kingdoms
pnpm lab:run -- labs/chapter-06/exercise/E-06-22-planets-and-kingdoms
pnpm lab:run -- labs/chapter-06/exercise/E-06-22-planets-and-kingdoms --case 001-sample
pnpm lab:score -- labs/chapter-06/exercise/E-06-22-planets-and-kingdoms
```

本题有 20 组测试，每组 5 分，总分 100。起始代码可以编译，但尚未实现完整算法；满分需补齐 TODO。作者检查参考解、骨架与预期输出可使用 `pnpm lab:verify -- labs/chapter-06/exercise/E-06-22-planets-and-kingdoms`。

## 正确性说明

将 SCC 缩成 DAG。若原图有跨分量边 C 到 D，则 C 的最大 DFS 退出时间大于 D 的最大退出时间。按退出时间递减处理转置图时，当前分量无法进入尚未处理的其他分量，因此每次遍历恰好取出一个 SCC。最终重编号只改变标签，不改变划分。

## 复杂度分析

时间 `O(n+m)`，空间 `O(n+m)`；最小顶点规范化通过一次顶点扫描完成，不必排序全部顶点。

## 完成清单

- [ ] 20 组测试全部通过，得分 100。
- [ ] 样例结果能够手工推导，顶点编号和输出规则没有混淆。
- [ ] 已检查本题的空结构、最小规模、最大规模和易错边界。
- [ ] 能说明每个顶点或每条边如何参与计算，复杂度包含输入输出及排序成本。
- [ ] 已使用本题的 Make 或 pnpm 入口运行学生代码。

## 思考与复盘

1. 为什么迭代 DFS 需要记录“下一条待探索的边”，而非只把顶点压栈？
2. 按最小顶点得到的规范编号与拓扑排序有什么区别？
