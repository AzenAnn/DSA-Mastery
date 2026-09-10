#include <iostream>
#include <string>
#include <vector>
using namespace std;

struct Card {
    char suit;
    int value;
};

int main() {
    int n;
    cin >> n;
    vector<Card> a(n);
    for (int i = 0; i < n; ++i) {
        string s;
        cin >> s;
        a[i].suit = s[0];
        a[i].value = s[1] - '0';
    }

    // TODO:
    // 1) 用冒泡排序按数字排序，输出结果，再输出一行 "Stable"（冒泡排序是稳定的）；
    // 2) 用选择排序按数字排序，输出结果，再输出 "Stable" 或 "Not stable"。
    // 提示：判断选择排序是否稳定，可以把它的结果与冒泡排序（稳定）的结果比较，
    //   完全相同则稳定，否则不稳定。

    return 0;
}
