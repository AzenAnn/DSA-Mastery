#include <iostream>
#include <string>
#include <vector>

namespace {

const int EMPTY = -1;
const int TOMBSTONE = -2;

struct ChainingTable {
    explicit ChainingTable(int m) : chains(m) {}

    bool insert(int key) {
        auto& chain = chains[key % static_cast<int>(chains.size())];
        for (int value : chain) {
            if (value == key) return false;
        }
        chain.push_back(key);
        return true;
    }

    bool find(int key) const {
        const auto& chain = chains[key % static_cast<int>(chains.size())];
        for (int value : chain) {
            if (value == key) return true;
        }
        return false;
    }

    bool remove(int key) {
        auto& chain = chains[key % static_cast<int>(chains.size())];
        for (std::size_t i = 0; i < chain.size(); ++i) {
            if (chain[i] == key) {
                chain.erase(chain.begin() + static_cast<long>(i));
                return true;
            }
        }
        return false;
    }

    int probes(int key) const {
        const auto& chain = chains[key % static_cast<int>(chains.size())];
        int examined = 0;
        for (int value : chain) {
            examined += 1;
            if (value == key) return examined;
        }
        return examined;
    }

    void dump() const {
        for (std::size_t i = 0; i < chains.size(); ++i) {
            std::cout << "slot " << i << " =";
            for (int value : chains[i]) std::cout << ' ' << value;
            std::cout << '\n';
        }
    }

    std::vector<std::vector<int>> chains;
};

struct ProbingTable {
    explicit ProbingTable(int m) : slots(static_cast<std::size_t>(m), EMPTY) {}

    bool insert(int key) {
        const std::size_t m = slots.size();
        const std::size_t home = static_cast<std::size_t>(key) % m;
        std::size_t target = m;
        for (std::size_t step = 0; step < m; ++step) {
            const std::size_t index = (home + step) % m;
            if (slots[index] == key) return false;
            if (slots[index] == EMPTY || slots[index] == TOMBSTONE) {
                if (target == m) target = index;
                if (slots[index] == EMPTY) break;
            }
        }
        if (target == m) return false;
        slots[target] = key;
        return true;
    }

    bool find(int key) const {
        const std::size_t m = slots.size();
        const std::size_t home = static_cast<std::size_t>(key) % m;
        for (std::size_t step = 0; step < m; ++step) {
            const int slot = slots[(home + step) % m];
            if (slot == EMPTY) return false;
            if (slot == key) return true;
        }
        return false;
    }

    bool remove(int key) {
        const std::size_t m = slots.size();
        const std::size_t home = static_cast<std::size_t>(key) % m;
        for (std::size_t step = 0; step < m; ++step) {
            const std::size_t index = (home + step) % m;
            if (slots[index] == EMPTY) return false;
            if (slots[index] == key) {
                slots[index] = TOMBSTONE;
                return true;
            }
        }
        return false;
    }

    int probes(int key) const {
        const std::size_t m = slots.size();
        const std::size_t home = static_cast<std::size_t>(key) % m;
        for (std::size_t step = 0; step < m; ++step) {
            const int slot = slots[(home + step) % m];
            if (slot == EMPTY) return static_cast<int>(step) + 1;
            if (slot == key) return static_cast<int>(step) + 1;
        }
        return static_cast<int>(m);
    }

    void dump() const {
        for (std::size_t i = 0; i < slots.size(); ++i) {
            std::cout << "slot " << i << " = ";
            if (slots[i] == EMPTY) std::cout << "empty";
            else if (slots[i] == TOMBSTONE) std::cout << "tombstone";
            else std::cout << slots[i];
            std::cout << '\n';
        }
    }

    std::vector<int> slots;
};

}  // namespace

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    std::string mode;
    int m = 0;
    if (!(std::cin >> mode >> m) || m <= 0) return 0;

    if (mode == "chaining") {
        ChainingTable table(m);
        std::string op;
        int key;
        while (std::cin >> op) {
            if (op == "insert") {
                std::cin >> key;
                table.insert(key);
            } else if (op == "find") {
                std::cin >> key;
                std::cout << (table.find(key) ? 1 : 0) << '\n';
            } else if (op == "delete") {
                std::cin >> key;
                std::cout << (table.remove(key) ? 1 : 0) << '\n';
            } else if (op == "probe") {
                std::cin >> key;
                std::cout << table.probes(key) << '\n';
            } else if (op == "dump") {
                table.dump();
            }
        }
    } else if (mode == "probing") {
        ProbingTable table(m);
        std::string op;
        int key;
        while (std::cin >> op) {
            if (op == "insert") {
                std::cin >> key;
                table.insert(key);
            } else if (op == "find") {
                std::cin >> key;
                std::cout << (table.find(key) ? 1 : 0) << '\n';
            } else if (op == "delete") {
                std::cin >> key;
                std::cout << (table.remove(key) ? 1 : 0) << '\n';
            } else if (op == "probe") {
                std::cin >> key;
                std::cout << table.probes(key) << '\n';
            } else if (op == "dump") {
                table.dump();
            }
        }
    }
    return 0;
}
