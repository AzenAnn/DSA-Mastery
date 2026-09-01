---
title: "Lab 11-E-07：快速排序模板"
description: "手写快速排序，掌握划分（partition）与分治递归的完整模板。"
order: 13
chapter: 11
labId: "11E07"
chapterTitle: "高效排序与外部排序"
updated: "2026-08-29"
contributors: ["fjll-27"]
status: "draft"
lab: true
difficulty: "基础"
duration: "20～30 分钟"
---

# Lab 11-E-07：快速排序模板

难度：基础。题目原型为洛谷 [U116552 快速排序模板](https://www.luogu.com.cn/problem/U116552)（私题，题面自定）。本题的考点是**快速排序的分治与划分**：每次选一个基准，把小于、等于、大于基准的元素分到三段，再递归排序两侧。

## 目标

完成本题后，你应该能够：

- 写出快速排序的递归骨架与划分逻辑；
- 用三路划分（小于 / 等于 / 大于基准）正确处理重复元素；
- 说出快速排序的平均时间复杂度 `O(n log n)` 以及最坏情况出现的原因。

## 前置知识

- 11.2 快速排序的分治思想；
- 递归与数组区间 `[l, r]` 的写法。

## 题目

读入 `n` 和 `n` 个整数，用快速排序把它们从小到大排序后输出一行。

### 输入格式

- 第一行一个整数 `n`；
- 第二行 `n` 个整数。

### 输出格式

一行 `n` 个整数，从小到大排列，空格分隔。

## 数据范围

| 项目 | 范围 |
| --- | --- |
| 数组长度 `n` | 1 ≤ n ≤ 10⁵ |
| 元素值 | −10⁹ ≤ a[i] ≤ 10⁹ |

## 样例

### 样例输入

```input
5
4 2 4 5 1
```

### 样例输出

```output
1 2 4 4 5
```

### 样例解释

`4 2 4 5 1` 排序后为 `1 2 4 4 5`，注意重复的 `4` 都保留。

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
pnpm lab:run -- labs/chapter-11/exercise/E-11-07-quick-sort-template
pnpm lab:score -- labs/chapter-11/exercise/E-11-07-quick-sort-template
```

标准输出参与判题，调试信息请写入标准错误。

## 完成清单

- [ ] 样例输出与题目一致
- [ ] 升序、降序、含重复值、含负数四种情况都通过
- [ ] 能画出一次三路划分后 `[l, i)`、`[i, j]`、`(j, r]` 三段分别放什么

## 思考题

1. 如果每次基准都选到区间最小值，快速排序会退化成什么复杂度？对应什么输入？
2. 三路划分为什么比「小于放左、其余放右」的两路划分更适合大量重复元素的场景？

## 题解

<details>
<summary>点击查看题解</summary>

### 思路

在区间 `[l, r]` 内取一个基准 `pivot`，用三个指针维护三段：

- `[l, i)`：小于 `pivot`；
- `[i, j]`：等于 `pivot`；
- `(j, r]`：大于 `pivot`。

划分完成后，等于 `pivot` 的元素已就位，只需递归排序两侧。基准取区间中点可避免升序 / 降序输入时的最坏情况。

### 复杂度分析

- 时间复杂度：平均 `O(n log n)`，最坏 `O(n²)`；
- 空间复杂度：`O(log n)`（递归栈）。

</details>
