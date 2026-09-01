# Journal - Azen (Part 1)

> AI development session journal
> Started: 2026-08-10

---



## Session 1: 重写第 0 章并修复代码块渲染

**Date**: 2026-08-10
**Task**: 重写第 0 章并修复代码块渲染
**Branch**: `feat/trellis-vitepress-migration`

### Summary

重写第 0 章数据结构基础概念与算法复杂度文章，更新导航与测试，并修复深色代码框在浅色主题下对比度不足的问题。

### Git Commits

| Hash | Message |
|------|---------|
| `d5e77cf` | (see git log) |

### Status

[OK] **Completed**


## Session 2: 完成线性表第 3、4 篇文章

**Date**: 2026-08-14
**Task**: 完成线性表第 3、4 篇文章
**Branch**: `codex/linear-list-articles-3-4`

### Summary

补全链表演进设计与顺序表/链表比较选型文章，接入课程导航和搜索，验证 C++17 示例、完整构建、Pages 子路径及桌面/移动预览。

### Git Commits

| Hash | Message |
|------|---------|
| `d1e630d` | (see git log) |

### Status

[OK] **Completed**


## Session 3: DSA Mastery 理论文档语法与视觉系统

**Date**: 2026-08-16
**Task**: DSA Mastery 理论文档语法与视觉系统
**Branch**: `codex/dsa-mastery-theory-doc-style`

### Summary

新增 11 种理论语义容器、行内高亮和代码文件名工具栏，统一浅暗主题与代码工作台；迁移两篇 Chapter 0 教材，补齐作者指南、三层测试、Trellis 规范并完成 Pages 验收。

### Git Commits

| Hash | Message |
|------|---------|
| `5f7bcd3` | (see git log) |
| `3ef6fcb` | (see git log) |

### Status

[OK] **Completed**


## Session 4: 前言理论语法展示页

**Date**: 2026-08-16
**Task**: 前言理论语法展示页
**Branch**: `codex/dsa-mastery-theory-doc-style`

### Summary

新增独立前言章节与唯一理论环境展示文档，接入显式标签、搜索、侧栏和跨平台校验，完成根路径与 Pages base 的构建及 14 项浏览器验收。

### Git Commits

| Hash | Message |
|------|---------|
| `39e9cc0` | (see git log) |
| `b24e18f` | (see git log) |

### Status

[OK] **Completed**


## Session 5: Unified Lab update workflow

**Date**: 2026-08-17
**Task**: Unified Lab update workflow
**Branch**: `codex/unified-lab-update-workflow`

### Summary

Implemented and independently verified the unified Quiz, Program, and Project Lab authoring, judging, Make, packaging, CI, migration, and documentation workflow.

### Git Commits

| Hash | Message |
|------|---------|
| `6bf9df6` | (see git log) |
| `56422aa` | (see git log) |
| `6ae4ab0` | (see git log) |
| `c975836` | (see git log) |
| `732c398` | (see git log) |

### Status

[OK] **Completed**


## Session 6: Chapter 1 list workload Project Lab

**Date**: 2026-08-20
**Task**: Chapter 1 list workload Project Lab
**Branch**: `lab/ch01-list-workload-project`

### Summary

Implemented and verified Lab 01-21 with dual list implementations, deterministic workload runner, grading, student package, Chapter 1 site integration, and local preview.

### Git Commits

| Hash | Message |
|------|---------|
| `afca69d` | (see git log) |

### Status

[OK] **Completed**


## Session 7: Lab 命令与接口指南

**Date**: 2026-08-21
**Task**: Lab 命令与接口指南
**Branch**: `codex/docs-lab-cli-guide`

### Summary

审计并整理 Quiz、Program、Project 的 pnpm/Make 操作与参数，新增前言指南、导航接入和三层验证，完成桌面/移动及浅暗主题本地预览。

### Git Commits

| Hash | Message |
|------|---------|
| `cec757f` | (see git log) |

### Status

[OK] **Completed**


## Session 8: 第三章串匹配文本处理引擎工程题

**Date**: 2026-08-21
**Task**: 第三章串匹配文本处理引擎工程题
**Branch**: `chapter/03-string-array`

### Summary

实现 lab-03-14 串匹配与文本处理引擎（matcher stdio 30 + engine CTest 50 + report manual 20），合并远端第三章 Lab 重排（理论 03-01~04、实验 03-05~09），同步编号引用、总览与页面测试，清理旧编号缓存残留。全部门禁通过。

### Main Changes

- 实现 lab-03-14：统一 Matcher 契约下朴素/KMP/nextval + 文本处理命令 + UTF-8 边界 + 固定 seed 工作负载
- 合并远端 PR #49 重排并更新工程题引用（03-05~09）与第三章侧栏测试（理论 4 / 实验 5 / 工程 1）
- 修复合并引入的 QuizSet.vue 未用变量 lint 报错，移除旧编号目录缓存残留

### Git Commits

| Hash | Message |
|------|---------|
| `6d7e8eb` | (see git log) |
| `70ecc6a` | (see git log) |
| `45241de` | (see git log) |
| `eb7e620` | (see git log) |
| `a5d370f` | (see git log) |
| `09b740c` | (see git log) |
| `c21635b` | (see git log) |
| `4983274` | (see git log) |
| `d96a6b6` | (see git log) |

### Testing

- [OK] lab:verify 参考 80/80、学生骨架 31.5/80、人工 20 待评
- [OK] pnpm test 全绿（51 个 Lab、161 个 HTML）
- [OK] test:pages 19/19

### Status

[OK] **Completed**

### Next Steps

- 推送 chapter/03-string-array 分支并开 PR


## Session 9: 第 4 章树与二叉树两篇文章重写

**Date**: 2026-08-23
**Task**: 第 4 章树与二叉树两篇文章重写
**Branch**: `chapter4`

### Summary

在 chapter4 分支重写树的基本概念与存储结构、二叉树两篇理论文章，删除旧 Demo，完成 C/C++、完整测试及桌面/移动端验收。

### Git Commits

| Hash | Message |
|------|---------|
| `720d7c8` | (see git log) |
| `13beb89` | (see git log) |

### Status

[OK] **Completed**


## Session 10: 第 4 章树与二叉树理论题

**Date**: 2026-08-24
**Task**: 第 4 章树与二叉树理论题
**Branch**: `codex/chapter4-theory-exercises`

### Summary

新增 Lab 04-15～04-22，共 117 道选择题和 16 道综合题；更新目录与作者规范，完成本地和 Pages 校验，并创建 PR #58。

### Main Changes

- 新增 8 个第 4 章 Theory Quiz Lab，并写入章节概览。
- 按验收反馈移除来源、来源链接与题目标识，保留稳定内部 ID。
- 同步 Lab 作者规范、迁移追踪和 Windows 指南。

### Git Commits

| Hash | Message |
|------|---------|
| `076cd97` | (see git log) |

### Testing

- [OK] pnpm test
- [OK] Pages base 构建、check:site 与 test:pages（19/19）
- [OK] 8 个 Lab、117/16 题量、唯一 ID 和隐藏字段专项审计

### Status

[OK] **Completed**

### Next Steps

- Review Owner 独立核对题面、答案、解析与版权适用性后合并 PR #58。


## Session 11: 完成第 5 章树的应用并创建 PR

**Date**: 2026-08-24
**Task**: 完成第 5 章树的应用并创建 PR
**Branch**: `chapter05`

### Summary

完成 Ch.5 六篇树应用教材与三个空 Lab 分类接口，将旧图内容迁移到 Ch.6/Ch.7，验证后创建 PR #61。

### Main Changes

- 新增 Ch.5 树的应用 22 个指定小节并切换为 review
- 复用统一 ContentIndex 显示 Theory/Exercise/Project 三个空槽位
- 迁移旧图正文与 BFS/Dijkstra Lab 到物理 Ch.6/Ch.7

### Git Commits

| Hash | Message |
|------|---------|
| `a6d8c81` | (see git log) |

### Testing

- [OK] pnpm test 通过
- [OK] pnpm run test:pages 20/20 通过
- [OK] 最终 validate/build/check:site 与 C++ 示例语法检查通过

### Status

[OK] **Completed**

### Next Steps

- 由 Review Owner 在 PR #61 完成人工知识审阅，勿由作者自行合并


## Session 12: 第 5 章树结构题库 Lab

**Date**: 2026-08-24
**Task**: 第 5 章树结构题库 Lab
**Branch**: `codex/chapter05-tree-labs`

### Summary

从本地 09 至 13 题库生成五个 Chapter 5 Theory Quiz Lab，共 67 道选择题和 9 道综合题；清除公开来源痕迹，更新课程入口与测试合同，并完成构建、页面和浏览器验收。

### Git Commits

| Hash | Message |
|------|---------|
| `baa23fe` | (see git log) |

### Status

[OK] **Completed**


## Session 13: README 信息架构与视觉改版

**Date**: 2026-08-26
**Task**: README 信息架构与视觉改版
**Branch**: `codex/readme-redesign`

### Summary

重写根 README，新增课程全景与 Lab 模式插图，完成全量测试和本地 GitHub 风格预览。

### Git Commits

| Hash | Message |
|------|---------|
| `6456397` | (see git log) |

### Status

[OK] **Completed**


## Session 14: Chapter 1 array-to-linked-list problem-solving article

**Date**: 2026-08-31
**Task**: Chapter 1 array-to-linked-list problem-solving article
**Branch**: `codex/ch01-array-to-linked-list-problem-solving`

### Summary

Added an in-depth Chapter 1 article that maps array problem-solving skills to linked-list invariants and pointer operations, integrated it into the website content index, completed full validation and browser preview, and opened PR #109.

### Git Commits

| Hash | Message |
|------|---------|
| `84dbb44` | (see git log) |

### Status

[OK] **Completed**


## Session 15: Chapter 14 dynamic programming foundations

**Date**: 2026-08-31
**Task**: Chapter 14 dynamic programming foundations
**Branch**: `Azen-ch14`

### Summary

Completed five Chapter 14 dynamic programming lessons, integrated the chapter into the curriculum and empty Lab categories, added navigation coverage, compiled all 22 C++17 examples, and verified the site across desktop/mobile and light/dark themes.

### Git Commits

| Hash | Message |
|------|---------|
| `b0e0552` | (see git log) |

### Status

[OK] **Completed**


## Session 16: Lab stable IDs and automatic numbering

**Date**: 2026-08-31
**Task**: Lab stable IDs and automatic numbering
**Branch**: `codex/lab-stable-id`

### Summary

Added permanent chapter/type Lab IDs, automatic allocation and lookup, migrated existing content without renaming paths, updated site and VS Code consumers, documented the workflow, and simplified sidebar labels to show only the stable ID plus problem name.

### Git Commits

| Hash | Message |
|------|---------|
| `0bbec8e` | (see git log) |
| `e11f1f9` | (see git log) |
| `966557a` | (see git log) |
| `3a8c01e` | (see git log) |
| `5f0c328` | (see git log) |

### Status

[OK] **Completed**


## Session 17: Normalize all Lab navigation labels

**Date**: 2026-08-31
**Task**: Normalize all Lab navigation labels
**Branch**: `codex/lab-stable-id`

### Summary

Unified both categorized 本章 Labs and legacy 相关 Labs sidebar paths so every chapter displays only the stable Lab ID plus problem name, and updated discovery, desktop, mobile, task, and architecture contracts.

### Git Commits

| Hash | Message |
|------|---------|
| `90a26ca` | (see git log) |

### Status

[OK] **Completed**


## Session 18: Resolve PR 119 CI failures

**Date**: 2026-08-31
**Task**: Resolve PR 119 CI failures
**Branch**: `codex/lab-stable-id`

### Summary

Investigated GitHub Actions logs, updated stale stable-ID artifact assertions, separated dependency-free Lab ID parsing from repository authoring dependencies, lazy-loaded new/locate commands, added detached student-package regression coverage, and verified Make, Pages, discovery, and browser gates.

### Git Commits

| Hash | Message |
|------|---------|
| `ead8db8` | (see git log) |
| `388cfe0` | (see git log) |

### Status

[OK] **Completed**


## Session 19: 稳定 Lab 文档标题约束

**Date**: 2026-09-01
**Task**: 稳定 Lab 文档标题约束
**Branch**: `codex/lab-stable-id`

### Summary

定义 README 标题从 labId 生成的统一格式，更新 Agent/作者约束、脚手架和渐进迁移校验，并新增旧目录稳定标题的自动发现回归。

### Git Commits

| Hash | Message |
|------|---------|
| `5f0a637` | (see git log) |

### Status

[OK] **Completed**


## Session 20: Labs 三分类目录迁移

**Date**: 2026-09-01
**Task**: Labs 三分类目录迁移
**Branch**: `codex/lab-category-directories`

### Summary

将 173 个 Lab 迁移到 theory、exercise、project 分类目录，更新网站、CLI、校验器和 VS Code 插件，并完成全量本地与 Pages 测试。

### Git Commits

| Hash | Message |
|------|---------|
| `917b482` | (see git log) |

### Status

[OK] **Completed**


## Session 21: Chapter 14 dynamic programming exercise labs

**Date**: 2026-09-01
**Task**: Chapter 14 dynamic programming exercise labs
**Branch**: `codex/chapter-14-dp-labs`

### Summary

Added 30 C++17 dynamic programming Program Labs (14E01-14E30), each with 20 public cases, independent generator/oracles, chapter overview synchronization, and complete repository/site verification.

### Git Commits

| Hash | Message |
|------|---------|
| `1c3aadb` | (see git log) |

### Status

[OK] **Completed**
