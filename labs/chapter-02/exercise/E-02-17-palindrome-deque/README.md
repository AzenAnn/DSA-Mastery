---
title: "Lab 02-E-17：双端队列回文检查"
description: "从两端收缩比较字符，判断字符串是否回文。"
order: 28
chapter: 2
labId: "02E17"
chapterTitle: "栈与队列"
updated: "2026-09-11"
contributors: ["DSA Mastery Team"]
status: "draft"
lab: true
difficulty: "基础"
duration: "35～50 分钟"
---

# Lab 02-E-17：双端队列回文检查

## 学习目标

- 从字符串或双端队列的首尾取字符比较，直到中间相遇。
- 区分奇数与偶数长度，并明确大小写、数字和标点处理范围。
- 证明最多检查一半的字符对。

## 前置知识与环境

建议先学习[第 2 章栈与队列](../../../../content/chapter-02-stack-queue/00-overview.md)。使用 ISO C++17；开始前可在本目录运行 `make doctor`。

## 任务

判断字符串从左到右与从右到左是否逐字符相同。按输入字符原样比较，不进行大小写转换、删空格或忽略数字；例如 `abba` 是回文，`abca` 不是。

## 输入格式

一行仅含小写英文字母 `a-z` 与数字 `0-9` 的非空字符串，长度 `1..200000`，不含空格或标点。

## 输出格式

回文输出 `YES`，否则输出 `NO`。

## 数据范围与限制

- 输入规模不超过 `200000`，除题面另有说明外整数使用 64 位有符号范围。
- 标准输出只保留题目要求的结果；调试信息写入标准错误。
- 目标算法应为线性或摊还线性时间，辅助空间不超过 `O(n)`。

## 边界与验收重点

- 单字符、偶数长度、奇数长度和靠近中心的第一处不等。
- 字符 `'1'` 与字母 `'l'` 不同；题目不做规范化。
- 用两端下标或双端队列均能体现本题对称访问的逻辑。

## 如何验证

```powershell
make doctor
make run
make score
```

未安装 Make 时，在仓库根目录运行：

```powershell
pnpm lab:validate -- labs/chapter-02/exercise/E-02-17-palindrome-deque
pnpm lab:run -- labs/chapter-02/exercise/E-02-17-palindrome-deque
pnpm lab:score -- labs/chapter-02/exercise/E-02-17-palindrome-deque
```

- [ ] 全部 20 个公开测试通过。
- [ ] 能手算 `abba`、`aba` 和 `abca`。
- [ ] 能说明时间 `O(n)`、两下标做法额外空间 `O(1)`。

## 思考与复盘

1. 奇数长度的正中字符需要与谁比较？
2. 两端下标为何可以在不复制字符串的情况下完成判断？

<details><summary>思考题参考</summary>

1. 不需要与其他字符比较；所有两侧字符对一致即可。
2. 每次访问两个位置后向中间移动，原字符串保持不变。

</details>
