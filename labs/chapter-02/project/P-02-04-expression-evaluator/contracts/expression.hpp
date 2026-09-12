#pragma once
#include <cstddef>
#include <cstdint>
#include <string>
#include <vector>

namespace expr {
constexpr std::size_t kCapacity = 256;
constexpr std::size_t kMaxInput = 4096;
constexpr std::int64_t kLimit = 1000000000;
enum class Kind { Number, Plus, Minus, Multiply, Divide, Modulo, Left, Right };
struct Token {
    Kind kind = Kind::Number;
    std::int64_t value = 0;
    std::size_t offset = 0;
};
enum class Code { None, InvalidCharacter, NumberRange, TooLong, Syntax, DivideByZero, Overflow, NotImplemented };
struct Error {
    Code code = Code::None;
    std::size_t offset = 0;
};

class TokenStack {
public:
    bool push(Token value);
    bool pop(Token& value);
    bool peek(Token& value) const;
    std::size_t size() const;
    bool empty() const;
private:
    std::vector<Token> data_;
};

Error tokenize(const std::string& input, std::vector<Token>& output);
Error to_postfix(const std::string& input, std::vector<Token>& output);
Error evaluate(const std::string& input, std::int64_t& value);
const char* error_name(Code code);
}
