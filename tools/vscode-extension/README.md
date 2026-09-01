# DSA Mastery Labs · VSCode 扩展

在 VSCode 中浏览、作答与提交 DSA Mastery 的 Program Lab 和四选一 Quiz Lab。代码题继续调用仓库判题内核，选择题在插件内本地判定。

> **使用说明请看站内文档**：[VSCode 插件安装与使用指南](../../docs/VSCODE_EXTENSION_GUIDE.md)。
> 本文件只面向要改这个扩展的人。

## 架构

扩展**不重新实现判题**。它 spawn 仓库已有的内核并消费 JSON 报告：

```
node tools/lab/cli.mjs score <lab-path> --json
```

`tools/lab/` 零第三方依赖，只需一个 Node 运行时，所以学习者不必先 `pnpm install` 就能判题。找不到 PATH 里的 `node` 时回退到 VSCode 自带的 Electron（`ELECTRON_RUN_AS_NODE=1`）。

### 模块职责

| 文件 | 职责 |
| --- | --- |
| `extension.ts` | 激活入口、命令注册、依赖装配 |
| `labIndex.ts` | 扫描 `labs/chapter-*/{theory,exercise,project}/`，读 `lab.json` 与 README frontmatter，收录 `program` 与 `quiz`；迁移期兼容旧平铺目录 |
| `cli.ts` | 判题内核适配层：spawn、解析 JSON、校验 `reportVersion`、Node 回退 |
| `progress.ts` | 做题进度：`globalState` 索引 + `globalStorage` 源码快照 |
| `tree.ts` | 侧边栏 TreeDataProvider（章节 → 题目） |
| `panel.ts` | 题目面板 webview 的生命周期与提交流程 |
| `panelHtml.ts` | 面板 HTML 渲染（题面外壳、用例区、结果表） |
| `markdown.ts` | README 渲染：切除题解、重写图片 URI、KaTeX |
| `doctor.ts` | 环境检测与平台化安装指引 |

### 几个容易踩的约束

**题解必须切掉。** 部分 program Lab 的 README 有 `## 题解` 小节，含完整参考代码。`markdown.ts` 的 `stripSections()` 负责移除。改动那里之后务必验证所有可作答 Lab 无泄露 —— 不只检查标题消失，还要拿题解段内的代码行去结果里反查。

**通知不能 await。** `vscode.window.showXxxMessage()` 要等用户点击或通知自动消失才 resolve。如果在提交流程里 `await` 它，`submitting` 锁会迟迟不释放，第二次点提交就没反应。只有真正需要用户答复的对话框（比如环境检测的「打开指南 / 忽略」）才该 await。

**状态只在提交时写。** 编辑器改动不触发任何进度更新。`passed` 一旦置位永不回退。

**进度主键只能用 `labId`。** `name` 是当前目录名，只用于资源定位和旧版本迁移。首次读取新版题库时，扩展会把旧目录键、Quiz 键和活动记录迁移到稳定 ID，并在迁移前保留 `globalState` 备份；历史快照继续按记录中的 `snapshot` 路径读取，不批量搬动用户文件。

**webview 资源必须走 `media/`。** KaTeX 的 CSS 与字体已复制到 `media/katex/`，因为打包后 `node_modules` 不存在。`localResourceRoots` 也只声明 `labs/` 和 `media/`。

## 开发

前置：Node ≥ 22.13、pnpm。

```bash
cd tools/vscode-extension
pnpm install --ignore-workspace
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

自带的 `.vscode/launch.json` 会先编译、再启动扩展开发宿主，并自动在新窗口打开仓库根目录。

在仓库根目录按 F5 是不行的 —— 那里没有扩展的调试配置，VSCode 会转而让 C/C++ 插件编译当前打开的 `.cpp` 文件，并生成一份空的 `configurations: []`。那不是扩展启动失败，只是打开的目录不对。

### 打包与安装

```bash
pnpm run package
code --install-extension dsa-mastery-labs-0.1.11.vsix
```

装完需要**完全退出 VSCode 再打开** —— 它不会热加载新装的插件。

::: 关于依赖打包
`vsce` 无法解析 pnpm 的符号链接依赖树（会报一堆 `npm error missing:`），所以用 esbuild 把 `gray-matter`、`markdown-it`、`katex` 全打进单文件，`.vsix` 里不含 `node_modules`。这也让包体积从数十 MB 降到约 420 KB。
:::

## 工程隔离

独立 package，不加入仓库的 pnpm workspace。根目录的 `pnpm install`、`pnpm test`、`pnpm lint`、`pnpm typecheck` 与 CI 都不受影响。

`dist/`、`node_modules/`、`*.vsix` 均不进版本控制。站点构建通过 `.vitepress/config.ts` 的 `srcExclude: ["tools/**"]` 排除本目录，所以这份 README 不会变成网页。

## 版本耦合

扩展校验判题报告的 `reportVersion`，当前支持 `1`。如果 `tools/lab/cli.mjs` 的报告格式变了，扩展会提示需要升级而不是静默出错。改动内核的报告结构时，记得同步 `cli.ts` 里的 `SUPPORTED_REPORT_VERSION` 和相关类型。
