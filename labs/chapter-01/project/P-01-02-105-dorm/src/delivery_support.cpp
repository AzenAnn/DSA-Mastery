#include "delivery.hpp"

namespace dorm105 {
const char* statusName(DeliveryStatus status) {
    switch (status) {
    case DeliveryStatus::Delivered: return "DELIVERED";
    case DeliveryStatus::UnknownStudent: return "UNKNOWN_STUDENT";
    case DeliveryStatus::SelfDelivery: return "SELF_DELIVERY";
    case DeliveryStatus::NoStamina: return "NO_STAMINA";
    }
    return "UNKNOWN_STUDENT";
}
} // namespace dorm105
