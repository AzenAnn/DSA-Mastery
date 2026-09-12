#pragma once
#include <string>

namespace dorm105 {
constexpr int kStudentCapacity = 105;
constexpr int kPendingCapacity = 105;
constexpr int kMaxFloor = 10;
constexpr int kMaxRoom = 30;

struct Student {
    std::string id;
    std::string name;
    int floor = 1;
    int room = 1;
    int stamina = 100;
    int helpScore = 0;
    int delivered = 0;
};

struct Request {
    std::string id;
    std::string helperId;
    std::string receiverId;
};

bool validId(const std::string& id);
bool validRoom(int floor, int room);
} // namespace dorm105
