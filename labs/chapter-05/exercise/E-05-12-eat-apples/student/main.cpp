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
    // TODO: 声明小根堆，元素为 (最后可食用日, 剩余个数)
    long long eaten = 0;
    for (int day = 1; day <= n; ++day) {
        // TODO: 把当天新批次入堆；弹出已腐烂批次；若堆非空则吃一个
    }
    // TODO: 第 n 天之后继续按天吃，直到堆空
    cout << eaten << '\n';
    return 0;
}
