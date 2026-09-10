# README 改版实施计划

## 1. 编辑范围

- 重写根目录 `README.md` 的信息层级与文案。
- 复用 `public/og.png`，并在 `public/readme/` 新增两张 README 分区插图。
- 保留在线课程、课程地图、Labs、环境配置教程、贡献指南和许可说明入口。

## 2. 实施步骤

1. 依据现有 `public/og.png` 确定纸张/墨线/靛蓝/橙色的共同视觉语言。
2. 用内置图片生成能力分别生成课程全景图与 Lab 模式图，逐张检查无文字、无水印、构图与主题准确性。
3. 将通过检查的图片保存为 `public/readme/course-panorama.png` 和 `public/readme/lab-modes.png`。
4. 按设计稿重建首屏：横幅、定位、行动入口、Pages 状态。
5. 用“为什么 / 当前内容 / 三类 Lab”替换过时的 Demo 叙述，并在对应章节插入两张新图。
6. 将“开始学习”压缩为在线入口、`git clone` 命令和环境配置教程链接。
7. 删除学习闭环、质量保证、仓库导览、教材原文件、Lab 原文件和维护者文档索引。
8. 保留精简的参与贡献与许可说明。
9. 检查 Markdown 层级、表格、代码块、图片与所有链接。
10. 启动 GitHub 风格的本地 README 预览并生成桌面截图。

## 3. 验证

- `git diff --check`
- 人工检查 GitHub Flavored Markdown 层级与首屏阅读顺序
- 检查仓库相对链接目标存在
- 核对线上课程、课程地图、Labs 与环境配置教程 URL
- 检查新图片格式、尺寸、文件大小、无伪文字/水印及 alt 文本
- `pnpm run validate:content`
- 本地 GitHub 风格渲染预览与桌面截图人工检查

## 4. 回滚点

- 产品改动集中在 `README.md` 与 `public/readme/` 两张新图片，可单提交回滚。
- 现有品牌横幅不修改或覆盖；新增图片使用独立语义化文件名。
