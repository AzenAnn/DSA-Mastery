# 复用检查清单

动手前检查：

- 内容、侧栏、搜索、首页统计、Labs 目录和 prev/next 是否都能由同一个 ContentIndex 派生？
- VitePress 默认主题是否已经提供搜索、appearance、outline、移动抽屉、代码复制或 404？
- 新组件是否至少有两个真实消费者，还是只为一个页面增加间接层？
- base、route、frontmatter 和状态标签是否已有唯一 helper/类型？
- 教材示例是否指向 Lab 完整实现，避免复制大段代码？

优先消除重复来源，而不是只抽取相似语法。若两个组件只是视觉相似但数据和交互不同，保留小而清楚的组件比万能卡片更安全。

相关规范：

- [内容契约](../content/frontmatter-and-routing.md)
- [组件与数据](../frontend/components-and-data.md)
- [VitePress 架构](../frontend/vitepress-architecture.md)

