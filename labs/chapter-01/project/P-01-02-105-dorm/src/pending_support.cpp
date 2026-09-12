#include "pending_list.hpp"

namespace dorm105 {
PendingList::PendingList() : tail_(&head_) {}
PendingList::~PendingList() { clear(); }
int PendingList::size() const { return size_; }
const Request* PendingList::at(int index) const {
    if (index < 0 || index >= size_) return nullptr;
    const Node* node = head_.next;
    for (int i = 0; i < index; ++i) node = node->next;
    return &node->request;
}
bool PendingList::contains(const std::string& id) const {
    for (const Node* node = head_.next; node; node = node->next)
        if (node->request.id == id) return true;
    return false;
}
bool PendingList::referencesStudent(const std::string& id) const {
    for (const Node* node = head_.next; node; node = node->next)
        if (node->request.helperId == id || node->request.receiverId == id) return true;
    return false;
}
bool PendingList::acceptable(const Request& request, const StudentTable& students) const {
    return size_ < kPendingCapacity && validId(request.id) && !contains(request.id) &&
           request.helperId != request.receiverId &&
           students.findIndex(request.helperId) >= 0 &&
           students.findIndex(request.receiverId) >= 0;
}
void PendingList::clear() {
    Node* node = head_.next;
    while (node) {
        Node* next = node->next;
        delete node;
        node = next;
    }
    head_.next = nullptr;
    tail_ = &head_;
    size_ = 0;
}
bool PendingList::invariantHolds() const {
    if (size_ < 0 || size_ > kPendingCapacity || !tail_) return false;
    const Node* last = &head_;
    int count = 0;
    for (const Node* node = head_.next; node; node = node->next) {
        if (++count > size_) return false;
        last = node;
    }
    return count == size_ && last == tail_ && tail_->next == nullptr;
}
} // namespace dorm105
