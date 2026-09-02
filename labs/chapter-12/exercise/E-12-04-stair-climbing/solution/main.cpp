#include <iostream>
#include <vector>
using namespace std;

long long plainCalls = 0;
long long memoCalls = 0;

long long climbPlain(int n) {
    ++plainCalls;
    if (n <= 1) return 1;
    return climbPlain(n - 1) + climbPlain(n - 2);
}

long long climbMemo(int n, vector<long long>& memo) {
    ++memoCalls;
    if (n <= 1) return 1;
    if (memo[n] != -1) return memo[n];
    return memo[n] = climbMemo(n - 1, memo) + climbMemo(n - 2, memo);
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    if (!(cin >> n)) return 0;
    vector<long long> memo(n + 1, -1);
    long long plain = climbPlain(n);
    long long cached = climbMemo(n, memo);
    cout << plain << ' ' << cached << ' ' << plainCalls << ' ' << memoCalls << '\n';
}
