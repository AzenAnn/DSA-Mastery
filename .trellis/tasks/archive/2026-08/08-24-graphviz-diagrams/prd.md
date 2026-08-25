# 集成 Graphviz 图表插件并迁移树图文档

## Goal

为 DSA Mastery 的 VitePress 教材接入用户提供的 `vitepress-plugin-diagrams`，使用 Graphviz 在构建期把树和图的声明式代码渲染为可阅读的 SVG，降低 ASCII 图在不同字体、主题和移动端上的阅读成本，并让后续作者有一份可复用的 Graphviz 编写指南。

## Background and Confirmed Facts

- 站点的唯一内容源是 `content/chapter-*/*.md`，VitePress 配置入口是 `.vitepress/config.ts`；当前没有 diagram 插件配置。
- 用户提供的插件通过 Kroki 支持 `graphviz` fenced code block、SVG 缓存、caption、外部文件导入和可选 build-time 生成。
- `content/chapter-04-tree/` 有多组 `text` fenced ASCII 图；`content/chapter-05-graph/` 目前没有可直接替换的 ASCII 图，但需要有 Graphviz 图例来覆盖图算法场景。
- 项目要求直接导入的运行时包必须在 `package.json` 中声明，锁文件必须保持一致；内容改动需要通过内容校验、VitePress 构建和产物审计。

## Requirements

### R1. Plugin integration

在 `.vitepress/config.ts` 的 Markdown 配置中注册 `vitepress-plugin-diagrams`，启用 `graphviz`，将 SVG 缓存放在仓库的公共静态目录并使用站点 `base` 兼容的公共路径。生产构建必须能复用已缓存 SVG，并在图生成失败时给出可定位的构建错误。

### R2. Dependency and reproducibility

将插件作为直接开发依赖写入 `package.json` 并更新 `pnpm-lock.yaml`；不得依赖本机残留的传递依赖。配置只使用插件公开 API，不升级 VitePress/Markdown-it 版本。

### R3. Content migration

手动把 `content/chapter-04-tree/` 中所有带 `[*.txt]` 文件名的 `text` fenced blocks 迁移为 `graphviz` fenced blocks，保留原解释和教学顺序。树结构使用节点/边，序列、步骤、布局和递归框架使用 Graphviz 的文本节点表达，不能遗漏或静默删除原信息。

### R4. Graph examples

在图章节补充至少两个小型 Graphviz 示例（一个无权遍历图、一个带权最短路或生成树图），示例节点/边必须与相邻文字和算法前提一致，并包含简短 caption 或说明。

### R5. Developer documentation

新增面向维护者的简短文档，说明：Graphviz fenced block 的基本 DOT 写法、树/有向图/带权边的常用属性、命名与 caption 约定、Kroki 网络依赖和缓存位置、如何本地验证；提供至少一个在线实时预览网站链接（推荐 Graphviz Online 或 Kroki Inspector），并提醒不要在正文写 Pages base。

### R6. Compatibility and accessibility

图在浅色/深色主题和窄屏下不造成根页面横向溢出；SVG 具备可读的 `alt`/caption 语义（沿用插件输出能力），代码块在生成失败时仍能看到原始 Graphviz 源码或明确错误提示。

## Out of Scope

- 不迁移所有 ASCII 文本块；框线表、序列化字符串、递归日志和内存布局继续使用文本代码块。
- 不引入浏览器端 Graphviz/WASM、交互式拖拽编辑器或新的 Vue 组件。
- 不改写课程章节编号、路由、导航、算法实现或 A* 交互演示。
- 不把外部 SVG 或未人工核验的图示作为新的课程知识来源。

## Acceptance Criteria

- [ ] `.vitepress/config.ts` 使用插件公开配置注册 Graphviz；`package.json` 和 `pnpm-lock.yaml` 有一致的直接依赖记录。
- [ ] 在干净依赖环境运行 `pnpm install --frozen-lockfile` 后，`pnpm run validate` 和 `pnpm run build` 通过；构建产物中存在迁移图对应的 SVG，且 Pages base 只出现一次。
- [ ] `content/chapter-04-tree/` 中不存在带 `[*.txt]` 文件名的 `text` fenced block；所有原有图示均由 `graphviz` fenced block 渲染，节点/边方向/权重与正文一致。
- [ ] 新开发者文档包含 DOT 最小示例、常用属性、在线预览链接、缓存/网络说明和本地验证命令，并能从现有开发者文档或 README 找到入口。
- [ ] `pnpm run check:site` 与代表性桌面/移动页面人工检查确认图可见、caption/替代语义存在、浅暗主题可读且无横向溢出；失败图生成不会静默成空白区域。
- [ ] 未迁移的文本图仍保持原样，内容校验没有新增相对链接或 frontmatter 错误，工作树不包含图表生成以外的临时文件。

## Open Questions

无阻塞问题。实现采用构建期生成插件并提交缓存 SVG 的方案；如维护者希望只在开发期生成或不提交 SVG，应在批准规划时调整 R1/R3 的验收边界。
