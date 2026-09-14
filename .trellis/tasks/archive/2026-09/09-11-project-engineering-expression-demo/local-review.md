# 本地检查入口

本次修改位于 `feat/project-engineering-expression-demo`。本页记录首次本地交付入口；用户随后已授权提交 PR 并发布插件 0.1.13。设计见 [design.md](./design.md)，验证证据见 [verification.md](./verification.md)。

## 网站

预览已启动：[网站首页](http://127.0.0.1:4187/DSA-Mastery/)、[表达式 Project](http://127.0.0.1:4187/DSA-Mastery/labs/chapter-02/project/P-02-04-expression-evaluator/)、[前言安装指南](http://127.0.0.1:4187/DSA-Mastery/learn/chapter-preface/06-vscode-extension-guide/)。三个入口已验证 HTTP 200。服务 PID 为 `46828`，日志在 `.lab-cache/extension-review/website-preview.log`，已有 4173/4175 服务保留。

## 插件

VSIX：`tools/vscode-extension/dsa-mastery-labs-0.1.13.vsix`。

在仓库根 PowerShell 执行以下命令，打开已安装新版的隔离配置；不会覆盖日常扩展和进度：

```powershell
$repo = (Get-Location).Path
$checkRoot = Join-Path $repo '.lab-cache/extension-review'
& 'C:\Microsoft VS Code\bin\code.cmd' --user-data-dir (Join-Path $checkRoot 'upgrade-user-data') --extensions-dir (Join-Path $checkRoot 'upgrade-extensions') --new-window $repo
```

1. 左侧 DSA Mastery 中打开第 2 章 `02P04`。检查 Task 表、当前/历史分、四个 Task 题面、公共接口和文件入口。
2. 单独测评 `stack`，起始代码得到 4/20；全项目起始分为 4/100，所有模块都能编译。展开 CTest output 查看失败步骤，点击完整记录查看缓存 JSON。
3. 在学生文件加一行注释但不保存，受影响结果应显示需要重测；单项提交自动保存本 Project 的相关输入。stack 的修改影响 stack/postfix/final，不影响 tokenizer。
4. 查看题面中的固定接口和错误规则。当前工程只有所有自动 Task 有效通过且没有人工待评时才完成；其他既有 Project 的 manual 保持 PENDING。
5. 升级保留的真实测试进度位于同一隔离配置。Program `01E01` 的提交历史仍存在；自动测试使用的独立工程在 `.lab-cache/extension-review/workspace with spaces/`，其中 stack 已替换为参考实现用于演示重测，仓库内学生代码仍是起始骨架。

重新安装本地包时：

```powershell
.\scripts\bootstrap\install-extension.ps1 -VsixPath .\tools\vscode-extension\dsa-mastery-labs-0.1.13.vsix -CodePath 'C:\Microsoft VS Code\bin\code.cmd' -UserDataDir (Join-Path $checkRoot 'upgrade-user-data') -ExtensionsDir (Join-Path $checkRoot 'upgrade-extensions')
```

按需执行 Developer: Reload Window。完整跨平台安装、更新和回退说明仍以 `docs/VSCODE_EXTENSION_GUIDE.md` 为唯一内容来源。

## 学生包

新导出的学生包位于 `labs/chapter-02/project/P-02-04-expression-evaluator/.lab-cache/packages/P-02-04-expression-evaluator-student/`。可复制到任意可写目录，在包根执行：

```powershell
node tools/lab/cli.mjs validate .
node tools/lab/cli.mjs score . --task stack
node tools/lab/cli.mjs score .
node tools/lab/cli.mjs project-status .
```

`score` 非满分时 exit 1 是正常学生结果；工具/环境错误为 exit 2。学生包不需要 pnpm install，但仍需 Node、编译器和 CMake。
