#include <iostream>
#include <queue>
#include <vector>

int main() {
    int start = 0, target = 0, limit = 0;
    if (!(std::cin >> start >> target >> limit)) return 0;
    std::vector<int> distance(limit, -1); std::queue<int> queue;
    distance[start] = 0; queue.push(start);
    while (!queue.empty()) {
        const int current = queue.front(); queue.pop();
        if (current == target) break;
        const int nexts[3] = {current - 1, current + 1, current * 2};
        for (int next : nexts) if (next >= 0 && next < limit && distance[next] == -1) { distance[next] = distance[current] + 1; queue.push(next); }
    }
    std::cout << distance[target] << '\n';
}
