#include <iostream>
using namespace std;

long long powerMod(long long base, unsigned long long exponent, long long mod) {
    if (exponent == 0) return 1 % mod;
    long long half = powerMod(base, exponent / 2, mod);
    long long result = half * half % mod;
    if (exponent % 2 == 1) result = result * base % mod;
    return result;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    long long a, mod;
    unsigned long long n;
    if (!(cin >> a >> n >> mod)) return 0;
    a %= mod;
    if (a < 0) a += mod;
    cout << powerMod(a, n, mod) << '\n';
}
