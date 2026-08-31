#include <iostream>
#include <vector>
#include <string>
#include <queue>
#include <cstdint>

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
    while(!q.empty()&&i<input.size()){
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

int maxwidth(TreeNode* root){
    if(!root) return 0;
    queue<pair<TreeNode*,int>> q;
    q.push({root,0});
    int max=0;
    while(!q.empty()){
        int first=q.front().second;
        int last=q.back().second;
        max=max>(last-first+1)?max:(last-first+1);
        int sz=q.size();
        for(int i=0;i<sz;i++){
            TreeNode* curr=q.front().first;
            int idx=q.front().second;
            q.pop();
            if(curr->left!=nullptr){
                q.push({curr->left,2*idx+1});
            }
            if(curr->right!=nullptr){
                q.push({curr->right,2*idx+2});
            }
        }
    }
    return max;
}

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    // TODO: 读入层序序列构建二叉树，计算二叉树的最大宽度（带空位编号）。
    // 要求：基于 BFS 队列与节点编号，注意防止下标溢出，时间复杂度 O(n)，空间复杂度 O(n)。
    vector<string> input;
    string s;
    while(cin>>s){
        input.push_back(s);
    }
    cout<<maxwidth(creation(input));
    return 0;
}
