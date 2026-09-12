#pragma once
#include <cstdlib>
#include <iostream>
#include <string>
#include "expression.hpp"

inline void require(bool condition, const std::string& step, int line) {
    if (!condition) {
        std::cerr << "CHECK FAILED: " << step << " (test line " << line << ")\n";
        std::exit(1);
    }
}
#define CHECK(condition, step) require((condition), (step), __LINE__)
inline expr::Token number(std::int64_t value, std::size_t offset = 0) {
    return {expr::Kind::Number, value, offset};
}
