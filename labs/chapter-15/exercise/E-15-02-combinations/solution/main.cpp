#include <functional>
#include <iomanip>
#include <iostream>
#include <vector>

using namespace std;

void solve(int n, int r) {
    vector<int> path;
    function<void(int)> dfs = [&](int start) {
        int need = r - static_cast<int>(path.size());
        if (need == 0) {
            for (int value : path) cout << setw(3) << value;
            cout << '\n';
            return;
        }
        for (int value = start; value <= n - need + 1; ++value) {
            path.push_back(value);
            dfs(value + 1);
            path.pop_back();
        }
    };
    dfs(1);
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, r;
    if (!(cin >> n >> r)) return 0;
    solve(n, r);
    return 0;
}
