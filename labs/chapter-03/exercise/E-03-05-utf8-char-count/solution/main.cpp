#include <iostream>
#include <string>

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    std::string line;
    std::getline(std::cin, line);

    std::size_t bytes = line.size();
    std::size_t chars = 0;
    for (std::size_t i = 0; i < bytes;) {
        unsigned char c = static_cast<unsigned char>(line[i]);
        if ((c & 0x80) == 0) {
            ++chars;
            i += 1;
        } else if ((c & 0xE0) == 0xC0) {
            ++chars;
            i += 2;
        } else if ((c & 0xF0) == 0xE0) {
            ++chars;
            i += 3;
        } else if ((c & 0xF8) == 0xF0) {
            ++chars;
            i += 4;
        } else {
            ++chars;
            i += 1;
        }
    }
    std::cout << bytes << '\n';
    std::cout << chars << '\n';
    return 0;
}
