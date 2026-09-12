#include "pending_list.hpp"
#include "test_support.hpp"
#include <algorithm>
#include <random>

using namespace dorm105;

void checkIds(const PendingList& list, const std::vector<std::string>& expected) {
    CHECK(list.invariantHolds() && list.size() == static_cast<int>(expected.size()), "list size/tail/acyclic invariant");
    CHECK(!list.at(-1) && !list.at(list.size()), "list bounds");
    for (int i = 0; i < list.size(); ++i)
        CHECK(list.at(i)->id == expected[static_cast<std::size_t>(i)], "list order");
}

int main(int argc, char** argv) {
    CHECK(argc == 2, "one test group required");
    const std::string group = argv[1];
    auto students = exampleStudents();
    PendingList list;
    if (group == "edit") {
        checkIds(list, {});
        CHECK(!list.cancel("1"), "cancel from empty");
        CHECK(list.append({"1", "001", "002"}, students), "append empty");
        CHECK(list.append({"3", "003", "002"}, students), "append tail");
        CHECK(list.insertAfter("1", {"2", "001", "004"}, students), "insert middle");
        CHECK(list.insertAfter("3", {"4", "004", "002"}, students), "insert after tail");
        checkIds(list, {"1", "2", "3", "4"});
        CHECK(list.referencesStudent("001") && list.referencesStudent("002") &&
              !list.referencesStudent("999"), "references both roles");
        CHECK(list.cancel("1") && list.cancel("3"), "cancel head and middle");
        checkIds(list, {"2", "4"});
        CHECK(list.cancel("4") && list.cancel("2"), "cancel tail and last");
        checkIds(list, {});
        CHECK(list.append({"2", "001", "002"}, students), "reuse removed ID and empty tail");
        list.clear();
        list.clear();
        checkIds(list, {});
        CHECK(list.append({"5", "001", "002"}, students), "reuse after clear");
    } else if (group == "errors") {
        CHECK(!list.append({"x", "001", "002"}, students), "invalid request ID");
        CHECK(!list.append({"1", "001", "001"}, students), "self request");
        CHECK(!list.append({"1", "999", "002"}, students) &&
              !list.append({"1", "001", "999"}, students), "missing student");
        CHECK(list.append({"1", "001", "002"}, students), "valid baseline");
        CHECK(!list.append({"1", "003", "004"}, students), "duplicate active ID");
        CHECK(!list.insertAfter("999", {"2", "001", "002"}, students), "missing insertion anchor");
        CHECK(!list.insertAfter("1", {"1", "001", "002"}, students), "duplicate insertion");
        checkIds(list, {"1"});
        CHECK(list.at(0)->helperId == "001" && list.at(0)->receiverId == "002", "failure preserves request fields");
        for (int i = 2; i <= kPendingCapacity; ++i)
            CHECK(list.append({std::to_string(i), "001", "002"}, students), "fill pending capacity");
        CHECK(!list.append({"999", "001", "002"}, students) &&
              !list.insertAfter("1", {"999", "001", "002"}, students), "full list rejects mutation");
        CHECK(list.size() == kPendingCapacity && list.invariantHolds(), "full invariant");
        CHECK(list.cancel("50") && list.append({"999", "001", "002"}, students), "reuse freed node slot");
    } else if (group == "process") {
        students.at(0)->stamina = 7;
        CHECK(list.append({"1", "001", "003"}, students), "expensive request first");
        CHECK(list.append({"2", "001", "002"}, students), "affordable request next");
        CHECK(list.processOnce(students) == 1, "failed request does not stop later work");
        checkIds(list, {"1"});
        CHECK(students.at(0)->stamina == 0 && students.at(0)->helpScore == 14, "only completed work charged");
        CHECK(list.processOnce(students) == 0 && students.at(0)->helpScore == 14, "retry does not double count");
        CHECK(students.update("003", "Li", 1, 1), "move receiver");
        CHECK(list.append({"3", "004", "003"}, students), "new helper");
        CHECK(list.processOnce(students) == 1 && students.at(3)->stamina == 99, "updated room lookup");
        checkIds(list, {"1"});
        CHECK(students.erase("003"), "direct table mutation used to exercise missing-reference defense");
        CHECK(list.processOnce(students) == 0, "missing student remains pending");
        checkIds(list, {"1"});
    } else if (group == "patterns") {
        for (unsigned mask = 0; mask < 32; ++mask) {
            StudentTable roster;
            PendingList work;
            CHECK(roster.add("999", "Receiver", 3, 1), "pattern receiver");
            std::vector<std::string> remaining;
            int expected = 0;
            for (unsigned i = 0; i < 5; ++i) {
                const std::string helper = std::to_string(i + 1);
                const std::string request = std::to_string(i + 100);
                CHECK(roster.add(helper, "Helper", 1, 1), "pattern helper");
                roster.at(static_cast<int>(i + 1))->stamina = (mask & (1U << i)) ? 7 : 0;
                CHECK(work.append({request, helper, "999"}, roster), "pattern request");
                if (mask & (1U << i)) ++expected;
                else remaining.push_back(request);
            }
            CHECK(work.processOnce(roster) == expected, "every success/failure pattern");
            checkIds(work, remaining);
            CHECK(work.processOnce(roster) == 0, "each successful request removed once");
            CHECK(work.append({"777", "999", "1"}, roster), "append after possible tail deletion");
            CHECK(work.processOnce(roster) == 1, "new tail processes exactly once");
            checkIds(work, remaining);
        }
    } else if (group == "model") {
        std::mt19937 random(10503);
        std::vector<std::string> expected;
        for (int step = 0; step < 1200; ++step) {
            const std::string id = std::to_string(random() % 140);
            const std::string anchor = std::to_string(random() % 140);
            const auto found = std::find(expected.begin(), expected.end(), id);
            const int operation = static_cast<int>(random() % 3);
            if (operation == 0) {
                const bool ok = found == expected.end() && expected.size() < kPendingCapacity;
                CHECK(list.append({id, "001", "002"}, students) == ok, "array oracle append");
                if (ok) expected.push_back(id);
            } else if (operation == 1) {
                const bool ok = found != expected.end();
                CHECK(list.cancel(id) == ok, "array oracle cancel");
                if (ok) expected.erase(found);
            } else {
                const auto position = std::find(expected.begin(), expected.end(), anchor);
                const bool ok = found == expected.end() && position != expected.end() &&
                                expected.size() < kPendingCapacity;
                CHECK(list.insertAfter(anchor, {id, "001", "002"}, students) == ok, "array oracle insertion");
                if (ok) expected.insert(position + 1, id);
            }
            checkIds(list, expected);
            for (int i = 0; i < list.size(); ++i)
                CHECK(list.at(i)->helperId == "001" && list.at(i)->receiverId == "002", "complete request retained");
        }
    } else CHECK(false, "unknown group");
}
