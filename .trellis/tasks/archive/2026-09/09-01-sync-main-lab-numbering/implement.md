# 实施计划：同步 main 的 Lab 编号内容并提交插件适配 PR

## Phase 1：实施前检查

- [x] 确认任务仍处于 planning，记录当前分支、HEAD、`origin/main` 和所有既有 dirty/untracked 路径。
- [x] 重新 `git fetch origin main`，核对 main 是否在规划后继续变化；实施快照为 `origin/main=411eb3e`。
- [x] 运行 `task.py validate`，确认 PRD、设计和计划结构完整；用户已批准规划并启动任务。

## Phase 2：同步与实现

- [x] 使用普通 merge 将最新 `origin/main` 合并到 `feat/vscode-lab-extension`，产生 merge commit `dfe7c5d`；未 rebase、未强推。
- [x] 处理并审查冲突：main 的 Lab 内容迁移优先，保留插件 UI、统计、heatmap 和 stable-ID 代码；既有 workspace/VSIX dirty 文件未进入提交。
- [x] 用真实合并后的 `labs/` 树验证 `theory`、`exercise`、`project`、frontmatter `labId` 和可运行类型；插件扫描得到 14 章、193 个可运行 Lab，`theory=42`、`exercise=151`、重复/非法 ID 均为 0。
- [x] 以最小范围修正并测试插件旧标题/旧目录兼容；树、WebView、导航和统计使用稳定 ID，修复提交为 `3ffc443`。
- [x] 运行进度迁移与快照兼容回归；34 个插件测试全部通过，旧键合并与 backup 逻辑保持不变，未删除旧快照。

## Phase 3：质量与交付

- [x] 插件：`node --experimental-strip-types --test test/*.test.ts`，34/34 通过。
- [x] 插件：`tsc -p tsconfig.json --noEmit`，通过。
- [x] 插件：`node build.mjs`，通过，`dist/extension.js` 约 522.4 kB。
- [x] 根项目：`pnpm test`，通过；包含内容校验、typecheck、lint、Lab 工具 39/39、Lab 文档、自动发现、VitePress build 和 `check:site`。
- [x] `git diff --check origin/main...HEAD` 通过；确认未跟踪 VSIX、生成目录、既有 Trellis 日志和旧归档不在本任务提交范围。
- [x] 已形成 merge commit `dfe7c5d` 与实现修复 commit `3ffc443`，未 amend 既有共享提交。
- [x] 推送 `feat/vscode-lab-extension`，使用 GitHub CLI 创建 base 为 `main` 的 PR #126，包含范围、非目标、验证、风险、人工复核和 AI 辅助说明。
- [x] 已记录 PR URL：<https://github.com/AzenAnn/DSA-Mastery/pull/126>；最终测试结果和仍保留的工作区 dirty 文件已核对，待归档 Trellis 任务。

## 风险与回滚点

- Git merge 可能产生大量重命名结果：以 `origin/main` 为内容基线，先核对冲突再提交；merge commit 可独立回退。
- main 可能在实施期间继续加入新 Lab：不硬编码目录数量为唯一成功条件，记录 fetch 时的实际快照和唯一性结果。
- 旧进度迁移涉及用户数据：必须保留 globalState backup，不能批量删除或移动 snapshot。
- 既有工作区 dirty 文件与本任务重叠时立即停在冲突审查，不用宽泛 `git add .`。
