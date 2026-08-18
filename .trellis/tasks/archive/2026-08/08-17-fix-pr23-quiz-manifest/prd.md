# 修复 PR 23 Quiz manifest CI 失败

## Goal

修复 PR #23 的 GitHub Actions `build` 检查，使新增的 Lab 06-03 满足最新 `main` 上的 Quiz Lab manifest 合同，并将修复推送回同一 PR。

## Background

- PR #23 当前仍可合并，但 `build` 检查失败，因此不能进入正常 Review/合并流程。
- 失败日志明确指出：`labs/chapter-06/lab-06-03-search-theory-quiz/README.md: 交互 Quiz Lab 必须提供 schemaVersion 1 的 lab.json`。
- PR 创建后，`main` 已推进到新的 Lab manifest 合同；现有 Quiz Lab 的标准 manifest 使用 `$schema`、`schemaVersion: 1`、`type: "quiz"` 及单选题配置。
- 本地工作树在开始修复前干净，当前分支为 `codex/search`。

## Requirements

1. 将最新 `origin/main` 合入 `codex/search`，不使用 force push，不丢失 PR #23 已有提交。
2. 在 `labs/chapter-06/lab-06-03-search-theory-quiz/` 新增符合 `schemas/lab.schema.json` 的 `lab.json`，题目文件继续指向现有 `quiz.json`。
3. manifest 使用现有 Quiz Lab 的单项选择题行为：提交后显示解析并按分数计分；不修改 24 道题的题面、答案或解析。
4. 运行冻结锁文件安装、内容校验、完整测试以及 Pages 子路径构建和浏览器测试。
5. 将修复和本任务记录提交并推送到 `codex/search`，更新 PR #23；不直接合并 PR。

## Acceptance Criteria

- [x] `lab-06-03-search-theory-quiz/lab.json` 通过最新 schema 和内容校验。
- [x] 最新 `main` 已进入当前分支，且无未解决冲突。
- [x] `pnpm test` 通过。
- [x] Pages base `/DSA-Mastery/` 的 build/check 与 `pnpm run test:pages` 通过。
- [x] 修复提交已推送到 PR #23，新的 GitHub Actions 检查已触发。

## Out of Scope

- 不修改题库知识内容、QuizSet 组件或 GitHub Actions workflow。
- 不把 Draft PR 标记为 Ready，也不直接合并到 `main`。
