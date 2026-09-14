# 参考实现与知识合同

- `public/demos/binary-search.html`、`bst-explorer.html`：独立 HTML，CSS 变量统一深灰底、青色 eyebrow、22px hero、18px card、圆角控件；桌面主视图/说明栏，窄屏堆叠。data-action/data-role 绑定控制；预先生成帧，render 当前 index。
- 8.1 与 8.2 正文使用 `<script setup>` 的 `withBase('/demos/…html')`、带中文 title 和 loading=lazy 的 iframe、`search-demo-frame` 类。沿用相同边界，不增加 Vue 注册。
- 原参考 HTML 独立持有颜色，用户明确要求统一其外观。新演示共享参考色值，不改站点主题。共享模块与 CSS 仅服务新增多个真实消费者。
- 中序线索化对齐 4.4 的 `inThreading`/`createInorderThread`，末节点 rtag=Thread 且 right=null。Morris 必须从未线索化的普通树开始，结束后恢复原指针。
- 4.5 后根树/后序森林等价于 LCRS 二叉树中序；对两种结构独立计算遍历，然后按访问事件同步，不能把同一输出数组复制成两列冒充独立算法。
- 4.6 flatten 保持当前迭代算法次序：pred.right=curr.right；curr.right=curr.left；curr.left=null。中间帧可能存在多条入边，不能把临时结构当普通树递归布局；采用固定节点位置和指针表绘图。
- 适用规范：content/frontmatter-and-routing、frontend/vitepress-development、frontend/components-and-data、frontend/theory-markdown、frontend/visual-responsive、quality/validation-and-pages，以及共享 guides。
