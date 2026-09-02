# 原生自举环境安装方案 · 实施计划

## 实施顺序

### 1. 建立共享版本与命令执行基础

- [x] 新增 `scripts/bootstrap/requirements.mjs` 薄封装与 `tools/lab/requirements.mjs` 共享实现，集中声明 Node `>=22.13.0`、pnpm `11.1.1`、GCC/Clang/MSVC/CMake 最低版本和 basic/full 需求。
- [x] 新增可注入的命令执行、版本解析、阶段报告和日志模块；生产实现只使用 Node 内置模块。
- [x] 为参数解析定义 `--profile basic|full`、`--check-only`、`--repo-dir`、`--repo-url`、`--update-repo`、`--skip-vscode`、`--non-interactive` 等稳定参数，并拒绝未知 profile。
- [x] 为版本比较、profile 需求矩阵、退出码和 JSON/纯文本报告补充单元测试。

### 2. 实现平台原生启动器

- [x] 新增 `bootstrap-macos.sh`：检测已有仓库/Node/Homebrew，安装缺失基础工具，刷新当前 PATH，再转交 `setup.mjs`。
- [x] 新增 `bootstrap-windows.ps1`：检测 PowerShell/winget，安装 Git/Node/Build Tools，刷新用户/机器 PATH，再转交 `setup.mjs`。
- [x] 两个脚本支持从仓库根执行和从仓库外下载执行；仓库目录为空时只 clone，已有 dirty worktree 时拒绝静默更新。
- [x] 对 CLT 安装弹窗、UAC、重启、执行策略、网络失败和缺少包管理器返回可识别信息，不通过 `|| true` 隐藏核心失败。
- [x] 保留 ShellCheck/PowerShell 解析检查入口；当前 macOS 没有这两个工具，因此只执行了 Bash 语法检查与静态审阅，不模拟 Windows 安装。

### 3. 实现共享 Node 协调器

- [x] 实现 `setup.mjs` 的 preflight、工具安装/复用、pnpm 准备、仓库初始化、依赖安装、VS Code 扩展和 smoke 阶段。
- [x] pnpm 采用“正确版本复用 → Corepack → npm 全局 → 用户可写 prefix”顺序；全程使用 `pnpm install --frozen-lockfile`，不生成或修改 `package-lock.json`。
- [x] basic 运行 Program Lab 的 doctor 与 reference sample；full 额外运行 Project Lab 的 doctor 与 reference task。
- [x] 让 `--check-only` 只执行只读探测；让 `--skip-vscode` 不影响核心环境；让可选扩展失败与核心失败分离。
- [x] 增加 `setup` / `setup:check` package scripts，并在无 `node_modules` 时确认直接 `node scripts/bootstrap/setup.mjs` 仍可启动。

### 3.1 实现交互 UI

- [x] 复用 `tools/lab/terminal.mjs` 的颜色和 TTY 判断经验，实现无第三方依赖的阶段状态模型、spinner、进度条、终端重绘和纯文本 fallback。
- [x] 实现交互 profile/确认菜单，以及 `--ui auto|tui|plain`、`--no-ui`、`--non-interactive` 的参数合同；重定向和 JSON 模式不得输出 ANSI。
- [x] 在 TUI 中显示阶段列表、当前命令、成功/警告/失败摘要和日志路径；外部命令完整输出只写日志，不与界面交错。
- [x] 覆盖失败步骤的重试、退出和重跑语义；无法交互时不等待按键，直接返回可复制的下一步。
- [x] 为 UI 状态转换、终端宽度、ANSI 清理、非 TTY 降级和无障碍纯文本输出补充单测；当前环境完成静态/自动化检查，未伪造跨平台人工检查。

### 4. 实现 MSVC 自动发现与注入

- [x] 新增 `tools/lab/toolchain.mjs`，用 `vswhere.exe` 定位满足 VC tools component 的 VS 实例，调用 `VsDevCmd.bat -arch=x64` 并解析环境变量。
- [x] 扩展 `runProcess` 接受合并后的 `env`，让 `doctor`、直接编译、Project CMake/CTest 共用 MSVC 环境。
- [x] 保持 `CXX` 显式覆盖优先级；GCC/Clang/macOS 行为不变；MSVC 失败信息包含可恢复建议。
- [x] 增加 Windows-only 或注入 fake command runner 的测试，覆盖成功、找不到 vswhere、找不到 VC component、环境输出解析和路径含空格。
- [x] 明确由 `setup:check` 提供 Git/Node/pnpm 主机级检查，`lab:doctor` 提供 Lab 级检查；两者文案不冲突。

### 5. 更新文档与 VS Code 集成

- [x] 在 macOS/Windows 学生指南顶部增加一键入口、basic/full 参数、check-only、重跑、日志、权限和 fallback。
- [x] 明确 full 才需要 CMake，GNU Make 始终可选；删除/改写 Windows 手动添加动态 `cl.exe` PATH 的误导性主路径。
- [x] 说明 VS Code/C++/CMake Tools 是可选 IDE 层，不是核心编译器；扩展安装失败如何单独重试。
- [x] 更新 README 与前言入口，使学生能从在线课程或仓库直接找到平台脚本。
- [x] 检查 VitePress include、图片、外链和现有 macOS/Windows 页面断言。

### 6. 验证与交付

- [x] 本地运行 setup 单元测试、`pnpm run validate`、`pnpm test:lab-tools`、`pnpm test:lab-docs`、自动发现、全量 `pnpm test` 和 Program Golden verify。
- [x] 在当前 macOS runner 运行 `bootstrap-macos.sh --check-only --profile basic/full`；basic 成功，full 在缺 CMake 时只读返回退出码 `14`，均未触发安装。
- [ ] 在 Windows runner 运行 `bootstrap-windows.ps1 -CheckOnly -Profile basic/full`；当前环境没有 Windows runner，保留为交付前跨平台复验项。
- [x] 对普通路径、含空格路径、已有仓库、dirty worktree、重复运行和缺失可选工具完成自动化覆盖；完整输出由测试/终端结果保留，失败日志路径已固定。
- [x] 构建站点并运行 `check:site`，确认新增前言入口和链接正确；Pages 专用浏览器 runner 未在本机伪造执行。
- [x] 最后复查 `git diff --check` 与 `git status --short`；未发现本任务新生成的 `package-lock.json`、setup 日志或安装包，已有 `.lab-cache`、`.vsix` 和 Trellis dirty 文件保持不动。

## 关键验证命令

```bash
node scripts/bootstrap/setup.mjs --check-only --profile basic --repo-dir .
node scripts/bootstrap/setup.mjs --check-only --profile full --repo-dir .
pnpm run setup:check -- --profile basic --repo-dir .
pnpm run setup:check -- --profile full --repo-dir .
pnpm run test:lab-tools
pnpm run test:lab-docs
pnpm run validate
pnpm test
```

平台验证使用对应原生入口，不把 macOS 成功当成 Windows 成功的替代证据：

```bash
./scripts/bootstrap/bootstrap-macos.sh --check-only --profile basic
./scripts/bootstrap/bootstrap-macos.sh --check-only --profile full
```

```powershell
.\scripts\bootstrap\bootstrap-windows.ps1 -CheckOnly -Profile basic
.\scripts\bootstrap\bootstrap-windows.ps1 -CheckOnly -Profile full
```

## 风险点与回滚点

| 阶段 | 风险 | 回滚/隔离方式 |
| --- | --- | --- |
| 版本常量集中 | 现有 doctor 输出或测试出现版本漂移 | 先只抽取常量，保持报告字段和最低版本不变 |
| MSVC 环境导入 | Windows 子进程编码/批处理输出/路径空格 | 以 fake runner 单测解析器；保留 Developer Prompt fallback |
| 安装器写 PATH | 覆盖用户 PATH 或 profile | 只追加幂等片段，默认不永久写 Windows PATH；失败可删除生成片段 |
| 仓库更新 | 覆盖学生未提交代码 | dirty worktree 直接停止，更新只在确认/显式参数下执行 |
| 外部安装 | 网络、UAC、包管理器版本变化 | 阶段化日志，失败可重跑；手工指南作为 fallback |
| 文档/页面 | include、链接或静态断言回归 | 先更新源文档，再跑内容/构建/Pages 门禁 |

## 开始实现前的 review gate

- [x] 用户已确认 basic/full 双 profile 方案。
- [x] PRD 已通过收敛检查，未保留未决产品问题。
- [x] `design.md` 与 `implement.md` 已被人工审阅。
- [x] 实现阶段明确不包含离线完整安装包、AI CLI、无 winget 的 Windows 自动安装 fallback。
- [x] 用户已批准 basic/full + 轻量 TUI 规划；下一步执行 `task.py start`，再按本计划从第 1 步开始。
