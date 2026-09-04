#include <bits/stdc++.h>
using namespace std;

long long memo[21][21][21];
bool ready[21][21][21];

long long solve(long long a, long long b, long long c) {
    if (a <= 0 || b <= 0 || c <= 0) return 1;
    if (a > 20 || b > 20 || c > 20) return solve(20, 20, 20);
    if (ready[a][b][c]) return memo[a][b][c];
    ready[a][b][c] = true;
    if (a < b && b < c) {
        memo[a][b][c] = solve(a, b, c - 1) + solve(a, b - 1, c - 1) - solve(a, b - 1, c);
    } else {
        memo[a][b][c] = solve(a - 1, b, c) + solve(a - 1, b - 1, c)
                       + solve(a - 1, b, c - 1) - solve(a - 1, b - 1, c - 1);
    }
    return memo[a][b][c];
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    long long a, b, c;
    while (cin >> a >> b >> c && !(a == -1 && b == -1 && c == -1)) {
        cout << "w(" << a << ", " << b << ", " << c << ") = " << solve(a, b, c) << '\n';
    }
    return 0;
}
