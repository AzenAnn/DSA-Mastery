# 技术设计：同步 main 的 Lab 编号内容并提交插件适配 PR

## 1. 边界与目标

本任务分成两个边界清晰的部分：

1. Git 集成：把最新 `origin/main` 合并到已有的 `feat/vscode-lab-extension`，让本地课程内容与 PR#122 的分类目录、frontmatter 和标题一致。
2. 插件适配：在真实迁移后的内容树上验证并修正 Lab 发现、显示、导航和状态兼容，使插件使用稳定 `labId`，而不是把目录名当作业务身份。

不把主站内容重新实现到功能分支，也不把 VSIX 或生成产物纳入 PR。PR 以 `main` 为 base，因此 main 已有的 PR#122 内容只作为集成基线，不会被重复提交。

## 2. 数据流与身份合同

```text
origin/main 的 labs/chapter-*/{theory,exercise,project}/
  -> README frontmatter.labId
  -> vscode-extension/labIndex.ts
  -> ProgramLab.id（稳定状态身份）
  -> tree / panel / stats / progress / activity
  -> relativePath（仅用于资源访问和判题 CLI）
```

- `ProgramLab.id` 从 `labId` 读取，合法格式为 `^\d{2}[TEP]\d{2,}$`。
- `ProgramLab.name` 只代表当前目录名；`legacyNames` 只用于打开旧内容和迁移旧键。
- `relativePath` 必须保留完整分类路径，例如 `labs/chapter-01/exercise/E-01-01-...`，不能把稳定 ID 当作 CLI 路径。
- 新标题按 main 的 `Lab 01-E-01：...` 规范显示；树视图继续用稳定 ID 加去重后的短标题，WebView 至少展示稳定 ID 元信息，避免旧 `Lab 01-06` 回退。

## 3. 分支集成策略

实施开始时执行 `git fetch origin main`，记录合并前的 HEAD、远端 main 和 dirty 路径。使用普通 `git merge origin/main` 保留已有功能分支提交及可回退的 merge 节点；不 rebase、不 amend、不 force push。

冲突处理优先级：

1. `labs/**` 采用 `origin/main` 已验证的目录迁移结果；只在 Git 无法识别重命名时核对内容，不手工创造第二份 Lab。
2. `tools/vscode-extension/**` 保留当前分支的 WebView、统计、heatmap 和 stable-ID 实现，再按真实 main 内容补充必要显示修正。
3. `.trellis/workspace/**`、旧归档目录和本地 VSIX 不属于同步范围，禁止被暂存或清理。

## 4. 兼容与迁移

`ProgressTracker.migrateLabKeys` 在发现分类 Lab 后运行：旧平铺目录名和稳定 ID 合并为一个稳定记录；迁移前写入 globalState 备份；历史条目仍沿用已有 snapshot 相对路径，新的提交才使用稳定 ID 目录。该策略不依赖“当前 order 推导 ID”，也不搬动或猜测旧快照文件。

## 5. 验证设计

- 静态内容：比较当前分支与 `origin/main` 的 `labs` 路径/文件，解析所有可运行 Lab 的 `labId`，检查唯一性。
- 插件行为：运行现有身份、目录发现、迁移合并、树/WebView、统计和 quiz 测试；若显示层仍直接输出旧标题，先补测试再做最小修正。
- 构建：插件执行直接的 `tsc`、Node test 和 esbuild；根项目执行与内容迁移相关的 validator/discovery/build/check。pnpm 若被本机 esbuild build-script approval 拦截，记录后执行等价命令。
- 交付：检查提交范围、分支与 `main` 的 diff，推送后用 GitHub CLI 创建 PR，并在 PR body 中记录实际 hash、命令、结果和人工复核重点。

## 6. 回滚

- 内容同步问题：回退本次 merge commit，保留已有功能提交；不得使用 `git reset --hard` 覆盖用户工作区。
- 插件适配问题：按发现、显示、迁移、测试的关注点回退对应提交；保留主线已确认的内容迁移。
- PR 发现问题：在同一短分支追加修复提交；不改写已推送历史，必要时由维护者通过 GitHub Revert 回退。
