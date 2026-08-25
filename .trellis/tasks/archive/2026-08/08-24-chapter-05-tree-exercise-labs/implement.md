# Implement：第 5 章树结构题库 Lab

## 前置状态

- [x] 从最新 `origin/main` 创建 `codex/chapter05-tree-labs`，原 PR #61 已合并。
- [x] 创建 Trellis 任务并核对 Lab 内容、机器接口、质量与 PR 规范。
- [x] 确认 09～13 源文件、题目边界、实际题量与既有 Chapter 4 Quiz 模式。
- [x] 确认公开页面隐藏题源与个人发布痕迹，内部 ID 改用中性编号。
- [x] 维护者批准本规划摘要后运行 `task.py start`。

## 实施顺序

1. 使用 `pnpm lab:new` 为 Chapter 5 的 order 1～5 创建五个 Quiz 骨架，检查脚手架未覆盖既有目录。
2. 按源文件顺序解析并复核 67 道选择题，将题面、四选项、答案、解析、难度、考点和分值写入各自 `quiz.json`。
3. 编写五个 README；迁移 9 道综合题的题面与折叠参考解析，无综合题的两页保留明确空状态。
4. 清除所有来源字段、题目标识、真题/巩固题标题后缀、CodeBrick/OJ/可视化链接、生成声明、Obsidian wiki link 与个人工作流措辞。
5. 更新 Chapter 5 概览的 Labs 状态，不修改自动分类组件或手写 Lab 清单。
6. 逐文件人工复读：题目顺序、答案索引、公式、代码块、选项辨析、综合题折叠边界和 Markdown 围栏。

## 结构与清洗检查

- 对五个 `quiz.json` 统计题量，断言分别为 `16, 9, 20, 9, 13`，总计 67。
- 对五个 README 统计综合题，断言分别为 `1, 0, 5, 0, 3`，总计 9。
- 断言每题恰好四个非空且不重复选项、答案为 0～3、ID 全局唯一、解析非空。
- 断言每个 README 恰好一个 `<QuizSet />`，不存在静态选择题副本。
- 执行清洗扫描：
  - `rg -n '查看原始页面|相关学习资源|看交互可视化|答案来源说明|答案来源：.*Codex|CodeBrick|题目标识|"source"|"targetId"|\[\[' labs/chapter-05`
  - 另行检查可见真题年份/题号、题库 ID、HTTP 外链和个人路径；期望均无匹配。

## 自动验证

1. 对五个目录分别运行 `pnpm lab:validate -- <lab-path>` 与 `pnpm lab:verify -- <lab-path>`。
2. 运行 `pnpm run validate`、`pnpm run test:discovery`、`pnpm run build`、`pnpm run check:site`。
3. 运行完整 `pnpm test`；若与前述命令重叠，以最终一次完整结果作为 PR 主证据。
4. 运行 `git diff --check` 和 `git status --short`，确认没有 `dist/`、缓存或临时 fixture 进入工作树。

## 浏览器验收

1. 启动最终静态产物预览，不以开发服务器代替构建结果。
2. 从 Chapter 5 页面展开“本章 Labs → 理论 Theory”，确认五个 Lab 顺序和链接；Exercise/Project 显示原有空状态。
3. 桌面与 390px 窄屏检查五个页面的标题、题量、四选项、公式/代码块、综合题折叠和根页面横向溢出。
4. 在至少一个 Lab 完成“选择 → 提交 → 对错反馈 → 题解 → 重试”，并检查浏览器 console、page error、同源请求失败。
5. 保持预览服务运行并把本地地址交给维护者；此时不提交、不推送、不创建 PR。

## 确认后的交付

1. 收到维护者明确预览确认后，运行最终差异与门禁复查。
2. 按关注点提交内容与 Trellis 记录，推送 `codex/chapter05-tree-labs`。
3. 创建面向 `main` 的独立 PR，说明题量、隐藏来源决定、验证证据、AI 转换范围与人工知识/版权复核风险。
4. 不自行批准、合并或触发 Pages 发布；任务归档与会话记录按 Trellis 完成流程处理。

## 风险文件与回滚点

- `labs/chapter-05/lab-05-*/quiz.json`：答案索引和 Markdown 转义是主要风险，逐题和 Schema 双重核验。
- `labs/chapter-05/lab-05-*/README.md`：综合题体量大，重点检查围栏、折叠容器和来源残留。
- `content/chapter-05-tree-applications/00-overview.md`：只更新 Labs 现状，不改章节知识结构。
- 预览确认前所有变更仅在本地新分支，可逐 Lab 回退；禁止改写或强推共享历史。
