// Lab 09-E-06 参考实现：链地址法（单链表 + 头插）手写哈希集合。
// 口径：B 个桶，H(x) = x % B；add 先查重再头插；remove 带前驱指针摘链。
#include <iostream>
#include <string>
#include <vector>

namespace {

struct Node {
    long long key = 0;
    Node* next = nullptr;
};

class ChainingHashSet {
public:
    explicit ChainingHashSet(long long bucketCount)
        : buckets_(static_cast<size_t>(bucketCount), nullptr) {}

    ~ChainingHashSet() {
        for (Node* head : buckets_) {
            while (head != nullptr) {
                Node* dying = head;
                head = head->next;
                delete dying;
            }
        }
    }

    ChainingHashSet(const ChainingHashSet&) = delete;
    ChainingHashSet& operator=(const ChainingHashSet&) = delete;

    bool contains(long long key) const {
        Node* cur = buckets_[home(key)];
        while (cur != nullptr) {
            if (cur->key == key) return true;
            cur = cur->next;
        }
        return false;
    }

    void add(long long key) {
        if (contains(key)) return;  // 集合语义：已存在则无效果
        Node* node = new Node{key, buckets_[home(key)]};  // 头插
        buckets_[home(key)] = node;
    }

    void remove(long long key) {
        Node* cur = buckets_[home(key)];
        Node* prev = nullptr;
        while (cur != nullptr) {
            if (cur->key == key) {
                if (prev == nullptr) buckets_[home(key)] = cur->next;  // 删头节点：更新桶头指针
                else prev->next = cur->next;                           // 删中间/尾节点
                delete cur;
                return;
            }
            prev = cur;
            cur = cur->next;
        }
        // 未命中：无效果
    }

private:
    size_t home(long long key) const {
        return static_cast<size_t>(key % static_cast<long long>(buckets_.size()));
    }

    std::vector<Node*> buckets_;
};

}  // namespace

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    long long bucketCount = 0;
    long long n = 0;
    if (!(std::cin >> bucketCount >> n)) return 0;

    ChainingHashSet set(bucketCount);
    for (long long i = 0; i < n; ++i) {
        std::string op;
        std::cin >> op;
        long long x = 0;
        std::cin >> x;
        if (op == "add") {
            set.add(x);
        } else if (op == "contains") {
            std::cout << (set.contains(x) ? 1 : 0) << '\n';
        } else if (op == "remove") {
            set.remove(x);
        }
    }
    return 0;
}
