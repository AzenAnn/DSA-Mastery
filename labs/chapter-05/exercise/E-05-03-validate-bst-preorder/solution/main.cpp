#include <iostream>
#include <vector>
#include <stack>
using namespace std;

bool isValidPreorder(const vector<int>& a) {
    stack<int> st;
    int lastPop = -1;
    bool hasLastPop = false;
    for (int x : a) {
        if (hasLastPop && x < lastPop) return false;
        while (!st.empty() && x > st.top()) {
            lastPop = st.top();
            hasLastPop = true;
            st.pop();
        }
        st.push(x);
    }
    return true;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int T;
    cin >> T;
    while (T--) {
        int n;
        cin >> n;
        vector<int> a(n);
        for (int i = 0; i < n; ++i) cin >> a[i];
        cout << (isValidPreorder(a) ? "Yes" : "No") << '\n';
    }
    return 0;
}
