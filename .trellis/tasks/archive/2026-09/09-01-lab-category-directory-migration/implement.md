# Labs 三分类目录迁移：实施清单

## Phase A — Baseline and branch

- [ ] 确认 PR #121 已合并，保存当前规划文件。
- [ ] 同步 `origin/main`，从最新 main 创建独立迁移分支。
- [ ] 记录迁移前统计：13 章、173 Lab、Theory 43、Exercise 122、Project 8、516 Quiz。

## Phase B — Target-layout infrastructure

- [ ] 在 `tools/lab/identity.mjs` 建立 category/tag/path 的唯一格式化与解析合同。
- [ ] 更新 `scanLabRecords`、分配器、定位器和 CLI 测试。
- [ ] 更新 `lab:new` 输出目录、README 命令、Schema 和薄 Makefile深度。
- [ ] 更新 `.vitepress` 内容索引、loader、rewrite 和 Quiz 键。
- [ ] 更新内容校验器，只接受 `chapter/category/X-CC-SS-slug`。
- [ ] 添加 T/E/P 新建、发现、定位、错误分类和目录/ID 不一致的回归测试。

## Phase C — Migration map and dry-run

- [ ] 实现默认只读的迁移脚本及 `--write` 开关。
- [ ] 生成 173 条映射并写入 `research/lab-path-mapping.json`。
- [ ] 断言所有源/目标解析后都在对应 `labs/chapter-CC` 内，目标无预存在、无碰撞。
- [ ] 人工抽查 Ch.0、Ch.1、Ch.2、Ch.8、Ch.13 和三类题型。

## Phase D — Move and rewrite

- [ ] 运行迁移脚本移动 173 个目录。
- [ ] 将所有 README title/H1 收口到稳定编号。
- [ ] 修复所有 Markdown 相对链接、README 命令、Schema 和 Makefile。
- [ ] 更新正文、docs、CI、测试、Golden Lab、VS Code 文档与正式维护脚本中的旧路径。
- [ ] 为 9 个空分类目录保留 `.gitkeep`。
- [ ] 审查剩余 `labs/chapter-CC/lab-` 匹配，只允许明确标注的历史记录。

## Phase E — Strictness and specs

- [ ] 移除旧目录发现和旧 URL rewrite；代表性旧页面构建产物必须不存在。
- [ ] 更新 `.trellis/spec/`、Lab 作者指南、CLI 指南、项目蓝图和工作流文档。
- [ ] 更新脚手架/Golden 示例，使未来 Agent 只能生成新结构。

## Phase F — Verification

- [ ] `pnpm run validate`
- [ ] `pnpm run test:lab-tools`
- [ ] `pnpm run test:lab-docs`
- [ ] `pnpm run test:discovery`
- [ ] `pnpm run test:lab-golden`
- [ ] `pnpm run test:lab-make`
- [ ] `pnpm run build`
- [ ] `pnpm run check:site`
- [ ] `pnpm run test:pages`
- [ ] 抽查三类新 URL 200，三类旧 URL 404。
- [ ] 运行 GCC、Clang、MSVC 对应 CI，并确认学生包脱离仓库运行。
- [ ] `git diff --check`、迁移后统计、无缓存/fixture 残留。

## Commit and PR

- [ ] 按“基础设施 / 目录迁移 / 规范与测试”组织可审阅提交。
- [ ] 推送新 PR，不自动合并，由用户在 GitHub 手动合并。
