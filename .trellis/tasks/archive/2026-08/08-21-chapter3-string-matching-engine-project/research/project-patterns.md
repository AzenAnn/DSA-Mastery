# 调研：跨章工程题模式与第三章范围决策

> 日期：2026-08-21 · 全部结论来自仓库内文件，未访问外部网络。

## 1. 既有工程题结构（证据）

| 工程题 | 路径 | 结构 | 模式 |
| --- | --- | --- | --- |
| 第 1 章 线性表双实现与工作负载评测器 | `labs/chapter-01/lab-01-21-list-workload-analyzer` | ctest 25/25/30 + manual 20 | 双实现同一契约 + 工作负载对拍 + 选型报告 |
| 第 4 章 Huffman 编码（Golden） | `labs/chapter-08/lab-08-03-avl-tree-rotations` | stdio 30 + ctest 50 + manual 20 | 计数 → 编解码引擎 → 报告 |
| 第 8 章 AVL 旋转维护 | `labs/chapter-08/lab-08-03-avl-tree-rotations` | stdio 30 + ctest 50 + manual 20 | 基线(BST) → 高级实现(AVL) → 退化对比报告 |
| 第 9 章 散列索引引擎 | `labs/chapter-09/lab-09-03-hash-index-engine` | stdio 30 + ctest 50 + manual 20 | 三种策略同契约 + 探测计数 → 报告 |

共同点：统一契约、确定性指标（计数而非计时）、自动 80 + 人工 20、`dependsOn` 只表达推荐顺序不构成得分门禁、构建产物只写 `.lab-cache/`。

关键规范文件：

- `docs/LAB_AUTHORING_GUIDE.md`（7. Project 一节：stdio/ctest/manual、权重、CMake 约束、报告分 pending）；
- `.trellis/spec/content/lab-tooling.md`（机器接口、退出码、JSON 报告、薄 Makefile、oracle 生命周期）；
- `docs/CHAPTER_01_PROJECT_REDESIGN.md`（第一章工程题设计稿：任务图、计数口径、profile、报告 rubric、落地流程）；
- `docs/LAB_CLI_COMMAND_GUIDE.md`（工程题三层选择与命令入口）。

## 2. 第三章现状（证据）

- 内容：`content/chapter-03-string-array/00-overview.md`（学习目标、四篇文章分工、配套 Labs）；
- 3.2 正文明确以“建立词索引表”作为串操作的工程应用示例，可作为可选扩展；
- 3.3/3.4（数组矩阵、广义表）由数组负责人负责，不在本工程题范围；
- 现有 Labs：`01/02` quiz、`04` KMP、`05` next/nextval、`06` 比较次数、`07` 非重叠替换、`08` UTF-8 串长；
- `03` 空位预留给数组负责人选择题；数组负责人另预留 5 个实验位（建议 09–13）；
- 章节 PRD（`.trellis/tasks/08-12-chapter-03-string-and-array/prd.md`）规划 Labs 为“字符串匹配工具（朴素 vs KMP 对比）+ 稀疏矩阵三元组”，前者即本工程题的前身。

## 3. 决策记录

- 主题：串匹配与文本处理引擎（用户确认，串负责人先行）；
- 结构：`matcher(stdio 30) + engine(ctest 50) + report(manual 20)`，对齐 Golden Project；
- 编号：建议 `lab-03-14`（03 = 数组 quiz，09–13 = 数组实验预留，工程题按章末惯例）；
- 关键设计决策：0-based `next[0]=-1`；UTF-8 字节层匹配 + 字符边界校验（命中必须落在码点边界）；xorshift32 固定 seed；计数口径 = 字符比较次数，墙钟只进报告；
- 范围排除：BM/AC/正则、Unicode 规范化、数组/矩阵、广义表、块链串（仅可选扩展）。
