# 新增 LeetCode 409 最长回文串 Lab

## Goal

将用户提供的 LeetCode 409「最长回文串」题目加入第 13 章“贪心算法”，形成可运行、可评分、可被课程网站自动发现的 C++ Program Lab。

## Background

- 题目资料来源：`/Users/shuoyuchen/Downloads/lc_409_最长回文串_完整数据.md`。
- 第 13 章已通过 `autoLabChapter: 13` 自动收录 `labs/chapter-13/` 下的 Lab。
- 当前已有 `Lab 13-01：盛最多水的容器`，新题应使用下一个编号 `Lab 13-02`。
- 题目核心是统计字符出现次数：每种字符优先贡献最大偶数个字符，若存在未使用的奇数个字符，再放置一个中心字符。

## Requirements

- 新建 `labs/chapter-13/lab-13-02-longest-palindrome/`，包含 README、v1 `lab.json`、薄 Makefile、student/solution C++17 源码和完整测试目录。
- README 使用课程 Lab 格式，说明学习目标、题意、输入输出、约束、示例、贪心思路、复杂度、运行命令、完成清单、思考题和题目来源。
- 学生模板必须可编译但不能直接通过全部测试；参考答案必须实现 O(n) 时间、O(Σ) 额外空间的正确算法。
- 测试覆盖样例、单字符、全偶数、多个奇数、大小写区分、重复字符和最大长度/计数边界；测试总分为 100。
- 在 `content/chapter-13-greedy/00-overview.md` 的“配套 Lab”中补充 Lab 13-02 链接；不得新增重复的手工 Lab 索引。
- 清除个人题库导入痕迹：课程内容不得引用 Downloads 绝对路径、个人可视化入口或生成过程声明；可保留 LeetCode 题号、名称和公开题源链接。

## Out of Scope

- 不修改 LeetCode 原题，不新增 Quiz 或 Project 类型 Lab。
- 不重写第 13 章其他教材正文，不调整全局 Lab 导航、侧栏组件或 ContentIndex 的自动收录机制。
- 不把完整参考代码复制到教材正文；实现和测试只放在 Lab 目录。

## Acceptance Criteria

- [ ] `labs/chapter-13/lab-13-02-longest-palindrome/README.md` 可从干净检出按文档命令运行，并明确题目、边界和完成标准。
- [ ] `lab.json`、Makefile、目录编号和 frontmatter 的 `chapter/order` 一致，且通过 `pnpm lab:validate -- <lab-path>`。
- [ ] `solution` 通过全部公开测试并获得 100 分；`student` 可编译且初始状态未满分。
- [ ] 测试验证大小写敏感、奇数中心字符、全偶数、单字符和长度上限等行为，cases 总分恰为 100。
- [ ] 第 13 章概览能点击进入 Lab 13-02，网站索引/搜索/build 能自动发现该 Lab。
- [ ] `pnpm run validate`、`pnpm run test:discovery`、`pnpm run build` 和相关 Lab `verify` 通过；工作区中除本任务文件外不覆盖用户已有的 `tools/vscode-extension/` 未跟踪变更。

## Open Questions

无。题型、编号、目录位置和验收范围已由仓库结构与用户提供的题目资料确定。
