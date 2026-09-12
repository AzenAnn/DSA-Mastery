#include <cstddef>
#include <iostream>
#include <string>
#include <vector>

bool integerToken(const std::string& token, long long& value) {
    try {
        std::size_t used = 0;
        value = std::stoll(token, &used);
        return used == token.size();
    } catch (...) { return false; }
}

int main() {
    std::size_t n = 0;
    if (!(std::cin >> n)) return 0;
    std::vector<long long> values;
    bool valid = true;
    for (std::size_t i = 0; i < n; ++i) {
        std::string token;
        std::cin >> token;
        if (!valid) continue;
        long long value = 0;
        if (integerToken(token, value)) { values.push_back(value); continue; }
        if ((token != "+" && token != "-" && token != "*" && token != "/") || values.size() < 2) { valid = false; continue; }
        const long long right = values.back(); values.pop_back();
        const long long left = values.back(); values.pop_back();
        if (token == "+") values.push_back(left + right);
        else if (token == "-") values.push_back(left - right);
        else if (token == "*") values.push_back(left * right);
        else if (right == 0) valid = false;
        else values.push_back(left / right);
    }
    if (!valid || values.size() != 1) std::cout << "ERROR\n";
    else std::cout << values.back() << '\n';
}
