# Labs 三分类目录迁移：技术设计

## 1. Architecture

目标路径是唯一事实来源：

```text
labs/chapter-CC/<category>/<X-CC-SS-slug>/
```

固定映射：

| manifest / frontmatter | 分类目录 | 标签 |
| --- | --- | --- |
| `quiz` / `theory` | `theory` | `T` |
| `program` / `exercise` | `exercise` | `E` |
| `project` / `project` | `project` | `P` |

题目目录名由 `labId: CCXSS` 与既有 slug 生成 `X-CC-SS-slug`。目录路径、`labId`、分类和标题必须能互相验证，但 `labId` 仍是跨网站、CLI 和插件的永久身份。

## 2. Discovery and validation

共享身份层提供分类目录常量、目录名格式化器与解析器。扫描器固定执行三层遍历：

```text
labs -> chapter-CC -> theory|exercise|project -> X-CC-SS-slug
```

不使用无界递归，避免误收 `.lab-cache`、student pack 或内部 task。每条记录同时验证：

1. `chapter-CC` 等于 frontmatter `chapter` 和 `labId` 章节；
2. 分类目录等于 manifest type / `labCategory`；
3. 目录标签和序号等于 `labId`；
4. README title/H1 等于稳定标题格式；
5. 全仓 `labId`、目标路径和 `chapter + order` 唯一。

迁移完成后不保留旧目录解析器。CLI 的 `lab:locate` 仍接受 `02T3` 等 ID 简写，但只返回新路径。

## 3. Website data flow

- `.vitepress/content.data.ts` 监听三个分类层下的 README。
- `.vitepress/content-index.ts` 按固定三分类目录收集 Lab。
- `.vitepress/quiz.data.ts` 在分类目录下读取 `quiz.json`，键继续使用 README 的源目录路径。
- VitePress rewrite 改为 `labs/:chapter/:category/:lab/README.md -> labs/:chapter/:category/:lab/index.md`。
- 侧栏、搜索、前后页和 VS Code 插件继续消费 ContentIndex / `labId`，不从目录名称重新发明身份。
- 不添加旧 rewrite、跳转 HTML 或旧构建产物；旧 URL 应 404。

## 4. Scaffolding contract

`lab:new` 根据 type 选择分类目录，并创建：

```text
labs/chapter-02/exercise/E-02-09-stack-merge/
```

新增一级目录后统一调整：

- Lab `lab.json` Schema：`../../../../schemas/lab.schema.json`；
- 薄 Makefile：`REPO_ROOT := $(LAB_DIR)/../../../..`，include `../../../../tools/lab/lab.mk`；
- Project task/report Schema 相对路径各增加一级；
- README 中的 pnpm 路径使用新目录。

## 5. Deterministic migration

新增一次性迁移工具，默认 dry-run，显式 `--write` 才修改。它执行：

1. 扫描 173 个旧 Lab，读取 `labId`、type/category 和旧 slug；
2. 生成排序稳定的 `oldPath -> newPath` 映射；
3. 验证源目录、目标父目录、目标路径和分类，无遗漏、重复、越界或已存在目标；
4. 计算移动前后每个 README Markdown 相对链接的真实目标，并按新文件位置重写；
5. 更新稳定 title/H1、根相对命令、Schema 和薄 Makefile；
6. 将目录移动到分类层；
7. 全仓替换作为当前引用的旧仓库相对路径；
8. 为 9 个空分类目录写入 `.gitkeep`；
9. 重新扫描并断言总数与分类统计未变。

迁移映射作为审计产物写入任务 research 目录；产品运行时不读取它，也不用于 URL 重定向。

## 6. Rollout and rollback

提交顺序：

1. 身份层、发现器、脚手架和测试先支持目标结构；
2. 迁移脚本与映射完成 173 个目录移动及引用修正；
3. 删除旧结构兼容、同步规范和文档；
4. 全量验证后提交 PR。

实施分支从已合并 PR #121 的最新 `main` 创建。任何阶段出现映射不唯一、文件丢失或路径逃逸立即停止；回滚使用本任务提交，不运行删除式清理。

## 7. Main risks

- 多一级目录导致 Makefile、Schema 和 Markdown 相对路径整体偏移；通过真实路径解析重写和全仓链接校验解决。
- Git 大规模移动可能被显示成删除/新增；保持文件内容机械变化最小，并分离工具提交与迁移提交以提高 rename 检测率。
- Windows 大小写和路径分隔符与 Pages/Linux 不同；目录合同固定 tag 大写、category 小写，映射内部统一 POSIX 路径。
- 历史文档中的旧路径可能是事实记录；迁移工具只自动替换明确的正式路径，最终人工审查剩余匹配。
