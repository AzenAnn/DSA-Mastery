#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    string initial;
    unsigned long long position;
    cin >> initial >> position;
    unsigned long long baseLength = initial.size();
    unsigned long long length = baseLength;
    while (length < position) length *= 2;
    while (position > baseLength) {
        unsigned long long half = length / 2;
        if (position == half + 1) position = half;
        else if (position > half + 1) position = position - half - 1;
        length = half;
    }
    cout << initial[static_cast<size_t>(position - 1)] << '\n';
    return 0;
}
