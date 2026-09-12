#pragma once
#include "delivery.hpp"

namespace dorm105 {
class PendingList {
public:
    PendingList();
    ~PendingList();
    PendingList(const PendingList&) = delete;
    PendingList& operator=(const PendingList&) = delete;
    int size() const;
    const Request* at(int index) const;
    bool contains(const std::string& id) const;
    bool referencesStudent(const std::string& studentId) const;
    bool invariantHolds() const;
    void clear();

    bool append(const Request& request, const StudentTable& students);
    bool insertAfter(const std::string& afterId, const Request& request,
                     const StudentTable& students);
    bool cancel(const std::string& requestId);
    int processOnce(StudentTable& students);

private:
    struct Node {
        Request request;
        Node* next = nullptr;
    };
    Node head_{};
    Node* tail_ = nullptr;
    int size_ = 0;
    // 已提供校验：容量、编号、重复、自取以及学生是否存在。
    bool acceptable(const Request& request, const StudentTable& students) const;
};
} // namespace dorm105
