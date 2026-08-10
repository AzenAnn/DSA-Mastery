# Git、Issue 与 Pull Request

## 分支与所有权

- `main` 是唯一正式发布源，始终保持可阅读、可构建。
- 非微小改动从最新 `main` 建短分支；不设长期 `dev`。
- 前缀使用 `chapter/`、`lab/`、`fix/`、`docs/`、`site/` 或明确的 `feat/`。
- 一个 PR 解决一个可说明、可验证的目标；不夹带无关重构或生成物。
- 每章有 Chapter Owner 与 Review Owner，并按章轮换。知识改动的作者不能自行批准和合并。

## GitHub Issue 与 Trellis task 的边界

| 工具 | 负责 |
| --- | --- |
| GitHub Issue | 面向人和社区的需求、学习结果、范围、负责人、讨论与验收 |
| Trellis task | 实现期 PRD/design/plan、上下文清单、会话状态和 AI/维护者执行记录 |
| Pull Request | 实际 diff、验证证据、Review 与合并决定 |

- 章节和独立 Lab 优先使用现有 Issue 模板；小型拼写或明确断链可直接走小 PR。
- 一个 Issue 可拆为多个 Trellis task；task 在 `task.json` notes/meta 或 PR 中关联 Issue，不复制整篇 Issue。
- Trellis task 不能替代需要公开讨论或责任分配的 Issue；Issue 也不承载实现期全部上下文。
- `.trellis/config.yaml` 已设 `session_auto_commit: false` 和 Codex `inline`。由维护者审查、暂存和提交；不要让工具静默提交。

## Commit

使用简化 Conventional Commits：

```text
docs(ch01): explain sequential-list insertion
feat(lab01): add linked-list boundary cases
test(site): cover Pages-base navigation
fix(content): reject mismatched chapter metadata
refactor(site): centralize content indexing
chore: update Trellis specs
```

- 消息写清“做了什么”，避免 `update`、`changes`。
- 每个 commit 是一个可回退的关注点；迁移建议按治理、VitePress、测试/发布、清理、文档分组。
- 不 amend 或强推共享历史；MVP PR 默认 squash merge。
- 提交前区分本任务文件与未识别 dirty 文件，后者不得顺手加入。

## Pull Request 合同

PR 必须说明：

- 读者或维护者得到什么，范围和明确非目标；
- 正文、Lab、网站、依赖或发布行为的变化；
- 实际执行的命令、结果和手工检查页面；
- 最不确定的技术/知识判断；
- AI 参与处及人工如何复核；
- 关联 Issue，迁移类 PR 还附截图、清理表和回滚步骤。

Review 评论用 `blocking`、`suggestion`、`question` 区分。Owner 回复应给修改与验证结果，不只写“已改”。Review Owner 至少独立复现一个示例、Lab、链接路径或关键浏览器流程。

## 合并与紧急修复

- 自动检查绿色、blocking 解决、Review Owner 批准后才合并。
- PR 构建但不部署；`main` push 或手动工作流才部署 Pages。
- 发布失败在短分支修复或用 GitHub Revert 创建回退 PR；不跳检查、不手传 `dist`、不改写 `main` 历史。
