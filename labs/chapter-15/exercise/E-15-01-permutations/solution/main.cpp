#include <functional>
#include <iomanip>
#include <iostream>
#include <vector>

using namespace std;

void solve(int n) {
    vector<int> path;
    vector<bool> used(n + 1, false);
    function<void()> dfs = [&]() {
        if (static_cast<int>(path.size()) == n) {
            for (int value : path) cout << setw(5) << value;
            cout << '\n';
            return;
        }
        for (int value = 1; value <= n; ++value) {
            if (used[value]) continue;
            used[value] = true;
            path.push_back(value);
            dfs();
            path.pop_back();
            used[value] = false;
        }
    };
    dfs();
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    if (!(cin >> n)) return 0;
    solve(n);
    return 0;
}
