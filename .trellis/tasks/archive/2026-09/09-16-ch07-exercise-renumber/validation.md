# Ch7 编号迁移验证

日期：2026-09-16。执行人：Azen / Codex。分支：codex/ch07-exercise-renumber，基线：origin/main 5bb70c1e。

- PASS：guide T01–T30、目录、labId、标题、order 和文章入口一致，恰好 30 道 Program；tests/ch07-exercises.test.mjs 通过。
- PASS：连通分量计数、有向图环检测已从课程目录移除，源码与测试保留在 gitignored 的 .lab-cache/ch07-removed-labs，可恢复。
- PASS：1350 个非 README 实现/数据文件与基线逐项对照，仅一个 student 注释中的 07E05 改为 07E02；算法与测试数据不变。
- PASS：python scripts/check-ch07-exercises.py --solutions --mutations；20 道专项题各 20 点，独立 oracle 和参考解一致，全部错误变体被指定测试点检出。
- PASS：30 道 Program 的官方 CLI verify 全部 exit 0；参考解满分、starter 可编译非满分、期望文件稳定。汇总 .lab-cache/ch07-verify-summary.json。
- PASS：扩展 pnpm test，97/97；tsc --noEmit 和 node build.mjs 通过。覆盖交叉 ID、删除题历史、备份失败、双章迁移、真实扫描、重启、reset。
- PASS：pnpm test（GITHUB_PAGES_BASE_PATH=/DSA-Mastery，SITE_URL=https://azenann.github.io）；内容、类型、lint、测试、自动发现、build、check:site 通过。Windows 策略不允许创建测试符号链接，相关 1 项按既有条件跳过，无失败。
- PASS：最终产物为 90 篇教材、334 个 Lab、25 个课程框架页、492 个 HTML，Pages base 下站内链接检查通过。
- PASS：浏览器人工查看最终静态 guide，介绍与 30 行编号准确、侧栏连续、无开发错误覆盖层。
- PASS：完整 Pages 浏览器回归 62/62，耗时 8.9 分钟；覆盖 Ch7 清单/侧栏连续编号、学习链接、手机宽度和全站导航。日志 .lab-cache/ch07-pages-tests.log。

## 本地交付

静态预览：http://127.0.0.1:5177/DSA-Mastery/learn/chapter-07-graph-traversal/00-exercise-guide/

服务使用 VitePress preview，PID 记录在 .lab-cache/ch07-preview.pid；日志在 .lab-cache/ch07-preview.log 与 ch07-preview-error.log。开发服务器已停止，预览服务保留供维护者检查。

原工作目录 C:/Users/28962/Desktop/dsa-lab 的已有 5 项未提交改动与分支保持原样。维护者追加要求创建面向 main 的 PR；提交与 PR 地址记录于 task.json，合并和生产发布另行处理。扩展迁移已通过自动测试，未进行原生 VSIX 升级安装测试。
