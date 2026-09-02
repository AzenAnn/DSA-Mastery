#include "hash_index.hpp"

#include <cstddef>
#include <memory>
#include <optional>
#include <utility>
#include <vector>

namespace hashindex {
namespace {

const int EMPTY = -1;
const int TOMBSTONE = -2;

class ChainingIndex final : public HashIndex {
public:
    explicit ChainingIndex(int table_size) : chains_(static_cast<std::size_t>(table_size)) {}

    void put(int key, int value) override {
        auto& chain = chains_[home(key)];
        for (auto& entry : chain) {
            if (entry.first == key) {
                entry.second = value;
                return;
            }
        }
        chain.emplace_back(key, value);
    }

    std::optional<int> get(int key) const override {
        for (const auto& entry : chains_[home(key)]) {
            if (entry.first == key) return entry.second;
        }
        return std::nullopt;
    }

    bool erase(int key) override {
        auto& chain = chains_[home(key)];
        for (std::size_t i = 0; i < chain.size(); ++i) {
            if (chain[i].first == key) {
                chain.erase(chain.begin() + static_cast<long>(i));
                return true;
            }
        }
        return false;
    }

    bool contains(int key) const override {
        for (const auto& entry : chains_[home(key)]) {
            if (entry.first == key) return true;
        }
        return false;
    }

    std::size_t size() const override {
        std::size_t total = 0;
        for (const auto& chain : chains_) total += chain.size();
        return total;
    }

    int probes(int key) const override {
        const auto& chain = chains_[home(key)];
        int examined = 0;
        for (const auto& entry : chain) {
            examined += 1;
            if (entry.first == key) return examined;
        }
        return examined;
    }

    bool verify() const override {
        for (const auto& chain : chains_) {
            for (std::size_t i = 0; i < chain.size(); ++i) {
                if (chain[i].first < 0) return false;
                if (chain[i].first % static_cast<int>(chains_.size()) != static_cast<int>(home(chain[i].first))) return false;
                for (std::size_t j = i + 1; j < chain.size(); ++j) {
                    if (chain[i].first == chain[j].first) return false;
                }
            }
        }
        return true;
    }

private:
    std::size_t home(int key) const { return static_cast<std::size_t>(key) % chains_.size(); }
    std::vector<std::vector<std::pair<int, int>>> chains_;
};

class OpenAddressIndex final : public HashIndex {
public:
    OpenAddressIndex(int table_size, ProbeStrategy strategy)
        : slots_(static_cast<std::size_t>(table_size), EMPTY),
          values_(static_cast<std::size_t>(table_size), 0),
          strategy_(strategy) {}

    void put(int key, int value) override {
        const std::size_t m = slots_.size();
        std::size_t target = m;
        for (std::size_t step = 0; step < m; ++step) {
            const std::size_t index = slot(key, step);
            if (slots_[index] == key) { values_[index] = value; return; }
            if (slots_[index] == EMPTY) { slots_[index] = key; values_[index] = value; return; }
            if (slots_[index] == TOMBSTONE && target == m) target = index;
        }
        if (target != m) { slots_[target] = key; values_[target] = value; }
    }

    std::optional<int> get(int key) const override {
        for (std::size_t step = 0; step < slots_.size(); ++step) {
            const std::size_t index = slot(key, step);
            if (slots_[index] == EMPTY) return std::nullopt;
            if (slots_[index] == key) return values_[index];
        }
        return std::nullopt;
    }

    bool erase(int key) override {
        for (std::size_t step = 0; step < slots_.size(); ++step) {
            const std::size_t index = slot(key, step);
            if (slots_[index] == EMPTY) return false;
            if (slots_[index] == key) { slots_[index] = TOMBSTONE; return true; }
        }
        return false;
    }

    bool contains(int key) const override { return get(key).has_value(); }

    std::size_t size() const override {
        std::size_t total = 0;
        for (const int slot : slots_) {
            if (slot >= 0) total += 1;
        }
        return total;
    }

    int probes(int key) const override {
        for (std::size_t step = 0; step < slots_.size(); ++step) {
            const std::size_t index = slot(key, step);
            if (slots_[index] == EMPTY || slots_[index] == key) return static_cast<int>(step) + 1;
        }
        return static_cast<int>(slots_.size());
    }

    bool verify() const override {
        for (std::size_t i = 0; i < slots_.size(); ++i) {
            if (slots_[i] >= 0 && get(slots_[i]) != values_[i]) return false;
        }
        return true;
    }

private:
    std::size_t slot(int key, std::size_t step) const {
        const std::size_t m = slots_.size();
        const std::size_t home = static_cast<std::size_t>(key) % m;
        if (strategy_ == ProbeStrategy::Linear) return (home + step) % m;
        return (home + step * step) % m;
    }

    std::vector<int> slots_;
    std::vector<int> values_;
    ProbeStrategy strategy_;
};

}  // namespace

std::unique_ptr<HashIndex> make_chaining(int table_size) {
    return std::make_unique<ChainingIndex>(table_size);
}

std::unique_ptr<HashIndex> make_open_addressing(int table_size, ProbeStrategy strategy) {
    return std::make_unique<OpenAddressIndex>(table_size, strategy);
}

}  // namespace hashindex
