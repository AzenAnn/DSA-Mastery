# Design：线性表五类选择题 Lab

## 1. Architecture and Boundaries

本任务新增 5 组 `README.md + quiz.json`，并增强既有通用 Quiz 数据流与章节 Lab 自动发现。站点使用同一套运行时：

```text
五篇源 Markdown（仓库外，只读）
  -> 按“选择题 N”边界截取前 min(10, choice_count) 题
  -> 规范化 Obsidian callout 为 VitePress Markdown
  -> 五份 quiz.json（题目事实来源）+ README（课程外壳）
  -> quiz.data.ts + 既有 QuizSet
  -> validate-content + ContentIndex
  -> Labs 索引 / 搜索 / 章节相关 Labs / route
  -> dist/pages + Pages-base Playwright
```

不复制源目录树，不引入第二套答题组件，不在 Vue 组件中硬编码题库。

## 2. Source-to-Lab Mapping

| 源文件 | 目标 Lab | 选择规则 |
| --- | --- | --- |
| `01-顺序表.md` | `lab-01-04-sequential-list-quiz/README.md` | 选择题 1～10 |
| `02-单链表.md` | `lab-01-05-singly-linked-list-quiz/README.md` | 选择题 1～10 |
| `03-双链表.md` | `lab-01-06-doubly-linked-list-quiz/README.md` | 选择题 1～10 |
| `04-循环链表.md` | `lab-01-07-circular-linked-list-quiz/README.md` | 全部 2 题 |
| `05-静态链表.md` | `lab-01-08-static-linked-list-quiz/README.md` | 全部 4 题 |

源文件边界从 `## 选择题` 后的 `### 选择题 N` 标题识别，到下一道选择题或下一类题型标题前结束。这样不会依赖源 frontmatter 中可能变化的统计数字，也不会误导入综合题。

## 3. Interactive Quiz Contract

每个 Lab 由统一外壳和题目正文组成：

```md
---
title: "Lab 01-04：顺序表选择题精练"
order: 4
chapter: 1
chapterTitle: "线性表"
updated: "2026-08-14"
contributors: ["Azen"]
status: "draft"
lab: true
difficulty: "基础～进阶"
duration: "35～50 分钟"
---

# Lab ...

## 目标 / 前置知识 / 作答方法

## 选择题

<QuizSet />

## 完成清单 / 思考题 / 复盘
```

同目录 `quiz.json` 为问题数组，每题包含唯一 `id`、来源/难度/考点/题目标识元信息、Markdown 题面、四个选项、0～3 的正确答案索引和 Markdown 解析。构建时由 `quiz.data.ts` 把受信任的本地 Markdown 渲染为 HTML，组件只负责选择、提交、反馈和重试。答案速查表继续使用原生 Markdown 表格。

## 4. Conversion Strategy

实现阶段使用一次性的本地转换脚本读取源文件，生成候选 Lab：

1. 移除源 frontmatter、章节概览和综合题；
2. 按题号截取目标数量；
3. 把题目信息压缩为一行或小列表；
4. 去掉单层 Obsidian 引用前缀，保留内部引用、代码围栏和表格；
5. 把题面、四个选项、答案、详解和选项辨析写入 `quiz.json`；
6. 生成含唯一 `<QuizSet />` 挂载点、答案速查表和教学外壳的 README；
7. 删除一次性脚本，逐页人工复核转换边界、公式、围栏、表格和链接。

个人 Obsidian 导出中的原始题目详情页、交互可视化区、页首答案来源说明和题内答案生成声明属于作者工作流信息，转换时全部删除；保留题目来源名称、题目标识与知识内容。页面以 `draft` 和人工 Review 表达未核验状态。

转换脚本只用于机械迁移，不作为站点运行时依赖或仓库长期工具。生成候选内容后，任何针对格式和可移植性的修正使用精确补丁完成。

## 5. Resource Handling

- 转换器先收集首 10 题中的全部 Markdown 图片引用。
- 若图片后紧邻完整文字版结构，则移除图片行并保留文字内容；单链表存储地址题采用源文档已有的文字表格。
- 只有缺少图片就无法作答时，才按精确文件复制到仓库静态资源并记录来源；不批量搬运 `assets/`。
- 构建前搜索 `C:\Users\`、`../assets/practice` 和 Obsidian callout 标记，结果必须为空。

## 6. Testing and Compatibility

- 内容 validator 证明路径、frontmatter、order、README 挂载点和 `quiz.json` 字段契约合规。
- 机械审计证明题量、选项块、答案容器和答案速查一致。
- ContentIndex 自动发现；编号章节的“相关 Labs”由同章 Lab 数据自动派生，不维护手写子集。第 0 章拆分段可继续显式映射。
- 自动发现 fixture 新建临时编号章节 Lab 并证明侧栏自动出现；Playwright 覆盖五个入口以及代表性页面的选择、提交、反馈、重试，同时抽查 2 题页面。
- Pages base 下的最终静态产物验证 URL 与资源，不以开发服务器代替。

## 7. Rollback

- 五个 Lab 目录互相独立，可按目录回退；若单篇转换失败，不影响其他现有 Lab。
- 浏览器断言只覆盖新增 Lab，可随对应页面一起回退。
- QuizSet 增强保持 Lab 00-03 数据兼容；回滚新增富文本字段后，原复杂度题库仍可工作。
- 本地预览使用独立端口；停止精确预览进程即可，不删除源码或其他服务。
