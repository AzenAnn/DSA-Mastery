# Task 1：有界 Token 栈

实现 `contracts/expression.hpp` 中 `expr::TokenStack` 的五个方法，作答文件为本目录 `student/stack.cpp`。栈供 Task 3 保存操作符，也供 Final 保存运算值；不能只支持正整数。

`push(Token)` 在大小小于 256 时复制整个 Token 并返回 true，满时返回 false 且不改变栈。`pop(Token&)` 删除并输出栈顶，`peek(Token&) const` 只读栈顶；空栈时都返回 false，保持输出参数原值。`size()` 和 `empty()` 精确反映当前状态。要求 push/pop/peek 均为摊还 O(1)，不得通过排序或删除头部模拟栈。

例如依次压入值 4、值 -2，peek 得到 -2 且大小仍为 2，依次 pop 得到 -2、4，第三次 pop 失败。Token 的 `kind`、`value`、`offset` 均须保留。

测试目标 `expr_stack_tests` 只链接本 Task 的 `expr_stack`，无替身或其他学生模块。`stack-lifo` 40 分、`stack-capacity` 40 分、`stack-empty` 20 分，总分乘项目权重 20%。在仓库根运行 `pnpm lab:run -- labs/chapter-02/project/P-02-04-expression-evaluator --task stack`。

接口和全工程规则见[项目题面](../../README.md)。本 Task 无需 main；测试驱动位于 `tests/stack_tests.cpp`。
