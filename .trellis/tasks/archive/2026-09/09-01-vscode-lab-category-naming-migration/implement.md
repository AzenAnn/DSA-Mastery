# 实施计划：VS Code 插件适配 PR#122 Lab 身份

## 开始前检查

- [x] 确认当前分支仍为 `feat/vscode-lab-extension`，不覆盖已有 UI、heatmap 或本地打包产物。
- [x] 仅在插件目录和本任务规划文件范围内修改；不把 `*.vsix`、`.lab-cache`、构建目录加入提交。

## 有序步骤

1. [x] 先补纯函数测试：稳定 ID 校验；旧平铺键、分类目录键到稳定 ID 的映射；键冲突合并；活动事件键重写。
2. [x] 更新 `labIndex.ts`：扩展 `ProgramLab` 的稳定 ID/别名字段，扫描三类目录，构造旧目录别名，并保留旧格式回退。
3. [x] 更新状态和业务引用：加入 `progressKeys.ts`，升级进度 schema，执行迁移备份/合并；将树、面板、扩展命令、统计统一切换到稳定 ID，同时保留参数别名解析。
4. [x] 更新树/WebView 编号展示和必要类型/文案，确保标题不重复且 CLI 路径仍使用实际目录。
5. [x] 运行插件单测、类型检查、构建；用 PR#122 的目录形态做发现/导航/迁移回归检查。
6. [x] 检查 diff 与工作区，确认未误改课程内容、现有 UI 资产或本地 `.vsix`；更新插件层 Trellis 规范记录。

## 验证命令

```bash
cd tools/vscode-extension
pnpm test
pnpm run typecheck
pnpm run build
```

若依赖安装已被 pnpm build-script approval 阻断，先依据现有 `package.json#pnpm.onlyBuiltDependencies` 处理本地安装状态，再运行上述命令；不修改锁文件。

## 风险文件与回滚点

- `src/labIndex.ts`：扫描路径改变，最容易导致题目消失；先用发现测试锁住三类目录。
- `src/progress.ts` / `src/progressKeys.ts`：用户数据迁移；必须保留备份并通过冲突合并测试。
- `src/tree.ts` / `src/panel.ts` / `src/extension.ts`：身份参数切换；保留 `name` 别名以支持旧命令和面板上下文。
- `src/panelHtml.ts`：只做编号显示，不动已有 WebView 布局。

每个风险组均可独立回退：发现、迁移、调用方、展示；课程内容和生成的 VSIX 不作为代码回滚目标。

## 开始实施的门禁

- [x] `prd.md` 已完成 PRD convergence pass，要求/范围/验收可观察且无阻塞问题。
- [x] `design.md` 与本清单已覆盖发现、身份、迁移、兼容和验证。
- [x] 用户明确批准本次最终规划摘要后，才运行 `task.py start` 并修改产品代码。
