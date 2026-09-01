# 技术设计：VS Code 插件适配 PR#122 Lab 身份

## 1. 边界与现状

插件入口在 `tools/vscode-extension/src/extension.ts`，Lab 发现和内容元数据在 `src/labIndex.ts`，树视图在 `src/tree.ts`，WebView/导航在 `src/panel.ts`、`src/panelHtml.ts`，进度与快照在 `src/progress.ts`，统计聚合在 `src/stats.ts` / `src/statsPanel.ts`。

当前实现把 `lab.name`（目录名）同时当作展示名、命令参数和 globalState key。PR#122 改为：

```text
labs/chapter-01/<category>/E-01-01-...
  README.md frontmatter.labId = 01E01
        │
        ├─ ProgramLab.id       稳定业务身份 / 状态主键
        ├─ ProgramLab.name     当前目录名 / 资源定位
        ├─ ProgramLab.legacyNames 旧键别名
        └─ ProgramLab.relativePath 当前目录路径 / lab CLI 参数
```

## 2. 发现与身份合同

`discoverProgramLabs` 固定遍历 `theory`、`exercise`、`project` 三个一级分类；不存在的分类静默跳过，以便旧 checkout 和不完整章节继续工作。每个子目录仍交给现有 `loadProgramLab`，因此 `lab.json` 解析失败、类型不支持、quiz 数据损坏、program 无学生源文件的目录继续被过滤。

新增 `labIdentity.ts`：

- `readStableLabId(value, legacyDirectoryName)` 接受 `^\\d{2}[TEP]\\d{2,}$`；
- 空值、非字符串或非法格式回退到目录名；
- 不把目录名、展示顺序或章节 `order` 当作新的稳定身份。

`buildLab` 根据当前新目录名和 frontmatter 的章节/顺序生成迁移别名：

```text
当前分类目录：E-01-04-singly-linked-list-reverse
旧平铺目录：  lab-01-09-singly-linked-list-reverse
稳定 ID：     01E04
```

若缺少可推导的章节/顺序/slug，则只保留当前目录名，不猜测旧键。

## 3. 进度迁移与数据流

`ProgressTracker` 将 schema 从 2 升到 3，并保留 v2 可读性。树首次 refresh 的顺序为：

```text
磁盘扫描 → 生成 ProgramLab[] → migrateLabKeys(labs) → 持久化 → 展示树
```

迁移输入由每个 Lab 产生的 `{ id, name }` 别名组成，覆盖稳定 ID、当前分类目录名和可推导的旧平铺目录名。

### 记录迁移

- `labs` 和 `quizzes` 用 `remapRecordKeys` 将别名移到稳定 ID；
- 同一稳定 ID 有多个来源时分别调用 merge 函数：代码题保留通过状态、最高分、最早通过时间、最近提交，并按提交快照去重合并历史；选择题按题目答案保留较新的/尝试次数更多的答案；
- `events` 用 `remapEventKeys` 只替换 `labName`，保持顺序、时间和事件种类；
- 任何迁移都先写 `${STATE_KEY}.backup.v<old>.<timestamp>`，再写 schema 3 主记录；
- HistoryEntry.snapshot 保持原相对 globalStorage 路径，不移动旧快照；新提交按稳定 ID 创建 `submissions/<labId>/...`。

### 读写合同

迁移完成后：

- `get`/`getQuiz`、`countPassed`、`recordSubmission`、`recordQuizAnswer`、统计章节条和历史读取都用 `lab.id`；
- `findLab`、WebView 导航同时识别 `id`、`name`、`legacyNames`，以覆盖旧命令参数和 retainContext 场景；
- 树命令参数只发送 `lab.id`，避免新目录再次变更导致状态漂移。

## 4. 展示兼容

树节点使用 `lab.id · shortTitle`；shortTitle 去掉 README 标题中的旧/新 Lab 编号前缀，避免 `01E01 · Lab 01-E-01：...` 重复。tooltip 和 WebView header/meta 显示稳定题号。做题面板继续使用 `relativePath` 调用判题 CLI，因此 CLI 看到的是当前分类目录，而不是状态 ID。

## 5. 兼容、风险与回滚

风险主要集中在进度合并：同一题可能同时存在稳定键和旧键，或旧历史快照位于旧目录键下。通过迁移备份、按快照去重、保留 snapshot 路径和纯函数单测降低风险。

回滚方式：

1. 代码回滚到迁移前版本时，schema 3 主记录不会被旧版本识别；因此实现保留迁移前完整备份，必要时可由用户/恢复工具取回 v2 数据。
2. 不删除或移动任何旧 globalStorage 文件；放弃本次代码变更不会破坏题目源文件。
3. 若测试发现目录发现异常，先回滚 `labIndex` 的分类扫描改动，不触碰课程内容和已有 UI 资产。

## 6. 不改变的行为

- `project` 目录只提供可执行 program/quiz 形态时才进入插件；没有 `lab.json` 或自动判题数据仍跳过。
- order/章节排序逻辑保持不变。
- 提交历史、统计热图、结果检查器、深色主题和 WebView 底部操作栏不重新设计。
