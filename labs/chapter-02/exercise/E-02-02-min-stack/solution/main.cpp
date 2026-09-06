#include <algorithm>
#include <cstddef>
#include <iostream>
#include <string>
#include <vector>

class MinStack {
public:
    void push(long long value) {
        values_.push_back(value);
        minimums_.push_back(minimums_.empty() ? value : std::min(value, minimums_.back()));
    }

    bool pop(long long& value) {
        if (values_.empty()) return false;
        value = values_.back();
        values_.pop_back();
        minimums_.pop_back();
        return true;
    }

    bool top(long long& value) const {
        if (values_.empty()) return false;
        value = values_.back();
        return true;
    }

    bool minimum(long long& value) const {
        if (minimums_.empty()) return false;
        value = minimums_.back();
        return true;
    }

    bool empty() const { return values_.empty(); }
    std::size_t size() const { return values_.size(); }

private:
    std::vector<long long> values_;
    std::vector<long long> minimums_;
};

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    std::size_t q = 0;
    if (!(std::cin >> q)) return 0;
    MinStack stack;

    for (std::size_t i = 0; i < q; ++i) {
        std::string command;
        std::cin >> command;
        if (command == "PUSH") {
            long long value = 0;
            std::cin >> value;
            stack.push(value);
        } else if (command == "POP") {
            long long value = 0;
            if (stack.pop(value)) std::cout << value << '\n';
            else std::cout << "EMPTY\n";
        } else if (command == "TOP") {
            long long value = 0;
            if (stack.top(value)) std::cout << value << '\n';
            else std::cout << "EMPTY\n";
        } else if (command == "MIN") {
            long long value = 0;
            if (stack.minimum(value)) std::cout << value << '\n';
            else std::cout << "EMPTY\n";
        } else if (command == "SIZE") {
            std::cout << stack.size() << '\n';
        } else if (command == "EMPTY") {
            std::cout << (stack.empty() ? "YES" : "NO") << '\n';
        }
    }
}
