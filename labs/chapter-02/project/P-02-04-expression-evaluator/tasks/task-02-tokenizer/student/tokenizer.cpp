#include "expression.hpp"
namespace expr {
Error tokenize(const std::string& input, std::vector<Token>& output) {
    (void)input;
    output.clear();
    // TODO: scan tokens and implement all-or-nothing errors.
    return {Code::NotImplemented, 0};
}
}
