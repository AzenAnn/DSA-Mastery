#include <iostream>
#include <vector>
#include <unordered_map>
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

TreeNode* build(vector<int>& preorder, int preL, int preR,
                vector<int>& inorder, int inL, int inR, 
                unordered_map<int,int>& inmap){

    if(preL>preR||inL>inR){
        return nullptr;
    }
    int rootval=preorder[preL];
    int rootid=inmap.at(rootval);
    int lenL=rootid-inL;

    TreeNode* left=build(preorder,preL+1,preL+lenL,
                        inorder,inL,rootid-1,inmap);
    TreeNode* right=build(preorder,preL+lenL+1,preR,
                        inorder,rootid+1,inR,inmap);
    return new TreeNode(rootval,left,right);
}

TreeNode* build_tree(vector<int>& preorder, vector<int>& inorder){
    unordered_map<int,int> inmap;
    for(int i=0;i<inorder.size();i++){
        inmap[inorder[i]]=i;
    }
    return build(preorder,0,preorder.size()-1,
                inorder,0,inorder.size()-1,inmap);
}

void postorder(TreeNode* root){
    if(root==nullptr){
        return;
    }
    postorder(root->left);
    postorder(root->right);
    cout<<root->val<<' ';
}

void levelorder(TreeNode* root){
    if(root==nullptr){
        return;
    }
    queue<TreeNode*> q;
    q.push(root);
    while(!q.empty()){
        int sz=q.size();
        for(int i=0;i<sz;i++){
            TreeNode* curr=q.front();
            q.pop();
            cout<<curr->val<<' ';
            if(curr->left!=nullptr){
                q.push(curr->left);
            }
            if(curr->right!=nullptr){
                q.push(curr->right);
            }
        }
    }
}

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    // TODO: 读入前序与中序遍历序列，重构二叉树并输出其后序遍历序列与层序遍历序列。
    // 要求：递归分治或哈希加速定位根节点，时间复杂度 O(n)，空间复杂度 O(n)。
    int n;
    cin>>n;
    vector<int> preorder(n);
    vector<int> inorder(n);
    for(int i=0;i<n;i++){
        cin>>preorder[i];
    }
    for(int i=0;i<n;i++){
        cin>>inorder[i];
    }
    TreeNode* root=build_tree(preorder,inorder);
    cout<<"POSTORDER: ";
    postorder(root);
    cout<<endl<<"LEVELORDER: ";
    levelorder(root);
    return 0;
}
