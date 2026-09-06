#include <iostream>
#include <vector>
#include <stack>
using namespace std;

bool isValidPreorder(const vector<int>& a) {
    // TODO: 判断序列 a 是否为某棵 BST 的先序遍历序列
    return true;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int T;
    cin >> T;
    while (T--) {
        int n;
        cin >> n;
        vector<int> a(n);
        for (int i = 0; i < n; ++i) cin >> a[i];
        cout << (isValidPreorder(a) ? "Yes" : "No") << '\n';
    }
    return 0;
}
