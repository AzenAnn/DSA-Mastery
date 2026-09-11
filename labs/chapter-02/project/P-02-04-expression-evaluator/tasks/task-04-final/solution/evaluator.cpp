#include "expression.hpp"
namespace expr {
Error evaluate(const std::string& input, std::int64_t& value) {
    std::vector<Token> postfix;
    const Error conversion = to_postfix(input, postfix);
    if (conversion.code != Code::None) return conversion;
    TokenStack values;
    for (const Token token : postfix) {
        if (token.kind == Kind::Number) {
            if (!values.push(token)) return {Code::TooLong, token.offset};
            continue;
        }
        Token right, left;
        if (!values.pop(right) || !values.pop(left)) return {Code::Syntax, token.offset};
        std::int64_t result = 0;
        switch (token.kind) {
        case Kind::Plus: result = left.value + right.value; break;
        case Kind::Minus: result = left.value - right.value; break;
        case Kind::Multiply: result = left.value * right.value; break;
        case Kind::Divide:
        case Kind::Modulo:
            if (right.value == 0) return {Code::DivideByZero, token.offset};
            result = token.kind == Kind::Divide ? left.value / right.value : left.value % right.value;
            break;
        default: return {Code::Syntax, token.offset};
        }
        // Bounded operands make the int64_t operation safe before this range check.
        if (result < -kLimit || result > kLimit) return {Code::Overflow, token.offset};
        if (!values.push({Kind::Number, result, token.offset})) return {Code::TooLong, token.offset};
    }
    Token answer;
    if (values.size() != 1 || !values.pop(answer)) return {Code::Syntax, input.size()};
    value = answer.value;
    return {};
}
}
