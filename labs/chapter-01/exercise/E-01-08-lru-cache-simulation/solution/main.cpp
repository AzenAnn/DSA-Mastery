#include <cstddef>
#include <iostream>
#include <vector>

struct Node {
    int key{};
    int value{};
    Node* prev = nullptr;
    Node* next = nullptr;
};

struct DoublyLinkedList {
    Node head_;   // sentinel head (most recent)
    Node tail_;   // sentinel tail (least recent)
    std::size_t size_ = 0;

    DoublyLinkedList() {
        head_.next = &tail_;
        tail_.prev = &head_;
    }

    void push_front(Node* node) {
        node->next = head_.next;
        node->prev = &head_;
        head_.next->prev = node;
        head_.next = node;
        ++size_;
    }

    void erase(Node* node) {
        node->prev->next = node->next;
        node->next->prev = node->prev;
        --size_;
    }

    void move_to_front(Node* node) {
        erase(node);
        push_front(node);
    }

    Node* pop_back() {
        Node* node = tail_.prev;
        erase(node);
        return node;
    }

    bool empty() const { return size_ == 0; }
};

int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);

    std::size_t capacity = 0, n = 0;
    std::cin >> capacity >> n;

    // Simple hash table: direct addressing since key range is known (0 ~ 100000)
    constexpr int MAX_KEY = 100000;
    std::vector<Node*> hash_table(MAX_KEY + 1, nullptr);

    DoublyLinkedList list;
    std::vector<int> outputs;

    for (std::size_t i = 0; i < n; ++i) {
        int cmd = 0;
        std::cin >> cmd;
        if (cmd == 1) {
            int key = 0;
            std::cin >> key;
            Node* node = hash_table[key];
            if (node == nullptr) {
                outputs.push_back(-1);
            } else {
                list.move_to_front(node);
                outputs.push_back(node->value);
            }
        } else if (cmd == 2) {
            int key = 0, value = 0;
            std::cin >> key >> value;
            Node* node = hash_table[key];
            if (node != nullptr) {
                node->value = value;
                list.move_to_front(node);
            } else {
                if (list.size_ == capacity) {
                    Node* lru = list.pop_back();
                    hash_table[lru->key] = nullptr;
                    delete lru;
                }
                Node* new_node = new Node{key, value, nullptr, nullptr};
                list.push_front(new_node);
                hash_table[key] = new_node;
            }
        }
    }

    for (int v : outputs) {
        std::cout << v << '\n';
    }
}
