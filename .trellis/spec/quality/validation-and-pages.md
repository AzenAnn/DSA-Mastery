# 验证与 GitHub Pages 合同

## 1. Scope / Trigger

修改内容契约、VitePress、主题组件、依赖、测试、Pages workflow、base 或构建输出时适用。

## 2. Signatures

标准门禁由 `package.json` 暴露稳定脚本：

```powershell
npm ci
npm test
```

`npm test` 当前依次执行 `validate`（内容 + `vue-tsc` + lint）、`test:discovery`、最终 `build` 与 `check:site`。涉及 Pages 时，在设置 `GITHUB_PAGES_BASE_PATH=/DSA-Mastery` 与 `SITE_URL` 后重新 build/check，再运行 `npm run test:pages`。

Pages 构建输入/输出：

```text
actions/configure-pages base_path
  -> GITHUB_PAGES_BASE_PATH
  -> VitePress normalized base
  -> dist/pages
  -> actions/upload-pages-artifact
```

## 3. Contracts

- Node 版本与 `package.json#engines` 一致，干净环境使用 `npm ci`。
- 内容校验与 VitePress 收集器是独立防线，但共享同一字段/路径契约；禁止一个接受、另一个拒绝。
- workflow 使用 Node 24、全局 `pages` concurrency group；PR 执行全部 build/test 但不 deploy，只有 `main` push 和 `workflow_dispatch` 可部署。
- `actions/configure-pages` 是部署 base 的来源；旧 `NEXT_PUBLIC_*`、RSC patch 和 artifact 修补已删除，不得重新引入。
- 上传目录固定为 `dist/pages`；生成目录不进 Git。
- Playwright 必须服务最终静态产物，并挂载在 `/DSA-Mastery/`，不能只测开发服务器；当前必须保持 5 个用例全绿。
- 真实点击覆盖：首页 CTA → 教材、顶栏 Labs → Labs 索引、Labs 索引 → Lab。
- 浏览器收集 `pageerror`、`console.error`、request failure 和同源 4xx/5xx；任何非明确允许项都失败。

## 4. Validation & Error Matrix

| 失败 | 阻塞范围 |
| --- | --- |
| frontmatter、路径、order、链接错误 | 所有内容 PR |
| type/lint/build 失败 | 所有站点或依赖 PR |
| 期望 route/asset 缺失或双 base | 发布阻塞 |
| 搜索找不到教材或 Lab | 发布阻塞 |
| math、code、table/task-list 代表页回归 | 发布阻塞 |
| 移动导航、暗色或关键点击失败 | 发布阻塞 |
| PR workflow 触发 deploy | workflow 设计失败 |
| fixture 未清理，工作树变脏 | 测试失败 |

## 5. Good / Base / Bad Cases

- Good：从 `dist/pages` 在 `/DSA-Mastery/` 下点击三段学习路径，无同源错误且 URL 只有一个 base。
- Base：本地 base 为 `/`，同一 build/test 仍通过。
- Bad：直接断言 HTML 字符串，未执行点击；或只在 `vitepress dev` 测试。

## 6. Tests Required

- 内容：字段、类型、路径、章一致性、排序、相对文件与站内路由。
- 自动发现：临时教材和 Lab 在 `try/finally` 内创建，贯穿验证、导航、搜索和 build。
- 产物：期望 HTML、favicon/OG、内部链接、asset、404、恰好一个 base。
- 浏览器：三段真实点击、搜索教材/Lab、主题持久化、移动目录、代表性公式/代码/表格/任务列表、edit link。
- 视觉：对照 `docs/assets/migration-baseline/` 的桌面/移动、浅/暗证据。

## 7. Wrong vs Correct

### Wrong

```yaml
- run: npm run build
- uses: actions/deploy-pages@v5
```

PR 也执行 deploy，且没有最终产物的点击测试。

### Correct

build job 在 PR/push 均运行全部门禁并上传 `dist/pages`；deploy job 依赖 build，且显式排除 `pull_request`。
