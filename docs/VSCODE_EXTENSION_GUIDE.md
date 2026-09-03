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

::: tip 找不到 node 也能判题
插件优先使用 PATH 里的 `node`；如果没有，会回退到 VSCode 自带的 Node 运行时。所以只装了 VSCode 的机器同样可以提交。
:::

### 安装步骤

插件尚未发布到 Marketplace，从 GitHub Releases 下载构建好的 `.vsix` 即可，**不需要在本地装依赖或跑构建**。

1. 打开 [Releases 页面](https://github.com/AzenAnn/DSA-Mastery/releases)，找最新的 `ext-v*`（标着「测试版」）
2. 下载 `dsa-mastery-labs-<版本>.vsix`
3. VSCode → 扩展面板 → 右上角 `...` → **从 VSIX 安装**，选中刚下载的文件

命令行安装也可以：

```bash
code --install-extension ~/Downloads/dsa-mastery-labs-0.1.12.vsix
```

::: details 从源码构建（一般不需要）
只有在要改插件、或者想装还没发版的改动时才需要这条路。前置：Node ≥ 22.13、pnpm。

```bash
cd DSA-Mastery/tools/vscode-extension
pnpm install --ignore-workspace
node build.mjs
pnpm dlx @vscode/vsce package --no-dependencies --allow-missing-repository
code --install-extension dsa-mastery-labs-0.1.12.vsix
```

`pnpm install` 会因为没批准 esbuild 的 postinstall 而报一句 `ERR_PNPM_IGNORED_BUILDS`，可以忽略 —— esbuild 的可执行文件来自平台专属依赖，不跑那个脚本也能用。
:::

也可以在 VSCode 里操作：扩展面板 → 右上角 `...` → **从 VSIX 安装**。

::: warning 安装后需要重启
VSCode 不会热加载新装的插件。装完请完全退出再打开。
:::

### 确认装好了

重启后打开 DSA Mastery 仓库根目录，活动栏（最左侧竖条）应出现 **DSA Mastery** 图标，点开后会按章节列出仓库中的全部 Program、Project 和 Quiz Lab。

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

Program Lab 是标准输入输出判题，不是 LeetCode 那种「只写一个类」。你的文件必须是**能独立运行的完整程序**：

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
如果照搬 LeetCode 的写法、只留一个 `class Solution`，编译会报 `Undefined symbols: _main` —— 链接器找不到程序入口。必须自己写 `main` 读输入、调用算法、打印结果。
:::

::: property 输出约定 · stdout 参与判题
`stdout` 会与 `.out` 逐 token 比较。调试信息请写 `cerr`，写进 `cout` 的任何多余内容都会导致 `WA`。
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

### 三条关键行为

**状态只在点击提交时更新。** 在编辑器里改代码、保存、甚至改坏，进度显示都不会变。只有提交才会写入。

**通过一次即永久通过。** 拿到绿勾后即使再提交更低分数，绿勾和最好成绩都保留。结果区会说明「本题此前已通过（最好成绩 X/Y），通过记录保留」，同时显示本次的真实判定。这与传统 OJ 的心智模型一致。

**每次提交都保存了当时的答案。** 右键题目 → 提交历史，可以列出全部提交记录，打开任意一次的源码，或与当前代码做 diff。默认每题保留最近 50 次，可用 `dsaMastery.historyLimit` 调整。

### 进度存在哪里

| 内容 | 位置 |
| --- | --- |
| 通过状态、最好成绩、提交元数据 | VSCode `globalState` |
| Project 最近一次自动判题摘要 | 独立的 `dsaMastery.projectProgress.v1` |
| 每次提交的源码快照 | 插件的 `globalStorage` 目录 |

这些状态都在 VSCode 的用户数据目录里，**不进仓库**，也不会被 `pnpm lab:clean` 删除（那条命令只清理各 Lab 的 `.lab-cache/`）。

插件使用 `01E04` 这样的稳定 Lab ID 保存进度，而不是依赖目录名。升级到采用稳定 ID 的版本时，插件会先备份旧状态，再自动迁移代码题、选择题和做题统计；既有源码快照仍能从提交历史打开，不需要手工重做题目。

::: warning 进度不跨设备
换电脑或重装 VSCode 后进度不会带过去。「重置全部做题进度」会清空状态和所有源码快照，无法撤销。
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
| 公式显示成源码 | 极少见，通常是资源加载失败 | 重装插件 |

## 与终端命令的关系

插件**不重新实现判题**。它调用的是仓库里同一个内核：

```
node tools/lab/cli.mjs score <lab-path> --json
```

所以插件里的判定结果和 `pnpm lab:score` 完全一致 —— 同一份 manifest、同一套编译器选择、同一批测试用例、同一个计分规则。插件只是换了一层界面。

这也意味着两者可以混用：在插件里做题，需要交互式调试时切回终端，不会有任何状态冲突（插件的进度记录独立于判题内核，内核本身是无状态的）。
