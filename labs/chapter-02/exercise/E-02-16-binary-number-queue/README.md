---
title: "Lab 02-E-16：队列生成二进制数"
description: "用 FIFO 队列按数值顺序生成二进制表示。"
order: 27
chapter: 2
labId: "02E16"
chapterTitle: "栈与队列"
updated: "2026-09-11"
contributors: ["DSA Mastery Team"]
status: "draft"
lab: true
difficulty: "基础"
duration: "35～50 分钟"
---

# Lab 02-E-16：队列生成二进制数

## 学习目标

- 用 FIFO 队列按数值顺序生成二进制字符串。
- 对每个已输出字符串依次追加 `0` 与 `1`，维持层序。
- 根据输出长度分析时间、空间与判题器输出上限。

## 前置知识与环境

建议先学习[第 2 章栈与队列](../../../../content/chapter-02-stack-queue/00-overview.md)。使用 ISO C++17；开始前可在本目录运行 `make doctor`。

## 任务

将字符串 `"1"` 入队。每次取出队头作为下一个答案，再把它后面追加 `0` 和 `1` 得到的两个字符串按此顺序入队。这样依次得到十进制数 `1..n` 的无前导零二进制表示。

## 输入格式

一行正整数 `n`。

## 输出格式

输出 `1..n` 的二进制表示，各表示以空格分隔，末尾换行。例如 `n=5` 输出 `1 10 11 100 101`；不输出十进制数 0。

## 数据范围与限制

- 输入规模不超过 `200000`，除题面另有说明外整数使用 64 位有符号范围。
- `1 <= n <= 200000`；输出总字符数为 `O(n log n)`，算法时间和输出规模同阶，辅助队列空间为 `O(n log n)`。
- 标准输出只保留题目要求的结果；调试信息写入标准错误。
- 目标算法时间和输出规模同阶（`O(n log n)`），辅助队列空间为 `O(n log n)`。

## 边界与验收重点

- `n=1`、跨过二进制位数变化的 `n=2,4,8`。
- 先入队 `当前串+0`，再入队 `当前串+1`，不能反转。
- `n=200000` 时输出超过 1 MiB；判题输出上限为 8 MiB，覆盖合法最大答案。

## 如何验证

```powershell
make doctor
make run
make score
```

未安装 Make 时，在仓库根目录运行：

```powershell
pnpm lab validate labs/chapter-02/exercise/E-02-16-binary-number-queue
pnpm lab run labs/chapter-02/exercise/E-02-16-binary-number-queue
pnpm lab score labs/chapter-02/exercise/E-02-16-binary-number-queue
```

- [ ] 全部 20 个公开测试通过。
- [ ] 能写出前八个答案并解释队列生成顺序。
- [ ] 能说明时间和存储字符串所需空间均为 `O(n log n)`。

## 思考与复盘

1. 若先入队 `当前串+1`，前四个答案会变成什么？
2. 为什么不能只按生成的字符串数 `n` 估算输出字节数？

<details><summary>思考题参考</summary>

1. 会得到 `1 11 10 111`，不再对应数值顺序。
2. 每个答案有 `Θ(log n)` 位，还包含分隔符，总输出是 `Θ(n log n)` 字节。

</details>
