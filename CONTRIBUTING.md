# 参与 DSA Mastery

感谢你愿意改进这套面向课程学习者的理论与实验教程。我们最欢迎能帮助读者解释概念、推导复杂度、独立实现、验证边界并解决新问题的改进，包括可复现的勘误、清晰的小节改写、边界测试和真正连接理论与实践的 Lab。

## 开始前

1. 阅读 [项目蓝图](docs/PROJECT_BLUEPRINT.md) 了解范围。
2. 阅读 [更新工作流](docs/UPDATE_WORKFLOW.md) 了解目录、frontmatter、Review 和版权规则。
3. 多文件或跨会话任务再阅读 [Trellis 协作入门](docs/TRELLIS_ONBOARDING.md)，用 task 保存方案与上下文。
4. 大改动先创建 Issue；拼写或明确断链可以直接提交小 PR。
5. 不确定内容是否适合时，先说明读者问题和希望达到的学习结果。

## 本地验证

需要 Node.js `>= 22.13.0`：

```bash
npm ci
npm run dev
```

日常检出使用 `npm ci`；只有新增或更新依赖并需要同步 `package-lock.json` 时使用 `npm install`。

提交前运行：

```bash
npm test
```

`npm test` 已包含内容、类型、lint、自动发现、VitePress build 和静态产物检查。涉及导航、Pages base、主题或 Markdown 渲染时，再按 [VitePress 迁移说明](docs/VITEPRESS_MIGRATION.md#3-本地命令与已验证结果)构建 Pages 子路径并运行 `npm run test:pages`。Lab 如果有独立命令，请按其 README 从头执行并在 PR 中记录结果。

## 提交原则

- 一个 PR 解决一个清楚的问题，避免夹带无关重构。
- 教材正文放在 `content/chapter-*/`，Lab 放在 `labs/chapter-*/lab-*/`。
- 教材与 Lab 间可使用相对 `.md` 链接；校验器检查源文件，构建器改写课程 URL。不要硬编码 `/DSA-Mastery/`。
- 用自己的语言和例子解释；引用可追溯，图片和代码许可清楚。
- AI 生成内容必须由提交者验证，并在 PR 中说明使用与复核方式。
- 不要手工提交或修改可由构建再生成的目录。

分支名可使用 `chapter/...`、`lab/...`、`fix/...`、`docs/...` 或 `site/...`。Commit 示例：`docs(ch01): clarify linked-list deletion`。站点架构、已知依赖风险和回滚步骤见 [VitePress 迁移说明](docs/VITEPRESS_MIGRATION.md)。

提交 PR 即表示你确认自己有权贡献这些内容；在项目 License 正式确定前，维护者可能暂缓接受包含第三方素材的大型贡献。
