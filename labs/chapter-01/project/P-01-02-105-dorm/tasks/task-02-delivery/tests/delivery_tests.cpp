#include "delivery.hpp"
#include "test_support.hpp"
#include <climits>
#include <random>

using namespace dorm105;
using dorm105_test::same;

int main(int argc, char** argv) {
    CHECK(argc == 2, "one test group required");
    const std::string group = argv[1];
    if (group == "costs") {
        for (int floor = 1; floor <= kMaxFloor; ++floor) {
            int cost = 1;
            for (int level = 1; level < floor; ++level) cost += 2;
            for (int level = floor; level > 1; --level) cost += 1;
            CHECK(deliveryCost(floor) == cost, "independent step-by-step round trip");
            CHECK(deliveryReward(floor) == 10 + 2 * (floor - 1), "specified reward");
        }
        for (int floor : {INT_MIN, -1, 0, 11, INT_MAX})
            CHECK(deliveryCost(floor) == -1 && deliveryReward(floor) == -1, "invalid floor before arithmetic");
    } else if (group == "success") {
        auto students = exampleStudents();
        const Student receiver = *students.at(1);
        auto result = tryDeliver(students, "001", "002");
        CHECK(result.status == DeliveryStatus::Delivered && result.cost == 7 && result.reward == 14,
              "hand-calculated third-floor delivery");
        CHECK(students.at(0)->stamina == 93 && students.at(0)->helpScore == 14 &&
              students.at(0)->delivered == 1 && same(receiver, *students.at(1)), "only helper changes");
        CHECK(students.update("002", "Chen", 10, 3), "receiver moves upstairs");
        result = tryDeliver(students, "001", "002");
        CHECK(result.cost == 28 && result.reward == 28 && students.at(0)->stamina == 65,
              "latest room is used");
        students.at(0)->stamina = 28;
        CHECK(tryDeliver(students, "001", "003").status == DeliveryStatus::Delivered &&
              students.at(0)->stamina == 0, "exact stamina succeeds");
    } else if (group == "failure") {
        auto students = exampleStudents();
        students.at(0)->stamina = 6;
        const auto before = dorm105_test::snapshot(students);
        const std::string helpers[] = {"001", "001", "999", "001"};
        const std::string receivers[] = {"002", "001", "002", "999"};
        const DeliveryStatus statuses[] = {DeliveryStatus::NoStamina, DeliveryStatus::SelfDelivery,
            DeliveryStatus::UnknownStudent, DeliveryStatus::UnknownStudent};
        for (int i = 0; i < 4; ++i) {
            const auto result = tryDeliver(students, helpers[i], receivers[i]);
            CHECK(result.status == statuses[i] && result.cost == 0 && result.reward == 0, "failure result");
            for (int j = 0; j < students.size(); ++j)
                CHECK(same(before[static_cast<std::size_t>(j)], *students.at(j)), "all failed state unchanged");
        }
        CHECK(tryDeliver(students, "999", "999").status == DeliveryStatus::UnknownStudent,
              "missing ID check precedes self-delivery check");
    } else if (group == "ranking") {
        auto students = exampleStudents();
        int leaders[kStudentCapacity]{};
        CHECK(findTopHelpers(students, leaders) == 0, "no deliveries means no leaders");
        CHECK(tryDeliver(students, "001", "002").status == DeliveryStatus::Delivered, "first helper");
        CHECK(tryDeliver(students, "003", "002").status == DeliveryStatus::Delivered, "second helper");
        CHECK(findTopHelpers(students, leaders) == 2 && leaders[0] == 0 && leaders[1] == 2,
              "all ties in roster order");
        CHECK(tryDeliver(students, "003", "004").status == DeliveryStatus::Delivered, "break tie");
        CHECK(findTopHelpers(students, leaders) == 1 && leaders[0] == 2, "new sole leader");
        StudentTable empty;
        CHECK(findTopHelpers(empty, leaders) == 0, "empty table");
    } else if (group == "simulation") {
        auto students = exampleStudents();
        auto model = dorm105_test::snapshot(students);
        std::mt19937 random(10502);
        for (int i = 0; i < 600; ++i) {
            const std::size_t helper = random() % model.size();
            const std::size_t receiver = random() % model.size();
            int cost = 1, reward = 10;
            for (int level = 1; level < model[receiver].floor; ++level) {
                cost += 2; reward += 2;
            }
            for (int level = model[receiver].floor; level > 1; --level) ++cost;
            const bool success = helper != receiver && model[helper].stamina >= cost;
            const auto result = tryDeliver(students, model[helper].id, model[receiver].id);
            CHECK((result.status == DeliveryStatus::Delivered) == success, "simulation outcome");
            if (success) {
                model[helper].stamina -= cost;
                model[helper].helpScore += reward;
                ++model[helper].delivered;
            }
            for (int j = 0; j < students.size(); ++j)
                CHECK(same(model[static_cast<std::size_t>(j)], *students.at(j)), "simulation state");
        }
    } else CHECK(false, "unknown group");
}
