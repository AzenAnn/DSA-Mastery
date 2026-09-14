// Lab 09-E-03 参考实现：链地址法散列表维护名单，节点上挂“是否已点名”标记。
#include <iostream>
#include <string>
#include <vector>

namespace {

constexpr int kTableSize = 20011;  // 素数表长：n <= 1e4，装填因子 <= 0.5

struct Node {
    std::string name;
    bool called = false;  // 状态标记：true 表示已经点过一次
    int next = -1;        // 同义词链：用下标代替指针
};

struct RollBook {
    std::vector<int> head;
    std::vector<Node> pool;

    RollBook() : head(kTableSize, -1) {}

    // 散列函数：131 进制多项式滚动散列，再对素数表长取模。
    static int hashOf(const std::string& s) {
        unsigned long long h = 0;
        for (unsigned char c : s) h = h * 131ULL + c;
        return static_cast<int>(h % kTableSize);
    }

    // 在同义词链上查找名字；返回节点下标，不存在返回 -1。
    int find(const std::string& s) const {
        for (int p = head[hashOf(s)]; p != -1; p = pool[p].next) {
            if (pool[p].name == s) return p;
        }
        return -1;
    }

    // 名单内的名字互不相同，插入无需判重（头插法）。
    void insert(const std::string& s) {
        int b = hashOf(s);
        pool.push_back(Node{s, false, head[b]});
        head[b] = static_cast<int>(pool.size()) - 1;
    }
};

}  // namespace

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    int n = 0;
    if (!(std::cin >> n)) return 0;
    RollBook book;
    book.pool.reserve(static_cast<size_t>(n));
    for (int i = 0; i < n; ++i) {
        std::string name;
        std::cin >> name;
        book.insert(name);
    }

    int m = 0;
    std::cin >> m;
    for (int i = 0; i < m; ++i) {
        std::string name;
        std::cin >> name;
        int p = book.find(name);
        if (p == -1) {
            std::cout << "WRONG\n";      // 不在名单
        } else if (book.pool[p].called) {
            std::cout << "REPEAT\n";     // 在名单且已点过
        } else {
            book.pool[p].called = true;  // 在名单且首次点到
            std::cout << "OK\n";
        }
    }
    return 0;
}
