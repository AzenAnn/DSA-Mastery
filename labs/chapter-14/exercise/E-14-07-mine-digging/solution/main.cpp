#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    cin >> n;
    vector<long long> mines(n);
    for (long long& value : mines) cin >> value;
    int edgeCount;
    cin >> edgeCount;
    vector<vector<int>> graph(n);
    while (edgeCount--) {
        int from, to;
        cin >> from >> to;
        graph[from - 1].push_back(to - 1);
    }

    vector<long long> bestValue(n);
    vector<vector<int>> bestPath(n);
    for (int i = n - 1; i >= 0; --i) {
        bestValue[i] = mines[i];
        bestPath[i] = {i + 1};
        for (int next : graph[i]) {
            long long candidateValue = mines[i] + bestValue[next];
            vector<int> candidatePath{i + 1};
            candidatePath.insert(candidatePath.end(), bestPath[next].begin(), bestPath[next].end());
            if (candidateValue > bestValue[i] ||
                (candidateValue == bestValue[i] && candidatePath < bestPath[i])) {
                bestValue[i] = candidateValue;
                bestPath[i] = move(candidatePath);
            }
        }
    }

    int start = 0;
    for (int i = 1; i < n; ++i) {
        if (bestValue[i] > bestValue[start] ||
            (bestValue[i] == bestValue[start] && bestPath[i] < bestPath[start])) start = i;
    }
    for (int i = 0; i < static_cast<int>(bestPath[start].size()); ++i) {
        if (i) cout << ' ';
        cout << bestPath[start][i];
    }
    cout << '\n' << bestValue[start] << '\n';
    return 0;
}
