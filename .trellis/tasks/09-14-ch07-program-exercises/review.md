# Ch7 实现复核（2026-09-14）

## 已完成检查

- PASS：T01–T30 一一映射，稳定 ID 与目录保留，旧 07E02/03 为补充。
- PASS：20 个新增 Program，题面、C++17 starter/solution、manifest、Makefile 齐全。
- PASS：20×20=400 个新增测试、12×20=240 个旧测试，总计 640 点。
- PASS：20 题独立 oracle 与参考解一致，20 个典型错误变体均被反例检出。
- PASS：官方 lab:verify 共 32/32 通过，四项 checks 全真。
- PASS：test:ch07 检查顺序、32 个身份、测试标签、LF 与样例一致性。
- PASS：旧 DFS 深链默认栈溢出已用递归深度保护修复，原深链输入保留。
- PASS：pnpm test 完整通过，包含内容、类型、lint、工具/文档/Ch7、自动发现、构建与产物链接；一个既有 Windows 符号链接测试按环境条件跳过。
- PASS：根路径 Playwright 的 Ch7 新用例通过，覆盖 Labs 进入、32 题顺序、文章与题目互跳、390px 无溢出。
- PASS：/DSA-Mastery/ 构建与产物检查通过，89 篇教材、324 个 Lab、25 个课程框架页、487 个 HTML。

## 补充环境与浏览器验证

- PASS：/DSA-Mastery/ 完整 Playwright 62/62 通过（12.0 分钟），含 Ch7 新增用例及全部既有章节回归。
- PASS：MSVC 19.51 下 07E01/07E28/07E32 的官方 verify 四项全部通过。

## 人工 Review 边界

- 新题状态 draft。POJ 1392 错配已撤销；1135/AcWing 登录限制、3259 访问失败已记录。
- 新 7.2/7.6 文章不在仓库，本次只维护现存文章的有效入口。
- 使用 course-default 原生 Windows Clang，跨系统 CI 尚未在本地执行。
- MSVC 既有编译入口会在 Lab 根生成 main.obj；本次三个核验产生的对象文件已按精确路径清除，不进入产品改动。此处未扩展到共享编译器改造。

## 本次生成物清理

只删除本轮生成且初始工作树不存在的 3 个 main.obj、2 个 Python pyc，以及 3 个 Graphviz 缓存 SVG（bst-degenerate-chain / max-path-sum-local / threaded-tree-diagram）。SVG 已确认不在 git 索引、源码无文件名引用、绝对路径位于 public/diagrams 内，构建副本仍在 dist/pages 中；后续构建可重建缓存。保留用户原有 .agents/skills/ui-ux-pro-max/scripts/__pycache__/，未清理其他任务数据。

## 典型错误检出记录

命令：`python scripts/check-ch07-exercises.py --write --solutions --mutations`；随后再次以不带 --write 的检查核对静态输入与期望。

| Lab | 首个检出测试点 |
| --- | --- |
| 07E13 | `001-sample` |
| 07E14 | `005-two-disconnected-cycles` |
| 07E15 | `013-seeded-walk-0` |
| 07E16 | `009-self-loop` |
| 07E17 | `005-new-small-ready-vertex` |
| 07E18 | `011-cycle-with-exit` |
| 07E19 | `019-layered-many-paths` |
| 07E20 | `001-sample` |
| 07E21 | `006-disconnected` |
| 07E22 | `003-disconnected` |
| 07E23 | `001-sample` |
| 07E24 | `001-sample` |
| 07E25 | `004-disconnected-negative-cycle` |
| 07E26 | `003-singleton-blocked` |
| 07E27 | `001-sample` |
| 07E28 | `001-sample` |
| 07E29 | `001-sample` |
| 07E30 | `001-sample` |
| 07E31 | `006-reverse-residual-required` |
| 07E32 | `007-reverse-cost-required` |

后续将 07E24 的错误变体具体化为“把已经选入的边权求和”，以 `--lab 24 --solutions --mutations` 重跑，仍被 001-sample 检出。

- PASS：在 07E26 目录运行 `make run CASE=001-sample`，命令退出 0，starter 得到预期 WA / 0 分并显示可复制的重试命令。
- PASS：最终 `git diff --check`；无新增二进制、pyc 或构建日志进入产品改动。

## 提交与 PR

- 用户追加授权创建 PR 到 main；代码提交 `865a6005`，PR：https://github.com/AzenAnn/DSA-Mastery/pull/190。
- 提交前刷新 origin/main，与本分支起点一致；再次运行 `node --test tests/ch07-exercises.test.mjs`，1/1 通过。
- 暂存内容包括 400 个新输入和 400 个新期望输出。07E21 的 `002-singleton.out`、`003-no-edges.out` 按题面要求保留第三行空行；因此使用 `git -c core.whitespace=-blank-at-eof diff --cached --check` 检查其余空白问题，结果通过。
- 推送采用精确路径暂存；工作区已有的 Python 缓存及 public/diagrams 变动未纳入 PR。
- PR 保持待审阅；教学内容仍为 draft，未合并、未归档任务。未另行导出并在仓库外验证 20 份 student pack，相关限制已写入 PR。
