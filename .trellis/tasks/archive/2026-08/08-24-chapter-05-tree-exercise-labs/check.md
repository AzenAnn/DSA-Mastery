# Check：第 5 章树结构题库 Lab

> 日期：2026-08-24
>
> 分支：`codex/chapter05-tree-labs`
>
> 执行者：Azen / Codex

## 范围核验

- [x] 按源文件 09～13 的顺序生成五个 Chapter 5 Theory Quiz Lab。
- [x] 选择题数量依次为 16、9、20、9、13，共 67 题；每题均有四个选项、答案与解析。
- [x] 综合题数量依次为 1、0、5、0、3，共 9 题；不足 5 题的分组未补写新题。
- [x] 五个 README 各只保留一个 `<QuizSet />`，没有静态复制选择题。
- [x] Chapter 5 概览列出五个 Theory Lab；Exercise 与 Project 继续保持空槽位。

## 内容清理

- [x] 公开内容未保留 `source`、`targetId`、原题 ID、可见真题年份/题号或个人路径。
- [x] 未出现“查看原始页面”“相关学习资源”“看交互可视化”“可视化演示”“答案来源说明”等来源或工作流文案。
- [x] 未出现 CodeBrick、OJ、HTTP 外链或 Obsidian wiki link。
- [x] 67 个内部题号均使用 `ch05-NN-qNN` 中性格式且全局唯一。

## Lab 与自动化门禁

- [x] 五个目录的 `pnpm lab:validate` 全部通过。
- [x] 五个目录的 `pnpm lab:verify` 全部通过：分别完成 32/32、18/18、40/40、18/18、26/26 项检查。
- [x] `pnpm run validate` 通过：67 篇教材、85 个 Lab、76 个 manifest、335 道选择题，类型检查与 ESLint 均通过。
- [x] `pnpm run test:discovery` 通过：Chapter 5 五个 Theory 入口与两个空槽位均被自动发现。
- [x] `pnpm test` 通过：Lab 工具、Lab 文档、自动发现、构建与静态产物检查全部通过；最终产物含 199 个 HTML，`base=/`。
- [x] `pnpm run test:pages` 通过：20/20 页面与导航测试通过。
- [x] 最终文档修改后再次运行 `pnpm run test:lab-docs`，检查通过。
- [x] `git diff --check` 通过；只有 Git 的 LF/CRLF 提示，没有空白错误。

## 浏览器核验

在最终静态预览 `http://127.0.0.1:4173/` 上检查：

- [x] Chapter 5 概览正确显示五个 Lab 入口，标题和顺序与 manifest 一致。
- [x] 五个 Lab 实际渲染的选择题/综合题数量分别为 16+1、9+0、20+5、9+0、13+3。
- [x] 五页共渲染 268 个单选项，符合每题四个选项；页面未显示任何禁用来源文案。
- [x] 完成“选择答案 → 提交 → 正确反馈与题解 → 重新作答”，交互状态可正确复位。
- [x] 390×844 视口下页面无根级横向溢出，移动端导航正常显示。
- [x] 浏览器 console 没有 error 或 warning。
- [x] 浏览器验收标签已保留在 Chapter 5 概览页，预览服务继续运行。

## Spec 与测试合同

- [x] 更新 `docs/LAB_AUTHORING_GUIDE.md` 4.1，记录 Chapter 5 当前五个 Theory Lab 与两个空槽位。
- [x] 更新 `.trellis/spec/content/labs.md`，同步 Chapter 5 的实际 Lab 合同。
- [x] 更新 `.trellis/spec/quality/validation-and-pages.md`，要求页面测试精确验证五个 Theory 入口和两个空状态。
- [x] 更新发现、静态产物与页面测试，移除已失效的“Chapter 5 Theory 为空”断言。

## 交付状态

- [x] 工作树没有 `dist/`、临时测试 fixture 或一次性导入脚本。
- [x] 本地分支尚未提交、推送或创建 PR。
- [x] 任务保持 `in_progress`，等待维护者完成预览确认。
