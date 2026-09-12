#include "delivery.hpp"

namespace dorm105 {
int deliveryCost(int floor) {
    return floor >= 1 && floor <= kMaxFloor ? 3 * (floor - 1) + 1 : -1;
}
int deliveryReward(int floor) {
    return floor >= 1 && floor <= kMaxFloor ? 10 + 2 * (floor - 1) : -1;
}
DeliveryResult tryDeliver(StudentTable& students, const std::string& helperId,
                          const std::string& receiverId) {
    Student* helper = students.at(students.findIndex(helperId));
    const Student* receiver = students.at(students.findIndex(receiverId));
    if (!helper || !receiver) return {DeliveryStatus::UnknownStudent, 0, 0};
    if (helperId == receiverId) return {DeliveryStatus::SelfDelivery, 0, 0};
    const int cost = deliveryCost(receiver->floor);
    const int reward = deliveryReward(receiver->floor);
    if (helper->stamina < cost) return {DeliveryStatus::NoStamina, 0, 0};
    helper->stamina -= cost;
    helper->helpScore += reward;
    ++helper->delivered;
    return {DeliveryStatus::Delivered, cost, reward};
}
int findTopHelpers(const StudentTable& students, int indices[]) {
    int best = -1;
    for (int i = 0; i < students.size(); ++i) {
        const Student& student = *students.at(i);
        if (student.delivered > 0 && student.helpScore > best) best = student.helpScore;
    }
    int count = 0;
    for (int i = 0; i < students.size(); ++i) {
        const Student& student = *students.at(i);
        if (student.delivered > 0 && student.helpScore == best) indices[count++] = i;
    }
    return count;
}
} // namespace dorm105
