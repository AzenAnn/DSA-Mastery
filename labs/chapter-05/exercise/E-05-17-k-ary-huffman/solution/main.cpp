#include <iostream>
#include <queue>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, k;
    cin >> n >> k;
    priority_queue<long long, vector<long long>, greater<long long>> pq;
    for (int i = 0; i < n; ++i) {
        long long x; cin >> x;
        pq.push(x);
    }
    while ((int)pq.size() > 1 && ((int)pq.size() - 1) % (k - 1) != 0) {
        pq.push(0);
    }
    long long total = 0;
    while ((int)pq.size() > 1) {
        long long sum = 0;
        for (int i = 0; i < k && !pq.empty(); ++i) {
            sum += pq.top(); pq.pop();
        }
        total += sum;
        pq.push(sum);
    }
    cout << total << '\n';
    return 0;
}
