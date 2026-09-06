#include <iostream>
#include <vector>
using namespace std;

int main() {
    int n;
    cin >> n;
    vector<int> a(n);
    for (int i = 0; i < n; ++i) cin >> a[i];

    // TODO: 按 AOJ 格式输出插入排序的每一步。
    // 1) 先输出初始数组一行；
    // 2) 外层循环 i = 1 .. n-1，每完成一次插入就输出一行当前数组；
    // 共输出 n 行，每行数字用一个空格分隔。
    // 提示：写一个 print 函数，遍历数组打印（注意行尾不要多余空格）。

    return 0;
}
