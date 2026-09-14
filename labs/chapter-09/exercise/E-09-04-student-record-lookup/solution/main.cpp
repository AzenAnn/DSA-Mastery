// Lab 09-E-04 参考实现：以学号字符串为键的链地址法散列索引，期望 O(|id|) 查询。
#include <iomanip>
#include <iostream>
#include <string>
#include <vector>

namespace {

constexpr int kTableSize = 20011;  // 素数表长：n <= 1e4，装填因子 <= 0.5

struct Record {
    std::string id;
    std::string name;
    int a = 0, b = 0, c = 0;
};

// 学号字符串 -> 记录下标 的散列索引（链地址法，节点存进平行数组）。
struct Index {
    std::vector<int> head;        // 每条同义词链的头节点下标
    std::vector<std::string> key; // 节点上的学号原串（冲突时比较）
    std::vector<int> recordOf;    // 节点对应的记录下标
    std::vector<int> next;

    Index() : head(kTableSize, -1) {}

    // 散列函数：131 进制多项式滚动散列，再对素数表长取模。
    // 前导零作为字符参与运算，因此 012345 与 12345 不会混淆。
    static int hashOf(const std::string& s) {
        unsigned long long h = 0;
        for (unsigned char c : s) h = h * 131ULL + c;
        return static_cast<int>(h % kTableSize);
    }

    // 查找学号；命中返回记录下标，不存在返回 -1。
    int find(const std::string& s) const {
        for (int p = head[hashOf(s)]; p != -1; p = next[p]) {
            if (key[p] == s) return recordOf[p];
        }
        return -1;
    }

    // 学号互不相同，插入无需判重（头插法）。
    void insert(const std::string& s, int recordIdx) {
        int b = hashOf(s);
        key.push_back(s);
        recordOf.push_back(recordIdx);
        next.push_back(head[b]);
        head[b] = static_cast<int>(key.size()) - 1;
    }
};

}  // namespace

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    int n = 0;
    if (!(std::cin >> n)) return 0;
    std::vector<Record> records;
    records.reserve(static_cast<size_t>(n));
    Index index;
    for (int i = 0; i < n; ++i) {
        Record r;
        std::cin >> r.id >> r.name >> r.a >> r.b >> r.c;
        records.push_back(r);
        index.insert(r.id, i);
    }

    int m = 0;
    std::cin >> m;
    std::cout << std::fixed << std::setprecision(1);
    for (int i = 0; i < m; ++i) {
        std::string id;
        std::cin >> id;
        int p = index.find(id);
        if (p == -1) {
            std::cout << "No Answer!\n";
        } else {
            const Record& r = records[static_cast<size_t>(p)];
            std::cout << r.id << ' ' << r.name << ' '
                      << static_cast<double>(r.a) << ' '
                      << static_cast<double>(r.b) << ' '
                      << static_cast<double>(r.c) << '\n';
        }
    }
    return 0;
}
