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
            if (u == v) {
                degree[u] += 2;
            } else {
                ++degree[u];
                ++degree[v];
            }
        }

        long long degreeSum = 0;
        int oddCount = 0;
        for (long long value : degree) {
            degreeSum += value;
            if (value % 2 != 0) ++oddCount;
        }

        printValues(degree);
        std::cout << degreeSum << ' ' << oddCount << '\n';
        return 0;
    }

    std::vector<long long> indegree(n, 0);
    std::vector<long long> outdegree(n, 0);
    for (int i = 0; i < m; ++i) {
        int u = 0;
        int v = 0;
        std::cin >> u >> v;
        ++outdegree[u];
        ++indegree[v];
    }

    long long indegreeSum = 0;
    long long outdegreeSum = 0;
    for (int vertex = 0; vertex < n; ++vertex) {
        indegreeSum += indegree[vertex];
        outdegreeSum += outdegree[vertex];
    }

    printValues(indegree);
    printValues(outdegree);
    std::cout << indegreeSum << ' ' << outdegreeSum << '\n';
    return 0;
}
