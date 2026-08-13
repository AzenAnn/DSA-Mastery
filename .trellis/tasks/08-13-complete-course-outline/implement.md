# Implement：课程目录结构升级

1. 扩展 ContentIndex 类型与课程编排映射，生成基础部分、Part I～VI、Ch.0～15 和 Ch.0+。
2. 新增课程总目录、Part 入口和章节概览框架 Markdown，全部保持 draft，不复制现有正文。
3. 增加 curriculum rewrite、路由识别与 loader watch；侧栏改为 Part/章节层级并保留 Labs。
4. 更新首页为按 Part 分组的章节展示，增加 `/learn/` 总目录入口。
5. 补数据、产物和 Playwright 测试，覆盖 Part IV/V/VI、框架页面、旧内容 URL 与旧 Lab URL。
6. 运行 `pnpm test`；Pages base 下重新 build/check 并运行 Playwright。
7. 审计 `git diff`，证明 `content/**`、`labs/**` 未修改；启动本地预览并人工检查目标页面。
