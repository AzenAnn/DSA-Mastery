# Lab 命令与接口指南 · Technical Design

## Architecture and boundaries

```text
tools/lab/cli.mjs + tools/lab/lab.mk + package.json
  -> docs/LAB_CLI_COMMAND_GUIDE.md（命令事实的学习者表达）
  -> content/chapter-preface/03-lab-cli-command-guide.md（VitePress include）
  -> .vitepress/content-index.ts（前言显式 lessonSources）
  -> VitePress sidebar / search / prev-next / static route
  -> artifact checks + Pages browser checks
```

- 命令事实以 CLI 源码、Make 薄入口、Golden Program/Project 和现有测试为准；现有作者指南只作交叉证据，不作为替代实现检查的唯一来源。
- 长正文仅维护在 `docs/LAB_CLI_COMMAND_GUIDE.md`。课程页只放 frontmatter 和 include，保持与前言 `01`、`02` 相同的单一来源模式。
- 不新增页面组件或样式。排版完全使用现有 Markdown、VitePress 原生容器及理论文档有限语义 API。

## Document information architecture

1. **30 秒快速开始**：选择题、编程题、工程题分别给出最短入口。
2. **先理解命令形状**：解释仓库根目录、`--`、`<lab-path>` 与在 Lab 内自动向上寻找 `lab.json` 的关系。
3. **Lab 类型能力矩阵**：Quiz / Program / Project 可执行操作和限制。
4. **命令总表**：11 个 pnpm scripts，区分学习者高频、作者维护与脚手架。
5. **参数字典**：参数、适用命令、默认值、示例和无效组合。
6. **Program 工作流**：doctor → run → case → interactive → score → clean。
7. **Project 工作流**：task kind、`--task`、stdio `--case`、CTest、manual pending、target。
8. **Make 等价入口**：root/Lab 两种用法、target/变量映射、可选安装边界。
9. **输出、判定与退出码**：AC/WA/TLE/RE/CE/OLE/IE/PENDING、run/score、JSON。
10. **作者维护操作**：validate/build/verify/refresh/pack/new 的风险提示与写操作边界。
11. **排错速查**：环境、路径、task/case、目标、Make 缺失等常见问题。

## Contracts and compatibility

- 新页面 route 固定为 `/learn/chapter-preface/03-lab-cli-command-guide/`，源码不写 Pages base。
- `--json` 示例只描述 `reportVersion: 1` 和顶层稳定语义，不鼓励解析带颜色的人类表格。
- `refresh-expected` 默认只预览，只有 `--write`/`WRITE=1` 写入 `.out`；使用 warning 明确写操作。
- `pack` 只接受 `--profile student`，并仅支持 Program/Project。
- `interactive` 直接接管终端，不支持 `--json` 或 `--no-color`。
- `--target` 默认 `student`；`solution` 仅在源码仓库存在参考实现时可用。
- Make 和 pnpm 示例必须映射到同一 CLI，不宣称两套评分器。

## Test strategy

- 文本合同：扩充 `scripts/validate-lab-docs.mjs`，检查正文 include、11 个脚本、关键选项和 Make 映射。
- 内容合同：更新 ContentIndex、内容树说明及前言相关规范；运行内容校验和 discovery。
- 产物合同：扩充 `scripts/check-built-site.mjs`，把前言页面数更新为 4，并检查新 route 的 include 展开与关键内容。
- 浏览器合同：扩充 `tests/pages-navigation.spec.mjs`，从前言资源列表点击新指南，断言 URL、H1、侧栏和代表性命令；使用 390px 检查根页面无横向溢出。
- 最终质量：运行 `pnpm test`，再启动本地预览进行人工浅/暗主题与桌面/移动检查。

## Rollback

- 删除新增 docs 正文和 content wrapper。
- 从 ContentIndex、内容树、验证脚本、产物检查和 Pages 用例移除对应条目。
- 不涉及数据迁移、依赖升级或既有 URL 改写，回滚可限定在本任务文件。
