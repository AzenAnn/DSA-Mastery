# Ch.1 文本结构图 Graphviz 化：实施计划

## Implementation Checklist

1. 读取目标文件当前内容与相关 Trellis 规范，记录 12 个原始 `text` 块的语义清单。
2. 在 `01-abstract-data-type.md` 中迁移面向接口解耦图，添加稳定 ID/caption。
3. 在 `02-sequential-list.md` 中迁移连续内存、扩缩容振荡、滞后阻尼 3 个图，添加稳定 ID/caption。
4. 在 `03-linked-list.md` 中迁移插入前布局、右移轨迹、离散链表、dummy head、tail 前驱、循环哨兵 6 个图，添加稳定 ID/caption。
5. 在 `04-comparison-and-selection.md` 中迁移缓存局部性对比和选型决策树 2 个图，添加稳定 ID/caption。
6. 用搜索检查目标 12 个旧 `text` fence 已消失、12 个 ID 唯一、截图外 `text` 块未被改动。
7. 运行本地校验、构建和站点产物检查，确认新 SVG 缓存生成；检查构建产物中 12 个 figure/img/caption。
8. 设置 Pages base 重复构建与产物检查，验证图资源路径。
9. 在 1440px/390px、浅色/暗色检查 4 个目标页面的图形、caption 和页面横向溢出；若宽度或字重不合格，仅调整对应 DOT。
10. 运行最终全范围质量检查，记录验证证据，更新必要的 Trellis 任务/日志；不提交 `dist/pages`。

## Validation Commands

```powershell
pnpm install --frozen-lockfile
pnpm run validate
pnpm run build
pnpm run check:site
$env:GITHUB_PAGES_BASE_PATH = "/DSA-Mastery"
pnpm run build
pnpm run check:site
Remove-Item Env:GITHUB_PAGES_BASE_PATH
```

根据前述命令结果和改动风险，再决定是否补跑 `pnpm test` 与 `pnpm run test:pages`；最终至少满足 PRD 的 AC4/AC5。

## Review Gates

- 开始实现前：PRD、设计和实施计划经用户明确批准。
- 每篇文档完成后：逐图对照原始文本，确认标签/边/顺序无遗漏。
- 构建后：只接纳与 12 个新 diagram ID 对应的 SVG 缓存，不夹带无关缓存变更。
- 交付前：检查工作区差异只包含本任务文档、4 篇教材 Markdown、12 个图缓存及必要的 Azen Trellis 记录。

## Rollback Points

- 单篇图语法失败：只回退或修正该篇 Markdown 对应图，不改插件。
- Pages 路径失败：先核对现有 base/插件合同；本任务不扩大为配置重构。
- 移动端溢出：调整 DOT 布局或拆行，不新增全站 CSS 补丁。
