# Design：课程编排层

## 边界

已有 `content/**` 与 `labs/**` 继续作为文章和实验的唯一正文来源。新增 `curriculum/**` 只存放课程总目录、Part 入口和章节概览框架，不承载已有正文副本。

`.vitepress/content-index.ts` 继续是唯一结构化索引：在原有 `lessons/labs/chapters` 之外派生 `parts` 与目标 `outlineChapters`。目标章节通过显式 sourcePath 映射引用已有 `CourseDocument`；框架页面自身作为 outline landing。组件和侧栏只消费这份索引，不维护第二份列表。

## 路由

- 新课程总目录：`/learn/`
- Part 入口：`/learn/part-NN-slug/`
- 框架章节入口：`/learn/outline/chapter-NN-slug/`
- Ch.0+ 使用稳定 slug `chapter-00-plus-algorithm-thinking`
- 旧内容继续使用 `/learn/chapter-*/.../`，Lab 继续使用 `/labs/chapter-*/.../`

## 映射原则

- Ch.0～4 直接关联现有对应章节，并以新增框架入口统领。
- Ch.5 从旧树章的应用与堆页面映射；Ch.6～7 从旧图章拆分映射；Ch.8～9 从旧查找章拆分映射；Ch.10～11 从旧排序章拆分映射。
- Ch.12～15 暂无正文，只展示框架与待完善说明。
- Lab 保持旧章归属和旧 URL，在新编排中以相关资源形式出现，不改 Lab 元数据。

## 兼容与回滚

新增 rewrites 只处理 `curriculum/**`，不改变原有 content/labs rewrites。若目录层失败，删除新增 curriculum 与索引扩展即可恢复原行为；无数据迁移。
