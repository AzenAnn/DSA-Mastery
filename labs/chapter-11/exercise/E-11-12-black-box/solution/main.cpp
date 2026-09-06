#include <iostream>
#include <queue>
#include <vector>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int M, N;
    cin >> M >> N;

    vector<long long> a(M);
    for (int i = 0; i < M; ++i) cin >> a[i];
    vector<int> u(N);
    for (int i = 0; i < N; ++i) cin >> u[i];

    // 对顶堆：big 存当前最小的 i 个元素（大根堆），small 存其余元素（小根堆）
    priority_queue<long long> big;                                              // 大根堆
    priority_queue<long long, vector<long long>, greater<long long>> small;     // 小根堆

    int idx = 0; // 下一个要 ADD 的下标
    for (int i = 1; i <= N; ++i) {
        // 一直 ADD 到第 u[i-1] 个元素为止
        while (idx < u[i - 1]) {
            long long x = a[idx++];
            if (big.empty() || x <= big.top()) big.push(x);
            else small.push(x);
        }

        // 调整 big 的大小为 i（让它恰好保存最小的 i 个元素）
        while ((int)big.size() > i) {
            small.push(big.top());
            big.pop();
        }
        while ((int)big.size() < i) {
            big.push(small.top());
            small.pop();
        }

        cout << big.top() << '\n';
    }
}
