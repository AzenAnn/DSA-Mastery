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

// Split a node that has m keys (overflow after insertion).
// Returns the key to promote and the new right sibling.
pair<int, BTreeNode*> splitNode(BTreeNode* x, int m) {
    int mid = m / 2;
    int up = x->keys[mid];
    
    BTreeNode* right = new BTreeNode(x->leaf);
    right->keys.assign(x->keys.begin() + mid + 1, x->keys.end());
    
    if (!x->leaf) {
        right->children.assign(x->children.begin() + mid + 1, x->children.end());
        x->children.resize(mid + 1);
    }
    
    x->keys.resize(mid);
    return {up, right};
}

// Insert k into subtree rooted at x. 
// Returns {new_root_or_x, promoted_key, new_right_child}
// If no split needed, promoted_key = -1 and right_child = nullptr.
tuple<BTreeNode*, int, BTreeNode*> insertRec(BTreeNode* x, int k, int m) {
    if (x->leaf) {
        x->keys.push_back(k);
        sort(x->keys.begin(), x->keys.end());
        if ((int)x->keys.size() <= m - 1) {
            return {x, -1, nullptr};
        }
        // Leaf overflow
        auto [up, right] = splitNode(x, m);
        return {x, up, right};
    }
    
    // Find appropriate child
    int i = 0;
    while (i < (int)x->keys.size() && k > x->keys[i]) i++;
    
    auto [child, upChild, rightChild] = insertRec(x->children[i], k, m);
    
    if (upChild == -1) {
        return {x, -1, nullptr};
    }
    
    // Child split, insert promoted key into current node
    x->keys.insert(x->keys.begin() + i, upChild);
    x->children.insert(x->children.begin() + i + 1, rightChild);
    
    if ((int)x->keys.size() <= m - 1) {
        return {x, -1, nullptr};
    }
    
    // Current node overflow
    auto [up, right] = splitNode(x, m);
    return {x, up, right};
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
