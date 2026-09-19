---
title: "Lab 02-E-09：括号匹配"
description: "用栈验证多种括号的嵌套关系。"
order: 20
chapter: 2
labId: "02E09"
chapterTitle: "栈与队列"
updated: "2026-09-11"
contributors: ["DSA Mastery Team"]
status: "draft"
lab: true
difficulty: "基础"
duration: "35～50 分钟"
---

# Lab 02-E-09：括号匹配

## 学习目标

- 用栈保存尚未匹配的左括号，并只与最近的左括号配对。
- 区分类型错误、先遇到右括号和扫描结束仍有左括号三种失败。
- 解释为何每个括号只入栈或出栈一次。

## 前置知识与环境

建议先学习[第 2 章栈与队列](../../../../content/chapter-02-stack-queue/00-overview.md)。使用 ISO C++17；开始前可在本目录运行 `make doctor`。

## 任务

从左到右扫描输入。遇到 `(`、`[`、`{` 时等待匹配；遇到 `)`、`]`、`}` 时，它必须与最近尚未匹配的左括号同类。其他 ASCII 非空白字符（包括字母和尖括号）不参与配对，直接跳过。

## 输入格式

一行字符串 `s`，仅含 ASCII 非空白字符，可含括号与普通字符；长度 `1..200000`。空字符串不作为输入。

## 输出格式

所有括号正确配对且没有剩余左括号时输出 `YES`，否则输出 `NO`，末尾换行。

例如 `a{[b](c)}d` 输出 `YES`；`([)]` 输出 `NO`，因为遇到 `)` 时最近的左括号是 `[`。

## 数据范围与限制

- 输入规模不超过 `200000`，除题面另有说明外整数使用 64 位有符号范围。
- 标准输出只保留题目要求的结果；调试信息写入标准错误。
- 目标算法应为线性或摊还线性时间，辅助空间不超过 `O(n)`。

## 边界与验收重点

- 单个左括号和单个右括号都应输出 `NO`。
- `([)]` 的数量相同仍不匹配；`{[()]}` 则正确嵌套。
- 普通字符不改变等待配对的栈；字符串末尾不能留下左括号。

## 如何验证

```powershell
make doctor
make run
make score
```

未安装 Make 时，在仓库根目录运行：

```powershell
pnpm lab:validate -- labs/chapter-02/exercise/E-02-09-bracket-matching
pnpm lab:run -- labs/chapter-02/exercise/E-02-09-bracket-matching
pnpm lab:score -- labs/chapter-02/exercise/E-02-09-bracket-matching
```

- [ ] 全部 20 个公开测试通过。
- [ ] 能指出第一处不匹配及其对应的栈顶。
- [ ] 能证明时间 `O(|s|)`、额外空间 `O(|s|)`。

## 思考与复盘

1. 为什么 `([)]` 不能只按三类括号的数量判断？
2. 若右括号出现时栈为空，能否继续扫描后续字符使整个字符串合法？

<details><summary>思考题参考</summary>

1. 嵌套要求最近打开的括号最先关闭；`([)]` 的第一个 `)` 无法关闭栈顶 `[`。
2. 不能。这个右括号没有任何位于它之前的左括号可配对，之后的字符无法补救。

</details>
