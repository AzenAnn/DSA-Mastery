# macOS 学生实验环境安装指南

## Goal

为 macOS 学生提供一份可按步骤复现的 DSA Mastery 最小实验环境安装指南，并确保文档中的本地图片引用均可解析。

## Requirements

- 使用作者在 macOS 上实际执行并截图的安装流程。
- 覆盖 Xcode Command Line Tools、Homebrew、Node.js、pnpm 与 VS Code。
- 保持 Windows 指南及用户已有改动不变。
- `docs/MACOS_STUDENT_SETUP_GUIDE.md` 中不得保留指向不存在文件的图片引用。
- 外部下载链接必须使用完整的 HTTPS URL，不能误写成本地图片路径。

## Acceptance Criteria

- [ ] macOS 指南中每个本地图片目标均真实存在。
- [ ] Node.js 与 pnpm 版本要求符合仓库的 `package.json`。
- [ ] Windows 指南未被本任务修改。
- [ ] 相关 Markdown 和项目内容校验通过，或明确记录尚未接入站点的限制。

## Notes

- Keep `prd.md` focused on requirements, constraints, and acceptance criteria.
- Lightweight tasks can remain PRD-only.
- For complex tasks, add `design.md` for technical design and `implement.md` for execution planning before `task.py start`.
