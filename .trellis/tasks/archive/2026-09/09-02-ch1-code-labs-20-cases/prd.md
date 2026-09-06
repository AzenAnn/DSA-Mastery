# Ch.1 代码 Lab 补齐 20 个测试点

## Goal

为 Chapter 1 的全部标准输入输出型代码 Lab 建立足量、可复现、可评分的公开测试集，使常规实现错误、边界错误、特殊结构错误和不满足题目复杂度要求的实现更容易被检出。

## Background

- 当前 Chapter 1 有 15 个 `program` 类型 Exercise Lab，分别为 `01E01`～`01E15`；每个 Lab 使用 `tests/cases.json` 描述标准输入输出测试。
- 15 个 Program 当前各有 4～6 个 case，共 65 个；用户要求每个代码题补齐到 20 个。
- 当前每个 `cases.json` 的分值合计为 100。补齐后仍须满足正整数分值且总分为 100，因此计划统一为 20 个 case × 5 分。
- Chapter 1 另有 `01P01` 综合 Project。它使用 3 个 CTest task 和 1 个 manual task，不使用 Program 的 `tests/cases.json` 合同。
- Program 题目数据上界从 1,000 到 100,000 不等；现有参考实现与 README 已明确各题的输入、输出和复杂度要求。
- 基线 `lab:verify` 显示 13 个 Program 当前通过；`01E08` 的 `002-capacity-one.out` 与正确的 LRU 淘汰语义不一致，`01E12` 的 reference solution 读取顺序与 README/现有输入协议不一致。

## Requirements

### R1. Program 测试数量与评分

- 对范围内每个 Chapter 1 Program Lab，将 `tests/cases.json` 补齐为恰好 20 个唯一 case。
- 每个 case 为 5 分，单 Lab 总分保持 100。
- 保留现有 case 的测试语义和稳定 ID；除分值重分配外，不无故改写已有输入输出。
- 每个 case 的 `.in` 与 `.out` 必须成对存在，路径保持在所属 Lab 内。

### R2. 测试类别覆盖

每个 Program 的 20 个 case 必须结合题目语义覆盖以下类别，而不是机械复制或只改变无关数值：

- `sample`：保留题面样例，验证输入输出协议；
- `normal`：多组代表性常规输入，覆盖主要控制流；
- `boundary`：空/单元素、首尾位置、最小/最大合法参数、极值、重复值、奇偶长度等适用边界；
- `special` / `regression`：针对链表头尾维护、重复元素、环拆分、LRU 更新与淘汰、静态链表非连续下标等易错结构提供最小反例；
- `stress`：使用与题目数据范围相称的大规模输入，检验算法复杂度边界；本地评分器只做守门，不宣称提供精确性能基准。

不适用于某道题的类别可以由更贴合该题的边界或回归场景替代，但每题至少包含 `sample`、`normal`、`boundary`、`stress` 四类标签。

### R3. Oracle 与可复现性

- 新增 `.out` 先建立占位，再通过仓库 `lab:refresh-expected --write` 使用现有 solution 生成；不得用未经校验的手工输出替代参考 oracle。
- 所有 `.out` 保持 LF；不得修改评分器、Schema 或 Lab 工具合同来迁就测试数据。
- 对大输出用例保持在 Lab 的 `outputKb` 限制内；如题目最大合法输出超过现有限制，必须先记录证据并在设计中明确最小调整。
- 每题默认只保留一个完整数据上界 case，其他复杂度/回归 case 使用足以暴露缺陷但不会无意义放大仓库的确定性规模；Josephus 分别覆盖 `n`、`m` 上界，不强制在同一 case 同时取双上界造成平台不稳定。

### R4. 变更边界

- 主要修改 15 个 Program Lab 的 `tests/cases.json` 与对应 `.in/.out`；不改变题意、student starter 或稳定 `labId`。
- 允许修正新增合法测试暴露的最小 reference/oracle 缺陷，并同步 README 中与 reference 重复的代码片段；禁止借机重构无关实现。
- 已知修正包括：为 `01E03` 的全重复压力输入消除二路划分退化；重新生成 `01E08` 的错误 oracle；修正 `01E12` solution 与 README 代码片段的输入读取顺序。若压力 case 暴露其他 reference 缺陷，必须记录最小反例和修正原因。

## Acceptance Criteria

- [x] AC1：范围内每个 Lab 的 `cases.json` 恰好包含 20 个唯一 case，points 均为正整数且合计 100。
- [x] AC2：15 个 Program 合计 300 个 case，所有输入/期望文件存在且留在所属 Lab 目录内。
- [x] AC3：每题至少有 `sample`、`normal`、`boundary`、`stress` 覆盖，并有与具体算法风险对应的特殊或回归测试。
- [x] AC4：新增 case 不只是同构改数；规划与验证记录能说明每题关键边界、易错点和压力场景。
- [x] AC5：每个目标 Lab 的 `pnpm lab:validate` 与 `pnpm lab:verify` 通过；solution 为 100 分，starter 可编译且非满分，oracle 无漂移。
- [x] AC6：Chapter 1 全部目标 Lab 的批量校验通过，并执行仓库要求的 `pnpm test`；工作树除预期测试资产与 Trellis 记录外无构建污染。
- [x] AC7：测试资产不引入绝对路径、路径逃逸、CRLF oracle 或超过配置的输出；大规模用例在现有时间/输出限制内可稳定复现。
- [x] AC8：`01E03` reference 能稳定处理全重复压力输入；`01E08` 旧 oracle 与 LRU 语义一致；`01E12` reference 按 README 规定的“元素序列后读取目标值”协议运行；其他 reference 改动仅限新增合法 case 暴露的必要修正。

## Out of Scope

- 改写题意、student starter 或与合法新增 case 无关的 solution 算法；
- 修改 Lab Schema、判题器或分发协议；
- 为公开测试提供保密性保证；
- 精确基准测试或跨机器性能排名；
- Chapter 1 Quiz Lab。
- `01P01` 综合 Project；其 CTest/manual 测试增强应作为独立任务处理。
