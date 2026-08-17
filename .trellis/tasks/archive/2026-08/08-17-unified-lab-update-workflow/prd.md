# 统一 Lab 更新机制

## Goal

为 DSA Mastery 建立一套可长期复用的 Lab 内容包和更新工作流，使维护者可以用同一组命令创建、校验和发布理论选择题、单题 C++ 上机作业与多任务大型 Lab；学习者 clone 仓库后能够获得明确的学生代码入口、可复现测试、参考实现和可读的终端评分。

## Background

- 仓库目前有 24 个 Lab README 和 6 个 `quiz.json`，选择题已经由通用 `<QuizSet />`、构建期 loader 和内容校验器驱动。
- 现有选择题契约已经约束四个选项、答案索引、解析、唯一 ID、答案提交后展示和个人题库清洗规则，不应新建第二套选择题组件。
- 当前 `labs/` 中没有 `.cpp`、`.in`、`.out`、Makefile、CMake 配置或本地评分器；编程型 Lab 仍是说明性 README。
- 项目已经要求 Node.js `>= 22.13.0` 并固定 pnpm，因此可以用 Node 标准库实现跨平台的公共评分内核，Makefile 只作为便捷入口。
- 参考答案与测试数据会保存在公开仓库中，因此本机制定位为学习、自测和内容质量验证，不提供隐藏测试或防作弊能力。

## In Scope

### R1. 统一内容包

- 每个采用新机制的 Lab 根目录必须包含 `README.md` 和版本化的 `lab.json`。
- `lab.json` 只保存机器契约，不复制标题、章节、作者等已经由 README frontmatter 管理的人类元数据。
- `type` 支持三个主要类型：`quiz`、`program`、`project`；为现有 README-only Lab 保留 `guide` 兼容类型或无 manifest 的过渡状态。
- 所有清单都必须有 `schemaVersion`，未知主版本必须快速失败，不能静默降级。

### R2. 理论选择题

- 继续使用 `quiz.json + <QuizSet />` 作为题目单一事实来源。
- v1 只支持单选题，每题恰好四个不带 A～D 前缀的非空选项，`answer` 为 `0`～`3`。
- 题面、选项和解析允许受信任 Markdown；原始 HTML 继续禁用。
- 答案与解析由组件在提交后展示或折叠，不允许 README 手工复制题目、答案表或逐题 `details`。
- 继续支持并校验 `source`、`difficulty`、`topics`、`targetId`、`code`，可增加可选 `hint` 和 `points`，未写 `points` 时等权计分。
- 页面显示作答进度、正确数和总分，但不把前端隐藏当作考试安全边界。

### R3. 单题 C++ 上机作业

- 学习者入口固定为 `student/main.cpp`，参考实现固定为 `solution/main.cpp`；多源文件时由 manifest 显式列出。
- 公共测试使用成对的 `.in/.out` 文件，测试清单声明稳定 ID、分值、超时、比较策略和可选分组；总分必须为 100。
- 评分器必须分别捕获标准输出和标准错误，默认只比较标准输出。
- 评分结果至少区分 AC、WA、TLE、RE、CE、OLE 和工具/配置错误，并按用例显示耗时、得分及总分。
- 输出比较至少提供 `exact`、`tokens`、`float` 三种策略；统一处理 CRLF/LF，浮点比较由 manifest 指定绝对/相对误差。
- 参考实现必须在 CI 中得到 100 分；学生骨架必须能够编译、能够提示待完成位置，且不得在初始状态误得 100 分。
- 项目根目录提供全局 Makefile，支持从根目录用 `LAB=<path>` 选择 Lab。
- 每个 `program`/`project` Lab 额外包含由脚手架生成的极薄 Makefile，使学习者 `cd` 到 Lab 后可直接执行 `make run`；该文件只加载仓库共享 `tools/lab/lab.mk`，不得包含编译、比较或评分逻辑。
- `make run` 必须自动识别当前 Lab、编译 `student` 目标、运行全部公开测试并显示逐例判定和当前得分；`make run CASE=<id>` 只运行一个用例，`make interactive` 提供手工标准输入。
- `make score` 与 `make run` 使用相同测试流程，但采用严格退出码，供 CI/维护者判断是否满分；学习者的 `make run` 在评分流程成功完成时不因 WA 而显示 Make 自身错误。
- `pack --profile student` 导出独立学生包时生成等价的包内薄 Makefile，并把所需共享 runner 一并打包；它不再依赖原仓库的相对路径。

### R4. 大型 Lab

- 大型 Lab 由一个顶层 `project` manifest 和一个或多个子任务组成。
- 每个子任务有稳定 ID、目录、权重、依赖关系、验收模式和独立 README/契约。
- 支持标准输入输出题、CTest/测试可执行文件、人工检查项三类验收；自动分和待人工分必须分开显示。
- 子任务权重合计 100；依赖关系默认只表达建议/构建顺序，不因前置任务失败而暗中清零后续任务。
- 大型 Lab 自身可以使用 CMake Presets + CTest；项目根 Makefile 仍只做命令转发。
- 共享头文件、库和跨任务接口必须放在显式 `include/`、`src/` 或 `contracts/` 边界，不通过复制代码共享。

### R5. 统一 CLI 与 Makefile 接口

- 维护者命令：`new`、`validate`、`verify`、`refresh-expected`、`pack`。
- 学习者命令：`doctor`、`build`、`run`、`test`、`score`、`clean`。
- CLI 支持人类可读终端表格，以及供 CI 消费的 `--json` 和 `--no-color`。
- 项目根 Makefile 与可执行 Lab 的薄 Makefile至少暴露 `help`、`doctor`、`build`、`run`、`interactive`、`score`、`clean`；根入口通过 `LAB=<path>` 选择目标，本地入口从当前目录推导目标，两者都只转发到同一 CLI。
- `lab:new` 统一生成薄 Makefile，`lab:validate` 检查它仍与模板一致，防止单个 Lab 私自分叉命令行为。
- 所有生成物进入 Lab 内的 `.lab-cache/` 或仓库统一缓存目录并被忽略，不覆盖学生代码、参考实现或测试源。

### R6. 环境与工具链

- Windows 原生是一等支持平台；Linux、macOS 与 WSL 使用同一 manifest、CLI 和评分语义。
- 对 `program/project` Lab，`make run` 是文档中的首选学习者入口；GNU Make 是推荐依赖但不是强制依赖，缺少 Make 时必须能使用等价的 `pnpm lab:run`。
- `make run` 与 `pnpm lab:run` 必须读取同一个 `lab.json`、调用同一个评分内核并产生等价结果。
- 课程默认使用 ISO C++17；只有 manifest 明确声明且题目确实需要 C++20 特性时才能覆盖为 C++20，不能依赖编译器默认方言。
- 支持 GNU/Clang/MSVC 编译器族；工具优先通过能力探测验证所需标准和参数，版本号用于诊断与已验证基线，不以无关的小版本差异拒绝可用环境。
- 大型 Project Lab 要求支持 CMake 3.25 或更高版本；简单 Program Lab 不要求 CMake。
- 不向 Git 提交编译器、系统 SDK 或平台二进制。
- 仓库声明默认 C++ 标准、支持的编译器族、最低工具版本和编译警告；单个 Lab 只能在有明确教学需要时覆盖。
- `doctor` 检测 Node、编译器、Make/CMake（按 Lab 类型）并给出可操作错误信息，不自动修改用户系统。
- 提供可选 Dev Container/Codespaces 配置作为可复现环境；原生环境仍按文档安装依赖。
- 简单单文件 Lab 不强制 CMake；多任务 Lab 使用 CMake Presets/CTest，避免每个 Lab 手写不兼容的构建脚本。

### R7. 维护与发布流程

- 提供按类型生成的模板和 `pnpm lab:new` 脚手架，生成后的目录天然符合命名与基础 schema。
- `pnpm lab:validate` 执行结构、路径、分值、测试配对、README/manifest 一致性和安全边界检查。
- `pnpm lab:verify` 编译参考实现、核对参考输出、运行全部测试并验证评分器的判定。
- 根级 `pnpm test` 纳入 Lab 静态校验；可执行 Lab 的完整验证进入独立 CI job，避免网站内容检查被工具链安装细节污染。
- PR 必须记录参考实现 100 分、学生骨架结果、至少一个边界/错误用例和 Reviewer 的干净环境复现证据。
- 更新 `docs/UPDATE_WORKFLOW.md`、`CONTRIBUTING.md` 和 `.trellis/spec/content/labs.md`，使规范、模板、校验器和用户文档保持一致。

### R8. 全面开发者教程

- 新增 `docs/LAB_AUTHORING_GUIDE.md`，定位为后续开发者更新三类 Lab 的完整作者手册，深度和可复制性对齐现有 `docs/THEORY_DOC_STYLE_GUIDE.md`。
- 指南必须说明如何选择 `quiz/program/project`、公共目录与 `lab.json`、三类题目的逐步创建流程、测试与评分命令、环境准备、Review、CI、迁移和常见错误。
- Quiz 章节必须给出可复制的 frontmatter、`lab.json`、`quiz.json` 示例，说明选项格式、答案折叠、题目元信息、得分和知识正确性复核。
- Program 章节必须给出 student/solution/tests/cases 的完整目录、manifest、`.in/.out`、`make run`、单用例、交互运行、输出比较、判定含义和排错流程。
- Project 章节必须给出任务拆分、权重、依赖、CMake Presets/CTest、自动/人工评分和最终集成 Review 示例。
- 指南中的 schema、命令和目录示例必须来自实际模板或被自动测试覆盖，不能成为脱离实现的第二份虚构规范。
- README、CONTRIBUTING、`docs/UPDATE_WORKFLOW.md`、`.trellis/spec/content/index.md` 和现有前言展示页必须提供该指南入口；不新增第二个 preface 页面，保持现有唯一前言路由约束。
- 任何 schema、CLI、Make target 或评分行为变更，都必须在同一 PR 更新本指南并运行文档示例验证。

## Acceptance Criteria

- [ ] AC1：一个 quiz 模板可由命令创建，损坏选项数、答案索引、重复 ID、静态答案副本时均被阻止。
- [ ] AC2：一个 program 示例包含 README、`lab.json`、学生/参考 C++、薄 Makefile、用例清单和 `.in/.out`；clone 后 `cd` 到该 Lab 并执行 `make run`，即可输出逐例判定与 `0～100` 分。
- [ ] AC3：参考实现对全部测试稳定得到 100 分；编译错误、错误答案、超时、运行时错误和输出过量均有不同诊断。
- [ ] AC4：`exact`、`tokens`、`float` 比较器各有自动测试，并覆盖 Windows/Unix 换行差异。
- [ ] AC5：一个 project 示例至少有两个子任务，能按权重汇总自动分并单列待人工检查分。
- [ ] AC6：项目根 Makefile、Lab 内薄 Makefile 和根 CLI 对同一 Lab 产生相同判定，评分逻辑只有一个实现来源；修改薄 Makefile为自定义规则时校验失败。
- [ ] AC7：`doctor` 在缺编译器、缺 Make/CMake 或版本不满足时给出明确说明，不尝试自动安装。
- [ ] AC8：Linux 与 Windows CI 至少各验证一个 C++ 示例；网站原有 `pnpm test` 仍通过。
- [ ] AC9：新旧选择题页面仍由同一个 QuizSet 渲染，现有 6 个题库无需维护第二份题面或答案。
- [ ] AC10：文档给出三种 Lab 从规划、创建、编写、生成预期输出、自检、Review 到发布的完整清单。
- [ ] AC11：`docs/LAB_AUTHORING_GUIDE.md` 完整覆盖三类 Lab，所有复制粘贴示例与 golden fixtures 一致，并能从 README、CONTRIBUTING、更新工作流、内容规范索引和前言页到达。

## Out of Scope

- 在线提交、账户、云端判题、排行榜、学习进度同步或真正的隐藏测试。
- 对不可信代码提供强安全沙箱、精确跨平台内存限制或生产级 OJ 调度。
- 自动评判报告质量、代码风格、算法复杂度证明或知识正确性；这些仍由 Reviewer 负责。
- 在首版同时支持所有编程语言；schema 保留 `language`，实现先只做 C++。
- 为每个简单单题引入独立 CMake 工程或第三方测试框架。

## Risks and Deferred Items

- 公开 `solution/` 和 `.out` 只能用于自学。若未来用于正式课程考核，应由打包命令、私有仓库或单独发布渠道提供不含答案的学生包。
- Node 的超时和进程控制足以做本地学习工具，但不是安全隔离；CI 运行外部贡献代码时不得注入秘密，并应限制权限。
- Windows 原生的 GNU Make 并非系统自带，因此教程必须同时给出 Make 安装指引和无需 Make 的 `pnpm lab:run` 路径；两条路径都进入同一评分内核。
