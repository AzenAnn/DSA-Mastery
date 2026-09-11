# Ch15：新增 21 道回溯与搜索代码题及练习导航

## Goal

将用户指定的21道回溯与搜索题接入第15章Exercise，使学习者能从章节侧栏进入题目、编写C++解答并在本地评分。

## Requirements

### R1. 题目与顺序

新增下表全部代码题，稳定编号和展示顺序与用户清单一致。每题保留官方链接，去掉追踪参数。

| Lab ID | 题目 | 官方来源 |
| --- | --- | --- |
| 15E01 | 全排列问题 | https://www.luogu.com.cn/problem/P1706 |
| 15E02 | 组合的输出 | https://www.luogu.com.cn/problem/P1157 |
| 15E03 | 子集 | https://leetcode.cn/problems/subsets/ |
| 15E04 | 选数 | https://www.luogu.com.cn/problem/P1036 |
| 15E05 | 电话号码的字母组合 | https://leetcode.cn/problems/letter-combinations-of-a-phone-number/ |
| 15E06 | 迷宫 | https://www.luogu.com.cn/problem/P1605 |
| 15E07 | 奇怪的电梯 | https://www.luogu.com.cn/problem/P1135 |
| 15E08 | 马的遍历 | https://www.luogu.com.cn/problem/P1443 |
| 15E09 | 括号生成 | https://leetcode.cn/problems/generate-parentheses/ |
| 15E10 | 组合总和 | https://leetcode.cn/problems/combination-sum/ |
| 15E11 | 子集 II | https://leetcode.cn/problems/subsets-ii/ |
| 15E12 | 全排列 II | https://leetcode.cn/problems/permutations-ii/ |
| 15E13 | 组合总和 II | https://leetcode.cn/problems/combination-sum-ii/ |
| 15E14 | 单词搜索 | https://leetcode.cn/problems/word-search/ |
| 15E15 | 分割回文串 | https://leetcode.cn/problems/palindrome-partitioning/ |
| 15E16 | N 皇后 | https://leetcode.cn/problems/n-queens/ |
| 15E17 | 解数独 | https://leetcode.cn/problems/sudoku-solver/ |
| 15E18 | 八数码难题 | https://www.luogu.com.cn/problem/P1379 |
| 15E19 | 小木棍 | https://www.luogu.com.cn/problem/P1120 |
| 15E20 | 靶形数独 | https://www.luogu.com.cn/problem/P1074 |
| 15E21 | 骑士精神 | https://www.luogu.com.cn/problem/P2324 |

### R2. 完整代码题

- 每题具有中文题面、准确范围、输入输出、样例、学习目标、前置知识、关键边界、复杂度分析、运行命令和完成清单。
- 提供可编译且非满分的学生骨架、独立编写的参考实现、合计100分的固定测试；参考实现覆盖声明的完整输入范围。
- 测试覆盖样例、正常情况、边界和典型错误，数量服从有效覆盖，不重复输入凑数。
- 洛谷题遵循当前官方合同；力扣题说明从函数到stdio的适配，明确结果顺序、空集合和空子集表示。
- 不改变来源的合法输入、问题目标或解的含义，不复制第三方题解或隐藏测试。新内容保持draft，等待知识审阅。

### R3. 导航与验证

- ch15概览、教材和Lab页面侧栏能够展开Exercise，按15E01至15E21访问全部题目；复用现有分类样式与空状态。
- 新题进入Labs总目录和搜索，桌面与移动端均可访问。
- 21题全部通过统一Lab验证；样例、集合结果、最短步数和最优分数具有独立核验依据。
- 内容、类型、lint、构建及链接检查通过，覆盖根路径和Pages子路径；完成后报告验证结果与本地预览URL。

## Acceptance Criteria

- [x] AC1 (R1): 恰有21个新Exercise，ID、题名、顺序、链接与上表一致。
- [x] AC2 (R2): 21题均具备完整题面、学生骨架、参考实现、评分配置和有区分力的测试。
- [x] AC3 (R2, R3): 全部参考实现100/100，学生骨架可编译且低于100分，固定答案无漂移。
- [x] AC4 (R2, R3): 样例与测试一致，关键输出上限、去重、最短路及最优分数通过独立核验。
- [x] AC5 (R3): ch15侧栏显示21条正确排序的Exercise，Theory/Project保持真实空态，索引与搜索能找到新题。
- [x] AC6 (R3): 桌面和390px移动端真实点击通过，无页面错误、同源断链或根页面横向溢出。
- [x] AC7 (R3): 项目门禁和Pages验证通过；任务文件已检查，未知来源的图缓存变化单独记录并保留。

## Background

- 已同步origin，并从最新origin/main创建 `feat/ch15-backtracking-exercises`；分支创建时工作区干净。
- `.vitepress/content-index.ts:402` 已有ch15教材编排但尚无Lab自动收录，仓库尚无 `labs/chapter-15/`。
- 2026-09-11用户先后确认创建任务、规划及实施。本任务是一套章节练习及其入口的一次集成交付。

## Out of Scope

- 重写ch15教材、修改其他章节、重排既有Lab身份。
- 新增Quiz、Project、算法可视化、判题器或VS Code插件功能。
- 修改全站样式、依赖或发布流程。
- 自动提交、推送、创建PR、合并或发布。
