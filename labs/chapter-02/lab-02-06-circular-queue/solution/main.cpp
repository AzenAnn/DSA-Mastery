#include <cstddef>
#include <iostream>
#include <string>
#include <vector>

class CircularQueue {
public:
    explicit CircularQueue(std::size_t capacity) : data_(capacity + 1) {}

    bool enqueue(long long value) {
        if (full()) return false;
        data_[rear_] = value;
        rear_ = next(rear_);
        return true;
    }

    bool dequeue(long long& value) {
        if (empty()) return false;
        value = data_[front_];
        front_ = next(front_);
        return true;
    }

    bool front(long long& value) const {
        if (empty()) return false;
        value = data_[front_];
        return true;
    }

    bool rear(long long& value) const {
        if (empty()) return false;
        value = data_[(rear_ + data_.size() - 1) % data_.size()];
        return true;
    }

    bool empty() const { return front_ == rear_; }
    bool full() const { return next(rear_) == front_; }
    std::size_t size() const { return (rear_ + data_.size() - front_) % data_.size(); }

private:
    std::size_t next(std::size_t index) const { return (index + 1) % data_.size(); }

    std::vector<long long> data_;
    std::size_t front_ = 0;
    std::size_t rear_ = 0;
};

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    std::size_t capacity = 0;
    std::size_t q = 0;
    if (!(std::cin >> capacity >> q)) return 0;
    CircularQueue queue(capacity);

    for (std::size_t i = 0; i < q; ++i) {
        std::string command;
        std::cin >> command;
        if (command == "ENQUEUE") {
            long long value = 0;
            std::cin >> value;
            std::cout << (queue.enqueue(value) ? "TRUE" : "FALSE") << '\n';
        } else if (command == "DEQUEUE") {
            long long value = 0;
            if (queue.dequeue(value)) std::cout << value << '\n';
            else std::cout << "EMPTY\n";
        } else if (command == "FRONT") {
            long long value = 0;
            if (queue.front(value)) std::cout << value << '\n';
            else std::cout << "EMPTY\n";
        } else if (command == "REAR") {
            long long value = 0;
            if (queue.rear(value)) std::cout << value << '\n';
            else std::cout << "EMPTY\n";
        } else if (command == "SIZE") {
            std::cout << queue.size() << '\n';
        } else if (command == "EMPTY") {
            std::cout << (queue.empty() ? "TRUE" : "FALSE") << '\n';
        } else if (command == "FULL") {
            std::cout << (queue.full() ? "TRUE" : "FALSE") << '\n';
        }
    }
}
