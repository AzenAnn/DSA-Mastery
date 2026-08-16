# 内容层规范

| 文件 | 适用范围 |
| --- | --- |
| [frontmatter-and-routing.md](frontmatter-and-routing.md) | 教材路径、元数据、排序、链接和 URL |
| [labs.md](labs.md) | Lab 结构、复现、边界和验收 |
| [理论文档样式指南](../../../docs/THEORY_DOC_STYLE_GUIDE.md) | 定义、定理、证明、复杂度、行内强调与代码标注作者指南 |

内容源边界：

- 教材：`content/chapter-*/*.md`，明确排除 `content/README.md`。
- Lab：`labs/chapter-*/lab-*/README.md`。
- 完整程序和测试放在对应 Lab 目录；正文只保留解释所需的关键片段。
- 理论语义必须按[理论文档 Markdown 合同](../frontend/theory-markdown.md)选择；只做小范围人工迁移，不机械改写知识正文。
