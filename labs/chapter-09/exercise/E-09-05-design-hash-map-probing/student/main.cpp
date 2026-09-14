#include <iostream>
#include <string>
#include <vector>

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    long long capacity = 0;
    long long n = 0;
    if (!(std::cin >> capacity >> n)) return 0;

    // 槽的三种状态：
    //   EMPTY     空槽——查找到此终止，可以落位；
    //   USED      占用——key/value 有效；
    //   TOMBSTONE 墓碑——已删除，查找要跳过它继续走，落位时可以复用。
    enum State { EMPTY, USED, TOMBSTONE };
    struct Slot {
        State state = EMPTY;
        long long key = 0;
        long long value = 0;
    };
    std::vector<Slot> table(static_cast<size_t>(capacity));
    (void)table;

    // TODO(1): put(k, v)——从 H = k % capacity 起线性探测 (H+i) % capacity；
    //   先跨过墓碑找同键的 USED 槽（命中则覆盖 value）；
    //   确认键不存在后，优先落回探测途中记录的首个墓碑槽，否则占用终止时的空槽。
    // TODO(2): get(k)——跨过墓碑继续探测；命中 USED 且 key 相等输出 value，遇到 EMPTY 输出 -1。
    // TODO(3): remove(k)——按 get 的方式定位，命中后把槽标记为 TOMBSTONE；
    //   千万不要把槽清回 EMPTY——那会截断探测链，使其后的同义词从此查不到。
    // 数据保证全程不同键个数 <= capacity-1，探测不会绕表一整圈仍找不到空槽。
    for (long long i = 0; i < n; ++i) {
        std::string op;
        std::cin >> op;
        if (op == "put") {
            long long k = 0, v = 0;
            std::cin >> k >> v;
            (void)k;
            (void)v;
        } else if (op == "get") {
            long long k = 0;
            std::cin >> k;
            (void)k;
            std::cout << -1 << '\n';  // 占位输出：完成 TODO 后替换为真实查找结果
        } else if (op == "remove") {
            long long k = 0;
            std::cin >> k;
            (void)k;
        }
    }
    return 0;
}
