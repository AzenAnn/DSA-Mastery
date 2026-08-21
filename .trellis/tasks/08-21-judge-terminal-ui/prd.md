# 全面美化 Judge 终端输出

## Goal

让学习者和维护者使用 Lab CLI 时，能在几秒内看懂命令状态、每个用例的判定、得分、首个失败原因和下一步操作，同时保持 CI、JSON、无色终端和跨平台行为稳定。

## Background

- 当前 `tools/lab/judge.mjs:88`、`tools/lab/project.mjs:195` 与 `tools/lab/cli.mjs:64-250` 只输出无样式的纯文本；真实学习者反馈显示 `AC` 与 `100/100` 不够醒目，失败结果及环境、校验、构建、验证等命令也缺少统一视觉层级。
- `tools/lab/cli.mjs:24` 已接受 `--no-color`，`tools/lab/lab.mk:10` 已转发 `NO_COLOR`，原始 Lab 工作流 PRD 也要求“人类可读终端表格 + --json + --no-color”，但当前人类输出尚未实际使用颜色。
- 现有稳定合同包括：判定值 `AC|WA|TLE|RE|CE|OLE|IE`、Program/Project 评分语义、`run`/`score` 退出码差异、Project `PENDING` 人工分、JSON `reportVersion: 1` 以及 `--json` 永远无 ANSI 控制码。
- 用户选择范围 B：不仅美化 Program/Project 判题结果，也统一全部 Lab CLI 人类可读输出；`interactive` 的学生进程输出除外。
- 当前分支为 `codex/feat/judge-terminal-ui`，Trellis creator/assignee 均为 Azen。创建分支前尝试刷新 GitHub `main`，但本机到 `github.com:443` 暂时不可达；分支基于本机最近缓存的 `origin/main`，推送 PR 前必须重新同步。

## Requirements

### R1. 判定与分数视觉语义

- `AC` 使用绿色；`WA`、`CE`、`RE`、`IE` 使用红色；`TLE`、`OLE` 使用黄色；Project `PENDING` 使用醒目的待处理样式。
- 满分时实际分与满分均为绿色；未满分时实际分为红色、满分上限为绿色，保留原始 `x/y` 文本以避免只依赖颜色表达结果。
- 颜色不得改变 CASE/TASK、RESULT、TIME、SCORE 表格的稳定列对齐。

### R2. Judge 结果层级

- Program 逐用例输出保留 case、verdict、耗时和得分，并增加清晰的整体 `PASS` 或 `NOT FULL` 总结。
- WA 首处差异突出位置、期望值与实际值；stderr 与编译失败输出清楚区分诊断正文和结果标题。
- 非满分结果提供可复制的单用例重试提示；满分结果不显示失败提示。
- Project 顶层 task、嵌套 stdio/CTest 判定、自动分、人工待评分和 provisional total 使用同一套视觉语义，不能把 manual pending 伪装成最终满分。

### R3. 全部 Lab CLI 人类输出

- `new`、`help`、`doctor`、`validate`、`build`、`run`、`score`、`verify`、`refresh-expected`、`pack`、`clean` 和人类可读错误统一使用共享的标题、成功、失败、警告、信息、路径与命令样式。
- `doctor` 明确区分可用、版本过低、未找到、必需问题和可选工具；`validate/build/verify/refresh-expected` 明确区分成功、失败、漂移、待处理与写入结果。
- `help` 保持可复制的命令文本；`interactive` 继续直接接管终端，不给学生程序 stdout/stderr 添加样式。
- 编译器、CMake、CTest 与学生 stderr 等外部诊断正文不得因为主题色造成难以复制或破坏原始换行；CLI 只装饰自身标签和摘要。

### R4. 兼容与可访问性

- 所有状态继续显示文字标签，颜色只增强信息，不作为唯一信息载体。
- 交互终端默认自动着色；`--no-color`、`NO_COLOR`、非 TTY/重定向输出和 `TERM=dumb` 必须无 ANSI 控制码。
- `--json` 输出结构、字段和退出码完全不变且始终无颜色。
- Windows PowerShell/VS Code、Linux/macOS 终端使用同一实现；不新增第三方运行时依赖。
- 先对原始文本做宽度填充再包裹 ANSI 样式，避免控制码污染列宽计算。

### R5. 验证与交付

- 单元测试覆盖颜色开启、颜色关闭、全部语义样式、满分/未满分、WA 差异、CE、Project manual pending、主要 CLI 人类输出、JSON 无 ANSI 和固定表格结构。
- 运行 `pnpm run test:lab-tools`、相关 Golden Program/Project 验证、lint 及 `pnpm test`；记录真实结果。
- 在本地真实运行 Lab 01-06 的满分与失败场景，并运行 Golden Project，向用户展示终端效果后等待验收。
- 用户明确验收后才提交、推送和创建 PR；PR 前重新 fetch/rebase 最新 `origin/main`，并记录验证证据与 AI 参与情况。

## Acceptance Criteria

- [x] AC1：彩色终端中 Program 的 `AC` 与满分为绿色；非满分实际分为红色、满分上限为绿色；其他 verdict 按 R1 映射且文字标签仍在。
- [x] AC2：Program 输出包含对齐表格、整体 PASS/NOT FULL、可读 WA/CE 诊断及失败单例重试命令。
- [x] AC3：Project 顶层及嵌套结果沿用相同视觉语义，自动分、manual pending、provisional total 没有语义回归。
- [x] AC4：除 `interactive` 的学生进程输出外，全部 Lab CLI 人类输出使用一致且可辨识的成功、失败、警告、信息、路径与命令视觉语言。
- [x] AC5：`--no-color`、`NO_COLOR`、非 TTY 与 `--json` 均不包含 ANSI；JSON schema 与退出码不变。
- [x] AC6：无新增运行时依赖，Windows/Linux/macOS 共享实现，ANSI 不破坏表格对齐，外部诊断正文保持可复制。
- [x] AC7：专项单测、Golden Program/Project、lint 和全量 `pnpm test` 通过，并有真实本地彩色运行证据。
- [ ] AC8：用户确认本地效果后，分支同步最新 main，提交、推送并创建符合项目合同的 PR。

## Out of Scope

- 不改变判题、比较、计分、超时、输出上限或退出码语义。
- 不修改 JSON reportVersion 或字段结构。
- 不建设网页判题结果页面、动画进度条、交互式 TUI 或隐藏测试平台。
- 不修改教材题面、学生答案、参考实现和测试 oracle。
- 不给 `lab:interactive` 启动的学生进程输出着色或改写。
