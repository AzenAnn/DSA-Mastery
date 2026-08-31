# 视觉、暗色与响应式

## 品牌基线

当前品牌基线由 `.vitepress/theme/custom.css` 与 `docs/assets/migration-baseline/` 共同记录；修改应保持信息层次，不以旧 React DOM 或逐像素复制为目标。

核心令牌迁入 `.vitepress/theme/custom.css`：

| 语义 | 浅色 | 暗色 |
| --- | --- | --- |
| paper | `#f7f6f2` | `#121419` |
| paper-strong | `#ffffff` | `#191c23` |
| ink | `#17191f` | `#f2f3f7` |
| accent（靛蓝） | `#4655e8` | `#8290ff` |
| signal（橙） | `#ff6b35` | `#ff8a60` |

- 大标题使用中文友好的衬线栈，正文使用无衬线，元信息和编号使用等宽字体。
- 保留纸张/墨色、靛蓝主操作、橙色信号、毛玻璃顶栏、旋转 D 标和克制阴影。
- 首页保留代码窗口 Hero、理论/Lab 浮卡、动态统计、八步学习闭环、章节卡、Lab 卡、深色更新面板和结尾宣言。
- 文档页保留桌面左侧课程目录、中央正文、右侧 outline；有面包屑、状态、更新时间、贡献者、来源/编辑入口和前后页。
- Markdown 保留标题分隔、引用、可横滚表格、行内代码、代码语言/复制反馈、MathJax 和任务列表。
- 顶栏品牌沿用旧 `.brand` 的两行锁定结构：副标题必须在品牌标题盒内完整显示，不能用负 margin 让文字溢出；VitePress 外观切换保留原生 switch 语义，并将图标居中于至少 44px 的触控目标。
- 首页和正文页顶栏必须共用同一条水平内容轨道：使用 `--vp-layout-max-width` 推导动态外边距，正文页不能沿用 VitePress 默认的 2px 右侧内边距，也不能让侧栏标题选择器误伤品牌内层网格。

视觉基准位于 `docs/assets/migration-baseline/`；比较相同 viewport、主题和页面，不用截图差异代替人工判断。

### 主题恢复契约

当 VitePress 迁移、依赖升级或主题重构使页面的品牌层次变弱时，按下列优先级恢复，而不是恢复旧 React/Next.js DOM：

1. 以当前 VitePress 原生行为与本文件为可执行边界；`docs/assets/migration-baseline/` 是视觉意图，旧 `app/` 和 `components/` 仅是历史证据。
2. `custom.css` 的 `--course-*` 是设计令牌源，`--vp-*` 只映射到这些语义令牌。组件不能散落原始颜色、字号、阴影或断点值；代码窗口语法色是唯一可记录的局部例外。
3. `Layout.vue` 只插入品牌标识、课程文档头部和底部提示；顶栏、搜索、appearance、桌面 sidebar、移动 drawer、outline、prev/next、代码复制、404 继续由 VitePress 默认主题负责。
4. 首页、文档页、Labs 目录共用纸张/墨色、靛蓝主操作、橙色信号、衬线标题/无衬线正文/等宽元信息，以及 4px/8px 间距节奏。卡片半径保持 8-10px，阴影只表示层级，不把页面 section 包成浮动卡片。
5. 不以渐变、装饰性光斑、滚动触发动画或远程字体弥补层次。首页的代码窗口和内容派生的章节/Lab 卡是主视觉；优先保证 CJK 回退、静态 Pages 加载和阅读性能。

恢复前后至少人工检查：首页、教材页、Labs 索引和 Lab 页，分别在浅/暗色及相同 viewport 下对照。每处差异必须归类为“恢复”“有意的 VitePress/无障碍改进”或“回归”；最后一种不得合并。

### 代码块配色契约

课程正文代码块在浅色和暗色站点主题下都固定使用 `--course-code-bg` 深色表面，因此 Markdown 的 Shiki 主题也必须统一使用深色高对比度方案。不得把 `github-light` 一类浅色 token 配色放在该深色表面上；否则未着色的标点、变量或行号会接近背景色。

```ts
// 错误：浅色 token 会与固定深色代码背景冲突
markdown: { theme: { light: "github-light", dark: "github-dark" } }

// 正确：两种站点主题共用高对比度深色 token
markdown: { theme: "github-dark-high-contrast" }
```

- 普通代码文字映射到 `--course-code-text`，行号映射到 `--course-code-muted`，不得依赖正文的 `--vp-c-text-*` 颜色。
- 正文代码字号不得小于 13px；纵向溢出隐藏，长行只允许代码块自身横向滚动。
- Pages 回归测试必须在浅/暗色下分别断言代表性 token 与行号对代码背景的对比度至少为 4.5:1，并断言 `overflow-x: auto`、`overflow-y: hidden`。
- 人工检查至少覆盖带行号/高亮行、普通代码块、注释、标点、复制按钮和移动端长行。

## 响应式合同

| 断点 | 必须发生 |
| --- | --- |
| ≤ 1180px | 压缩顶栏导航；Hero 与文档列宽收缩 |
| ≤ 980px | 隐藏桌面主导航、左侧栏和右侧 outline；显示移动课程目录；Hero 单列；统计两列 |
| ≤ 720px | CTA 全宽；章节/Lab/分页/更新面板单列；学习闭环两列；正文边距和字号收紧 |

不要新增相邻断点修补单个组件；先检查网格、容器和内容长度是否违反上述三档模型。

补充检查宽度为 375px、768px、1024px 和 1440px。容器和固定格式组件应使用 `grid`、`minmax`、`aspect-ratio` 或稳定的最小/最大约束，避免长中文标题、统计数字、Hero 浮卡或 hover 状态改变布局尺寸。除代码、公式和表格外，根页面不得横向滚动。

## 交互与无障碍

- 首屏主题在页面绘制前确定，兼容系统偏好与既有 `dsa-mastery-theme`，不得闪烁。
- 浅/暗色下正文、靛蓝、橙色、状态徽章、代码块和焦点环均保持清楚对比。
- 搜索使用 VitePress 原生本地搜索与键盘交互；不重复注册 `Ctrl/Cmd+K`、`/` 或 `Esc` 监听器。
- 键盘用户能到达导航、搜索、主题、目录、代码复制和前后页；`:focus-visible` 不得被去除。
- 移动课程抽屉关闭时必须同时 `visibility: hidden` 且 `pointer-events: none`，避免透明/移出视口的侧栏链接进入焦点或交互树；打开和 Escape 关闭仍由 VitePress 原生状态控制。
- `prefers-reduced-motion: reduce` 时关闭非必要动画和顺滑滚动。
- 横向内容只能让代码、公式或表格自身滚动，页面不能产生整体横向溢出。
- 所有点击、悬停和 active 状态有清晰的非布局位移反馈；普通 UI 过渡只使用 `opacity`、`color`、`box-shadow` 或 `transform`，时长 150-300ms。不能只依赖 hover 传达导航或状态。
- 正文与背景的对比度至少满足 WCAG AA；状态同时有文字或图标，不能只用靛蓝、橙色、绿色区分。图标按钮保留 VitePress 的可访问名称或提供等价 `aria-label`。

### 侧栏与本页目录

- 左侧 VitePress 课程目录遵循旧 `.docs-sidebar` 的层级视觉：嵌套 `.items` 使用一条 `--course-line` 竖线，`.VPSidebarItem .indicator` 默认透明；当前项使用 `--course-accent-soft` 背景与 `--course-accent` 文字，不得给每个条目染一条紫色线。
- 章节标题保持 13px 左右的重量层级，页面条目使用至少 12px、约 24px 行高；可折叠 caret 的实际点击区域至少 44px。
- `.VPDocAsideOutline .content` 使用独立的 `--course-line` 左边界和 18px 左内边距；标题至少 12px/800，链接至少 12px、1.8 行高、6px 以上纵向间距。长标题可换行，不使用过窄的省略号堆叠。
- 这套规则来源于 `5c9e03b` 的 `.chapter-links` 与 `.table-of-contents` 视觉契约，复用 VitePress DOM，不恢复旧 React 组件。
- “本章 Labs”使用独立边框、轻背景和圆角；Theory/Exercise/Project 分别复用 accent/success/signal 语义色与 Lucide BookOpen/FlaskConical/Blocks 图标。三类必须同时显示中英文名称；任一类别无内容时仍以可折叠分组展示对应的“暂无理论型/实验型/工程型 Lab”。Ch.5 当前 Theory 与 Exercise 有内容、Project 为空，三类仍必须保留完整接口。

## 验收

- 桌面和移动、浅色和暗色均截图：至少首页、教材页、Labs 索引、Lab 页。
- 在 1180、980、720 三个边界两侧手工检查布局切换。
- 浏览器检查搜索、主题持久化、移动目录、复制反馈、focus、reduced motion。
- 任何视觉差异在 PR 中分类为“有意改进”“框架差异”或“回归”；未解释的品牌/层次丢失阻塞合并。

## 常见错误

- 直接套默认 VitePress 首页或蓝白默认变量。
- 固定深色代码背景，却继续按站点浅/暗主题切换浅色和深色 Shiki token。
- 用大量绝对定位复刻截图，导致中文换行或移动端溢出。
- 只测浅色桌面，忽略暗色、键盘和 320px～720px 宽度。
- 为视觉一致性重写 VitePress 已可靠提供的搜索、outline 或移动抽屉。

## VS Code Lab WebView 补充合同

VS Code 扩展的 Lab WebView 与原生侧边栏是两个职责层：侧边栏唯一负责章节、题目列表和进度入口；WebView 只负责当前题面的阅读、作答和局部结果检查。代码题的结果检查器必须使用可收起的双栏结构，不能演变成第二套导航。

~~~text
renderPanelHtml
  .lab-workspace: minmax(0, 2fr) + bounded inspector
  .lab-inspector: Result | Test cases, one collapse control
  .lab-actionbar: one primary Submit + quiet secondary actions
~~~

- inspector 展开宽度上限为题面主列宽度；使用 min-width: 0、受限 minmax 和自身滚动容器，禁止页面级横向溢出。
- progress.lastSubmission 决定初始状态：无历史结果时收起，有历史结果时展开并显示结果；submitting、result 和 submitFailed 事件自动打开结果页签。
- 折叠按钮必须提供 aria-expanded、aria-controls 和可读名称；结果/测试用例页签使用 role=tab、aria-selected 和键盘左右/Home/End 切换。
- ≤720px 时题面与 inspector 堆叠，≤460px 时动作按钮全宽或双列换行；代码、公式、表格和长输出只能在自身容器内横向滚动。
- 样式使用 VS Code 主题变量映射的语义 token；浅色低噪声表面是参考，深色只做对比度回归。提交是唯一主操作，其他动作不得各自形成突兀的凸起按钮。

### 统计看板 WebView 补充合同

统计页与做题页共享 `.lab-page` 的语义令牌，但职责和结构独立：

- 根结构固定为 `body.stats-body > main.lab-page.stats-page`；信息顺序为总览指标、活动热图、累计通过趋势、章节分布。不得加入章节导航、题目列表、结果 inspector 或底部动作栏。
- 活动热图的提交/通过分段按钮与年份选择由 WebView 本地显隐驱动；所有年份和指标可预渲染，切换时同步 `hidden`、`.active` 和 `aria-pressed`，不因切换回扩展取数。
- 热图的固定宽度只能在 `.heatmap-scroll` 内横向滚动；趋势图和章节行使用 `min-width: 0`/流式宽度，统计页根节点不得横向滚动。统计 HTML 必须声明 `viewport`。
- 统计事件日志是追加型数据源：`submit` 与 `pass` 明确分开记录，代码题每次提交可产生两类事件，选择题每次答题记录提交且仅在首次完成时记录通过；版本迁移须保留原有题目进度并为可回填的代码题历史生成事件。
- 图表颜色、空状态和控件状态使用 VS Code 主题变量及显式 fallback；浅色主题为主，暗色主题至少保持文字、图例、网格线、控件焦点和图表可读。
