// Lab 09-E-07 参考实现：131 进制多项式散列（unsigned long long 自然溢出）
// + 链地址法散列表，统计不同字符串个数。
#include <iostream>
#include <string>
#include <vector>

namespace {

constexpr int kTableSize = 131071;  // 素数表长：n <= 5e4，装填因子 <= 0.4

struct Node {
    unsigned long long h;  // 缓存的散列值：整数不等可直接排除
    std::string s;         // 原串：散列相同仍需比较，保证绝对正确
    int next;              // 同义词链：用下标代替指针
};

struct StringSet {
    std::vector<int> head;
    std::vector<Node> pool;

    StringSet() : head(kTableSize, -1) {}

    // 散列函数：131 进制多项式散列；unsigned long long 自然溢出
    // 等价于对 2^64 取模，串到整数的映射由乘数 131 与串内容决定。
    static unsigned long long hashOf(const std::string& s) {
        unsigned long long h = 0;
        for (unsigned char c : s) h = h * 131ULL + c;
        return h;
    }

    // 插入；s 已存在返回 false，新出现返回 true。
    bool insert(const std::string& s) {
        unsigned long long h = hashOf(s);
        int b = static_cast<int>(h % kTableSize);  // 2^64 的值域压缩进素数表长
        for (int p = head[b]; p != -1; p = pool[p].next) {
            if (pool[p].h == h && pool[p].s == s) return false;  // 同义词：先比 h 再比原串
        }
        pool.push_back(Node{h, s, head[b]});
        head[b] = static_cast<int>(pool.size()) - 1;
        return true;
    }
};

}  // namespace

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    int n = 0;
    if (!(std::cin >> n)) return 0;
    StringSet seen;
    seen.pool.reserve(static_cast<size_t>(n));
    int distinct = 0;
    for (int i = 0; i < n; ++i) {
        std::string s;
        std::cin >> s;
        if (seen.insert(s)) ++distinct;
    }
    std::cout << distinct << '\n';
    return 0;
}
