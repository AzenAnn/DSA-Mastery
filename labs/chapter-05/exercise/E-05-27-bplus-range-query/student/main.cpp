#include <iostream>
#include <set>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    set<int> s;
    while (n--) {
        char op;
        cin >> op;
        if (op == 'I') {
            int x; cin >> x;
            s.insert(x);
        } else {
            int L, R;
            cin >> L >> R;
            // TODO: 统计 [L, R] 范围内的关键字数量
            int ans = 0;
            cout << ans << '\n';
        }
    }
    return 0;
}
