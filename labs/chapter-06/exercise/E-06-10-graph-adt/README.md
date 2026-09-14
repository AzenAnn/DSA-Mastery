---
title: "Lab 06-E-10：Graph ADT：边的增删查"
description: "封装简单图的动态边操作，并维护无向图的双向一致性。"
order: 14
chapter: 6
labId: "06E10"
chapterTitle: "图的基础与存储"
updated: "2026-09-12"
contributors: ["Azen"]
status: "draft"
lab: true
difficulty: "基础"
duration: "35～60 分钟"
---

# Lab 06-E-10：Graph ADT：边的增删查

> 题目来源：[DSA Mastery 6.2](https://azenann.github.io/DSA-Mastery/learn/chapter-06-graph-foundations/02-graph-storage/)。本题为根据课程知识点设计的独立练习，输入输出和数据范围由本 Lab 定义。

## 学习目标

- [ ] 实现 add、remove、has 三个操作，返回值反映当前操作的效果。
- [ ] 确保 U 在两个方向同步增删，D 只修改指定方向。
- [ ] 能解释算法正确性与复杂度，并通过正常、边界和回归用例。

## 前置知识

先阅读 [6.2 图的存储结构](../../../../content/chapter-06-graph-foundations/02-graph-storage.md)。环境需要 Node.js、pnpm 和支持 C++17 的编译器；Make 可选，可用下方 pnpm 命令替代。

## 题目

图最初有 n 个顶点而没有边。依次处理 ADD、DEL、HAS 三类操作；图类型在整个输入中不变。重复添加不能产生重边，删除不存在的边不改变图。

## 输入格式

首行 `type n q`，type 为 U 或 D。随后 q 行，每行命令 `ADD u v`、`DEL u v` 或 `HAS u v`。

### 数据范围

`1 <= n <= 100000`，`0 <= q <= 200000`，顶点编号 `0..n-1`，每条操作 `u!=v`；命令和编号保证合法。U 中 {u,v} 与 {v,u} 是同一条边；D 中两者独立。

输入为单组有效数据，所有整数和命令按空白分隔。自动评分不包含非法编号、非法命令或违反上述限制的图，不需要额外输出输入校验提示。

## 输出格式

每条操作输出一行 0/1：ADD 新增边返回 1、原已存在返回 0；DEL 删除已有边返回 1、边不存在返回 0；HAS 存在返回 1，否则返回 0。q=0 时无输出。

只向标准输出写入答案；调试信息写入标准错误。按题面规定分行，评分按空白分隔的 token 比较。

## 样例

### 样例输入

```text
U 3 7
ADD 0 1
HAS 1 0
ADD 1 0
DEL 1 0
HAS 0 1
DEL 0 1
HAS 0 2
```

### 样例输出

```text
1
1
0
1
0
0
0
```

首次 ADD 0 1 成功，HAS 1 0 在无向图中为真；再次反向添加不改变图。反向删除后，两种方向的查询都应为假。

## 实现任务

修改本题目录中的 `student/main.cpp`，完成 TODO 标记的算法。输入输出骨架可以保留，完整参考实现单独位于 `solution/main.cpp`。

1. 实现 add、remove、has 三个操作，返回值反映当前操作的效果。
2. 确保 U 在两个方向同步增删，D 只修改指定方向。

## 正常、边界与错误情况

- 正常情况：严格按操作顺序更新图，每个返回值对应操作发生时的状态。
- 反向重复 ADD：U 返回 0，D 可返回 1。
- 连续 DEL 同一条边：首次成功后再删返回 0。
- q=0：不要输出额外的 0。
- 常见错误：ADD/DEL 的返回值是“是否产生变更”，不是操作结束后边是否存在。
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
pnpm lab:doctor -- labs/chapter-06/exercise/E-06-10-graph-adt
pnpm lab:run -- labs/chapter-06/exercise/E-06-10-graph-adt
pnpm lab:run -- labs/chapter-06/exercise/E-06-10-graph-adt --case 001-sample
pnpm lab:score -- labs/chapter-06/exercise/E-06-10-graph-adt
```

本题有 20 组测试，每组 5 分，总分 100。起始代码可以编译，但尚未实现完整算法；满分需补齐 TODO。作者检查参考解、骨架与预期输出可使用 `pnpm lab:verify -- labs/chapter-06/exercise/E-06-10-graph-adt`。

## 正确性说明

初始空图满足简单性与无向对称性。ADD 使用集合确保唯一性，DEL 删除集合中已有元素；U 对两端执行相同变更，维持对称关系。HAS 只读，所以这些不变量在所有操作后仍成立。

## 复杂度分析

使用每个顶点的有序集合，单次操作 `O(log(n+1))`，总时间 `O(n+q log(n+1))`，空间 `O(n+e)`，e 为当前边数。

## 完成清单

- [ ] 20 组测试全部通过，得分 100。
- [ ] 样例结果能够手工推导，顶点编号和输出规则没有混淆。
- [ ] 已检查本题的空结构、最小规模、最大规模和易错边界。
- [ ] 能说明每个顶点或每条边如何参与计算，复杂度包含输入输出及排序成本。
- [ ] 已使用本题的 Make 或 pnpm 入口运行学生代码。

## 思考与复盘

1. 用 vector 保存邻居时，删除操作的复杂度如何变化？
2. 为什么 has 应当是 const 成员函数？
