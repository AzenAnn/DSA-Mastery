#include <functional>
#include <iostream>
#include <queue>
#include <string>
#include <vector>
using namespace std;

struct Node {
    long long val;
    Node* left;
    Node* right;
    Node(long long v) : val(v), left(nullptr), right(nullptr) {}
};

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    vector<string> tok;
    string s;
    while (cin >> s) tok.push_back(s);

    // TODO: 按层序建树（# 表示空节点）
    Node* root = nullptr;

    // TODO: 中序遍历原树，得到有序数组 in
    vector<long long> in;

    // TODO: 实现 build(l, r)：取 mid = (l+r)/2 为根，递归建树
    Node* nb = nullptr;

    // TODO: 层序遍历新树输出（空孩子输出 #，去掉行末多余的 #）
    return 0;
}
