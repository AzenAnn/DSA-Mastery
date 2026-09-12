#include <iostream>
#include <vector>
#include <queue>
#include <unordered_map>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, k;
    cin >> n >> k;
    vector<int> tasks(n);
    for (int i = 0; i < n; ++i) cin >> tasks[i];
    unordered_map<int, int> freq;
    for (int t : tasks) freq[t]++;
    priority_queue<int> pq;
    for (auto& p : freq) pq.push(p.second);
    int time = 0;
    while (!pq.empty()) {
        vector<int> tmp;
        int cycle = k + 1;
        while (cycle-- && !pq.empty()) {
            int cnt = pq.top(); pq.pop();
            if (cnt > 1) tmp.push_back(cnt - 1);
            time++;
        }
        for (int x : tmp) pq.push(x);
        if (!pq.empty()) time += cycle + 1;
    }
    cout << time << '\n';
    return 0;
}
