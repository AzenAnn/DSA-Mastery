#include <algorithm>
#include <array>
#include <cstdlib>
#include <functional>
#include <iostream>
#include <limits>
#include <numeric>
#include <queue>
#include <string>
#include <tuple>
#include <unordered_map>
#include <utility>
#include <vector>

using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    string start;
    if (!(cin >> start)) return 0;
    const string goal = "123804765";

    auto parity = [](const string& state) {
        int result = 0;
        for (int i = 0; i < 9; ++i) for (int j = i + 1; j < 9; ++j)
            if (state[i] != '0' && state[j] != '0' && state[i] > state[j]) result ^= 1;
        return result;
    };
    if (parity(start) != parity(goal)) { cout << "-1\n"; return 0; }
    array<int, 9> targetPosition{};
    for (int i = 0; i < 9; ++i) targetPosition[goal[i] - '0'] = i;
    auto heuristic = [&](const string& state) {
        int answer = 0;
        for (int i = 0; i < 9; ++i) if (state[i] != '0') {
            int j = targetPosition[state[i] - '0'];
            answer += abs(i / 3 - j / 3) + abs(i % 3 - j % 3);
        }
        return answer;
    };
    using State = tuple<int, int, string>;
    priority_queue<State, vector<State>, greater<State>> open;
    unordered_map<string, int> distance;
    distance[start] = 0; open.push({heuristic(start), 0, start});
    const int dr[] = {-1, 0, 1, 0}, dc[] = {0, 1, 0, -1};
    while (!open.empty()) {
        auto [f, g, state] = open.top(); open.pop();
        (void)f;
        if (distance.at(state) != g) continue;
        if (state == goal) { cout << g << '\n'; return 0; }
        int zero = static_cast<int>(state.find('0'));
        for (int i = 0; i < 4; ++i) {
            int r = zero / 3 + dr[i], c = zero % 3 + dc[i];
            if (r < 0 || r >= 3 || c < 0 || c >= 3) continue;
            string next = state;
            swap(next[zero], next[r * 3 + c]);
            auto found = distance.find(next);
            if (found == distance.end() || found->second > g + 1) {
                distance[next] = g + 1; open.push({g + 1 + heuristic(next), g + 1, next});
            }
        }
    }
    cout << "-1\n";
    return 0;
}
