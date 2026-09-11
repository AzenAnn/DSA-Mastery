---
title: "Lab 06-E-21：Flight Routes Check"
description: "通过原图和转置图的两次遍历判断强连通，并给出不可达见证。"
order: 25
chapter: 6
labId: "06E21"
chapterTitle: "图的基础与存储"
updated: "2026-09-12"
contributors: ["Azen"]
status: "draft"
lab: true
difficulty: "进阶"
duration: "75～100 分钟"
---

# Lab 06-E-21：Flight Routes Check

> 题目来源：[CSES 1682](https://cses.fi/problemset/task/1682/)。本 Lab 使用下述本地数据范围与规范化输出。原题允许任意有效答案，本地评分按明确的规范化规则比较；样例为课程样例。

## 学习目标

- [ ] 从 1 遍历原图，按编号找第一个未访问顶点。
- [ ] 若原图遍历全部可达，再从 1 遍历转置图，检查是否每点都能回到 1。
- [ ] 能解释算法正确性与复杂度，并通过正常、边界和回归用例。

## 前置知识

先阅读 [6.3 图的遍历与连通性](../../../../content/chapter-06-graph-foundations/03-graph-traversal-connectivity.md)。环境需要 Node.js、pnpm 和支持 C++17 的编译器；Make 可选，可用下方 pnpm 命令替代。

## 题目

城市之间的航线有方向。判断任意城市 a 是否都能沿航线到达任意城市 b。若不能，输出一个不可达的有序点对。为了让答案唯一，先检查从城市 1 无法到达的城市，若存在则取最小编号 v 并输出 1 v；否则取无法到达城市 1 的最小编号 v，输出 v 1。

## 输入格式

第一行 `n m`，随后 m 行有向航线 `u v`。

### 数据范围

本 Lab：`1 <= n <= 100000`，`0 <= m <= 200000`，城市编号 `1..n`；允许自环和平行边。

输入为单组有效数据，所有整数和命令按空白分隔。自动评分不包含非法编号、非法命令或违反上述限制的图，不需要额外输出输入校验提示。

## 输出格式

强连通时输出一行 `YES`。否则第一行 `NO`，第二行输出按上述优先级选择的不可达有序点对 `a b`，表示 a 无法到达 b。

只向标准输出写入答案；调试信息写入标准错误。按题面规定分行，评分按空白分隔的 token 比较。

## 样例

### 样例输入

```text
4 3
1 2
2 3
3 4
```

### 样例输出

```text
NO
2 1
```

1 能沿链到达全部城市，但城市 2 无法回到 1，按规则输出 NO 和 2 1。

## 实现任务

修改本题目录中的 `student/main.cpp`，完成 TODO 标记的算法。输入输出骨架可以保留，完整参考实现单独位于 `solution/main.cpp`。

1. 从 1 遍历原图，按编号找第一个未访问顶点。
2. 若原图遍历全部可达，再从 1 遍历转置图，检查是否每点都能回到 1。

## 正常、边界与错误情况

- 正常情况：按题目定义处理全部输入，输出与输入边的排列顺序无关。
- 单点空图：YES。
- 从 1 出发的单向链：能向外到达但不能返回，NO。
- 两种失败同时存在：优先输出正向失败的最小编号。
- 常见错误：只有“1 能到达所有点”不足以证明强连通；反图中的不可达见证必须交换方向。
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
pnpm lab:doctor -- labs/chapter-06/exercise/E-06-21-flight-routes-check
pnpm lab:run -- labs/chapter-06/exercise/E-06-21-flight-routes-check
pnpm lab:run -- labs/chapter-06/exercise/E-06-21-flight-routes-check --case 001-sample
pnpm lab:score -- labs/chapter-06/exercise/E-06-21-flight-routes-check
```

本题有 20 组测试，每组 5 分，总分 100。起始代码可以编译，但尚未实现完整算法；满分需补齐 TODO。作者检查参考解、骨架与预期输出可使用 `pnpm lab:verify -- labs/chapter-06/exercise/E-06-21-flight-routes-check`。

## 正确性说明

若所有点都能从 1 到达且都能到达 1，则任意 a 到 b 可经过 a 到 1 到 b，故图强连通。反之，任一次遍历发现未访问点就直接给出对应方向的不可达见证。

## 复杂度分析

时间 `O(n+m)`，空间 `O(n+m)`，不需要从每个点分别遍历。

## 完成清单

- [ ] 20 组测试全部通过，得分 100。
- [ ] 样例结果能够手工推导，顶点编号和输出规则没有混淆。
- [ ] 已检查本题的空结构、最小规模、最大规模和易错边界。
- [ ] 能说明每个顶点或每条边如何参与计算，复杂度包含输入输出及排序成本。
- [ ] 已使用本题的 Make 或 pnpm 入口运行学生代码。

## 思考与复盘

1. 两次遍历的固定起点可以换成其他顶点吗？证明还成立吗？
2. 为什么只求弱连通分量数无法解决本题？
