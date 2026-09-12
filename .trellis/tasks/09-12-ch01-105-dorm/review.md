# 105 栋 Project 检阅记录

## 本次交付

- 分支：`lab/ch01-105-dorm`，基于 `origin/main` 的 `acfddf5d`。
- 身份：Azen；Lab ID：`01P02`。
- 入口：`labs/chapter-01/project/P-01-02-105-dorm/README.md`。
- 四关：学生表 30 分、帮送结算 25 分、待送链表 30 分、整合 15 分。
- 学生只改四个 `student/*.cpp`，合计 17 个带递进提示的函数；无需编写菜单、输入解析或测试框架。
- 已有完整参考实现、21 个测试组、两个命令行样例、独立学生包支持。
- 用户已明确授权推送 `lab/ch01-105-dorm`，不合并到 `main`；正在执行提交与发布，learner 尚未修改。

## 已完成验证

- [x] `pnpm lab:doctor`：Windows，Node 24.14.0，CMake 4.0.3，MSVC 19.51 与 Clang 21.1 可用。
- [x] `pnpm lab:validate`：4 个任务，权重 100/100，ID 与目录合法。
- [x] `pnpm lab:verify`：MSVC 参考实现 100/100，21 组通过；学生模板全部编译通过，初始 3/100。
- [x] Clang 21.1（Windows llvm-mingw）独立构建：21 个 CTest 全部通过。
- [x] 顺序表 1500 次模型对照、帮送 600 次状态模拟、链表 1200 次模型对照及 32 种删除组合。
- [x] 学生包移至系统临时目录的带空格路径，确认没有 solution、二进制或 node_modules；独立 validate/run 通过，严格 score 正确返回 1。
- [x] 干净副本单独运行 students 参考任务满分，未构建 pending/final 可执行文件。
- [x] 初轮内容、类型和 lint 检查通过；新增浏览器测试出现的 globalThis 写法问题已修复。
- [x] `pnpm test:lab-make` 通过。
- [x] 最终 `pnpm test` 全仓检查：内容、类型、lint、树可视化 5 项、bootstrap 36 项、Lab 工具 45 项、文档、自动发现、build 和 check:site 通过。Windows 符号链接测试 1 项按既有环境规则跳过。
- [x] 新 Lab 的 1280px / 390px 浏览器检查通过，总题面与四个任务页均可打开，页面无根级横向溢出；已人工查看两张截图。
- [x] 最终 diff 和学生源码检查：46 个新 Lab 文件，17 个核心 TODO；参考实现独立存放；无占位替换标记和行尾空白问题。
- [x] `pnpm test:pages`：62/62 通过，耗时 7.1 分钟，包括新 Lab、Ch1 分类及既有章节回归。

分发与 Clang 原始日志位于 `.lab-cache/dorm105-review/`；这些生成物不提交。未声称已验证 Linux、macOS 或 GCC。

本地预览：<http://127.0.0.1:4182/labs/chapter-01/project/P-01-02-105-dorm/>。后台进程 PID 34608。桌面/手机截图为 `.lab-cache/dorm105-review/lab-1280.png`、`lab-390.png`。

代码阅读已检查：批量删除的稳定性与 O(n) 扫描、失败前不修改状态、并列榜首的名单顺序、链表删除后的前驱/尾指针维护、Final 删除保护的整批预检查。自动评分验证行为；复杂度和节点释放还应在学生代码检阅时确认。

## 请重点检阅

1. 四关题面是否符合你想要的 105 栋故事和学生难度。
2. 每个学生文件的提示是否足够引导，又保留算法推导空间。
3. 体力规则是否合适：从一楼出发并返回，每次一件；不自动恢复体力。
4. “今日榜”统计当前名单；删除学生后该学生数据离开榜单，不是永久历史记录。
5. 必做算法为原地批量删除、扫描求榜首、链表遍历删除；有序归并仅选做。

## 远端发布与 learner 步骤

只提交本次 Lab、章节入口、相关浏览器断言和 Trellis 记录，推送 `lab/ch01-105-dorm`，不合并 main，不触发正式部署。

learner 在 `C:\Users\28962\Desktop\DSA-Mastery-learner`，origin 指向同一仓库且推送被禁用。发布后先检查并保存其未提交做题改动，再执行：

~~~powershell
git fetch origin
git switch -c test/ch01-105-dorm Az-learn
git merge --no-edit origin/lab/ch01-105-dorm
pnpm lab:locate -- 01P02
pnpm lab:run -- labs/chapter-01/project/P-01-02-105-dorm --task students
~~~

在插件中找到 01P02，先实现 Task 1 的 `findIndex` 和 `add`，保存后运行该任务。初始未满分属于模板预期；先验证测评链路，再开始练习。不要将参考解复制到 learner 的学生文件。

后续开发修复仍推同一功能分支，learner 测试分支使用 `git fetch origin` 和 `git merge --no-edit origin/lab/ch01-105-dorm` 更新。测试工作提交在测试分支后，可切回 `Az-learn`。
