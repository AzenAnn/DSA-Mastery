# Lab 稳定 ID 与自动编号：技术设计

## 1. 数据合同

稳定身份放在所有 Lab 都具备的 README frontmatter：

```yaml
labId: "02T03"
```

选择 frontmatter 而不是只放 `lab.json`，是因为仓库仍有 README-only Lab；这可以让网站、迁移脚本和插件消费同一字段，而不强迫旧 Lab 伪造可执行 manifest。

`order` 保留为章节内展示顺序。`labId` 的序号是章节与类型内的追加型身份，两者不得互相推导。

## 2. 编号模块

新增 `tools/lab/identity.mjs`，集中提供：

- 类型、分类和 `T/E/P` 映射；
- 规范 ID 的格式化、解析和简写规范化；
- 新旧 Lab 目录名识别；
- 扫描 README frontmatter；
- 类型内最大序号加一、章节最大展示顺序加一；
- 根据 ID 唯一定位 Lab。

编号使用 `max + 1`，不使用数量加一。规范 ID 最少两位序号，但解析和目录允许超过 99，避免未来扩容时改变合同。

## 3. 路径兼容

内容发现同时接受：

```text
旧：lab-02-11-undoable-browser
新：lab-02-P-01-undoable-browser
```

旧目录继续用路径中的全局 order 校验原有标题；新目录用稳定 ID 校验路径和 `Lab 02-P-01：` 标题。所有 URL 仍由实际目录派生，所以存量链接不变。

## 4. 自动创建与定位

`lab:new` 输入 `type/chapter/slug`，可选 `order`：

1. 扫描同章所有 README；
2. 验证已存在 ID 能规范解析；
3. 对目标标签取最大序号加一；
4. 省略 order 时取该章最大展示顺序加一；
5. 生成新格式目录和匹配 frontmatter；
6. 原子拒绝已存在目标目录。

`lab:locate` 规范化输入后扫描稳定 ID，零匹配返回 `LAB_ID_NOT_FOUND`，多匹配返回 `LAB_ID_DUPLICATE`。

## 5. 存量迁移

保留 `scripts/migrate-lab-ids.mjs` 作为可审计的迁移工具：默认只预览，`--write` 才写入。它按 `chapter -> category -> order -> path` 分组，为存量 Lab 分配编号并只在 frontmatter 插入 `labId`。无 manifest 的 Lab 必须已有 `labCategory`；Ch.0 两个旧 Lab在迁移前分别明确为 Theory 与 Exercise。

脚本重复执行应保持幂等；已有 ID 若与计算结果不符则报错，不静默改号。

## 6. 网站数据流

```text
README.labId
  -> validate-content
  -> content-index CourseDocument.labId
  -> LabsIndex / DocumentHeader / sidebar
  -> VitePress build / search / Pages checks
```

列表和详情页显示稳定 ID，标题正文保持不变。目录发现、Quiz loader、临时发现测试和产物检查都接受新旧两种目录。

章节侧栏的“本章 Labs”和“相关 Labs”均在构建 ContentIndex 时通过同一 helper 裁掉旧标题前缀，只输出 `labId · 题目名称`。这是纯展示变换，不写回 README，也不改变详情页标题、目录或公开 URL。

## 7. VS Code 兼容

`ProgramLab` 同时保留：

- `id`：稳定 ID，作为新进度主键；
- `name`：目录名，用于路径、旧命令参数和迁移别名。

进度 schema 升级一版。题目首次发现后执行键迁移：

- `labs[name] -> labs[id]`；
- `quizzes[name] -> quizzes[id]`；
- `events[].labName` 规范为稳定 ID；
- 迁移前写入带时间戳的 globalState 备份；
- 历史快照继续使用每条记录自带的 `snapshot` 路径，因此旧目录不移动；新快照写入稳定 ID 目录；
- 清理历史时按记录中的 snapshot 路径删除，兼容新旧位置。

树、面板、历史和统计均使用 `id` 查询进度，但导航仍可同时按 `id` 或目录名解析。

## 8. 并发、失败与回滚

本地扫描无法感知另一未合并分支。重复 ID 由全仓内容校验和 CI 阻断，后合并分支同步 main 后重新创建或使用迁移工具修正未发布 Lab。

回滚时可独立撤销代码和 frontmatter 变更；旧路径从未改变。VS Code 迁移前保留备份，未知 schema 继续采用现有保守备份策略。
