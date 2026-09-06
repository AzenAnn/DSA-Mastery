#include <iostream>
#include <string>

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    std::string s;
    if (!(std::cin >> s)) return 0;

    int count[128] = {};
    for (const char c : s) {
        ++count[static_cast<unsigned char>(c)];
    }

    int answer = 0;
    bool hasOdd = false;
    for (const int value : count) {
        answer += value / 2 * 2;
        hasOdd = hasOdd || (value % 2 == 1);
    }
    if (hasOdd) ++answer;

    std::cout << answer << '\n';
    return 0;
}
