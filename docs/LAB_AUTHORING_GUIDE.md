# DSA Mastery Lab 更新与测试指南

> 适用版本：Lab Schema v1 · 更新日期：2026-08-21

这份手册是 Quiz、Program 和 Project 三类 Lab 的统一作者 API。面向网页的说明仍写在 Lab 的 `README.md`，机器行为只由 `lab.json`、`quiz.json`、`cases.json`、`task.json` 和共享工具决定。后续开发者应从本文提供的脚手架开始，而不是复制旧 Lab 后自行发明目录、Make 规则或评分脚本。

## 1. 先选对 Lab 类型

| 需要检查的学习成果 | 类型 | 机器事实来源 | 本地执行 |
| --- | --- | --- | --- |
| 概念辨析、复杂度、结构性质，答案是四选一 | `quiz` | `quiz.json` | 浏览器 `<QuizSet />` |
| 一个标准输入/标准输出 C++ 问题 | `program` | `lab.json` + `tests/cases.json` | `make run` / `pnpm lab:run` |
| 多个有依赖关系的 task、公共接口、自动与人工混合评分 | `project` | 顶层 `lab.json` + 各 task 的 `task.json` | Make + CMake/CTest |

决策顺序：

1. 如果每题都能表达成恰好四个选项，选 Quiz。
2. 如果只有一个可执行目标，输入输出可由标准流描述，选 Program。
3. 只有在确实存在多个 task、共享接口或人工报告时才选 Project。
4. 纯纸笔学习地图可继续作为 README-only 旧式 Lab；不要为了“统一”强塞编译器。

三份可运行参照物：

- Golden Quiz：`labs/chapter-00/lab-00-03-complexity-quiz`
- Golden Program：`labs/chapter-01/lab-01-06-sequential-list-deduplication`
- Golden Project：`labs/chapter-08/lab-08-03-avl-tree-rotations`

## 2. 平台与工具链基线

### 2.1 支持级别

| 平台 | 支持级别 | 推荐入口 | 说明 |
| --- | --- | --- | --- |
| Windows 10/11 原生 PowerShell | 一等支持 | `make run`；无 Make 用 `pnpm lab:run` | CI 使用 MSVC 复现 |
| Ubuntu/Linux | 一等支持 | `make run` | CI 同时验证 GCC 与 Clang |
| macOS | 支持 | `make run` | 使用 Apple Clang；提交前仍由跨平台 CI 复核 |
| WSL | 支持 | `make run` | 按 Linux 环境处理，不与 Windows 二进制混用 |
| Dev Container / Codespaces | 可选复现环境 | 同上 | 不是原生安装的强制替代品 |

GNU Make 是首选学习入口，但不是必装依赖。Makefile 只转发到 Node CLI；评分、编译参数、路径安全和退出码不会在 Make 中实现第二遍。

### 2.2 最低版本

| 工具 | 最低版本 | 用途 |
| --- | ---: | --- |
| Node.js | 22.13.0 | Lab CLI、判题器和网站 |
| pnpm | 11.1.1（由仓库固定） | 免 Make 入口、维护命令 |
| GCC | 11 | Program/Project C++ |
| Clang | 14 | Program/Project C++ |
| MSVC | 19.30（Visual Studio 2022） | Windows 原生 C++ |
| GNU Make | 4.0，推荐但可选 | `make run` 薄入口 |
| CMake | 3.25 | 仅 Project 必需 |
| Ninja | 可选 | 可作为更快的 Project 生成器；不是课程硬依赖 |

课程默认显式使用 ISO C++17。只有题目确实教授 `std::span`、concepts、ranges 等 C++20 能力，且 README 说明原因、CI 编译器都支持时，单个 Lab 才能把 `toolchain.standard` 改为 `c++20`。统一 CLI 会把该字段显式传给直接编译器或 Project 的 CMake configure；`CMakeLists.txt` 只能提供未声明时的 C++17 后备值，不能覆盖 manifest。不要依赖编译器默认方言。

仓库不提交编译器、SDK 或平台二进制。它们体积大、平台相关且需要独立安全更新；仓库提交的是最低版本、能力探测、编译 profile、CI 和可选容器配置。可参考 [GCC 标准方言](https://gcc.gnu.org/onlinedocs/gcc/Standards.html)、[Visual Studio C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)、[CMake Presets](https://cmake.org/cmake/help/latest/manual/cmake-presets.7.html) 与 [Dev Container 说明](https://docs.github.com/en/codespaces/setting-up-your-project-for-codespaces/adding-a-dev-container-configuration/introduction-to-dev-containers)。

安装后先检查，不要让 `doctor` 替你修改 PATH：

```powershell
pnpm lab:doctor -- labs/chapter-01/lab-01-06-sequential-list-deduplication
```

## 3. 统一命令与退出码

在 Program/Project Lab 内，首选体验是：

```powershell
cd labs/chapter-01/lab-01-06-sequential-list-deduplication
make doctor
make run
```

没有 GNU Make 时，在仓库根使用官方兜底：

```powershell
pnpm lab:doctor -- labs/chapter-01/lab-01-06-sequential-list-deduplication
pnpm lab:run -- labs/chapter-01/lab-01-06-sequential-list-deduplication
```

CLI 不带路径时会从当前目录向上寻找最近的 `lab.json`。维护者也可从仓库根使用 Make：

```powershell
make run LAB=labs/chapter-01/lab-01-06-sequential-list-deduplication
make run LAB=labs/chapter-01/lab-01-06-sequential-list-deduplication CASE=001-sample
```

| 命令 | 目的 | 关键选项 |
| --- | --- | --- |
| `lab:new` | 生成三类 Lab 的安全起点 | `--type --chapter --order --slug` |
| `lab:doctor` | 只读检查环境和最低版本 | `--json` |
| `lab:validate` | 校验 Schema、路径、分值、依赖和模板 | `--json` |
| `lab:build` | 编译 student/solution | `--target` |
| `lab:run` | 学习者运行公开测试 | `--case --task` |
| `lab:interactive` | 连接当前终端手工输入输出 | `--task --target` |
| `lab:score` | CI/作者严格评分 | `--case --task --json` |
| `lab:verify` | reference 满分、starter 非满分、oracle 无漂移 | `--json` |
| `lab:refresh-expected` | 预览/更新 Program 或 Project stdio 标准输出 | `--task --write` |
| `lab:pack` | 生成不含 solution 的学生包 | `--profile student` |
| `lab:clean` / `make clean` | 仅删除当前 Lab 的 `.lab-cache/` | 无 |

退出码固定为：

- `0`：命令完成；严格评分时代表自动部分满分。
- `1`：有效的学生结果，但未满分，例如 WA、CE 或 `verify` 未通过。
- `2`：环境、manifest、路径或工具内部错误。

`make run` 故意把“完成评分但未满分”转换为成功，因此 WA 不会附带 Make 自身的失败噪声；`make score` 保留严格非零退出码，供 CI 使用。

除直接接管终端输入输出的 `interactive` 外，所有命令支持 `--json`；报告顶层包含 `reportVersion`、`command`、`ok`、Lab 身份和命令结果。有效的学生 WA/CE 仍是一次成功完成的评分报告；环境、配置或 IE 必须同时得到 exit 2 与顶层 `ok: false`。脚本消费者必须先检查 `reportVersion`，不能解析人类表格。

### 3.1 终端结果与颜色

Lab CLI 在交互终端自动增强关键信息，但状态文字和 `x/y` 分数始终保留，颜色不是判定合同：

- AC、PASS 与满分使用绿色；WA、CE、RE、IE 与未满分的实际得分使用红色；TLE、OLE、PENDING 使用黄色。
- 未满分继续显示为“红色实际分/绿色满分上限”，例如 `80/100`；Project 的 manual task 显示 `PENDING`，不伪装为最终满分。
- Program 失败会展开首处差异、期望、实际和可复制的单用例 `Retry` 命令；Project 分开显示 automated、manual pending 和 provisional total。
- 表头、路径和命令只提供视觉层级；编译器、CMake、CTest 与学生 stderr 正文保持可复制，不整块染色。

需要纯文本时在任一非 interactive 命令添加 `--no-color`。设置 `NO_COLOR`、使用 `TERM=dumb` 或把输出重定向到文件时也会自动关闭颜色。`--json` 永远不含 ANSI 控制码，脚本与 CI 必须消费 JSON 字段而非带样式的人类输出。

```powershell
pnpm lab:run -- labs/chapter-01/lab-01-06-sequential-list-deduplication --no-color
pnpm lab:score -- labs/chapter-01/lab-01-06-sequential-list-deduplication --json
```

## 4. 公共目录、命名与路径安全

```text
labs/chapter-NN/lab-NN-LL-kebab-slug/
├─ README.md
├─ lab.json
├─ Makefile          # 仅 program/project
└─ 类型专属文件
```

README 是学习者说明，继续满足当前 frontmatter、客观学习目标、正常/边界/错误情况、完成清单、思考题和复盘。`lab.json` 不重复 title、chapter、order 或 contributors。

最小公共 manifest：

```json
{
  "$schema": "../../../schemas/lab.schema.json",
  "schemaVersion": 1,
  "type": "quiz",
  "quiz": {
    "questions": "quiz.json",
    "questionType": "single-choice",
    "reveal": "after-submit",
    "scoring": "points"
  }
}
```

Schema v1 只接受 `quiz`、`program`、`project`。未知主版本会立即失败，不做猜测性降级。所有声明路径必须是 Lab 内的相对路径：拒绝绝对路径、`..` 越界、缺失文件和符号链接逃逸。

通过脚手架创建：

```powershell
pnpm lab:new -- --type quiz --chapter 2 --order 3 --slug stack-quiz
pnpm lab:new -- --type program --chapter 2 --order 4 --slug stack-merge
pnpm lab:new -- --type project --chapter 4 --order 3 --slug tree-index
```

脚手架拒绝覆盖已存在目录。生成后仍必须替换占位题面、参考实现、测试和章节标题；“能生成”不是“可发布”。

### 4.1 网站侧栏的分类接口

网站的 Lab 分类属于统一 `CourseIndex`，不是另一份手写导航。课程定义只要声明 `autoLabChapter`，侧栏就统一显示“本章 Labs”的三个分类；即使当前没有任何 Lab，也必须保留三类空槽位，不要在侧栏组件里复制 Lab 名单：

| Lab 机器类型 | 侧栏分类 | 展示标签 |
| --- | --- | --- |
| `quiz` | `theory` | 理论 Theory |
| `program` | `exercise` | 实验 Exercise |
| `project` | `project` | 工程 Project |

空分类的固定文案依次为“暂无理论型 Lab”“暂无实验型 Lab”“暂无工程型 Lab”。Ch.5“树的应用”现有 5 个正式 `quiz` 和 17 个 `program`，由统一索引分别自动进入 Theory 与 Exercise；Project 仍显示空状态。新增题目仍应先按学习目标确定 `quiz`、`program` 或 `project`，不能为了填满槽位创建占位 README、manifest 或虚假题目。

有 `lab.json` 时，内容索引直接从 `type` 派生分类。没有 manifest 的 README-only Lab 若需要进入分类目录，必须在 frontmatter 显式声明：

```yaml
labCategory: exercise # theory | exercise | project
```

不要按标题、slug 或关键词猜测类型。新增或调整分类后，至少运行 `pnpm run validate`、`pnpm run test:discovery`、`pnpm run build` 和 `pnpm run check:site`；涉及侧栏范围、样式或 Pages base 时，再运行 `pnpm run test:pages`。侧栏、Labs 首页、搜索与路由必须继续消费同一 `CourseIndex`。

## 5. Quiz：理论选择题

### 5.1 目录与单一事实来源

```text
lab-NN-LL-topic-quiz/
├─ README.md
├─ lab.json
└─ quiz.json
```

README 只能挂载一次：

```md
## 选择题

<QuizSet />
```

不要在 README 再维护题面、A～D 列表、静态答案表或 `details` 题解。题目、答案和解析只改 `quiz.json`；折叠答案总览由组件生成。

### 5.2 完整题目模板

```json
[
  {
    "id": "stack-lifo-01",
    "stem": "下列哪项最准确描述栈的访问约束？",
    "options": [
      "先进先出",
      "后进先出",
      "按关键字随机访问",
      "只能访问最早插入的元素"
    ],
    "answer": 1,
    "explanation": "栈只允许在栈顶插入和删除，因此最后进入的元素最先离开。",
    "hint": "关注允许插入和删除的位置。",
    "points": 2,
    "source": "课程自编",
    "difficulty": "入门",
    "topics": ["栈", "LIFO"],
    "targetId": "stack-lifo-01",
    "code": "push(1);\npush(2);\npop();"
  }
]
```

约束：

- `id` 非空且题库内唯一；发布后保持稳定。
- `options` 恰好四项，非空且不能重复。
- 不要在选项文本手写 `A.`、`B.`、`C.`、`D.`，组件统一生成字母。
- `answer` 是 `0～3` 的整数索引，不是答案字母。
- `explanation` 必填，提交前不显示；`hint` 可选，提交前由学习者主动展开。
- `points` 是正整数，省略时为 1；页面显示已答数、正确数和当前分/总分。
- `source` 与 `targetId` 是可选元信息。个人题库默认保留可追溯来源；若维护者在页面验收中明确要求隐藏，则可同时省略这两个字段并移除题面中的来源行，但必须保留稳定内部 `id`，并在 task/PR 中记录该决定。
- 题面、选项、提示和解析由构建期 Markdown 安全渲染，原始 HTML 关闭。

### 5.3 Quiz 作者检查

1. `pnpm lab:validate -- <lab-path>`。
2. 在网站真实完成“选择 → 提交 → 反馈 → 题解 → 重试”。
3. 检查 390px 移动端无根页面横向溢出。
4. 人工逐题核对答案索引、干扰项、解析和来源；若来源按维护者决定不公开，则核对 task/PR 中的省略记录。
5. 确认 README 没有第二份答案，个人导出痕迹已清除。

### 5.4 Quiz 配图规范

题干和解析是 `quiz.json` 里的 Markdown 字符串：构建期安全渲染、原始 HTML 关闭，且 `quiz.schema.json` 目前没有图片字段。因此**不要**在题目中使用 `<img>` 标签或图片附件字段；需要配图时按以下两种方式：

1. **文字/ASCII 图（默认首选）**：在题干或解析中用 ```text``` 代码块画图，或给出邻接表/边表/网格等结构。例如迷宫网格、树形结构、图的邻接表。无外部依赖，任何环境渲染一致。
2. **引用站点内 SVG（需要真图时）**：用 Markdown 图片语法 `![说明文字](相对路径)` 引用 `public/` 下的 SVG：
   - 图文件放在 `public/quiz-images/`（手工维护的题库图），或复用 `public/diagrams/`（构建期由 `vitepress-plugin-diagrams` 从 graphviz 源生成）；
   - 路径写成从 Lab 页面可解析的相对路径，如 `../../../diagrams/graphviz-dfs-bfs-q04-graph-xxxx.svg`；不要硬编码部署前缀（如 `/DSA-Mastery/`）；
   - 用插件生成时，把 graphviz 源写在同 Lab 的图源页（如 `quiz-figures.md`），构建后按 `public/diagrams/` 中实际生成的文件名引用；文件名含内容哈希，图源一旦改动就会换名，需要同步更新引用；
   - 最终 `pnpm run build` 与 `check:site` 必须通过，内部图片链接会逐一校验。

约束：

- 配图是锦上添花：能用文字或邻接表讲清的结构优先文字，不为每道题强行配图；
- 题面配图不得泄露答案（例如边分类题只画图、不标注分类结果）；解析中的配图不受此限；
- 不引用外链图片，不使用原始 HTML `<img>`；
- 图源页（如 `quiz-figures.md`）是构建素材、不面向学习者：在 frontmatter 中添加 robots `noindex, nofollow`，并在站点 `sitemap.transformItems` 中过滤掉该页 URL，避免进入搜索引擎索引与站点地图；页面不会加入导航。

## 6. Program：单题 C++ 作业

### 6.1 标准内容包

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
   └─ ...
```

`student/main.cpp` 必须能编译，但初始不能得到满分。`solution/main.cpp` 是经人工 Review 的参考实现，必须稳定得到 100 分。manifest 支持声明多个源文件和 include 目录，不要求把一道题硬塞进单个 `.cpp`。

### 6.2 Program manifest

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
    "student": {
      "sources": ["student/main.cpp"],
      "includeDirs": []
    },
    "solution": {
      "sources": ["solution/main.cpp"],
      "includeDirs": []
    }
  },
  "judge": {
    "kind": "stdio",
    "cases": "tests/cases.json",
    "compare": { "mode": "tokens" },
    "limits": { "timeMs": 2000, "outputKb": 1024 }
  }
}
```

### 6.3 测试用例与 100 分制

```json
[
  {
    "id": "sample",
    "input": "tests/001-sample.in",
    "expected": "tests/001-sample.out",
    "points": 20,
    "tags": ["sample"],
    "compare": { "mode": "exact" }
  },
  {
    "id": "boundary-empty",
    "input": "tests/002-empty.in",
    "expected": "tests/002-empty.out",
    "points": 80,
    "tags": ["boundary"],
    "timeMs": 1000,
    "outputKb": 64
  }
]
```

规则：用例 ID 唯一，分值为正整数且合计 100；`.in/.out` 成对存在；用例可覆盖 Lab 级比较模式、时间和输出限制，但 README 要解释特殊原因。

测试不能只有题面样例。至少考虑：

- `sample`：帮助读者理解协议，不承担全部检错责任。
- `normal`：代表性普通输入。
- `boundary`：空、单元素、最小/最大规模、重复值、负数等。
- `error`：只在题面定义错误输入行为时加入。
- `stress`：规模与复杂度验证，注意本地评分器不是性能基准平台。
- `regression`：每个曾逃过测试的错误都留下最小反例。

### 6.4 输出比较与判定

所有模式先统一 CRLF/LF；`exact` 还允许两侧最多相差一个末尾 LF，但不忽略内部换行或其他空白。`refresh-expected --write` 固定把 `.out` 写为 LF，避免 Windows 与 Unix 作者反复制造换行 diff：

| 模式 | 语义 | 适用场景 |
| --- | --- | --- |
| `exact` | 除平台换行和一个可选末尾 LF 外逐字符相等；不忽略内部换行、额外空行或其他空白 | 输出格式本身是考点 |
| `tokens` | Unicode 空白切 token 后逐项比较 | 普通算法题默认 |
| `float` | 数值 token 按绝对/相对误差，其他 token 精确 | 数值计算 |

浮点配置示例：

```json
{
  "mode": "float",
  "absTol": 0.000001,
  "relTol": 0.000001
}
```

判定包括 AC、WA、TLE、RE、CE、OLE、IE。stdout 是唯一判题输出，stderr 只显示诊断；调试日志必须写 stderr。WA 会显示第一处字符或 token 差异，不把整个大输出刷进终端。

评分器使用参数数组启动程序、关闭 shell 拼接，并限制运行时间与输出量。这能处理路径空格和常见注入风险，但它不是恶意代码沙箱：只运行你信任的仓库代码，不要在个人主机执行来源未知的 PR 二进制。

### 6.5 Makefile 为什么仍在 Lab 内

每个可执行 Lab 的 Makefile 只有三行，用于支持 `cd` 后立即 `make run`。真实规则只在仓库级 `tools/lab/lab.mk`。

<!-- LAB_THIN_MAKEFILE:START -->
```makefile
LAB_DIR := $(CURDIR)
REPO_ROOT := $(LAB_DIR)/../../..
include ../../../tools/lab/lab.mk
```
<!-- LAB_THIN_MAKEFILE:END -->

不要在单个 Lab 加编译 recipe、diff 脚本或私有 target；`lab:validate` 会报告模板漂移。项目根 Makefile 负责维护者批量入口，Lab 内薄文件负责学习者就地入口，两者最终调用同一 CLI。

### 6.6 参考输出生命周期

```powershell
# 只预览差异，不写文件
pnpm lab:refresh-expected -- labs/chapter-01/lab-01-06-sequential-list-deduplication

# 人工确认 diff 后显式更新
pnpm lab:refresh-expected -- labs/chapter-01/lab-01-06-sequential-list-deduplication --write

# 检查 solution=100、starter<100、.out 无漂移
pnpm lab:verify -- labs/chapter-01/lab-01-06-sequential-list-deduplication
```

不要手工运行 solution 后用重定向悄悄覆盖 `.out`。标准输出是可 Review 的稳定 oracle；任何改变都应先看到 diff。

## 7. Project：大型多任务 Lab

### 7.1 何时升级为 Project

满足至少一项再使用：有两个以上可独立验收的 task；多个 task 共用接口或库；需要 CMake target；自动测试之外还有报告/图表/复杂度说明等人工分。Project 不是“更长的 Program”。

### 7.2 目录

```text
lab-NN-LL-project/
├─ README.md
├─ lab.json
├─ Makefile
├─ CMakeLists.txt
├─ CMakePresets.json
├─ contracts/          # 稳定公共接口
├─ include/            # 可选公共头文件
├─ src/                # 可选公共实现
├─ tasks/
│  ├─ task-01-name/
│  │  ├─ README.md
│  │  ├─ task.json
│  │  ├─ student/
│  │  ├─ solution/
│  │  └─ tests/
│  └─ task-02-name/
└─ report/
   ├─ task.json
   └─ template.md
```

### 7.3 顶层任务图

```json
{
  "$schema": "../../../schemas/lab.schema.json",
  "schemaVersion": 1,
  "type": "project",
  "language": "cpp",
  "toolchain": {
    "standard": "c++17",
    "profile": "course-default"
  },
  "buildSystem": "cmake",
  "tasks": [
    {
      "id": "parser",
      "path": "tasks/task-01-parser",
      "weight": 30,
      "kind": "stdio",
      "dependsOn": []
    },
    {
      "id": "algorithm",
      "path": "tasks/task-02-algorithm",
      "weight": 50,
      "kind": "ctest",
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

Task ID 唯一，权重合计 100，依赖必须存在且无环。依赖用于推荐执行顺序和诊断，不默认形成得分门禁。

支持三种 task：

- `stdio`：task.json 声明 student/solution、cases 和比较器，复用 Program 判题内核。
- `ctest`：CMake 构建，task.json 把 CTest 名称映射到合计 100 的 task 内部分值。
- `manual`：列出 Reviewer 清单，不伪造自动分。

人工 task 示例：

```json
{
  "$schema": "../../../../schemas/task.schema.json",
  "schemaVersion": 1,
  "kind": "manual",
  "checklist": [
    "解释接口与关键不变量",
    "给出边界和失败测试证据",
    "分析时间与空间复杂度"
  ]
}
```

### 7.4 CMake/CTest 约束

- `CMakeLists.txt` 用 target 表达公共库和依赖，不用全局 include/flags 隐式串联。
- 提交 `CMakePresets.json`，不提交个人 `CMakeUserPresets.json`。
- `student` 与 `solution` preset 使用各自 `.lab-cache/cmake/...` 构建目录。
- CTest 名称必须与 `task.json` 完全一致。
- 每个自动 task 可单独运行；顶层 score 聚合权重。

```powershell
make run TASK=frequency
make run TASK=codec
make refresh-expected TASK=frequency
make score
pnpm lab:verify -- labs/chapter-08/lab-08-03-avl-tree-rotations
```

结果明确区分：

```text
Automated: 80/80
Manual pending: 20
Provisional total: 80/100
```

不要把 `80/80` 写成最终 `100/100`；manual task 必须由 Review Owner 实际评阅。

## 8. 学生包

完整公开仓库保留 solution，适合自学与维护。需要只发作业时：

```powershell
pnpm lab:pack -- labs/chapter-01/lab-01-06-sequential-list-deduplication --profile student
```

包生成到该 Lab 的 `.lab-cache/packages/`，不会回写源码。学生包：

- 排除所有 `solution/`、缓存、构建产物和二进制；
- 保留 student、公开测试、README、manifest 与本地 runner；
- 使用独立薄 Makefile，不依赖原仓库 `../../..`；
- 同时支持 `make run` 和 `pnpm lab:run`。

打包后必须在包目录重新执行 `validate` 和 `run`，并搜索确认没有 solution。公开测试和参考答案防不了主动查看仓库历史；它们服务自学与可复现，不是保密考试系统。

## 9. 作者工作流

### 9.1 Quiz

1. 冻结学习目标、考点范围和题目来源。
2. `lab:new` 生成骨架。
3. 写稳定 ID、四个选项、答案、解析、提示和分值。
4. 运行 validate 与网站交互检查。
5. Reviewer 独立核对每道题的知识正确性和干扰项。

### 9.2 Program

1. 先冻结 stdin/stdout、数据范围、比较模式和边界行为。
2. 先写 reference 与代表性测试，再写可编译 starter。
3. `refresh-expected --write` 生成标准输出并审阅 diff。
4. 已知正确解应 100；starter 应可编译但不满分；至少准备一个已知错误版本证明测试能抓错。
5. Reviewer 在干净环境按 README 执行 doctor、run、score、verify。

### 9.3 Project

1. 先冻结最终交付物，再拆 task、权重、依赖和共享 API。
2. 每个 task 单独写 README 与客观验收。
3. stdio 复用判题器，组件级行为用 CTest，论证类交付物用 manual。
4. 逐 task 运行后再聚合；验证 reference 自动满分和 starter 非满分。
5. Reviewer 至少从早期 task 走到最终集成，并检查错误能定位到具体 task/test。

## 10. Author Check、CI 与 Review 证据

提交前至少执行：

```powershell
pnpm test
pnpm lab:verify -- labs/chapter-01/lab-01-06-sequential-list-deduplication
pnpm lab:verify -- labs/chapter-08/lab-08-03-avl-tree-rotations
```

PR 记录：操作系统、Node/pnpm、编译器/CMake 版本、实际命令、关键分数、未执行项及原因。CI 在 Ubuntu 验证 GCC/Clang，在 Windows 验证 MSVC；网站 job 验证静态契约、构建、Pages 产物和浏览器交互。外部 PR 只获得只读 token，不向执行学生代码的 job 注入部署秘密。

Review Owner 不能只引用作者截图：从干净 clone 独立复现至少一个 Golden/变更 Lab，检查工作树除忽略的 `.lab-cache/` 外没有构建污染。

工具通过只证明接口和样例一致，不证明题面、答案、复杂度、测试充分性或版权正确；这些仍由人负责。

## 11. 旧 Lab 渐进迁移

README-only Lab 继续正常渲染，不要求一次重写全部历史内容。按真实维护需求逐个迁移：

1. 判定它是 Quiz、Program、Project，还是应继续保持 README-only。
2. 保留现有 URL、frontmatter、学习目标与知识正文。
3. 用脚手架在临时位置查看目标结构，不直接覆盖旧目录。
4. 添加最小 manifest；再迁移源码、solution、tests 和薄 Makefile。
5. 执行 validate/verify、网站 discovery/build 和 Review。
6. 在 PR 中记录未迁移 Lab 清单，不把“尚未迁移”伪装成错误。

现有交互 Quiz 均已使用 manifest；其他旧内容按 [旧 Lab 渐进迁移清单](https://github.com/AzenAnn/DSA-Mastery/blob/main/docs/LAB_MIGRATION_TRACKER.md)与章节更新节奏处理。

## 12. 常见错误与正确做法

错误：每个 Lab 复制一份复杂 Makefile。  
正确：保留固定三行薄 Makefile，行为集中在 `tools/lab/lab.mk` 与 CLI。

错误：Windows 学习者必须先装 Make 才能做题。  
正确：Make 推荐；`pnpm lab:run -- <path>` 是同等权威兜底。

错误：选项写成 `A. O(n)`，同时 README 维护答案表。  
正确：JSON 只写 `O(n)`，答案索引与总览均由 QuizSet 读取。

错误：student starter 编译失败，或直接复制 solution 得 100。  
正确：starter 可编译、意图清楚、初始非满分。

错误：修改 solution 后直接覆盖 `.out`。  
正确：先预览 diff，只有显式 `--write` 才更新，再运行 verify。

错误：只用 sample 一个用例给 100 分。  
正确：按正常、边界、错误、压力和回归风险设计测试结构。

错误：Project 把报告分悄悄算入自动满分。  
正确：显示 automated、manual pending 和 provisional total。

错误：把本地评分器当作不可信代码沙箱。  
正确：只执行可信代码；不向 PR job 提供秘密或写权限。

## 13. 故障排查

| 现象 | 检查 |
| --- | --- |
| `LAB_NOT_FOUND` | 命令路径是否位于含 `lab.json` 的 Lab 内，或显式传 Lab 路径 |
| `SCHEMA_VERSION` | manifest 是否仍为 v1；不要擅自改主版本 |
| `PATH_ESCAPE` | 移除绝对路径、`..` 或指向 Lab 外的符号链接 |
| `MAKEFILE_DRIFT` | 恢复本指南的三行薄模板 |
| `COMPILER_NOT_FOUND` | 运行 doctor，确认编译器在当前终端 PATH；Windows 可直接走 pnpm 兜底，但仍需 C++ 编译器 |
| `CE` | 查看编译器 stderr；先修编译问题再分析用例 |
| `WA` | 查看第一处差异；确认 compare mode 是否符合题面 |
| `TLE` | 检查死循环、复杂度和 `timeMs` 是否合理 |
| `OLE` | 删除 stdout 调试日志，必要时合理调整 `outputKb` |
| `IE` | manifest/文件/进程启动异常；不是学生错误，不能报告为 0 分后静默继续 |
| CMake configure 失败 | 检查 CMake ≥ 3.25、当前平台生成器、preset 名和缓存；可选安装 Ninja，必要时先 `make clean` |
| Project 自动分满但总分未满 | 正常：manual task 等待 Reviewer |

## 14. 最终 Definition of Done

公共：

- [ ] 类型选择合理，Schema v1、目录、路径和 README 契约通过。
- [ ] 学习目标、输入输出、前置知识、边界、错误和完成标准可检查。
- [ ] 生成物只在 `.lab-cache/`，工作树不被构建污染。
- [ ] `pnpm test`、目标 Lab 的 validate/verify 和必要 Pages 测试有真实结果。
- [ ] Reviewer 在干净 clone 独立复现，PR 记录版本、命令、分数与风险。

Quiz：

- [ ] 恰好四个无前缀选项，ID/答案/解析/points 合法，无 README 答案副本。
- [ ] 选择、提交、提示、反馈、题解、重试、进度和总分在桌面/移动可用。

Program：

- [ ] starter 可编译且非满分；solution 100；cases 合计 100；oracle 无漂移。
- [ ] exact/tokens/float 选择合理，stdout/stderr、超时和输出上限有验证。
- [ ] `make run`、单用例、interactive、严格 score 与 pnpm 兜底一致。
- [ ] student pack 不含 solution/cache/binary，并能脱离原仓库运行。

Project：

- [ ] task ID/权重/依赖合法且无环，stdio/ctest/manual 使用边界清楚。
- [ ] CMake target、preset、CTest 名和 task.json 一致；单 task 与聚合评分都可运行。
- [ ] 自动分和人工待评分分开，reference 自动满分，starter 非满分。

接口发生变化时，同一 PR 必须同步 Schema、CLI、Golden Lab、自动测试、本指南和 Trellis 规范。任何一项缺失，都说明更新机制还没有真正完成。
