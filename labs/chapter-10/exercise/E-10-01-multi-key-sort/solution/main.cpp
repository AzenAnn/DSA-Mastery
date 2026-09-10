#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

struct Stu {
    int id, chinese, math, english, total;
};

// 比较器：总分降序 → 语文降序 → 学号升序
bool cmp(const Stu& a, const Stu& b) {
    if (a.total != b.total) return a.total > b.total;
    if (a.chinese != b.chinese) return a.chinese > b.chinese;
    return a.id < b.id;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    cin >> n;
    vector<Stu> stus(n);
    for (int i = 0; i < n; ++i) {
        stus[i].id = i + 1;
        cin >> stus[i].chinese >> stus[i].math >> stus[i].english;
        stus[i].total = stus[i].chinese + stus[i].math + stus[i].english;
    }

    sort(stus.begin(), stus.end(), cmp);

    int k = min(5, n);
    for (int i = 0; i < k; ++i) {
        cout << stus[i].id << ' ' << stus[i].total << '\n';
    }
}
