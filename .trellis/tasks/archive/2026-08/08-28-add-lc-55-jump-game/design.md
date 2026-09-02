# 技术设计：LeetCode 55 跳跃游戏 Lab

## 边界

- 内容边界：`labs/chapter-13/lab-13-03-jump-game/` 和第 13 章概览的配套 Lab 链接。
- 发现机制：继续使用 `.vitepress/content-index.ts` 的 `autoLabChapter: 13`，不添加手工 `labSources`。
- 机器接口：复用现有 Program Lab v1，C++17、标准输入/输出、token 比较器。

## 数据流

输入数组 → `student/main.cpp` 或 `solution/main.cpp` → `tests/cases.json` 指定的标准输出文件 → Lab CLI 评分 → ContentIndex 自动收录 → Labs 页面与章节概览链接。

## 文件结构

```text
labs/chapter-13/lab-13-03-jump-game/
├── README.md
├── lab.json
├── Makefile
├── student/main.cpp
├── solution/main.cpp
└── tests/
    ├── cases.json
    ├── 001-sample-reachable.in/.out
    ├── 002-sample-unreachable.in/.out
    ├── 003-single.in/.out
    ├── 004-zero-barrier.in/.out
    ├── 005-early-finish.in/.out
    ├── 006-exact-reach.in/.out
    └── 007-long-reachable.in/.out
```

## 算法与接口

- 输入：第一行整数 `n`，第二行 `n` 个非负整数 `nums[i]`；输出 `true` 或 `false`。
- 参考实现维护 `maxReach`，表示扫描到当前位置前能够到达的最远下标。
- 若当前 `i > maxReach`，当前位置不可达，立即输出 `false`；否则更新 `maxReach = max(maxReach, i + nums[i])`。
- 若扫描完成仍未遇到不可达位置，则输出 `true`；`n == 1` 自然可达。
- 为避免整数溢出和无必要的提前终止歧义，`maxReach` 使用 `long long` 或在题目范围内安全的整数类型；输出严格为小写 `true`/`false`。

## 兼容性与回滚

- 不改变共享 CLI、Schema、站点组件或已有 Lab。
- 若内容验证失败，可独立删除新 Lab 目录并撤销概览中的单条链接。
- 保留用户已有的 `lab-13-01` 学生代码修改和 `tools/vscode-extension/` 未跟踪目录。
