#include "test_support.hpp"
void success(const std::string& input, std::int64_t expected) {
    std::int64_t actual = 777;
    const auto error = expr::evaluate(input, actual);
    CHECK(error.code == expr::Code::None && actual == expected,
        "integration tokenize -> postfix -> value stack: " + input + "; expected " + std::to_string(expected) + ", actual " + std::to_string(actual) + ", code " + expr::error_name(error.code));
}
void failure(const std::string& input, expr::Code code, std::size_t offset) {
    std::int64_t actual = 777;
    const auto error = expr::evaluate(input, actual);
    CHECK(error.code == code && error.offset == offset && actual == 777,
        "integration error/offset and unchanged output: " + input + "; actual " + expr::error_name(error.code) + " at " + std::to_string(error.offset));
}
int main(int argc, char** argv) {
    CHECK(argc == 2, "test group");
    const std::string group = argv[1];
    if (group == "normal") {
        success("42+(8-3)*2", 52);
        success("20/3/2", 3);
        success("(0-7)/3", -2);
        success("(0-7)%3", -1);
        success("12-3-2", 7);
        success(" 2 * (3+4) % 5 ", 4);
    } else if (group == "boundary") {
        success("0", 0);
        success("1000000000", expr::kLimit);
        success("0-1000000000", -expr::kLimit);
        success("1000000000*0", 0);
        success(std::string(127, '(') + "1" + std::string(127, ')'), 1);
        std::string chain = "1";
        for (int i = 0; i < 127; ++i) chain += "+1";
        success(chain, 128);
    } else if (group == "errors") {
        failure("1/(2-2)", expr::Code::DivideByZero, 1);
        failure("1%0", expr::Code::DivideByZero, 1);
        failure("1000000000+1", expr::Code::Overflow, 10);
        failure("1000000000*1000000000", expr::Code::Overflow, 10);
        failure("(0-1000000000)-1", expr::Code::Overflow, 14);
        failure("1+", expr::Code::Syntax, 2);
        failure("-2", expr::Code::Syntax, 0);
        failure("2(3)", expr::Code::Syntax, 1);
        failure("1 @", expr::Code::InvalidCharacter, 2);
        failure("1000000001", expr::Code::NumberRange, 0);
        failure("", expr::Code::Syntax, 0);
        failure(std::string(expr::kMaxInput + 1, ' '), expr::Code::TooLong, expr::kMaxInput);
    } else CHECK(false, "unknown test group");
}
