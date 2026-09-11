# Final：完整表达式求值

实现 `Error evaluate(const std::string&, std::int64_t&)`，作答文件 `student/evaluator.cpp`。调用 Task 3 的 `to_postfix`，使用 Task 1 的 `TokenStack` 保存中间值。每个操作符先弹出右操作数，再弹出左操作数；成功时栈中恰剩一个值。

算术、范围、错误位置和输出格式都按[项目题面](../../README.md)。每次运算后检查 `[-1000000000,1000000000]`，乘法可先在 int64_t 中计算（合法操作数乘积最多 10^18，不溢出 int64_t）。除法向零截断，取余符号跟随左操作数。`DIV_ZERO`、`OVERFLOW` 定位对应操作符的原字节位置。失败保持传入 value 原值，成功才赋最终值。时间 O(n)、空间 O(n)。

固定的 `src/main.cpp` 逐行读取输入、调用 evaluate 并格式化结果；无需修改驱动或错误名映射。`expression_cli`、`expr_final_tests` 都链接本次 preset 选定的全部真实模块，学生构建中绝不使用参考依赖。

`final-normal` 30 分，`final-boundary` 25 分，`final-errors` 25 分，`final-cli` 20 分；项目权重 35%。前三组检查函数组合行为，最后一组通过 `tests/cli_test.cmake` 启动真实可执行程序，将 `cli.in` 输入并与 `cli.out` 比较，检查多行错误恢复。单元测试通过不能代替此项。

在仓库根运行 `pnpm lab:run -- labs/chapter-02/project/P-02-04-expression-evaluator --task final`。也可进入 Project 目录执行 `cmake --preset student`、`cmake --build --preset student --config Release --target expression_cli`；多配置生成器将可执行程序放在 `tasks/task-04-final/Release`，单配置生成器放在 `tasks/task-04-final`，均位于 `.lab-cache/cmake/student` 内。
