# Judge 与 Lab CLI 终端视觉系统设计

## 1. Problem and boundaries

当前 Lab CLI 的机器合同完整，但人类输出散落在 `cli.mjs`、`judge.mjs` 和 `project.mjs`，没有共享的视觉语义。学习者需要逐行判断是否通过，维护者也难以快速区分成功、学生错误、环境错误、待人工处理与普通信息。

本设计只改变人类可读文本的呈现，不改变判题数据、JSON、退出码、测试执行、计分或文件写入。`lab:interactive` 启动后仍把终端完整交给学生程序。

## 2. Architecture

### 2.1 Shared terminal primitives

新增 `tools/lab/terminal.mjs`，只依赖 Node 标准库，负责：

- 判定当前输出流是否允许 ANSI 颜色；
- 提供 `success`、`danger`、`warning`、`info`、`muted`、`heading`、`path`、`command` 等主题方法；
- 提供 verdict、score、PASS/NOT FULL/PENDING 的统一语义映射；
- 提供“先 pad、后着色”的固定宽度单元格方法；
- 必要时使用 Node 内置 `stripVTControlCharacters` 清理外部诊断中的终端控制码，但保留正文、换行和可复制性。

主题对象显式传入格式器，不使用可变全局状态。格式器默认返回无色文本，使现有直接调用与测试保持确定性；CLI 在人类输出分支传入自动检测后的主题。

### 2.2 Human reporter

新增 `tools/lab/reporter.mjs`，集中格式化非判题命令：

- help/new
- doctor/validate/build
- verify/refresh-expected
- pack/clean
- 顶层 LabError

`tools/lab/cli.mjs` 保留命令解析、领域调用、JSON 序列化与退出码决策，只选择对应 reporter 并打印结果，不再拼接大量视觉文本。

### 2.3 Judge formatters

- `tools/lab/judge.mjs#formatJudge` 继续拥有 Program 逐 case 的领域布局，但改为接收 `{ theme, command, labPath, taskId }`。
- `tools/lab/project.mjs#formatProject` 继续拥有 Project task 聚合布局，并复用 verdict/score 主题与重试命令生成规则。
- 两个格式器共享相同的 verdict 与 score helpers，避免 Program/Project 颜色漂移。

## 3. Color activation contract

人类输出仅在以下条件全部满足时自动着色：

```text
stdout/stderr isTTY
AND --no-color 未启用
AND NO_COLOR 环境变量不存在
AND TERM != dumb
AND 当前不是 --json 分支
```

测试可以通过显式 `color: true|false` 构造主题，不需要伪造真实 PTY。stdout 与 stderr 分别根据自身 TTY 状态创建主题，错误输出不会假定 stdout 能着色。

`--json` 继续直接 `JSON.stringify(report)`，不经过任何人类格式器。JSON schema、reportVersion、字段和 exit code 不变。

## 4. Semantic palette

| Semantic | ANSI | Usage |
| --- | --- | --- |
| success | green + optional bold | AC、PASS、成功、满分 |
| danger | red + optional bold | WA/CE/RE/IE、失败、实际未满分得分 |
| warning | yellow + optional bold | TLE/OLE、PENDING、版本过低、预览漂移 |
| info | cyan | 路径、命令、平台与补充信息 |
| muted | dim | 表头辅助列、分隔线、耗时、可选未安装 |
| heading | bold | 命令结果标题、TOTAL 与小节 |

颜色永远与可读文字共存。表格中不加入 emoji，避免 Windows/CJK 终端宽度差异。

分数规则保持用户指定语义：

- `x === y`：`x` 和 `/y` 均为绿色；
- `x < y`：`x` 为红色，`/y` 为绿色；
- Project manual pending 使用黄色 `PENDING`，不伪装成自动失败或最终通过。

## 5. Output shapes

### 5.1 Program success

```text
CASE                 RESULT   TIME       SCORE
001-sample           AC       27 ms      20/20
...
------------------------------------------------
PASS  4/4 cases · 100/100 · 123 ms
```

`AC`、`PASS`、`100/100` 为绿色；表头、分隔线和耗时弱化。

### 5.2 Program incomplete

```text
002-single           WA       18 ms      0/20
  First difference: token 1
  Expected: "42"
  Actual:   "<end of output>"
------------------------------------------------
NOT FULL  3/4 cases · 80/100
Retry: pnpm lab:run -- "<lab-path>" --case "002-single"
```

中英文标签沿用仓库现有中文诊断风格；表格 status 保留稳定英文 verdict。重试命令由当前命令、Lab 路径、task/case 组合生成并保持可复制。

### 5.3 Compile and tool errors

CLI 自有标题使用 danger，编译器/CMake/stdout/stderr 原文保持普通可复制文本。外部正文不整块染红，避免长日志难读。

### 5.4 Project

Project 顶层 task 与嵌套 stdio/CTest 都显示 verdict 和 score。总结分列：

```text
Automated:        80/80
Manual pending:   20
Provisional total: 80/100
AUTOMATED PASS · MANUAL REVIEW PENDING
```

自动未满分时改为 `NOT FULL`；有 manual task 时绝不输出最终 `PASS 100/100`。

### 5.5 Other commands

- doctor：总体 PASS/FAIL；每个工具显示 AVAILABLE、TOO OLD、NOT FOUND，必需问题 danger，可选 Make 缺失 muted。
- validate/build/verify：结论置顶；各检查项 success/danger/warning。
- refresh-expected：无漂移 success，预览 warning，写入 success；diff 的 `-` danger、`+` success。
- new/pack/clean：成功摘要 + 路径 info。
- help：标题/分组 heading，命令保持原始可复制文本，说明 muted。
- 顶层错误：`[ERROR_CODE]` danger，message 保持清晰；JSON 错误不着色。

## 6. Data and control flow

```text
parse CLI args
  -> JSON? JSON.stringify(report) directly
  -> human? createTheme(stdout/stderr, --no-color, env)
       -> reporter / formatJudge / formatProject
       -> styled string
       -> console.log / console.error
```

领域结果对象不添加视觉字段。颜色是纯视图层，防止 ANSI 泄漏到 JSON、缓存、评分逻辑或测试数据。

## 7. Compatibility and migration

- 不新增依赖，不修改 lockfile。
- 纯文本模式保留现有关键字、verdict、分数和诊断信息；允许为了层级拆行和增加摘要/重试提示。
- Make 的 `NO_COLOR=1` 继续转发为 `--no-color`；直接 CLI 同时识别行业标准 `NO_COLOR` 环境变量。
- 重定向、CI 和测试 runner 因非 TTY 自动得到纯文本。
- 文档与 `.trellis/spec/content/lab-tooling.md` 更新终端颜色/无色合同，但不把颜色写成判题正确性的必要条件。

## 8. Testing strategy

新增独立终端格式测试，覆盖：

1. TTY/`--no-color`/`NO_COLOR`/`TERM=dumb`/非 TTY 判定；
2. 所有 verdict 与 PENDING 颜色映射；
3. 满分和未满分 score 片段；
4. Program AC、WA、CE、stderr、重试命令及 strip-ANSI 后列宽；
5. Project stdio/CTest/manual 与总结；
6. doctor/validate/build/verify/refresh/new/pack/clean/help/error 代表输出；
7. `--json` 与 `--no-color` 不含 ESC；
8. 现有 Lab 工具、Golden Program/Project、lint、全量测试不回归。

本地视觉证据使用真实 VS Code PowerShell 运行 Lab 01-06 的满分和故意失败版本，以及 Golden Project。失败版本通过临时 fixture 或工作区外副本构造，不改动课程 oracle/solution。

## 9. Risks and rollback

- **ANSI 破坏列宽**：所有单元格先 pad 再着色，并用 strip-ANSI 后的快照断言列结构。
- **CI 日志污染**：非 TTY 自动关闭，`--json` 永不进入样式层。
- **过度着色**：只着色语义 token 和标题，不整块着色长日志。
- **外部控制序列**：清理外部诊断中的 VT 控制字符，避免学生 stderr 改写终端。
- **范围过大**：共享 reporter 一次收口，领域/机器合同保持不动；如需回滚，可删除 reporter/terminal 并恢复三处格式调用，不涉及数据迁移。
- **远端基线陈旧**：PR 前必须成功 fetch 最新 `origin/main` 并 rebase；冲突时重新运行全部门禁和视觉证据。
