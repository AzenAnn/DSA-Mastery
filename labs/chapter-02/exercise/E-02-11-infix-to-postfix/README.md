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

- 用运算符栈实现中缀表达式转后缀表达式。
- 正确处理 `* /` 高于 `+ -`、同级左结合与圆括号。
- 拒绝相邻操作数、缺少操作数和未匹配括号。

## 前置知识与环境

建议先学习[第 2 章栈与队列](../../../../content/chapter-02-stack-queue/00-overview.md)。使用 ISO C++17；开始前可在本目录运行 `make doctor`。

## 任务

操作数直接加入结果；左括号入栈，右括号使运算符弹出至对应左括号；新运算符要先弹出栈顶优先级不低于自身的运算符。这让 `a-b-c` 转成 `ab-c-`。读到不合法字符或语法错误时输出 `ERROR`。

## 输入格式

一行不含空格、长度 `1..200000` 的表达式；操作数是单个 ASCII 字母（`A-Z`、`a-z`）或数字（`0-9`），运算符仅有二元 `+ - * /`，允许圆括号。不接受多位数、隐式乘法、一元正负号或空括号；无需计算数值。

## 输出格式

合法时输出不含空格的后缀表达式并换行；非法时只输出 `ERROR`。

样例 `a+b*c` 转换为 `abc*+`：先计算 `b*c`，再把结果与 `a` 相加。`(a+b)*c` 则得到 `ab+c*`。

## 数据范围与限制

- 输入规模不超过 `200000`，除题面另有说明外整数使用 64 位有符号范围。
- 标准输出只保留题目要求的结果；调试信息写入标准错误。
- 目标算法应为线性或摊还线性时间，辅助空间不超过 `O(n)`。

## 边界与验收重点

- 单个操作数合法；`a+`、`a(b)`、`ab`、`a++b` 和 `()` 非法。
- `a-b-c` 与 `a/b*c` 检查同优先级的左结合。
- 右括号无对应左括号、扫描结束左括号未关闭时输出 `ERROR`。

## 如何验证

```powershell
make doctor
make run
make score
```

未安装 Make 时，在仓库根目录运行：

```powershell
pnpm lab validate labs/chapter-02/exercise/E-02-11-infix-to-postfix
pnpm lab run labs/chapter-02/exercise/E-02-11-infix-to-postfix
pnpm lab score labs/chapter-02/exercise/E-02-11-infix-to-postfix
```

- [ ] 全部 20 个公开测试通过。
- [ ] 能手动转换 `a+b*c`、`(a+b)*c` 和 `a-b-c`。
- [ ] 能说明每个字符最多入栈和出栈一次，时间/空间 `O(n)`。

## 思考与复盘

1. 处理第二个 `-` 时为何要先弹出第一个 `-`？
2. 为什么 `a(b)` 必须判错？

<details><summary>思考题参考</summary>

1. 减法左结合：`a-b-c` 表示 `(a-b)-c`，后缀为 `ab-c-`。
2. 题目不允许隐式乘法，右侧 `(` 前还缺少一个显式二元运算符。

</details>
