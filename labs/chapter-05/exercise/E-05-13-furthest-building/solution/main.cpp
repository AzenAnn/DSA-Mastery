#include <functional>
#include <iostream>
#include <queue>
#include <vector>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    long long b;
    int l;
    cin >> n >> b >> l;
    vector<int> h(n);
    for (auto& x : h) cin >> x;
    priority_queue<int, vector<int>, greater<int>> pq;  // 当前最大的 l 个差中最小者
    for (int i = 0; i + 1 < n; ++i) {
        int diff = h[i + 1] - h[i];
        if (diff <= 0) continue;          // 下降无需资源
        pq.push(diff);
        if ((int)pq.size() > l) {         // 梯子不够用砖
            b -= pq.top();
            pq.pop();
            if (b < 0) {                  // 砖不够 -> 停在 i 号
                cout << i << '\n';
                return 0;
            }
        }
    }
    cout << n - 1 << '\n';
    return 0;
}
