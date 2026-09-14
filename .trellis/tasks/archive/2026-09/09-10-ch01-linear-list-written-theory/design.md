# Design

## Content

新增 labs/chapter-01/theory/T-01-06-linear-list-written/README.md，稳定 ID 为 01T06，order=22，标题为 Lab 01-T-06：线性表理论大题训练。使用 README-only 的 labCategory: theory 合同，不创建空 quiz.json 或不适用的 manifest。

15 题分三组，每组 5 题，各 50 分。每题采用原生 details 展开答案，包含伪代码、证明、样例/反例和评分要点。文中伪代码是纸笔答案的一部分，不宣称为可独立编译的完整程序。

题目按原笔记筛选，补充明确的结构前提、证明小问与边界核验。7 道真题保留年份；8 道巩固题只称笔记综合题，不冒用教材或统考出处。题源、排除项及发现的转录错误记入 docs/lab-01-linear-list-written-sources.md。

## Integration

沿用 ContentIndex 自动发现目录、搜索、侧栏及前后页。章节概览补充链接，现有第 1 章侧栏回归从 5 份 Theory 调整到 6 份并校验新入口。示意图以 Graphviz DOT 在本地生成 PNG，均放在新 Lab 的 assets，README 相对引用触发现有 Markdown 资源管线。

## Verification

独立模型将数组优化算法与直接枚举结果比较，链表检查值序列、结点身份、释放集合、双向链接和空/单元素边界。执行 pnpm test，Pages 子路径构建及浏览器验证；新页面在 390/1440px 浅暗主题中检查 15 个折叠答案、公式、题图、复制、搜索、目录与无根页面溢出。

## Rollback

范围限新 Lab、题源文档、章节概览、侧栏/搜索回归及 Trellis 记录；不修改公用组件、依赖或已有题库。保持本地未提交状态，等待用户预览确认。
