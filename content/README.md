# 内容源约定

`content/` 是在线教程的内容源。章节正文只在这里维护；网站负责自动读取、排序和渲染，不要在页面代码中复制一份正文。

## 目录与命名

```text
content/
├── chapter-00-introduction/
│   ├── 00-overview.md
│   ├── 01-active-output.md
│   └── 02-complexity-basics.md
└── chapter-01-linear-list/
    ├── 00-overview.md
    ├── 01-abstract-data-type.md
    ├── 02-sequential-list.md
    └── 03-linked-list.md
```

- 章节目录使用 `chapter-NN-kebab-case`，其中 `NN` 为两位章节号。
- 页面文件使用 `NN-kebab-case.md`；`00-overview.md` 是章首页，其余文件按阅读顺序编号。
- 文件名和目录名只用小写英文字母、数字与连字符，避免空格和中文路径。
- 新增页面后无需手写导航；构建程序应递归读取 `content/chapter-*/*.md`，再按 `chapter` 与 `order` 排序。
- `content/README.md` 是维护说明，不属于教材页面，渲染时应排除。

## Frontmatter

每个教材页面必须以如下元数据开头：

```yaml
---
title: "页面标题"
description: "一句话说明本页内容"
order: 1
chapter: 1
chapterTitle: "线性表"
updated: "2026-08-09"
contributors: ["DSA Lab Team"]
status: "draft"
---
```

字段约定：

| 字段 | 说明 |
| --- | --- |
| `title` | 导航与页面主标题 |
| `description` | 列表页摘要，建议不超过 80 个汉字 |
| `order` | 页面在本章内的顺序，从 `0` 开始 |
| `chapter` | 数字章节号，如 `0`、`1` |
| `chapterTitle` | 不带编号的章节名，用于导航分组，如 `"线性表"` |
| `updated` | 最后一次实质性修改日期，格式为 `YYYY-MM-DD` |
| `contributors` | 实际参与本页编写或审阅的成员列表 |
| `status` | `draft`、`review` 或 `published` |

## 正文最低结构

章首页至少包含：学习目标、核心概念、复杂度概览、章节小结与练习。小节可按主题调整，但应尽量包含示例、易错点和自检问题。

新增内容时：复制同章相邻页面，修改文件名与全部 frontmatter，编写正文，检查本地预览，然后提交 Pull Request。不要编辑网站构建生成的页面，也不要把 PDF 或 LaTeX 当作本目录的第二份内容源。
