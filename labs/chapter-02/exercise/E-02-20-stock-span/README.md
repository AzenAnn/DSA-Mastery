---
title: "Lab 02-E-20：股票价格跨度"
description: "用单调栈计算连续不高于当天价格的天数。"
order: 31
chapter: 2
labId: "02E20"
chapterTitle: "栈与队列"
updated: "2026-09-11"
contributors: ["DSA Mastery Team"]
status: "draft"
lab: true
difficulty: "基础"
duration: "35～50 分钟"
---

# Lab 02-E-20：股票价格跨度

## 学习目标

- 用栈、队列或双端队列维护本题要求的访问顺序。
- 处理正常、边界和失败/非法输入场景。
- 说明每个元素至多进入和离开辅助结构一次的复杂度原因。

## 前置知识与环境

建议先学习[第 2 章栈与队列](../../../../content/chapter-02-stack-queue/00-overview.md)。使用 ISO C++17；开始前可在本目录运行 `make doctor`。

## 任务

用单调栈计算连续不高于当天价格的天数。

## 输入格式

第一行 `n`；第二行 `n` 个正整数价格。

## 输出格式

输出每一天的价格跨度，各数值以单个空格分隔，末尾输出换行。

## 数据范围与限制

- `1 <= n <= 200000`，且每个价格为正整数。
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
pnpm lab:validate -- labs/chapter-02/exercise/E-02-20-stock-span
pnpm lab:run -- labs/chapter-02/exercise/E-02-20-stock-span
pnpm lab:score -- labs/chapter-02/exercise/E-02-20-stock-span
```

- [ ] 全部 20 个公开测试通过。
- [ ] 能解释所选结构为何满足 LIFO/FIFO/单调候选的题意。
- [ ] 能说明最坏或摊还时间复杂度。

## 思考与复盘

1. 若把本题核心结构换成相反的访问顺序，会在哪类输入上出错？
2. 哪个边界用例最能揭示结构不变量被破坏？
