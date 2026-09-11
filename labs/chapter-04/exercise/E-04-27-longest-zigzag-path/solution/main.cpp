#include <bits/stdc++.h>
using namespace std;

struct TreeNode {
    int val;
    TreeNode* left = nullptr;
    TreeNode* right = nullptr;
    TreeNode(int x) : val(x) {}
};

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    string line;
    getline(cin, line);
    if (line.empty()) {
        cout << "0\n";
        return 0;
    }

    stringstream ss(line);
    vector<string> tokens;
    string tok;
    while (ss >> tok) tokens.push_back(tok);

    if (tokens.empty() || tokens[0] == "null") {
        cout << "0\n";
        return 0;
    }

    TreeNode* root = new TreeNode(stoi(tokens[0]));
    queue<TreeNode*> q;
    q.push(root);
    size_t i = 1;
    while (!q.empty() && i < tokens.size()) {
        TreeNode* cur = q.front(); q.pop();
        if (i < tokens.size() && tokens[i] != "null") {
            cur->left = new TreeNode(stoi(tokens[i]));
            q.push(cur->left);
        }
        ++i;
        if (i < tokens.size() && tokens[i] != "null") {
            cur->right = new TreeNode(stoi(tokens[i]));
            q.push(cur->right);
        }
        ++i;
    }

    int ans = 0;

    function<pair<int,int>(TreeNode*)> dfs = [&](TreeNode* u) -> pair<int,int> {
        if (!u) return {-1, -1};
        auto [ll, lr] = dfs(u->left);
        auto [rl, rr] = dfs(u->right);
        int leftZig = 1 + lr;
        int rightZig = 1 + rl;
        ans = max({ans, leftZig, rightZig});
        return {leftZig, rightZig};
    };

    dfs(root);
    cout << ans << "\n";

    return 0;
}
