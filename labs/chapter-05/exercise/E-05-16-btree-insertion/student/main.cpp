#include <iostream>
#include <vector>
#include <queue>
#include <algorithm>
using namespace std;

struct BTreeNode {
    vector<int> keys;
    vector<BTreeNode*> children;
    bool leaf;
    BTreeNode(bool l) : leaf(l) {}
};

// TODO: 实现节点分裂，返回上升的关键字和新右兄弟
pair<int, BTreeNode*> splitNode(BTreeNode* x, int m) {
    return {-1, nullptr};
}

// TODO: 递归插入，返回 {节点, 上升关键字, 右兄弟}
tuple<BTreeNode*, int, BTreeNode*> insertRec(BTreeNode* x, int k, int m) {
    // ...
    return {x, -1, nullptr};
}

BTreeNode* insert(BTreeNode* root, int k, int m) {
    if (!root) {
        root = new BTreeNode(true);
        root->keys.push_back(k);
        return root;
    }
    auto [node, up, right] = insertRec(root, k, m);
    if (up != -1) {
        BTreeNode* newRoot = new BTreeNode(false);
        newRoot->keys.push_back(up);
        newRoot->children.push_back(node);
        newRoot->children.push_back(right);
        return newRoot;
    }
    return node;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int m, n;
    cin >> m >> n;
    BTreeNode* root = nullptr;
    for (int i = 0; i < n; ++i) {
        int x; cin >> x;
        root = insert(root, x, m);
    }
    if (!root) { cout << "null\n"; return 0; }
    vector<string> levels;
    queue<BTreeNode*> q;
    q.push(root);
    while (!q.empty()) {
        int sz = q.size();
        string level;
        for (int i = 0; i < sz; ++i) {
            BTreeNode* u = q.front(); q.pop();
            if (i) level += ";";
            for (size_t j = 0; j < u->keys.size(); ++j) {
                if (j) level += " ";
                level += to_string(u->keys[j]);
            }
            for (auto* v : u->children) q.push(v);
        }
        levels.push_back(level);
    }
    for (size_t i = 0; i < levels.size(); ++i) {
        if (i) cout << ";";
        cout << levels[i];
    }
    cout << '\n';
    return 0;
}
