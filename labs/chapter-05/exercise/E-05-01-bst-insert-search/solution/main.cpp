#include <iostream>
using namespace std;

struct TreeNode {
    int val;
    TreeNode *left, *right;
    TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
};

TreeNode* insert(TreeNode* root, int x) {
    if (!root) return new TreeNode(x);
    if (x < root->val) root->left = insert(root->left, x);
    else if (x > root->val) root->right = insert(root->right, x);
    return root;
}

bool search(TreeNode* root, int x) {
    if (!root) return false;
    if (x == root->val) return true;
    if (x < root->val) return search(root->left, x);
    return search(root->right, x);
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
