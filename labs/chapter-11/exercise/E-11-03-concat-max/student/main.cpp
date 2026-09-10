#include <algorithm>
#include <iostream>
#include <string>
#include <vector>
using namespace std;

int main() {
    int n;
    cin >> n;
    vector<string> nums(n);
    for (int i = 0; i < n; ++i) cin >> nums[i];

    // TODO: 把 n 个数字拼成一个最大的整数。
    // 提示：不要按数字本身大小排序（反例：9 和 90）。
    // 正确比较规则：对两个字符串 a、b，若 a+b > b+a（拼接后字典序），则 a 排前面。
    // 用一个比较器 cmp 传给 std::sort，排序后直接按序拼接输出。

    return 0;
}
