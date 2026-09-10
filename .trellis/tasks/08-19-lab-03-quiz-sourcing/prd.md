# 完善 Lab 3.1/3.2 串与模式匹配选择题（每题标注出处）

## Goal

为 lab-03-01（串基础）与 lab-03-02（模式匹配）补齐约 15 道/套的选择题；题目必须来自可核实来源（408 真题、王道、严蔚敏等），每题标注出处，不编题；顺带修正两个 lab 目录名与内容不一致的问题。

## Requirements

- 数量：每个 lab 约 15 道。lab-03-01 现有 0 道，需新建约 15 道；lab-03-02 现有 10 道，需新增约 5 道至约 15 道。
- 题目来源约束：
  - 只找题、不编题：题面、选项、答案必须照搬可核实出处；
  - 每题必须有明确出处，优先级：408 统考真题 > 王道《数据结构》及配套习题集 > 严蔚敏《数据结构》及配套习题 > 天勤等考研辅导书 > 高校公开真题/期末卷 > 可溯源转载；
  - 每道题至少经两个公开来源交叉核对题面与答案，出处无法确认的题弃用；
  - 转载/OCR 文本需与原文比对，纠错后仍须可溯源。
- 交互格式：沿用现有 quiz lab 规范（lab.json + quiz.json，4 选项、answer 为 0～3 索引、每题含 id/title/source/difficulty/topics/stem/options/answer/explanation）。
- README 同步：题目数量、完成清单、选择题章节与文件结构保持一致（3.1 挂载 `<QuizSet />`）。
- 目录名修正：lab-03-01-string-matcher → 与串基础内容一致；lab-03-02-sparse-matrix → 与模式匹配内容一致；沿用现有 quiz lab 命名风格。
- 出题候选需先经用户过目确认，再写入 quiz.json。

## Acceptance Criteria

- [ ] lab-03-01 与 lab-03-02 各有约 15 道选择题，全部来自可核实出处；
- [ ] 每题在 quiz.json 的 `source` 字段写明出处（书名/考试 + 章节或题号），并有一份出处清单文档记录核对链接；
- [ ] 两道 lab 的目录名与 README 内容一致，仓库内无残留旧路径引用；
- [ ] 3.1 补上 lab.json 并挂载 `<QuizSet />`；
- [ ] 通过 `pnpm run validate:content` 与 `pnpm lab:validate` 校验；
- [ ] README 数量与完成清单同步更新。

## Notes

- Keep `prd.md` focused on requirements, constraints, and acceptance criteria.
- Lightweight tasks can remain PRD-only.
- For complex tasks, add `design.md` for technical design and `implement.md` for execution planning before `task.py start`.
