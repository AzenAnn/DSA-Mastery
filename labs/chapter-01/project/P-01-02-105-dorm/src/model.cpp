#include "model.hpp"

namespace dorm105 {
bool validId(const std::string& id) {
    if (id.empty() || id.size() > 20) return false;
    for (char ch : id) if (ch < '0' || ch > '9') return false;
    return true;
}
bool validRoom(int floor, int room) {
    return floor >= 1 && floor <= kMaxFloor && room >= 1 && room <= kMaxRoom;
}
} // namespace dorm105
