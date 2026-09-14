// Lab 09-E-02 参考实现：除留余数法散列 + 线性探测（开放定址）判重，
// 按首次出现顺序收集每组去重后的序列。
#include <algorithm>
#include <iostream>
#include <vector>

namespace {

constexpr int kTableSize = 200003;  // 素数表长：单组不同值最多 1e5+1 个，装填因子 <= 0.5
constexpr int kEmpty = -1;          // 元素非负，用 -1 表示空槽，避免与键 0 混淆

struct HashTable {
    std::vector<int> slot;

    HashTable() : slot(kTableSize, kEmpty) {}

    void clear() { std::fill(slot.begin(), slot.end(), kEmpty); }

    // 散列函数：除留余数法 H(k) = k mod p。
    static int hashOf(int key) { return key % kTableSize; }

    // 线性探测查找；命中返回槽下标，否则返回 -1。
    int find(int key) const {
        int pos = hashOf(key);
        while (slot[pos] != kEmpty) {
            if (slot[pos] == key) return pos;
            pos = (pos + 1) % kTableSize;  // 冲突：探测下一个槽
        }
        return -1;
    }

    // 插入；key 已存在返回 false（判重的关键），新插入返回 true。
    bool insert(int key) {
        int pos = hashOf(key);
        while (slot[pos] != kEmpty) {
            if (slot[pos] == key) return false;
            pos = (pos + 1) % kTableSize;
        }
        slot[pos] = key;
        return true;
    }
};

}  // namespace

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    int t = 0;
    if (!(std::cin >> t)) return 0;

    HashTable table;
    while (t-- > 0) {
        int n = 0;
        std::cin >> n;
        table.clear();  // 多组数据之间必须复位

        std::vector<int> firstOccur;  // 首次出现的值按顺序收集
        firstOccur.reserve(static_cast<size_t>(n));
        for (int i = 0; i < n; ++i) {
            int a = 0;
            std::cin >> a;
            if (table.insert(a)) firstOccur.push_back(a);
        }

        for (size_t i = 0; i < firstOccur.size(); ++i) {
            if (i > 0) std::cout << ' ';
            std::cout << firstOccur[i];
        }
        std::cout << '\n';
    }
    return 0;
}
