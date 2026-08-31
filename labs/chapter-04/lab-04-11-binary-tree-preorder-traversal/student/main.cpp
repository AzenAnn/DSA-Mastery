#include <iostream>
#include <vector>
#include <string>
#include <queue>

using namespace std;

struct TreeNode {
    int val = 0;
    TreeNode* left = nullptr;
    TreeNode* right = nullptr;

    TreeNode() = default;
    TreeNode(int x) : val(x) {}
    TreeNode(int x, TreeNode* left, TreeNode* right) : val(x), left(left), right(right) {}
};

TreeNode* creation(vector<string>& input){
    if(input.empty()||input[0]=="null"){
        return nullptr;
    }
    queue<TreeNode*> q;
    TreeNode* root=new TreeNode(stoi(input[0]));
    q.push(root);
    int i=1;
    while(!q.empty()){
        TreeNode* curr=q.front();
        q.pop();
        if(i<input.size()&&input[i]!="null"){
            curr->left=new TreeNode(stoi(input[i]));
            q.push(curr->left);
        }
        i++;
        if(i<input.size()&&input[i]!="null"){
            curr->right=new TreeNode(stoi(input[i]));
            q.push(curr->right);
        }
        i++;
    }
    return root;
}

void preorder(TreeNode* root){
    if(root==nullptr){
        return;
    }
    cout<<root->val<<' ';
    preorder(root->left);
    preorder(root->right);
}

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    // TODO: 读入层序序列构建二叉树，输出其前序遍历序列。
    // 要求：时间复杂度 O(n)，空间复杂度 O(n)。
    vector<string> input;
    string s;
    while(cin>>s){
        input.push_back(s);
    }
    preorder(creation(input));
    return 0;
}
