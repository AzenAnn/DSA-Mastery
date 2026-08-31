# Lab 命令与接口使用指南

DSA Mastery 的 Quiz、Program 与 Project 共用一套 Lab 描述格式，但它们的“完成方式”并不相同：Quiz 在网页中提交选项，Program 逐个运行标准输入输出用例，Project 则把多个 `stdio`、`ctest` 与 `manual` task 汇总为工程成绩。

本指南从学习者最常用的 `pnpm lab:run` 出发，逐步展开到单用例、单 task、严格评分、JSON、Make 和作者维护命令。读完后，你应该能看懂一条命令究竟在检查什么，也能判断某个参数是否适用于当前题目。

::: info 适用范围
下面的命令以仓库当前实现为准。命令中的 `<lab-path>`、`<case-id>` 和 `<task-id>` 都是占位符，实际输入时不要保留尖括号。

GNU Make 是可选快捷入口。==没有安装 Make 不会影响 pnpm 的检查和评分能力==。
:::

## 30 秒选择入口

只想马上开始时，先认清当前 Lab 的类型，再使用对应入口。

::: code-group

```text [Quiz · 网页作答]
打开题目页面
  → 选择答案
  → 提交本题
  → 查看得分与解析
```

```powershell [Program · 代码题]
pnpm lab:doctor -- labs/chapter-01/lab-01-06-sequential-list-deduplication
pnpm lab:run -- labs/chapter-01/lab-01-06-sequential-list-deduplication
```

```powershell [Project · 工程题]
pnpm lab:doctor -- labs/chapter-01/lab-01-21-list-workload-analyzer
pnpm lab:run -- labs/chapter-01/lab-01-21-list-workload-analyzer
```

:::

| 你现在想做什么 | 首选命令 | 结果 |
| --- | --- | --- |
| 检查本机能不能做题 | `pnpm lab:doctor` | 编译器、CMake、Make 与最低版本 |
| 检查题目文件是否完整 | `pnpm lab:validate` | Schema、路径、用例、task 与依赖 |
| 运行公开测试并看得分 | `pnpm lab:run` | Program 用例表或 Project task 面板 |
| 只重跑一个失败点 | `--case` / `--task` | 缩小反馈范围 |
| 在终端手工输入 | `pnpm lab:interactive` | 学生程序直接接管当前终端 |
| 严格判断自动部分是否满分 | `pnpm lab:score` | 未满分时退出码为 `1` |
| 没有安装 GNU Make | 继续使用 pnpm | 功能不受影响 |

::: intuition 心智模型 · 一套评分内核，两种命令外壳
pnpm 与 Make 并不是两套判题系统。它们最终都会调用 `tools/lab/cli.mjs`：pnpm 适合所有平台，Make 只是把较长命令缩短为 `make run`、`make score` 等形式。
:::

## 先看懂一条 pnpm 命令

一条完整命令由四部分组成：

```powershell:line-numbers [lab-command-shape.ps1]
pnpm lab:run -- labs/chapter-01/lab-01-06-sequential-list-deduplication --case 001-sample
#     └─脚本名   └─pnpm 参数分隔符        └─Lab 路径                         └─CLI 选项
```

- `pnpm lab:run`：运行 `package.json` 中的 `lab:run` 脚本；写成 `pnpm run lab:run` 也等价。
- `--`：告诉 pnpm，后面的内容交给 Lab CLI。只运行默认行为、没有额外参数时可以省略。
- `<lab-path>`：仓库中的 Lab 目录；每条命令最多接受一个路径。
- `--case 001-sample`：只选择 ID 为 `001-sample` 的公开用例。

<dfn>Lab 路径</dfn>既可以显式写出，也可以由当前目录推断：

::: code-group

```powershell [仓库根目录 · 显式路径]
pnpm lab:run -- labs/chapter-01/lab-01-06-sequential-list-deduplication
```

```powershell [Lab 目录内 · 省略路径]
cd labs/chapter-01/lab-01-06-sequential-list-deduplication
pnpm lab:run
pnpm lab:run -- --case 001-sample
```

:::

省略路径时，CLI 从启动命令的目录向上寻找最近的 `lab.json`。因此在 `student/`、`tests/` 等 Lab 子目录中启动，也仍能定位当前题目；如果一路找不到，就返回 `LAB_NOT_FOUND`。

::: pitfall 易错点 · 裸 `pnpm run` 不是判题命令
当前仓库要求写出完整脚本名，例如 `pnpm lab:run` 或 `pnpm lab:score`。单独输入 `pnpm run` 只会列出 package scripts，单独输入 `pnpm test` 运行的是仓库质量门禁，都不会自动匹配当前 Lab。
:::

## 三类 Lab 的能力边界

| 操作 | Quiz | Program | Project |
| --- | :---: | :---: | :---: |
| 网页交互答题 | ✓ | — | — |
| `doctor` / `validate` | ✓ | ✓ | ✓ |
| `build` | — | ✓，直接编译 | ✓，CMake configure + build |
| `run` / `score` | — | ✓，逐 case | ✓，逐 task，可嵌套 case/CTest |
| `interactive` | — | ✓ | 仅 `stdio` task |
| `verify` | ✓，题库合同 | ✓，参考实现与 oracle | ✓，自动 task、权重与 oracle |
| `refresh-expected` | — | ✓ | 仅 `stdio` task |
| `pack --profile student` | — | ✓ | ✓ |
| Lab 内 `make ...` | 默认无 Makefile | ✓ | ✓ |
| `clean` | ✓ | ✓ | ✓ |

::: tip Quiz 为什么没有 `run`？
Quiz 的答案提交、提示、解析和得分由网页组件完成，不需要 C++ 编译器，也没有 Program 那样的标准输入输出判题。维护者仍可运行 `validate` 或 `verify` 检查题库格式。
:::

## pnpm 操作总表

仓库目前公开 12 个 Lab scripts。下表区分学习者高频操作与作者维护操作。

| pnpm script | 适用类型 | 作用 | 关键参数 |
| --- | --- | --- | --- |
| `lab:new` | 新建三类 Lab | 自动分配稳定编号并生成安全脚手架 | `--type --chapter --slug [--order]` |
| `lab:locate` | 全部 | 用 `02T3` 一类稳定编号定位目录 | `<lab-id> --json` |
| `lab:doctor` | 全部 | 只读探测环境与最低版本 | `--json --no-color` |
| `lab:validate` | 全部 | 校验 manifest、路径、用例、题库与 task 依赖 | `--json --no-color` |
| `lab:build` | Program / Project | 编译 `student` 或 `solution` | `--target` |
| `lab:run` | Program / Project | 运行公开测试；未满分仍正常结束 | `--case --task --target` |
| `lab:interactive` | Program / Project stdio | 手工输入输出，程序直接接管终端 | `--task --target` |
| `lab:score` | Program / Project | 严格评分；自动部分未满分返回 `1` | `--case --task --target --json` |
| `lab:verify` | 全部 | 验证题目作者声明的完整合同 | `--json --no-color` |
| `lab:refresh-expected` | Program / Project stdio | 预览或更新参考 `.out` | `--task --write` |
| `lab:pack` | Program / Project | 生成不包含 solution 的学生包 | `--profile student` |
| `lab:clean` | 全部 | 只删除当前 Lab 的 `.lab-cache/` | `--json --no-color` |

查看 CLI 内置帮助：

```powershell
node tools/lab/cli.mjs help
```

## 参数字典

### 选择范围与编译目标

| 参数 | 可用命令 | 默认行为 | 实际含义 |
| --- | --- | --- | --- |
| `<lab-path>` | 除 `new`、`locate` 外 | 当前启动目录 | 指向 Lab 或其内部文件/目录，CLI 向上寻找 `lab.json` |
| `--target student\|solution` | `build`、`run`、`interactive`、`score` | `student` | 选择学生实现或参考实现 |
| `--case <id>` | `run`、`score` | 全部公开用例 | Program 用例，或 Project `stdio` task 的用例 |
| `--task <id>` | `run`、`interactive`、`score`、`refresh-expected` | 依命令而定 | 选择 Project task；Program 不需要它 |

`--task` 没有填写时：

- Project 的 `run` / `score` 处理全部 task；
- `refresh-expected` 处理全部 `stdio` task；
- `interactive` 最好始终显式指定一个 `stdio` task，避免选中 CTest 或人工 task；
- `--case` 在 Project 中应和 `--task <stdio-task>` 配对，含义最清楚。

`--target solution` 主要供作者验证参考实现。学生分发包不包含 `solution`，在那里应保持默认的 `student`。

### 输出与写操作

| 参数 | 可用命令 | 作用 |
| --- | --- | --- |
| `--json` | 除 `interactive` 外 | 输出 `reportVersion: 1` 的机器报告，不含 ANSI 颜色 |
| `--no-color` | 除 `interactive` 外 | 强制输出纯文本；重定向、`NO_COLOR` 或 `TERM=dumb` 也会自动关闭颜色 |
| `--write` | 仅 `refresh-expected` | 把预览到的参考输出变化真正写入 `.out` |
| `--profile student` | 仅 `pack` | 当前唯一支持的打包 profile |

::: warning `--write` 是明确的写入开关
`refresh-expected` 默认只比较参考实现与现有 `.out`，不会修改文件。只有维护者确认参考实现正确后，才应添加 `--write`；学习者做题通常不需要这条命令。
:::

### 新建 Lab 的参数

`lab:new` 不接受 Lab 路径。类型、章节和 slug 必填；稳定编号由工具扫描同章同类 Lab 后自动分配：

| 参数 | 允许值 | 示例 |
| --- | --- | --- |
| `--type` | `quiz`、`program`、`project` | `--type program` |
| `--chapter` | `0`～`99` 的整数 | `--chapter 2` |
| `--order` | 可选的非负整数 | `--order 4`；只控制网站展示顺序 |
| `--slug` | 小写 kebab-case | `--slug stack-merge` |

```powershell
pnpm lab:new -- --type program --chapter 2 --slug stack-merge
```

假设第 2 章已有 `02E01`～`02E08`，这条命令会生成 `02E09`，目录为 `lab-02-E-09-stack-merge`。编号按“最大值加一”计算，删除 `02E04` 后也不会复用旧号。省略 `--order` 时，新 Lab 排在本章现有 Lab 之后；显式填写只改变展示位置，不改变稳定 ID。

三类编号互不占用：`quiz`、`program`、`project` 分别得到 `T`、`E`、`P` 标签，并在每章各自从 `01` 开始。并行分支可能同时拿到同一个下一个编号，CI 会拒绝重复 ID；后合并的分支同步 `main` 后重新创建即可。

### 用稳定编号定位题目

规范编号写作 `02T03`，交流时可以简写成 `02T3`。定位命令同时接受 `2t3`、`02-T-03` 和 `lab02-T-03`。下面使用仓库中实际存在的 `02T02` 演示：

```powershell
pnpm lab:locate -- 02T2
pnpm lab:locate -- 02T2 --json
```

第一条输出规范 ID 和仓库相对路径；第二条适合编辑器、Issue Bot 或其他脚本消费。编号不存在、格式错误或全仓重复都会以工具错误结束，不会猜测最接近的题目。

## Program：从运行到定位单个错误

Program 把一个 C++ 程序放入若干公开用例。每个 case 都有输入、期望输出、分值和限制；评分面板会显示 `CASE / RESULT / TIME / SCORE`。

### 推荐学习循环

```powershell:line-numbers [program-workflow.ps1]
$lab = "labs/chapter-01/lab-01-06-sequential-list-deduplication"

pnpm lab:doctor -- $lab
pnpm lab:validate -- $lab
pnpm lab:run -- $lab
pnpm lab:run -- $lab --case 001-sample
pnpm lab:interactive -- $lab
pnpm lab:score -- $lab
pnpm lab:clean -- $lab
```

1. `doctor` 先确认至少一个 C++ 编译器满足最低版本；Make 找不到只是可选项提示。
2. `validate` 检查题目结构，不编译学生答案。
3. `run` 编译 `student` 并运行全部公开用例。
4. 失败时复制面板给出的 Retry，或自己使用 `--case` 重跑。
5. `interactive` 让你手工输入；按 <kbd>Ctrl</kbd> + <kbd>C</kbd> 可中止仍在等待的程序。
6. `score` 适合完成前的严格检查。

::: property 输出约定 · stdout 参与判题
Program 的标准输出 `stdout` 会与 `.out` 比较。临时调试内容应写入标准错误 `stderr`，否则多打印的一行也可能得到 `WA`。
:::

### `build`、`run` 与 `interactive` 的区别

| 命令 | 会编译 | 会喂测试输入 | 会比较输出 | 适合场景 |
| --- | :---: | :---: | :---: | --- |
| `build` | ✓ | — | — | 只确认能否编译，定位 `CE` |
| `run` | ✓ | ✓ | ✓ | 日常做题和看分数 |
| `interactive` | ✓ | 由你输入 | — | 手工试验、观察程序行为 |

## Project：task、CTest 与人工评分

Project 是多个子任务的集合。`lab.json` 为每个 task 声明 ID、类型、权重和依赖。

| task kind | 执行方式 | 能否使用 `--case` | 得分方式 |
| --- | --- | :---: | --- |
| `stdio` | 与 Program 相同的输入输出 runner | ✓ | case 得分按 task 权重折算 |
| `ctest` | CMake 构建后逐项运行 CTest | — | CTest 分值按 task 权重折算 |
| `manual` | 不自动执行代码 | — | 显示 `PENDING`，等待人工 Review |

### 工程题的三层选择

```powershell:line-numbers [project-workflow.ps1]
$project = "labs/chapter-08/lab-08-03-avl-tree-rotations"

# 整个 Project：stdio + CTest + manual pending
pnpm lab:run -- $project

# 只运行一个 stdio task
pnpm lab:run -- $project --task frequency

# 只运行该 task 的一个公开 case
pnpm lab:run -- $project --task frequency --case weighted

# 只运行 CTest task
pnpm lab:run -- $project --task codec

# 严格检查全部自动 task
pnpm lab:score -- $project
```

如果 Project 只有 CTest 与 manual task，例如第一章的线性表工程题，可以按 task 缩小范围：

```powershell
pnpm lab:run -- labs/chapter-01/lab-01-21-list-workload-analyzer --task sequential-list
pnpm lab:run -- labs/chapter-01/lab-01-21-list-workload-analyzer --task linked-list
pnpm lab:run -- labs/chapter-01/lab-01-21-list-workload-analyzer --task workload-runner
```

结果底部的三个数字含义不同：

- **Automated**：所有 `stdio` 与 `ctest` 自动 task 已获得的分数；
- **Manual pending**：仍需人工查看的权重；
- **Provisional total**：当前自动得分，不是把人工分提前算满。

::: warning 自动满分不等于最终人工验收完成
Project 的 `score` 只严格判断自动部分。即使退出码为 `0`，只要仍显示 `MANUAL REVIEW PENDING`，报告、复杂度分析或复盘就还需要人工检查。
:::

Project 的 `interactive` 只支持 `stdio` task：

```powershell
pnpm lab:interactive -- labs/chapter-08/lab-08-03-avl-tree-rotations --task frequency
```

CTest 或 `manual` task 不能用交互模式。

## `run` 与 `score`：看起来相似，退出码不同

两者使用相同的编译、运行、比较和计分内核。差异主要是调用者如何理解“没有满分”。

| 情况 | `lab:run` | `lab:score` |
| --- | ---: | ---: |
| 自动部分满分 | exit `0` | exit `0` |
| 有效完成评分但未满分 | exit `0` | exit `1` |
| 环境、配置或内部错误 | exit `2` | exit `2` |

- 学习者使用 `run`：`WA`、`CE` 等是反馈，不应再被终端包装成“命令执行失败”。
- 作者或 CI 使用 `score`：非零退出码可以阻止未满分结果被当作通过。
- `IE` 表示评分器或配置未能正常完成，不能伪装成学生的 `0` 分。

## 判定状态速查

| 状态 | 含义 | 优先检查 |
| --- | --- | --- |
| `AC` | Accepted，输出正确 | 当前 case 已通过 |
| `WA` | Wrong Answer，输出不符 | 首处差异、空格/换行、边界逻辑 |
| `TLE` | Time Limit Exceeded | 死循环、复杂度、输入推进 |
| `RE` | Runtime Error | 越界、空指针、异常退出 |
| `CE` | Compile Error | 编译诊断、类型、头文件、语法 |
| `OLE` | Output Limit Exceeded | 无限打印、调试输出过多 |
| `IE` | Internal Error | manifest、runner、进程或工具内部错误 |
| `PENDING` | 等待人工评分 | Project 的报告、设计与复盘 |

终端使用颜色增强结果，但状态文字、实际分与满分上限始终保留，因此复制到纯文本或使用 `--no-color` 也能读懂。

## JSON：给脚本和 CI 使用

人类阅读默认彩色面板；自动化程序应消费 JSON 字段，不要用正则解析对齐表格。

```powershell
pnpm lab:score -- labs/chapter-01/lab-01-06-sequential-list-deduplication --json
pnpm lab:score -- labs/chapter-01/lab-01-06-sequential-list-deduplication --json > lab-report.json
```

报告顶层稳定包含：

```json [lab-report-shape.json]
{
  "reportVersion": 1,
  "command": "score",
  "ok": true,
  "lab": {
    "path": "absolute-lab-path",
    "type": "program",
    "schemaVersion": 1
  }
}
```

`ok` 表示命令是否在没有工具内部错误的情况下完成，不等于学生一定满分；脚本还应检查命令结果与进程退出码。

## Make：同一套能力的短命令

Program 和 Project 的 Makefile 只有三行薄入口，真实逻辑集中在 `tools/lab/lab.mk`。因此 `make run` 和 `pnpm lab:run` 使用同一份 manifest、编译器选择、测试和计分规则。

::: code-group

```powershell [进入 Lab 后]
cd labs/chapter-01/lab-01-06-sequential-list-deduplication
make doctor
make run
make run CASE=001-sample
make interactive
make score
```

```powershell [停留在仓库根目录]
make doctor LAB=labs/chapter-01/lab-01-06-sequential-list-deduplication
make run LAB=labs/chapter-01/lab-01-06-sequential-list-deduplication
make run LAB=labs/chapter-01/lab-01-06-sequential-list-deduplication CASE=001-sample
```

```powershell [Project task]
make run LAB=labs/chapter-08/lab-08-03-avl-tree-rotations TASK=frequency
make run LAB=labs/chapter-08/lab-08-03-avl-tree-rotations TASK=frequency CASE=weighted
make run LAB=labs/chapter-08/lab-08-03-avl-tree-rotations TASK=codec
```

:::

### Make target

| target | 等价能力 | 常用变量 |
| --- | --- | --- |
| `help` | 显示 CLI 帮助 | — |
| `doctor` | `lab:doctor` | `LAB JSON NO_COLOR` |
| `validate` | `lab:validate` | `LAB JSON NO_COLOR` |
| `build` | `lab:build` | `LAB TARGET JSON NO_COLOR` |
| `run` | `lab:run` | `LAB CASE TASK TARGET JSON NO_COLOR` |
| `interactive` | `lab:interactive` | `LAB TASK TARGET` |
| `score` | `lab:score` | `LAB CASE TASK TARGET JSON NO_COLOR` |
| `verify` | `lab:verify` | `LAB JSON NO_COLOR` |
| `refresh-expected` | `lab:refresh-expected` | `LAB TASK WRITE JSON NO_COLOR` |
| `pack` | `lab:pack --profile student` | `LAB JSON NO_COLOR` |
| `clean` | `lab:clean` | `LAB JSON NO_COLOR` |

### Make 变量与 CLI 参数映射

| Make 变量 | CLI 对应项 | 示例 |
| --- | --- | --- |
| `LAB` | `<lab-path>` | `LAB=labs/chapter-01/...` |
| `CASE` | `--case` | `CASE=001-sample` |
| `TASK` | `--task` | `TASK=frequency` |
| `TARGET` | `--target` | `TARGET=solution` |
| `JSON` | `--json` | `JSON=1` |
| `NO_COLOR` | `--no-color` | `NO_COLOR=1` |
| `WRITE` | `--write` | `WRITE=1` |

```powershell
make score LAB=labs/chapter-01/lab-01-06-sequential-list-deduplication JSON=1
make refresh-expected LAB=labs/chapter-08/lab-08-03-avl-tree-rotations TASK=frequency
make refresh-expected LAB=labs/chapter-08/lab-08-03-avl-tree-rotations TASK=frequency WRITE=1
```

::: tip `make` 无法识别时
这只表示当前终端没有可用的 GNU Make。无需为了做题中断进度，回到仓库根目录使用对应的 `pnpm lab:... -- <lab-path>` 即可。Quiz 默认也没有 Makefile，应直接在网页作答或使用 pnpm 做维护检查。
:::

## 作者维护命令

学习者通常只需要 `doctor`、`run`、`interactive`、`score` 与 `clean`。下面几项主要用于出题、Review 和发布。

### `validate`：只检查合同

```powershell
pnpm lab:validate -- labs/chapter-01/lab-01-06-sequential-list-deduplication
```

它检查 JSON、路径安全、分值合计、Quiz 四选一规则、Program cases、Project task 权重/依赖和薄 Makefile，但不会证明学生答案正确。

### `build`：只编译目标

```powershell
pnpm lab:build -- labs/chapter-01/lab-01-06-sequential-list-deduplication --target student
pnpm lab:build -- labs/chapter-01/lab-01-06-sequential-list-deduplication --target solution
```

Program 直接调用可用 C++ 编译器；Project 使用 CMake preset。编译成功不代表测试通过。

### `verify`：验证题目本身

```powershell
pnpm lab:verify -- labs/chapter-00/lab-00-03-complexity-quiz
pnpm lab:verify -- labs/chapter-01/lab-01-06-sequential-list-deduplication
pnpm lab:verify -- labs/chapter-08/lab-08-03-avl-tree-rotations
```

- Quiz：验证题库合同；
- Program：验证 oracle 无漂移、solution 满分、student 可编译但不满分；
- Project：验证 solution 自动部分满分、student 不满分、task 权重为 100、stdio oracle 无漂移。

### `refresh-expected`：管理标准输出

```powershell
# 只预览变化
pnpm lab:refresh-expected -- labs/chapter-01/lab-01-06-sequential-list-deduplication

# 确认参考实现正确后才写入
pnpm lab:refresh-expected -- labs/chapter-01/lab-01-06-sequential-list-deduplication --write

# Project 只选择 stdio task
pnpm lab:refresh-expected -- labs/chapter-08/lab-08-03-avl-tree-rotations --task frequency
```

### `pack`：生成学生包

```powershell
pnpm lab:pack -- labs/chapter-01/lab-01-06-sequential-list-deduplication --profile student
```

输出位于当前 Lab 的 `.lab-cache/packages/`，排除 `solution`、缓存、对象文件和二进制。学生包内只保留学习者所需的 Lab scripts。

### `clean`：安全清理生成物

```powershell
pnpm lab:clean -- labs/chapter-01/lab-01-06-sequential-list-deduplication
```

它只删除当前 Lab 及其 task 的 `.lab-cache/`，不会删除 `student/`、`solution/`、`tests/` 或 README。

## 环境要求与排错

`doctor` 会探测当前平台、Node、编译器、CMake 与 GNU Make。要求随 Lab 类型增加：

| 类型 | 必需工具 | 可选工具 |
| --- | --- | --- |
| Quiz | Node.js + pnpm | 编译器、CMake、GNU Make |
| Program | Node.js + pnpm；GCC、Clang、MSVC 三选一 | GNU Make |
| Project | Program 要求 + CMake ≥ 3.25 | GNU Make |

| 现象 | 原因 | 建议动作 |
| --- | --- | --- |
| `make is not recognized` | GNU Make 未安装或不在 PATH | 直接改用 `pnpm lab:...` |
| `LAB_NOT_FOUND` | 当前目录向上没有 `lab.json` | 回仓库根目录并显式传 `<lab-path>` |
| `COMPILER_NOT_FOUND` | 没有可用 C++ 编译器 | 重新打开 Developer PowerShell，或安装/启用 GCC、Clang、MSVC 之一 |
| `CMAKE_NOT_FOUND` | Project 无法启动 CMake | 安装 CMake ≥ 3.25，并重新打开终端 |
| `TASK_NOT_FOUND` | Project task ID 写错 | 查看当前 Project 的 `lab.json` |
| 单 case 找不到 | case ID 写错或 task 不是 stdio | 查看 `tests/cases.json`，Project 同时填写 `--task` |
| `TARGET_INVALID` | 目标不存在 | 学习者使用默认 `student`；作者确认源码仓库含 `solution` |
| 看见 `WA` 但终端没有报错 | `run` 把学习结果视为正常完成 | 修正代码后重跑；完成前再用 `score` |

::: details 一套稳妥的日常顺序
1. 第一次做某类题时运行 `doctor`；
2. 阅读 README，确认输入、输出与 task；
3. 使用 `run` 获取全局反馈；
4. 用 `--case` 或 `--task` 缩小失败范围；
5. 必要时用 `interactive` 手工实验；
6. 自动部分完成后运行 `score`；
7. Project 最后补齐并人工检查 `manual` 内容。
:::

## 最后记住四件事

1. `pnpm lab:run` 是跨平台默认入口，Make 只是短命令。
2. `--case` 选择公开用例，`--task` 选择 Project 子任务，`--target` 选择实现。
3. `run` 面向学习过程，`score` 面向严格自动检查。
4. Project 的 `PENDING` 必须由人工完成，不能被自动满分替代。

需要了解如何创建、迁移和 Review 三类 Lab，可继续阅读站内的“Lab 更新与测试指南”；需要配置 Windows 编译环境，可阅读“Windows 学生实验环境安装指南”。
