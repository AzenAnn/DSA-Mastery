# 选择题一键提交测评

## Goal

让 VS Code 插件侧边栏中选择题名称后的播放形按钮，能够一次提交当前已选择、但尚未提交的选项；不重新渲染题目面板，也不丢失学习者的选择。

## Confirmed Facts

- Issue [#187](https://github.com/AzenAnn/DSA-Mastery/issues/187) 报告该播放形按钮无法一键测评，并会清空未提交的选择；用户已确认入口是 VS Code 插件的侧边栏按钮，而非网页端的答案总览。
- `tools/vscode-extension/package.json` 把侧边栏的播放图标绑定到 `dsaMastery.submit`，且该菜单同时适用于普通 Lab、Quiz 与 Project。
- `tools/vscode-extension/src/extension.ts` 对该命令总是先执行 `LabPanel.show(lab)`，随后调用 `LabPanel.submitActive()`。
- 对 Quiz，`LabPanel.show()` 会从已持久化进度重新生成 WebView；尚未点击“提交本题”的单选值只存在于旧 WebView DOM，因此在重载时丢失。随后 `LabPanel.submit()` 只显示“选择题请在题目中逐题作答”，不会评分。
- Quiz 的单题提交已通过 `quizAnswer` 消息调用 `ProgressTracker.recordQuizAnswer()`，该路径负责记录进度、反馈、右侧树装饰与完成状态。
- 独立插件的基线已通过：TypeScript 类型检查、41 项测试与 esbuild 打包均成功。

## Requirements

1. 点击当前已打开 Quiz 的侧边栏播放按钮时，扩展不得重新加载其 WebView；应向该 WebView 请求所有已选择且未提交的答案。
2. WebView 应把这些答案作为一个批量消息交给扩展宿主；宿主逐题复用既有 Quiz 提交和进度记录路径。
3. 每道已选择题提交后必须保留选项选择，显示正确/错误、正确答案与解析，并更新进度、完成徽章和侧边栏状态。
4. 未选择题保持未作答、可继续选择；已提交题不得再次计入本批次。
5. 在尚未打开目标 Quiz 或目标不是当前 Quiz 时，播放按钮可打开目标题目，但不得虚构提交或清空其他 Quiz 的未提交选择。
6. Program 与 Project 的播放按钮仍沿用现有判题提交流程。

## Acceptance Criteria

- [x] 已在当前 Quiz 面板中选择多道题但不点击“提交本题”时，点击侧边栏播放按钮后，不发生 WebView 重载，所有已选题均显示测评反馈并保留各自选择。
- [x] 未选择题仍是可选状态，未显示反馈，也不产生 Quiz 提交记录。
- [x] 一键提交后的正确数、完成徽章及侧边栏题目装饰与既有逐题提交一致。
- [x] 对同一 Quiz 再次点击播放按钮不会重复提交已锁定题目；Program/Project 的播放提交行为不变。
- [x] 回归测试覆盖“宿主请求 → WebView 批量传回 → 宿主逐题记录”的桥接契约，并通过扩展的类型检查、全量测试和打包。

## Out of Scope

- 修改网页端 `QuizSet.vue`、题库内容、题目得分模型或 VS Code 的持久化 schema。
- 跨设备同步进度或保存尚未提交的临时选择。
- 自动猜测或提交未选择的答案。

## Technical Notes

- 在 `dsaMastery.submit` 的 Quiz 分支中改为调用专用的 `LabPanel` 批量提交入口；Program/Project 保持现有 `show` 后 `submitActive` 路径。
- 专用入口仅在当前面板正显示同一 Quiz 时向 WebView `postMessage({ type: "submitQuiz" })`；否则只加载/显示目标 Quiz。
- `panelHtml.ts` 从未禁用且已选中的 radio 收集 `{ questionId, selected }`，回传 `quizAnswers`；`panel.ts` 顺序调用现有单题处理逻辑。
- 任务为轻量扩展交互修复，使用 PRD + 现有扩展测试套件，不新增设计或实施文档。

## Risks / Deferred Items

- 宿主无法直接读取 WebView DOM；必须使用消息桥接，不能在命令处理中重渲染当前 Quiz。
- WebView 消息属于不可信输入，批量处理需校验题目 ID、选项索引并去重；本任务不改变当前单题提交通道的产品语义。
