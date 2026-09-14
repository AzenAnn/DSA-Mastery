# PR 与插件发布记录

2026-09-11，用户在本地交付后明确要求“提交pr 并且release这个1.13版本的插件”，因此执行 commit、push、PR、tag 和公开 Release。manifest 中的版本是 `0.1.13`。没有合并 PR。

- [x] 实现提交：`38f3c3a79642e955447622af692259e192edaaff`，分支 `feat/project-engineering-expression-demo`。
- [x] PR：[174](https://github.com/AzenAnn/DSA-Mastery/pull/174)，目标 `main`，状态 OPEN / MERGEABLE。基线包含已合并的 PR #173；期间 main 新增的 PR #172 仅扩充 Ch11 用例，无冲突。
- [x] 分支构建：[34561125206](https://github.com/AzenAnn/DSA-Mastery/actions/runs/34561125206)，Linux 类型检查、47 项扩展测试、VSIX 打包通过。
- [x] 分支 CI 包下载后，通过 `install-extension.ps1` 安装到 `.lab-cache/extension-review/upgrade-user-data` 与 `upgrade-extensions`；真实 `node scripts/verify-extension-project-ui.mjs new` 验证 Task README/源码入口、单项失败、未保存源码失效、保存后重测 AC、全项目 WA，以及真实 SQLite 中的 Program/Project 进度保留。
- [x] 标签 `ext-v0.1.13` 指向同一实现提交。标签构建：[34561306721](https://github.com/AzenAnn/DSA-Mastery/actions/runs/34561306721)，测试、版本匹配、打包和草稿资产上传全部成功。
- [x] 草稿资产已下载到 `.lab-cache/extension-review/ci-release-0.1.13/dsa-mastery-labs-0.1.13.vsix`，29 个包内文件与完整 UI 实测的分支 CI 包逐字节一致；再次隔离安装并确认版本 0.1.13。没有覆盖日常 VS Code 环境。
- [x] 已发布 [ext-v0.1.13](https://github.com/AzenAnn/DSA-Mastery/releases/tag/ext-v0.1.13)，`draft=false`、`prerelease=true`，保留现有公开测试版约定；没有修改稳定 Latest。发布说明含同标签源码、固定版本指南、真实验证与未测平台。
- [x] 公开后运行 `install-extension.ps1 -ReleaseTag ext-v0.1.13 -DownloadOnly` 成功，下载文件身份、版本和 SHA256 与发布资产一致。

发布资产为 `dsa-mastery-labs-0.1.13.vsix`，916358 字节。SHA256：`a0d9150e16a54542c33c8b73b0cba588ac4c7e8f7950971764bcaef68075c66c`，与 GitHub 资产 digest 一致。ZIP 时间戳导致归档哈希与初次本地包不同，包内容以 CI 实测和逐文件比较为准。

本地完整检查详见 [verification.md](./verification.md)。PR 的 Pages/C++ 矩阵受既有 `concurrency: pages` 共用队列限制，在记录本页时等待 main workflow 完成；状态以 PR Checks 为准，发布扩展的 CI 已成功。macOS、旧版 VS Code 1.90 与受管设备仍未原生实测。

发布发生于 PR 合并前，因此 VSIX 使用者需要同标签仓库中的 CLI；安装 helper 本身不会更新源码。Release 正文已给出 `ext-v0.1.13` 源码 ZIP、独立目录 clone 命令和安装指南，保留已有学生答题目录。
