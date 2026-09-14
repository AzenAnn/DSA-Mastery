#include "expression.hpp"
namespace expr {
const char* error_name(Code code) {
    switch (code) {
    case Code::None: return "NONE";
    case Code::InvalidCharacter: return "INVALID_CHAR";
    case Code::NumberRange: return "NUMBER_RANGE";
    case Code::TooLong: return "TOO_LONG";
    case Code::Syntax: return "SYNTAX";
    case Code::DivideByZero: return "DIV_ZERO";
    case Code::Overflow: return "OVERFLOW";
    case Code::NotImplemented: return "NOT_IMPLEMENTED";
    }
    return "UNKNOWN";
}
}
