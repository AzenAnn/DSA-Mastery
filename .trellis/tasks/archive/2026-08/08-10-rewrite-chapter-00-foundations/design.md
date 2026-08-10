# Design

## Boundaries

课程正文仍以 Markdown 为唯一数据源。此次主要改第 0 章内容及由 route 改名直接影响的说明和测试；VitePress 内容发现、主题组件和依赖保持不变。用户复查预览后发现浅色站点主题仍使用 `github-light` token，而代码表面固定为深色，允许把 Markdown Shiki 主题改为单一的 `github-dark-high-contrast`，并在现有 `custom.css` 中补齐代码正文和行号令牌映射。

## Target Content Layout

```text
content/chapter-00-introduction/
  00-overview.md
  01-data-structure-basics.md
  02-algorithm-complexity-analysis.md
```

`00-overview.md` 继续是章首页。两个正文文件分别保持 `order: 1` 和 `order: 2`，由现有 ContentIndex 自动生成侧栏、搜索、前后页和公共 route。

## Presentation Strategy

- 用 VitePress 原生容器表达定义、直觉、误区和折叠答案。
- 用 Shiki 的 `cpp`、`:line-numbers`、行高亮和 code-group 呈现 C++ 示例及真实对比。
- 用 MathJax 呈现渐近定义与次数公式。
- 表格最多四列，长内容优先拆成列表；代码、表格和公式只在自身容器滚动。
- 保留现有纸张/墨色/靛蓝/橙色主题，不采用 UI/UX 搜索返回的替代色板或字体。
- 代码块继续保持深色表面；文档代码 token 在浅色与暗色站点主题下统一使用 Shiki 的 `github-dark-high-contrast` 主题，避免 `github-light` 的深色 token 落在深色背景上。无独立 token 的代码文本和行号分别使用现有 `--course-code-text`、`--course-code-muted` 回退。

## Compatibility and Migration

- `01-active-output` route 迁移到 `01-data-structure-basics`。
- `02-complexity-basics` route 迁移到 `02-algorithm-complexity-analysis`。
- 更新内容 README、仓库 README、迁移文档示例和 Playwright 的旧标题与旧 route。
- 不增加重定向：项目尚处 draft，源链接和测试直接迁移到新语义 route。

## Rollback

所有改动都在短分支且不提交。若内容或 route 验证失败，可恢复三个原 Markdown 文件和对应引用测试；不涉及数据迁移、依赖或部署状态。
