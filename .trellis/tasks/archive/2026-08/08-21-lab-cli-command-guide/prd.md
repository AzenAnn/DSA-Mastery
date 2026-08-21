# Lab 命令与接口指南

## Goal

让学习者和课程作者能够从一篇站内指南准确选择 Lab 命令、参数与入口，理解 Quiz、Program、Project 三类题目的能力边界，并能在 Windows 无 Make 环境或已安装 GNU Make 的环境中完成同一套检查、运行、评分与维护操作。

## Background

- 当前 Lab CLI 的权威实现位于 `tools/lab/cli.mjs`，根 `package.json` 暴露 `lab:new`、`lab:doctor`、`lab:validate`、`lab:build`、`lab:run`、`lab:interactive`、`lab:score`、`lab:verify`、`lab:refresh-expected`、`lab:pack` 和 `lab:clean`。
- `tools/lab/lab.mk` 为 Program/Project 暴露同名 Make target，并把 `LAB`、`CASE`、`TASK`、`TARGET`、`JSON`、`NO_COLOR`、`WRITE` 映射到同一 Node CLI；GNU Make 是可选快捷入口，pnpm 是 Windows 免 Make 的权威入口。
- `run` 与 `score` 的关键差异是退出码：`run` 完成评分即返回 0，适合学习过程；`score` 未达到自动满分时返回 1，适合作者和 CI。工具、配置或内部错误返回 2。
- Program 使用标准输入输出用例；Project task 分为 `stdio`、`ctest`、`manual`，其中 `--case` 只对 Program/Project 的 stdio 测试有意义，`--task` 用于 Project task；Quiz 主要在网页中作答，CLI 用于 `doctor`、`validate`、`verify` 等检查，不提供代码判题面板或 Makefile。
- 前言当前通过 `content/chapter-preface/NN-*.md` 收录完整指南；`01` 和 `02` 均使用 VitePress include 复用 `docs/` 下单一正文。新增指南应沿用该模式，而不是复制内容。
- 《前言 · 理论环境展示》已经给出表格、代码组、文件名、原生 callout、理论容器、`==高亮==`、`<dfn>`、`<kbd>` 和有限语义文字类的作者语法；新指南应复用语义正确的子集，不能用颜色替代文字含义。

## Requirements

### R1. 完整且准确的接口清单

- 覆盖全部 11 个 pnpm Lab 脚本，逐项说明用途、适用 Lab 类型、可用参数、默认值、输出与退出码特征。
- 覆盖路径解析规则、pnpm 的 `--` 参数分隔符，以及 `--case`、`--task`、`--target`、`--json`、`--no-color`、`--write`、`--profile` 的真实作用域。
- 明确 `student` 与 `solution`、`run` 与 `score`、人类终端输出与 JSON 报告、公开用例与 Project task 的差异。
- 不把当前尚不存在的“裸 `pnpm run`/`pnpm test` 自动识别当前 Lab”写成已支持能力。

### R2. 三类 Lab 的操作路径

- 为 Quiz、Program、Project 分别给出最短学习路径和能力矩阵。
- Program 示例覆盖环境检查、全量运行、单用例、交互运行、严格评分和清理。
- Project 示例覆盖全量自动评分、单 task、stdio task 的单 case、student/solution 目标、CTest、manual pending 和 provisional total。
- Quiz 明确网页作答与 CLI 校验的边界，避免引导读者运行不存在的 Make/代码评分入口。

### R3. Make 使用说明

- 说明根目录 `make <target> LAB=<path>` 与进入 Program/Project 目录后 `make <target>` 两种入口。
- 列出 `help|doctor|validate|build|run|interactive|score|verify|refresh-expected|pack|clean` target，以及 `LAB|CASE|TASK|TARGET|JSON|NO_COLOR|WRITE` 变量映射。
- 明确 Make 只是一层薄包装、GNU Make 可选、无 Make 时 pnpm 命令能力等价，并指出 Quiz 默认没有 Makefile。

### R4. 内容、排版与前言接入

- 正文单一来源为 `docs/LAB_CLI_COMMAND_GUIDE.md`；站内入口为 `content/chapter-preface/03-lab-cli-command-guide.md`，通过 include 展开。
- 页面 frontmatter 使用 `chapter: "preface"`、`order: 3`、`contributors: ["Azen"]`，并通过 ContentIndex 加入前言课程资源、侧栏、搜索与前后页顺序。
- 页面采用“先快速开始、再操作矩阵、随后参数字典与进阶维护”的渐进层次；使用表格、callout、代码组、文件名代码框、键位与有限语义标记提升可读性。
- 页面在浅色/深色、桌面/移动视口下保持可读，代码与表格只在自身区域横向滚动。

### R5. 可执行验证与本地验收

- 文档自动检查必须证明 include 已展开、全部命令/关键参数/Make 变量存在，且前言恰好包含新增页面。
- 静态产物检查必须证明新 route、标题、关键内容、搜索数据和无内部 `preface` 泄漏。
- Pages 浏览器测试必须从前言目录进入新指南，并检查侧栏、正文和移动端无横向溢出。
- 启动本地站点并打开新指南实际页面，保留服务供用户检查；完成前不提交生成的 `dist/`、缓存或截图。

## Acceptance Criteria

- [x] AC1：站内指南完整列出当前 11 个 pnpm 操作、全部 CLI 参数、适用类型、默认行为和关键退出码，内容与源码一致。
- [x] AC2：Quiz、Program、Project 均有独立的可复制操作路径；Program 单 case 与 Project task/case/manual 行为解释准确。
- [x] AC3：Make target 与变量映射完整，根目录/题目目录两种用法清楚，并明确 GNU Make 可选、pnpm 等价兜底、Quiz 无 Make 入口。
- [x] AC4：`docs/` 正文通过 `content/chapter-preface/03-lab-cli-command-guide.md` 单一 include 接入，ContentIndex、前言目录、侧栏、搜索和 prev/next 均能发现页面。
- [x] AC5：页面复用既有理论展示语法形成清晰层级，在浅/暗主题与 390px/1440px 下无根页面横向溢出，命令可复制、状态不只依赖颜色。
- [x] AC6：`pnpm run test:lab-docs`、`pnpm run validate:content`、`pnpm run build`、`pnpm run check:site`、相关 Pages 测试及最终 `pnpm test` 有真实通过记录。
- [x] AC7：本地预览服务已启动，新指南页面可由浏览器访问，并交由用户做最终视觉与内容检查。

## Out of Scope

- 不实现新的 `pnpm run`/`pnpm test` 当前目录自动匹配语法；本任务只记录现在已经存在并经过验证的接口。
- 不改变 CLI 参数、判题、计分、JSON schema、退出码、Make target 或工具安装流程。
- 不复制或重写 `docs/LAB_AUTHORING_GUIDE.md` 与 Windows 安装指南，不新增 Vue 组件或自定义 CSS。
- 不提交站点构建产物、浏览器截图、`.lab-cache/` 或依赖缓存。
