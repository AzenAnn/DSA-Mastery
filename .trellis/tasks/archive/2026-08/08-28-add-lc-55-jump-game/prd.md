# 新增 LeetCode 55 跳跃游戏 Lab

## Goal

将用户提供的 LeetCode 55「跳跃游戏」题目加入第 13 章“贪心算法”，形成可运行、可评分、可被课程网站自动发现的 C++ Program Lab。

## Background

- 题目资料来源：`/Users/shuoyuchen/Downloads/lc_55_跳跃游戏_完整数据 (2).md`。
- 第 13 章通过 `autoLabChapter: 13` 自动收录 `labs/chapter-13/` 下的 Lab。
- 当前分支已有 Lab 13-01“盛最多水的容器”和 Lab 13-02“最长回文串”，新题编号为 Lab 13-03。
- 题目目标是判断是否能到达最后一个下标；推荐使用正向贪心维护最远可达位置。

## Requirements

- 新建 `labs/chapter-13/lab-13-03-jump-game/`，包含 README、v1 `lab.json`、薄 Makefile、student/solution C++ 源码和完整测试目录。
- README 使用课程 Lab 格式，说明学习目标、前置知识、题意、输入输出、约束、示例、贪心思路、复杂度、运行命令、完成清单、思考题和题目来源。
- 学生模板必须可编译但不能直接通过全部测试；参考答案必须实现 O(n) 时间、O(1) 额外空间的贪心算法。
- 测试覆盖可达样例、不可达样例、单元素、零步障碍、提前到达终点、最远可达边界和较长输入；测试总分为 100。
- 在 `content/chapter-13-greedy/00-overview.md` 的“配套 Lab”中补充 Lab 13-03 链接；不得新增重复的手工 Lab 索引。
- 清除个人题库导入痕迹：课程内容不得引用 Downloads 绝对路径、个人状态、错误代码复盘或生成过程声明；可保留 LeetCode 题号、名称和公开题源链接。

## Out of Scope

- 不新增 Quiz 或 Project 类型 Lab，不修改共享 Lab CLI、Schema、导航组件或其他章节。
- 不把完整个人题库导出内容原样复制进课程；只提取完成题目所需的题面、约束、示例和贪心解释。
- 不修改用户当前已有的 `labs/chapter-13/lab-13-01-container-with-most-water/student/main.cpp` 未提交变更，也不处理 `tools/vscode-extension/` 未跟踪目录。

## Acceptance Criteria

- [ ] `labs/chapter-13/lab-13-03-jump-game/README.md` 可从干净检出按文档命令运行，并明确题目、边界和完成标准。
- [ ] `lab.json`、Makefile、目录编号和 frontmatter 的 `chapter/order` 一致，且通过 `pnpm lab:validate -- <lab-path>`。
- [ ] `solution` 通过全部公开测试并获得 100 分；`student` 可编译且初始状态未满分。
- [ ] 测试验证可达、不可达、单元素、零步障碍和终点边界等行为，cases 总分恰为 100。
- [ ] 第 13 章概览能点击进入 Lab 13-03，网站索引、搜索和 build 能自动发现该 Lab。
- [ ] `pnpm run validate`、`pnpm run test:discovery`、`pnpm run build` 和相关 Lab `verify` 通过。

## Open Questions

无。Lab 类型、章节编号、目录位置、算法目标和验收范围已由仓库结构与用户提供的题目资料确定。
