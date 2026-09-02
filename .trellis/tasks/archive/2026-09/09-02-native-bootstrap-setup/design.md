# 原生自举环境安装方案 · 技术设计

## 1. 目标与边界

安装器解决的是“学生没有预装 Node、pnpm、C++ 工具链和 CMake 时，如何从一个原生脚本进入可做题状态”，而不是制作一个包含所有 SDK/编译器的离线镜像。

支持两条原生入口：

- macOS：POSIX shell 脚本，适配 Apple Silicon 与 Intel。
- Windows：PowerShell 脚本，适配 Windows 10/11 原生环境。

两条入口只负责平台前置与仓库定位；进入仓库后统一调用 Node 内置模块实现的协调器。这样安装逻辑、日志、版本比较、仓库保护和验证结果只有一份，平台差异集中在包管理器和工具链初始化边界。

## 2. 组件边界

建议新增以下入口和模块：

```text
scripts/bootstrap/
  bootstrap-macos.sh       # 无 Node 前置的 macOS 启动器
  bootstrap-windows.ps1    # 无 Node 前置的 Windows 启动器
  setup.mjs                # 安装协调器、profile、仓库初始化和报告
  requirements.mjs         # Node/pnpm/compiler/CMake 最低版本与 profile 需求
  checks.mjs               # 版本、路径、仓库状态和结果汇总
  commands.mjs             # 可注入的命令执行层，便于单测

tools/lab/
  toolchain.mjs            # 跨平台 C++/CMake 环境解析，含 MSVC 环境导入
```

`requirements.mjs` 是版本事实的单一来源。`tools/lab/doctor.mjs`、安装协调器和测试都从这里读取，不再各自复制 Node/pnpm/compiler/CMake 版本常量。

`toolchain.mjs` 保持 Node 内置模块依赖，供 Lab CLI 和安装检查共同使用；它不安装工具，只负责发现和准备当前进程的子进程环境。

## 3. 启动与安装数据流

```text
用户运行平台脚本
  ├─ 解析 profile / repo-dir / check-only / skip-vscode
  ├─ 检查系统、架构、网络、权限和包管理器
  ├─ 安装或复用 Git、Node、C++、CMake、VS Code
  ├─ 刷新当前进程 PATH
  ├─ 定位或安全 clone 仓库
└─ node scripts/bootstrap/setup.mjs
       ├─ interactive UI：profile/确认/阶段进度/失败操作
       ├─ 准备 pnpm 11.1.1（Corepack 优先，npm 全局/用户目录 fallback）
       ├─ pnpm install --frozen-lockfile
       ├─ 安装 VS Code 扩展（可选）
       ├─ Program doctor + reference smoke
       └─ full profile：Project doctor + reference smoke
```

### 3.1 从仓库外启动

平台脚本应同时支持两种位置：

1. 在已 clone 的仓库根目录执行，直接使用仓库内的 `setup.mjs`。
2. 从发布页或 Raw URL 下载到临时目录执行：脚本先完成平台工具准备，再按默认仓库 URL clone 到用户指定目录，最后调用 clone 后的协调器。

默认仓库 URL 使用当前公开仓库地址；`repo-dir` 可覆盖。远端已有仓库时先验证 `package.json`、`labs/` 和 `tools/lab/cli.mjs`，再检查 `git status --short`：有未提交改动时禁止静默 pull/覆盖；干净仓库只在用户确认或显式 `update-repo` 时 `git pull --ff-only`。

### 3.2 profile

| profile | 安装/验证 | 适用场景 |
| --- | --- | --- |
| `basic` | Git、Node、pnpm、C++ 编译器、仓库依赖、VS Code/C++ 扩展（可选）、Program smoke | Quiz/Program 学习 |
| `full` | `basic` 全部内容 + CMake、CMake Tools 扩展（可选）、Project smoke | 完整课程与 Project Lab |

GNU Make 不纳入 profile 的必需集合。验证统一使用 `pnpm lab:*`，因此 macOS 系统自带 Make 版本较低或 Windows 未安装 Make 都不会阻塞。

## 3.3 交互 UI 设计

首版采用“原生启动器 + 轻量 TUI + 纯文本 fallback”的模式：

- 平台脚本在 Node 尚不可用时使用简短的彩色阶段提示和交互菜单，完成 profile、仓库目录和权限相关选择。
- Node 可用后，`setup.mjs` 在 TTY 中接管为单屏或准单屏的安装面板：顶部显示项目/profile/平台，中部显示步骤状态，底部显示整体进度、当前动作和最近一条诊断。
- 状态使用 `pending`、`running`、`success`、`warning`、`failed`、`skipped`；耗时不可预测的外部安装器显示 spinner，不把命令输出逐行刷到面板。
- 支持 `Enter` 确认、方向键选择 profile、`r` 重试失败步骤、`d` 展开最近诊断、`q` 在安全边界退出；命令行参数可完全替代交互。
- 使用 Node 内置 `readline`、`process.stdout.isTTY` 和 ANSI 光标控制，不引入 `ora`、`ink`、Electron、WebSocket 或本地浏览器服务。当前仓库已有 `tools/lab/terminal.mjs` 的颜色、TTY 和纯文本经验可复用。
- `--ui auto|tui|plain` 控制显示模式：`auto` 在 TTY 使用 TUI，其他情况使用 plain；`--non-interactive`、`--json` 和输出重定向强制 plain；`--no-ui` 是 `--ui plain` 的别名。
- TUI 不保存控制字符到日志。日志保存完整命令输出，终端只显示截断摘要和日志路径；密码、token 和用户环境中的敏感值不得写入日志。

不采用浏览器 UI 作为首版：浏览器方案虽然视觉更丰富，但在 Node 安装前无法出现，并会引入端口占用、默认浏览器、SSH/无桌面环境、进程退出和额外 CSP/安全处理；这些不直接增加安装成功率。

## 4. 平台实现

### 4.1 macOS

- 检查 macOS 主版本、`uname -m` 和 Xcode Command Line Tools。缺少 CLT 时调用 `xcode-select --install`，明确返回“需要完成系统弹窗后重新运行”的可识别状态，不假装已经安装完成。
- 优先使用 Homebrew 安装/复用 Node、`full` 所需 CMake 和可选 VS Code；Homebrew 安装本身使用官方安装入口，并把对应 `brew shellenv` 以幂等方式加入 `~/.zprofile`，同时刷新当前进程。
- 不为自动化路径硬编码 ARM/Intel 下载文件名；Homebrew 负责架构选择。没有 Homebrew 或用户拒绝安装时，输出教程中的官方图形安装 fallback。
- pnpm 准备顺序为：已有且版本正确 → 可用 Corepack → `npm install --global pnpm@11.1.1` → 用户可写的本地 prefix。Node v26 没有 Corepack 时仍必须成功落到最后两个路径之一。
- 可选安装 VS Code 后，按扩展 ID 安装 `ms-vscode.cpptools`；`full` 再安装 `ms-vscode.cmake-tools`。扩展安装失败只标记为可选失败，不影响核心工具链结果。

### 4.2 Windows

- 优先使用 `winget` 安装 Git、Node LTS、Kitware CMake（仅 `full`）、VS Code 和 Visual Studio Build Tools。
- Visual Studio Build Tools 使用官方 C++ workload/component，而不是依赖教程中的动态 `cl.exe` 路径。安装完成后使用 `vswhere.exe` 查找满足 `Microsoft.VisualStudio.Component.VC.Tools.x86.x64` 的实例。
- `toolchain.mjs` 调用该实例的 `Common7\Tools\VsDevCmd.bat -arch=x64`，在子进程中捕获 `set` 环境并解析为 `env` 对象。`doctor`、MSVC 编译、Project CMake configure/build/CTest 都把该环境传给子进程。
- 这样普通 PowerShell、VS Code 集成终端和 CI 不需要用户手工修改 PATH，也不依赖 `VS\18\...\14.x` 这类随版本变化的路径。需要直接执行 `cl` 的高级用户仍可打开 Developer PowerShell。
- 安装后刷新当前 PowerShell 的用户/机器 PATH；如果 winget/Visual Studio 安装要求重启，则返回“需重启/新终端”的状态，并让重跑保持幂等。
- 无 `winget` 时不执行来源不明的远程脚本：报告缺少 Windows Package Manager，并链接现有手工指南作为 fallback；后续可单独增加官方安装器 fallback，但不把它混入首版核心流程。

## 5. Windows MSVC 环境合同

`toolchain.mjs` 提供类似下列内部结果：

```js
{
  family: "msvc",
  command: "cl",
  env: { PATH, INCLUDE, LIB, LIBPATH, ... },
  installationPath: "...",
  developerCommand: "...\\VsDevCmd.bat",
}
```

调用约定：

- `doctor` 使用 `env` 探测 `cl`，并在报告中注明 MSVC 实例/版本。
- `compiler.mjs` 用同一 `env` 编译，不改变 `CXX` 优先级；显式 `CXX` 仍是用户覆盖项。
- `project.mjs` 对 CMake configure、build 和 CTest 复用同一 `env`。
- `runProcess` 合并 `process.env` 与调用方 `env`，不修改父进程环境，不写用户 profile。
- MSVC 找不到时，错误信息同时包含“未找到满足条件的 VS 实例”和 `vswhere`/Developer PowerShell 建议。

## 6. 可观察性与失败恢复

每次运行生成一个用户目录日志，不把日志或缓存写进仓库：

- macOS：`~/Library/Logs/DSA-Mastery/setup/`
- Windows：`%LOCALAPPDATA%\DSA-Mastery\setup\`

终端输出使用阶段标签：`preflight`、`toolchain`、`repository`、`dependencies`、`ide`、`smoke`。每阶段输出“已存在/已安装/跳过/失败/需要用户操作”，最后输出汇总表和日志路径。

建议退出码：

| 退出码 | 含义 |
| ---: | --- |
| 0 | profile 全部必需项完成，核心验证通过 |
| 10 | 平台或包管理器不受支持 |
| 11 | 权限/安装器失败 |
| 12 | 需要系统弹窗、重启或新终端后重跑 |
| 13 | 仓库或依赖安装失败 |
| 14 | 环境检查未通过 |
| 15 | smoke test 未通过 |

可选 VS Code/扩展失败不单独提升为核心失败，但最终结果必须明确显示。

## 7. 安全、兼容性与回滚

- 原生脚本不通过 `curl | bash` 或 `irm | iex` 直接执行用户不可见内容；文档使用可下载、可审阅的脚本文件。Homebrew 官方安装器是唯一明确的远程脚本例外，并在执行前显示来源。
- 系统工具只通过 Homebrew、winget 或官方安装器来源获取；不把二进制、SDK、token、用户密码写入仓库或日志。
- `--check-only` 严格只读：不安装包、不 clone/pull、不写 PATH、不创建日志或其他文件，只把检查结果输出到终端；普通安装失败时才写入用户日志目录。
- 安装器不删除工具、不降级用户现有版本、不修改未提交文件；仓库更新只允许 `--update-repo` 或交互确认。
- 若安装中途失败，下一次运行重新探测各阶段并跳过已完成项；不需要 rollback 系统包。仓库依赖失败只清晰报告 `pnpm install` 输出，不删除 `node_modules`。

## 8. 设计取舍

- 采用两个原生薄启动器而不是单个跨平台脚本：PowerShell 与 POSIX 的权限、PATH、包管理器和重启行为差异太大；共享 Node 协调器避免业务逻辑分叉。
- 采用 `full/basic` profile 而不是单一默认安装：CMake 只服务 Project，避免 Program 学习者承担不必要安装成本，同时允许一次完成完整课程环境。
- 采用运行时 MSVC 环境导入而不是永久写 PATH：VS 版本路径动态、SDK 变量很多，导入方式更接近 CI 且不会污染用户系统。
- 采用 smoke test 而不是只看版本号：版本存在不等于能编译、CMake 能 configure 或 Lab 能跑。

## 9. Deferred items

- 无 `winget` 的 Windows 官方安装器 fallback；首版明确转人工指南。
- 完全离线安装包、预下载缓存和公司/学校代理自动配置。
- VS Code 用户级终端 profile 自动写入；首版由 Lab CLI 自动导入 MSVC 环境，避免修改用户配置。
