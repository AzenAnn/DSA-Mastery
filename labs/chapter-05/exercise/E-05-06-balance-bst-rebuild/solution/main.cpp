#include <functional>
#include <iostream>
#include <queue>
#include <string>
#include <vector>
using namespace std;

struct Node {
    long long val;
    Node* left;
    Node* right;
    Node(long long v) : val(v), left(nullptr), right(nullptr) {}
};

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    vector<string> tok;
    string s;
    while (cin >> s) tok.push_back(s);

    // ① 按层序建树
    Node* root = new Node(stoll(tok[0]));
    queue<Node*> qu;
    qu.push(root);
    size_t idx = 1;
    while (!qu.empty() && idx < tok.size()) {
        Node* cur = qu.front();
        qu.pop();
        if (tok[idx] != "#") {                      // 左孩子
            cur->left = new Node(stoll(tok[idx]));
            qu.push(cur->left);
        }
        ++idx;
        if (idx < tok.size() && tok[idx] != "#") {  // 右孩子
            cur->right = new Node(stoll(tok[idx]));
            qu.push(cur->right);
        }
        ++idx;
    }

    // ② 中序遍历 -> 有序数组
    vector<long long> in;
    vector<Node*> st;
    Node* cur = root;
    while (cur || !st.empty()) {
        while (cur) {
            st.push_back(cur);
            cur = cur->left;
        }
        cur = st.back();
        st.pop_back();
        in.push_back(cur->val);
        cur = cur->right;
    }

    // ③ 取中点重建
    function<Node*(int, int)> build = [&](int l, int r) -> Node* {
        if (l > r) return nullptr;
        int mid = (l + r) / 2;
        Node* node = new Node(in[mid]);
        node->left = build(l, mid - 1);
        node->right = build(mid + 1, r);
        return node;
    };
    Node* nb = build(0, (int)in.size() - 1);

    // ④ 层序输出
    vector<string> out;
    queue<Node*> q2;
    if (nb) q2.push(nb);
    while (!q2.empty()) {
        Node* c = q2.front();
        q2.pop();
        if (!c) {
            out.push_back("#");
            continue;
        }
        out.push_back(to_string(c->val));
        q2.push(c->left);
        q2.push(c->right);
    }
    while (out.size() > 1 && out.back() == "#") out.pop_back();
    for (size_t i = 0; i < out.size(); ++i) {
        if (i) cout << ' ';
        cout << out[i];
    }
    cout << '\n';
    return 0;
}
