# Ch15 Exercise 执行计划

## 规划状态

- [x] 用户确认创建任务并规划。
- [x] 同步origin，从main创建 `feat/ch15-backtracking-exercises`。
- [x] 检查既有Lab、导航、CLI和页面测试。
- [x] 完成21题官方合同研究。
- [x] 写入PRD、design和implement文档。
- [x] 持久化研究记录；PRD整理为目标、需求、验收、背景与非目标，无未解决的产品范围问题。
- [x] 向用户呈现最终规划摘要，取得开始实现的确认。
- [x] 读取Phase 1.4并运行 `task.py start`。

## 实施顺序

1. [x] 加载 `trellis-before-dev`，复查任务文档、规范和工作区。
2. [x] 复用现有脚手架的目录、manifest及Makefile合同建立ch15三分类和21个Program，写入正确ID、来源、题面及stdio合同。
3. [x] 完成15E01..15E08的学生骨架、参考实现、测试和说明。
4. [x] 完成15E09..15E17，核对集合排序、去重和数独唯一性。
5. [x] 完成15E18..15E21，建立最短步数、最高分和性能边界证据。
6. [x] 新增 `scripts/generate-chapter-15-search-tests.mjs`，227组固定答案经独立算法核验（含P1036的n=1/k=0）。
7. [x] 给ch15加入 `autoLabChapter: 15`，扩展现有Playwright章节导航、搜索和移动端测试。
8. [x] 主会话使用 `trellis-check` 完成下列验证并修复本次问题，不派发implement/check子代理。
9. [x] 记录命令、环境、成绩与截图；同步枚举输出限额、集合序列化和单行贡献者数组规范。
10. [x] 本地预览已启动并经浏览器实测，URL见validation.md；保留未提交内容供审阅。

## Lab验证

- [x] `lab:doctor` 确认Node24.14、pnpm11.1.1及Clang21.1/MSVC19.51工具链。
- [x] 对21题运行 `lab:verify`（包含manifest/cases加载验证），参考100、学生可编译且非满分、oracle无漂移。
- [x] 独立合同检查：ID、样例、答案集合、唯一解数独、最短路和最优分数；完整输入与答案保存于tests。
- [x] 边界验证：P1706 n=9；P1157 n=20/r=10与r=0；P1443 400x400；LC47/131最大输出；P1120 n=65；P1074多解；P2324恰好15及超过15步。
- [x] `pnpm run test:lab-make` 通过。
- [x] 15E17学生包在仓库外独立validate/run成功，初始分9/100，无solution或二进制泄露。

## 全仓与站点验证

```powershell
pnpm test
```

该命令包括内容、类型、lint、核心单测、文档、自动发现、根路径构建及产物检查，无变更时不机械重复。

默认构建后运行新增ch15页面测试；再执行Pages验证：

```powershell
$env:GITHUB_PAGES_BASE_PATH = '/DSA-Mastery'
$env:SITE_URL = 'https://azenann.github.io'
pnpm run build
pnpm run check:site
pnpm run test:pages
```

- [x] 默认根路径的新增ch15页面测试5项通过。
- [x] `pnpm test` 通过；Windows符号链接测试按既有环境分支跳过1项。追加P1036边界后，单题verify、独立数据检查、内容校验和lint再次通过。
- [x] Pages构建、链接检查通过，全部56项Playwright用例通过。
- [x] 保存桌面/390px及浅暗主题截图，无页面错误或根页面溢出。
- [x] `git diff --check` 通过；新增文件另经空白/LF检查。测试fixture及本次MSVC产生的main.obj已清理，缓存处于忽略目录。非本任务的图缓存变化已记录并保留。

发现无关既有失败时记录命令和证据，不还原他人的改动，不声称全绿。每组完成后更新清单，不提前勾选验证。

## 范围与回退

共享文件限 `.vitepress/content-index.ts` 的ch15字段和 `tests/pages-navigation.spec.mjs` 的新增覆盖。主要新增内容在 `labs/chapter-15/**` 和必要的本章脚本。每组验证后继续，回退只限本次文件。开发阶段保留未提交内容供审阅；用户后续明确要求“提交pr”，已授权提交本任务文件、推送功能分支并创建面向main的PR，不合并或部署。

## 规范入口

- `.trellis/spec/content/labs.md`
- `.trellis/spec/content/lab-tooling.md`
- `.trellis/spec/content/frontmatter-and-routing.md`
- `.trellis/spec/frontend/vitepress-development.md`
- `.trellis/spec/frontend/vitepress-architecture.md`
- `.trellis/spec/quality/validation-and-pages.md`
- `.trellis/spec/quality/git-and-pr.md`

Codex采用inline模式，主会话加载规范，不创建仅为dispatch服务的JSONL占位文件。
