# Research：查找章节题源与仓库实现审计

## Repository evidence

- 教材契约：`.trellis/spec/content/frontmatter-and-routing.md`
- Lab 与 Quiz 契约：`.trellis/spec/content/labs.md`
- 全站门禁：`.trellis/spec/quality/validation-and-pages.md`
- 现有教材：`content/chapter-06-search/00-overview.md`、`01-binary-search-tree.md`、`02-hash-table.md`
- 现有操作 Lab：`labs/chapter-06/lab-06-01-bst-operations/`、`lab-06-02-hash-table/`
- 现有交互题库参考：`labs/chapter-01/lab-01-04-sequential-list-quiz/` 至 `lab-01-08-static-linked-list-quiz/`

结论：第 6 章当前缺基础查找、平衡树和多路查找正文；题库可直接复用既有 `README + quiz.json + QuizSet` 数据流，不需要前端改动。

## External source audit

总索引：<https://www.csgraduates.com/data_structure/search/>

子页：

- 数组查找：<https://www.csgraduates.com/data_structure/search/array/>
- 树形查找：<https://www.csgraduates.com/data_structure/search/tree/>
- 散列表查找：<https://www.csgraduates.com/data_structure/search/hash/>

去重后的选择题矩阵：

| 分类 | 年份与题号 | 数量 |
| --- | --- | ---: |
| 数组查找 | 2010#9、2015#7、2016#9、2023#8、2024#5、2025#7 | 6 |
| B/B+ 树 | 2009#8、2012#9、2013#10、2014#9、2016#10、2017#9、2018#8、2020#10、2022#8、2023#7、2025#8 | 11 |
| 散列表 | 2011#9、2014#8、2018#9、2019#8、2022#9、2023#9、2025#9 | 7 |
| 合计 | 2009～2025 | 24 |

散列表页还引用 2010#41、2013#42、2024#42 等解答题；本任务只收录选择题，因此排除。

## Content risks found during audit

- 2012#9、2022#8 依赖 B 树图形与删除调整，课程题面需要重建完整结构并人工复核。
- 2024#5 的 I～IV 条件位于单独段落，转换时不能只取首段题面。
- 2023#9 涉及开放定址删除标记与失败 ASL，需明确墓碑在失败查找中的计数口径。
- 来源网页的解析存在口语化、公式文本拆散和可能需要复核的表述；仓库解析应独立推导，不机械复制。
- B+ 树不同教材存在“关键字数与子树数”口径差异，正文必须声明本章采用的定义。

## Planned use

只把题目事实（年份、题号、题面、选项、答案）用于核对，解析与教材正文均重新组织和推导。网页 HTML、图片缓存和抓取脚本不进入仓库交付。
