#include <bits/stdc++.h>
using namespace std;

vector<int> values, indices, buffer, answer;

void countSmaller(int left, int right) {
    if (right - left <= 1) return;
    int middle = left + (right - left) / 2;
    countSmaller(left, middle);
    countSmaller(middle, right);
    int i = left, j = middle, write = left;
    while (i < middle || j < right) {
        if (j == right || (i < middle && values[indices[i]] <= values[indices[j]])) {
            answer[indices[i]] += j - middle;
            buffer[write++] = indices[i++];
        } else {
            buffer[write++] = indices[j++];
        }
    }
    copy(buffer.begin() + left, buffer.begin() + right, indices.begin() + left);
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    values.resize(n);
    for (int& value : values) cin >> value;
    indices.resize(n);
    iota(indices.begin(), indices.end(), 0);
    buffer.resize(n);
    answer.assign(n, 0);
    countSmaller(0, n);
    for (int i = 0; i < n; ++i) cout << answer[i] << (i + 1 == n ? '\n' : ' ');
    return 0;
}
