# 旧 Lab 渐进迁移清单

> 更新日期：2026-08-24 · 迁移接口以 [Lab 更新与测试指南](LAB_AUTHORING_GUIDE.md)为准。

常规 manifest 迁移不改变既有 URL，也不要求一次重写全部 Lab。第 1 章在 2026-08-18 经显式决策删除三个 Demo 并整体重编号，是一次不保留旧 URL 的结构迁移例外。只有对应章节实际进入维护周期、题面与参考实现有人负责 Review 时才迁移；分类是候选，不代替 Owner 的学习目标判断。

## 已完成的 v1 Golden 与 Quiz

- [x] `lab-00-03-complexity-quiz`：Golden Quiz
- [x] `lab-01-06-sequential-list-deduplication`：Golden Program
- [x] `lab-08-03-avl-tree-rotations`：Golden Project
- [x] `lab-01-01`～`lab-01-05`：Quiz manifest 迁移
- [x] `lab-03-01-string-basics-quiz` / `lab-03-02-string-matching-quiz`：原 Program 候选改名转 Quiz（串基础与模式匹配选择题）
- [x] `lab-04-15`～`lab-04-22`：树与二叉树八组理论 Quiz（117 道选择题、16 道综合题）
- [x] `lab-06-01-bst-operations` → `lab-08-02-bst-operations`：迁为 Program，随第 8 章分类重编号
- [x] `lab-06-02-hash-table` → `lab-09-02-hash-table`：迁为 Program，随第 9 章分类重编号
- [x] `lab-06-03-search-theory-quiz`：拆分为 `lab-08-01`（查找 6 题）与 `lab-09-01`（散列与索引 18 题）

## README-only 保留

- [ ] `lab-00-01-learning-map`：纯学习地图；没有机器执行需求时继续 README-only。

## Program 候选

- [ ] `lab-00-02-operation-counter`
- [ ] `lab-02-01-stack-simulator`
- [ ] `lab-02-02-cycle-queue`
- [ ] `lab-04-01-binary-tree-traversal`
- [ ] `lab-07-05-bfs-maze`（由旧物理 Ch.5 路径迁入 Ch.7）
- [ ] `lab-07-06-dijkstra-path`（由旧物理 Ch.5 路径迁入 Ch.7）

每项迁移必须补齐：stdin/stdout、可编译 starter、经审阅 solution、合计 100 的 normal/boundary/regression cases、薄 Makefile、`verify` 证据和学生包检查。

## Project 候选

（当前无候选。`lab-10-01-stability-compare` 与 `lab-10-02-performance-benchmark` 已随排序专题 Labs 迁移到 autoLabChapter 机制时删除。）

升级前先证明存在多个可独立验收 task、共享接口或人工分；否则保持 Program，避免为目录复杂度而使用 Project。

## 每次迁移的关闭条件

- [ ] 原 README 知识内容、frontmatter 和公开 URL 保持兼容；若任务明确批准重编号，记录映射与 404 风险。
- [ ] `pnpm lab:validate -- <path>` 与 `pnpm lab:verify -- <path>` 通过。
- [ ] reference 自动满分，starter 可编译且非满分。
- [ ] README 的 `make run` 与 pnpm 兜底在干净环境复现。
- [ ] `pnpm test` 与相关 Pages 流程通过。
- [ ] Review Owner 独立核对题解、测试充分性和版权来源。
