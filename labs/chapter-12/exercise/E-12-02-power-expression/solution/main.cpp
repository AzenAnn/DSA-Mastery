#include <bits/stdc++.h>
using namespace std;

string encode(int value) {
    string result;
    for (int bit = 30; bit >= 0; --bit) {
        if (((value >> bit) & 1) == 0) continue;
        if (!result.empty()) result += '+';
        if (bit == 0) result += "2(0)";
        else if (bit == 1) result += '2';
        else result += "2(" + encode(bit) + ")";
    }
    return result;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    cout << encode(n) << '\n';
    return 0;
}
