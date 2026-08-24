# Design：第 5 章“树的应用”课程与 Lab 接口

## 1. Boundaries

本任务修改 Markdown 单一事实来源、课程编排、统一 ContentIndex 的空分类显示条件、对应测试/规范和 Trellis 记录。不新增 Vue 组件、上传服务或判题能力；侧栏继续由现有 ContentIndex 派生。

主要落点：

```text
content/chapter-05-tree-applications/
├─ 00-overview.md
├─ 01-binary-search-tree-and-avl.md
├─ 02-heap-and-priority-queue.md
├─ 03-huffman-tree-and-coding.md
├─ 04-disjoint-set-union.md
└─ 05-b-tree-and-b-plus-tree.md

content/chapter-06-graph-foundations/
└─ 旧图基础页面（从物理 Ch.5 迁移）

content/chapter-07-graph-applications/
└─ 旧图遍历/应用页面（从物理 Ch.5 迁移）

labs/chapter-07/
└─ 旧 BFS/Dijkstra Lab（从物理 Ch.5 迁移）
```

原 `content/chapter-05-graph/` 与两个图算法 Lab 不删除知识内容，而是按现有课程编排迁移到真实 Ch.6/Ch.7 路径并更新元数据。`docs/PROJECT_BLUEPRINT.md` 同步 Chapter 05～07 路线；旧入站链接改到新路径。

## 2. Content Architecture

### 2.1 Page contract

- 章目录编号固定为 `05`，页面 order 为 `0..5`，`chapterTitle` 统一为“树的应用”。
- 页面 `status` 在本地预览阶段为 `draft`；Azen 自检且准备交给 Review Owner 时再改为 `review`。
- 章首页承担学习地图，不复制五篇文章正文；主题页承担图片列出的 22 个小节。
- 章首页和各主题页用相对 `.md` 链接互相连接；章首页说明三个 Lab 分类暂为空，并引导读者后续从侧栏进入上传后的题目。

### 2.2 Teaching template

每篇主题页按以下节奏组织，但允许为叙事连贯合并次级区块：

1. 本页定位、学习目标与前置知识；
2. 图片指定的小节，以显式编号标题呈现；
3. 定义/性质/直觉与完整手算例子；
4. 关键 C/C++ 片段或伪代码；
5. 复杂度结论及成立前提；
6. 易错点、反例与诊断方法；
7. 迁移练习、总结与下一页入口。

理论块使用项目已有 Markdown 作者 API，不增加样式实现。代码保持为教学所需关键片段，避免把待上传 Lab 的完整解答提前写入正文。

### 2.3 Terminology and invariants

- 二叉搜索树明确处理“是否允许重复键”的实现约定；所有复杂度用树高 `h` 表达，再给平均/平衡/退化情形。
- AVL 高度与平衡因子采用全章一致的空树/叶结点约定；四种失衡分别映射到单旋/双旋。
- 堆统一采用 0-based 数组下标，父/左右孩子公式写明边界。
- 赫夫曼树明确 WPL、前缀码与编码唯一性边界；左右边 `0/1` 的选择不影响最优性，但会改变码字。
- 并查集区分按秩与按大小；$\alpha(n)$ 结论只用于路径压缩与合并启发式共同使用的摊还复杂度。
- B 树采用“最小度数 `t`”作为主要定义，避免不同教材“m 阶”语义漂移；另给出与 m 阶说法的换算提示。B+ 树说明实现变体，不把数据库页结构简化成唯一标准。

## 3. Empty Lab Category Contract

Chapter 05 在 `curriculumChapterDefinitions` 中声明 `autoLabChapter: 5`，即使 `labs.filter(chapter === 5)` 返回空数组，`createCourseSidebar()` 也要输出既有 `chapterLabGroup([], icons)`：

```text
本章 Labs
├─ 理论 Theory   -> 暂无理论型 Lab
├─ 实验 Exercise -> 暂无实验型 Lab
└─ 工程 Project  -> 暂无工程型 Lab
```

实现只调整统一索引的条件：有 `autoLabChapter` 就渲染分类组；普通非分类章节仍只在实际有 Lab 时显示“相关 Labs”。三类标签、图标、颜色、折叠状态和空文案继续复用现有 `chapterLabGroup`，不复制 UI。

`labs/chapter-05/` 本轮没有 README，因此不会进入 Labs 首页、搜索或产生虚假统计。后续上传题目时，manifest 的 `type` 或 README 的显式 `labCategory` 决定它自动进入哪个空分类。

## 4. Data Flow and Compatibility

```text
Markdown + frontmatter
  -> validate-content.mjs
  -> ContentIndex 自动发现与排序
  -> 教材侧栏 / Labs 索引 / 搜索
  -> VitePress 静态产物
  -> artifact check + 浏览器预览
```

目录迁移会改变旧图页面和 Lab 的 draft URL。为保留内容与 Ch.6/Ch.7 课程入口，文件、frontmatter 和 curriculum source 映射一并迁移；必须搜索并修复仓库内相对链接。项目不为 draft URL 新增一次性重定向代码。

## 5. Validation and Review

- 静态完整性：脚本或文本审计逐项确认 22 个编号标题、6 篇树应用页面、3 个空 Lab 分类、旧图内容迁移完整、无旧 Chapter 05 图源路径和无断链引用。
- 项目门禁：内容校验、Lab 文档校验、discovery、build、artifact check、完整 `pnpm test`。
- 页面检查：最终静态预览中的章首页、五篇文章与三个空 Lab 分类；桌面/390px、浅/暗主题、侧栏、搜索、代码、公式、表格和根页面溢出。
- 人工知识门禁：AI 初稿仍需 Azen 与 Review Owner 核对定义、复杂度、删除/旋转过程、B 树约定与引用；PR 不代表自行批准。

## 6. Rollback

实施前保留 `origin/main` 作为明确基线。若整章替换需回滚，可撤销本任务提交恢复旧目录；不手改生成目录，也不重写 `main` 历史。预览未获用户认可时保持本地分支，不推送 PR，按反馈继续修订。
