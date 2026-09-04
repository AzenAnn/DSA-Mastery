# 原生自举安装器规范

## 1. Scope / Trigger

适用于 `scripts/bootstrap/**`、`tools/lab/toolchain.mjs`、安装器相关文档和 setup 测试的新增或修改。该规范约束学生端 macOS/Windows 原生入口、共享 Node 协调器、basic/full profile、MSVC 环境注入和只读检查边界。

## 2. Signatures

稳定入口：

```text
./scripts/bootstrap/bootstrap-macos.sh [--profile basic|full] [--repo-dir <path>] [--check-only]
./scripts/bootstrap/bootstrap-windows.ps1 [-Profile basic|full] [-RepoDir <path>] [-CheckOnly]
node scripts/bootstrap/setup.mjs [--profile basic|full] [--check-only] [--repo-dir <path>]
```

协调器选项还包括 `--repo-url`、`--update-repo`、`--skip-vscode`、`--install-vscode`、`--ui auto|tui|plain`、`--no-ui`、`--non-interactive` 和 `--json`。版本事实只允许来自 `tools/lab/requirements.mjs`；`scripts/bootstrap/requirements.mjs` 仅作自举入口的薄封装。

## 3. Contracts

- `basic` 必须满足 Git、Node `>=22.13.0`、pnpm `11.1.1` 和 GCC `>=11`、Clang `>=14` 或 MSVC `>=19.30` 之一；不要求 CMake。
- `full` 包含 `basic`，并额外要求 CMake `>=3.25`；GNU Make `>=4.0` 始终可选，不得阻塞 pnpm/Node CLI。
- 启动器在没有 Node 时只能做原生前置探测/安装；Node 可用后转交共享 `setup.mjs`。不得复制一套平台专属 Node 协调逻辑。
- 已有有效仓库可复用；更新只能由显式 `--update-repo` 或交互确认触发。发现 dirty worktree 时拒绝 pull/覆盖；非空且无效目录也拒绝覆盖。
- 安装依赖固定执行 `pnpm install --frozen-lockfile`，不得生成或提交 `package-lock.json`。
- `--check-only` 只读：不得安装工具、写 PATH、clone/pull、安装依赖/IDE、运行 smoke 或写 setup 日志。
- VS Code 与扩展属于可选 IDE 层；扩展失败只能产生 warning，不能掩盖核心环境失败。
- Windows 不得把动态版本目录中的 `cl.exe` 永久写入 PATH。`toolchain.mjs` 必须通过 `vswhere.exe` 找到含 `Microsoft.VisualStudio.Component.VC.Tools.x86.x64` 的实例，再调用 `VsDevCmd.bat -arch=x64`，将 `PATH`、`INCLUDE`、`LIB` 等环境只注入当前子进程链。
- MSVC 环境必须同时传给 doctor、直接编译、CMake configure/build 和 CTest；`runProcess` 合并环境但不修改父进程或用户 profile。
- TTY 使用轻量 TUI；非 TTY、`--no-ui`、`--non-interactive`、`--json` 或 `TERM=dumb` 使用纯文本。JSON 顶层包含 `reportVersion: 1`，且不得出现 ANSI 控制码。
- 退出码固定为 `0` 成功、`10` 不支持平台/包管理器、`11` 安装器失败、`12` 需要用户操作或重启、`13` 仓库失败、`14` 环境不满足、`15` smoke 失败；参数错误使用 `2`。

## 4. Validation & Error Matrix

| 条件 | 行为 |
| --- | --- |
| profile/UI/选项未知或冲突 | `ARGUMENT_INVALID`，退出 `2` |
| 缺少必要工具且为 `--check-only` | 只报告缺项，退出 `14`，不安装 |
| macOS 缺少 CLT | 调用 `xcode-select --install` 后报告需完成系统弹窗并重跑，退出 `12` |
| Windows 缺少 winget | 停止自动安装并指向 Windows 手工指南，退出 `10` |
| Windows 找不到满足组件的 VS | 报告 `vswhere`/Developer PowerShell 恢复建议，退出 `14` 或安装失败码 |
| 仓库 dirty 且请求更新 | `REPOSITORY_DIRTY`，退出 `13`，不 pull |
| 依赖安装失败 | 保留完整命令输出到用户日志，退出 `11` |
| Program/Project smoke 失败 | `SMOKE_FAILED`，退出 `15` |
| 普通安装失败 | 写入用户日志目录；check-only 失败不得创建日志 |

## 5. Good / Base / Bad Cases

- Good：用户下载并审阅平台脚本，运行 `--profile basic`；已有 pnpm/仓库被复用，依赖冻结安装后 Program reference smoke 通过。
- Good：Windows 普通 PowerShell 没有动态 `cl.exe` PATH，但 `vswhere` + `VsDevCmd.bat` 导入环境后，doctor、编译和 Project CMake 使用同一环境。
- Good：Node 测试用 `mkdtemp(path.join(os.tmpdir(), "dsa-bootstrap-"))` 建临时目录，并用 `path.resolve()` 规范化仓库路径后再断言；同一测试可在 Windows、Linux 与 macOS 运行。
- Base：`full --check-only` 在没有 CMake 的主机上返回 `14`，输出缺项和下一步，且不改变工作树。
- Bad：使用 `curl | bash`、`irm | iex`，静默 pull dirty worktree，强制安装 GNU Make，把 VS 的 `14.x` 目录永久写入用户 PATH，或在跨平台测试中硬编码 `/tmp` 与未规范化的 POSIX 路径。

## 6. Tests Required

- 版本/profile/参数单测：断言 `basic` 与 `full` 的差异、固定 pnpm、未知选项和 UI 冲突退出行为。
- UI 单测：断言阶段状态、进度、窄终端截断、ANSI 清理、非 TTY fallback 和 JSON 无 ANSI。
- 命令/仓库单测：断言空格路径、`shell:false`、dirty worktree 保护、check-only 不调用安装/clone/pull，以及学生包脱离源仓库运行。
- 测试临时目录必须来自 `os.tmpdir()`，再由 `mkdtemp(path.join(...))` 创建；仓库和命令参数路径断言使用 `path.resolve()` 或等价规范化结果，不得硬编码 `/tmp`、驱动器号或路径分隔符。
- MSVC fake runner 单测：断言 `vswhere` 查询参数、环境块中含 `=` 的值、路径空格、`VsDevCmd` 环境复用和找不到实例的恢复信息。
- 项目门禁：运行 `pnpm run validate`、`pnpm run test:bootstrap`、`pnpm run test:lab-tools`、`pnpm run test:lab-docs`、`pnpm run test:discovery`、`pnpm test`；在可用平台 runner 上分别验证原生入口和 Program/Project smoke。

## 7. Wrong vs Correct

### Wrong

```powershell
$env:Path += ";C:\Program Files\Microsoft Visual Studio\18\...\14.x\bin"
cl.exe student\main.cpp
```

该路径随 Visual Studio/工具集变化，且遗漏 `INCLUDE`、`LIB` 等 SDK 环境。

### Correct

```text
vswhere.exe -latest -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64
call <installation>\Common7\Tools\VsDevCmd.bat -arch=x64
cl /std:c++17 ...
```

只把批处理导出的环境传给当前 doctor/编译/CMake/CTest 子进程，不污染用户 PATH。

跨平台测试同样遵循原生路径合同：

```js
const root = await mkdtemp(path.join(os.tmpdir(), "dsa-bootstrap-"));
assert.equal(actualRepoDir, path.resolve(root, "repo"));
```
