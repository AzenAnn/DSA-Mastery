#include "expression.hpp"
namespace expr {
namespace {
int precedence(Kind kind) {
    return kind == Kind::Plus || kind == Kind::Minus ? 1 : 2;
}
}
Error to_postfix(const std::string& input, std::vector<Token>& output) {
    output.clear();
    std::vector<Token> tokens;
    const Error lexical = tokenize(input, tokens);
    if (lexical.code != Code::None) return lexical;
    std::vector<Token> result;
    TokenStack operators;
    bool operand = true;
    for (const Token token : tokens) {
        if (token.kind == Kind::Number) {
            if (!operand) return {Code::Syntax, token.offset};
            result.push_back(token);
            operand = false;
        } else if (token.kind == Kind::Left) {
            if (!operand) return {Code::Syntax, token.offset};
            if (!operators.push(token)) return {Code::TooLong, token.offset};
        } else if (token.kind == Kind::Right) {
            if (operand) return {Code::Syntax, token.offset};
            Token top;
            bool matched = false;
            while (operators.pop(top)) {
                if (top.kind == Kind::Left) { matched = true; break; }
                result.push_back(top);
            }
            if (!matched) return {Code::Syntax, token.offset};
        } else {
            if (operand) return {Code::Syntax, token.offset};
            Token top;
            while (operators.peek(top) && top.kind != Kind::Left && precedence(top.kind) >= precedence(token.kind)) {
                operators.pop(top);
                result.push_back(top);
            }
            if (!operators.push(token)) return {Code::TooLong, token.offset};
            operand = true;
        }
    }
    if (operand) return {Code::Syntax, input.size()};
    Token top;
    while (operators.pop(top)) {
        if (top.kind == Kind::Left) return {Code::Syntax, top.offset};
        result.push_back(top);
    }
    output = std::move(result);
    return {};
}
}
