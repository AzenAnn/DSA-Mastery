# 技术设计：LeetCode 409 最长回文串 Lab

## 边界

- 内容边界：`labs/chapter-13/lab-13-02-longest-palindrome/` 和第 13 章概览的配套 Lab 链接。
- 发现机制：继续使用 `.vitepress/content-index.ts` 的 `autoLabChapter: 13`，不添加手工 `labSources`。
- 机器接口：复用现有 Program Lab v1，C++17、标准输入/输出、token 比较器。

## 数据流

题目输入 → `student/main.cpp` 或 `solution/main.cpp` → `tests/cases.json` 指定的标准输出文件 → Lab CLI 评分 → ContentIndex 自动收录 → Labs 页面与章节概览链接。

## 文件结构

```text
labs/chapter-13/lab-13-02-longest-palindrome/
├── README.md
├── lab.json
├── Makefile
├── student/main.cpp
├── solution/main.cpp
└── tests/
    ├── cases.json
    ├── 001-sample.in/.out
    ├── 002-single.in/.out
    ├── 003-all-even.in/.out
    ├── 004-multiple-odd.in/.out
    ├── 005-case-sensitive.in/.out
    ├── 006-repeated.in/.out
    └── 007-long-input.in/.out
```

## 算法与接口

- 输入：第一行字符串 `s`；输出：可构造的最长回文串长度。
- 参考实现使用 128 或 52 大小的计数结构，累加每个字符的最大偶数贡献，并在存在奇数剩余时增加一个中心字符。
- 使用 `int` 足以覆盖题目给定 `s.length <= 2000`；实现不依赖哈希遍历顺序。
- 学生模板读取输入并输出占位结果，确保可编译且由测试证明尚未完成。

## 兼容性与回滚

- 不改变共享 CLI、Schema、站点组件或已有 Lab。
- 若内容验证失败，可独立回滚新 Lab 目录和概览中的单条链接。
- 不触碰工作区现有未跟踪的 `tools/vscode-extension/`。
