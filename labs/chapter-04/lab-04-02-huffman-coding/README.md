---
title: "Lab 04-02：Huffman 编码器"
description: "用三个有依赖关系的任务完成字符频率、Huffman 编解码与实验报告，并聚合自动分和人工分。"
order: 2
chapter: 4
chapterTitle: "树与二叉树"
updated: "2026-08-17"
contributors: ["Azen"]
status: "draft"
lab: true
difficulty: "基础"
duration: "120～150 分钟"
---

# Lab 04-02：Huffman 编码器

## 目标

统计字符频率，用最小堆构造 Huffman 树，生成每个字符的前缀编码，编码并解码文本，验证平均码长。

## 前置知识

- 第 4.2 节 Huffman 树与编码；第 4.3 节堆（最小堆实现）。

## 建议用时

120～150 分钟。

## 任务与评分

| Task | 类型 | 权重 | 依赖 | 交付物 |
| --- | --- | ---: | --- | --- |
| `frequency` | stdio | 30 | 无 | 字符频率程序 |
| `codec` | CTest | 50 | frequency | `contracts/huffman.hpp` 的实现 |
| `report` | manual | 20 | codec | 平均码长、熵与复盘报告 |

顶层评分会分别显示自动分和待人工分。任务依赖用于推荐顺序和定位，不会暗中把前置任务变成“一票否决”。

## 运行与评分

进入本目录后优先使用：

```powershell
make doctor
make run
make run TASK=frequency CASE=weighted
make run TASK=codec
make score
```

Windows 未安装 GNU Make 时，在仓库根使用免 Make 兜底：

```powershell
pnpm lab:run -- labs/chapter-04/lab-04-02-huffman-coding
pnpm lab:run -- labs/chapter-04/lab-04-02-huffman-coding --task frequency --case weighted
pnpm lab:score -- labs/chapter-04/lab-04-02-huffman-coding
```

维护者可用 `--target solution` 验证参考实现自动部分满分。Project 使用 CMake ≥ 3.25 与 CTest；CMake 可选择当前平台的可用生成器，Ninja 只是可选加速项。所有构建产物只写入 `.lab-cache/`。

## 测试输入

- `"aabbbcccc"`（期望：`c` 编码最短）；
- 一段自选英文文本（≥ 200 字符）；
- 只有一种字符的文本（边界：树如何退化？）；
- 空文本。

## 提交物

- 可运行代码；
- 三个测试输入的编码表与压缩率；
- 100～200 字结论：平均码长与理论下界（熵）的关系。

## 验收标准

- [ ] 解码结果与原文完全一致（所有输入）；
- [ ] 编码是前缀编码：任何字符的编码不是另一个的前缀；
- [ ] 频率越高的字符编码越短；
- [ ] 单字符文本与空文本不崩溃且行为明确；
- [ ] 平均码长与频率加权计算相符，压缩率合理；
- [ ] 报告每个用例的断言结果。

## 加分项

- 对比固定长度编码（如 8 位）的压缩率，说明 Huffman 的收益来源；
- 用任意文本验证 Huffman 码字均长不小于熵（信息论结论），并讨论差距来源。
