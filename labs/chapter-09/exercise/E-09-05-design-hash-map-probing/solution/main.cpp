// Lab 09-E-05 参考实现：开放定址 + 线性探测 + 墓碑删除的手写哈希映射。
// 口径：H(k) = k % C，探测序列 H, H+1, ...（对 C 取模）；
// 查找跨过墓碑继续，落位优先复用墓碑；删除标记墓碑而非清空。
#include <iostream>
#include <string>
#include <vector>

namespace {

enum class State { kEmpty, kUsed, kTombstone };

struct Slot {
    State state = State::kEmpty;
    long long key = 0;
    long long value = 0;
};

class ProbingHashMap {
public:
    explicit ProbingHashMap(long long capacity) : slots_(static_cast<size_t>(capacity)) {}

    void put(long long key, long long value) {
        const size_t capacity = slots_.size();
        const size_t home = homeOf(key, capacity);
        size_t reuse = capacity;    // 探测途中记录的首个墓碑槽
        size_t emptyIdx = capacity; // 扫描终止时的空槽
        for (size_t step = 0; step < capacity; ++step) {
            const size_t idx = (home + step) % capacity;
            Slot& slot = slots_[idx];
            if (slot.state == State::kUsed) {
                if (slot.key == key) {
                    slot.value = value;  // 键已存在：原地覆盖，不新增槽
                    return;
                }
            } else if (slot.state == State::kTombstone) {
                if (reuse == capacity) reuse = idx;  // 先记下，但必须继续找同键槽
            } else {
                emptyIdx = idx;  // 遇到 EMPTY：探测链终止，键确定不存在
                break;
            }
        }
        if (reuse == capacity && emptyIdx == capacity) return;  // 数据约定下不可达，防御性返回
        // 落位：优先复用墓碑（保持探测链完整），否则占用空槽。
        Slot& target = slots_[reuse != capacity ? reuse : emptyIdx];
        target.state = State::kUsed;
        target.key = key;
        target.value = value;
    }

    long long get(long long key) const {
        const size_t capacity = slots_.size();
        const size_t home = homeOf(key, capacity);
        for (size_t step = 0; step < capacity; ++step) {
            const Slot& slot = slots_[(home + step) % capacity];
            if (slot.state == State::kUsed) {
                if (slot.key == key) return slot.value;
            } else if (slot.state == State::kEmpty) {
                break;  // 空槽截断探测链；墓碑则必须跳过继续找
            }
        }
        return -1;
    }

    void remove(long long key) {
        const size_t capacity = slots_.size();
        const size_t home = homeOf(key, capacity);
        for (size_t step = 0; step < capacity; ++step) {
            Slot& slot = slots_[(home + step) % capacity];
            if (slot.state == State::kUsed) {
                if (slot.key == key) {
                    slot.state = State::kTombstone;  // 墓碑而非清空：保住其后的探测链
                    return;
                }
            } else if (slot.state == State::kEmpty) {
                return;  // 键不存在，无效果
            }
        }
    }

private:
    static size_t homeOf(long long key, size_t capacity) {
        return static_cast<size_t>(key % static_cast<long long>(capacity));
    }

    std::vector<Slot> slots_;
};

}  // namespace

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    long long capacity = 0;
    long long n = 0;
    if (!(std::cin >> capacity >> n)) return 0;

    ProbingHashMap map(capacity);
    for (long long i = 0; i < n; ++i) {
        std::string op;
        std::cin >> op;
        if (op == "put") {
            long long k = 0, v = 0;
            std::cin >> k >> v;
            map.put(k, v);
        } else if (op == "get") {
            long long k = 0;
            std::cin >> k;
            std::cout << map.get(k) << '\n';
        } else if (op == "remove") {
            long long k = 0;
            std::cin >> k;
            map.remove(k);
        }
    }
    return 0;
}
