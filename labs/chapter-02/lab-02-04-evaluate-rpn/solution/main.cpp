#include <cstddef>
#include <iostream>
#include <stdexcept>
#include <string>
#include <vector>

bool parse_integer(const std::string& token, long long& value) {
    try {
        std::size_t parsed = 0;
        value = std::stoll(token, &parsed);
        return parsed == token.size();
    } catch (const std::invalid_argument&) {
        return false;
    } catch (const std::out_of_range&) {
        return false;
    }
}

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    std::size_t n = 0;
    if (!(std::cin >> n)) return 0;

    std::vector<long long> stack;
    stack.reserve(n);
    bool valid = true;

    for (std::size_t i = 0; i < n; ++i) {
        std::string token;
        std::cin >> token;
        if (!valid) continue;

        long long value = 0;
        if (parse_integer(token, value)) {
            stack.push_back(value);
            continue;
        }

        const bool is_operator = token == "+" || token == "-" || token == "*" || token == "/";
        if (!is_operator || stack.size() < 2) {
            valid = false;
            continue;
        }

        const long long right = stack.back();
        stack.pop_back();
        const long long left = stack.back();
        stack.pop_back();

        if (token == "+") stack.push_back(left + right);
        else if (token == "-") stack.push_back(left - right);
        else if (token == "*") stack.push_back(left * right);
        else if (right == 0) valid = false;
        else stack.push_back(left / right);
    }

    if (!valid || stack.size() != 1) std::cout << "ERROR\n";
    else std::cout << stack.back() << '\n';
}
