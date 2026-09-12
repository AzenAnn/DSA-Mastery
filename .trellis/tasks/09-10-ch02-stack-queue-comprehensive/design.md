# Design

## Content Boundary

新增 labs/chapter-02/theory/T-02-03-stack-queue-comprehensive/README.md、quiz.json、lab.json。labId 为 02T03，order 为本章空闲的 14，标题为“Lab 02-T-03：栈与队列综合理论题”，contributors 为 Azen。

README 挂载一次 QuizSet，单选题只维护在 quiz.json；大题使用原生 details，不添加新组件。总分 100：选择题按自动判题的正确数乘 2 计分、5 x 12 大题人工自评，页面明确两者范围。

题源与逐题去重证据放在 docs/lab-02-stack-queue-comprehensive-sources.md，不暴露个人机器路径和导出过程。题图随 Lab 放入 assets。导航和搜索沿用现有自动收录索引。

## Question Design

优先笔记中的真题，排除已有 2020/2022 题及基础 FIFO、判空满、长度计算的换数字重复。大题围绕出栈序列禁形与计数、只增不减的循环链队列、共享栈容量论证、仅尾指针的链队列设计、受限双端队列可达性证明。延伸大题标记为基于笔记考点的综合训练，不伪称原考试题。

## Validation And Rollback

构建中发现 quiz.json 引用的同目录资源不经过 Vite Markdown 导入，导致题图缺失。为落实既有 Lab assets 合同，在 config.buildEnd 根据现有 ContentIndex 复制各 Lab 的 assets 到其产物路由；增加 discovery 嵌套二进制资源回归检查，并验证根路径和 Pages 前缀。这是题图交付所需的构建修复，不改变 Quiz 组件 API。

从源文件到 loader、静态产物、浏览器核对完整链路。序列计数、容量与可达性用独立穷举或手算复核，结构设计检查空/满/单元素边界。删除新增 Lab 与题源文档即可回退内容；没有 API、依赖或历史迁移。
