#include <cstddef>
#include <iostream>
#include <string>
#include <vector>

class StackQueue {
public:
    void enqueue(long long value) { input_.push_back(value); }

    bool dequeue(long long& value) {
        move_if_needed();
        if (output_.empty()) return false;
        value = output_.back();
        output_.pop_back();
        return true;
    }

    bool front(long long& value) {
        move_if_needed();
        if (output_.empty()) return false;
        value = output_.back();
        return true;
    }

    bool empty() const { return input_.empty() && output_.empty(); }
    std::size_t size() const { return input_.size() + output_.size(); }

private:
    void move_if_needed() {
        if (!output_.empty()) return;
        while (!input_.empty()) {
            output_.push_back(input_.back());
            input_.pop_back();
        }
    }

    std::vector<long long> input_;
    std::vector<long long> output_;
};

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    std::size_t q = 0;
    if (!(std::cin >> q)) return 0;
    StackQueue queue;

    for (std::size_t i = 0; i < q; ++i) {
        std::string command;
        std::cin >> command;
        if (command == "ENQUEUE") {
            long long value = 0;
            std::cin >> value;
            queue.enqueue(value);
        } else if (command == "DEQUEUE") {
            long long value = 0;
            if (queue.dequeue(value)) std::cout << value << '\n';
            else std::cout << "EMPTY\n";
        } else if (command == "FRONT") {
            long long value = 0;
            if (queue.front(value)) std::cout << value << '\n';
            else std::cout << "EMPTY\n";
        } else if (command == "SIZE") {
            std::cout << queue.size() << '\n';
        } else if (command == "EMPTY") {
            std::cout << (queue.empty() ? "YES" : "NO") << '\n';
        }
    }
}
