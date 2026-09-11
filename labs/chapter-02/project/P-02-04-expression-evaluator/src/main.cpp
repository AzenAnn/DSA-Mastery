#include <iostream>
#include "expression.hpp"
int main() {
    std::string line;
    while (std::getline(std::cin, line)) {
        std::int64_t value = 0;
        const auto error = expr::evaluate(line, value);
        if (error.code == expr::Code::None) std::cout << "OK " << value << '\n';
        else std::cout << "ERROR " << expr::error_name(error.code) << ' ' << error.offset << '\n';
    }
    return std::cin.bad() ? 1 : 0;
}
