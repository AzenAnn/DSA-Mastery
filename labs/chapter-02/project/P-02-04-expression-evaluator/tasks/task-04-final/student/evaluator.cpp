#include "expression.hpp"
namespace expr {
Error evaluate(const std::string& input, std::int64_t& value) {
    (void)input;
    (void)value;
    // TODO: call to_postfix(), evaluate with TokenStack, preserve value on error.
    return {Code::NotImplemented, 0};
}
}
