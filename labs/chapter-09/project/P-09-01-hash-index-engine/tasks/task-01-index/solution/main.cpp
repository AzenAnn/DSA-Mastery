#include <iomanip>
#include <iostream>
#include <string>
#include <vector>

namespace {

const int EMPTY = -1;
const int TOMBSTONE = -2;

struct Index {
    virtual ~Index() = default;
    virtual void put(int key, int value) = 0;
    virtual int get(int key) const = 0;        // 未命中返回 0
    virtual bool erase(int key) = 0;
    virtual bool contains(int key) const = 0;
    virtual int probes(int key) const = 0;
    virtual int size() const = 0;
};

struct Chaining : Index {
    explicit Chaining(int m) : chains(static_cast<std::size_t>(m)) {}

    void put(int key, int value) override {
        auto& chain = chains[home(key)];
        for (auto& entry : chain) {
            if (entry.first == key) { entry.second = value; return; }
        }
        chain.emplace_back(key, value);
    }
    int get(int key) const override {
        for (const auto& entry : chains[home(key)]) if (entry.first == key) return entry.second;
        return 0;
    }
    bool erase(int key) override {
        auto& chain = chains[home(key)];
        for (std::size_t i = 0; i < chain.size(); ++i) {
            if (chain[i].first == key) { chain.erase(chain.begin() + static_cast<long>(i)); return true; }
        }
        return false;
    }
    bool contains(int key) const override {
        for (const auto& entry : chains[home(key)]) if (entry.first == key) return true;
        return false;
    }
    int probes(int key) const override {
        const auto& chain = chains[home(key)];
        int examined = 0;
        for (const auto& entry : chain) { examined += 1; if (entry.first == key) return examined; }
        return examined;
    }
    int size() const override {
        int total = 0;
        for (const auto& chain : chains) total += static_cast<int>(chain.size());
        return total;
    }

private:
    std::size_t home(int key) const { return static_cast<std::size_t>(key) % chains.size(); }
    std::vector<std::vector<std::pair<int, int>>> chains;
};

struct OpenAddressing : Index {
    OpenAddressing(int m, bool quadratic) : slots(static_cast<std::size_t>(m), EMPTY), values(static_cast<std::size_t>(m), 0), quadratic(quadratic) {}

    void put(int key, int value) override {
        const std::size_t m = slots.size();
        for (std::size_t step = 0; step < m; ++step) {
            const std::size_t index = slot(key, step);
            if (slots[index] == key) { values[index] = value; return; }
            if (slots[index] == EMPTY || slots[index] == TOMBSTONE) { slots[index] = key; values[index] = value; return; }
        }
    }
    int get(int key) const override {
        for (std::size_t step = 0; step < slots.size(); ++step) {
            const std::size_t index = slot(key, step);
            if (slots[index] == EMPTY) return 0;
            if (slots[index] == key) return values[index];
        }
        return 0;
    }
    bool erase(int key) override {
        for (std::size_t step = 0; step < slots.size(); ++step) {
            const std::size_t index = slot(key, step);
            if (slots[index] == EMPTY) return false;
            if (slots[index] == key) { slots[index] = TOMBSTONE; return true; }
        }
        return false;
    }
    bool contains(int key) const override {
        for (std::size_t step = 0; step < slots.size(); ++step) {
            const std::size_t index = slot(key, step);
            if (slots[index] == EMPTY) return false;
            if (slots[index] == key) return true;
        }
        return false;
    }
    int probes(int key) const override {
        for (std::size_t step = 0; step < slots.size(); ++step) {
            const std::size_t index = slot(key, step);
            if (slots[index] == EMPTY || slots[index] == key) return static_cast<int>(step) + 1;
        }
        return static_cast<int>(slots.size());
    }
    int size() const override {
        int total = 0;
        for (const int slot : slots) if (slot >= 0) total += 1;
        return total;
    }

private:
    std::size_t slot(int key, std::size_t step) const {
        const std::size_t m = slots.size();
        const std::size_t home = static_cast<std::size_t>(key) % m;
        return quadratic ? (home + step * step) % m : (home + step) % m;
    }
    std::vector<int> slots;
    std::vector<int> values;
    bool quadratic;
};

}  // namespace

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    std::string mode;
    int table_size = 0;
    if (!(std::cin >> mode >> table_size) || table_size <= 0) return 0;

    Index* index = nullptr;
    if (mode == "chaining") {
        static Chaining chaining(table_size);
        index = &chaining;
    } else if (mode == "linear") {
        static OpenAddressing linear(table_size, false);
        index = &linear;
    } else if (mode == "quadratic") {
        static OpenAddressing quadratic(table_size, true);
        index = &quadratic;
    } else {
        return 0;
    }

    std::string op;
    int key;
    int value;
    while (std::cin >> op) {
        if (op == "put") {
            std::cin >> key >> value;
            index->put(key, value);
        } else if (op == "get") {
            std::cin >> key;
            const int found = index->get(key);
            if (found != 0) std::cout << found << '\n';
            else std::cout << "null\n";
        } else if (op == "erase") {
            std::cin >> key;
            std::cout << (index->erase(key) ? 1 : 0) << '\n';
        } else if (op == "contains") {
            std::cin >> key;
            std::cout << (index->contains(key) ? 1 : 0) << '\n';
        } else if (op == "probes") {
            std::cin >> key;
            std::cout << index->probes(key) << '\n';
        } else if (op == "size") {
            std::cout << index->size() << '\n';
        } else if (op == "loadfactor") {
            std::cout << std::fixed << std::setprecision(2)
                      << static_cast<double>(index->size()) / static_cast<double>(table_size) << '\n';
        }
    }
    return 0;
}
