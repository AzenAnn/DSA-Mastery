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
    else root->right = insert(root->right, x);
    return root;
}

int kthSmallest(TreeNode* root, int k, int& cnt) {
    // TODO: 返回 BST 中第 k 小的元素
    return -1;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    TreeNode* root = nullptr;
    for (int i = 0; i < n; ++i) {
        int x; cin >> x;
        root = insert(root, x);
    }
    int q;
    cin >> q;
    while (q--) {
        int k;
        cin >> k;
        int cnt = 0;
        cout << kthSmallest(root, k, cnt) << '\n';
    }
    return 0;
}
