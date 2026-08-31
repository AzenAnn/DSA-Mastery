#include <iostream>
#include <string>
#include <vector>
using namespace std;

struct Card {
    char suit;
    int value;
};

void printCards(const vector<Card>& a) {
    for (int i = 0; i < (int)a.size(); ++i) {
        if (i) cout << ' ';
        cout << a[i].suit << a[i].value;
    }
    cout << '\n';
}

// 判断两个牌序是否完全一致（花色和数字都相同）
bool sameCards(const vector<Card>& x, const vector<Card>& y) {
    if (x.size() != y.size()) return false;
    for (int i = 0; i < (int)x.size(); ++i) {
        if (x[i].suit != y[i].suit || x[i].value != y[i].value) return false;
    }
    return true;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    cin >> n;
    vector<Card> a(n);
    for (int i = 0; i < n; ++i) {
        string s;
        cin >> s;
        a[i].suit = s[0];
        a[i].value = s[1] - '0';
    }

    // 冒泡排序：稳定
    vector<Card> bubble = a;
    for (int i = 0; i < n - 1; ++i) {
        for (int j = n - 1; j > i; --j) {
            if (bubble[j].value < bubble[j - 1].value) {
                swap(bubble[j], bubble[j - 1]);
            }
        }
    }

    // 选择排序：不稳定
    vector<Card> sel = a;
    for (int i = 0; i < n - 1; ++i) {
        int minj = i;
        for (int j = i + 1; j < n; ++j) {
            if (sel[j].value < sel[minj].value) minj = j;
        }
        swap(sel[i], sel[minj]);
    }

    printCards(bubble);
    cout << "Stable\n";
    printCards(sel);
    // 冒泡排序是稳定的，其结果就是稳定排序的唯一结果；
    // 选择排序的结果若与之相同，则说明本轮输入下选择排序也保持了稳定。
    cout << (sameCards(sel, bubble) ? "Stable" : "Not stable") << '\n';
}
