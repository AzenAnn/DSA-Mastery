#include <iostream>
#include <queue>
#include <vector>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    cin >> n;

    // 对顶堆：big 存较小的一半（大根堆），small 存较大的一半（小根堆）
    priority_queue<long long> big;                                          // 大根堆
    priority_queue<long long, vector<long long>, greater<long long>> small; // 小根堆

    for (int i = 1; i <= n; ++i) {
        long long x;
        cin >> x;

        // 插入：与 big.top() 比较决定去向
        if (big.empty() || x <= big.top()) big.push(x);
        else small.push(x);

        // 保持 big.size() == small.size() 或 big.size() == small.size() + 1
        while (big.size() > small.size() + 1) {
            small.push(big.top());
            big.pop();
        }
        while (big.size() < small.size()) {
            big.push(small.top());
            small.pop();
        }

        // 奇数长度前缀的中位数 = big.top()
        if (i % 2 == 1) cout << big.top() << '\n';
    }
}
