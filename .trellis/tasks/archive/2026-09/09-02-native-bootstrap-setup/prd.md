# 原生自举环境安装方案

## Goal

为 DSA Mastery 学生提供一个原生、可恢复、可重复执行的跨平台环境自举入口：用户下载并运行对应平台的启动脚本后，脚本自动安装缺失的系统工具，配置项目运行环境，完成仓库依赖安装和 Lab 冒烟验证，并在无法自动完成时给出明确的人工下一步。

目标是把当前 macOS/Windows 教程中的多次手工下载、PATH 修改、开发者终端切换和验证命令收敛成一次可观察的安装流程；不把平台编译器和 SDK 打包进仓库。

## Confirmed repository facts

- `package.json` 固定 Node.js `>=22.13.0`，并通过 `packageManager` 固定 pnpm `11.1.1`。
- Program Lab 需要 GCC `>=11`、Clang `>=14` 或 MSVC `>=19.30` 之一；Project Lab 额外需要 CMake `>=3.25`。GNU Make `>=4.0` 是推荐的薄入口，但不是必需依赖。依据：`tools/lab/doctor.mjs:5-10,62-95`、`docs/LAB_AUTHORING_GUIDE.md:42-53`。
- 当前 `lab:doctor` 只检查 C++ 编译器、CMake 和 Make，不检查 Git、Node、pnpm，也不负责修改 PATH 或初始化 Windows 的 MSVC 开发环境。依据：`tools/lab/doctor.mjs:62-97`、`docs/LAB_AUTHORING_GUIDE.md:59-63`。
- Windows CI 使用 `vswhere.exe` 定位 Visual Studio，再调用 `VsDevCmd.bat -arch=x64` 后运行 `cl`；仅把 `cl.exe` 加入 PATH 不是完整方案。依据：`.github/workflows/pages.yml:133-147`。
- macOS 教程采用 Xcode Command Line Tools、Homebrew、Node、pnpm、VS Code 和 CMake 的手工流程；它假设可使用 Corepack，但当前检查环境的 Node `v26.0.0` 没有 `corepack`，因此安装器必须有固定 pnpm 的 fallback。依据：`docs/MACOS_STUDENT_SETUP_GUIDE.md:7-21,125-211`；本机实测 `corepack: command not found`、`pnpm 11.1.1`。
- 仓库已有统一 Node CLI、`doctor`、Program/Project 冒烟对象和 `pnpm install --frozen-lockfile`，但没有原生安装脚本或 Dev Container。依据：`package.json:1-66`、`tools/lab/cli.mjs`、仓库文件清单。
- 当前工作树已有与本任务无关的未提交 Trellis 记录、归档任务目录和 `.vsix` 文件；实现时不得覆盖或顺手纳入这些改动。

## Requirements

### R1. 原生启动入口

- 提供 macOS 和 Windows 两个不依赖 Node/Python 的原生入口，例如 POSIX shell 与 PowerShell；入口负责前置探测，并在安装 Node 后转交给共享的 Node 配置器。
- 支持从仓库内执行，也支持用户从发布页/Raw URL 下载脚本后执行；脚本不得要求用户先手工 clone 仓库。
- 入口应支持安全重跑：已安装工具、已配置环境和已存在仓库不重复破坏或覆盖；失败后再次运行可以从探测阶段继续。

### R2. 工具链与项目配置

- 检测操作系统、CPU 架构、管理员权限、联网状态和可用的系统包管理器。
- 提供可选择的 `basic` 与 `full` profile：`basic` 覆盖 Quiz/Program 所需工具；`full` 在此基础上安装并验证 Project 所需 CMake。命令行显式指定 profile 时不强制交互选择，省略时可交互选择。
- macOS 处理 Xcode Command Line Tools、Node、固定版本 pnpm；`full` 额外处理 CMake。自动化路径可以使用 Homebrew 管理 Node/CMake/VS Code，但手工安装指南仍保留不使用 Homebrew 的 fallback。
- Windows 处理 Git、Node、固定版本 pnpm、Visual Studio C++ Build Tools；`full` 额外处理可直接调用的 CMake。通过 `vswhere`/`VsDevCmd.bat` 建立或注入完整 MSVC 环境；不得把动态版本号的 `cl.exe` 路径硬编码到用户 PATH。
- GNU Make 不作为必装依赖；如平台包管理器容易获得，可作为可选组件安装。
- 工具版本来源必须与 `package.json`、Lab 工具最低版本和文档保持一致，不在多个脚本中复制互相漂移的版本常量。

### R3. 仓库初始化与可选 IDE

- 支持选择仓库目录；没有目标仓库时 clone 官方仓库，有仓库时检查远端/工作树并询问是否更新，不得静默覆盖未提交内容。
- 在仓库根执行 `pnpm install --frozen-lockfile`。
- 提供可选 VS Code 安装和扩展安装；VS Code 不是编译器，扩展安装失败不能掩盖核心 CLI/Lab 环境成功。
- 不默认构建或安装 Trellis、AI CLI、Homebrew 之外的开发者工具；学生安装器与维护者开发环境分开。

### R4. 验证与可诊断性

- 安装结束输出分层结果：基础工具、Program 工具链、Project 工具链、仓库依赖、VS Code/扩展、冒烟测试。
- 扩展 `doctor` 或新增统一检查，使结果至少覆盖 Git、Node、pnpm、可用 C++ 编译器、CMake（按 profile）和 Windows MSVC 开发环境。
- 至少运行一个 Program Lab 的 `doctor` + reference/smoke run；完整配置时再运行一个 Project Lab 的 `doctor` + reference/smoke run。
- 支持 `--check-only`，只检查不安装；支持 `--profile`，区分最小 Program 环境和包含 CMake 的完整环境。
- 失败时给出失败阶段、具体命令/日志位置、是否需要重启终端或系统、以及可复制的人工修复建议；退出码可被脚本/CI 区分。

### R5. 文档与发布

- 更新 macOS/Windows 学生指南，把自举入口作为首选，并保留手工安装作为受限网络、学校设备策略或包管理器不可用时的 fallback。
- 清楚说明权限、网络、重启、杀毒软件/执行策略、代理和公司/学校设备限制等无法由脚本绕过的边界。
- 不提交编译器、SDK、Node 或 VS Code 二进制；安装脚本只下载官方/明确来源的安装器或通过系统包管理器获取组件。

### R6. 交互界面与进度反馈

- 启动时提供 profile 选择、可选 VS Code 选择、已有仓库更新确认和失败后重试/退出等交互；显式传入 `--profile` 或 `--non-interactive` 时不阻塞等待输入。
- 在支持 TTY 的终端中显示相对现代化的安装界面：阶段列表、成功/进行中/等待/失败状态、整体进度、当前动作和可查看的错误摘要。
- 对安装器弹窗、下载等待和无法估算时长的命令使用 spinner/indeterminate 状态，不伪造百分比；完整命令输出写入日志，避免破坏界面。
- 在 CI、重定向、旧终端或 `--no-ui` 下自动降级为稳定的纯文本阶段日志；`--json` 输出机器可读报告且不包含 ANSI 控制码。
- UI 层不引入 Electron、浏览器服务或大型运行时依赖；安装器必须在没有 Node 时仍能完成前置探测，并在 Node 可用后启用增强界面。

## Out of scope

- 不制作包含 MSVC、Windows SDK、Apple SDK、Node、CMake 或 VS Code 的完整离线便携包。
- 不承诺绕过管理员权限、macOS 安全确认、PowerShell 执行策略、企业设备管控或网络代理。
- 不把 GNU Make 变成课程硬依赖，不重写现有 Make/Node Lab 判题逻辑。
- 不自动修改用户已有未提交代码、远端分支、全局 Git 身份或仓库内容。
- 不在本任务中安装或配置 Trellis、Claude Code、Codex、OpenCode 等 AI CLI。

## Acceptance Criteria

- [ ] macOS 与 Windows 各有一个原生启动入口，且在目标运行时尚不存在时仍可启动前置检查。
- [ ] 在已满足部分依赖的机器上重复执行不会破坏现有 PATH、未提交仓库改动或已有安装；`--check-only` 不产生安装/文件写入副作用。
- [ ] Node/pnpm 版本检查与 `package.json` 一致；没有 Corepack 时仍能准备 pnpm `11.1.1`，不依赖 npm 生成锁文件。
- [ ] Windows 能通过 Visual Studio 安装实例初始化完整 MSVC 环境后运行 `cl` 和 C++ Lab；不依赖手工写入动态 `cl.exe` 目录到 PATH。
- [ ] Program profile 完成依赖安装、仓库 `pnpm install --frozen-lockfile`、Program `doctor` 和一个 reference/smoke run。
- [ ] Full profile 在 Program 基础上完成 CMake、Project `doctor` 和一个 reference/smoke run；Make 缺失不会阻塞 pnpm 入口。
- [ ] 任一阶段失败均有非零退出码、阶段化错误信息和可复制的后续动作；成功结果能明确区分“核心环境成功”和“VS Code/扩展可选项失败”。
- [ ] macOS/Windows 教程已说明脚本用法、权限与 fallback；相关 Markdown、脚本单测/静态检查和既有 Lab/站点门禁通过。
- [ ] 交互终端能看到 profile、阶段状态、进度和失败摘要；非 TTY/CI/`--no-ui` 模式输出不含 ANSI 且可重定向保存。
- [ ] 测试覆盖普通路径、含空格路径、已存在仓库、未提交改动保护、缺包管理器/缺工具、Windows MSVC 开发环境初始化分支、重复运行，以及 TTY/非 TTY UI 降级。

## Resolved product decision

同时提供两种可选 profile，由用户在启动时选择或通过参数指定：

- `basic`：安装 Git、Node、固定版本 pnpm、平台 C++ 编译器，以及可选 VS Code/C++ 扩展；完成 Program Lab 验证，不安装 CMake。
- `full`：包含 `basic` 的全部内容，额外安装 CMake 和 CMake Tools 扩展（如选择 VS Code），完成 Project Lab 验证。

默认不强制选择某一档：交互启动时显示 `basic/full` 选择；脚本参数显式指定时可用于无交互安装。这样保留轻量首次安装和完整课程环境两种路径。

## Resolved UX decision

采用轻量现代 TUI：使用 Node 内置 `readline` 和 ANSI 控制序列绘制阶段卡片、spinner、进度条和错误摘要，非 TTY 自动降级为纯文本。它不需要浏览器或额外依赖，最适合“下载一个脚本即可运行”的原生自举路径。

不采用浏览器 UI：虽然视觉空间更大，但会增加端口、浏览器、生命周期、无桌面环境和安全边界，且安装前置阶段仍只能使用 shell 文本。

## Notes

- 本 PRD 只记录需求和验收；具体模块边界见同目录 `design.md`，实施顺序和验证门禁见 `implement.md`。
