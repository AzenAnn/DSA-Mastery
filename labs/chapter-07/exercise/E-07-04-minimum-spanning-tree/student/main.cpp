#include <algorithm>
#include <iostream>
#include <vector>

struct Edge {
    int u;
    int v;
    long long w;
};

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    int n = 0;
    int m = 0;
    if (!(std::cin >> n >> m)) return 0;

    std::vector<Edge> edges(m);
    for (auto& e : edges) {
        std::cin >> e.u >> e.v >> e.w;
    }

    // TODO: 1) 按边权升序排序 edges；
    //       2) 用并查集依次尝试加入每条边，避免形成环；
    //       3) 累计被选中边的权重，直到生成树包含 n-1 条边为止。
    long long total = 0;

    std::cout << total << '\n';
    return 0;
}
