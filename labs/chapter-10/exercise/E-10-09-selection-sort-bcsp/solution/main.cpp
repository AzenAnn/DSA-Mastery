#include <iostream>
#include <vector>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    cin >> n;
    vector<int> a(n);
    for (int i = 0; i < n; ++i) cin >> a[i];

    int sw = 0;
    for (int i = 0; i < n - 1; ++i) {
        int minj = i;
        for (int j = i + 1; j < n; ++j) {
            if (a[j] < a[minj]) minj = j;
        }
        // 最小值不在当前位才交换；每轮至多一次，所以总次数 O(n)
        if (minj != i) {
            swap(a[i], a[minj]);
            ++sw;
        }
    }

    cout << sw << '\n';
}
