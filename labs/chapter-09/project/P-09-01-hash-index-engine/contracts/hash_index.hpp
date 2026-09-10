#pragma once

#include <cstddef>
#include <memory>
#include <optional>

namespace hashindex {

// 散列索引统一接口。散列函数固定为 h(key) = key mod table_size，键为非负整数。
class HashIndex {
public:
    virtual ~HashIndex() = default;

    virtual void put(int key, int value) = 0;        // 重复键覆盖值
    virtual std::optional<int> get(int key) const = 0;  // 命中返回值，未命中返回 nullopt
    virtual bool erase(int key) = 0;                 // 删除成功返回 true，未找到返回 false
    virtual bool contains(int key) const = 0;        // 命中返回 true
    virtual std::size_t size() const = 0;            // 现存键数
    virtual int probes(int key) const = 0;           // 查找 key 的比较/探测次数（见 README）
    virtual bool verify() const = 0;                 // 全部不变量成立返回 true
};

enum class ProbeStrategy { Linear, Quadratic };

// 链地址法：每个槽一条链，同义词入同一链。
std::unique_ptr<HashIndex> make_chaining(int table_size);

// 开放定址法：linear 用 (h + i) mod m，quadratic 用 (h + i*i) mod m。
// 删除写墓碑标记，查找遇墓碑继续、遇从未使用的空槽停止。
std::unique_ptr<HashIndex> make_open_addressing(int table_size, ProbeStrategy strategy);

}  // namespace hashindex
