# Design：第 1 章 Lab 目录重构

## 决策摘要

- 三分类侧栏仅应用于课程编排中的第 1 章；其他章节继续显示现有“相关 Labs”。
- 删除三个 Demo 后，保留 Lab 按原顺序整体前移 3 位，形成 `01-01`～`01-20`。
- 重编号后的旧 URL 不保留、不重定向；源目录、内容索引和公开路由继续保持一一对应。
- `CourseIndex` 是分类、侧栏、Labs 首页、搜索和路由的唯一结构化来源，不增加手工 Lab 导航清单。
- 新 Golden Program 使用重编号后的 `lab-01-06-sequential-list-deduplication`。
- 目录分类接口写入 `docs/LAB_AUTHORING_GUIDE.md`，由前言页面现有 include 自动展示，不复制第二份说明。

## 文件与编号迁移

先把 20 个保留目录移动到章内受控的临时名称，再移动到最终名称，避免源目录和目标目录相互占用。每次移动前校验源、目标和临时目录的解析路径都位于 `labs/chapter-01` 内。

| 原目录 | 新目录 |
| --- | --- |
| `lab-01-04-sequential-list-quiz` | `lab-01-01-sequential-list-quiz` |
| `lab-01-05-singly-linked-list-quiz` | `lab-01-02-singly-linked-list-quiz` |
| `lab-01-06-doubly-linked-list-quiz` | `lab-01-03-doubly-linked-list-quiz` |
| `lab-01-07-circular-linked-list-quiz` | `lab-01-04-circular-linked-list-quiz` |
| `lab-01-08-static-linked-list-quiz` | `lab-01-05-static-linked-list-quiz` |
| `lab-01-09-sequential-list-deduplication` | `lab-01-06-sequential-list-deduplication` |
| `lab-01-10-sequential-list-rotate` | `lab-01-07-sequential-list-rotate` |
| `lab-01-11-sequential-list-kth-largest` | `lab-01-08-sequential-list-kth-largest` |
| `lab-01-12-singly-linked-list-reverse` | `lab-01-09-singly-linked-list-reverse` |
| `lab-01-13-singly-linked-list-remove-nth` | `lab-01-10-singly-linked-list-remove-nth` |
| `lab-01-14-singly-linked-list-merge` | `lab-01-11-singly-linked-list-merge` |
| `lab-01-15-doubly-linked-list-palindrome` | `lab-01-12-doubly-linked-list-palindrome` |
| `lab-01-16-lru-cache-simulation` | `lab-01-13-lru-cache-simulation` |
| `lab-01-17-doubly-linked-list-swap-pairs` | `lab-01-14-doubly-linked-list-swap-pairs` |
| `lab-01-18-josephus-problem` | `lab-01-15-josephus-problem` |
| `lab-01-19-circular-linked-list-split` | `lab-01-16-circular-linked-list-split` |
| `lab-01-20-circular-linked-list-delete-value` | `lab-01-17-circular-linked-list-delete-value` |
| `lab-01-21-static-linked-list-insert` | `lab-01-18-static-linked-list-insert` |
| `lab-01-22-static-linked-list-reverse` | `lab-01-19-static-linked-list-reverse` |
| `lab-01-23-static-linked-list-merge` | `lab-01-20-static-linked-list-merge` |

迁移后统一更新 README frontmatter 的 `title`、`order`、正文 H1、交叉引用和运行命令。`lab.json`、`quiz.json`、cases/task 配置只修改确实包含旧目录或编号的字段；不触碰题面、答案、评分或算法行为。

## 分类数据合同

在 `.vitepress/content-index.ts` 中增加：

```ts
export type LabCategory = "theory" | "exercise" | "project";

export interface CourseDocument {
  // existing fields...
  labCategory?: LabCategory;
}
```

Lab 分类解析规则：

1. 对有 `lab.json` 的 Lab 读取 manifest `type`，映射 `quiz -> theory`、`program -> exercise`、`project -> project`。
2. README-only Lab 仅在 frontmatter 明确提供 `labCategory` 时分类；值必须是三个允许值之一。
3. 不按标题、slug、目录位置或关键词猜测分类。
4. 第 1 章进入分类侧栏的每个 Lab 都必须得到合法分类，否则索引构建直接报告带源路径的错误。
5. 其他章节本次不补 frontmatter、不改变侧栏；若未来启用三分类，可按同一合同逐步补齐。

manifest 仍是机器行为的权威；frontmatter 只为没有 manifest 的旧式 Lab 提供明确兼容接口。分类字段随 `CourseDocument` 进入 `CourseIndex`，Labs 首页、搜索和路由继续消费同一文档对象。

## 第 1 章侧栏结构

`createCourseSidebar()` 保留现有 `chapterItem()`，仅当课程编排章节 `number === "1"` 时调用分类 Lab group helper；这只是展示范围判断，不含任何第 1 章 Lab 名单。

```text
Ch.1 线性表
└─ 本章 Labs                  可折叠，彩色框
   ├─ 理论 Theory             可折叠，5 个 quiz
   ├─ 实验 Exercise           可折叠，15 个 program
   └─ 工程 Project            可折叠
      └─ 暂无工程型 Lab       非链接、弱提示
```

- 外层与三类都继续使用 VitePress `DefaultTheme.SidebarItem` 的 `items + collapsed`，保留默认 caret、键盘焦点、移动抽屉和 active link 行为。
- Project 空状态用无 `link`、无嵌套交互的文本 item 表达，使分类保持可见且可折叠。
- 分类标题使用受控语义标记，加入 `course-lab-nav`、`course-lab-category--theory|exercise|project` 等类；不接受用户输入 HTML。
- 图标取自项目已安装的 Lucide 图标集：BookOpen、FlaskConical、Blocks。只渲染三枚固定的、`aria-hidden="true"` 的 SVG；可访问名称由完整的中英文文本提供。

## 视觉与无障碍

在 `.vitepress/theme/custom.css` 增加语义变量和局部样式：

- 外层：accent 混合边框、轻背景、现有圆角和间距变量。
- Theory：蓝紫文本/图标；Exercise：青绿文本/图标；Project：橙色文本/图标。
- 明暗主题分别使用现有 `--course-*` 变量与 `color-mix()`，不写页面级固定背景。
- active、hover、focus-visible 仍由原生 link/caret 承担；图标不拦截 pointer event。
- 390px 下允许标题收缩但不横向溢出；caret 保持至少 44×44 点击范围。
- 类别差异同时由中文、英文、图标和颜色表达，满足非颜色单一编码要求。

优先通过带标记的标题元素及 `:has()` 限定第 1 章 Lab 分组，避免影响其他默认侧栏项。若目标浏览器兼容测试发现 `:has()` 不足，则把稳定类放到可直接选中的受控 wrapper，而不改写整个侧栏。

## Golden Program 与文档

- `scripts/verify-golden-labs.mjs`、`scripts/verify-make-consistency.mjs`、`scripts/validate-lab-docs.mjs` 的 Golden Program 全部改为新 `lab-01-06-sequential-list-deduplication`。
- 同步 `docs/LAB_AUTHORING_GUIDE.md`、`docs/WINDOWS_STUDENT_SETUP_GUIDE.md`、`docs/LAB_MIGRATION_TRACKER.md` 和其他真实引用。
- Golden 验证继续要求 solution=100、starter<100、oracle/verify 稳定、Make/CLI 一致，不因示例更换而降低断言。
- 作者指南增加“侧栏目录接入接口”小节，说明分类映射、README-only 显式字段、单一内容索引、禁止手工列表和必要验证命令；前言 include 自动呈现。

## URL 与兼容性

- 删除后的三个 Demo 路由不存在。
- 20 个旧编号路由不生成 alias、重定向页或客户端跳转。
- 新路由完全由重命名后的源目录和现有 VitePress rewrite 派生，不硬编码 `/DSA-Mastery/`。
- 产物和 Playwright 测试证明新 URL 在根 base 与 `/DSA-Mastery/` base 下可访问；旧 URL 风险在最终报告明确说明。

## 验证设计

1. 静态合同：目录数为 20、编号/order/title 连续、Demo 与旧产品引用消失、分类为 5/15/0。
2. Golden：新 Golden solution/starter/oracle/Make 全部保持原有质量门禁。
3. ContentIndex：manifest 映射、README-only 显式字段、非法/缺失第 1 章分类报错、其他章节侧栏不变。
4. 站点产物：Labs 首页、搜索文档、sidebar 和具体页面都只有新编号。
5. 浏览器：桌面/移动、浅色/深色、外层与三个分类折叠、Project 空状态、键盘焦点、无横向溢出和无 console/network error。
6. 命令：用户指定的六个常规命令，以及 Pages base 下的 build/check/pages 全部执行并记录。

## 回滚

实现只发生在功能分支。合并前可放弃该分支；合并后可整体 revert 本任务提交恢复旧目录与导航。由于明确不提供重定向，本任务没有需要回滚的兼容页或服务端状态。
