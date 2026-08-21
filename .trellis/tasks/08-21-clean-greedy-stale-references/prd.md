# 清理贪心章节删除内容的残留引用

## Goal

删除与已移除的切分性质和复杂度分析相关的残留引用，运行内容校验并提交变更。

## Background

第 13 章已删除“切分性质”小节以及“复杂度分析”小节。当前教材正文仍有对切分性质的学习目标、描述和判断流程引用，需要清理，避免章节导航和页面摘要暗示已不存在的内容。

## Requirements

- 清理 `content/chapter-13-greedy/` 中对已删除“切分性质”和“复杂度分析”的残留引用，包括概览学习目标/路线、基础页图算法说明、正确性证明页元数据与方法列表、贪心与动态规划页对比表和判断流程。
- 保留已删除的复杂度分析内容，不重新加入新的复杂度章节或段落。
- 不改变本章算法结论、示例、练习、frontmatter 路由字段或其他章节内容。
- 运行内容校验，确认 Markdown、frontmatter、页面排序和内部链接仍然有效。
- 在验证通过后提交本次内容清理变更。

## Out of Scope

- 不重新审阅或重写贪心算法知识正文。
- 不改动 `.vitepress/content-index.ts` 的内容；但由于该文件的现有差异是第 13 章课程注册所必需的，将原样纳入本次章节提交。
- 不补回复杂度分析小节。

## Acceptance Criteria

- [ ] `content/chapter-13-greedy/` 中不再有因删除“切分性质”或“复杂度分析”而产生的残留引用；保留必要的图算法事实说明时，不暗示本章仍提供切分性质的完整证明。
- [ ] 复杂度分析小节保持删除状态。
- [ ] `pnpm run validate:content` 通过。
- [ ] 提交只包含本任务相关的教材、章节注册、Trellis 任务记录，不覆盖其他既有修改。

## Notes

- Keep `prd.md` focused on requirements, constraints, and acceptance criteria.
- Lightweight tasks can remain PRD-only.
- For complex tasks, add `design.md` for technical design and `implement.md` for execution planning before `task.py start`.
