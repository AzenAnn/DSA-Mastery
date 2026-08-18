# 目录分类范围与旧 URL 兼容性研究

> 决策更新：用户已选择“仅第 1 章”。全站分类与 README-only 分类表保留为未来扩展参考，本任务不会修改其他章节的分类或导航。

## 已确认的实现基础

- 课程页面与 Lab 侧栏都由 `.vitepress/content-index.ts` 的 `CourseIndex` 派生，适合在同一索引中增加 `labCategory`，不需要维护第二份导航清单。
- 有 `lab.json` 的 Lab 可稳定按 `type` 映射：`quiz -> theory`、`program -> exercise`、`project -> project`。
- README-only Lab 没有 manifest；若分类功能全站启用，需要在 frontmatter 中增加显式 `labCategory`，不能根据标题猜测。
- VitePress 默认侧栏已提供折叠、键盘和移动端行为；受控的侧栏文本标记与主题 CSS 可以增加图标、颜色框和空状态，无需重写组件。
- 当前 VitePress 配置与类型定义没有仓库级的旧路径重定向表。`rewrites` 用于源文件到目标路由的映射，不等同于为一个页面同时保留新旧两个公开 URL。

## 决策一：分类侧栏的应用范围

### 方案 A：全站统一（建议）

所有章节都使用“本章 Labs -> Theory / Exercise / Project”结构。

影响：

- 共享侧栏只需一个一致的渲染合同，不必对第 1 章写条件分支。
- 需要给其余 13 个 README-only Lab 补充显式 `labCategory` frontmatter。
- 每章都显示三个分类；没有内容的分类显示“暂无……”空状态。
- 后续章节新增 Lab 时，分类规则和视觉体验一致，长期维护成本更低。

风险：

- 本次变更触及的 frontmatter 文件更多。
- 需要逐个确认 13 个 README-only Lab 的教学性质；可根据其现有内容做一次明确人工归类并写入元数据，但不能在运行时按标题猜测。

### 方案 B：仅第 1 章

只有线性表章节使用三分类，其余章节继续显示“相关 Labs”。

影响：

- 首次改动范围较小，不必立即补齐其他章节的 README-only 分类。
- `CourseIndex` 仍可承载分类，但侧栏必须保留新旧两套呈现逻辑或按章节做条件处理。

风险：

- 用户在不同章节看到不同导航结构。
- 后续推广时还要再迁移一次，并重新验证所有章节。

## 决策二：重编号后的旧 URL

### 方案 A：不保留旧编号 URL（建议用于尚未稳定发布的课程）

- 三个 Demo 直接删除。
- 20 个保留 Lab 只使用重编号后的新 URL。
- 优点是目录、源文件和公开路由保持一一对应，不增加兼容页面。
- 风险是外部书签、历史消息和搜索索引中的旧链接会返回 404。

### 方案 B：为 20 个保留 Lab 建立静态重定向

- 三个 Demo 仍直接删除，不继续提供旧内容。
- 每个保留 Lab 的旧路径生成一个只负责跳转到新路径的兼容页面，或引入并验证专用构建期重定向机制。
- 重定向目标必须通过 VitePress 的 base 合同生成，不能硬编码 `/DSA-Mastery/`。
- 优点是历史链接继续工作。
- 风险是增加 20 条兼容映射、构建验证和长期清理责任；若使用客户端跳转，还需处理无 JavaScript、SEO 与可访问性退化。

## 本任务最终选择

用户选择“仅第 1 章分类 + 不保留旧编号 URL”。因此本任务不修改其他章节的 README-only frontmatter 或“相关 Labs”导航，也不生成 alias、重定向页或客户端跳转。下面的全站分类草案只作为未来扩展参考。

## 全站方案下的 README-only 显式分类草案

以下分类来自对每份 README 的任务、提交物和验收方式逐项人工阅读；它只用于一次性写入 frontmatter，不会成为运行时的标题推断逻辑。将删除的第 1 章两个 README-only Demo 不在表内。

| Lab | 建议 `labCategory` | 依据 |
| --- | --- | --- |
| `lab-00-01-learning-map` | `project` | 产出个人学习地图、修订说明并包含同伴反馈，是多步骤作品型任务。 |
| `lab-00-02-operation-counter` | `exercise` | 编写计数函数、记录表格并验证复杂度，是实验验证型任务。 |
| `lab-02-01-stack-simulator` | `exercise` | 实现栈与括号匹配并运行边界用例。 |
| `lab-02-02-cycle-queue` | `exercise` | 实现循环队列并验证空、满、环绕边界。 |
| `lab-03-01-string-matcher` | `exercise` | 实现朴素匹配与 KMP，并对比计数结果。 |
| `lab-03-02-sparse-matrix` | `exercise` | 实现两类转置并验证复杂度。 |
| `lab-04-01-binary-tree-traversal` | `exercise` | 实现遍历并用边界输入验证。 |
| `lab-05-01-bfs-maze` | `exercise` | 实现 BFS 求解器并验证最短路径。 |
| `lab-05-02-dijkstra-path` | `exercise` | 实现 Dijkstra 并完成用例对照。 |
| `lab-06-01-bst-operations` | `exercise` | 实现 BST 增删查与不变量测试。 |
| `lab-06-02-hash-table` | `exercise` | 实现散列表并完成负载因子实验。 |
| `lab-07-01-stability-compare` | `exercise` | 实现排序并用反例验证稳定性。 |
| `lab-07-02-performance-benchmark` | `exercise` | 实现排序基准与退化场景实验。 |

已有 manifest 的其他章节无需人工分类：例如 `lab-00-03-complexity-quiz` 和 `lab-06-03-search-theory-quiz` 自动进入 Theory，`lab-04-02-huffman-coding` 的 `type: project` 自动进入 Project。
