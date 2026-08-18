# 第 1 章 Lab 目录重构

## Goal

将线性表章节从“Demo 与正式题目混排”改造为“理论 / 实验 / 工程”的清晰 Lab 导航，删除早期 Demo，将保留题目重排为连续编号，并在 VitePress 侧栏中提供有视觉区分、可折叠、可访问的“本章 Labs”。

## Background and Confirmed Facts

- 第 1 章当前有 23 个 Lab；`01-01` 和 `01-02` 是 README-only Demo，`01-03` 是 Program Demo 且被用作 Golden Program。
- `01-04`～`01-08` 的 `lab.json.type` 均为 `quiz`；`01-09`～`01-23` 均为 `program`。
- `.vitepress/content-index.ts:329-338` 自动扫描 `labs/chapter-*/lab-*/README.md`，`.vitepress/content-index.ts:433-446` 构建单一课程索引。
- `.vitepress/content-index.ts:488-518` 生成共享课程侧栏，其中第 504 行将所有 Lab 放在一个“相关 Labs”分组。
- VitePress 1.6.4 默认侧栏对 `SidebarItem.text` 使用 `v-html`，因此可由受控的建立期 helper 生成语义标记和内联图标，并由主题 CSS 稳定选择，无需重写整个侧栏。
- `scripts/verify-golden-labs.mjs:12`、`scripts/verify-make-consistency.mjs:8`、`scripts/validate-lab-docs.mjs:142-149`以及 `docs/LAB_AUTHORING_GUIDE.md` 多处目前依赖 `lab-01-03-problem-template`。
- 除将删除的第 1 章 Demo 外，仓库仍有 13 个 README-only Lab，当前没有显式分类字段。

## Requirements

### R1. Delete the three Demo Labs

- 删除 `labs/chapter-01/lab-01-01-sequence-list`、`lab-01-02-linked-list`、`lab-01-03-problem-template`。
- 清理教材、文档、测试、脚本、Golden Lab、Make 命令和导航中的所有引用。
- 将重编号后的“有序顺序表去重”作为新 Golden Program，并同步作者指南、Golden 验证、Make 一致性测试与 Windows 学生指南。

### R2. Renumber retained Chapter 1 Labs

- 原 `01-04`～`01-08` 映射为新 `01-01`～`01-05`。
- 原 `01-09`～`01-23` 映射为新 `01-06`～`01-20`。
- 保留英文 slug，仅更改数字前缀。
- 同步目录名、README `title/order`、manifest/schema 相对路径、README 命令、教材/文档链接、路由、搜索、侧栏、前后页与自动化断言。
- 重编号后第 1 章恰好有 20 个 Lab，编号 `01-01`～`01-20` 连续无空洞。

### R3. Introduce a single-source Lab category

- 为课程索引增加 `theory | exercise | project` 分类，不在侧栏中维护第二份 Lab 名单。
- `lab.json.type` 映射为：`quiz -> theory`、`program -> exercise`、`project -> project`。
- README-only Lab 必须由显式 frontmatter 或明确兼容合同分类，不能按标题关键词猜测。
- 新分类必须随 `CourseIndex` 序列化，供侧栏、Labs 索引和后续消费者共享。

### R4. Replace “相关 Labs” with a categorized “本章 Labs”

- 三分类目录仅应用于第 1 章；其他章节继续使用现有“相关 Labs”结构。
- “本章 Labs”整体可折叠，使用独立彩色边框、轻背景和圆角。
- 展开后包含三个可折叠组：“理论 Theory”、“实验 Exercise”、“工程 Project”。
- 三类同时用中英文文字、不同颜色和不同小图标表达，不仅依赖颜色。
- Theory 使用蓝/紫色与书本类图标；Exercise 使用绿/青色与烧杯/代码类图标；Project 使用橙色与积木/工具类图标。
- Project 当前无内容仍必须可见，展开后显示弱化的“暂无工程型 Lab”非链接空状态。
- 复用 VitePress 默认侧栏的语义化折叠与键盘行为，不建第二套 sidebar 组件。
- 样式在明/暗主题、390px 移动端和 1440px 桌面端保持对比度、焦点、可点范围和无水平溢出。

### R5. Chapter 1 classification

- 原 `01-04`～`01-08` 五个选择题在重编号后位于 Theory。
- 原 `01-09`～`01-23` 十五个编程题在重编号后位于 Exercise。
- Project 为空但保留空状态。

### R6. Repository and delivery constraints

- 不硬编码 `/DSA-Mastery/`；使用现有 Pages base 合同。
- 不提交 `dist/`、缓存、视觉截图、Playwright trace 或临时 fixture。
- 保留用户和其他开发者的无关改动。
- 最终启动本地可访问的站点，提供检查地址。

### R7. Document the navigation classification interface in the preface

- 在课程前言已包含的 `docs/LAB_AUTHORING_GUIDE.md` 中增加一段简明的“Lab 目录接入规范”。
- 明确说明 `lab.json.type` 到侧栏分类的映射：`quiz -> theory`、`program -> exercise`、`project -> project`。
- 说明 README-only Lab 若将来接入分类目录，应显式提供 `labCategory: theory | exercise | project`，禁止按标题推断。
- 说明侧栏必须继续从 `CourseIndex` 派生，不新增手工 Lab 名单，并提醒运行内容发现、构建与 Pages 验证。
- 该说明通过 `content/chapter-preface/01-lab-authoring-guide.md` 的 include 出现在课程网站前言中，不复制第二份维护文档。

## Acceptance Criteria

- [ ] 三个 Demo Lab 目录与全部相关引用被删除。
- [ ] 第 1 章有且仅有 20 个 Lab，目录、标题与 `order` 从 `01-01` 到 `01-20` 一致且无缺口。
- [ ] 新 Golden Program 指向重编号后的“有序顺序表去重”，其 solution=100、starter<100、oracle 稳定。
- [ ] 课程索引从 manifest/frontmatter 派生类别，无标题关键词分类或侧栏硬编码名单。
- [ ] 第 1 章侧栏显示 5 个 Theory、15 个 Exercise 和 1 个可见的 Project 空状态。
- [ ] “本章 Labs”和三个子类在鼠标、键盘、移动侧栏中均可折叠/展开。
- [ ] 三类同时具备不同文字、图标和可辨颜色，明暗主题可读。
- [ ] Labs 首页、搜索、课程侧栏、Lab 页面、README 命令与文档链接使用同一新编号。
- [ ] 旧编号/路径的全仓检索仅保留经过明确允许的兼容记录。
- [ ] `pnpm run validate`、`pnpm run test:discovery`、`pnpm run build`、`pnpm run check:site`、`pnpm run test:pages`、`pnpm test` 均通过。
- [ ] 在 `GITHUB_PAGES_BASE_PATH=/DSA-Mastery` 与正确 `SITE_URL` 下 build/check/Playwright 全绿。
- [ ] 最终工作树不含 `dist/`、缓存、截图、trace 或临时 fixture。
- [ ] 本地服务启动并提供可访问地址。
- [ ] 课程前言可见简明的 Lab 目录接入规范，后续开发者能按同一数据接口扩展分类目录。

## Out of Scope

- 不重写 VitePress 整个默认侧栏或建立第二份导航数据。
- 不改写保留 Lab 的题面、算法、参考答案或测试数据，除非仅为修复重命名后的路径/编号合同。
- 不为第 1 章新增工程型 Lab。
- 不在本任务中发布生产站点或合并 PR。

## Resolved Product Decisions

1. “本章 Labs -> Theory / Exercise / Project”仅应用于第 1 章；其他章节保持当前“相关 Labs”展示。
2. 在课程前言现有的 Lab 作者指南入口中补充简明目录接入规范，供后续开发者扩展，而不是新建重复的独立手册。
3. 不为重编号后的 20 个 Lab 保留旧 URL 或静态重定向；三个 Demo 同样直接删除。旧书签、历史消息和搜索索引可能得到 404，此风险必须在最终交付中明确说明。
