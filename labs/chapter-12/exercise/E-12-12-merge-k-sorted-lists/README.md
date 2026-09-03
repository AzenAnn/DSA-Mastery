---
title: "Lab 12-E-12：分治合并 K 个有序链表"
description: "按链表编号区间二分，递归合并 K 条有序链表。"
order: 14
chapter: 12
labId: "12E12"
chapterTitle: "分治与递归"
updated: "2026-09-02"
contributors: ["Zhangyf0325"]
status: "draft"
lab: true
difficulty: "进阶"
duration: "55～75 分钟"
---

# Lab 12-E-12：分治合并 K 个有序链表

## 学习目标

- [ ] 把 K 条链表递归分成两组。
- [ ] 复用两链表合并函数。
- [ ] 解释 O(N log K) 时间复杂度。

## 前置知识与环境

先阅读第 12 章对应内容，并确保本机可使用 C++17。首次运行可执行 `make doctor`；Windows 未安装 Make 时可在仓库根使用 pnpm 命令。

## 题目

按链表编号区间二分，递归合并 K 条有序链表。

### 输入格式

第一行 `k`；随后每行先给长度，再给该链表的非降序元素。

### 输出格式

输出合并后的非降序序列；无节点时输出空行。

### 数据范围

`0 ≤ k ≤ 1000`，总节点数不超过 `5000`。

## 示例

### 输入

```text
3
3 1 4 5
3 1 3 4
2 2 6
```

### 输出

```text
1 1 2 3 4 4 5 6
```

## 测试设计提示

公开测试至少 10 组、总分 100 分，覆盖样例、边界、典型错误与适度压力输入。测试只接受标准输出；调试信息请写到标准错误。

## 运行与评分

```powershell
cd labs/chapter-12/exercise/E-12-12-merge-k-sorted-lists
make run
make score

# 没有 Make 时，在仓库根执行
pnpm lab:run -- labs/chapter-12/exercise/E-12-12-merge-k-sorted-lists
pnpm lab:score -- labs/chapter-12/exercise/E-12-12-merge-k-sorted-lists
```

## 完成清单

- [ ] `student/main.cpp` 已替换占位逻辑，并能通过编译。
- [ ] 公开测试全部通过，评分为 100/100。
- [ ] 能说明递归函数语义、边界、规模缩小方式和复杂度。
- [ ] 主动构造了一个会击穿常见错误的额外输入。

## 思考与复盘

1. 递归函数对输入区间或问题规模承诺了什么？
2. 哪个最小反例最容易暴露边界错误？
3. 能否改写为迭代算法？两种写法的空间复杂度有何区别？
