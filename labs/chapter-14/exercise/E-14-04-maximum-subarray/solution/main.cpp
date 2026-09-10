#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    cin >> n;
    long long ending;
    cin >> ending;
    long long answer = ending;
    for (int i = 1; i < n; ++i) {
        long long value;
        cin >> value;
        ending = max(value, ending + value);
        answer = max(answer, ending);
    }
    cout << answer << '\n';
    return 0;
}
