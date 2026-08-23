#include <cstddef>
#include <iostream>
#include <string>
#include <vector>

class CircularDeque {
public:
    explicit CircularDeque(std::size_t capacity) : data_(capacity + 1) {}

    bool insert_front(long long value) {
        if (full()) return false;
        front_ = previous(front_);
        data_[front_] = value;
        return true;
    }

    bool insert_last(long long value) {
        if (full()) return false;
        data_[rear_] = value;
        rear_ = next(rear_);
        return true;
    }

    bool delete_front(long long& value) {
        if (empty()) return false;
        value = data_[front_];
        front_ = next(front_);
        return true;
    }

    bool delete_last(long long& value) {
        if (empty()) return false;
        rear_ = previous(rear_);
        value = data_[rear_];
        return true;
    }

    bool front(long long& value) const {
        if (empty()) return false;
        value = data_[front_];
        return true;
    }

    bool rear(long long& value) const {
        if (empty()) return false;
        value = data_[previous(rear_)];
        return true;
    }

    bool empty() const { return front_ == rear_; }
    bool full() const { return next(rear_) == front_; }
    std::size_t size() const { return (rear_ + data_.size() - front_) % data_.size(); }

private:
    std::size_t next(std::size_t index) const { return (index + 1) % data_.size(); }
    std::size_t previous(std::size_t index) const { return (index + data_.size() - 1) % data_.size(); }

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
    CircularDeque deque(capacity);

    for (std::size_t i = 0; i < q; ++i) {
        std::string command;
        std::cin >> command;
        if (command == "INSERT_FRONT") {
            long long value = 0;
            std::cin >> value;
            std::cout << (deque.insert_front(value) ? "TRUE" : "FALSE") << '\n';
        } else if (command == "INSERT_LAST") {
            long long value = 0;
            std::cin >> value;
            std::cout << (deque.insert_last(value) ? "TRUE" : "FALSE") << '\n';
        } else if (command == "DELETE_FRONT") {
            long long value = 0;
            if (deque.delete_front(value)) std::cout << value << '\n';
            else std::cout << "EMPTY\n";
        } else if (command == "DELETE_LAST") {
            long long value = 0;
            if (deque.delete_last(value)) std::cout << value << '\n';
            else std::cout << "EMPTY\n";
        } else if (command == "FRONT") {
            long long value = 0;
            if (deque.front(value)) std::cout << value << '\n';
            else std::cout << "EMPTY\n";
        } else if (command == "REAR") {
            long long value = 0;
            if (deque.rear(value)) std::cout << value << '\n';
            else std::cout << "EMPTY\n";
        } else if (command == "SIZE") {
            std::cout << deque.size() << '\n';
        } else if (command == "EMPTY") {
            std::cout << (deque.empty() ? "TRUE" : "FALSE") << '\n';
        } else if (command == "FULL") {
            std::cout << (deque.full() ? "TRUE" : "FALSE") << '\n';
        }
    }
}
