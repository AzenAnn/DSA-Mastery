# 技术设计

## 文件与边界

- 新增三个独立 HTML：`threaded-tree.html`（线索化/Morris 两模式）、`tree-forest-traversal.html`、`flatten-tree.html`。
- `tree-demo.css` 共享参考演示的视觉令牌与响应式布局；`tree-demo.mjs` 管理视图/可访问控件/SVG/播放生命周期；`tree-algorithms.mjs` 仅负责预设与纯算法轨迹，可直接由 Node 测试。
- 修改 4.4/4.5/4.6 Markdown，在对应小节通过 withBase 和既有 search-demo-frame 嵌入；Morris 使用相同 HTML 的 mode 查询参数并独立初始化。

## 数据合同

节点以稳定 id 标识，left/right 均为 id 或 null；帧保存深拷贝节点表、curr/prev/pred、访问序列、阶段、解说、代码步骤及本步边变化。不能共享可变对象污染回退帧。永久线索、Morris 临时回边与原孩子边按文字图例/线型/颜色同时区分。

LCRS 使用有序根列表和 children 数组作为唯一原始树来源，计算 left=firstChild、right=nextSibling。转换阶段只改变示意边集和右侧布局；正式遍历分别用通用树和二叉树算法求出序列，按输出事件推进。点击两侧节点显示同一个 id 和映射关系。

## 布局与交互

参考深色 hero/card/toolbar/controls/narration；预设最多约 9 个节点。单图模式的变量/代码/指针表置于旁栏；双图模式将主图区域加宽，辅助卡片移至下方。成对图在空间不足时上下堆叠，SVG 自适应不撑宽。flatten 的指针修改帧保留初始坐标，删除边用红虚线并打叉，新边用绿色粗线；暂时重合的 L/R 用直线和弧线分开，完成帧排为右链；保留原图用于对照。

播放以完整帧为单位，不以 CSS 动画时长控制算法；重置/模式切换/预设切换/拖动/手动步进先暂停。到结尾自动停止；页面隐藏或 pagehide 时停止计时器。按钮和 range 原生支持键盘，不抢输入控件快捷键。选中节点可按 Enter/空格，状态有 aria-live。

## 兼容性与回滚

全部静态资产按 HTML 相对路径加载，不用 CDN、图形库或网络接口。父 iframe URL 用 withBase；现有 8.x 和全局 iframe 样式不改。源文件保持既有路径/章节/order，仅更新日期、贡献者及插入段落。回滚删除本任务新增演示和挂载点即可，原理论与图示仍完整。
