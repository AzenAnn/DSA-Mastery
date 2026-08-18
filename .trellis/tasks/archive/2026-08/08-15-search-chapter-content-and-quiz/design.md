# Design：查找章节理论内容与选择题

## 1. Architecture and Boundaries

本任务只修改第 6 章的 Markdown 教材、Lab 外壳与题库数据，复用现有 VitePress 内容发现和 Quiz 数据流：

```text
第 6 章知识框架 + 既有教材规范
  -> 00-overview + 5 篇单一主题正文
  -> ContentIndex 自动发现
  -> 教材导航 / 搜索 / 相对链接

csgraduates 查找索引（只读研究来源）
  -> 24 个历年选择题链接清单
  -> 题面/选项/答案核对 + 独立推导解析
  -> lab-06-03/quiz.json（题目唯一事实来源）
  -> quiz.data.ts + 既有 QuizSet
  -> Labs 索引 / 搜索 / 章节相关 Labs
```

不复制来源网站页面，不新增抓取器或运行时依赖，不在组件中硬编码教材或题目。

## 2. Content Information Architecture

章节以“比较范围如何缩小、结构如何维持、代价如何度量”为主线：

| 文件 | 核心问题 | 前置/后继关系 |
| --- | --- | --- |
| `01-linear-and-binary-search.md` | 静态表中如何查找，ASL 如何计算？ | 承接复杂度；为树形查找的判定树铺垫 |
| `02-binary-search-tree.md` | 动态集合如何维持有序性？ | 承接二叉树；暴露树高退化问题 |
| `03-balanced-search-tree.md` | 如何把树高稳定在对数级？ | AVL 给严格平衡，红黑树给工程折中 |
| `04-b-tree-and-b-plus-tree.md` | 外存环境如何降低树高与 I/O？ | 从二叉平衡扩展到多路平衡 |
| `05-hash-table.md` | 不保持次序时能否直接计算位置？ | 与比较查找形成选型对照 |

概览只维护这个文件集合的导航，不复制正文。术语、公式和例子在所属正文中只有一个权威解释。

## 3. File Migration and Link Contract

- `01-binary-search-tree.md` 迁移为 `02-binary-search-tree.md` 后扩写；
- `02-hash-table.md` 迁移为 `05-hash-table.md` 后扩写；
- 新建 `01-linear-and-binary-search.md`、`03-balanced-search-tree.md`、`04-b-tree-and-b-plus-tree.md`；
- 重写 `00-overview.md` 的文章矩阵、推荐顺序和 Lab 列表；
- 更新 `Lab 06-01`、`Lab 06-02` 的节号/前置知识引用，新 Lab 使用 `order: 3`。

所有教材相对链接继续使用 `./*.md`，跨到 Lab 使用 `../../labs/.../README.md`，不写部署 base。文件名、frontmatter `order` 和标题节号始终同步。

## 4. Article Writing Contract

每篇正文采用一致但不僵化的结构：学习目标 → 问题与不变量 → 操作/推导 → 复杂度与适用条件 → 易错点 → 小结 → 练习。内容质量边界如下：

- 公式必须先定义符号和统计口径，ASL 区分查找成功/失败；
- 算法代码或伪代码要说明输入前提、循环/结构不变量和失败行为；
- AVL 四类失衡与红黑树五条性质均要覆盖，但红黑树不展开成完整工业实现；
- B 树明确 m 阶定义、根/非根边界、分裂上溢、借键/合并；B+ 树注明教材口径差异并采用一致口径；
- 散列表区分初始冲突与探测中的二次冲突，开放定址删除使用墓碑标记；
- 所有复杂度结论写出成立前提，避免把平均 `O(1)` 或 `O(log n)` 表述成无条件保证。

初稿完成后可使用 humanizer 只处理中文节奏、重复句式和模板化过渡；术语、公式、答案、代码和规范字段不交给语言润色改写。

## 5. Quiz Source Inventory and Data Contract

题目按年份升序，稳定 id 采用 `search-408-YYYY-QNN`。来源映射为：

- 数组查找：2010#9、2015#7、2016#9、2023#8、2024#5、2025#7；
- B/B+ 树：2009#8、2012#9、2013#10、2014#9、2016#10、2017#9、2018#8、2020#10、2022#8、2023#7、2025#8；
- 散列表：2011#9、2014#8、2018#9、2019#8、2022#9、2023#9、2025#9。

`quiz.json` 每题使用既有字段：

```json
{
  "id": "search-408-2010-q09",
  "title": "2010 年 408 真题第 9 题",
  "source": "2010 年全国硕士研究生招生考试 408 第 9 题",
  "difficulty": "基础",
  "topics": ["折半查找", "比较次数"],
  "targetId": "search-408-2010-q09",
  "stem": "……",
  "options": ["……", "……", "……", "……"],
  "answer": 1,
  "explanation": "……"
}
```

`answer` 从 A～D 映射为 0～3。解析重算关键比较次数、结点上下界、插入/删除调整、探测序列与 ASL，不照抄来源站点。涉及原图的题使用 Markdown 表格、层级文本或必要的 Mermaid/ASCII 结构重建可答信息，不热链第三方图片。

## 6. Validation Strategy

- 内容结构：validator 检查 frontmatter、文件名/order、相对链接、QuizSet 唯一挂载和 quiz schema；
- 来源矩阵：用只读审计脚本/命令核对 24 个 id、年份、题号、主题数量和无 `Q41/Q42`；临时脚本不提交；
- 知识核对：逐题独立演算答案，重点复核 2012/2022 B 树删除、2023 散列表失败 ASL、2025 B 树计数；
- 全站：执行 `pnpm test`，再用 Pages base 构建与 Playwright 覆盖章节、搜索和 Quiz 交互；
- 文本审计：搜索旧文件名、旧节号、硬编码 base、来源网站 UI 文案和抓取缓存。

## 7. Compatibility and Rollback

- 不改变内容加载器和 Quiz 契约，现有章节与 Quiz Lab 行为保持不变；
- 文章迁移应在同一补丁内完成链接更新，任一阶段不得留下两个同主题页面；
- 新 Lab 是独立目录，可单独回退；五篇教材可按迁移对回退到原两篇，但必须同时恢复概览和 Lab 前置链接；
- 若现有 Quiz 无法呈现某道图形题，优先在题面中用 Markdown 表格/文本表达，不扩大组件范围。
