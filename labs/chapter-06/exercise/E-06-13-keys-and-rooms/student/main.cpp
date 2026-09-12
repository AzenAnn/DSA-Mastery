#include <iostream>
#include <vector>

bool canVisitAll(const std::vector<std::vector<int>>&) {
    // TODO: Start in room 0 and use only keys from visited rooms.
    // TODO: Mark a room when scheduling it, including self-key cases.
    return false;
}

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
    std::cout << canVisitAll(rooms) << '\n';
}
