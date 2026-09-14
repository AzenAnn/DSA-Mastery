# Task 2：分词器

实现 `Error tokenize(const std::string&, std::vector<Token>&)`，作答文件为 `student/tokenizer.cpp`。固定声明见 `contracts/expression.hpp`，不做语法或运算检查。

逐字节扫描数字、`+ - * / % ( )`，忽略空格、TAB、CR、LF。数字 Token 的值为十进制数，其他 Token 的 value 固定为 0，offset 是原输入字节位置。例如 ` 12+3` 产生 `(Number,12,1)`、`(Plus,0,3)`、`(Number,3,4)`。空白输入成功返回空向量，`1 2` 是两个合法数字 Token，其语法由下一 Task 检查。

字面量在 `[0,1000000000]`，可有前导零；最多 4096 字节、256 Token。先检查输入长度；扫描时先检查 Token 容量，再识别下一 Token。错误定位和优先级见[项目题面](../../README.md)。每次调用覆盖输出，任一错误须清空整个输出，不能留下有效前缀。成功返回默认 `Error{}`。目标时间 O(n)、空间 O(Token 数)。

`expr_tokenizer_tests` 只链接 `expr_tokenizer`，不依赖栈且不使用替身。正常扫描 40 分、边界 30 分、错误 30 分，项目权重 20%。单项命令在仓库根为 `pnpm lab:run -- labs/chapter-02/project/P-02-04-expression-evaluator --task tokenizer`。测试位于 `tests/tokenizer_tests.cpp`，本 Task 不编写 main。
