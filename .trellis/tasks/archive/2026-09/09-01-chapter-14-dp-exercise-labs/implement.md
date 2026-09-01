# Implementation Plan · 第 14 章动态规划代码题 Labs

## Phase A · Planning and source audit

- [x] 从已合并目录迁移的最新 `origin/main` 创建 `codex/chapter-14-dp-labs`。
- [x] 以 Azen 创建 Trellis 任务。
- [x] 阅读 Ch.14 教材、Lab 作者合同、质量合同和 Algo C++/写作规范。
- [x] 核验 30 个官方问题页面的题名、约束、样例和接口。
- [x] 固化 30 个稳定 ID、slug、章节分组与标准输入输出适配。
- [x] 用户批准最终规划摘要。

## Phase B · Activate and scaffold

- [x] 运行 Trellis requirement convergence 与 `task.py start`。
- [x] 用 `pnpm lab:new` 依次创建 30 个 Program Lab，确认 `14E01`～`14E30`。
- [x] 检查 Ch.14 三分类与 `.gitkeep` 生命周期。
- [x] 建立默认 dry-run 的 Ch.14 catalog/generator，并先跑只读审计。

## Phase C · Implement by learning group

- [x] 生成并人工审查 `14E01`～`14E05`：状态设计。
- [x] 生成并人工审查 `14E06`～`14E08`：记忆化搜索。
- [x] 生成并人工审查 `14E09`～`14E17`：线性/网格。
- [x] 生成并人工审查 `14E18`～`14E26`：背包。
- [x] 生成并人工审查 `14E27`～`14E30`：扩展背包。
- [x] 核对全部 README 未复制第三方长段落、代码、图片或测试，并保留来源与适配说明。

## Phase D · Test audit

- [x] 断言 30 个 Lab、600 个 case、每题 20 case/100 分、路径与 case ID 唯一。
- [x] 运行独立 JavaScript oracle，检查全部 `.out` 和 LF。
- [x] 对 30 个 Lab 运行 `pnpm lab:validate`。
- [x] 对 30 个 Lab 运行 `pnpm lab:verify`，reference 全满分、starter 非满分。
- [x] 清理并断言不存在 `.lab-cache`、binary、临时 Chapter 99 fixture 或生成产物。

## Phase E · Project gates

- [x] `pnpm run validate:content`
- [x] `pnpm run test:lab-tools`
- [x] `pnpm run test:lab-docs`
- [x] `pnpm run test:lab-golden`
- [x] `pnpm run test:lab-make`
- [x] `pnpm run typecheck`
- [x] `pnpm run lint`
- [x] `pnpm run build:vitepress`
- [x] `pnpm run check:site`
- [x] 完整运行 `pnpm test`；未改 UI/base，Pages 专项由本地真实浏览器检查代表页面。
- [x] `git diff --check` 与工作树垃圾审计。

## Phase F · Preview handoff

- [x] 启动 VitePress 本地开发服务器并确认进程持续运行。
- [x] 打开 Ch.14 首页和代表 Lab 页面，人工检查导航、标题、状态卡、来源与控制台错误。
- [x] 向用户提供本地 URL、分支、完成数量和已知审阅重点。
- [ ] 等待用户检阅；本阶段不推送、不创建 PR。

## Risk checkpoints and rollback

- 自动编号偏移：停止生成，删除尚未填充的新 Ch.14 目录后从干净分支重来；不手改已发布 ID。
- 某题 oracle 与 C++ 不一致：隔离该 Lab，保留最小反例，禁止通过刷新 expected 掩盖差异。
- CI 时间过长：先减少单个 stress 输入体积，不减少 20 个具有不同判别价值的 case。
- 版权疑问：保留来源和事实元数据，重写/删去疑似复制段落；未确认图片许可则不引入图片。
