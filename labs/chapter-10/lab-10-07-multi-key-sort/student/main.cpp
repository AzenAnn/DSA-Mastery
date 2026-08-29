#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

// 学生信息：学号、语文、数学、英语、总分
struct Stu {
    int id, chinese, math, english, total;
};

int main() {
    int n;
    cin >> n;
    vector<Stu> stus(n);
    for (int i = 0; i < n; ++i) {
        stus[i].id = i + 1;
        cin >> stus[i].chinese >> stus[i].math >> stus[i].english;
        stus[i].total = stus[i].chinese + stus[i].math + stus[i].english;
    }

    // TODO: 按「总分降序 → 语文降序 → 学号升序」的优先级排序。
    // 提示：定义一个比较器 cmp(a, b)，逐层下钻比较：
    //   1) 总分不同 → 总分高的在前；
    //   2) 语文不同 → 语文高的在前；
    //   3) 否则 → 学号小的在前。
    // 然后 std::sort(stus.begin(), stus.end(), cmp)。
    // 最后输出前 5 名的学号和总分（不足 5 人则全部输出），每行两个数。

    return 0;
}
