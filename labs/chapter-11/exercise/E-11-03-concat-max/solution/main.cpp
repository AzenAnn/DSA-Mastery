#include <algorithm>
#include <iostream>
#include <string>
#include <vector>
using namespace std;

// 比较拼接结果：a+b > b+a 则 a 排前
bool cmp(const string& a, const string& b) {
    return a + b > b + a;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    cin >> n;
    vector<string> nums(n);
    for (int i = 0; i < n; ++i) cin >> nums[i];

    sort(nums.begin(), nums.end(), cmp);
    for (int i = 0; i < n; ++i) cout << nums[i];
    cout << '\n';
}
