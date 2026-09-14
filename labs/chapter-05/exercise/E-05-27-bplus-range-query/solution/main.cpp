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
            auto it = s.lower_bound(L);
            int ans = 0;
            while (it != s.end() && *it <= R) {
                ans++;
                ++it;
            }
            cout << ans << '\n';
        }
    }
    return 0;
}
