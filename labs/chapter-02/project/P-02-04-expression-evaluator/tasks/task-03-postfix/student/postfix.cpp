#include "expression.hpp"
namespace expr {
Error to_postfix(const std::string& input, std::vector<Token>& output) {
    (void)input;
    output.clear();
    // TODO: call tokenize() and use TokenStack for operators.
    return {Code::NotImplemented, 0};
}
}
