# 第三章 串匹配与文本处理引擎（工程题）

## Goal

为第三章新增一个可运行、可评分、可打包的 Project Lab（工程题）：学生在统一 `Matcher` 契约下实现朴素匹配、KMP（next 版）与 nextval 版，并组装文本处理引擎（`first / count / findall / replace / compare`），通过固定 seed 工作负载比较确定性的字符比较次数，最终形成带前提的串匹配算法选型报告。结构对齐 Golden Project（lab-04-02 Huffman）：自动 80 分 + 人工 20 分。

用户价值：

- 收口第三章核心难点 KMP：把“会推导 next”升级为“在统一契约下实现，并用数据论证选型”；
- 给串部分一个完整工程闭环：契约 → 实现 → 对拍 → 指标 → 报告；
- 与第 1 章 lab-01-21、第 8 章 lab-08-03、第 9 章 lab-09-03 形成一致的工程题模式；
- 与数组部分完全解耦：只依赖串知识点，不阻塞数组负责人进度。

## Confirmed Facts（调研结论）

- 第三章现有 Labs：`01/02` 选择题（串基础、模式匹配）、`04` KMP、`05` next/nextval 推导、`06` 朴素 vs KMP 比较次数、`07` 非重叠替换、`08` UTF-8 串长与字符数；
- `03` 已预留给数组负责人的选择题空位；数组负责人另预留 5 个实验题位（建议 `09–13`）；串工程题建议编号 `lab-03-14`（章末惯例），落地时以 scaffold 实际可用编号为准；
- 章节内容：3.1 串存储与最小操作子集；3.2 朴素/KMP/nextval、工程陷阱与词索引表；3.3 数组与矩阵、3.4 广义表均不在本工程题范围；
- 工程题共同模式（lab-01-21 / 04-02 / 08-03 / 09-03）：统一契约 + 确定性指标 + 人工报告；`stdio 30 + ctest 50 + manual 20` 是当前 Golden Project 结构；
- Lab v1 机器合同（`.trellis/spec/content/lab-tooling.md`、`docs/LAB_AUTHORING_GUIDE.md`）：`type=project`、C++17、CMake ≥ 3.25、task 权重合计 100 且无环、薄 Makefile、构建产物只写 `.lab-cache/`；
- 与 lab-03-07 的边界：单题 Program 只比较一对输入；本工程题要求统一契约、多命令、UTF-8 边界、确定性工作负载与报告，README 需写明差异。

## Requirements

- R1 目录与 manifest：`labs/chapter-03/lab-03-14-<slug>/`，`type=project`，`schemaVersion: 1`，C++17，CMake 构建。
- R2 Task 图（权重合计 100、ID 唯一、依赖无环）：
  - `matcher`（stdio，30）：命令行工具，输出 pattern 在 text 中的首次出现位置与朴素/KMP/nextval 的字符比较次数；
  - `engine`（ctest，50）：统一 Matcher 契约实现；三实现语义等价；next/nextval 精确表值；`findall / count / replace`；UTF-8 字符边界；确定性计数；
  - `report`（manual，20）：实验方法、数据、解释、选型与局限。
- R3 契约：`contracts/` 提供 `Matcher` 抽象与 `MatchOutcome{first, comparisons}`；next 约定 0-based、`next[0] = -1`（与正文 3.2 一致）；空模式出现在位置 0；`m > n` 未找到。
- R4 边界与错误：空主串/空模式、首/尾命中、重叠命中、重复字符、UTF-8 多字节；非法参数写 stderr 并返回非零退出码。
- R5 确定性：固定 seed + 自实现 PRNG（xorshift32）；同一参数产生同一结果与同一计数；seed 出现在输出中。
- R6 计数口径：字符比较次数（含失配）为准；next/nextval 构建开销单独字段；不同字段不得相加成“综合性能分”；墙钟时间只进报告，不进入自动评分。
- R7 UTF-8：匹配在字节层执行，输出命中必须落在合法字符边界；跨字符边界命中的处理语义在设计稿冻结并写入 README 与测试。
- R8 报告：至少三个规模 × 五类工作负载；正式计时至少 7 轮取中位数；选型结论带访问模式前提与反转条件。
- R9 交付质量：reference 自动 80/80；starter 可编译但不满分；README 说明目标、前置知识、协议、正常/边界/错误、完成清单与复盘。

## Acceptance Criteria

- [ ] `pnpm lab:validate` 通过（schema、路径、权重、依赖、薄 Makefile）；
- [ ] `pnpm lab:verify` 通过：reference 自动 80/80、starter 非满分、oracle 无漂移；
- [ ] `matcher` stdio 的 cases 合计 100，覆盖 sample/normal/boundary/error/stress/regression；
- [ ] `engine` 的 CTest 名与 `task.json` 完全一致，task 内分值合计 100；
- [ ] 朴素/KMP/nextval 对同一输入返回相同位置，比较次数满足理论上下界回归（如最坏 01 串朴素为 O(n·m) 计数、KMP 不超线性计数口径）；
- [ ] next/nextval 对已知样例（如 `ababc`、`aaaab`）输出精确表值；
- [ ] `replace` 与 lab-03-08 非重叠语义一致；UTF-8 命中边界用例通过，跨边界命中行为符合冻结语义；
- [ ] 五类 profile 在固定 seed 下可复现，结果一致性与计数确定性有自动测试；
- [ ] 顶层评分显示 `Automated: 80/80` + `Manual pending: 20`，不伪造满分；
- [ ] `pnpm test`、`pnpm run validate`、`pnpm run test:discovery`、`pnpm run build`、`pnpm run check:site`、`pnpm run test:pages` 通过；
- [ ] student pack 不含 solution/cache/binary，且可脱离仓库运行；
- [ ] 工作树除 `.lab-cache/` 外无构建污染。

## Out of Scope

- BM / AC 多模式匹配、正则引擎、Unicode 规范化与大小写折叠；
- 数组/矩阵内容（寻址、压缩、稀疏矩阵）——数组负责人职责；
- 广义表的存储与递归；
- 块链串存储（仅可作不计分扩展）；
- 把墙钟时间或比较次数当作跨机器的 CPU 周期结论。

## Notes

- 编号 `lab-03-14` 为建议值；若数组实验预留位实际落在其他编号，以 scaffold 时下一个合法编号为准，并同步 README `order` 与目录；
- 本任务按 codex-inline 模式规划，Phase 2 由主会话直接实现（跳过 implement/check jsonl 编排）；
- 规划工件：`design.md`（技术设计）、`implement.md`（执行计划）、`research/project-patterns.md`（跨章模式与范围决策）。
