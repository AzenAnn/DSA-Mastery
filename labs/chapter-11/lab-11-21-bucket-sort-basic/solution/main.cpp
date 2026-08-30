#include <iostream>
using namespace std;

int cnt[1001]; // 桶 = 计数数组：桶下标即数值

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    cin >> n;
    for (int i = 0; i < n; ++i) {
        int x;
        cin >> x;
        ++cnt[x]; // 每读到一个数，就往对应桶里丢一次
    }

    bool first = true;
    for (int i = 0; i <= 1000; ++i) {
        for (int k = 0; k < cnt[i]; ++k) {
            if (!first) cout << ' ';
            cout << i;
            first = false;
        }
    }
    cout << '\n';
}
