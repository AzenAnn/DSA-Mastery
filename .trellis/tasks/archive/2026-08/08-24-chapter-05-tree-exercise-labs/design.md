# Design：第 5 章树结构题库 Lab

## 内容边界与文件映射

| 源节 | 题量上限后的实际题量 | Lab 目录 | 页面标题 |
| --- | ---: | --- | --- |
| 09 森林与二叉树的转换 | 16 选择 + 1 综合 | `labs/chapter-05/lab-05-01-forest-binary-tree-conversion-quiz/` | Lab 05-01：森林与二叉树转换题精练 |
| 10 树和森林的遍历 | 9 选择 + 0 综合 | `labs/chapter-05/lab-05-02-tree-forest-traversal-quiz/` | Lab 05-02：树与森林遍历题精练 |
| 11 哈夫曼树与编码 | 20 选择 + 5 综合 | `labs/chapter-05/lab-05-03-huffman-tree-coding-quiz/` | Lab 05-03：哈夫曼树与编码题精练 |
| 12 并查集 | 9 选择 + 0 综合 | `labs/chapter-05/lab-05-04-disjoint-set-union-quiz/` | Lab 05-04：并查集题精练 |
| 13 堆 | 13 选择 + 3 综合 | `labs/chapter-05/lab-05-05-heap-quiz/` | Lab 05-05：堆题精练 |

五个 Lab 全部使用 Schema v1 `quiz` manifest，由既有 ContentIndex 自动派生为 `theory`；不编辑 `.vitepress/content-index.ts` 的 Lab 清单。

## 数据合同

每个选择题映射为：

```json
{
  "id": "ch05-01-q01",
  "title": "选择题 1",
  "difficulty": "★★★★",
  "topics": ["森林", "二叉树转换"],
  "stem": "题面 Markdown",
  "options": ["选项 A", "选项 B", "选项 C", "选项 D"],
  "answer": 2,
  "explanation": "答案详解与选项辨析",
  "points": 2
}
```

`source`、`targetId` 不进入公开 JSON；原始题目标识也不复用为 `id`。答案字母转换为零基索引，选项前缀在导入时删除。题面、解析和综合题保留 Markdown 公式、代码与普通 fenced block，由现有构建期安全渲染处理。

## README 架构

README 采用统一结构：frontmatter → 标题 → 目标 → 前置知识 → 环境/输入/预期输出 → 作答方法 → `<QuizSet />` → 综合题 → 完成清单 → 复盘。

- 综合题按源文件顺序保留，题面与答案之间使用 `::: details 参考答案与详细解析`。
- 无综合题时写明“本组素材未提供综合题，因此不补造占位题”。
- 09、10 链接第 4 章树与森林基础和第 5 章概览；11、12、13 分别链接第 5 章赫夫曼、并查集、堆教材。
- frontmatter 使用 `chapter: 5`、`chapterTitle: "树的应用"`、`status: "draft"`、`difficulty: "基础"`，时长按实际题量设置。

## 转换与清洗流程

1. 以三级标题边界切分源文件，按出现顺序选取目标题目。
2. 选择题解析题目信息、题面、四个选项、答案、详解与选项辨析，写入 `quiz.json`。
3. 综合题把 Obsidian callout 还原为普通 Markdown，再组织为折叠参考解析。
4. 移除来源字段、题目标识、来源化标题、CodeBrick/OJ/可视化链接、答案生成声明、空资源区块、wiki link 和个人工作流描述。
5. 对清洗后的目录执行禁止词与外链扫描；对题量、ID、选项数、答案索引和 `<QuizSet />` 次数做结构校验。

## 章节与网站数据流

```text
labs/chapter-05/lab-05-*/README.md + lab.json + quiz.json
  → ContentIndex 自动发现
  → Chapter 5 / Theory 分类 + Labs 索引 + 搜索
  → Quiz data loader
  → <QuizSet /> 交互页面
```

新增 Lab 后同步改写 `content/chapter-05-tree-applications/00-overview.md` 的 Labs 说明，只描述已有 Theory 题库与仍为空的 Exercise/Project，不复制五个 Lab 的导航列表。

## 风险与控制

- **知识内容体量大**：自动合同只证明结构与渲染；答案、解析与版权仍标为 `draft` 并要求 Review Owner 人工抽查。
- **隐藏来源不彻底**：除字段级清洗外，额外扫描真题后缀、题库 ID、CodeBrick、HTTP 链接和 wiki link；发现来源型交叉引用时改为不带出处的知识描述。
- **自定义 Markdown 泄漏**：Obsidian callout 转普通 Markdown，`[[...]]` 改为纯文本或现有站内链接；构建和浏览器检查未解析语法。
- **题量截断错误**：以标题序号和源文件顺序计算，11 节显式断言只保留 1～20 题。
- **章节定位跨越基础内容**：09、10 虽偏树基础，仍按维护者要求放在物理 Chapter 5；前置知识链接回第 4 章，避免读者缺少上下文。

## 回滚与发布

改动限于五个新 Lab、第 5 章概览与本 Trellis 任务记录。预览确认前不推送；若验收不通过，可在本地逐 Lab 修订或删除新增目录，不涉及 Schema、依赖或数据迁移。确认后以一个独立 PR 提交，PR 不负责合并或 Pages 部署。
