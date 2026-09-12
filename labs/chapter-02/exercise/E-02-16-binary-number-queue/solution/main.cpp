#include <iostream>
#include <queue>
#include <string>

int main() {
    int n = 0; if (!(std::cin >> n)) return 0;
    std::queue<std::string> queue; queue.push("1");
    for (int i = 0; i < n; ++i) {
        const std::string current = queue.front(); queue.pop();
        if (i) std::cout << ' '; std::cout << current;
        queue.push(current + "0"); queue.push(current + "1");
    }
    std::cout << '\n';
}
