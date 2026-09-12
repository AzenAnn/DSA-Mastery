#pragma once
#include "student_table.hpp"

namespace dorm105 {
enum class DeliveryStatus { Delivered, UnknownStudent, SelfDelivery, NoStamina };
struct DeliveryResult {
    DeliveryStatus status = DeliveryStatus::UnknownStudent;
    int cost = 0;
    int reward = 0;
};

// 非法楼层返回 -1。
int deliveryCost(int floor);
int deliveryReward(int floor);
DeliveryResult tryDeliver(StudentTable& students, const std::string& helperId,
                          const std::string& receiverId);
// 仅考虑 delivered > 0 的学生；并列者按名单顺序返回。
// indices 的容量至少为 kStudentCapacity；没有成功记录时返回 0。
int findTopHelpers(const StudentTable& students, int indices[]);
const char* statusName(DeliveryStatus status);
} // namespace dorm105
