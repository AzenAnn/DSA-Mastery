#include <iostream>
using namespace std;

struct TreeNode {
    int val;
    TreeNode *left, *right;
    TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
};

TreeNode* insert(TreeNode* root, int x) {
    // TODO: 将 x 插入 BST，若已存在则忽略
    return root;
}

bool search(TreeNode* root, int x) {
    // TODO: 在 BST 中查找 x
    return false;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int q;
    cin >> q;
    TreeNode* root = nullptr;
    while (q--) {
        char op;
        int x;
        cin >> op >> x;
        if (op == 'I') {
            root = insert(root, x);
        } else {
            cout << (search(root, x) ? "Yes" : "No") << '\n';
        }
    }
    return 0;
}
