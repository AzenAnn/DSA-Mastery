# 统一 Lab 更新机制：完成审计

> 审计日期：2026-08-17 · 执行者：Azen / Codex · 分支：`codex/unified-lab-update-workflow`

## 结论

T1～T12 的仓库内实现与自动验证已完成，并由独立 Reviewer 在两份干净、已提交的临时快照中复现通过。需要外部状态的两项——GitHub Actions 实际运行、真实 PR 的维护者批准——已配置为合并门禁，但只有提交/推送后才能形成真实外部证据，不能在本地伪造为已完成。

## T1：平台与工具链

- Windows 原生为一等平台；Linux/macOS/WSL 共享同一 CLI；Dev Container/Codespaces 明确为可选。
- `make run` 首选，GNU Make 推荐但非必需；`pnpm lab:run` 是免 Make 兜底，并支持从 Lab 子目录调用。
- 默认 C++17，单 Lab 可显式 C++20；最低 GCC 11、Clang 14、MSVC 19.30、CMake 3.25。
- `doctor` 只读探测 Node、编译器、CMake/Make，不安装或修改 PATH。
- 本机证据：Windows x64、Node 24.14、Clang 21.1、CMake 4.0.3；没有 `make` 命令时 pnpm 正常，GNU-compatible `mingw32-make` 用于 Make 合同验证。

## T2：Schema

- 新增 `schemas/lab.schema.json`、`quiz.schema.json`、`cases.schema.json`、`task.schema.json`。
- runtime 语义校验覆盖 v1/type、三类内容、绝对/`..`/realpath 越界、ID、分值、权重、依赖存在与环。
- README-only Lab 保持兼容；当前 8 个新式 manifest，15 个旧 Lab 未被强制重写。
- 自动测试覆盖坏版本、越界、分值、环、Schema JSON 身份；Windows 符号链接创建受策略限制而 skip，Linux CI 会执行同一用例。

## T3：CLI 与脚手架

- 11 个 package 入口：new/doctor/validate/build/run/interactive/score/verify/refresh-expected/pack/clean。
- 支持 Lab 自动发现、`INIT_CWD`、`--json`、`--no-color`、稳定 reportVersion、错误 code 与 `0/1/2` 退出码；直接接管终端的 `interactive` 明确拒绝 JSON 模式。IE 同时得到 exit 2 与 JSON `ok: false`。
- 生成物只写 `.lab-cache/`；脚手架用排他创建拒绝覆盖既有目录。
- Quiz/Program/Project 脚手架全部由单测创建并重新加载验证。

## T4：Quiz

- 继续复用唯一 `<QuizSet />`；6 个题库均添加 v1 `lab.json`。
- 约束四选一、禁止 A～D 前缀、重复选项/ID、空字段和越界答案。
- 增加 hint、points、已答/正确/得分、JSON 派生折叠答案总览。
- 删除 6 份 README 手工答案表；构建期 Markdown 继续 `html: false`。
- Pages 子路径浏览器门禁 14/14，通过桌面/移动交互、提示、提交、得分、题解和重试。

## T5～T8：Program、判题、Make 与学生包

- Golden Program：`lab-01-03-problem-template`，包含 student/solution、4 组 cases 与 `.in/.out`、薄 Makefile。
- reference=100/100；starter 可编译且 0/100；oracle 无漂移。
- exact/tokens/float、CRLF、absTol/relTol、AC/WA/TLE/RE/CE/OLE/IE、真实超时/输出限制和首差异均有自动测试。
- stdout 判题、stderr 诊断；所有进程 `shell:false` + 参数数组。
- 根 Makefile + `tools/lab/lab.mk` + 两个 Lab 薄 Makefile；Make/CLI 语义自动对比通过。
- `run` 对 WA 返回 0，strict `score` 非满分返回非零；CASE/interactive/doctor/build/clean/help 已实现。
- refresh 默认预览逐行 diff，仅 `--write` 覆盖。
- Program/Project 学生包均排除 solution/cache/binary，带独立 runner/Makefile；脱离仓库 validate/run 通过。

## T9：Project

- Golden Project：`lab-04-15-huffman-coding`。
- task：frequency(stdio,30)、codec(CTest,50)、report(manual,20)；依赖拓扑、权重、环均校验。
- 公共 API 位于 `contracts/huffman.hpp`；CMake Presets + targets + CTest。
- reference 自动 80/80，manual pending 20；starter 自动 9/80，不误得满分。
- 支持 `--task`/`TASK=` 单任务运行与顶层聚合；自动分、人工待评分和 provisional total 分列。

## T10：Golden 与迁移

- Golden Quiz/Program/Project 均由 `test:lab-golden` 验证。
- 6 个现有 Quiz 已迁移；`docs/LAB_MIGRATION_TRACKER.md` 分类列出 15 个 README-only Lab。
- 不要求一次性重写全部 23 个 Lab，旧 URL/发现逻辑保持正常。

## T11：CI、安全与复现

- `pnpm test` 纳入 Lab 静态、工具和文档示例门禁。
- Pages workflow 新增隔离 C++ job：Ubuntu GCC、Ubuntu Clang、Windows MSVC；只有 `contents: read`。
- CI 执行 Golden、学生包与 Make/CLI 一致性，并检查没有非忽略生成物。
- 本地干净源文件导出：从无 node_modules/cache 状态执行 frozen install、`pnpm test`、`test:lab-golden` 全绿；验证目录随后移入回收站，可恢复。
- 本地评分器在 README/spec/指南中明确不是恶意代码沙箱。
- 独立 Reviewer 在最终快照中逐项复测首轮发现，结论 PASS、无剩余本地阻断项；完整报告见 `audit/reviewer-final.md`。
- 外部待确认：workflow 需在实际 PR/push 上运行，真实维护者仍需在 PR 上批准。

## T12：作者教程与入口

- `docs/LAB_AUTHORING_GUIDE.md` 完整覆盖类型选择、平台、Schema、Quiz、Program、Project、Make/pnpm、测试设计、判定、oracle、学生包、CI/Review、迁移、错误对照、排错和 DoD。
- 自动解析 7 个 JSON 示例，核对 11 个 CLI、三份 Golden、薄 Makefile 与 CI 命令。
- README、CONTRIBUTING、UPDATE_WORKFLOW、Trellis content index、唯一前言页均有入口。
- PR 模板、Lab Issue 模板、`.trellis/spec/content/labs.md`、新 `lab-tooling.md` 与质量规范已同步。

## 最终验证记录

```text
pnpm test                                      PASS
pnpm run test:lab-tools                        PASS (25 passed, 1 Windows symlink skip)
pnpm run test:lab-docs                         PASS (7 JSON / 23 commands / 3 Golden / 11 CLI)
pnpm run test:lab-golden                       PASS
pnpm run test:lab-make                         PASS (mingw32-make, paths with spaces)
Pages base build/check                         PASS (subpath deployment)
pnpm run test:pages                            PASS (14/14)
clean export: frozen install + pnpm test        PASS
clean export: test:lab-golden                  PASS
workflow YAML parse                            PASS
git diff --check                               PASS
independent final Reviewer                     PASS (no local blockers)
```

已知非阻塞信息：VitePress 保留原有 Rollup chunk-size warning；Windows 当前策略不允许测试进程创建符号链接，因此该单测在 Windows skip，代码仍以 `realpath` 强制边界且 Ubuntu CI 会执行。
