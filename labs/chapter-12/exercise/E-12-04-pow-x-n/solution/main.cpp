#include <bits/stdc++.h>
using namespace std;

double fastPow(double base, long long exponent) {
    if (exponent == 0) return 1.0;
    double half = fastPow(base, exponent / 2);
    double result = half * half;
    return exponent % 2 == 0 ? result : result * base;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    double x;
    int n;
    cin >> x >> n;
    long long exponent = n;
    if (exponent < 0) {
        x = 1.0 / x;
        exponent = -exponent;
    }
    cout << setprecision(17) << fastPow(x, exponent) << '\n';
    return 0;
}
