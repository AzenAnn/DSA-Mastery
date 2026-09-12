#include <iostream>
#include <string>

int main() {
    std::string text; if (!(std::cin >> text)) return 0;
    std::size_t left = 0, right = text.size();
    bool same = true;
    while (left < right) { --right; if (text[left++] != text[right]) { same = false; break; } }
    std::cout << (same ? "YES" : "NO") << '\n';
}
