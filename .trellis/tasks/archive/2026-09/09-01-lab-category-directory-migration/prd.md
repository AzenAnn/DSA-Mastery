# Labs 三分类目录迁移

## Goal

把 `labs/` 从“章节目录下平铺、以 `lab-章节-旧顺序` 命名”的历史结构，迁移为“章节 → Theory/Exercise/Project → 稳定题目目录”的结构，使文件系统、稳定 `labId`、网站分类、CLI 和交流定位使用同一套身份规则。

## Background

- 当前共有 13 个章节目录、173 个 Lab，全部仍是 `labs/chapter-CC/lab-CC-OO-slug/` 旧目录。
- 当前分类为 Theory 43 个、Exercise 122 个、Project 8 个；分类来源是 `lab.json.type`，README-only Lab 使用 `labCategory`。
- 每个 Lab 已有唯一稳定 `labId`。目录迁移不得重新编号，也不得把展示顺序 `order` 当成身份。
- 现有发现器、VitePress loader、CLI 扫描器和测试都假定 Lab 是章节目录的直接子项。
- 全仓至少 169 个文件含旧 Lab 路径；新增一级分类目录后，Makefile、Schema 路径、README 相对链接和命令示例的相对深度都会改变。
- 9 个“章节 × 分类”组合当前没有题目；Git 不跟踪空目录，需要明确空分类目录的保留方式。

## Requirements

### R1. 目标目录合同

建议目标结构如下：

```text
labs/chapter-01/
├─ theory/
│  └─ T-01-01-sequential-list-quiz/
├─ exercise/
│  └─ E-01-01-sequential-list-deduplication/
└─ project/
   └─ P-01-01-list-workload-analyzer/
```

- 一级分类目录固定为小写 `theory/`、`exercise/`、`project/`。
- 题目目录固定为 `X-CC-SS-kebab-slug`：类型标签在前，随后是章节号、类型内稳定序号和现有英文题目 slug。
- `X-CC-SS` 必须与 `labId: "CCXSS"` 一一对应；禁止继续使用 `lab-` 前缀或旧 `order` 编号。
- 每章都保留三类目录；空分类使用最小占位文件确保目录可见，新增第一道题后移除占位文件。

### R2. 分类与身份不变

- `quiz -> theory/T`、`program -> exercise/E`、`project -> project/P`。
- README-only Lab 只接受显式 `labCategory`，不得根据标题或 slug 猜测。
- 173 个现有 `labId`、`order`、题目 slug、题目内容、测试和解答均保持不变。
- 迁移前生成可审阅的 `oldPath -> newPath -> labId -> category` 映射；要求源路径和目标路径均全仓唯一，无遗漏、无碰撞。

### R3. README 标题同步收口

- 本次目录迁移同时把所有尚未迁移的 frontmatter `title` 和 H1 改为 `Lab CC-X-SS：题目名称`。
- 标题编号只从 `labId` 生成，不从旧目录名或 `order` 生成。
- 页面侧栏继续显示紧凑格式 `CCXSS · 题目名称`。

### R4. 工具和网站适配

- 内容索引、Quiz loader、内容校验和 `scanLabRecords` 改为识别固定的两级结构，不做无边界递归扫描。
- `lab:new` 直接在对应分类目录创建 `X-CC-SS-slug`，并生成正确的标题、Schema 相对路径、Makefile 和 README 命令。
- `lab:locate` 继续通过 `labId` 唯一定位新路径；VS Code 插件继续消费稳定 ID，不依赖旧目录。
- VitePress rewrite、搜索、侧栏、前后页、QuizSet 键值和 Pages 构建全部使用新路径。
- 校验器拒绝分类目录、目录标签、章节号、类型内序号与 `labId` 不一致的状态。

### R5. 全仓引用和相对路径迁移

- 更新课程正文、Lab README、作者指南、安装指南、命令指南、CI、测试和维护脚本中的正式旧路径。
- 新增一级目录后，统一修正 Makefile 的仓库根路径、`lab.json` / `task.json` 的 `$schema` 路径、Lab 到教材/其他 Lab 的相对 Markdown 链接。
- 历史归档、迁移记录或清理报告中仅用于记录过去事实的旧路径不机械篡改；需要明确标注为历史示例，避免被复制为当前规范。

### R6. 迁移安全与回滚

- 实施前只读验证 173 个源目录均位于 `labs/chapter-CC/`，目标均位于对应章节和分类目录，无目标预存在。
- 批量移动必须由确定性迁移脚本执行，并在 dry-run 中输出完整映射；禁止依赖模糊 glob 猜测目标。
- 一个迁移提交完成目录移动和同路径内相对引用修正；工具/规范适配可以拆成前置提交，保证每个阶段可审阅。
- 回滚以提交为单位，不删除题目内容，不重建 `labId`。

### R7. 网站旧 URL 策略

- 新路径是唯一页面地址，不生成旧 URL 跳转页、兼容副本或构建期重定向。
- 所有仓库内正式链接更新为新地址；仓库外收藏、群聊、Issue 和搜索引擎中的旧地址允许返回 404。
- 发布说明必须明确这是一次破坏性路由升级。

## Acceptance Criteria

- [ ] 13 个章节均呈现 `theory/`、`exercise/`、`project/`，173 个 Lab 恰好迁移一次。
- [ ] 分类统计仍为 Theory 43、Exercise 122、Project 8，且没有丢失或新增 Lab。
- [ ] 每个目录名、分类目录、`labId`、manifest/README 类型和稳定标题相互一致。
- [ ] 全仓不存在作为当前路径使用的 `labs/chapter-CC/lab-CC-OO-*`，也不存在新建规则中的 `lab-` 前缀。
- [ ] 所有 Lab 的内部 Schema、Makefile、README 命令和相对链接指向有效目标。
- [ ] `lab:new` 分别创建 T/E/P 三类新目录；`lab:locate` 能定位新旧简写输入对应的新路径。
- [ ] 内容索引仍发现 72 篇教材、173 个 Lab 和现有 516 道交互选择题。
- [ ] Golden Quiz、Program、Project，GCC/Clang/MSVC，学生包脱离仓库运行，VitePress build、Pages 检查和 Playwright 全部通过。
- [ ] 旧 URL 不生成任何页面或跳转，访问代表性旧 Theory/Exercise/Project 地址均得到 404；新地址正常渲染。
- [ ] 迁移后工作区无 `.lab-cache/`、临时映射或测试 fixture 残留。

## Out of Scope

- 不新增、删除或重新设计题目。
- 不修改参考解答、学生骨架、测试数据或评分标准。
- 不重新分配 `labId`，不按目录顺序重排编号。
- 不改变网站侧栏三分类的中文/英文名称和视觉样式。
- 不在规划获批前移动目录、修改产品代码或合并 PR。
