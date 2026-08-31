# Lab v1 机器接口、评分与分发合同

## 1. Scope / Trigger

新增或修改 `lab.json`、`quiz.json`、`tests/cases.json`、Project `task.json`、`tools/lab/**`、根/Lab Makefile、C++ Golden Lab、Lab CI 或学生包时适用。作者教程见 [`docs/LAB_AUTHORING_GUIDE.md`](../../../docs/LAB_AUTHORING_GUIDE.md)，本文件定义未来实现必须保持的可执行边界。

## 2. Signatures

```text
pnpm lab:new -- --type <quiz|program|project> --chapter N --order N --slug kebab-slug
pnpm lab:doctor -- [lab-path] [--json]
pnpm lab:validate -- [lab-path] [--json]
pnpm lab:build -- [lab-path] [--target student|solution]
pnpm lab:run -- [lab-path] [--case id] [--task id] [--json]
pnpm lab:interactive -- [lab-path] [--task id] [--target student|solution]
pnpm lab:score -- [lab-path] [--case id] [--task id] [--json]
pnpm lab:verify -- [lab-path] [--json]
pnpm lab:refresh-expected -- [lab-path] [--task id] [--write]
pnpm lab:pack -- [lab-path] --profile student
pnpm lab:clean -- [lab-path]
```

Program/Project Lab 内固定支持 `make doctor|validate|build|run|interactive|score|verify|refresh-expected|pack|clean|help`；根 Makefile 使用同名 target 与 `LAB=<path>`。`CASE`、`TASK`、`TARGET` 分别映射为 CLI 选项。

除 `interactive` 外，所有人类可读入口接受 `--no-color`。交互 TTY 默认着色；存在 `--no-color`、`NO_COLOR`、`TERM=dumb` 或 stdout/stderr 非 TTY 时必须输出无 ANSI 的纯文本。

JSON 报告顶层：

```json
{
  "reportVersion": 1,
  "command": "score",
  "ok": true,
  "lab": {
    "path": "absolute-path",
    "type": "program",
    "schemaVersion": 1
  }
}
```

退出码：`0` 成功/严格自动满分，`1` 有效学生结果但未满分，`2` 环境、配置或内部错误。`run` 完成评分即返回 0；`score` 未满分返回 1。JSON 顶层 `ok` 表示命令是否在无工具内部错误的情况下完成：WA/CE 可保留 `ok: true`，IE/环境/配置错误必须是 `ok: false` 且 exit 2。

## 3. Contracts

- `lab.json` 是机器入口，`schemaVersion` 当前只接受整数 `1`，`type` 只接受 `quiz|program|project`。
- Windows 原生、Linux、macOS、WSL 使用同一 Node CLI；GNU Make 推荐但可选，`pnpm lab:run` 是 Windows 免 Make 官方兜底。
- 默认 C++17；只有题目明确需要且 README/CI 证明时可用 C++20。`toolchain.standard` 是直接编译和 Project CMake configure 的权威输入，CMakeLists 不得硬编码覆盖它。最低 GCC 11、Clang 14、MSVC 19.30；Project 另需 CMake 3.25。Dev Container/Codespaces 可选。
- 所有 manifest 路径均为当前 Lab 内相对路径；拒绝绝对路径、`..`、缺失目标和符号链接逃逸。
- Program 必须有可编译但不满分的 `student`、100 分 `solution`、合计 100 的 cases；stdout 判题、stderr 诊断。
- 比较器与 oracle 写入都先统一 CRLF/LF；`.out` 固定写为 LF，`exact` 在此基础上逐字符比较但允许一侧缺少一个末尾 LF（不忽略内部换行、额外空行或其他空白），`tokens` 按空白 token，`float` 对数值 token 使用 `absTol/relTol`。
- 判定固定为 `AC|WA|TLE|RE|CE|OLE|IE`；IE 不得伪装成学生 0 分。
- 人类终端输出固定语义：AC/PASS/满分为 success，WA/CE/RE/IE/未满分实际分为 danger，TLE/OLE/PENDING 为 warning；未满分仍保留 `actual/maximum`，且 maximum 使用 success。颜色只增强文字，不得成为唯一状态信号。
- Program 人类输出必须有逐 case 表格、PASS/NOT FULL 总结；失败时展示首差异和可复制单 case 重试。Project 必须分开 automated、manual pending、provisional total，并保持 task/case 层级。先 pad 原始单元格再加 ANSI，外部编译/CTest/stderr 正文不得被整块改色。
- `--json` 必须绕过全部人类 formatter，保持 reportVersion/字段/退出码不变且永远不含 ANSI 控制码。
- Project task kind 为 `stdio|ctest|manual`；顶层权重合计 100，ID 唯一，依赖存在且无环；自动分和人工待评分分开。
- Program/Project 源仓库 Makefile 必须与三行薄模板逐字一致，真实逻辑只在 `tools/lab/lab.mk` 和 CLI。
- 所有生成物只写 `.lab-cache/`。`refresh-expected` 默认只预览，只有 `--write` 覆盖 `.out`；Project 通过 `--task`/`TASK=` 选择 stdio task，并在 `verify` 中检查其 oracle 漂移。
- student pack 排除全部 solution、cache、object/binary，内置 runner 与独立 Makefile，不依赖源仓库相对路径。
- 评分器以 `spawn(command, args, { shell: false })` 执行；本地评分不是恶意代码沙箱，PR job 不注入秘密或写 token。

> **Warning**: 新增 Program/Project 用例时，`tests/*.out` 必须先存在，`refresh-expected` 才能写入。
>
> `loadCases` 在加载阶段就要求 `expected` 文件存在，因此“先建空 `.out` 占位 → `refresh-expected --write` 用 solution 输出覆盖”是唯一可行顺序；直接对缺失 `.out` 运行 validate/refresh 会得到 `FILE_NOT_FOUND`。脚手架只生成 `001-sample.out` 一个占位，其余用例需作者补建。

## 4. Validation & Error Matrix

| 条件 | code / 行为 |
| --- | --- |
| 向上找不到 `lab.json` | `LAB_NOT_FOUND`, exit 2 |
| 未知 schema 主版本或坏 JSON | `SCHEMA_VERSION` / `JSON_INVALID`, exit 2 |
| 路径越界或符号链接逃逸 | `PATH_ESCAPE`, exit 2 |
| Quiz 非四选一、ID/答案/points/选项错误 | `QUIZ_INVALID`, exit 2 |
| cases ID 重复、文件缺失或分值不等于 100 | `CASES_INVALID` / `CASES_POINTS`, exit 2 |
| Project task 重复、缺依赖、环或权重错误 | `TASK_DUPLICATE` / `TASK_DEPENDENCY` / `TASK_CYCLE` / `TASK_WEIGHTS`, exit 2 |
| Lab Makefile 私自分叉 | `MAKEFILE_DRIFT`, exit 2 |
| 编译失败 | CE；run=0，strict score=1 |
| 输出不符/超时/运行失败/输出超限 | WA/TLE/RE/OLE；按用例 0 分 |
| spawn/manifest/runner 内部错误 | IE，exit 2 |
| reference 与 `.out` 漂移 | refresh 预览 exit 1；`--write` 后 exit 0 |
| Windows reference 产生 CRLF | 比较与写入前都规范为 LF；不得把平台换行提交进 oracle |
| Project 有 manual task | 显示 PENDING，不计入 automatedMax，不伪造最终满分 |

## 5. Good / Base / Bad Cases

- Good：Program 有 sample/normal/boundary/regression，solution=100，starter 可编译且 `<100`，进入目录 `make run` 得到逐用例表格。
- Base：README-only 纸笔 Lab 没有 manifest，仍可被网站发现；迁移按维护需求渐进进行。
- Bad：每个 Lab 复制编译/diff recipe，Windows 必须安装 Make，或把 solution stdout 在每次学生评分时临时当 oracle。
- Good：Project 的 stdio task 复用 Program runner，CTest 名映射 task 内分值，报告显示 `Automated 80/80 + Manual pending 20`。
- Bad：Project 用 `dependsOn` 暗中实现得分门禁，或把 manual 未审内容算作自动满分。
- Good：Windows 作者执行 `refresh-expected --write` 后，提交的 `.out` 仍固定为 LF。
- Bad：直接把子进程原始 stdout 写入 `.out`，导致 Windows/Unix 之间反复出现整文件换行 diff。

## 6. Tests Required

- Node 单测：坏 JSON、未知版本、绝对/`..`/符号链接路径、空格路径、case/task ID、权重、依赖环和薄 Makefile 漂移。
- 比较/进程单测：exact/tokens/float、CRLF、首差异、AC/WA/TLE/RE/CE/OLE/IE、真实 timeout/output cap、shell false。
- 终端格式单测：TTY 自动色、`--no-color`、`NO_COLOR`、`TERM=dumb`、非 TTY、全部 verdict、满分/未满分、WA/CE、Project manual pending、全部人类 reporter、strip-ANSI 后列宽以及 JSON 无 ANSI。
- Golden Quiz：四选一、hint、points、进度、正确数、总分、答案总览、重试、移动端和安全 Markdown。
- Golden Program：reference 100、starter 编译且非满分、单 case、JSON、oracle drift、学生包脱离仓库运行。
- Oracle 生命周期：预览不得改文件，只有 `--write` 可写；写入内容必须为 LF，且不得改 student/solution/input。
- Golden Project：stdio/ctest/manual、单 task、依赖/权重、reference 自动满分、starter 非满分、manual pending。
- CI：`pnpm test` 静态/文档门禁；Ubuntu GCC/Clang 与 Windows MSVC 独立 `lab:verify`；构建后 `git diff --exit-code`。
- Reviewer：干净 clone 运行 README 主路径，记录 OS、版本、命令、分数与未执行项。

## 7. Wrong vs Correct

### Wrong

```makefile
run:
	g++ student/main.cpp -o main && ./main < tests/a.in > actual.out
```

它在每个 Lab 复制编译和比较行为，Windows/路径/退出码会漂移。

### Correct

```makefile
LAB_DIR := $(CURDIR)
REPO_ROOT := $(LAB_DIR)/../../..
include ../../../tools/lab/lab.mk
```

### Wrong

```js
await writeFile(expectedPath, result.stdout)
```

Windows 会把 CRLF 固化进标准输出文件。

### Correct

```js
await writeFile(expectedPath, normalizeNewlines(result.stdout))
```

### Wrong

```json
{"options":["A. O(1)","B. O(n)"],"answer":"A"}
```

### Correct

```json
{"id":"q1","stem":"复杂度是？","options":["O(1)","O(log n)","O(n)","O(n²)"],"answer":0,"explanation":"一次常数操作。","points":1}
```
