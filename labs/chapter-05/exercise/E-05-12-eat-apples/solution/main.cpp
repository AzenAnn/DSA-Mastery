#include <functional>
#include <iostream>
#include <queue>
#include <utility>
#include <vector>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    vector<int> a(n), d(n);
    for (auto& x : a) cin >> x;
    for (auto& x : d) cin >> x;
    // 小根堆: (最后可食用日, 该批次剩余个数)
    priority_queue<pair<int, long long>,
                   vector<pair<int, long long>>, greater<>> pq;
    long long eaten = 0;
    for (int day = 1; day <= n; ++day) {
        if (a[day - 1] > 0) pq.push({day + d[day - 1] - 1, (long long)a[day - 1]});
        while (!pq.empty() && pq.top().first < day) pq.pop();  // 清理腐烂
        if (!pq.empty()) {                                     // 吃最紧急的一批
            auto [exp, rem] = pq.top();
            pq.pop();
            if (--rem > 0) pq.push({exp, rem});
            ++eaten;
        }
    }
    // n 天之后继续吃剩下的
    long long day = (long long)n + 1;
    while (!pq.empty()) {
        while (!pq.empty() && pq.top().first < day) pq.pop();
        if (pq.empty()) break;
        auto [exp, rem] = pq.top();
        pq.pop();
        if (--rem > 0) pq.push({exp, rem});
        ++eaten;
        ++day;
    }
    cout << eaten << '\n';
    return 0;
}
