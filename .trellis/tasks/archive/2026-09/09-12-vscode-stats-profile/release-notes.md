DSA Mastery Labs 0.1.14 重构做题统计页，新增仅根据不同已解决题目数计算的八级 Rank，保留已有做题进度和判题流程。本版沿用公开测试版发布方式。

## 本版变化

- 新增 Trainee、Pupil、Specialist、Expert、Candidate Master、Master、Grandmaster、Legendary，显示等级内进度及距离下一 Rank 的题数。重复提交和重复通过同一题不会晋级。
- 活动热图使用统一主题配色，标记今天，支持日期悬停和键盘详情；窄窗口默认展示最近活动日期，保留年份及提交/通过指标选择。
- 累计通过趋势更紧凑，按实际日期间隔显示，通过次数与已解决题目数保持明确区分。
- 章节进度在宽窗口使用双列，窄窗口自动切换单列。兼容深色、浅色及两种高对比度主题。
- 修复无效历史日期可能导致统计页无法打开的问题；总计及原有持久化记录保持原有口径。

## 下载与安装

1. 下载下方 `dsa-mastery-labs-0.1.14.vsix`。
2. VS Code 扩展面板右上角 `...` → **从 VSIX 安装**，选择该文件。
3. 执行 **Developer: Reload Window**，打开 DSA-Mastery 仓库根目录。
4. 在 DSA Mastery 题目视图点击统计图标，或运行 **DSA Mastery: 查看做题统计**。

保留原用户数据目录和扩展 ID 可保留已有答题进度。

- [安装、更新及回退指南](https://azenann.github.io/DSA-Mastery/learn/chapter-preface/06-vscode-extension-guide/)
- [本版对应源码](https://github.com/AzenAnn/DSA-Mastery/archive/refs/tags/ext-v0.1.14.zip)

## 验证

插件 93 项测试、类型检查、构建，以及仓库完整 `pnpm test` 通过。统计页完成 47 种浏览器布局/状态验收，覆盖 320-2560px、全部 Rank、四种主题、键盘交互和 CSP；Windows 隔离 VS Code 已验证原生四主题及真实本地进度读取。

沿用原有事件日志和保留上限，提交、Judge、扫描及数据格式无修改。统计页在执行查看命令时刷新，本版不增加实时 Rank Up 通知。Windows 下现有符号链接相关测试未实际执行；macOS、Linux 桌面及 VS Code 1.90 尚未原生实测。
