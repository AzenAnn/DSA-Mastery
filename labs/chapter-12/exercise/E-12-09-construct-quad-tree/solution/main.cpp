#include <bits/stdc++.h>
using namespace std;

struct Node {
    bool leaf;
    int value;
    array<unique_ptr<Node>, 4> child;
    Node(bool isLeaf, int cell) : leaf(isLeaf), value(cell) {}
};

unique_ptr<Node> build(const vector<vector<int>>& grid, int row, int col, int size) {
    int first = grid[row][col];
    bool uniform = true;
    for (int i = row; i < row + size && uniform; ++i) {
        for (int j = col; j < col + size; ++j) uniform = uniform && grid[i][j] == first;
    }
    if (uniform) return make_unique<Node>(true, first);
    int half = size / 2;
    auto node = make_unique<Node>(false, 0);
    node->child[0] = build(grid, row, col, half);
    node->child[1] = build(grid, row, col + half, half);
    node->child[2] = build(grid, row + half, col, half);
    node->child[3] = build(grid, row + half, col + half, half);
    return node;
}

void serialize(const Node* node, vector<string>& tokens) {
    if (node->leaf) {
        tokens.push_back(node->value ? "L1" : "L0");
        return;
    }
    tokens.push_back("I");
    for (const auto& child : node->child) serialize(child.get(), tokens);
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    vector<vector<int>> grid(n, vector<int>(n));
    for (auto& row : grid) for (int& value : row) cin >> value;
    vector<string> tokens;
    serialize(build(grid, 0, 0, n).get(), tokens);
    for (int i = 0; i < static_cast<int>(tokens.size()); ++i) cout << tokens[i] << (i + 1 == static_cast<int>(tokens.size()) ? '\n' : ' ');
    return 0;
}
