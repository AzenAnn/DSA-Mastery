#include <iostream>
#include <vector>
#include <string>
#include <queue>
#include <algorithm>

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

void leveltraverse(TreeNode* root){
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
        cout<<endl;
    }
}

void zigzagtraverse(TreeNode* root){
    if(root==nullptr){
        return;
    }
    deque<TreeNode*> p;
    p.push_back(root);
    int indicator=0;
    while(!p.empty()){
        int sz=p.size();
        if(indicator%2==0){
            for(int i=0;i<sz;i++){
                TreeNode* curr=p.front();
                p.pop_front();
                cout<<curr->val<<' ';
                if(curr->left!=nullptr){
                    p.push_back(curr->left);
                }
                if(curr->right!=nullptr){
                    p.push_back(curr->right);
                }
            }
        }
        else{
            for(int i=0;i<sz;i++){
                TreeNode* curr=p.back();
                p.pop_back();
                cout<<curr->val<<' ';
                if(curr->right!=nullptr){
                    p.push_front(curr->right);
                }
                if(curr->left!=nullptr){
                    p.push_front(curr->left);
                }
            }
        }
        cout<<endl;
        indicator++;
    }
}

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    // TODO: 读入层序序列构建二叉树，输出普通层序遍历及之字形层序遍历。
    // 要求：基于 BFS 队列分层收集，时间复杂度 O(n)，空间复杂度 O(n)。
    vector<string> input;
    string s;
    while(cin>>s){
        input.push_back(s);
    }
    cout<<"LEVEL_ORDER: "<<endl;
    leveltraverse(creation(input));
    cout<<"ZIGZAG_ORDER: "<<endl;
    zigzagtraverse(creation(input));
    return 0;
}
