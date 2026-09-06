# DSA Mastery 项目规范

这些规范描述当前 VitePress 内容契约、实现边界和交付门禁。开始工作时只读与改动相关的层，不要把整棵目录当成通用模板。

## 按改动类型读取

| 改动 | 必读 |
| --- | --- |
| 调整项目范围或新增能力 | [project/](project/index.md) |
| 新增或修改教材页面 | [content/frontmatter-and-routing.md](content/frontmatter-and-routing.md) |
| 新增或修改 Lab | [content/labs.md](content/labs.md) |
| 开始任何 VitePress 开发 | [frontend/vitepress-development.md](frontend/vitepress-development.md) |
| 修改 VitePress 配置、路由、数据加载 | [frontend/vitepress-architecture.md](frontend/vitepress-architecture.md) |
| 修改首页、导航或课程组件 | [frontend/components-and-data.md](frontend/components-and-data.md) |
| 修改样式、暗色或响应式布局 | [frontend/visual-responsive.md](frontend/visual-responsive.md) |
| 开 Issue、分支、提交或 PR | [quality/git-and-pr.md](quality/git-and-pr.md) |
| 修改测试或 Pages | [quality/validation-and-pages.md](quality/validation-and-pages.md) |
| 删除旧栈或清理生成物 | [quality/cleanup-safety.md](quality/cleanup-safety.md) |

## 开始与收尾

开始前：

- 查看 `git status --short`，不要接管未识别的改动；
- 确定本次变更属于内容、Lab、构建数据、路由、组件、视觉、发布或清理中的哪一层；
- 读取表中对应规范；字段、路径、route 或 base 跨层变化再读 [跨层检查清单](guides/cross-layer-thinking-guide.md)；
- 写清成功条件、失败表现和最小验证集合。

收尾时执行 `package.json` 中真实存在且与改动相关的内容、lint、build、test、Pages 检查，记录结果并清理 fixture、截图服务与临时文件。规范若与落地代码不一致，必须在同一 PR 中更新二者或明确阻塞项，不能把未执行的命令写成已通过。

## 不变量

- `content/chapter-*/*.md` 与 `labs/chapter-*/*/*/README.md` 是课程内容的单一事实来源。
- VitePress 只负责发现、验证和呈现内容；组件中不得复制课程正文或维护第二份导航清单。
- `main` 始终可构建、可发布；知识内容必须经过另一名维护者核验。
- Pages 子路径只由 VitePress `base` 处理一次，源码中不硬编码 `/DSA-Mastery/`。
- 删除旧实现必须晚于替代方案的完整验证，并留下可审查证据。
