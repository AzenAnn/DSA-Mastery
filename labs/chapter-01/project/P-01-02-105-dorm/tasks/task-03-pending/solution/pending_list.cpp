#include "pending_list.hpp"

namespace dorm105 {
bool PendingList::append(const Request& request, const StudentTable& students) {
    if (!acceptable(request, students)) return false;
    Node* node = new Node{request, nullptr};
    tail_->next = node;
    tail_ = node;
    ++size_;
    return true;
}
bool PendingList::insertAfter(const std::string& afterId, const Request& request,
                              const StudentTable& students) {
    if (!acceptable(request, students)) return false;
    Node* position = head_.next;
    while (position && position->request.id != afterId) position = position->next;
    if (!position) return false;
    Node* node = new Node{request, position->next};
    position->next = node;
    if (tail_ == position) tail_ = node;
    ++size_;
    return true;
}
bool PendingList::cancel(const std::string& requestId) {
    Node* previous = &head_;
    while (previous->next && previous->next->request.id != requestId)
        previous = previous->next;
    Node* node = previous->next;
    if (!node) return false;
    previous->next = node->next;
    if (tail_ == node) tail_ = previous;
    delete node;
    --size_;
    return true;
}
int PendingList::processOnce(StudentTable& students) {
    int completed = 0;
    Node* previous = &head_;
    while (previous->next) {
        Node* current = previous->next;
        const auto result = tryDeliver(students, current->request.helperId,
                                       current->request.receiverId);
        if (result.status == DeliveryStatus::Delivered) {
            previous->next = current->next;
            if (tail_ == current) tail_ = previous;
            delete current;
            --size_;
            ++completed;
        } else {
            previous = current;
        }
    }
    return completed;
}
} // namespace dorm105
