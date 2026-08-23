# Check：第 4 章两篇理论文章重写

> 日期：2026-08-23
>
> 分支：`chapter4`
>
> 执行者：Azen / Codex

## 范围核验

- [x] `content/chapter-04-tree/` 仅保留 `00-overview.md` 与 `01-binary-tree.md` 两篇文章。
- [x] 4.1.1～4.1.4 覆盖树的术语、性质、Tree ADT、三种存储与一般树 C/C++ 工程实现。
- [x] 4.2.1～4.2.5 覆盖二叉树定义、Full/Complete/Perfect、四类数量性质、顺序/链式/线索存储与创建销毁。
- [x] `02-tree-applications.md`、`03-heap.md` 已删除，产品源码与课程配置没有失效引用。
- [x] 课程侧栏真实渲染只出现 4.1 与 4.2 两条第 4 章页面链接。

## 自动门禁

`pnpm test` 退出码为 `0`，实际覆盖：

- [x] 内容校验：57 篇教材、59 个 Lab、49 个新式 manifest、151 道交互选择题。
- [x] TypeScript 类型检查与 ESLint。
- [x] Lab 工具：32 项通过、1 项因 Windows 符号链接策略按预期跳过。
- [x] Lab 文档合同。
- [x] 自动发现：临时教材与 Lab 进入构建、导航和搜索后被安全清理。
- [x] VitePress 构建：167 个 HTML。
- [x] 静态产物检查：57 篇教材、59 个 Lab、25 个课程框架页，`base=/`。

构建仅报告项目既有的 chunk size 提示，没有失败或新增警告。

## 代码核验

以下正文代码框均直接送入 GCC/G++，使用 `-Wall -Wextra -Werror -fsyntax-only`，全部通过：

- [x] `general-tree.c`
- [x] `general-tree.cpp`
- [x] `binary-tree.c`
- [x] `binary-tree.cpp`

## 浏览器核验

在最终静态预览 `http://127.0.0.1:4173/` 上检查：

- [x] 两篇新页面均返回 HTTP 200；两篇旧 Demo 路径均返回 HTTP 404。
- [x] 桌面端宽度 1265px 无根页面横向溢出，4.2 页面无控制台 error/warning。
- [x] 390px 窄屏下两篇页面均无根页面横向溢出，桌面侧栏正确收起。
- [x] 4.1 渲染 13 个理论语义块、6 个带标题代码框和 3 张表格，无未解析 `:::`。
- [x] 4.2 渲染 19 个理论语义块、11 个带标题代码框、3 张表格和 86 个 MathJax 容器，无未解析 `:::`。
- [x] 浏览器验收标签已保留在 4.1 页面，预览服务继续运行。

## Spec 更新判断

本次只使用既有 frontmatter、理论 Markdown、代码框、自动发现和验证合同，没有新增或修改作者 API、路由字段、组件输出或质量门禁。现有 `content/frontmatter-and-routing.md`、`frontend/theory-markdown.md` 与 `quality/validation-and-pages.md` 已完整覆盖实施方式，因此不修改共享 spec，避免重复一次性文章内容。

## 交付状态

- [x] `git diff --check`
- [x] 工作树只有本任务的内容、课程来源清理、父路线同步与 Trellis 记录；没有生成物或测试 fixture。
- [x] 按用户要求保留任务 `in_progress`，未提交、未推送、未归档，等待人工验收。
