#include <iostream>
#include <memory>
#include <string>
#include <vector>

struct Node {
    bool atom = false;
    char ch = '\0';
    std::vector<std::shared_ptr<Node>> children;  // 表元素列表
};

// 递归下降解析：跳过空格，pos 始终指向待解析字符
std::shared_ptr<Node> parse(const std::string& s, int& pos) {
    while (pos < (int)s.size() && s[pos] == ' ') ++pos;
    if (s[pos] == '(') {
        auto node = std::make_shared<Node>();
        node->atom = false;
        ++pos;
        while (pos < (int)s.size() && s[pos] == ' ') ++pos;
        if (s[pos] == ')') {  // 空表
            ++pos;
            return node;
        }
        while (true) {
            while (pos < (int)s.size() && s[pos] == ' ') ++pos;
            if (s[pos] == '(') {
                node->children.push_back(parse(s, pos));
            } else {
                auto atom = std::make_shared<Node>();
                atom->atom = true;
                atom->ch = s[pos];
                node->children.push_back(atom);
                ++pos;
            }
            while (pos < (int)s.size() && s[pos] == ' ') ++pos;
            if (s[pos] == ',') {
                ++pos;
                continue;
            } else if (s[pos] == ')') {
                ++pos;
                break;
            }
        }
        return node;
    } else {
        auto atom = std::make_shared<Node>();
        atom->atom = true;
        atom->ch = s[pos];
        ++pos;
        return atom;
    }
}

std::string toString(const std::shared_ptr<Node>& n) {
    if (n->atom) return std::string(1, n->ch);
    std::string r = "(";
    for (size_t i = 0; i < n->children.size(); ++i) {
        if (i) r += ",";
        r += toString(n->children[i]);
    }
    r += ")";
    return r;
}

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);
    std::string expr, ops;
    std::getline(std::cin, expr);
    std::getline(std::cin, ops);
    int pos = 0;
    auto node = parse(expr, pos);
    for (char c : ops) {
        if (c == 'H') {  // 表头：第一个元素（原子或子表）
            node = node->children[0];
        } else if (c == 'T') {  // 表尾：去掉表头后剩余元素组成的表
            auto tail = std::make_shared<Node>();
            tail->atom = false;
            if (node->children.size() > 1)
                tail->children.assign(node->children.begin() + 1, node->children.end());
            node = tail;
        }
    }
    std::cout << toString(node) << '\n';
    return 0;
}
