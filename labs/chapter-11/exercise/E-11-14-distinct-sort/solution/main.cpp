#include <iostream>
using namespace std;

int cnt[1001]; // 值域 1..1000，计数数组同时完成「去重」与「排序」

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    cin >> n;
    for (int i = 0; i < n; ++i) {
        int x;
        cin >> x;
        cnt[x] = 1; // 去重：同一数值只记一次
    }

    int m = 0;
    for (int i = 1; i <= 1000; ++i) {
        if (cnt[i]) ++m;
    }
    cout << m << '\n';

    bool first = true;
    for (int i = 1; i <= 1000; ++i) {
        if (cnt[i]) {
            if (!first) cout << ' ';
            cout << i;
            first = false;
        }
    }
    cout << '\n';
}
