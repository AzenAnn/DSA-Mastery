# Implementation Plan

## 1. Special chapter contract

- [x] 扩展 `CourseDocument`/`CourseChapter` 的 chapter 类型、排序和显示 label。
- [x] 将前言加入课程基础部分首位，并让首页、课程目录、侧栏和文档标题消费显式 label。
- [x] 扩展内容 validator、构建产物扫描与相关规范，只允许精确的前言路径/元数据合同。

## 2. Showcase content

- [x] 新增唯一的前言展示文档，覆盖正文、全部理论容器、原生 callout、行内语义与代码工作台。
- [x] 在页面中显示 `docs/THEORY_DOC_STYLE_GUIDE.md`，链接到仓库 `main` 分支的实际文件。
- [x] 保持内容为展示用途，不复制完整指南或改动现有教材正文。

## 3. Verification and preview

- [x] 扩展 artifact/Playwright 测试，验证排序、侧栏、搜索、语法、指南链接和移动端无溢出。
- [x] 运行内容、类型、lint、discovery、build、artifact 与 Pages 浏览器门禁。
- [x] 启动本地开发预览，打开并检查展示页，向用户提供可直接访问的 URL。

## 4. Finish

- [x] 运行 `trellis-check`，同步必要 spec，确认只有任务内改动。
- [ ] 提交、归档 Trellis 任务并记录 Azen 会话。

## Validation Commands

```powershell
pnpm run validate
pnpm run test:discovery
pnpm run build
pnpm run check:site
$env:GITHUB_PAGES_BASE_PATH='/DSA-Mastery'
pnpm run build
pnpm run check:site
pnpm run test:pages
```

## Risky files

- `.vitepress/content-index.ts`：数字/前言联合类型和导航数据的单一事实来源。
- `scripts/validate-content.mjs`：只放行一个显式特殊路径，不能泛化到任意字符串 chapter。
- `.vitepress/theme/components/DocumentHeader.vue`：必须避免“第 preface 章”回归。
