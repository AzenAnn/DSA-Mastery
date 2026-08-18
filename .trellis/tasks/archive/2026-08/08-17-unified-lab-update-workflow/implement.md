# 统一 Lab 更新机制：实施计划草案

> 用户已确认完整范围；下列实现项、最终本地门禁与独立干净快照 Review 均已完成，当前等待 Phase 3.4 的批量提交确认。

## Phase A：契约与测试骨架

- [x] 确定 MVP 平台基线：Windows 原生优先，`make run` 首选，`pnpm lab:run` 免 Make 兜底，默认 ISO C++17，Project 使用 CMake ≥ 3.25。
- [x] 新增 `schemas/lab.schema.json`、quiz/cases/project 子 schema。
- [x] 定义 CLI JSON 输出版本、verdict 和退出码。
- [x] 为路径越界、坏 JSON、未知 schemaVersion、错误分值编写失败测试。

验证：

```powershell
pnpm run typecheck
pnpm run lint
pnpm run test:lab-tools
```

回滚点：schema 和测试应先独立落地，不同时迁移全部 Lab。

## Phase B：统一 CLI 核心

- [x] 实现 Lab 定位、manifest 加载、错误类型和 `--json/--no-color`。
- [x] 实现 `doctor`、`validate`、缓存目录和安全进程启动。
- [x] 增加 package scripts：`lab:new/lab:doctor/lab:validate/lab:verify/lab:score`。
- [x] 确保无参数时可从子目录向上找到最近 `lab.json`（pnpm 脚本通过 `INIT_CWD` 保留调用目录）。

验证：Windows 路径含空格、缺编译器、缓存目录只写生成物、未知命令均有测试。

## Phase C：Quiz 接入

- [x] 扩展现有 quiz validator/loader 使用共同 schema 规则。
- [x] 支持可选 hint/points 与总分 UI；保持现有字段兼容。
- [x] 禁止手工答案速查副本，改为 JSON 派生的折叠总览。
- [x] 为 6 个现有 quiz Lab 添加最小 `lab.json`。
- [x] 扩展 Playwright：选择、提示、提交、得分、题解、重试、移动端。

验证：`pnpm run validate:content`、`pnpm run test:discovery`、`pnpm run build`、`pnpm run check:site`、Pages 用例。

回滚点：loader 保持对无 `lab.json` 的旧题库兼容，直到迁移完成。

## Phase D：Program 评分器

- [x] 实现 GNU/Clang/MSVC 编译 profile。
- [x] 实现 stdio case runner、超时、输出上限、stdout/stderr 分离。
- [x] 实现 exact/tokens/float 比较器和首差异诊断。
- [x] 实现计分、终端表格、JSON 报告和退出码。
- [x] 实现 `refresh-expected` 的预览与显式写入模式。
- [x] 实现项目根 Makefile、共享 `tools/lab/lab.mk`，以及只 include 共享规则的 `new --type program` 薄 Makefile 模板。
- [x] 固化 `make run`、`CASE`、`interactive` 与严格 `make score` 的退出码语义。
- [x] 让 `lab:validate` 检查 Lab 薄 Makefile 与模板一致。
- [x] 将 `lab-01-03-problem-template` 升级为 golden fixture。

验证矩阵：AC、WA、TLE、RE、CE、OLE、IE；CRLF/LF；路径含空格；参考实现 100；starter 可编译且低于 100。

回滚点：评分器和 pilot 放在新目录/脚本中，不改变其他 Lab 的网站读取方式。

## Phase E：Project 编排

- [x] 定义 task schema、task graph 校验、拓扑顺序与权重聚合。
- [x] 支持 stdio、ctest 和 manual 三种 task kind。
- [x] 增加 CMake Presets/CTest 模板，并让项目根与大型 Lab 薄 Makefile都能调用同一任务编排器。
- [x] 选择 Huffman 构造三个 task 的 pilot。
- [x] 验证单任务运行、顶层聚合和 manual pending。

验证：CMake configure/build/test presets；任务依赖环、重复 ID、权重错误、失败任务定位。

## Phase F：CI 与文档

- [x] 将 Lab 静态校验纳入现有 `pnpm test`。
- [x] 新建隔离的 C++ CI job，覆盖 Ubuntu GCC/Clang 与 Windows MSVC；不授予部署秘密。
- [x] 按现有理论样式指南的深度编写 `docs/LAB_AUTHORING_GUIDE.md`，完整覆盖 quiz/program/project 的创建、格式、命令、测试、Review、CI、迁移和排错。
- [x] 更新 README、CONTRIBUTING、`docs/UPDATE_WORKFLOW.md`、现有前言页和 PR 模板，建立统一作者指南入口。
- [x] 更新 `.trellis/spec/content/labs.md`、新增 `lab-tooling.md` 并同步质量规范。
- [x] 增加文档示例验证：JSON/schema、模板片段与 golden fixture 命令不得漂移。
- [x] 提供 `pack --profile student`，验证不含 solution/cache/binary，并打入薄 Makefile与所需共享 runner。
- [x] 在无既有依赖/缓存的干净源文件导出中重新安装并复现 `pnpm test` 与三类 Golden；CI checkout 覆盖同一路径，Dev Container 保持可选且非首版必需配置。

## Full Quality Gate

```powershell
pnpm test
pnpm run test:lab-tools
pnpm lab:verify -- labs/chapter-01/lab-01-03-problem-template
```

大型 Lab pilot 还需运行其 README 中的 CMake/CTest 命令。Pages 相关变更按现有 Pages base 流程运行 Playwright。

## Risky Files / Review Focus

- `scripts/validate-content.mjs` 与 `.vitepress/quiz.data.ts`：必须继续保持契约一致。
- `package.json` / `pnpm-lock.yaml`：优先零新增运行时依赖；如新增依赖必须证明必要性。
- `.github/workflows/*`：外部 PR 代码执行权限、秘密和缓存边界。
- `.vitepress/theme/components/QuizSet.vue`：无障碍、答题状态和移动端布局。
- 编译/运行进程管理：不得通过拼接 shell 命令处理学生路径或 manifest 字段。
- `docs/LAB_AUTHORING_GUIDE.md`：命令、schema 和模板必须与实现同一版本，不能成为第二套事实来源。

## Proposed Trellis Task Split After Approval

1. `lab-contract-cli-core`：schema、CLI、doctor、静态校验。
2. `quiz-workflow-integration`：现有题库接入、得分 UI、测试。
3. `cpp-program-judge`：编译、用例、比较器、评分、program pilot。
4. `project-lab-orchestration`：CMake/CTest、task graph、project pilot。
5. `lab-ci-docs-rollout`：跨平台 CI、全面 Lab 作者教程、入口同步、模板验证与迁移收尾。

每个子任务独立规划、实现、检查和归档；父任务保留跨类型验收与最终集成 Review。
