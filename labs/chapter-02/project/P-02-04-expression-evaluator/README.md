---
title: "Lab 02-P-04：表达式求值器"
description: "把有界栈、分词器、中缀转后缀与求值模块链接成同一个程序，分别测评模块并用真实集成测试检查工程。"
order: 15
chapter: 2
labId: "02P04"
chapterTitle: "栈与队列"
updated: "2026-09-11"
contributors: ["Azen"]
status: "review"
lab: true
difficulty: "综合"
duration: "240～360 分钟"
---

# Lab 02-P-04：表达式求值器

## 项目目标

完成一个逐行读取算术表达式的程序。四个 Task 属于同一工程：前两项建立基础模块，第三项调用它们生成后缀序列，Final 使用这些真实模块求值。修改上游代码后，下游行为和测评结果都会受影响。

前置知识：[栈](../../../../content/chapter-02-stack-queue/01-stack.md)、[栈与队列的应用](../../../../content/chapter-02-stack-queue/03-applications.md)、C++ 函数/类与基础 CMake。所有接口已在 `contracts/expression.hpp` 固定，学生只补全四个 `student/*.cpp`，无需分别编写 `main`。

| Task | 题面 | 学生文件 | 真实构建依赖 | 权重 |
| --- | --- | --- | --- | ---: |
| `stack` | [有界 Token 栈](./tasks/task-01-stack/README.md) | `tasks/task-01-stack/student/stack.cpp` | 无 | 20 |
| `tokenizer` | [分词器](./tasks/task-02-tokenizer/README.md) | `tasks/task-02-tokenizer/student/tokenizer.cpp` | 无 | 20 |
| `postfix` | [中缀转后缀](./tasks/task-03-postfix/README.md) | `tasks/task-03-postfix/student/postfix.cpp` | stack、tokenizer | 25 |
| `final` | [完整求值](./tasks/task-04-final/README.md) | `tasks/task-04-final/student/evaluator.cpp` | postfix、stack（间接 tokenizer） | 35 |

## 工程结构与接口归属

```text
contracts/expression.hpp   固定数据类型与函数声明
contracts/test_support.hpp 测试断言工具，没有算法答案
tasks/task-01-stack/       TokenStack 实现、题面、测试
tasks/task-02-tokenizer/   tokenize 实现、题面、测试
tasks/task-03-postfix/     to_postfix 实现、题面、测试
tasks/task-04-final/       evaluate 实现、题面、集成测试
src/main.cpp              固定逐行输入输出驱动
src/errors.cpp            固定错误名称映射
lab.json                  任务、权重、依赖
CMakeLists.txt            公共编译选项与子目录
CMakePresets.json         隔离的 student / solution 构建
```

每个 Task 的 `task.json` 声明测试和分值，`CMakeLists.txt` 声明实现库与测试可执行文件；`student/` 是作答区，`solution/` 是独立参考实现。`expr_postfix` 通过 `target_link_libraries` 链接 `expr_stack`、`expr_tokenizer`，`expr_evaluator` 链接 `expr_postfix`、`expr_stack`，最终 `expression_cli` 链接 `expr_evaluator`。学生构建不搜索或替换任何 `solution` 源码。

`dependsOn` 表达学习顺序和任务关系，不要求前置测试通过。`buildDependsOn` 记录真实源码依赖，用于说明依赖构建失败和传播重测状态；真正的源码复用由 CMake 链接保证。某模块的单元测试 WA 不会禁止可运行的集成测试。公共 CMake 配置失败会影响整个 CTest 工程；无关模块的 C++ 编译失败只影响需要它的目标。

## 输入、输出与统一边界

每行一个表达式，读至 EOF；空输入流不输出内容。空行作为空表达式返回语法错误。支持十进制非负整数、二元 `+ - * / %` 和圆括号，允许空格、制表符、CR、LF（函数接口）；不支持一元正负号、浮点数、隐式乘法或变量。负数由 `0-x` 产生。

```text
expression := term (('+' | '-') term)*
term       := factor (('*' | '/' | '%') factor)*
factor     := integer | '(' expression ')'
```

所有二元运算左结合，乘除余优先于加减。除法向零截断，余数符号跟随被除数，如 `(0-7)/3 = -2`、`(0-7)%3 = -1`。字面量允许前导零，值在 `[0, 1000000000]`；每一步中间值和最终值都须在 `[-1000000000, 1000000000]`。最多 4096 字节、256 个 Token；Token 栈容量固定 256。

成功输出 `OK value`；规定的输入错误输出 `ERROR name offset` 并继续下一行，进程退出码仍为 0。`offset` 是本行从 0 开始的字节位置。例子：

```text
输入                     输出
42+(8-3)*2               OK 52
(0-7)/3                  OK -2
1/(2-2)                  ERROR DIV_ZERO 1
1+                       ERROR SYNTAX 2
```

| 错误 | 固定名称 | 位置规则 |
| --- | --- | --- |
| 非法字符 | `INVALID_CHAR` | 首个非法字符 |
| 字面量超范围 | `NUMBER_RANGE` | 该数字起点 |
| 超过字节/Token 上限 | `TOO_LONG` | 字节上限 4096 / 第 257 个 Token 起点 |
| 语法错误 | `SYNTAX` | 首个不符合语法的 Token；缺少末尾操作数为输入长度；未闭合左括号为最内层未闭合括号位置 |
| 除数或取余右操作数为零 | `DIV_ZERO` | 对应运算符 |
| 中间值超范围 | `OVERFLOW` | 对应运算符 |

处理顺序：先检查字节上限，再完成整行分词，再语法转换，最后按后缀顺序求值。因此含非法字符的行先报告词法错误。失败时 `tokenize`、`to_postfix` 清空输出向量，`evaluate` 保持传入的结果变量不变。`NOT_IMPLEMENTED` 仅用于起始代码，完成后不得返回。

## 测评与完成规则

先检查环境。在导出的学生包根目录执行：

```powershell
node tools/lab/cli.mjs doctor .
```

源码仓库的 CLI 位于仓库根，推荐在那里执行：

```powershell
pnpm lab:run -- labs/chapter-02/project/P-02-04-expression-evaluator --task stack
pnpm lab:build -- labs/chapter-02/project/P-02-04-expression-evaluator --task final
pnpm lab:score -- labs/chapter-02/project/P-02-04-expression-evaluator
node tools/lab/cli.mjs project-status labs/chapter-02/project/P-02-04-expression-evaluator
```

或者进入本目录使用 `make run TASK=stack`、`make score`。全新导出的学生包在包根运行 `node tools/lab/cli.mjs score . --task stack`，不需要 pnpm 安装依赖。源码仓库进入本目录时，Node CLI 的相对路径是 `../../../../tools/lab/cli.mjs`。

每个 Task 内的命名测试总分 100，当前有效项目分为各项 `Task 得分 / 100 × 权重` 之和。单项测评只更新该项，其他有效成绩保留；未测评和需要重测的任务当前贡献为 0，历史分仍显示。四项当前结果全部 AC 才完成项目。其他 Project 若有 manual，自动满分仍须等待人工，插件不代替人工评分。

`CE` 表示选定目标编译失败；`BLOCKED` 表示有构建证据的公共依赖失败；`WA` 表示已执行测试未通过；`UNASSESSED` 为未测评；`STALE` 为输入已变化，需要重测。诊断给出失败阶段、相关目标和测试输出，不根据测试失败猜测根因。修改 stack 后 stack、postfix、final 需重测，tokenizer 仍有效；修改公共接口或构建配置会使所有相关结果失效。

## 测试覆盖与隔离

- Task 1 只链接栈库，检查 LIFO、Token 全字段、空栈、容量和失败无副作用。
- Task 2 只链接分词库，检查符号、数字、位置、空白、容量与词法错误。
- Task 3 全部测试组合真实栈和分词器，检查优先级、结合性、嵌套和语法；这些是模块组合测试，前置未实现时可能失败。
- Final 的函数测试与命令行测试都组合全部真实模块，覆盖运算语义、负数除余、范围、错误传播和多行恢复。没有测试替身，也没有参考依赖替换。

单元测试通过只能证明已覆盖的行为；Final 可能揭示组合边界上仍存在的问题。失败输出中的步骤、输入、预期值和实际值用于缩小调查范围，不等于根因结论。

## 作者验证与学生包

仓库根运行 `pnpm lab:verify -- labs/chapter-02/project/P-02-04-expression-evaluator`，同时检查参考满分、起始代码可编译且非满分。参考构建在 `.lab-cache/cmake/solution`，学生构建在 `.lab-cache/cmake/student`，互不链接。

`pnpm lab:pack -- labs/chapter-02/project/P-02-04-expression-evaluator --profile student` 导出 `.lab-cache/packages/P-02-04-expression-evaluator-student/`，包含题面、接口、测试、学生文件、CMake、Schema 和零第三方依赖 CLI，排除参考源码和构建缓存。工具链要求 Node 22.13+、CMake 3.25+，以及 GCC 11+、Clang 14+ 或 MSVC 19.30+；Make 可选。
