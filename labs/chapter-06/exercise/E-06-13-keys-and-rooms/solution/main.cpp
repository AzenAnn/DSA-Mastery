#include <iostream>
#include <vector>

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);
    int n = 0;
    if (!(std::cin >> n)) return 0;
    std::vector<std::vector<int>> rooms(n);
    for (auto& keys : rooms) {
        int k = 0;
        std::cin >> k;
        keys.resize(k);
        for (int& key : keys) std::cin >> key;
    }
    std::vector<bool> visited(n, false);
    std::vector<int> pending{0};
    visited[0] = true;
    int count = 0;
    while (!pending.empty()) {
        int room = pending.back();
        pending.pop_back();
        ++count;
        for (int key : rooms[room]) {
            if (!visited[key]) {
                visited[key] = true;
                pending.push_back(key);
            }
        }
    }
    std::cout << (count == n) << '\n';
}
