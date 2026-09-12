#include "expression.hpp"
namespace expr {
Error tokenize(const std::string& input, std::vector<Token>& output) {
    output.clear();
    if (input.size() > kMaxInput) return {Code::TooLong, kMaxInput};
    std::vector<Token> tokens;
    for (std::size_t i = 0; i < input.size();) {
        const char c = input[i];
        if (c == ' ' || c == '\t' || c == '\r' || c == '\n') { ++i; continue; }
        if (tokens.size() == kCapacity) return {Code::TooLong, i};
        const std::size_t begin = i;
        if (c >= '0' && c <= '9') {
            std::int64_t value = 0;
            while (i < input.size() && input[i] >= '0' && input[i] <= '9') {
                const int digit = input[i] - '0';
                if (value > (kLimit - digit) / 10) return {Code::NumberRange, begin};
                value = value * 10 + digit;
                ++i;
            }
            tokens.push_back({Kind::Number, value, begin});
            continue;
        }
        Kind kind;
        switch (c) {
        case '+': kind = Kind::Plus; break;
        case '-': kind = Kind::Minus; break;
        case '*': kind = Kind::Multiply; break;
        case '/': kind = Kind::Divide; break;
        case '%': kind = Kind::Modulo; break;
        case '(': kind = Kind::Left; break;
        case ')': kind = Kind::Right; break;
        default: return {Code::InvalidCharacter, i};
        }
        tokens.push_back({kind, 0, i++});
    }
    output = std::move(tokens);
    return {};
}
}
