#include <bits/stdc++.h>
using namespace std;

long long countInversions(vector<long long>& values, vector<long long>& buffer, int left, int right) {
    if (right - left <= 1) return 0;
    int middle = left + (right - left) / 2;
    long long answer = countInversions(values, buffer, left, middle)
                     + countInversions(values, buffer, middle, right);
    int i = left, j = middle, write = left;
    while (i < middle || j < right) {
        if (j == right || (i < middle && values[i] <= values[j])) buffer[write++] = values[i++];
        else {
            answer += middle - i;
            buffer[write++] = values[j++];
        }
    }
    copy(buffer.begin() + left, buffer.begin() + right, values.begin() + left);
    return answer;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    vector<long long> values(n), buffer(n);
    for (long long& value : values) cin >> value;
    cout << countInversions(values, buffer, 0, n) << '\n';
    return 0;
}
