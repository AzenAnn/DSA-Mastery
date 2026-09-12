# DSA Mastery Labs · VSCode 扩展

在 VSCode 中浏览、作答与提交 DSA Mastery 的 Program Lab、Project Lab 和四选一 Quiz Lab。代码题与项目题继续调用仓库判题内核，选择题在插件内本地判定。

> **使用说明请看站内文档**：[VSCode 插件安装与使用指南](https://azenann.github.io/DSA-Mastery/learn/chapter-preface/06-vscode-extension-guide/)。
> 本文件只面向要改这个扩展的人。

## 架构

扩展**不重新实现判题**。它 spawn 仓库已有的内核并消费 JSON 报告：

```
node tools/lab/cli.mjs score <lab-path> --json
```

`tools/lab/` 零第三方依赖，学习者不必先 `pnpm install` 就能判题。未配置 nodePath 时依次探测 PATH 与 VS Code 内置运行时，只有版本达到 Node 22.13+ 才使用；内置运行时通过 `ELECTRON_RUN_AS_NODE=1` 启动。显式配置失效时报错，执行前要求工作区受信任。

### 模块职责

| 文件 | 职责 |
| --- | --- |
| `extension.ts` | 激活入口、命令注册、依赖装配 |
| `labIndex.ts` | 扫描 `labs/chapter-*/{theory,exercise,project}/`，读取 `lab.json`、task manifest 与 README frontmatter，收录 `program`、`quiz`、`project`；迁移期兼容旧平铺目录 |
| `cli.ts` | 判题内核适配层：spawn、解析 JSON、校验 `reportVersion`、Program/Project 结果类型与 Node 回退 |
| `progress.ts` | 做题进度：Program/Quiz 旧状态、Project 独立摘要、`globalStorage` 源码快照 |
| `tree.ts` | 侧边栏 TreeDataProvider（章节 → 题目） |
| `panel.ts` | 题目面板 webview 的生命周期、学生文件保存与提交流程 |
| `panelHtml.ts` | 面板 HTML 渲染（题面外壳、task/case/CTest 层级、结果表） |
| `statsPanel.ts` / `statsView.ts` | 做题统计宿主与纯 HTML/SVG 渲染：Rank、四项计数、活动热图、累计通过趋势和章节进度 |
| `rank.ts` | 基于不同已解决题目数的八级 Rank 及等级内进度 |
| `markdown.ts` | README 渲染：切除题解、重写图片 URI、KaTeX |
| `doctor.ts` | 环境检测与平台化安装指引 |

### 几个容易踩的约束

**题解必须切掉。** 部分 program Lab 的 README 有 `## 题解` 小节，含完整参考代码。`markdown.ts` 的 `stripSections()` 负责移除。改动那里之后务必验证所有可作答 Lab 无泄露 —— 不只检查标题消失，还要拿题解段内的代码行去结果里反查。

**通知不能 await。** `vscode.window.showXxxMessage()` 要等用户点击或通知自动消失才 resolve。如果在提交流程里 `await` 它，`submitting` 锁会迟迟不释放，第二次点提交就没反应。只有真正需要用户答复的对话框（比如环境检测的「打开指南 / 忽略」）才该 await。

**历史与当前有效状态分开。** Program 保留曾经通过的历史；Project 通过 CLI 的 `project-status` 获取指纹与当前结果，源码、测试、配置或未保存改动会使相关结果失效，历史摘要保留。仅当前自动结果全通过且无 manual 时完成。

**Rank 只使用去重后的解决题数。** 统计页沿用事件日志中的不同通过 Lab 数计算 Rank；重复提交或重复通过同一题不会晋级。累计通过趋势仍按事件次数计数，章节完成度仍读取各题型的现有当前状态。统计页通过原有查看命令刷新，年份和指标选择保留在 WebView 本地状态中。

**进度主键只能用 `labId`。** `name` 是当前目录名，只用于资源定位和旧版本迁移。首次读取新版题库时，扩展会把旧目录键、Quiz 键和活动记录迁移到稳定 ID，并在迁移前保留 `globalState` 备份；历史快照继续按记录中的 `snapshot` 路径读取，不批量搬动用户文件。

**webview 资源必须走 `media/`。** KaTeX 的 CSS 与字体已复制到 `media/katex/`，因为打包后 `node_modules` 不存在。`localResourceRoots` 也只声明 `labs/` 和 `media/`。

## 开发

前置：Node ≥ 22.13、pnpm。

```bash
cd tools/vscode-extension
pnpm install --frozen-lockfile
pnpm run build
```

| 脚本 | 作用 |
| --- | --- |
| `build` | esbuild 打包到 `dist/extension.js` |
| `watch` | 同上，监听模式 |
| `typecheck` | `tsc --noEmit` |
| `package` | 打包 + 生成 `.vsix` |

### 调试

必须**把 `tools/vscode-extension/` 作为工作区根目录打开**，再按 <kbd>F5</kbd>：

```bash
code tools/vscode-extension
```

自带的 `.vscode/launch.json` 先运行 `build.mjs` 生成实际加载的 `dist/extension.js`，再以 `.lab-cache/debug-user-data` 和 `.lab-cache/debug-extensions` 启动隔离开发宿主，自动打开仓库根目录。Windows 可使用 `pnpm.cmd` 避开 `.ps1` shim 策略限制。

在仓库根目录按 F5 是不行的 —— 那里没有扩展的调试配置，VSCode 会转而让 C/C++ 插件编译当前打开的 `.cpp` 文件，并生成一份空的 `configurations: []`。那不是扩展启动失败，只是打开的目录不对。

### 打包与安装

```powershell
pnpm.cmd run package
if ($LASTEXITCODE -ne 0) { throw '打包失败' }
$version = (Get-Content package.json -Raw | ConvertFrom-Json).version
$vsix = (Get-Item -LiteralPath "dsa-mastery-labs-$version.vsix").FullName
& '..\..\scripts\bootstrap\install-extension.ps1' -VsixPath $vsix -CheckOnly
```

实际安装、macOS 命令、隔离目录、更新和回退见唯一的[安装指南](https://azenann.github.io/DSA-Mastery/learn/chapter-preface/06-vscode-extension-guide/)。按提示重载窗口，保留同一用户数据目录和扩展 ID 即保留历史。依赖安装失败不能忽略；受控 `pnpm-workspace.yaml` 批准 esbuild，显式禁用本地无签名打包不需要的 keytar/vsce-sign 安装脚本；vsce 固定在开发依赖与锁文件中。

::: 关于依赖打包
`vsce` 无法解析 pnpm 的符号链接依赖树（会报一堆 `npm error missing:`），所以用 esbuild 把 `gray-matter`、`markdown-it`、`katex` 全打进单文件，`.vsix` 里不含 `node_modules`。当前包体积约 900 KB。

仓库尚未指定开源许可，扩展沿用此状态，标记 `UNLICENSED`，打包显式使用 `--skip-license`；该选项不会授予新的使用许可。
:::

## 工程隔离

独立 package，不加入仓库的 pnpm workspace。根目录的 `pnpm install`、`pnpm test`、`pnpm lint`、`pnpm typecheck` 与 CI 都不受影响。

`dist/`、`node_modules/`、`*.vsix` 均不进版本控制。站点构建通过 `.vitepress/config.ts` 的 `srcExclude: ["tools/**"]` 排除本目录，所以这份 README 不会变成网页。

### Project Lab 的实现边界

Project 面板先展示当前状态表，再提供 Task 导航、题面、公共接口、学生文件和逐项诊断。提交时保存本 Project 内相关 dirty 输入并检查保存结果，再调用 `score <project-path> [--task id] --json`。固定提交题目身份；插件与 CLI 锁共同保护并发，评分后重新读取指纹和未保存状态。

`manual` task 固定显示为 `PENDING`，自动部分满分时状态是“自动通过 · 待人工”，不是最终完成。Project 目前只保存最近一次自动判题摘要，不生成多文件提交历史和逐文件 diff；Program 的提交历史保持原行为。

## 版本耦合

扩展校验判题报告的 `reportVersion`，当前支持 `1`。如果 `tools/lab/cli.mjs` 的报告格式变了，扩展会提示需要升级而不是静默出错。改动内核的报告结构时，记得同步 `cli.ts` 里的 `SUPPORTED_REPORT_VERSION` 和相关类型。
