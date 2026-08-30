# 实施计划：LeetCode 409 最长回文串 Lab

## 顺序清单

1. 将任务切换为 `in_progress`，读取实施阶段上下文并确认工作区状态。
2. 按现有 Program Lab 模板新建目录、README、manifest、Makefile、student/solution 源码和测试输入输出。
3. 在第 13 章概览补充 Lab 13-02 的链接。
4. 先验证 student 的失败行为，再验证 solution 的编译、全部 case 和严格满分；必要时用 `refresh-expected --write` 生成 LF 标准输出。
5. 运行内容校验、发现测试、站点构建和 Lab verify；检查链接、题源清洗、无绝对路径和无重复静态答案。

## 验证命令

```bash
pnpm lab:validate -- labs/chapter-13/lab-13-02-longest-palindrome --no-color
pnpm lab:verify -- labs/chapter-13/lab-13-02-longest-palindrome --no-color
pnpm run validate
pnpm run test:discovery
pnpm run build
pnpm run check:site
```

## 风险与回滚点

- 风险：Lab 编号、frontmatter、manifest 路径或 cases 分值不一致；通过 `lab:validate` 在提交前拦截。
- 风险：奇数字符中心逻辑、大小写区分或长度边界遗漏；通过针对性 case 和参考实现复核拦截。
- 风险：章节概览手工链接与自动索引重复；仅修改现有“配套 Lab”说明，不修改自动索引。
- 回滚：删除新 Lab 目录并撤销概览新增链接即可，不影响其他章节。
