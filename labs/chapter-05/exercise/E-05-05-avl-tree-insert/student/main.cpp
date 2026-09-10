#include <iostream>
#include <vector>
#include <queue>
using namespace std;

struct Node {
    int val, h;
    Node *l, *r;
    Node(int x) : val(x), h(1), l(nullptr), r(nullptr) {}
};

int height(Node* t) { return t ? t->h : 0; }
int bf(Node* t) { return t ? height(t->r) - height(t->l) : 0; }
void upd(Node* t) { if (t) t->h = 1 + max(height(t->l), height(t->r)); }

Node* rotR(Node* y) {
    // TODO: 以 y 为轴进行右旋
    return y;
}

Node* rotL(Node* x) {
    // TODO: 以 x 为轴进行左旋
    return x;
}

Node* insert(Node* t, int v) {
    // TODO: 将 v 插入 AVL 树并维持平衡
    return t;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    Node* root = nullptr;
    for (int i = 0; i < n; ++i) {
        int x; cin >> x;
        root = insert(root, x);
    }
    if (!root) { cout << "null\n"; return 0; }
    vector<string> out;
    queue<Node*> q;
    q.push(root);
    while (!q.empty()) {
        Node* u = q.front(); q.pop();
        if (!u) {
            out.push_back("null");
            continue;
        }
        out.push_back(to_string(u->val));
        q.push(u->l);
        q.push(u->r);
    }
    while (out.size() > 1 && out.back() == "null") out.pop_back();
    for (size_t i = 0; i < out.size(); ++i) {
        if (i) cout << ' ';
        cout << out[i];
    }
    cout << '\n';
    return 0;
}
