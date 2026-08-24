# 新增第 13 章盛最多水的容器编程题

## Goal

把用户提供的 LeetCode 11「盛最多水的容器」整理为第 13 章贪心算法下可运行、可自动评分、可在网站中发现的 Program Lab。读者需要通过标准输入输出实现相向双指针，并理解“每次移动短板”的贪心安全性。

## Background and confirmed facts

- 用户提供了本地题目稿：`/Users/shuoyuchen/Downloads/LeetCode_11_盛最多水的容器.md`。
- 题目稿包含题面、函数签名、6 组示例/测试、约束、贪心思路、复杂度和多语言参考代码；仓库的 Program Lab 接口要求改写为 C++17 标准输入/标准输出题面。
- 用户提供的题干图片为 801×383 PNG，展示数组 `[1,8,6,2,5,4,8,3,7]` 中最大盛水区域；图片应随 Lab 一起提交，避免依赖临时目录或外部链接。
- `content/chapter-13-greedy/` 当前只有 5 篇教材正文，没有 Lab；`.vitepress/content-index.ts` 的第 13 章定义目前没有 `autoLabChapter`。
- 现有可执行题采用 `labs/chapter-NN/lab-NN-LL-slug/`，Program 由 `README.md`、`lab.json`、薄 Makefile、`student/`、`solution/` 和 `tests/` 组成。
- Program 的 `tests/cases.json` 用例分值必须合计 100；`student/main.cpp` 要可编译但不能直接满分，`solution/main.cpp` 要稳定满分。
- 当前 `main` 工作树干净；用户要求新开分支以便后续提 PR，目标基线为 `main`。

## Requirements

### R1. 新增 Program Lab

创建 `labs/chapter-13/lab-13-01-container-with-most-water/`，使用 `type: "program"`、C++17、标准输入输出判题。题目要求：

- 输入 `n` 和长度为 `n` 的非负整数数组 `height`；
- 输出最大容水量；
- 明确面积公式 `min(height[l], height[r]) * (r - l)`；
- 明确需要 O(n) 时间、O(1) 额外空间，并解释移动短板的贪心依据；
- README 保留 LeetCode 题源名称、题号和来源链接，避免把爬取过程声明或本地路径带入课程内容；
- README 使用 Lab 内相对路径引用用户提供的图片，并提供有意义的中文 alt 文本。

### R2. 机器接口与测试

- `student/main.cpp` 提供可编译的起始骨架，不包含可直接通过全部测试的完整答案；
- `solution/main.cpp` 提供经过验证的 O(n) 参考实现；
- `tests/cases.json` 至少覆盖题目样例、最小 n、两端等高、单调/局部高点和极值或全零边界，分值合计 100；
- 预期输出文件使用 LF，比较模式选择与整数输出匹配的稳定模式；
- 保持固定三行 Lab Makefile，不在 Lab 内复制编译/判题逻辑。

### R3. 课程接入

- 在 `.vitepress/content-index.ts` 的第 13 章定义加入 `autoLabChapter: 13`，让该章未来新增的全部 Lab 自动进入统一 ContentIndex、Labs 首页、课程章节入口和侧栏；
- 在 `content/chapter-13-greedy/00-overview.md` 增加配套 Lab 入口，形成“阅读 → 实现 → 测试”的学习路径；
- 不在组件或侧栏中手写单独的 Lab 名单。

### R4. 分支与验证

- 在 `main` 基础上创建用于提 PR 的短期分支；
- 规划完成并获用户批准后才开始实现；
- 完成后运行 Lab 专项校验以及内容、类型、lint、discovery、build 和 built-site 检查，记录真实结果；
- 不推送、不创建远程 PR，除非用户后续明确要求。

## Acceptance Criteria

- [ ] 分支从最新本地 `main` 创建，工作树中无无关改动。
- [ ] `labs/chapter-13/lab-13-01-container-with-most-water/` 符合 Lab 路径、frontmatter、manifest 和薄 Makefile 合同。
- [ ] README 题面可独立完成，包含输入、输出、约束、样例、正常/边界情况、运行命令、完成清单和思考题。
- [ ] 题干图片存放在 Lab 内、相对链接可构建，alt 文本可读，最终页面不依赖 `/var/folders` 或外部图片 URL。
- [ ] `solution` 通过全部公开测试且为 100 分；`student` 可编译且初始不满分；cases 分值合计 100。
- [ ] 第 13 章课程入口、章节页、Labs 首页、搜索和侧栏能发现该 Lab，且链接使用统一 ContentIndex 路由。
- [ ] `pnpm lab:validate -- <lab>`、`pnpm lab:verify -- <lab>`、`pnpm run validate`、`pnpm run test:discovery`、`pnpm run build`、`pnpm run check:site` 通过；若环境允许，再运行 `pnpm run test:pages`。
- [ ] 最终报告包含分支名、变更文件、验证命令与结果，并明确未推送/未创建远程 PR。

## Out of scope

- 不新增多语言版本、Quiz Lab、Project Lab、运行时新组件或新的判题器能力。
- 不把 LeetCode 多语言函数签名直接作为仓库机器接口；课程题目统一采用标准输入输出。
- 不把用户 Downloads 文件或临时剪贴板路径纳入仓库。
- 不修改其他章节、既有 Lab 的题面/实现/测试或全局视觉样式。
- 不在本任务中推送分支、创建或合并远程 PR。
