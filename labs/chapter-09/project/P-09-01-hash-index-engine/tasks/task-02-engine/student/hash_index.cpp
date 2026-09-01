#include "hash_index.hpp"

#include <cstddef>
#include <memory>
#include <optional>

namespace hashindex {

std::unique_ptr<HashIndex> make_chaining(int) {
    // TODO: 返回链地址法实现。
    return nullptr;
}

std::unique_ptr<HashIndex> make_open_addressing(int, ProbeStrategy) {
    // TODO: 返回线性 / 平方探测实现。
    return nullptr;
}

}  // namespace hashindex
