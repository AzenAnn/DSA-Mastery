# Implement Plan：第 5 章“树的应用”课程与 Lab 接口

## Preconditions

- [x] `chapter05` 从任务开始时最新 `origin/main` 创建。
- [x] Azen Trellis task 已创建并关联 `chapter05 -> main`。
- [x] 两张目录图已逐项转写为 PRD 的 22 个必含小节。
- [x] 已阅读理论排版、frontmatter/路由、Lab 更新、Lab 工具、VitePress 开发、Git/PR 与验证规范。
- [x] 用户通过截图明确：Chapter 05 只显示“本章 Labs”的 Theory / Exercise / Project 三个空分类，不创建 Lab 页面。
- [x] 用户批准本规划摘要后运行 `task.py start`。

## Ordered Implementation

### 1. Load implementation context

- [x] 运行 Phase 1.4 review gate 并激活任务。
- [x] 加载 `trellis-before-dev`，再次核对 content、frontend 与 quality 规范和工作树基线。

### 2. Reconcile physical Chapter 05 and preserve graph content

- [x] 把旧图基础正文迁移到 `content/chapter-06-graph-foundations/`，把遍历/应用正文迁移到 `content/chapter-07-graph-applications/`，同步 frontmatter 和课程 source 映射。
- [x] 把旧 BFS/Dijkstra Lab 迁移到 `labs/chapter-07/`，同步编号、frontmatter、链接和课程 `labSources`。
- [x] 建立 `content/chapter-05-tree-applications/`，确保物理章编号、order 和 `chapterTitle` 唯一。
- [x] 写 `00-overview.md`：定位、目标、前置知识、学习路径、五篇文章、三个待开放 Lab 分类和知识图谱。
- [x] 写 `01-binary-search-tree-and-avl.md`，覆盖 5.1.1～5.1.5。
- [x] 写 `02-heap-and-priority-queue.md`，覆盖 5.2.1～5.2.5。
- [x] 写 `03-huffman-tree-and-coding.md`，覆盖 5.3.1～5.3.4。
- [x] 写 `04-disjoint-set-union.md`，覆盖 5.4.1～5.4.4。
- [x] 写 `05-b-tree-and-b-plus-tree.md`，覆盖 5.5.1～5.5.4。
- [x] 逐页检查 frontmatter、术语、公式、代码 fence、理论容器、例子、易错点、练习与相对链接。

### 3. Expose the three empty Chapter 05 Lab categories

- [x] 在 Chapter 05 curriculum 定义中加入六篇 `lessonSources` 和 `autoLabChapter: 5`。
- [x] 调整统一侧栏生成条件：分类章节即使没有 Lab，也渲染 `chapterLabGroup` 的三种空状态。
- [x] 更新内容 validator 的分类章节集合，保证未来 Ch.5 README-only Lab 必须显式声明 `labCategory`。
- [x] 增加 Chapter 05 空分类的 discovery/artifact/Playwright 回归，覆盖三类文案、折叠行为、视觉与无溢出。
- [x] 更新 `docs/LAB_AUTHORING_GUIDE.md` 4.1 及相关 Trellis 内容/前端规范，记录空章节接口合同。
- [x] 确认 `labs/chapter-05/` 不包含 README、manifest 或虚假题目。

### 4. Reconcile repository references

- [x] 更新 `docs/PROJECT_BLUEPRINT.md` 的 Chapter 05～07 路线。
- [x] 修正 Chapter 02 等位置指向旧 `chapter-05-graph` 的链接或措辞。
- [x] 搜索旧目录、旧标题与旧 Lab 路径；确认产品引用已迁移，历史 Trellis 证据可保留。

### 5. Content completeness and correctness pass

- [x] 用独立清单核对 22/22 小节都有编号标题和实质内容。
- [x] 核对 BST/AVL 删除与旋转、Heapify `O(n)` 推导、Huffman 前缀码、DSU $\alpha(n)$ 前提、B 树最小度数与 B+ 树变体。
- [x] 检查 C/C++ 片段可读、命名一致、没有未声明类型或明显越界。
- [x] 检查 6 篇文章的前后导航、三个空分类接口、迁移后的图页面/Lab 和外部引用。

### 6. Automated validation

- [x] `pnpm run validate:content`
- [x] `pnpm run test:lab-docs`
- [x] `pnpm run test:discovery`
- [x] `pnpm run build`
- [x] `pnpm run check:site`
- [x] `pnpm test`
- [x] 失败时只修任务范围内根因，重复相应门禁，最后重跑完整集合。

### 7. Visual preview

- [x] 从最终静态产物启动本地 preview 服务。
- [x] 检查章首页、五篇文章、三个空 Lab 分类、侧栏、搜索、公式、代码和表格。
- [x] 检查 1440px/390px 与浅色/深色，记录控制台、网络、页面错误和横向溢出结果。
- [x] 向用户提供本地预览地址并等待反馈；用户已确认提交 PR。

### 8. User-approved PR handoff

- [x] 仅在用户明确确认预览后，把页面状态从 `draft` 调整为约定的评审状态。
- [x] 加载 `trellis-check` 做最终全量质量审计并修正阻塞项。
- [x] 更新必要 Trellis spec/任务记录，记录验证证据。
- [x] 只暂存本任务文件，按 Conventional Commit 提交。
- [x] 推送 `chapter05` 并创建目标为 `main` 的 PR；PR 说明范围、非目标、验证结果、知识风险、AI 参与和人工 Review 要求。
- [x] 不自行批准或合并 PR。

## Verification Evidence

- `pnpm test`：通过；内容、类型、Lint、Lab 工具、Lab 文档、自动发现、构建和产物检查全部成功。Lab 工具 32 项通过，1 项因当前 Windows 策略禁止创建测试符号链接而按预期跳过。
- `pnpm run test:pages`：20/20 通过，包含 Ch.5 三个空分类、折叠、图标、明暗主题与 390px 无溢出。
- `pnpm run validate`、`pnpm run build`、`pnpm run check:site`：切换 `review` 后再次通过；最终产物含 67 篇教材、80 个现有 Lab、25 个课程框架页与 194 个 HTML。
- C++17 `-Wall -Wextra -pedantic -fsyntax-only`：BST、AVL、Heap、Huffman、DSU、Kruskal、Dijkstra 与图遍历代表性代码块全部通过。
- 浏览器实页巡检：Ch.5 六页、迁移后的 Ch.6/Ch.7 代表页无页面级横向溢出，控制台 error/warning 为空；22/22 个指定编号小节存在。

## Risky Files and Rollback Points

- 目录级迁移：`content/chapter-05-graph/`、`labs/chapter-05/` 到 Ch.6/Ch.7，再建立树应用 Ch.5。每个目标路径先核对不存在冲突，使用可审查 patch/move，不使用宽泛递归删除。
- 入站链接：迁移旧目录前搜索所有 `chapter-05-graph` 引用，内容校验作为第二防线。
- 历史 Trellis task：旧 `08-12-chapter-05-graph` 保留为历史/他人规划证据，不把它当作产品内容继续实现，也不在本任务中擅自归档。
- 预览前不提交 PR；若用户不认可，继续在本地 `chapter05` 修改或按任务提交回退，不重写远端共享历史。
