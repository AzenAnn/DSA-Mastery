#include <iostream>
#include <vector>
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

TreeNode* findMin(TreeNode* root) {
    while (root && root->left) root = root->left;
    return root;
}

TreeNode* remove(TreeNode* root, int x) {
    if (!root) return nullptr;
    if (x < root->val) root->left = remove(root->left, x);
    else if (x > root->val) root->right = remove(root->right, x);
    else {
        if (!root->left) {
            TreeNode* tmp = root->right;
            delete root;
            return tmp;
        }
        if (!root->right) {
            TreeNode* tmp = root->left;
            delete root;
            return tmp;
        }
        TreeNode* succ = findMin(root->right);
        root->val = succ->val;
        root->right = remove(root->right, succ->val);
    }
    return root;
}

void inorder(TreeNode* root, vector<int>& res) {
    if (!root) return;
    inorder(root->left, res);
    res.push_back(root->val);
    inorder(root->right, res);
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
    int m;
    cin >> m;
    for (int i = 0; i < m; ++i) {
        int x; cin >> x;
        root = remove(root, x);
    }
    vector<int> res;
    inorder(root, res);
    if (res.empty()) {
        cout << "null\n";
    } else {
        for (size_t i = 0; i < res.size(); ++i) {
            if (i) cout << ' ';
            cout << res[i];
        }
        cout << '\n';
    }
    return 0;
}
