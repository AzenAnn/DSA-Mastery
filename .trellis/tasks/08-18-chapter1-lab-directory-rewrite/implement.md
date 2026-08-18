# Implement：第 1 章 Lab 目录重构

## 1. 开发门禁与基线

- 在用户批准本方案后运行 Trellis task validate/start，并加载实现前规范。
- 确认分支为 `Azen-chapter1-tablesrewrite`、开发者为 Azen、工作树只有本任务规划文件。
- 记录第 1 章 23 个 Lab、旧 Golden 引用、现有测试和目标页面基线。

## 2. 安全删除与两阶段重编号

- 解析并核对三个 Demo 的绝对路径全部位于 `labs/chapter-01`，再按用户授权精确删除。
- 验证 20 个源目录与最终目录映射；先移动到章内唯一临时名，再移动到最终 `01-01`～`01-20`，避免名称碰撞。
- 确认没有临时目录、空号、重复号或 slug 变化。
- 批量更新 20 份 README 的 `title`、`order`、H1、命令与真实交叉引用；检查 manifest/quiz/cases/task 配置中的路径和编号。

## 3. 清理引用并替换 Golden Program

- 全仓定位三个 Demo、旧目录名和旧编号的产品引用，逐项修改教材、文档、脚本、测试和 Make 入口。
- 将新 `lab-01-06-sequential-list-deduplication` 接入所有 Golden Program verifier 与作者/Windows 指南。
- 运行目标 Lab 的 validate/verify/oracle/Make 一致性检查，证明 solution=100、starter<100 且行为稳定。

## 4. 扩展统一内容索引

- 为 `CourseDocument` 增加可选 `labCategory` 与类型定义。
- 从相邻 `lab.json.type` 派生分类；README-only 只接受显式 `labCategory`，不做标题猜测。
- 对第 1 章缺失或非法分类建立清晰构建错误；保持其他章节现有行为。
- 增加/更新 discovery 与索引测试，证明 5 个 Theory、15 个 Exercise、0 个 Project，并证明其他章节仍使用旧导航。

## 5. 实现第 1 章分类侧栏

- 从 `CourseIndex` 过滤三个类别，生成“本章 Labs”及 Theory/Exercise/Project 四层原生 sidebar groups。
- 使用安装中的 Lucide BookOpen、FlaskConical、Blocks 固定图标；Project 插入“暂无工程型 Lab”非链接项。
- 在 `custom.css` 添加局部语义类、主题变量、颜色框、明暗主题、focus 和移动端样式。
- 不新增手工 Lab 数组，不重写 VitePress sidebar，不改变其他章节“相关 Labs”。

## 6. 更新前言接口文档

- 在 `docs/LAB_AUTHORING_GUIDE.md` 增加简短“侧栏目录接入接口”小节。
- 记录 manifest 映射、README-only `labCategory` 合同、CourseIndex 单一来源、禁止标题推断/手工导航和验证命令。
- 通过 `content/chapter-preface/01-lab-authoring-guide.md` 的现有 include 检查前言网站页面可见，无第二份文档副本。

## 7. 自动化验证

- 先运行目标/快速检查并修复问题。
- 依次运行并记录：
  - `pnpm run validate`
  - `pnpm run test:discovery`
  - `pnpm run build`
  - `pnpm run check:site`
  - `pnpm run test:pages`
  - `pnpm test`
- 设置 `GITHUB_PAGES_BASE_PATH=/DSA-Mastery` 和指定 `SITE_URL` 后重新运行 build/check/pages。
- 全仓搜索旧路径与编号；仅允许 Trellis 任务的历史映射/决策记录，不允许产品源、测试、文档或构建输入残留。

## 8. 浏览器验收与交付

- 启动最终静态站点，检查第 1 章目录、Labs 首页、代表性 Quiz/Program、新 Golden 和前言接口页。
- 在 1440px 与 390px、浅色与深色下检查视觉、折叠、Project 空状态、键盘、搜索、链接、溢出和控制台/网络错误。
- 只把截图作为本地验收证据，不加入 Git；清理 `dist/`、缓存、test-results、playwright-report、trace 和临时 fixture。
- 审计 `git status`/`git diff`，提供本地访问地址，并汇报修改文件、完整映射、分类合同、视觉实现、测试结果与旧 URL 404 风险。

## Completion checklist

- [ ] Trellis task 已在用户批准后 start，规范与分支状态正确。
- [ ] 三个 Demo 已删除，第 1 章恰好 20 个连续 Lab。
- [ ] 所有产品引用和 Golden Program 已切换到新编号。
- [ ] 分类来自统一内容索引，第 1 章为 5/15/0，其他章节导航不变。
- [ ] “本章 Labs”和三个分类可折叠，颜色/图标/文字/空状态完整。
- [ ] 前言包含可执行的后续目录接入说明。
- [ ] 常规与 Pages base 全量命令通过，浏览器矩阵通过。
- [ ] 没有生成物、缓存、测试截图或临时文件进入 Git。
- [ ] 本地预览保持运行并提供用户检查地址。
