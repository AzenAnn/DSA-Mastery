# CH12 十三个可评分 Lab 实施计划

1. 读取内容、Lab 和质量规范，确认 frontmatter、目录发现、评分与验证契约。
2. 建立 13 个 Lab 的测试清单；为每题准备至少 10 个公开测试和 cases.json。
3. 改造现有 12-01～12-03：学生模板改为可编译 TODO，补充 README 与测试。
4. 新建 12-04～12-13 的 README、lab.json、Makefile、学生模板与测试，运行评分确认占位实现不能满分。
5. 按题逐个实现 C++17 参考答案，每完成一题运行对应 lab:verify，直到全部通过。
6. 更新 CH12 教材页，为 13 个 Lab 补充原创导读、C++ 核心模板、边界和复杂度说明。
7. 运行 13 个 Lab 的严格验证，以及内容校验、Lab 文档校验、发现测试、类型检查和站点构建。
8. 检查 Git 差异，只保留 CH12 教材、CH12 Labs 和必要索引变更，不纳入无关文件。

## 验证命令

```powershell
pnpm lab:verify -- labs/chapter-12/lab-12-01-hanoi-recursion
# 依次验证至 lab-12-13
pnpm validate:content
pnpm test:lab-docs
pnpm test:discovery
pnpm typecheck
pnpm build
```

## 完成定义

- 13 个参考实现全部严格验证通过；
- 每个 Lab 至少 10 个测试点且总分为 100；
- 每个学生模板可编译、带 TODO、初始状态不能满分；
- 教材入口与 Lab 发现结果一致；
- 全站关键校验通过，无本任务新增警告或错误。
