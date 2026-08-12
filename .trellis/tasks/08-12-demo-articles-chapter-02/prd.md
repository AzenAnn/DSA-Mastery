# PRD：第 2 章 栈与队列 demo 文档搭建

## 问题

项目目前只有第 0、1 章内容。维护者希望通过搭建第 2 章（栈与队列）的完整示例文档，验证多章节内容框架的可行性，并在本地预览渲染效果后决定是否归档或提 PR。

## 目标

在分支 `demo-articles` 上创建第 2 章完整文档骨架：

- `content/chapter-02-stack-queue/`：00-overview（章首页）、01-stack、02-queue、03-applications 共 4 篇教材。
- `labs/chapter-02/`：lab-02-01-stack-simulator、lab-02-02-cycle-queue 共 2 个 Lab。

所有文档遵守 `.trellis/spec/content/` 契约：frontmatter 八字段、路径命名、相对 `.md` 链接、status=draft。

## 范围

- 仅新增上述 6 个 Markdown 文件；不改动 `.vitepress/` 任何配置。
- 文风与现有章节一致：中文、严谨、面向课程学习者，使用 callout 与 MathJax 公式（`$$...$$` 块级、`$...$` 行内；不使用 amsthm 定理环境）。
- 运行 `pnpm run validate:content`、`typecheck`、`lint`、`test:discovery`、`build`、`check:site` 并记录真实结果。

## 非目标

- 不推送、不开 PR、不合并——由维护者本地预览后决定。
- 不修改既有章节内容。
- 不新增 VitePress 配置或组件。

## 验收标准

1. `pnpm run validate:content` 通过（新章节所有字段/路径/排序合规）。
2. `pnpm run build` 成功，`check:site` 产物审计通过（章节数从 2 变为 3）。
3. `pnpm run dev` 后侧栏出现「第 2 章 · 栈与队列」，4 篇教材 + 2 个 Lab 可导航。
4. callout 与公式在浏览器中渲染正常（维护者手动确认）。
5. 工作树只含本任务文件。

## 决策记录

- 分支名 `demo-articles`（用户确认，修正了笔误拼写）。
- 第 2 章选「栈与队列」，作为第 1 章线性表的自然续接。
