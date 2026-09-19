---
title: "Lab 02-E-14：农夫抓牛"
description: "用 FIFO 队列按层扩散，求单位代价状态转移的最短步数。"
order: 25
chapter: 2
labId: "02E14"
chapterTitle: "栈与队列"
updated: "2026-09-11"
contributors: ["DSA Mastery Team"]
status: "draft"
lab: true
difficulty: "基础"
duration: "35～50 分钟"
---

# Lab 02-E-14：农夫抓牛

## 学习目标

- 用队列按距离分层扩展位置，求单位代价转移的最少步数。
- 入队时标记访问，避免重复入队。
- 处理起终点相同、位置为零和范围边界。

## 前置知识与环境

建议先学习[第 2 章栈与队列](../../../../content/chapter-02-stack-queue/00-overview.md)。使用 ISO C++17；开始前可在本目录运行 `make doctor`。

## 任务

农夫位于 `start`，牛位于 `target`。每一步可从位置 `x` 移到 `x-1`、`x+1` 或 `2*x`，但只能到合法位置。求最少步数；三种移动代价都为 1，队列按层访问即可保证第一次到达目标时距离最短。

## 输入格式

一行 `start target limit`，三者均为整数；合法位置为 `0..limit-1`。

## 输出格式

输出从 `start` 到 `target` 的最少步数并换行。例如 `5 17 100` 可沿 `5→4→8→16→17` 用 4 步到达，答案为 `4`。

## 数据范围与限制

- 输入规模不超过 `200000`，除题面另有说明外整数使用 64 位有符号范围。
- `1 <= limit <= 200000`，且 `0 <= start,target < limit`；三种移动分别为 `x-1`、`x+1`、`2*x`，越界移动忽略。
- 标准输出只保留题目要求的结果；调试信息写入标准错误。
- 目标算法应为线性或摊还线性时间，辅助空间不超过 `O(n)`。

## 边界与验收重点

- `start=target` 时为 0 步；`limit=1` 只有位置 0。
- 跳过 `x-1<0`、`x+1>=limit` 或 `2*x>=limit` 的移动。
- 遇到已访问位置不再重复入队；向后走 `x-1` 有时是最优路径的一部分。

## 如何验证

```powershell
make doctor
make run
make score
```

未安装 Make 时，在仓库根目录运行：

```powershell
pnpm lab:validate -- labs/chapter-02/exercise/E-02-14-farmer-cow-bfs
pnpm lab:run -- labs/chapter-02/exercise/E-02-14-farmer-cow-bfs
pnpm lab:score -- labs/chapter-02/exercise/E-02-14-farmer-cow-bfs
```

- [ ] 全部 20 个公开测试通过。
- [ ] 能画出 `5→17` 的一条四步路径。
- [ ] 能说明每个位置最多入队一次，时间/空间 `O(limit)`。

## 思考与复盘

1. 为什么用栈做深度优先搜索不能保证第一次遇到目标时最短？
2. 为什么访问标记应在入队时设置？

<details><summary>思考题参考</summary>

1. 深度优先会先沿一条路径走远，可能错过另一条更短路径。
2. 若等到出队才标记，同一位置可能从多个前驱重复入队。

</details>
