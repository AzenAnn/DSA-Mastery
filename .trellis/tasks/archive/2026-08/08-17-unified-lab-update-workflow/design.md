# 统一 Lab 更新机制：技术设计草案

## 1. 设计结论

采用“README 是人类说明、`lab.json` 是机器入口、类型文件是内容/测试数据”的三层结构。所有类型共用同一个 CLI、schema 版本、错误模型和发布门禁；选择题继续复用现有 QuizSet，编程题复用统一评分内核，大型 Lab 只做任务编排，不再复制一套评分器。

冻结的环境路线是：Windows 原生为一等平台；仓库不封装编译器二进制；Node CLI 是跨平台权威入口；`make run` 是首选体验，`pnpm lab:run` 是免 Make 官方兜底；项目根 Makefile 和可执行 Lab 内由模板生成的极薄 Makefile 都只加载共享 `lab.mk`；简单 Lab 直接调用编译器，大型 Lab 才使用 CMake Presets + CTest；Dev Container/Codespaces 作为可选复现环境。

## 2. 当前仓库证据

- `.trellis/spec/content/labs.md` 已把 `<QuizSet />` 和 `quiz.json` 定为交互选择题的唯一实现。
- `scripts/validate-content.mjs` 与 `.vitepress/quiz.data.ts` 已独立校验题目数据，具备良好的“双防线”基础。
- `.vitepress/content-index.ts` 只扫描 Lab README，适合让 README 继续承担网站发现和展示元数据。
- `package.json` 已固定 Node/pnpm，适合使用无第三方依赖的 Node 评分内核。
- 当前 24 个 Lab 只有 Markdown/JSON；`lab-01-03-problem-template` 可作为首个 program pilot，Huffman 或排序基准可作为 project pilot。

## 3. 内容包总体结构

### 3.1 所有新式 Lab 的公共文件

```text
labs/chapter-NN/lab-NN-LL-slug/
├─ README.md                 # 网站页面、学习目标、步骤、验收与复盘
├─ lab.json                  # 机器入口，含 schemaVersion 与 type
├─ Makefile                  # 仅 program/project；模板生成的共享入口
└─ .gitignore                # 忽略 .lab-cache/ 等生成物
```

`README.md` 继续使用当前 frontmatter 契约。`lab.json` 不重复 `title/chapter/order/contributors`；校验器从目录和 README 推导这些信息。Quiz/guide 不需要 Makefile；program/project 的 Makefile 是固定模板，只负责找到仓库根并加载统一 `tools/lab/lab.mk`。

### 3.2 `lab.json` 公共外形

```json
{
  "$schema": "../../../schemas/lab.schema.json",
  "schemaVersion": 1,
  "type": "program"
}
```

主版本不兼容时失败；同主版本新增可选字段时保持兼容。路径字段必须是相对 Lab 根目录的普通路径，解析后必须仍位于 Lab 内部，拒绝绝对路径、`..` 越界和符号链接逃逸。

## 4. Theory / Quiz 设计

### 4.1 目录

```text
lab-NN-LL-topic-quiz/
├─ README.md
├─ lab.json
└─ quiz.json
```

### 4.2 manifest

```json
{
  "$schema": "../../../schemas/lab.schema.json",
  "schemaVersion": 1,
  "type": "quiz",
  "quiz": {
    "questions": "quiz.json",
    "questionType": "single-choice",
    "reveal": "after-submit",
    "scoring": "equal"
  }
}
```

### 4.3 题目契约

v1 延续现有字段：

```json
{
  "id": "q1",
  "stem": "题面（支持 Markdown）",
  "options": ["选项文本", "选项文本", "选项文本", "选项文本"],
  "answer": 0,
  "explanation": "答案解析（支持 Markdown）",
  "source": "可选来源",
  "difficulty": "可选难度",
  "topics": ["可选考点"],
  "targetId": "可选外部稳定标识",
  "code": "可选独立代码窗",
  "hint": "可选折叠提示",
  "points": 1
}
```

规则：

- 选项字符串不写 `A.`、`B.`，字母由组件统一渲染。
- `id` 一经发布保持稳定，避免答题状态、链接与 Review 证据失效。
- 答案、解析和答案速查不在 README 复制；如需要总览，由组件从 JSON 自动生成折叠区。
- 选项不得在去空白和标签后完全重复。
- `hint` 在提交前可主动展开，`explanation` 只能在提交后出现。
- 题库显示 `已答/总题数、正确数、当前分/总分`；重试只重置该题。

## 5. Program / 单题上机设计

### 5.1 目录

```text
lab-NN-LL-slug/
├─ README.md
├─ lab.json
├─ Makefile
├─ student/
│  └─ main.cpp
├─ solution/
│  └─ main.cpp
└─ tests/
   ├─ cases.json
   ├─ 001-sample.in
   ├─ 001-sample.out
   ├─ 002-boundary.in
   └─ 002-boundary.out
```

### 5.2 manifest 示例

```json
{
  "$schema": "../../../schemas/lab.schema.json",
  "schemaVersion": 1,
  "type": "program",
  "language": "cpp",
  "toolchain": {
    "standard": "c++17",
    "profile": "course-default"
  },
  "targets": {
    "student": { "sources": ["student/main.cpp"] },
    "solution": { "sources": ["solution/main.cpp"] }
  },
  "judge": {
    "kind": "stdio",
    "cases": "tests/cases.json",
    "compare": { "mode": "tokens" },
    "limits": { "timeMs": 2000, "outputKb": 1024 }
  }
}
```

建议课程默认 C++17，以兼容学校机房和常见编译器；需要 `span`、concepts 等内容的单个 Lab 才覆盖为 C++20。编译器命令始终显式传 `-std=` 或 MSVC 等价参数，不依赖工具默认值。

### 5.3 `cases.json`

```json
[
  {
    "id": "sample",
    "input": "tests/001-sample.in",
    "expected": "tests/001-sample.out",
    "points": 10,
    "tags": ["sample"]
  },
  {
    "id": "boundary-empty",
    "input": "tests/002-boundary.in",
    "expected": "tests/002-boundary.out",
    "points": 20,
    "compare": { "mode": "exact" }
  }
]
```

约束：ID 唯一，分值为正整数并合计 100，输入/输出文件存在且不越界。允许用例覆盖 Lab 级比较与限额；所有覆盖都必须在 README 说明原因。

### 5.4 评分流水线

```text
doctor -> validate -> compile target -> for each case:
input -> spawn executable -> capture stdout/stderr -> enforce limits
      -> compare stdout with expected -> verdict -> points
-> terminal/JSON report
```

判定：

| 判定 | 含义 | 得分 |
| --- | --- | ---: |
| AC | 退出码 0、未超限、输出通过 | 用例全部分值 |
| WA | 程序正常结束但输出不符 | 0 |
| TLE | 超过 `timeMs` | 0 |
| RE | 非零退出码或信号结束 | 0 |
| CE | 编译失败；整次评分停止 | 0/100 |
| OLE | stdout/stderr 超过上限 | 0 |
| IE | manifest、测试或评分器内部错误 | 不报告为学生得分 |

终端报告示意：

```text
CASE                 RESULT   TIME      SCORE
sample               AC       12 ms     10/10
boundary-empty       WA        8 ms      0/20
...
TOTAL                                   80/100
```

退出码建议：`0`=满分，`1`=完成评分但未满分，`2`=环境/配置/内部错误。CE 属于有效学生结果，使用 `1`。

### 5.5 输出比较

- 所有模式先把 CRLF 规范为 LF，保留其余语义。
- `exact`：除换行平台差异外逐字符比较，适合格式题。
- `tokens`：按 Unicode 空白切分后逐 token 比较，作为普通算法题默认值。
- `float`：token 级比较；数值 token 使用 `absTol` 与 `relTol`，其他 token 精确比较。
- WA 报告第一处差异、期望片段和实际片段，不把完整大输出刷满终端。
- stdout 用于判题，stderr 仅作为诊断；调试日志不得写到 stdout。

### 5.6 参考输出生命周期

- `solution/main.cpp` 是参考实现，`.out` 是学习者评分时的稳定 oracle。
- `refresh-expected` 在临时目录运行参考实现，先展示 diff；只有显式 `--write` 才更新 `.out`。
- `verify` 重新运行参考实现并确认当前 `.out` 未漂移、参考实现得 100 分。
- 评分学生代码时不必每次重新编译/运行参考实现，从而让结果稳定且更快。

## 6. Project / 大型 Lab 设计

### 6.1 目录

```text
lab-NN-LL-large-project/
├─ README.md
├─ lab.json
├─ Makefile
├─ CMakeLists.txt
├─ CMakePresets.json
├─ include/                  # 跨任务公共接口
├─ src/                      # 可选公共实现
├─ tasks/
│  ├─ task-01-parser/
│  │  ├─ README.md
│  │  ├─ task.json
│  │  ├─ student/
│  │  ├─ solution/
│  │  └─ tests/
│  └─ task-02-algorithm/
│     └─ ...
└─ report/
   └─ template.md
```

### 6.2 顶层 manifest

```json
{
  "$schema": "../../../schemas/lab.schema.json",
  "schemaVersion": 1,
  "type": "project",
  "language": "cpp",
  "buildSystem": "cmake",
  "tasks": [
    {
      "id": "parser",
      "path": "tasks/task-01-parser",
      "weight": 30,
      "dependsOn": []
    },
    {
      "id": "algorithm",
      "path": "tasks/task-02-algorithm",
      "weight": 50,
      "dependsOn": ["parser"]
    },
    {
      "id": "report",
      "path": "report",
      "weight": 20,
      "kind": "manual",
      "dependsOn": ["algorithm"]
    }
  ]
}
```

顶层 `weight` 合计 100。自动子任务先得到自己的 `0～100%`，再乘顶层权重；人工任务显示 `PENDING`，最终报告明确区分：

```text
Automated: 72/80
Manual pending: 20
Provisional total: 72/100
```

### 6.3 子任务接口

`task.json` 复用评分内核，支持：

- `stdio`：`.in/.out` 判题；
- `ctest`：CMake/CTest 测试目标，测试名映射分值；
- `manual`：报告、图表、复杂度说明和人工 Review 清单。

`dependsOn` 只用于排序、提示和增量构建，不默认形成得分门禁。若未来需要“一组全过才得分”，由用例 `group` 显式声明，不能通过依赖暗中实现。

大型 Lab 的共享 API 放在 `include/` 或 `contracts/`，由 CMake target 表达依赖。每个子任务必须能被单独 `validate` 和 `test`，顶层 `score` 聚合全部结果。

## 7. 统一命令接口

### 7.1 根级命令

```text
pnpm lab:new -- --type quiz --chapter 2 --order 3 --slug stack-quiz
pnpm lab:doctor -- labs/chapter-02/lab-02-03-stack-quiz
pnpm lab:validate -- <lab-path>
pnpm lab:build -- <lab-path> --target student
pnpm lab:run -- <lab-path> [--case sample]
pnpm lab:score -- <lab-path> [--json] [--no-color]
pnpm lab:verify -- <lab-path>
pnpm lab:refresh-expected -- <lab-path> [--write]
pnpm lab:pack -- <lab-path> --profile student
```

不带路径时，CLI 从当前目录向上查找最近的 `lab.json`。所有命令输出稳定错误码；JSON 输出采用版本化结构，便于 CI 和未来网站工具消费。

### 7.2 两级 Make 入口

项目根入口适合批量维护和 CI：

```text
make help
make doctor LAB=labs/chapter-01/lab-01-03-problem-template
make build LAB=labs/chapter-01/lab-01-03-problem-template
make run LAB=labs/chapter-01/lab-01-03-problem-template CASE=sample
make score LAB=labs/chapter-01/lab-01-03-problem-template
make clean LAB=labs/chapter-01/lab-01-03-problem-template
```

学习者进入可执行 Lab 后直接运行：

```text
cd labs/chapter-01/lab-01-03-problem-template
make help
make doctor
make run
make run CASE=sample
make interactive
make score
make clean
```

Lab 内 Makefile 固定为极薄模板，示意如下：

```make
LAB_DIR := $(CURDIR)
REPO_ROOT := $(LAB_DIR)/../../..
include ../../../tools/lab/lab.mk
```

它没有 recipe，不实现 diff、计分或编译器探测。共享规则使用字面量相对路径加载，避免 GNU Make 把展开后的 Windows 空格路径误拆成多个 include 文件；传给 Node 的 Lab/仓库路径仍保持双引号。所有 target 都来自共享 `lab.mk`，`lab.mk` 再调用 Node CLI。`lab:new` 自动生成该文件，`lab:validate` 校验模板内容，避免几十个 Lab 的行为逐渐漂移。

命令语义：

| 命令 | 行为 | 退出策略 |
| --- | --- | --- |
| `make run` | 编译学生代码，运行全部公开用例，显示判定和得分 | 评分流程成功即返回 0，WA 不显示 Make 错误 |
| `make run CASE=id` | 只运行指定用例 | 同上 |
| `make interactive` | 编译后连接当前终端的 stdin/stdout | 使用程序退出码 |
| `make score` | 运行与 `make run` 相同的完整用例集 | 仅满分返回 0，供 CI 使用 |
| `make doctor` | 检查当前 Lab 所需环境 | 环境不满足返回非 0 |
| `make clean` | 只删除该 Lab 的缓存/构建产物 | 成功返回 0 |

这样既满足“进入题目后只记一个 `make run`”，又保持评分内核只有一个实现来源。

`pack --profile student` 生成脱离仓库的独立学生包时，从同一模板族生成包内相对路径版本，并把所需共享 runner 一并打入学生包；它不依赖原仓库的 `../../..` 路径，导出文件也不回写源 Lab。

## 8. 工具链和环境

### 8.1 不提交编译器

编译器和 SDK 平台相关、体积大且需要安全更新。仓库只提交：

- 版本/能力要求；
- 编译参数 profile；
- `doctor` 检测；
- 原生系统安装说明；
- 可选 `.devcontainer/devcontainer.json`。

### 8.2 工具层级

| 类型 | 必需 | 可选 |
| --- | --- | --- |
| Quiz | Node/pnpm（维护和网站） | 无 |
| 单文件 Program | Node + 支持 C++17 的编译器 | GNU Make（首选入口） |
| Project | Node + 支持 C++17 的编译器 + CMake ≥ 3.25 | GNU Make（首选入口）、Ninja、Dev Container |

`doctor` 应报告实际版本、选中的编译器 profile 和下一步命令。它不运行包管理器，不修改 PATH。

平台优先级：

1. Windows 原生 PowerShell：首选 `make run`；未安装 Make 时使用 `pnpm lab:run`；支持 GNU/Clang/MSVC profile。
2. Linux/macOS/WSL：使用相同命令与评分语义，不维护另一套 shell 脚本。
3. Dev Container/Codespaces：可选、用于复现和 Reviewer 干净环境，不取代原生路径。

### 8.3 编译 profile

- GNU/Clang：显式 ISO 标准、`-Wall -Wextra -Wpedantic`，调试 profile 可加 sanitizer（仅支持的平台）。
- MSVC：`/std:c++17` 或相应版本、`/W4`、一致的 UTF-8/异常设置。
- Release/score 与 debug/sanitize 分开，不把 sanitizer 的平台差异带进普通评分。

评分器使用 Node `child_process.spawn` 的参数数组而非 shell 拼接，设置工作目录、超时和输出上限，降低路径空格与 shell 注入问题。

## 9. 校验分层

### L1：Schema

- JSON 可解析、版本/type 合法、必填字段和枚举正确。
- quiz 题目、cases、project tasks 符合对应 JSON Schema。

### L2：语义与文件系统

- README/frontmatter/目录编号一致。
- 所有路径存在且留在 Lab 根目录内。
- `.in/.out` 成对、case/task ID 唯一、分值合计 100。
- program/project 有 student、solution 和 README 精确命令。
- 缓存、二进制和构建目录未被 Git 跟踪。

### L3：可执行验证

- 参考实现编译并得到 100。
- `.out` 与参考实现重新生成结果一致。
- 学生骨架编译但不误得满分。
- 判题器自己的单元测试覆盖 verdict、比较器、超时、路径和报告格式。

### L4：站点与发现

- 新 Lab 自动进入索引、搜索和对应章节。
- Quiz 交互、代码块、答案折叠和移动端布局通过现有 discovery/build/Pages 测试。
- 下载链接和源文件相对路径在本地及 Pages base 下都有效。

### L5：CI / Review

- 网站 job：现有 `pnpm test` + Lab 静态校验。
- C++ job：至少 Ubuntu + Windows，验证 pilot program/project 和参考实现 100 分。
- Reviewer 从干净 clone 执行 README 命令，记录工具版本与结果。

## 10. 三类 Lab 的更新工作流

### 10.1 Quiz

1. 定义学习目标、考点边界和题目来源。
2. 运行脚手架生成 README、lab.json、quiz.json。
3. 写题面/选项/解析，保持稳定 ID，不手写答案副本。
4. `validate` 检查 schema、个人痕迹和渲染安全。
5. 本地网站逐题完成选择、提交、题解、重试和总分流程。
6. Reviewer 独立核对每题答案、解析和干扰项，再运行完整站点门禁。

### 10.2 Program

1. 先冻结标准输入/输出、约束、比较模式、边界和总分结构。
2. 脚手架生成 student/solution/tests 和固定薄 Makefile；既可在项目根用 `LAB=<path>` 调用，也可进入 Lab 后直接 `make run`。
3. 先写参考实现与代表性用例，再写可编译学生骨架。
4. `refresh-expected --write` 生成/审阅 `.out`。
5. `verify` 确认 reference=100、starter<100，并用已知错误版本证明测试能抓错。
6. Reviewer 在干净环境运行 `doctor`、`make score` 或权威 CLI，核对 README 与真实输出。

### 10.3 Project

1. 冻结最终成果、任务分解、共享接口、依赖和自动/人工分值。
2. 为每个任务写独立验收，顶层 manifest 只做编排。
3. 用 CMake targets 表达公共库和任务依赖，用 CTest 注册自动测试。
4. 逐任务 verify，再运行顶层 score 验证聚合与人工 pending。
5. Reviewer 至少从一个早期 task 走到最终集成，检查失败任务的诊断是否可定位。

## 11. 开发者教程设计

### 11.1 文档定位与入口

新增 `docs/LAB_AUTHORING_GUIDE.md`，标题建议为“DSA Mastery Lab 更新与测试指南”。它是面向内容作者和 Reviewer 的完整教程，采用与 `docs/THEORY_DOC_STYLE_GUIDE.md` 相同的“完整手册 + 站内入口”模式：

- README 的“内容如何自动更新”和仓库导览链接该指南；
- CONTRIBUTING 的开始前与本地验证链接该指南；
- `docs/UPDATE_WORKFLOW.md` 的新增 Lab 流程链接到具体章节；
- `.trellis/spec/content/index.md` 把它列为作者 API 文档；
- 现有 `content/chapter-preface/00-theory-environments.md` 增加“Lab 作者指南”入口，不新增第二篇 preface，避免改变唯一前言页契约。

机器规范仍以 JSON Schema、CLI 和 `.trellis/spec/content/labs.md` 为准；作者指南解释如何正确使用这些接口，不另立冲突规则。

### 11.2 建议文章目录

1. 为什么需要统一 Lab 机制，以及它解决什么维护/学习问题；
2. 三类 Lab 选择表和决策树；
3. 公共 frontmatter、命名、`lab.json`、schemaVersion 和目录边界；
4. Quiz 从创建到发布的完整教程；
5. Program 从题面、学生骨架、题解、测试数据到 `make run` 的完整教程；
6. Project 的 task 拆分、共享接口、CMake/CTest 与混合评分；
7. `make`、pnpm/CLI 的命令速查和退出码；
8. Windows、Linux/macOS 与 Dev Container 环境准备；
9. 测试数据设计：样例、正常、边界、错误、压力与反作弊边界；
10. Author Check、Review Owner、CI 和发布证据；
11. 从旧 README-only Lab 迁移；
12. 常见错误、错误/正确对照、故障排查；
13. 可直接复制的三类模板与最终 DoD 清单。

### 11.3 文档示例防漂移

- 目录树、manifest 和 Makefile 片段来自脚手架模板，不手工维护不同版本。
- 指南命令全部针对仓库内 golden quiz/program/project，CI 至少执行一次其中可自动执行的命令。
- JSON fenced blocks进入 schema 示例测试；命令/API 变更时，测试提示必须同步指南。
- 文档显式标注适用的 `schemaVersion`，避免旧教程误导新 Lab。
- 对知识答案、题解质量和人工评分部分保留 Reviewer 责任说明，不能用“工具通过”代替内容正确。

## 12. 迁移与落地顺序

1. 建 schema、CLI 核心、doctor、路径安全和纯 JS 单元测试。
2. 接入现有 quiz 契约，迁移 6 个 quiz Lab 的 `lab.json`，不重写题库内容。
3. 将 `lab-01-03-problem-template` 升级为首个完整 program pilot。
4. 把静态校验接入 `pnpm test`，把 Linux/Windows 编译运行放入单独 CI job。
5. 选择 Huffman 或排序基准做两个子任务的 project pilot。
6. 完成 `docs/LAB_AUTHORING_GUIDE.md`，同步 README、CONTRIBUTING、更新工作流、前言入口、Trellis spec 和 PR 模板，并验证文档示例。
7. 其余 README-only Lab 按实际性质逐步迁移；未迁移内容不阻塞网站。

## 13. 安全、版权和公开答案边界

- 本地评分器会运行仓库代码，不是恶意代码沙箱；README 和 CLI 必须明确。
- fork PR 的执行环境不注入部署秘密，token 权限最小化。
- 不允许 manifest 指向任意系统命令；自定义 checker 必须来自仓库白名单目录并通过 Review。
- solution 与测试公开意味着答案可见。`pack --profile student` 可以生成不含 solution 的分发包，但 clone 完整公开仓库仍能看到答案。
- 引用或改编外部题目、代码和数据仍按现有版权/来源规则执行。

## 14. 关键取舍

| 决策 | 选择 | 原因 |
| --- | --- | --- |
| 题目展示 | 复用 QuizSet | 已有真实消费者与完整验证，避免双实现 |
| 评分内核 | Node 标准库 | 仓库已固定 Node；跨平台；无需新增运行时依赖 |
| Makefile | 根入口 + Lab 固定薄入口 | 支持批量维护，也支持 `cd` 后 `make run`；实际规则集中在共享 `lab.mk`/CLI |
| 简单构建 | 直接编译器 | 单文件 Lab 引入 CMake 成本高于收益 |
| 大型构建 | CMake Presets + CTest | 共享 target、任务测试和 CI 更稳定 |
| 预期输出 | 提交 `.out`，由 solution 校验 | 学生评分快、结果稳定、可审阅 diff |
| 默认比较 | tokens | 普通算法题不因无意义空白丢分；格式题可选 exact |
| 工具链分发 | requirement + doctor + 可选容器 | 避免仓库膨胀和平台二进制维护 |
| 作者教程 | docs 完整手册 + 现有前言入口 | 对齐理论样式指南模式，同时不破坏唯一 preface 路由 |

## 15. 已冻结平台决策

- Windows 原生是一等公民。
- `make run` 是首选学习入口；GNU Make 推荐安装但不是强制依赖。
- `pnpm lab:run` 是免 Make 官方兜底，并与 Make 路径共享评分内核。
- 课程默认 ISO C++17；题目可在 manifest 中因明确需要升级到 C++20。
- 简单 Program 不强制 CMake；Project 使用 CMake ≥ 3.25 + CTest。
