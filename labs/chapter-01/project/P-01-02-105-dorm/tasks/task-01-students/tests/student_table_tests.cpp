#include "test_support.hpp"
#include <algorithm>
#include <random>

using namespace dorm105;
using dorm105_test::same;

int main(int argc, char** argv) {
    CHECK(argc == 2, "one test group required");
    const std::string group = argv[1];
    StudentTable table;
    if (group == "empty") {
        int indices[kStudentCapacity];
        std::fill_n(indices, kStudentCapacity, -7);
        CHECK(table.size() == 0 && !table.at(-1) && !table.at(0), "empty bounds");
        CHECK(table.findIndex("001") == -1, "empty ID lookup");
        CHECK(!table.erase("001") && table.removeByRoom(1, 1) == 0, "empty deletion");
        CHECK(table.findByName("Lin", indices) == 0 && indices[0] == -7, "no output on no matches");
        CHECK(!table.update("001", "Lin", 1, 1), "cannot update absent student");
    } else if (group == "crud") {
        table = exampleStudents();
        CHECK(table.findIndex("001") == 0 && table.findIndex("1") == -1, "leading zeros matter");
        table.at(1)->stamina = 60;
        table.at(1)->helpScore = 24;
        table.at(1)->delivered = 2;
        CHECK(table.update("002", "Chen New", 5, 7), "update existing student");
        CHECK(table.at(1)->stamina == 60 && table.at(1)->helpScore == 24 &&
              table.at(1)->delivered == 2 && table.at(1)->id == "002", "update preserves statistics and ID");
        const Student before = *table.at(1);
        CHECK(!table.update("002", "", 5, 7) && !table.update("002", "bad", 0, 1) &&
              !table.update("002", "bad", 1, 31), "invalid update rejected");
        CHECK(same(before, *table.at(1)), "invalid update atomic");
        CHECK(table.erase("001") && table.at(0)->id == "002", "erase head and shift");
        CHECK(table.erase("003") && table.at(1)->id == "004", "erase middle");
        CHECK(table.erase("004") && table.erase("002") && table.size() == 0, "erase tail and last");
        CHECK(table.add("009", "Again", 1, 1) && table.at(0)->stamina == 100, "reuse starts fresh");
    } else if (group == "names") {
        table = exampleStudents();
        int indices[kStudentCapacity];
        std::fill_n(indices, kStudentCapacity, -7);
        CHECK(table.findByName("Lin", indices) == 2 && indices[0] == 0 && indices[1] == 3,
              "all same-name matches in table order");
        CHECK(indices[2] == -7, "only write returned output");
        CHECK(table.findByName("lin", indices) == 0, "case-sensitive exact name");
        CHECK(table.add("005", "小林", 3, 2) && table.findByName("小林", indices) == 1,
              "UTF-8 name is preserved");
    } else if (group == "compact") {
        const int rooms[] = {1, 2, 2, 1, 2, 1};
        for (int i = 0; i < 6; ++i)
            CHECK(table.add(std::to_string(i), "Name", 3, rooms[i]), "compact fixture");
        table.at(3)->helpScore = 42;
        CHECK(table.removeByRoom(3, 2) == 3 && table.size() == 3, "batch removal count");
        CHECK(table.at(0)->id == "0" && table.at(1)->id == "3" && table.at(2)->id == "5",
              "stable order, including consecutive matches");
        CHECK(table.at(1)->helpScore == 42, "move complete student record");
        CHECK(table.removeByRoom(3, 2) == 0 && table.removeByRoom(0, 1) == 0, "no match or invalid room");
        CHECK(table.removeByRoom(3, 1) == 3 && table.size() == 0, "all match");
        CHECK(table.add("77", "Fresh", 1, 1) && table.at(0)->helpScore == 0, "reuse after compaction");
    } else if (group == "capacity") {
        CHECK(!table.add("", "Name", 1, 1) && !table.add("x1", "Name", 1, 1) &&
              !table.add(std::string(21, '1'), "Name", 1, 1), "ID validation");
        CHECK(!table.add("1", "", 1, 1) && !table.add("1", "Name", 11, 1), "name/floor validation");
        for (int i = 0; i < kStudentCapacity; ++i)
            CHECK(table.add(std::to_string(i), "Name", 1, 1), "fill capacity");
        CHECK(!table.add("999", "Overflow", 1, 1) && table.size() == kStudentCapacity, "full table atomic");
        CHECK(!table.add("0", "Duplicate", 2, 2), "duplicate ID rejected");
        CHECK(table.erase("50") && table.add("999", "New", 10, 30), "reclaim one slot");
        CHECK(table.at(104)->id == "999" && !table.at(105), "last position and upper bound");
    } else if (group == "model") {
        std::mt19937 random(105);
        std::vector<Student> model;
        for (int step = 0; step < 1500; ++step) {
            const std::string id = std::to_string(random() % 130);
            const int floor = 1 + static_cast<int>(random() % 4);
            const int room = 1 + static_cast<int>(random() % 3);
            const auto found = std::find_if(model.begin(), model.end(),
                [&](const Student& student) { return student.id == id; });
            const int operation = static_cast<int>(random() % 4);
            if (operation == 0) {
                const bool expected = found == model.end() && model.size() < kStudentCapacity;
                CHECK(table.add(id, "Model", floor, room) == expected, "model add result");
                if (expected) model.push_back(Student{id, "Model", floor, room});
            } else if (operation == 1) {
                const bool expected = found != model.end();
                CHECK(table.erase(id) == expected, "model erase result");
                if (expected) model.erase(found);
            } else if (operation == 2) {
                const bool expected = found != model.end();
                CHECK(table.update(id, "Changed", floor, room) == expected, "model update result");
                if (expected) { found->name = "Changed"; found->floor = floor; found->room = room; }
            } else {
                const auto oldSize = model.size();
                model.erase(std::remove_if(model.begin(), model.end(), [&](const Student& student) {
                    return student.floor == floor && student.room == room;
                }), model.end());
                CHECK(table.removeByRoom(floor, room) == static_cast<int>(oldSize - model.size()),
                      "model stable bulk removal count");
            }
            CHECK(table.size() == static_cast<int>(model.size()), "model size");
            for (int i = 0; i < table.size(); ++i)
                CHECK(same(*table.at(i), model[static_cast<std::size_t>(i)]), "model complete ordered records");
        }
    } else CHECK(false, "unknown group");
}
