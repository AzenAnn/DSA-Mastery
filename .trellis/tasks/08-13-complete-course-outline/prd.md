# PRD：课程目录结构升级

## 问题

当前站点按旧 `chapter` 元数据直接展示第 0～7 章，无法表达新的基础部分、Part I～VI，以及 Ch.8～15 的课程框架。已有文章和 Lab 已有稳定路径，不能为了新编排修改、移动或复制正文。

## 目标

1. 首页、课程总目录和教材/Lab 侧栏统一展示目标课程编排：
   - Ch.0 内存基础；Ch.0+ 算法思维体验；
   - Part I：Ch.1～3；Part II：Ch.4～5；Part III：Ch.6～7；
   - Part IV：Ch.8～9；Part V：Ch.10～11；Part VI：Ch.12～15。
2. 通过新增课程编排层把现有文章映射到新章节，保留已有文章和 Lab 的原文件、元数据与 URL。
3. 为缺失章节新增简短概览框架，包含定位、学习目标、计划栏目、已有内容入口和待完善说明。
4. Ch.0+ 框架明确包含 Peak Finding、Union-Find、数据结构选择如何影响算法效率。
5. 本地根路径与 GitHub Pages 子路径均通过构建和真实页面导航验证。

## 范围

- 新增课程总目录入口、Part/章节框架页面及课程编排元数据。
- 最小修改统一 ContentIndex、VitePress 路由/侧栏、首页展示和相关测试。
- 不修改 `content/**` 任何已有文件，不修改 `labs/**` 任何已有文件。
- 不增加依赖，不改视觉风格，不提交、不推送、不创建 PR。

## 验收标准

1. 目标目录所有 Part 和 Ch.0～15（含 Ch.0+）均可见、可访问，Part IV/V/VI 子栏目准确。
2. 首页、课程总目录、教材侧栏和 Lab 侧栏使用同一 ContentIndex 编排数据。
3. 已有理论文章与 Lab 相对 `origin/main` 的 blob 内容无变化，所有旧 URL 仍可访问。
4. 新框架页均为 `draft`，不复制或伪造现有正文。
5. `pnpm test`、Pages-base build/check 和 `pnpm run test:pages` 通过。
6. 本地预览服务保持运行并提供验收 URL。
