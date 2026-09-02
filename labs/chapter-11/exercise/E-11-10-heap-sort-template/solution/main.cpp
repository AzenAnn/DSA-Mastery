#include <iostream>
#include <queue>
#include <vector>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    cin >> n;

    // 小根堆：堆顶始终是当前最小元素
    priority_queue<int, vector<int>, greater<int>> pq;
    for (int i = 0; i < n; ++i) {
        int x;
        cin >> x;
        pq.push(x);
    }

    while (!pq.empty()) {
        cout << pq.top();
        pq.pop();
        if (!pq.empty()) cout << ' ';
    }
    cout << '\n';
}
