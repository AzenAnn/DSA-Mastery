---
title: "Lab 11-17：最小堆模板"
description: "用小根堆维护动态集合的最小值，支持插入与「删除并输出堆顶」两类操作。"
order: 17
chapter: 11
chapterTitle: "高效排序与外部排序"
updated: "2026-08-29"
contributors: ["fjll-27"]
status: "draft"
lab: true
difficulty: "进阶"
duration: "20～30 分钟"
---

# Lab 11-17：最小堆模板

难度：进阶。题目原型为洛谷 [P3378【模板】堆](https://www.luogu.com.cn/problem/P3378)。本题的考点是**用小根堆动态维护集合最小值**：堆顶永远是当前最小元素，插入与取最小都能在 `O(log n)` 内完成。

## 目标

完成本题后，你应该能够：

- 用 `std::priority_queue` 声明小根堆并完成插入、取最小；
- 解释小根堆的堆序性质为什么能让「堆顶即最小」；
- 说明 `priority_queue` 默认大根堆，如何改成小根堆。

## 前置知识

- 11.1 堆（完全二叉树）与堆序性质；
- 堆的插入（上浮）与删除堆顶（下沉）操作。

## 题目

有 `n` 次操作，每行是以下两种之一：

- `1 x`：把整数 `x` 插入堆中；
- `2`：删除并输出当前堆顶（最小）元素。

用小根堆实现。

### 输入格式

- 第一行一个整数 `n`；
- 接下来 `n` 行，每行一个操作，格式如上。

### 输出格式

对每个 `2` 操作，输出一行一个整数，表示当前最小的元素。

## 数据范围

| 项目 | 范围 |
| --- | --- |
| 操作次数 `n` | 1 ≤ n ≤ 10⁶ |
| 元素值 | −2³⁰ ≤ x ≤ 2³⁰ |

## 样例

### 样例输入

```input
5
1 5
1 3
2
1 9
2
```

### 样例输出

```output
3
5
```

### 样例解释

- 插入 `5`、`3` 后，堆顶为 `3`；
- 第一个 `2` 输出 `3` 并删除；
- 插入 `9` 后堆为 `{5, 9}`，第二个 `2` 输出 `5`。

## 如何验证

先安装 Node.js、pnpm 和支持 C++17 的编译器。

```powershell
# 已进入本 Lab 目录
make doctor
make run
make run CASE=001-sample
make interactive
make score
```

Windows 没有安装 Make 时，在仓库根目录使用等价的 pnpm 入口：

```powershell
pnpm lab:run -- labs/chapter-11/lab-11-17-min-heap-template
pnpm lab:score -- labs/chapter-11/lab-11-17-min-heap-template
```

标准输出参与判题，调试信息请写入标准错误。

## 完成清单

- [ ] 样例输出与题目一致
- [ ] 含负值、重复值、边界值 `±2³⁰` 的情况都通过
- [ ] 能说出小根堆插入与取堆顶的时间复杂度

## 思考题

1. 为什么 `2` 操作只删除堆顶，而不需要删除集合中任意元素？
2. 若题目改成「删除并输出最大值」，实现上需要改哪里？

## 题解

<details>
<summary>点击查看题解</summary>

### 思路

`std::priority_queue` 默认是大根堆。要得到小根堆，需要指定比较器：

```cpp
priority_queue<long long, vector<long long>, greater<long long>> pq;
```

- `1 x`：`pq.push(x)`；
- `2`：输出 `pq.top()` 后 `pq.pop()`。

### 复杂度分析

- 每次插入 / 取堆顶：`O(log n)`；
- 总时间复杂度：`O(n log n)`；
- 空间复杂度：`O(n)`。

</details>
