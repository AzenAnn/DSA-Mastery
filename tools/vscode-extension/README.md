# DSA Mastery Labs · VSCode 扩展

在 VSCode 中浏览、作答与提交 DSA Mastery 的 C++ 代码题，替代 `pnpm lab:run -- <路径>` 这类终端命令。

## 能做什么

- **题目列表**：侧边栏按章节列出全部 71 道 program lab，显示通过状态与最好成绩。
- **题面板**：题目描述、约束、图片与公式，以及全部公开测试用例的输入与期望输出。
- **一键提交**：编译、运行全部用例、显示逐用例结果与首处差异，失败时可并排查看完整输出。
- **提交历史**：保存每一次提交的源码快照，可回看任意一次的答案，或与当前代码对比。
- **环境检测**：缺少编译器时给出具体缺什么，并链接到对应平台的安装指南。

## 范围

当前版本只覆盖 **program 类型**（71 道传统 OJ 代码题）。

- **Quiz（38 道）** 的作答与判分在网页组件中完成，没有命令行执行路径，请在[在线课程](https://azenann.github.io/DSA-Mastery/labs/)中作答。
- **Project（4 道）** 包含人工评审 task，自动判分无法决定是否完成，暂不纳入。
- **交互式运行**（手工输入输出）请继续使用 `pnpm lab:interactive`，它需要真实终端。

## 开发

前置：Node >= 22.13、pnpm。

```bash
cd tools/vscode-extension
pnpm install --ignore-workspace
pnpm run compile
```

本扩展是**独立 package**，不加入仓库的 pnpm workspace，因此不会影响根目录的 `pnpm install`、`pnpm test`、`pnpm lint` 或 `pnpm typecheck`。

调试必须**把 `tools/vscode-extension/` 作为工作区根目录打开**，然后按 <kbd>F5</kbd>：

```bash
code tools/vscode-extension
```

仓库自带的 `.vscode/launch.json` 会先编译、再启动扩展开发宿主，并自动在新窗口中打开仓库根目录，侧边栏随即出现 DSA Mastery 图标。

> 如果在仓库根目录按 <kbd>F5</kbd>，VSCode 找不到扩展的调试配置，会转而让 C/C++ 插件编译当前打开的 `.cpp` 文件，并生成一份空的 `configurations: []`。那不是扩展启动失败，只是打开的目录不对。

开发期间可用 `pnpm run watch` 持续编译，或在 VSCode 中运行 `watch` 任务。

## 打包与安装

```bash
pnpm add -g @vscode/vsce   # 首次
cd tools/vscode-extension
pnpm run compile
pnpm run package           # 生成 dsa-mastery-labs-0.1.0.vsix
```

安装生成的 `.vsix`：

```bash
code --install-extension dsa-mastery-labs-0.1.0.vsix
```

也可以在 VSCode 中打开扩展面板 → 右上角 `...` → 「从 VSIX 安装」。

## 工作原理

扩展不重新实现判题逻辑，而是调用仓库已有的判题内核：

```
node tools/lab/cli.mjs score <lab路径> --json
```

`tools/lab/` 零第三方依赖，只需一个 Node 运行时，因此**学习者不必先执行 `pnpm install` 就能判题**。若 PATH 中没有 `node`，扩展会回退到 VSCode 内置的 Node（`ELECTRON_RUN_AS_NODE=1`）。

扩展校验报告的 `reportVersion`；判题内核升级后若报告格式变化，会提示更新扩展而不是静默出错。

## 做题进度存在哪里

| 内容 | 位置 |
| --- | --- |
| 通过状态、最好成绩、提交元数据 | VSCode `globalState` |
| 每次提交的源码快照 | 扩展的 `globalStorage` 目录 |

两者都在 VSCode 用户数据目录中，**不进仓库**，也不会被 `pnpm lab:clean` 删除（后者只清理各 lab 的 `.lab-cache/`）。换电脑或重装 VSCode 后进度不会带过去。

几条重要行为：

- **状态只在点击提交时更新。** 在编辑器里改代码不会改变任何进度显示。
- **通过一次即永久通过。** 之后提交更低分数不会撤销绿勾，最好成绩也不会回退；面板会同时显示最近一次提交的结果。
- **提交历史默认每题保留 50 条**，可用 `dsaMastery.historyLimit` 调整；超出后自动删除最旧的快照。

「重置全部做题进度」会清空状态与全部源码快照，且无法撤销。

## 配置项

| 配置 | 默认 | 说明 |
| --- | --- | --- |
| `dsaMastery.historyLimit` | `50` | 每题保留的提交历史条数 |
| `dsaMastery.nodePath` | 空 | 判题使用的 Node 路径；留空则自动探测 |

## 题解不会出现在题目面板中

67 道题的 README 里带有 `## 题解` 小节（含完整参考代码）。扩展在渲染题面时会整段移除该小节，因此做题过程中不会看到答案。需要查看题解时请前往网站对应页面。
