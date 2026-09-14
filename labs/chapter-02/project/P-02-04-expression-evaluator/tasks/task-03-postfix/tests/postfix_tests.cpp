#include "test_support.hpp"
int main(int argc, char** argv) {
    CHECK(argc == 2, "test group");
    const std::string group = argv[1];
    std::vector<expr::Token> output{number(99)};
    if (group == "precedence") {
        CHECK(expr::to_postfix("1+2*3-4", output).code == expr::Code::None, "tokenizer + operator stack: precedence");
        CHECK(output.size() == 7 && output[0].value == 1 && output[1].value == 2 && output[2].value == 3 && output[3].kind == expr::Kind::Multiply && output[3].offset == 3 && output[4].kind == expr::Kind::Plus && output[6].kind == expr::Kind::Minus, "postfix order and original offsets");
        CHECK(expr::to_postfix("4-3-2", output).code == expr::Code::None && output[2].kind == expr::Kind::Minus && output[3].value == 2, "left associativity");
        CHECK(expr::to_postfix("(1+2)*3", output).code == expr::Code::None && output[2].kind == expr::Kind::Plus && output[4].kind == expr::Kind::Multiply, "parenthesized group");
        CHECK(expr::to_postfix("4/2%1", output).code == expr::Code::None && output[2].kind == expr::Kind::Divide && output[4].kind == expr::Kind::Modulo, "division/modulo same precedence");
    } else if (group == "boundary") {
        CHECK(expr::to_postfix("0", output).code == expr::Code::None && output.size() == 1 && output[0].value == 0, "single literal");
        const std::string nested = std::string(127, '(') + "1" + std::string(127, ')');
        CHECK(expr::to_postfix(nested, output).code == expr::Code::None && output.size() == 1, "255-token nesting with real stack");
        CHECK(expr::to_postfix("\t1 \n+ 2", output).code == expr::Code::None && output[2].offset == 4, "whitespace preserves byte offsets");
    } else if (group == "errors") {
        for (const std::string text : {"", "1+", "()", "1 2", "-1", "1(2)", "1**2", "1)", "(1"}) {
            output = {number(99)};
            CHECK(expr::to_postfix(text, output).code == expr::Code::Syntax && output.empty(), "syntax rejection: " + text);
        }
        CHECK(expr::to_postfix("1+", output).offset == 2, "missing operand at end");
        CHECK(expr::to_postfix("(1", output).offset == 0, "unmatched opening offset");
        const auto error = expr::to_postfix("1 @", output);
        CHECK(error.code == expr::Code::InvalidCharacter && error.offset == 2, "lexical errors propagate unchanged");
    } else CHECK(false, "unknown test group");
}
