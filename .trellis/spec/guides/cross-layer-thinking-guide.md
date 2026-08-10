# 跨层变更检查清单

一篇 Markdown 的完整路径是：

```text
源文件
  -> 内容校验
  -> content-index / data loader
  -> rewrite URL
  -> 首页、侧栏、搜索、prev/next
  -> VitePress 静态产物
  -> Pages base
  -> 浏览器真实点击
```

改变字段、路径、排序、链接、base 或组件数据前逐层回答：

- 写作者输入合同变了吗？`content/README.md` 和 Lab 说明是否同步？
- validator 与 ContentIndex 是否接受完全相同的字段和路径？
- URL 是否兼容旧 `/learn/.../`、`/labs/.../`，且没有手写 base？
- 首页、导航、搜索、统计、状态和前后页是否从同一数据得到一致结果？
- 本地 `/` 与 Pages `/DSA-Mastery/` 是否都通过产物级测试？
- 失败能否只回退本次改动，而不移动或重写 Markdown？

只测某一层不能证明跨层合同成立。相关规范：

- [教材 Frontmatter 与路由](../content/frontmatter-and-routing.md)
- [Lab 合同](../content/labs.md)
- [验证与 Pages](../quality/validation-and-pages.md)
