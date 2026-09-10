#include "hash_index.hpp"

#include <iostream>
#include <memory>
#include <string>

namespace {

int chaining() {
    auto index = hashindex::make_chaining(7);
    index->put(1, 100);
    index->put(8, 800);
    index->put(15, 1500);
    index->put(22, 2200);
    index->put(3, 300);
    index->put(10, 1000);
    if (!index->verify()) {
        std::cerr << "chaining verify failed\n";
        return 1;
    }
    if (index->size() != 6) return 1;
    if (index->get(15) != std::optional<int>(1500)) return 1;
    if (index->get(9).has_value()) return 1;
    if (!index->erase(8) || index->contains(8)) return 1;
    if (index->erase(8)) return 1;  // 已删除，再次删除应失败
    // 覆盖写。
    index->put(1, 999);
    if (index->get(1) != std::optional<int>(999)) return 1;
    if (index->size() != 5) return 1;
    return index->verify() ? 0 : 1;
}

int open_addressing() {
    for (const auto strategy : {hashindex::ProbeStrategy::Linear, hashindex::ProbeStrategy::Quadratic}) {
        auto index = hashindex::make_open_addressing(7, strategy);
        index->put(1, 10);
        index->put(8, 20);
        index->put(15, 30);
        if (!index->verify()) {
            std::cerr << "open addressing verify failed\n";
            return 1;
        }
        if (index->size() != 3) return 1;
        if (index->get(15) != std::optional<int>(30)) return 1;
        if (index->get(22).has_value()) return 1;

        // 删除中间的键，墓碑不阻断其后键的查找。
        if (!index->erase(8)) return 1;
        if (index->contains(8)) return 1;
        if (index->get(15) != std::optional<int>(30)) return 1;
        if (!index->verify()) return 1;
        if (index->erase(8)) return 1;  // 已删除，再次删除应失败
    }
    return 0;
}

int probe_counts() {
    // 链地址：probe 返回链内位置或链长。
    auto chaining = hashindex::make_chaining(7);
    chaining->put(1, 1);
    chaining->put(8, 8);
    chaining->put(15, 15);
    if (chaining->probes(1) != 1) return 1;
    if (chaining->probes(15) != 3) return 1;
    if (chaining->probes(3) != 0) return 1;  // 3 % 7 = 3，空链

    // 线性探测：聚集使探测次数随位置后移递增。
    auto linear = hashindex::make_open_addressing(7, hashindex::ProbeStrategy::Linear);
    linear->put(1, 1);
    linear->put(8, 8);
    linear->put(15, 15);
    if (linear->probes(15) != 3) return 1;   // 检查 1、2、3 三个槽
    if (linear->probes(22) != 4) return 1;   // 从 1 查到空槽 4
    if (linear->probes(4) != 1) return 1;    // 4 % 7 = 4，从未使用的空槽
    return 0;
}

}  // namespace

int main(int argc, char** argv) {
    if (argc != 2) return 2;
    const std::string test = argv[1];
    if (test == "chaining") return chaining();
    if (test == "open-addressing") return open_addressing();
    if (test == "probe-counts") return probe_counts();
    std::cerr << "unknown test\n";
    return 2;
}
