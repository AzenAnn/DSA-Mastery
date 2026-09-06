#include <iostream>
#include <string>
using namespace std;

// 返回 a 是否大于 b（超长非负整数比较，无前导零）
bool bigger(const string& a, const string& b) {
    if (a.size() != b.size()) return a.size() > b.size();
    return a > b;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    cin >> n;

    string best;
    int bestId = 1;
    for (int i = 1; i <= n; ++i) {
        string s;
        cin >> s;
        if (best.empty() || bigger(s, best)) {
            best = s;
            bestId = i;
        }
    }

    cout << bestId << '\n' << best << '\n';
}
