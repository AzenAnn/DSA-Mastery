---
title: "Lab 06-E-23：SCC 凝聚图构造"
description: "将每个强连通分量缩成一个点，构造无自环、无重边的有向无环图。"
order: 27
chapter: 6
labId: "06E23"
chapterTitle: "图的基础与存储"
updated: "2026-09-12"
contributors: ["Azen"]
status: "draft"
lab: true
difficulty: "进阶"
duration: "75～100 分钟"
---

# Lab 06-E-23：SCC 凝聚图构造

> 题目来源：[DSA Mastery 6.3](https://azenann.github.io/DSA-Mastery/learn/chapter-06-graph-foundations/03-graph-traversal-connectivity/)。本题为根据课程知识点设计的独立练习，输入输出和数据范围由本 Lab 定义。

## 学习目标

- [ ] 计算所有 SCC，并按最小原顶点重编号。
- [ ] 遍历原边，丢弃端点标签相等的边，其余映射到分量编号对。
- [ ] 排序编号对并去重，再输出 k、p、顶点映射与边集。
- [ ] 能解释算法正确性与复杂度，并通过正常、边界和回归用例。

## 前置知识

先阅读 [6.3 图的遍历与连通性](../../../../content/chapter-06-graph-foundations/03-graph-traversal-connectivity.md)。环境需要 Node.js、pnpm 和支持 C++17 的编译器；Make 可选，可用下方 pnpm 命令替代。

## 题目

把有向图的每个 SCC 缩成一个新顶点。原图中连接不同 SCC 的边在新图中保留；同一 SCC 内部的边丢弃，重复的跨分量边只保留一次。新顶点按所属 SCC 最小原顶点的升序编号为 1..k，请输出映射与规范凝聚图。

## 输入格式

第一行 `n m`，随后 m 行有向边 `u v`。

### 数据范围

`1 <= n <= 100000`，`0 <= m <= 200000`，原顶点编号 `0..n-1`，SCC 编号 `1..k`；输入允许自环和平行边，输出凝聚图禁止自环和重边。

输入为单组有效数据，所有整数和命令按空白分隔。自动评分不包含非法编号、非法命令或违反上述限制的图，不需要额外输出输入校验提示。

## 输出格式

第一行 `k p`，表示 SCC 数和去重后的凝聚边数；第二行按原顶点 0..n-1 输出 n 个规范 SCC 标签；随后 p 行凝聚边 `a b`，按 a 升序、a 相同时按 b 升序排列。p=0 时不输出边行。

只向标准输出写入答案；调试信息写入标准错误。按题面规定分行，评分按空白分隔的 token 比较。

## 样例

### 样例输入

```text
5 10
0 2
2 0
1 3
3 1
2 1
3 4
0 1
2 3
0 0
4 4
```

### 样例输出

```text
3 2
1 2 1 2 3
1 2
2 3
```

SCC 为 {0,2}、{1,3}、{4}，规范标签为 1 2 1 2 3。多条原边映射成同一条 1 到 2 的边，去重后只保留 1 2 和 2 3。

## 实现任务

修改本题目录中的 `student/main.cpp`，完成 TODO 标记的算法。输入输出骨架可以保留，完整参考实现单独位于 `solution/main.cpp`。

1. 计算所有 SCC，并按最小原顶点重编号。
2. 遍历原边，丢弃端点标签相等的边，其余映射到分量编号对。
3. 排序编号对并去重，再输出 k、p、顶点映射与边集。

## 正常、边界与错误情况

- 正常情况：按题目定义处理全部输入，输出与输入边的排列顺序无关。
- 自环和 SCC 内部普通边都要丢弃。
- 不同原边连接同一对 SCC：输出一次。
- 空图有 n 个 SCC，但 p=0。
- 常见错误：不能在原图上直接去重后就忽略 SCC 内部边；不同原边也可能映射为同一条凝聚边。
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
pnpm lab:doctor -- labs/chapter-06/exercise/E-06-23-scc-condensation
pnpm lab:run -- labs/chapter-06/exercise/E-06-23-scc-condensation
pnpm lab:run -- labs/chapter-06/exercise/E-06-23-scc-condensation --case 001-sample
pnpm lab:score -- labs/chapter-06/exercise/E-06-23-scc-condensation
```

本题有 20 组测试，每组 5 分，总分 100。起始代码可以编译，但尚未实现完整算法；满分需补齐 TODO。作者检查参考解、骨架与预期输出可使用 `pnpm lab:verify -- labs/chapter-06/exercise/E-06-23-scc-condensation`。

## 正确性说明

每条跨 SCC 的原边准确产生一条分量间关系，去重不改变这种关系。若凝聚图存在有向环，环上各 SCC 将两两互达，应属于同一 SCC，与划分定义矛盾，因此凝聚图必为 DAG。

## 复杂度分析

SCC 划分与规范化 `O(n+m)`，凝聚边排序去重 `O(m log(m+1))`，总空间 `O(n+m)`。

## 完成清单

- [ ] 20 组测试全部通过，得分 100。
- [ ] 样例结果能够手工推导，顶点编号和输出规则没有混淆。
- [ ] 已检查本题的空结构、最小规模、最大规模和易错边界。
- [ ] 能说明每个顶点或每条边如何参与计算，复杂度包含输入输出及排序成本。
- [ ] 已使用本题的 Make 或 pnpm 入口运行学生代码。

## 思考与复盘

1. 凝聚图为什么一定无环？
2. 如果要求保留两分量间的边数而非去重，输出和数据结构应如何调整？
