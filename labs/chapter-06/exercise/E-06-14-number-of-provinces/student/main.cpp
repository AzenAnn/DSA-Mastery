#include <iostream>
#include <vector>

int countProvinces(const std::vector<std::vector<int>>&) {
    // TODO: Start a traversal at each still-unvisited city.
    // TODO: The diagonal 1 does not create an additional province.
    return 0;
}

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);
    int n = 0;
    if (!(std::cin >> n)) return 0;
    std::vector<std::vector<int>> connected(n, std::vector<int>(n));
    for (auto& row : connected) for (int& value : row) std::cin >> value;
    std::cout << countProvinces(connected) << '\n';
}
