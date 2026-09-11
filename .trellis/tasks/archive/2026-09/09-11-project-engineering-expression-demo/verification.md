# 本地验证记录

日期：2026-09-11。开发者 Azen。分支 `feat/project-engineering-expression-demo`，基线 `e2aac0c`；PR #173 已核实合并，原 Ch4 分支保留。以下是本地交付时的验证快照，当时未执行远端操作；用户随后已授权提交 PR 并发布插件 0.1.13，远端验证另行记录。

## 环境

Windows PowerShell 5、Node 24.14.0、pnpm 11.1.1、MSVC 19.51、CMake 4.0.3 / Ninja、VS Code 1.137.0。VS Code 位于 `C:\Microsoft VS Code`，实测空格路径。内置 Node 24.18.1 以 `ELECTRON_RUN_AS_NODE=1` 成功执行本仓库 CLI validate。

## 已通过

- 表达式 02P04：4 Task / 13 组 CTest，参考 100/100，起始代码全部可编译、4/100。Task 3 和 Final 真实链接 student 模块；solution preset 独立。
- `pnpm.cmd run test:project-engineering`：最终一轮 143.6 秒通过。临时副本覆盖无关 Final CE 不影响 stack、公共 stack CE 使 postfix/final BLOCKED、上游单测 WA 下游继续、前三 Task AC 而 Final WA、传递 STALE、恢复旧 mtime 后不复用旧程序。
- 全新学生包在仓库外含空格临时目录 validate/score 成功运行，不依赖 node_modules 或 solution；起始分不满。
- `pnpm.cmd run test:lab-golden`：Quiz、Program、混合 stdio/CTest/manual Project、独立学生包通过。Ch10 `verify` 另外通过：参考自动 80/80、起始 0/80、人工待评 20。
- Lab tooling 最终 45 项通过、1 项因 Windows 不允许创建符号链接而跳过；新增 schema/目标/依赖环、单 case 不覆盖完整 Task、锁、当前/历史和 manual 测试通过。
- 扩展 47 项测试、typecheck 通过。包含 Ch4 20 个重叠 ID 迁移、Program/Quiz 历史兼容、保存失败/无关文件保护/并发、未核验历史不算当前完成、Workspace Trust/无 PATH Node 回退。
- 实际 VSIX 0.1.13 打包成功，29 文件，约 896 KB。SHA256：`0200BFFCFCEE7AF15380DD2A4AAD10A1C1A5214ABC76CF24736DCB6D562E1C07`。
- PowerShell 辅助脚本：Release 0.1.12 下载、本地 VSIX 预检与隔离安装、重复安装/更新/回退、版本校验成功；缺文件、错误 CodePath、单侧隔离参数均清晰失败。未修改 PATH、执行策略或提升权限。
- 安装版扩展真实 UI：发现 02P04、Task README/学生文件、单项 WA、dirty STALE、保存后重测 AC、全项目 WA。脚本 `scripts/verify-extension-project-ui.mjs` 驱动实际安装的 VSIX。
- 隔离持久化：旧版 0.1.12 写入真实 SQLite 的 Project/Program 记录；升级 0.1.13、重启、回退 0.1.12 后 Program 原记录逐字段一致，Project 提交数不减少。最终隔离环境已重新装回 0.1.13。

## 网站门禁

- 最终 `pnpm.cmd test` 全部通过：内容、类型、lint、5 项树演示测试、36 项 bootstrap 测试、Lab tooling、Lab 文档、自动发现、构建和产物检查。
- 根路径 `/` 的前言/Project/四 Task 桌面与 390px 浏览器回归 2 项通过。
- `GITHUB_PAGES_BASE_PATH=/DSA-Mastery/`、`SITE_URL=https://azenann.github.io/DSA-Mastery/` 下最终 build/check:site 通过：88 教材、242 Lab、404 HTML；完整 Playwright 51/51 通过，包含新增 Project/前言/四 Task 链接、标题和无页面横向溢出检查。桌面/移动截图已人工查看。
- Project 工程故障矩阵已加入既有 Pages workflow 的 GCC/Clang/MSVC matrix；这里只执行了本机 Windows 验证，没有触发远端 workflow。
- `git diff --check` 和最终 lint 通过。已移除本次构建带来的无关 Graphviz 缓存差异，保留原 Ch4 资源。
- 预览服务 `http://127.0.0.1:4187/DSA-Mastery/`（PID 46828）已运行；首页、02P04 和前言安装页实际返回 HTTP 200。

## 证据与边界

证据在根目录 `.lab-cache/extension-review/`：`old/new/reload/rollback-ui-verification.json`、对应 `*-persisted-progress.json`、`project-failure-desktop.png`、`project-retry-desktop.png`、`pages/` 桌面/移动截图。`before-update-persisted-user-data/` 是真实升级前备份。早期带 `--extensionTestsPath` 的内存宿主尝试和失败截图不计作通过证据。

未原生实测 macOS/Linux、旧版 VS Code 1.90、组织策略/受管设备、下载文件网络标记和受限目录。macOS 命令按 bash/应用包路径及失败即退出规则校核。Windows 符号链接测试跳过没有通过修改系统策略来绕开。GUI 安装入口提供文档兜底；安装、更新与回退实测使用 CLI。

当前方案每轮测评清理一次构建产物，后续 Task 复用本轮编译结果；这是确保恢复旧时间戳源码后评分正确的保守选择。manual 仍不提供人工录分；多文件历史版本系统不在本轮范围。本页所述验证均在首次本地交付前完成。
