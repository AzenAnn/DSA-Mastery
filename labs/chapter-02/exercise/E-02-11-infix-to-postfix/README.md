---
title: "Lab 02-E-11：中缀表达式转后缀"
description: "用调度场算法处理优先级、左结合和括号。"
order: 22
chapter: 2
labId: "02E11"
chapterTitle: "栈与队列"
updated: "2026-09-11"
contributors: ["DSA Mastery Team"]
status: "draft"
lab: true
difficulty: "基础"
duration: "35～50 分钟"
---

# Lab 02-E-11：中缀表达式转后缀

## 学习目标

- 用栈、队列或双端队列维护本题要求的访问顺序。
- 处理正常、边界和失败/非法输入场景。
- 说明每个元素至多进入和离开辅助结构一次的复杂度原因。

## 前置知识与环境

建议先学习[第 2 章栈与队列](../../../../content/chapter-02-stack-queue/00-overview.md)。使用 ISO C++17；开始前可在本目录运行 `make doctor`。

## 任务

用调度场算法处理优先级、左结合和括号。

## 输入格式

一行无空格表达式；操作数为单字符 ASCII 字母或数字，运算符仅允许 `+ - * /`，并允许使用圆括号 `(`、`)`。不要求处理一元运算符。

## 输出格式

合法时输出后缀表达式，非法时输出 `ERROR`。

## 数据范围与限制

- 输入规模不超过 `200000`，除题面另有说明外整数使用 64 位有符号范围。
- 标准输出只保留题目要求的结果；调试信息写入标准错误。
- 目标算法应为线性或摊还线性时间，辅助空间不超过 `O(n)`。

## 边界与验收重点

- 最小规模、单元素和重复元素。
- 结构为空、候选全部过期或没有可匹配对象的情况。
- 极值、嵌套结构和混合操作后的状态一致性。

## 如何验证

```powershell
make doctor
make run
make score
```

未安装 Make 时，在仓库根目录运行：

```powershell
pnpm lab:validate -- labs/chapter-02/exercise/E-02-11-infix-to-postfix
pnpm lab:run -- labs/chapter-02/exercise/E-02-11-infix-to-postfix
pnpm lab:score -- labs/chapter-02/exercise/E-02-11-infix-to-postfix
```

- [ ] 全部 25 个公开测试通过。
- [ ] 能解释所选结构为何满足 LIFO/FIFO/单调候选的题意。
- [ ] 能说明最坏或摊还时间复杂度。

## 思考与复盘

1. 若把本题核心结构换成相反的访问顺序，会在哪类输入上出错？
2. 哪个边界用例最能揭示结构不变量被破坏？
