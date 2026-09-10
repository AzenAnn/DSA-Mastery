# 完善第 8 章查找选择题（补 8.2 BST 与 8.3 平衡树题源）

## Goal

第 8 章现有 6 道理论选择题全部集中于 8.1（顺序/分块/折半），8.2 BST 与 8.3 平衡树零题。
从可核实来源补齐查找章理论题，使题量与题源质量对齐仓库其他章节（规范见
`.trellis/spec/content/labs.md` 题源选取约定：只找题不编题，每题至少两个来源交叉核对）。

## Requirements

- 新增题目只找题、不编题，优先 408 统考真题；每题记录主要出处与交叉核对来源。
- 题面、选项、答案、解析写入各 Lab 的 `quiz.json`；解析独立推导重写，不复制来源站表述。
- 带图形的题目（树形图）按仓库 graphviz/SVG 流程重绘，不使用真题 PDF 截图。
- 遵循 quiz.json 数据契约与 `Lab 00-03` 通用 `<QuizSet />` 挂载方式；README 不重复静态答案。
- overview 配套理论题表、`content-index.ts`、导航测试同步更新。

## Acceptance Criteria

- [ ] 用户对组织形式、年份下限、是否补王道题、图形重绘、综合题 5 项拍板（见 research/source-list.md）。
- [ ] 新增 quiz.json 通过 `validate:content` 与 `lab:validate`。
- [ ] 每道新增题在 quiz.json 保留 `source`（年份题号）与稳定 `id`（沿用 `search-408-YYYY-qNN` 命名）。
- [ ] Playwright 在新 quiz 页面完成选择→提交→反馈→重试流程。
- [ ] 内容保持 `status: draft`，等待 Review Owner 知识复核。

## Notes

- 候选清单与三方核对结果：`research/source-list.md`（13 道选择题 + 1 道综合题候选，全部核验）。
- 408 真题 2009～2025 无红黑树选择题；红黑树是否补王道题待拍板。
- 408 卷 PDF 与答案卷已在任务过程中逐份核验（neville-studio/408-exam-paper + JDC2001/408）。
