#include <iostream>
#include <vector>

void printValues(const std::vector<long long>& values) {
    for (std::size_t i = 0; i < values.size(); ++i) {
        if (i > 0) std::cout << ' ';
        std::cout << values[i];
    }
    std::cout << '\n';
}

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    char type = '\0';
    int n = 0;
    int m = 0;
    if (!(std::cin >> type >> n >> m)) return 0;

    if (type == 'U') {
        std::vector<long long> degree(n, 0);
        for (int i = 0; i < m; ++i) {
            int u = 0;
            int v = 0;
            std::cin >> u >> v;
            // TODO: 普通无向边为两个端点各贡献一次度；
            // 无向自环应为同一个顶点贡献两次度。
        }

        // TODO: 计算度数和与奇数度顶点数量。
        printValues(degree);
        std::cout << "0 0\n";
        return 0;
    }

    std::vector<long long> indegree(n, 0);
    std::vector<long long> outdegree(n, 0);
    for (int i = 0; i < m; ++i) {
        int u = 0;
        int v = 0;
        std::cin >> u >> v;
        // TODO: 边 u -> v 应更新哪个顶点的入度和出度？
    }

    // TODO: 计算入度和与出度和。
    printValues(indegree);
    printValues(outdegree);
    std::cout << "0 0\n";
    return 0;
}
