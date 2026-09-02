---
title: "Lab 12-E-13：表达式的所有可能计算结果"
description: "以运算符为分割点递归组合左右子表达式结果。"
order: 15
chapter: 12
labId: "12E13"
chapterTitle: "分治与递归"
updated: "2026-09-02"
contributors: ["Zhangyf0325"]
status: "draft"
lab: true
difficulty: "挑战"
duration: "60～80 分钟"
---

# Lab 12-E-13：表达式的所有可能计算结果

## 学习目标

- [ ] 枚举每个运算符作为最后计算位置。
- [ ] 组合左右结果并使用记忆化。
- [ ] 排序去重以形成稳定输出。

## 前置知识与环境

先阅读第 12 章对应内容，并确保本机可使用 C++17。首次运行可执行 `make doctor`；Windows 未安装 Make 时可在仓库根使用 pnpm 命令。

## 题目

以运算符为分割点递归组合左右子表达式结果。

### 输入格式

输入一个仅含非负整数和 `+`、`-`、`*` 的表达式。

### 输出格式

输出所有不同结果，按升序排列。

### 数据范围

表达式长度不超过 `25`，运算结果在 64 位有符号整数范围内。

## 示例

### 输入

```text
2-1-1
```

### 输出

```text
0 2
```

## 测试设计提示

公开测试至少 10 组、总分 100 分，覆盖样例、边界、典型错误与适度压力输入。测试只接受标准输出；调试信息请写到标准错误。

## 运行与评分

```powershell
cd labs/chapter-12/exercise/E-12-13-different-ways-to-compute
make run
make score

# 没有 Make 时，在仓库根执行
pnpm lab:run -- labs/chapter-12/exercise/E-12-13-different-ways-to-compute
pnpm lab:score -- labs/chapter-12/exercise/E-12-13-different-ways-to-compute
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
