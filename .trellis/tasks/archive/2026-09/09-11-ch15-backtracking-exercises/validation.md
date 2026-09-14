# Ch15 验证记录

## 环境与范围

- Windows x64，Node v24.14.0，pnpm 11.1.1。
- 默认C++编译器为g++驱动的Clang 21.1.0；补充MSVC 19.51验证。
- 分支 `feat/ch15-backtracking-exercises`，21个新Program Lab，稳定ID为15E01..15E21。
- 最终公开测试227组，总分每题100；没有修改学生判题内核或其他章节正文。

## 已通过

1. PASS：21题逐个执行 `node tools/lab/cli.mjs verify <path> --json`，参考实现全部100分、学生全部可编译且非满分、固定答案无漂移。JSON证据在 `.lab-cache/ch15-verification/E-15-*.json`。
2. PASS：`node scripts/generate-chapter-15-search-tests.mjs` 独立核验227组输入与固定答案，包括位掩码枚举、计数组合DP、BFS、精确覆盖数独及小木棍子集DP。
3. PASS：P1706 n=9输出16,692,480字节，P1157 n=20/r=10输出5,727,436字节，LC47最大用例输出1,088,646字节；均未触发OLE。Clang首轮226例最慢用例约325ms。
4. PASS：P1074两个官方样例分别2829和2852，并核验多解最高分与24给定数；LC37全部数据独立确认唯一解。
5. PASS：P2324由独立双向BFS证明最短15步的棋盘编码为 `10111011010101110*0000100`；同时覆盖0、1、8步、超过15步和10组输入。
6. PASS：`CXX=cl` 下复核15E01、15E20、15E21，参考满分、学生可编译且非满分，证据为 `.lab-cache/ch15-verification/msvc-*.json`。
7. PASS：15E17学生包在仓库外独立validate/run成功，初始分9/100，包内51个源文件且无solution/二进制。临时副本已送入回收站；删除命令曾被自动审批拒绝，改用可恢复方式完成清理。
8. PASS：`pnpm run test:lab-make` 通过，根、本地和学生包入口一致。
9. PASS：`pnpm test` 全部门禁成功，包括内容、类型、lint、单测、文档、自动发现、默认根路径构建和产物检查。Lab工具46项中45通过、1项因Windows不允许测试符号链接按既有规则跳过。
10. PASS：默认根路径执行 `pnpm exec playwright test --grep 'chapter 15' --workers=2`，5项全部通过，覆盖21个页面、21条侧栏顺序、所有新题搜索、Labs索引及1440/390px明暗主题。
11. PASS：已人工查看桌面侧栏、390px电话组合页面和移动暗色侧栏截图，未见遮挡或根页面横向溢出。根路径截图备份在 `.lab-cache/ch15-pages-root/`。

P1036补充n=1/k=0后，该题verify、全章独立数据检查、内容校验和新增脚本/页面测试lint均再次通过。

## 最终验证

12. PASS：`GITHUB_PAGES_BASE_PATH=/DSA-Mastery` 下最终构建成功，产物审计通过：88篇教材、263个Lab、25个课程框架、425个HTML；P1036新增边界已进入最终HTML。
13. PASS：同一Pages环境执行 `pnpm run test:pages`，56项全部通过，用时5.6分钟。`test-results/.last-run.json` 为passed且failedTests为空。
14. PASS：直接运行P1157参考可执行文件，确认r=0确实输出一个空行，补足tokens比较的空白盲区。
15. PASS：`git diff --check` 通过；592个本次新增文件检查通过，227个标准输出文件均为LF。MSVC在三题根目录生成的main.obj已送入回收站，未修改共享编译器实现。
16. PASS：本地VitePress开发服务已启动于5173端口（本次进程10428）。真实浏览器打开章节页，标题正确、侧栏包含21条练习链接、控制台和页面错误为空。

预览URL：http://127.0.0.1:5173/learn/outline/chapter-15-backtracking-search/

开发预览截图：`.lab-cache/ch15-preview.png`。Pages截图保留在 `test-results/pages-navigation-chapter-1-*/ch15-*.png`；默认根路径截图备份在 `.lab-cache/ch15-pages-root/`。

## 工作区说明

开发验证完成时未提交、推送、合并或发布。用户后续明确要求“提交pr”，授权提交本任务改动、推送功能分支并创建PR。执行期间发现 `public/diagrams/` 有非本任务源文件改动相关的缓存变化，已保留，不还原未知来源的变动，也不纳入本次PR。
