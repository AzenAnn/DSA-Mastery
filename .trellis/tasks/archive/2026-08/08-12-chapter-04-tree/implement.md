# Implement：第 4 章两篇理论文章重写

## 前置状态

- [x] Trellis 开发者确认为 `Azen`。
- [x] 从最新 `origin/main` 创建并切换到 `chapter4`。
- [x] 阅读图片需求、现有 Chapter 4 Demo、`docs/THEORY_DOC_STYLE_GUIDE.md` 与适用 Trellis specs。
- [x] 明确保留 `00`/`01` 稳定路径，删除 `02`/`03` Demo。
- [x] 规划摘要已展示；后续 Goal 续行明确要求继续实现。

## 实施顺序

1. 重写 `00-overview.md` 为 4.1，逐项覆盖 4.1.1～4.1.4，并补全一般树 C/C++ 表示、比较、复杂度、边界和自测。
2. 重写 `01-binary-tree.md` 为 4.2，逐项覆盖 4.2.1～4.2.5，并补全形态辨析、性质证明、存储比较、线索树概念及创建/销毁实现。
3. 删除 `02-tree-applications.md`、`03-heap.md`，从 `.vitepress/content-index.ts` 清除对应失效来源。
4. 全仓搜索旧文件名、旧标题和相对链接，修复仅由本次删除引起的失效引用。
5. 复读两篇文章，核对术语、公式下标、代码所有权、复杂度与 frontmatter。

## 验证计划

- `pnpm run validate`
- `pnpm run test:discovery`
- `pnpm run build`
- `pnpm run check:site`
- 视本机耗时运行 `pnpm test`，任何失败均记录并修复后重跑。
- 检查构建后两篇页面在桌面和窄屏下的标题、表格、公式、语义块、代码横向滚动、侧栏顺序与前后页导航。
- 启动 `pnpm run preview` 的本地服务，提供两篇页面的可访问地址。

## 风险文件与检查点

- `content/chapter-04-tree/00-overview.md`：章入口路径不变，但标题与正文角色改变。
- `content/chapter-04-tree/01-binary-tree.md`：旧 4.1 内容完全重写为 4.2。
- `.vitepress/content-index.ts`：只删除失效 lessonSources，不修改收集器逻辑或课程结构。
- 删除操作完成后立即运行全仓引用搜索；验证通过前不启动验收服务。

## 交付边界

- 不提交、不推送、不归档 Trellis 任务。
- 用户验收后再决定是否进入提交、PR 或任务归档流程。
