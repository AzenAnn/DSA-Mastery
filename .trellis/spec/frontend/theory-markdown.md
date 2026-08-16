# 理论文档 Markdown 与组件合同

## 1. 适用范围

本规范适用于 `content/`、`labs/` 中需要定义、定理、证明、复杂度等理论语义的 Markdown，以及 `.vitepress/markdown/theory.ts` 和 `.vitepress/theme/custom.css` 中对应的构建期渲染与样式。作者 API 的完整示例以 `docs/THEORY_DOC_STYLE_GUIDE.md` 为准。

## 2. 作者语法合同

- 理论容器固定为 `definition`、`theorem`、`lemma`、`corollary`、`property`、`proof`、`intuition`、`example`、`counterexample`、`complexity`、`pitfall`。
- 使用 `::: type 可选标题` 开启、`:::` 关闭；标题省略时必须输出中文默认标题。编号由作者写入标题，不做跨页自动编号。
- 正文必须继续支持 Markdown 列表、表格、链接、行内代码、fenced code 与 MathJax。
- `==文字==` 是有限的语义高亮；行内代码、fenced code 和数学公式中的 `==` 不得被转换。
- 术语与键位分别使用 `<dfn>`、`<kbd>`。短文本颜色只能使用 `dsa-text-accent`、`dsa-text-signal`、`dsa-text-success`、`dsa-text-muted`；禁止任意 `style="color:…"`。
- 通用提示继续使用 VitePress 原生 `info`、`note`、`tip`、`important`、`warning`、`danger`、`caution`、`details`，不得为了颜色错用理论语义。

## 3. 渲染边界与稳定输出

- `.vitepress/config.ts` 是唯一注册入口，调用 `.vitepress/markdown/theory.ts` 导出的 `installTheoryMarkdown()`。
- 理论块必须输出 `.dsa-theory-block`、`.dsa-theory-block--<type>` 与 `data-theory-kind="<type>"`；标题包含 `.dsa-theory-block__title` 和对屏幕阅读器隐藏的 `.dsa-theory-block__code`。
- 自定义标题按纯文本调用 Markdown-it 的 `escapeHtml`，不得在标题中执行 HTML 或内联 Markdown。
- 理论容器是静态 HTML，不引入运行时 Vue 组件，确保 SSR、本地搜索和无 JavaScript 阅读仍保留正文。
- 普通 fenced code 的 `[filename]` 输出 `.dsa-code-title`；`code-group` 内同一字段只由原生 tab 展示，禁止重复标题。
- 文件名增强必须包装 VitePress 已安装的 fence renderer，不能替换 Shiki 的 `pre/code`、复制、行号或注解生成。

## 4. 依赖与版本

- VitePress `1.6.4`、Markdown-it `14.3`、Shiki `2.5` 是当前兼容边界，不在功能改动中顺带升级。
- 容器和高亮分别固定使用 `@mdit/plugin-container@1.0.2`、`@mdit/plugin-mark@1.0.1`；两者声明兼容 Markdown-it `^14.2.0`。
- 新增 Markdown 插件必须先验证 peer contract、类型检查、构建产物与搜索；不得引入平行渲染器或重量级 UI 框架。

## 5. 设计令牌与无障碍

- 新组件只能消费现有 `--course-*` primitive、`--course-theory-*` semantic 和组件令牌；组件选择器中禁止散落 raw hex。
- 理论类型不能只靠颜色区分，必须同时具有可读标题、短代码、边框形态或符号。
- 浅色和深色正文对比度至少 4.5:1；语义边栏、focus-visible 等非文本边界至少 3:1。
- 代码工作台在两种主题中都保持深色高对比表面；长文件名、tabs、表格和代码仅在自身表面滚动，不造成根页面横向溢出。
- 交互沿用 4/8px 节奏、现有快速过渡和 `prefers-reduced-motion`；复制按钮与代码组 tabs 必须保留键盘焦点。

## 6. 必须验证的行为

- discovery fixture 覆盖 11 种类型、默认/自定义/恶意标题、嵌套列表/表格/链接/公式/代码、搜索锚点和未解析 `:::`。
- mark fixture 同时覆盖普通文本、行内代码、fenced code 和 `$a == b$`。
- fenced code fixture 覆盖独立文件名、代码组去重、行号、highlight、focus、diff、warning、error。
- 真实 Chapter 0 页面必须覆盖定义/直觉/性质/证明/复杂度/易错点、独立文件名与代码组。
- Pages 浏览器检查覆盖浅暗主题、390/1440px、正文/边栏对比、根页面溢出、复制、tabs 和 focus-visible，并监听控制台、网络和页面错误。

## 7. 禁止模式与迁移规则

- 不自动全仓替换 `::: info`；只把正式定义迁移为 `definition`，并保持知识正文与结论不变。
- 不重写默认 layout、搜索、侧栏、outline、复制按钮或 code-group 运行时。
- 不硬编码 `/DSA-Mastery/`，不引入远程字体、Tailwind、React、自动编号或跨页引用数据库。
- 不手写 Shiki 输出类；作者只使用 VitePress 支持的 fence info 和 `[!code ...]` 注释。
- 语法或输出类变更属于作者 API 变更，必须同步本规范、作者指南、discovery/artifact/Pages 三层测试。
