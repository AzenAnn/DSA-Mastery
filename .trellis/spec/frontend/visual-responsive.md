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

## 验收

- 桌面和移动、浅色和暗色均截图：至少首页、教材页、Labs 索引、Lab 页。
- 在 1180、980、720 三个边界两侧手工检查布局切换。
- 浏览器检查搜索、主题持久化、移动目录、复制反馈、focus、reduced motion。
- 任何视觉差异在 PR 中分类为“有意改进”“框架差异”或“回归”；未解释的品牌/层次丢失阻塞合并。

## 常见错误

- 直接套默认 VitePress 首页或蓝白默认变量。
- 用大量绝对定位复刻截图，导致中文换行或移动端溢出。
- 只测浅色桌面，忽略暗色、键盘和 320px～720px 宽度。
- 为视觉一致性重写 VitePress 已可靠提供的搜索、outline 或移动抽屉。
