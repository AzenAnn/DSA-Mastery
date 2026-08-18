#include <array>
#include <iostream>
#include <string>

int main() {
    std::string text;
    std::getline(std::cin, text);
    std::array<int, 256> counts{};
    for (unsigned char value : text) ++counts[value];
    for (std::size_t value = 0; value < counts.size(); ++value) {
        if (counts[value] > 0) std::cout << static_cast<char>(value) << ' ' << counts[value] << '\n';
    }
}
