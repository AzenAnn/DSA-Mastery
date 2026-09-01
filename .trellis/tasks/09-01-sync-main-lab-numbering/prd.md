# 同步 main 的 Lab 编号规范并提交 PR

## Goal

让 `feat/vscode-lab-extension` 基于最新 `main` 的 PR#122 内容结构运行，使 VS Code 插件读取真实的分类目录和稳定 Lab 编号；保留已经完成的做题 WebView、统计面板、热图和进度兼容能力，验证后推送分支并创建一个面向 `main` 的 Pull Request。

## Background and Confirmed Facts

- 当前分支为 `feat/vscode-lab-extension`，本地提交包含插件 UI、统计热图和稳定 `labId` 适配；当前分支的课程内容仍有旧的 `labs/chapter-*/lab-*` 平铺目录。
- 当前 `origin/main` 已包含 PR#122 的内容迁移：Lab 位于 `theory/`、`exercise/`、`project/` 分类目录，README frontmatter 提供类似 `01T01`、`01E01` 的稳定 `labId`，标题使用 `Lab 01-E-01` 形式。
- 插件已经实现分类扫描、稳定 ID 主键和旧进度迁移，但在旧内容仍位于当前分支时会回退显示旧目录/旧标题，因此必须先同步 `main` 内容再进行真实仓库验证。
- 当前工作区有既有的 Trellis 日志修改、旧任务归档目录和 `dsa-mastery-labs-0.1.10-manual.vsix`；这些文件不属于本任务，必须保留且不得进入代码提交或 PR。
- 当前功能分支没有待更新的开放 PR；此前同名分支上的 PR 已合并，本任务创建新的 PR。

## Requirements

### R1. 同步 main 的已确认内容变更

- 开始实施时重新获取最新 `origin/main`，以远端 `main` 作为内容规范的唯一来源。
- 使用普通 merge 将 `origin/main` 合并到 `feat/vscode-lab-extension`；不得 rebase、强推或手工复制一份 PR#122 内容。
- 合并后工作区应包含 `theory/`、`exercise/`、`project/` 分类目录和 `labId` frontmatter，并移除已被 `main` 正式替换的旧平铺内容；仅清理了 3 个不含源码的旧 `.lab-cache` 父目录。
- 如果出现冲突，只处理本次同步涉及的内容/插件文件；未识别的既有 dirty 文件不得被覆盖、暂存或删除。

### R2. 保证插件显示和运行使用新编号

- 插件必须发现 `main` 中所有可运行的 `program`/`quiz` Lab，并过滤不支持自动判题的 `project` 或不完整目录。
- 合法 `labId` 作为状态、导航、统计、活动和新快照的稳定身份；实际分类路径仍传给判题 CLI。
- 树视图和 WebView 必须呈现 PR#122 的新编号语义：不再回退到旧的 `Lab 01-06` 作为新内容编号；新内容至少可见 `01E01` 或 `Lab 01-E-01`，且不重复显示编号。
- 旧版本工作区仍可读取旧目录名和旧进度键，并在发现新目录后迁移到稳定 ID；不得删除旧源码快照。

### R3. 验证与交付

- 增补或调整必要的插件测试，覆盖真实 `main` 目录形态、编号显示和旧目录兼容。
- 执行内容校验、插件单测、类型检查、构建及与改动相关的站点/发现检查；任何因本机依赖脚本权限导致的阻断必须如实记录。
- 只提交本任务产生的代码、测试、任务记录和必要文档；不提交 VSIX、构建产物、截图临时文件或既有 dirty 文件。
- 推送 `feat/vscode-lab-extension`，创建目标为 `main` 的 PR。PR 说明读者收益、范围/非目标、实际命令和结果、迁移/回滚风险，并标注 AI 辅助与人工复核点。

## Out of Scope

- 修改 PR#122 已确认的课程知识、Lab 题面、分类规则或网站导航语义。
- 重新设计 WebView、统计面板或热图；除非新内容验证暴露编号显示回归，否则不扩大 UI 范围。
- 删除旧 globalState、旧提交快照、旧 Trellis 归档或清理用户现有未跟踪文件。
- 本任务内重新打包或安装 VSIX；发布安装包另行处理。
- 改写远端共享历史、关闭历史 PR 或把 `main` 的既有内容重复提交到功能分支。

## Acceptance Criteria

- [x] `feat/vscode-lab-extension` 已合并实施开始时最新的 `origin/main=411eb3e`，且没有使用 rebase 或 force push。
- [x] 当前分支的真实 `labs/` 树与 `origin/main` 的 PR#122 分类目录和稳定编号一致；旧正式平铺目录不再作为当前内容来源。
- [x] 真实仓库扫描得到 14 章、193 个可运行 Lab，所有稳定 ID 合法且唯一。
- [x] 树视图、WebView 题面、导航和统计使用新稳定 ID；标题前缀去重测试通过，不会回退显示旧 `Lab 01-06`。
- [x] 旧目录名/旧进度键迁移后仍保留历史、通过状态、最高分和源码快照，且迁移前有 globalState 备份。
- [x] 插件单测、类型检查、构建及相关内容/站点检查通过，实际命令已记录于实施计划。
- [x] 代码提交不包含既有 Trellis 日志 dirty 修改、旧归档目录、VSIX 或生成目录。
- [ ] 分支已推送，PR 已创建到 `main`，PR 文案包含完整验证证据和人工审核说明。

## Open Questions

无。用户已确认以 `main` 中已验证的编号修改为准，并授权创建 Trellis 任务和后续 PR；技术方案由仓库分支历史与项目 Git 规范确定。
