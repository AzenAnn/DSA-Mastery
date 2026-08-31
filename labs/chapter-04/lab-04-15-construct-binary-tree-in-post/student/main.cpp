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

TreeNode* build_tree(vector<int>& inorder,int inL,int inR,
                    vector<int>& postorder,int poL,int poR,unordered_map<int,int>& inmap){
    if(inL>inR||poL>poR){
        return nullptr;
    }
    int rootval=postorder[poR];
    int rootid=inmap.at(rootval);
    int lenL=rootid-inL;
    TreeNode* left=build_tree(inorder,inL,rootid-1,postorder,poL,poL+lenL-1,inmap);
    TreeNode* right=build_tree(inorder,rootid+1,inR,postorder,poL+lenL,poR-1,inmap);
    return new TreeNode(rootval,left,right);
}

TreeNode* build(vector<int>& inorder,vector<int>& postorder){
    unordered_map<int,int> inmap;
    for(int i=0;i<inorder.size();i++){
        inmap[inorder[i]]=i;
    }
    return build_tree(inorder,0,inorder.size()-1,
                    postorder,0,postorder.size()-1,inmap);
}

void preorder(TreeNode* root){
    if(root==nullptr){
        return;
    }
    cout<<root->val<<' ';
    preorder(root->left);
    preorder(root->right);
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

    // TODO: 读入中序与后序遍历序列，重构二叉树并输出其前序遍历序列与层序遍历序列。
    // 要求：递归分治或哈希加速定位根节点，时间复杂度 O(n)，空间复杂度 O(n)。
    int n;
    cin>>n;
    vector<int> inorder(n);
    vector<int> postorder(n);
    for(int i=0;i<n;i++){
        cin>>inorder[i];
    }
    for(int i=0;i<n;i++){
        cin>>postorder[i];
    }
    TreeNode* root=build(inorder,postorder);
    cout<<"PREORDER: ";
    preorder(root);
    cout<<endl<<"LEVELORDER: ";
    levelorder(root);
    return 0;
}
