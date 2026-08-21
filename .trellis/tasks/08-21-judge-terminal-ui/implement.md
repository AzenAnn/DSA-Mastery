# Judge 与 Lab CLI 终端视觉系统实施计划

## 1. Preconditions and ownership

- [x] 用户批准本次最终规划摘要。
- [x] 执行 `task.py start`，确认任务进入 `in_progress`。
- [x] 加载 `trellis-before-dev` 与 `content/lab-tooling.md`、`quality/validation-and-pages.md`。
- [x] 确认工作区只有本任务的 Trellis 与实现改动，不接管其他 dirty 文件。

## 2. Shared visual layer

- [x] 新增 `tools/lab/terminal.mjs`：自动颜色检测、ANSI theme、verdict/score/status/path/command helpers、pad-before-style、外部 VT 清理。
- [x] 为 `--no-color`、`NO_COLOR`、`TERM=dumb`、非 TTY、显式测试开关建立确定性 API。
- [x] 保证无第三方依赖，不修改 `pnpm-lock.yaml`。

## 3. Program and Project judge

- [x] 重构 `formatJudge`：彩色 verdict/score、PASS/NOT FULL、总耗时、WA 三段差异、CE/stderr 层级、单 case 重试命令。
- [x] 重构 `formatProject`：task 与嵌套 stdio/CTest 统一颜色，manual pending、automated/provisional summary 与 task/case 重试命令。
- [x] 保持 verdict、points、weightedScore、manualPending、internalError 和 run/score 退出码不变。

## 4. All human CLI output

- [x] 新增 `tools/lab/reporter.mjs`，覆盖 help/new/doctor/validate/build/verify/refresh/pack/clean/error。
- [x] 精简 `tools/lab/cli.mjs`，人类分支调用 reporter/formatters；JSON 分支继续直接序列化领域 report。
- [x] stderr/编译器/CMake/CTest 长日志只装饰标签并清理 VT 控制符，不改正文语义。
- [x] `interactive` 继续原样接管学生进程，不添加 CLI 颜色。

## 5. Automated tests

- [x] 新增 `tests/lab-terminal.test.mjs`，直接测试 theme、Program、Project 和 reporter 的有色/无色输出。
- [x] 更新 `test:lab-tools` 稳定入口以包含新测试文件，保持 Windows/Linux 一致。
- [x] 扩展 CLI 子进程测试：`--json`、`--no-color`、`NO_COLOR` 与错误输出不含 ANSI。
- [x] 断言 strip-ANSI 后表格列、状态文字、分数、摘要和重试命令稳定。

## 6. Documentation and executable contract

- [x] 更新 `docs/LAB_AUTHORING_GUIDE.md`：颜色语义、自动检测、无色入口与示例输出。
- [x] 更新 `.trellis/spec/content/lab-tooling.md`：人类输出视觉合同、JSON/退出码不变量和测试要求。
- [x] 如 Windows 学生指南直接描述输出，补充无需配置颜色、Make 缺失不影响 pnpm 入口。

## 7. Validation commands

- [x] `pnpm run test:lab-tools`
- [x] `pnpm run test:lab-docs`
- [x] `pnpm run test:lab-golden`
- [x] `pnpm lab:verify -- labs/chapter-01/lab-01-06-sequential-list-deduplication`
- [x] `pnpm lab:verify -- labs/chapter-04/lab-04-02-huffman-coding`
- [x] `pnpm run lint`
- [x] `pnpm test`
- [x] `git diff --check`
- [x] `git status --short`，确认无缓存、二进制或 fixture 污染。

## 8. Local visual acceptance

- [x] 在真实 TTY 中运行 Lab 01-06 满分场景，记录 Program 彩色 PASS 结果。
- [x] 使用 Golden starter 运行 WA/未满分场景，记录差异、红/绿分数与 Retry 提示。
- [x] 运行 Golden Project，记录 nested task、automated、manual pending 与 provisional total。
- [x] 运行对应 `--no-color` 和 `--json` 命令，证明纯文本/机器输出无 ANSI。
- [x] 向用户展示输出或截图并等待明确验收；验收前不提交、不推送、不创建 PR。

## 9. Commit and PR gate

- [x] 网络恢复后 `git fetch origin main`，将分支 rebase 到最新 `origin/main`，重新执行受影响门禁。
- [x] 按任务范围审查 diff，更新 Trellis acceptance/check 记录与必要规范。
- [x] 用户确认视觉效果后创建聚焦 commit：`feat(lab): improve terminal result presentation`。
- [x] 推送 `codex/feat/judge-terminal-ui` 并创建 PR；PR 记录读者价值、范围/非目标、真实命令、视觉证据、风险、AI 参与和人工复核要求。
- [x] 不自行合并；交由 Review Owner 与 CI。

## Rollback points

- 视觉层独立于领域结果；若共享 theme 出现兼容问题，可回退 `terminal.mjs/reporter.mjs` 及三处调用，不需要迁移 manifest、JSON 或测试数据。
- rebase 后若 Lab CLI 合同已变化，回到规划更新 PRD/design，再重新请求实现批准。
