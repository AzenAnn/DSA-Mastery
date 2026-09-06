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
    priority_queue<long long, vector<long long>, greater<long long>> pq;
    while (n--) {
        int op;
        cin >> op;
        if (op == 1) {
            long long x;
            cin >> x;
            pq.push(x);
        } else { // op == 2：删除并输出堆顶
            cout << pq.top() << '\n';
            pq.pop();
        }
    }
}
