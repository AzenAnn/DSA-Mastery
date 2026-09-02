---
title: "Lab 12-E-09：快速选择：第 K 大元素"
description: "基于 partition 只递归目标所在一侧。"
order: 11
chapter: 12
labId: "12E09"
chapterTitle: "分治与递归"
updated: "2026-09-02"
contributors: ["Zhangyf0325"]
status: "draft"
lab: true
difficulty: "进阶"
duration: "45～60 分钟"
---

# Lab 12-E-09：快速选择：第 K 大元素

## 学习目标

- [ ] 把第 K 大转换为升序目标下标。
- [ ] 每次只处理包含目标的一侧。
- [ ] 分析平均 O(n) 与最坏 O(n²)。

## 前置知识与环境

先阅读第 12 章对应内容，并确保本机可使用 C++17。首次运行可执行 `make doctor`；Windows 未安装 Make 时可在仓库根使用 pnpm 命令。

## 题目

基于 partition 只递归目标所在一侧。

### 输入格式

第一行 `n k`，第二行 `n` 个整数。

### 输出格式

输出第 `k` 大元素，其中 `k` 从 1 开始。

### 数据范围

`1 ≤ k ≤ n ≤ 200000`。

## 示例

### 输入

```text
6 2
3 2 1 5 6 4
```

### 输出

```text
5
```

## 测试设计提示

公开测试至少 10 组、总分 100 分，覆盖样例、边界、典型错误与适度压力输入。测试只接受标准输出；调试信息请写到标准错误。

## 运行与评分

```powershell
cd labs/chapter-12/exercise/E-12-09-kth-largest-quickselect
make run
make score

# 没有 Make 时，在仓库根执行
pnpm lab:run -- labs/chapter-12/exercise/E-12-09-kth-largest-quickselect
pnpm lab:score -- labs/chapter-12/exercise/E-12-09-kth-largest-quickselect
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
