# VSCode 插件：在编辑器里做题

DSA Mastery 的 Program/Project Lab 原本要在终端里判分。这个插件把代码题、项目题和选择题都带进 VSCode：左侧列出题目和完成状态，右侧显示题面，代码题和项目题可以提交判题，选择题可以直接作答并查看解析。

::: info 适用范围
插件覆盖 **Program**（代码题）、**Project**（多 task 项目题）和 **Quiz**（四选一选择题）。Project 的人工评审只保留 `PENDING` 占位，不在插件内录入人工分，详见[范围与边界](#范围与边界)。
:::

## 安装

### 前置条件

| 需要什么 | 为什么 | Program | Project | Quiz |
| --- | --- | :---: | :---: | :---: |
| VSCode ≥ 1.90 | 插件用到的 API 下限 | 必需 | 必需 | 必需 |
| Node.js ≥ 22.13 | 运行判题内核 | 必需 | 必需 | — |
| C++ 编译器 | 编译你的答案（GCC ≥ 11、Clang ≥ 14 或 MSVC ≥ 19.30 三选一） | 必需 | 必需 | — |
| CMake ≥ 3.25 | 构建 Project 的 CTest task | — | 必需 | — |

**选择题只要 VSCode 就能做** —— 判定完全在插件内完成，不调用判题内核，也不需要编译器。

代码题缺编译器也可以先装插件：插件会在你第一次提交前检查，并按平台给出安装指引。

::: tip Node 的实际选择顺序
设置了 `dsaMastery.nodePath` 时，只使用并校验该可执行文件；否则先探测 PATH 中的 Node，再尝试 VS Code 内置运行时（`ELECTRON_RUN_AS_NODE=1`）。每个候选都必须达到 **22.13.0**。旧版 VS Code 的内置 Node 可能不满足要求，此时需升级 VS Code 或安装 Node；内置 Node 也不能替代 C++ 编译器和 CMake。终端 CLI、源码打包和网站构建仍需独立 Node，不能假定终端能调用内置运行时。
:::

### 安装步骤

插件尚未发布到 Marketplace，从 GitHub Releases 下载构建好的 `.vsix` 即可，**不需要在本地装依赖或跑构建**。

1. 打开 [Releases 页面](https://github.com/AzenAnn/DSA-Mastery/releases)，找最新的 `ext-v*`（标着「测试版」）
2. 下载 `dsa-mastery-labs-<版本>.vsix`
3. VSCode → 扩展面板 → 右上角 `...` → **从 VSIX 安装**，选中刚下载的文件

发布包下载、源码打包和安装是三步不同的操作。下载现成 VSIX 后直接安装，不需要 pnpm；本地未发布修改则先构建自己的 VSIX。`ext-v*` 可能是 prerelease，GitHub 的 `/releases/latest` 不一定指向扩展版本，应在 Releases 列表中检查标签和资产。

### Windows PowerShell

图形界面的“从 VSIX 安装”是通用入口，即使 `code` 不在 PATH 中也可使用。命令行可在仓库根运行以下辅助脚本。它会检查文件、扩展身份、VS Code 路径、安装退出码和安装后版本，不修改 PATH 或系统执行策略。

```powershell
# 下载最新公开 ext-v* 资产（包括 prerelease），不安装
.\scripts\bootstrap\install-extension.ps1 -ReleaseTag latest -DownloadOnly

# 用上一步打印的完整路径安装；也可指定下载目录中的任意已核验版本
$vsixPath = Read-Host '输入 VSIX 完整路径（不要在输入中加引号）'
.\scripts\bootstrap\install-extension.ps1 -VsixPath $vsixPath
```

指定某次发布时使用 `-ReleaseTag ext-v<版本号>`，版本号从 Releases 页面复制。找不到 `code` 时脚本会检查用户安装和系统安装的常见位置；自定义安装位置可传 `-CodePath 'C:\path with spaces\Microsoft VS Code\bin\code.cmd'`。仅预检用 `-VsixPath $vsixPath -CheckOnly`，不会安装。

直接调用 CLI 时，使用 PowerShell 调用运算符和独立参数：

```powershell
$codeCli = (Get-Command code.cmd -ErrorAction Stop).Source
& $codeCli --install-extension $vsixPath --force
if ($LASTEXITCODE -ne 0) { throw '安装失败，请检查前面的输出' }
& $codeCli --list-extensions --show-versions
```

`code` 不在 PATH 时，将 `$codeCli` 设为实际 `bin\code.cmd` 绝对路径，或改用 GUI。不要把 `*.vsix` 原样传给外部程序；PowerShell 不会替它展开通配符。路径有空格时保留变量参数或引号。

### macOS

在扩展面板选择“从 VSIX 安装”，或在终端运行：

```bash
read -r -p 'VSIX 完整路径: ' vsix_path
test -f "$vsix_path" || { echo 'VSIX 不存在，请检查下载位置'; exit 1; }
code_cli="$(command -v code || true)"
if [ -z "$code_cli" ]; then
  code_cli='/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code'
fi
"$code_cli" --install-extension "$vsix_path" --force || exit 1
"$code_cli" --list-extensions --show-versions
```

以上代码在 **bash** 中运行（macOS 默认 zsh 用户先输入 `bash`）。如果 VS Code 安装在用户 Applications 或自定义目录，把 `code_cli` 改成该应用包内的对应路径。也可通过命令面板运行 `Shell Command: Install 'code' command in PATH` 后新开终端；这不是安装 VSIX 的必要步骤。不使用 `sudo` 安装本扩展。

### 从本地源码打包

仅在开发插件或检查尚未发布的修改时使用。要求 Node 22.13+、仓库固定的 pnpm 11.1.1；VS Code 内置运行时不负责 pnpm 打包。

Windows：在仓库根打开 PowerShell。

```powershell
Push-Location -LiteralPath '.\tools\vscode-extension'
pnpm.cmd install --frozen-lockfile
if ($LASTEXITCODE -ne 0) { throw '依赖安装失败' }
pnpm.cmd run typecheck
if ($LASTEXITCODE -ne 0) { throw '类型检查失败' }
pnpm.cmd run package
if ($LASTEXITCODE -ne 0) { throw 'VSIX 打包失败' }
$version = (Get-Content -LiteralPath package.json -Raw | ConvertFrom-Json).version
$vsixPath = (Get-Item -LiteralPath "dsa-mastery-labs-$version.vsix").FullName
Pop-Location
.\scripts\bootstrap\install-extension.ps1 -VsixPath $vsixPath
```

macOS（仓库根，bash/zsh）：

```bash
(
  set -e
  cd tools/vscode-extension
  pnpm install --frozen-lockfile
  pnpm run typecheck
  pnpm run package
  version="$(node -p "require('./package.json').version")"
  vsix_path="$PWD/dsa-mastery-labs-$version.vsix"
  test -f "$vsix_path"
  code_cli="$(command -v code || true)"
  if [ -z "$code_cli" ]; then
    code_cli='/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code'
  fi
  "$code_cli" --install-extension "$vsix_path" --force
)
```

打包脚本使用锁定的 `@vscode/vsce`，不用全局安装。`pnpm-workspace.yaml` 只批准已声明的 esbuild 构建脚本。出现 `ERR_PNPM_IGNORED_BUILDS` 时不要忽略：确认当前目录、pnpm 版本和仓库审批配置一致；如使用不同依赖版本，先检查被阻止包的脚本，再用 `pnpm approve-builds` 仅批准所需包。不要批准所有未知脚本，也不要用 `|| true` 掩盖安装失败。

### 更新、重载和回退

更新与安装使用同一路径：下载新的明确版本或重新打包，安装该 VSIX，按提示执行 **Developer: Reload Window**。首次安装通常可以直接激活，不要求每次完全退出；重载仍未生效时才关闭相关 VS Code 窗口并重新打开。

安装前后运行 `--list-extensions --show-versions`，核对 `dsa-mastery.dsa-mastery-labs@版本`，并打开同一个 Lab 检查进度。保持同一扩展 ID、同一用户数据目录，正常覆盖安装不会主动清空 Program/Quiz 进度、Project 历史摘要或快照。不要点“重置全部做题进度”，不要删除用户数据目录。

回退时保留旧 VSIX，安装旧文件并加 `--force`，重载后核对版本。跨数据结构升级回退不能假定旧版理解新格式：**更新前先关闭对应实例，备份其用户数据目录**；必要时同时恢复那份备份。不要让新旧版本同时写同一目录。默认用户数据通常在 Windows `%APPDATA%\Code`、macOS `~/Library/Application Support/Code`；便携模式、Profiles 和自定义 `--user-data-dir` 以实际启动配置为准。

### 隔离检查，不影响日常环境

Windows 在仓库根运行，`$vsixPath` 指向刚构建的包：

```powershell
$checkRoot = Join-Path $env:TEMP ('dsa-vsix-check-' + [guid]::NewGuid().ToString('N'))
$userData = Join-Path $checkRoot 'user-data'
$extensions = Join-Path $checkRoot 'extensions'
$codeCommand = Get-Command code.cmd -ErrorAction SilentlyContinue
$codeCli = if ($codeCommand) { $codeCommand.Source } else { Read-Host '输入实际 bin\code.cmd 的完整路径（不要加引号）' }
.\scripts\bootstrap\install-extension.ps1 -VsixPath $vsixPath -CodePath $codeCli -UserDataDir $userData -ExtensionsDir $extensions
if ($LASTEXITCODE -ne 0) { throw '隔离安装失败，请检查上面的输出' }
& $codeCli --user-data-dir $userData --extensions-dir $extensions --new-window (Get-Location).Path
```

macOS（仓库根）：

```bash
check_root="$(mktemp -d "${TMPDIR:-/tmp}/dsa-vsix-check.XXXXXX")"
code_cli="$(command -v code || true)"
if [ -z "$code_cli" ]; then
  code_cli='/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code'
fi
"$code_cli" --user-data-dir "$check_root/user-data" --extensions-dir "$check_root/extensions" --install-extension "$vsix_path" --force &&
  "$code_cli" --user-data-dir "$check_root/user-data" --extensions-dir "$check_root/extensions" --new-window "$PWD"
```

**安装、列举版本、启动、更新和回退，每一步都要携带这两个隔离参数。** GUI 兜底也应在这个隔离窗口里执行。检查时打开表达式 Project `02P04`，进入 Task 题面、打开学生文件、单项测评、查看失败、重新测评。新环境首次打开仓库时，先确认来源，再决定是否信任工作区。

### 确认装好了

安装并按需重载后打开 DSA Mastery 仓库根目录，活动栏应出现 **DSA Mastery** 图标，点开后按章节列出可运行的 Program、Project 和 Quiz Lab。只有 README、没有有效 manifest 的实验不进入插件。

如果图标没出现，在命令面板（<kbd>Cmd/Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>P</kbd>）输入 `DSA`：

- **能看到命令** → 插件已加载，只是活动栏图标被折叠了。右键活动栏，勾选「DSA Mastery」。
- **看不到命令** → 插件没加载。运行 `Developer: Show Running Extensions`，找 `dsa-mastery.dsa-mastery-labs` 看有无报错。

::: pitfall 必须打开仓库根目录
插件靠 `labs/` 和 `tools/lab/cli.mjs` 定位判题内核。只打开某个 Lab 子目录，插件不会激活。
:::

## 做一道题

### 完整流程

打开侧边栏的 DSA Mastery，展开任一章节，点一道题：

1. **题目面板打开**，显示题面；Program 还会显示公开测试用例，Project 会显示 task 图、依赖、权重和学生文件。
2. 点 **打开答题文件**（Project 中也可以在 task 卡片里选择文件），在旁边打开学生文件。
3. 写你的实现。
4. 点 **提交**。插件会先保存文件、检查环境，然后编译并跑自动任务。
5. 结果区按题型展示：Program 是用例表；Project 是 task → case/CTest 的嵌套结果，以及 Automated、Manual pending、Provisional total 汇总。

### 输入输出约定

以具体题面、固定接口和起始代码为准。多数 stdio Program 需要完整程序入口；Project 的库模块通常只实现规定函数，测试驱动或 Final 已提供 `main`。不要给每个模块另写一个 main。对于要求完整程序的 Program，结构例如：

```cpp
#include <iostream>
#include <vector>
using namespace std;

int main() {
    int n;
    cin >> n;                    // 按 README 的输入格式读
    vector<int> a(n);
    for (int i = 0; i < n; i++) cin >> a[i];

    cout << solve(a) << endl;    // 结果打到 stdout
    return 0;
}
```

::: pitfall 只写 Solution 类会链接失败
当题目要求完整 stdio 程序、又未提供驱动时，只留 `class Solution` 会导致找不到入口；补全 main 读输入、调用算法、打印结果。Project 库目标没有 main 是正常的，先核对构建目标。
:::

::: property 输出约定 · stdout 参与判题
stdio 的 `stdout` 按 manifest 指定的 `exact`、`tokens` 或 `float` 与 `.out` 比较；CTest 按命名测试执行。调试信息写 `cerr`，不要混入规定输出。
:::

### 看懂判定结果

| 判定 | 含义 | 先查什么 |
| --- | --- | --- |
| `AC` | 通过 | 这个用例没问题 |
| `WA` | 输出不符 | 结果表里的首处差异、空格与换行、边界情况 |
| `TLE` | 超时 | 死循环、复杂度、输入是否在推进 |
| `RE` | 运行错误 | 越界、空指针、异常退出 |
| `CE` | 编译错误 | 结果区会显示完整编译诊断 |
| `OLE` | 输出超限 | 无限打印，或调试输出忘了删 |
| `IE` | 评测内部错误 | 不是你的问题，是配置或工具出错 |
| `BLOCKED` | 依赖模块构建失败 | 构建证据中的依赖 Task、目标、文件和阶段 |
| `UNASSESSED` | 尚未测评 | 运行对应 Task |
| `STALE` | 当前输入变化，需要重测 | 重测受影响 Task；历史分不代表当前代码 |

WA 时通知栏会给一个**并排查看完整输出**按钮 —— 点它会用 VSCode 原生 diff 打开「实际输出 ↔ 期望输出」，比只看首处差异更容易定位。

## 完成状态怎么算

### 选择题

选择题在题目面板中逐题选择并提交。提交后会显示对错、正确答案和解析，可以点击“重新作答”。插件会保存每题最近一次答案、答题次数和当前得分；全部题目至少答对一次后显示为“已完成”，之后再次答错也不会取消完成状态。

### 状态图标

代码题（Program）：

| 图标 | 含义 |
| --- | --- |
| 绿色实心勾 | 已通过（满分至少一次） |
| 空心圆（带色） | 提交过但未满分，右侧显示最好成绩 |
| 空心圆（灰） | 从未提交 |

选择题（Quiz）：

| 图标 | 含义 |
| --- | --- |
| 绿色实心勾 | 全部小题答对 |
| 问号（带色） | 答过但未全对，右侧显示正确数与已答数 |
| 问号（灰） | 从未作答 |

选择题在未完成时始终是问号，只用颜色区分有没有动过 —— 这样一眼就能和代码题分开。

Project 的状态图标使用工具箱形状：自动判题未满时显示带色中间态；自动部分满分但存在 manual task 时显示“自动通过 · 待人工”，不会提前显示最终绿勾。

章节行右侧显示 `已通过/总数`，Program、Project（只有自动部分完成且无待人工时）和 Quiz 一起计入。

### Program 历史与 Project 当前状态

**Program 的历史成绩在提交时更新。** Project 则同时显示历史成绩与当前有效结果；源文件、公共接口、测试或构建配置变化后，受影响 Task 会显示需要重测，项目完成标记随当前有效结果变化。

**Program 保留曾经通过的记录。** Project 必须所有自动 Task 当前有效且通过，并且没有 manual 待评，才能算完整完成；旧版没有指纹的 Project 摘要仅作为历史展示。单 Task 自动满分不代表整工程满分。

**Program 提交保存单文件答案快照。** 右键题目查看历史，默认保留 50 次，可用 `dsaMastery.historyLimit` 调整。Project 保留历史测评摘要和 CLI 结果，不提供完整多文件版本系统。

Project 可从任务表单项测评，也可测评整个 Project。插件保存当前工程内的相关 dirty 输入（包含公共头文件和构建配置），不会保存其他 Lab；保存失败时取消。测评期间有未保存或落盘的相关变化时，不会把旧结果当作当前通过。CLI 也会拒绝同工程并发构建/测评，防止终端和插件相互覆盖。

### 进度存在哪里

| 内容 | 位置 |
| --- | --- |
| 通过状态、最好成绩、提交元数据 | VSCode `globalState` |
| Project 最近一次自动判题摘要 | 独立的 `dsaMastery.projectProgress.v1` |
| Project 当前输入指纹、逐 Task 结果与完整诊断 | Project 内 `.lab-cache/project-results-student.json` |
| 每次提交的源码快照 | 插件的 `globalStorage` 目录 |

VS Code 历史状态不进仓库，也不被 `pnpm lab:clean` 删除。CLI 的当前测评缓存位于被 Git 忽略的 `.lab-cache/`，清理后当前代码需要重新测评，VS Code 历史摘要仍保留。

插件使用 `01E04` 这样的稳定 Lab ID 保存进度，而不是依赖目录名。升级到采用稳定 ID 的版本时，插件会先备份旧状态，再自动迁移代码题、选择题和做题统计；既有源码快照仍能从提交历史打开，不需要手工重做题目。

::: warning 进度不跨设备
进度不会通过本项目自动跨设备同步。换机器或删除用户数据后，需从自己的备份恢复；单纯更新/重装应用且保留用户数据并不等于清空进度。「重置全部做题进度」会删除状态和快照，并清除 Project 当前测评记录。
:::

## 命令与配置

### 命令

命令面板里全部以 `DSA Mastery:` 开头。

| 命令 | 作用 |
| --- | --- |
| 提交当前题目 | 编译并评分，等同于面板上的提交按钮 |
| 刷新题目列表 | 重新扫描 `labs/`，新增题目后用 |
| 查看提交历史 | Program 列出某题的全部提交，可打开或对比；Project 暂不支持多文件历史 |
| 检查实验环境 | 手动运行环境检测，显示可用编译器 |
| 重置全部做题进度 | 清空状态与快照，需二次确认 |

### 配置项

| 配置 | 默认 | 说明 |
| --- | --- | --- |
| `dsaMastery.historyLimit` | `50` | 每题保留的提交历史条数 |
| `dsaMastery.nodePath` | 空 | 判题使用的 Node 路径；留空则自动探测 |

## 范围与边界

### 支持的类型

| 类型 | 插件里 |
| --- | --- |
| Program | 完整支持 |
| Quiz | 支持四选一单项选择、解析和本地进度 |
| Project | 支持展示、stdio/CTest 自动判题和 manual `PENDING`；不录入人工分、不提供多文件历史 |

### 插件不做的事

- **交互式运行**（手工输入输出）需要真实终端，请继续用 `pnpm lab:interactive`。
- **Project 的 manual task** 只展示 checklist 和 `PENDING`，人工评审仍由课程流程完成。
- **Project 多文件历史** 暂未实现；插件只保存最近一次自动结果摘要，不复制多文件源码快照。
- **选择题不接入终端 CLI**。答案在插件内本地判定，网页端与 VSCode 的答题进度目前不互相同步。
- **作者维护命令**（`lab:new`、`lab:verify`、`lab:refresh-expected`、`lab:pack`）不在插件里，它们面向出题者而非学习者。
- **环境问题只能诊断，不能解决**。插件会告诉你缺什么、去哪装，但编译器仍需你自己安装。

### 题解不会出现在题目面板里

部分题目的 README 带有 `## 题解` 小节（含完整参考代码）。插件渲染题面时会整段移除该小节，所以做题过程中不会看到答案。需要查看题解请前往网站对应页面。

## 出问题时

| 现象 | 原因 | 怎么办 |
| --- | --- | --- |
| 活动栏没有图标 | 插件未加载，或图标被折叠 | 见[确认装好了](#确认装好了) |
| 题目列表是空的 | 打开的不是仓库根目录 | 打开含 `labs/` 的目录 |
| 提交后毫无反应 | 上一次的通知还挂着（旧版本问题） | 更新到最新版插件 |
| `Undefined symbols: _main` | 只写了 `Solution` 类，没有 `main` | 见[输入输出约定](#输入输出约定) |
| 提示需要编译器 | 没有可用的 C++ 编译器 | 按提示打开对应平台的安装指南 |
| 报告版本不匹配 | 判题内核升级了，插件没跟上 | 重新构建并安装插件 |
| `code` 不被识别 | CLI 未加入 PATH | Windows 使用辅助脚本的 `-CodePath`；macOS 使用应用包内 code；GUI 安装不需要 PATH |
| VSIX 不存在 | 只下载源码、构建失败或文件名写死 | 先确认资产/打包成功，传完整实际路径；不能把通配符原样交给 code |
| PowerShell 禁止运行脚本 | `.ps1` 执行策略或组织策略 | 先检查 `Get-ExecutionPolicy -List`。仅对已核验脚本必要时使用一次性 `powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\bootstrap\install-extension.ps1 -VsixPath $vsixPath`，不改变持久策略；不能覆盖组织策略 |
| 下载脚本被阻止 | 单文件带有网络来源标记 | 确认来源和内容后，仅对该文件执行 `Unblock-File -LiteralPath '实际脚本路径'`，不要解除整个下载目录；VSIX 可直接走 GUI |
| pnpm.ps1 被策略阻止 | PowerShell 选中了脚本 shim | Windows 使用 `pnpm.cmd`，不为此放宽系统策略 |
| `Access denied` | 所选目录不可写、文件占用或安全软件阻止 | 改用当前用户可写目录，关闭占用文件的隔离实例；不要笼统以管理员启动 VS Code。组织限制需按组织流程处理 |
| Restricted Mode / 工作区未受信任 | VS Code 尚未允许执行工作区代码 | 可先浏览题面；确认仓库源码可信后再信任，不能靠管理员权限或降低执行策略替代 |
| `ERR_PNPM_IGNORED_BUILDS` | 依赖脚本尚未批准 | 核对 pnpm 版本与受控 allowBuilds 配置，审阅后只批准必要脚本；失败必须解决后才能打包 |
| 公式显示成源码 | 极少见，通常是资源加载失败 | 重装插件 |

## 与终端命令的关系

插件**不重新实现判题**。它调用的是仓库里同一个内核：

```
node tools/lab/cli.mjs score <lab-path> --json
```

所以插件里的判定结果和 `pnpm lab:score` 完全一致 —— 同一份 manifest、同一套编译器选择、同一批测试用例、同一个计分规则。插件只是换了一层界面。

Project 的 CLI 维护当前结果缓存，插件读取同一份结构化状态；终端测评后可刷新插件。CLI 的 Project 锁防止同时写构建目录。Program/Quiz 历史仍由插件独立记录。`scripts/bootstrap/` 的环境安装器准备工具链与可选 IDE，不等于已经安装本项目 VSIX；VSIX 安装按本页单独完成。
