# Verification

日期：2026-09-10。分支：feat/ch01-linear-list-written-theory。开发者：Azen。

## 内容与题解

- PASS：README-only Theory Lab 01T06，15 道编号大题、15 个默认折叠答案，每题 10 分、共 150 分。
- PASS：全部题目对应指定笔记，7 道统考题逐一读取公开题面及解析；8 道巩固题按笔记出处标注。题源记录覆盖 24 道唯一综合题中的 15 个选中项和 9 个排除项。
- PASS：已有 ch1 教材与 Lab 按题面/算法合同排重；结构脚本另扫描其余 388 个内容文件，15 个稳定题目标识没有重复。
- PASS：`node .trellis/tasks/09-10-ch01-linear-list-written-theory/verify-answers.mjs`，53,629 个数组用例、34,034 个链表用例。优化算法与直接枚举结果对照，另检查结点身份、释放集合、拓扑、分配失败、奇偶长度、环与等频访问次序；共享尾段扩展用例通过。
- PASS：修正原笔记中的标记上界、候选追踪、奇数长度中点、完整初始化复杂度及频度题指针修改约定。伪代码用于纸笔训练，未宣称为可直接编译的程序。

## 项目门禁

- PASS：`pnpm test`，内容校验、类型、lint、树演示、bootstrap、Lab 工具、Lab 文档、discovery、根路径最终构建及产物检查全部完成。
- 内容统计：88 篇教材、226 个 Lab、220 个 manifest、581 道选择题。产物为 25 个课程框架页、共 383 个 HTML。
- 单测：树演示 5 项通过；bootstrap 36 项通过；Lab 工具 40 项通过，1 项因 Windows 符号链接策略按既有条件跳过。
- PASS：设置 `GITHUB_PAGES_BASE_PATH=/DSA-Mastery`、`SITE_URL=https://azenann.github.io/DSA-Mastery/` 后执行 `pnpm run build`，最终构建 82.85 秒。构建仍有既有的大体积分块提示，无构建错误。
- PASS：相同环境下 `pnpm run check:site`，base 为 `/DSA-Mastery/`。
- PASS：相同环境下完整 `pnpm run test:pages`，44/44 通过，耗时 3.5 分钟。
- PASS：`git diff --check`；清除本次构建造成的无关 Graphviz 源目录产物变化。

## 浏览器与本地预览

- PASS：`LAB_PREVIEW_URL=http://127.0.0.1:4173/DSA-Mastery node .trellis/tasks/09-10-ch01-linear-list-written-theory/verify-browser.mjs`，1440px/390px 与浅色/暗色四组全部通过。
- PASS：Labs 卡片、ch1 Theory 侧栏和中文搜索可到达新 Lab；15 题及 15 份答案完整，没有自动选择题评分组件。
- PASS：鼠标与 Enter 展开/收起、伪代码复制、MathJax、表格和 PNG 均正常；四组页面无根横向溢出、图片损坏、容器语法泄漏、控制台或请求错误。
- PASS：人工查看桌面/手机截图，标题、题面、答案、代码、频度表格和拆链图均可读。长代码使用现有代码块内横向滚动。
- 截图与机器报告：`outputs/ch01-linear-list-preview/`，包含四组 `top/answer/diagram/frequency.png` 及 `verification.json`，该目录为本地忽略产物。
- 首次预览遇到旧端口占用与旧资源索引；修正启动助手，使端口探测覆盖双栈监听并等待新 Lab HTTP 就绪，再重启后四组全部通过。
- 本地预览：<http://127.0.0.1:4173/DSA-Mastery/labs/chapter-01/theory/T-01-06-linear-list-written/>。
- 服务 PID：36940。最终 HTTP 状态 200。服务在最终构建之后启动。

## 预览阶段交付状态

本地内容和验证完成，任务进入 review，等待用户预览验收。所有修改保留未提交状态；未推送、未创建 PR，也未部署至远端。Trellis 日志使用 `--no-commit` 记录。

## PR 提交阶段

用户于 2026-09-10 要求提交 PR，授权已覆盖本任务的提交与推送。远端 main 已合入上一份栈与队列 PR #167，本分支同步至 9e1d1df 后保留两份搜索回归和两条独立的 Azen 日志，再次检查集成结果。

- PASS：同步后的 `pnpm test` 全部通过；统计为 88 篇教材、227 个 Lab、221 个 manifest、601 道选择题、385 个 HTML。根路径最终构建 83.00 秒；Windows 符号链接测试仍按既有策略跳过 1 项。
- PASS：对最新仓库重新运行 `verify-answers.mjs`，其余内容扫描范围增至 390 个文件，题量、分值、53,629 个数组用例和 34,034 个链表用例均通过。
- PASS：同步后 Pages 子路径最终构建 81.31 秒，`check:site` 检查 385 个 HTML 通过。
- PASS：重启本地服务后再次运行新 Lab 四组专项浏览器检查，全部通过且无资源或脚本错误；桌面与手机题图截图复核通过。最新预览 PID 为 42148，URL 保持不变。
- PASS：同步后的完整 Pages 浏览器回归 44/44 通过，耗时 3.2 分钟，包含 Ch1 与 Ch2 新增训练的搜索和侧栏入口。
