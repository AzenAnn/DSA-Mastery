#include "test_support.hpp"
int main(int argc, char** argv) {
    CHECK(argc == 2, "test group");
    const std::string group = argv[1];
    std::vector<expr::Token> tokens{number(99)};
    if (group == "normal") {
        CHECK(expr::tokenize(" 12+(3*4)-5/2%1", tokens).code == expr::Code::None, "scan mixed operators");
        CHECK(tokens.size() == 13 && tokens[0].value == 12 && tokens[0].offset == 1, "number value/byte offset");
        CHECK(tokens[1].kind == expr::Kind::Plus && tokens[2].kind == expr::Kind::Left && tokens[4].kind == expr::Kind::Multiply && tokens[6].kind == expr::Kind::Right, "token kinds");
        CHECK(tokens[8].kind == expr::Kind::Number && tokens[9].kind == expr::Kind::Divide && tokens[11].kind == expr::Kind::Modulo, "remaining operators");
    } else if (group == "boundary") {
        CHECK(expr::tokenize(" \t\r\n", tokens).code == expr::Code::None && tokens.empty(), "whitespace is lexically valid");
        CHECK(expr::tokenize("000 1000000000", tokens).code == expr::Code::None && tokens.size() == 2 && tokens[0].value == 0 && tokens[1].value == expr::kLimit, "leading zeros and limit");
        CHECK(expr::tokenize(std::string(expr::kCapacity, '+'), tokens).code == expr::Code::None && tokens.size() == expr::kCapacity, "exact token capacity");
        CHECK(expr::tokenize(std::string(expr::kMaxInput, ' '), tokens).code == expr::Code::None && tokens.empty(), "exact byte capacity");
    } else if (group == "errors") {
        auto error = expr::tokenize("12 @ 3", tokens);
        CHECK(error.code == expr::Code::InvalidCharacter && error.offset == 3 && tokens.empty(), "invalid character clears output");
        error = expr::tokenize("1+1000000001", tokens);
        CHECK(error.code == expr::Code::NumberRange && error.offset == 2 && tokens.empty(), "number range at number start");
        error = expr::tokenize(std::string(expr::kCapacity + 1, '+'), tokens);
        CHECK(error.code == expr::Code::TooLong && error.offset == expr::kCapacity && tokens.empty(), "token overflow");
        error = expr::tokenize(std::string(expr::kMaxInput + 1, ' '), tokens);
        CHECK(error.code == expr::Code::TooLong && error.offset == expr::kMaxInput && tokens.empty(), "byte overflow");
    } else CHECK(false, "unknown test group");
}
