# Task 3：中缀转后缀

实现 `Error to_postfix(const std::string&, std::vector<Token>&)`，作答文件为 `student/postfix.cpp`。必须调用 Task 2 的 `tokenize`，通过 Task 1 的 `TokenStack` 管理操作符；不得复制另一套栈或分词器绕开前面成果。

按[项目题面](../../README.md)的文法验证表达式，并输出不含括号的后缀 Token 序列。保留所有输出 Token 的原始 value 和 offset。`1+2*3` 输出 `1 2 3 * +`；`4-3-2` 输出 `4 3 - 2 -`；`(1+2)*3` 输出 `1 2 + 3 *`。每个操作符最多入栈、出栈一次，时间 O(n)、空间 O(n)。

不支持一元正负、隐式乘法、空括号或相邻操作数。分词错误原样返回；语法错误返回首个非法 Token 位置；需要操作数却遇到输入结束时定位输入长度；最后排栈遇到左括号时定位该括号。失败清空 output，成功替换 output。不得在本 Task 提前算数值或判断除零。

`expr_postfix_tests` 真实链接 `expr_postfix -> expr_stack + expr_tokenizer`；没有替身，前置模块未完成会影响本项行为，但前置测试 WA 不禁止本项运行。优先级/结合性 40 分、边界 25 分、错误 35 分，项目权重 25%。仓库根命令：`pnpm lab:run -- labs/chapter-02/project/P-02-04-expression-evaluator --task postfix`。

构建依赖失败时先根据构建目标和编译位置修复；可执行后再读 `tests/postfix_tests.cpp` 的具体失败步骤。失败属于这条调用链，不自动证明哪一个模块有错。
