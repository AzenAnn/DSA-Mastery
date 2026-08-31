# Lab 稳定 ID 与自动编号：执行计划

## 1. 编号内核与脚手架

- [x] 新增稳定 ID 解析、格式化、扫描、分配和定位模块。
- [x] 更新 `lab:new`：自动类型序号、可选展示 order、新目录、JSON/人类输出。
- [x] 新增 `lab:locate` package script、CLI 分支、帮助和错误合同。
- [x] 扩充 `tests/lab-tools.test.mjs` 覆盖独立递增、max+1、简写和定位。

## 2. 内容合同与存量数据

- [x] 新增幂等迁移脚本，明确 Ch.0 README-only 分类。
- [x] 为全部现有 Lab 写入唯一 `labId`，不移动目录。
- [x] 更新 `validate-content`：新旧路径、稳定 ID、类别标签、唯一性和标题合同。
- [x] 更新 ContentIndex、Quiz loader、发现与产物检查的目录识别。

## 3. 网站与插件

- [x] 在网站 Lab 列表、侧栏/详情元数据中显示稳定 ID。
- [x] 精简侧栏 Lab 文案为“稳定 ID + 题目名称”，移除重复的旧编号前缀。
- [x] 在 VS Code Lab 模型中读取和展示稳定 ID。
- [x] 将新进度键改为稳定 ID，并实现旧目录键/事件/历史快照兼容迁移。
- [x] 增加扩展编号读取与进度键迁移测试。

## 4. 文档与规范

- [x] 更新 `docs/LAB_AUTHORING_GUIDE.md`。
- [x] 更新 `docs/LAB_CLI_COMMAND_GUIDE.md`、`docs/UPDATE_WORKFLOW.md`、项目蓝图中仍生效的 Lab 命名说明。
- [x] 更新 `.trellis/spec/content/labs.md` 与 `lab-tooling.md`。
- [x] 更新文档自动检查，确保新命令、参数和示例不漂移。

## 5. 验证与检阅

- [x] `pnpm run test:lab-tools`
- [x] `pnpm --dir tools/vscode-extension test`
- [x] `pnpm --dir tools/vscode-extension typecheck`
- [x] `pnpm run test:lab-docs`
- [x] `pnpm run validate`
- [x] `pnpm run test:discovery`
- [x] `pnpm run build`
- [x] `pnpm run check:site`
- [x] `pnpm run test:pages`
- [x] 检查 git diff、存量目录未发生 rename、所有 Lab ID 唯一。
- [x] 启动本地 preview，提供地址和重点检阅路径；等待用户确认。
- [x] 用户确认后精简侧栏文案；按用户要求不重跑完整预览，仅通过 `pnpm run typecheck` 与定向 ESLint 检查。

## Commit / Push Gate

- 用户检阅确认前不 commit、不 push。
- 确认后按 `quality/git-and-pr.md` 检查分支与变更范围，再提交并推送当前功能分支。
