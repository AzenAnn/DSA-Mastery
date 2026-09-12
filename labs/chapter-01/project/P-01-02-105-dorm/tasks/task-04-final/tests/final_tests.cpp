#include "dorm_system.hpp"
#include "test_support.hpp"
#include <sstream>

using namespace dorm105;

int main(int argc, char** argv) {
    CHECK(argc == 2, "one test group required");
    const std::string group = argv[1];
    DormSystem system;
    system.students = exampleStudents();
    if (group == "guards") {
        CHECK(system.students.update("001", "Lin", 3, 2), "same-room fixture");
        CHECK(system.pending.append({"1", "004", "002"}, system.students), "active reference");
        CHECK(!system.removeStudent("004") && !system.removeStudent("002"), "guard both helper and receiver");
        CHECK(system.removeRoom(3, 2) == -1 && system.students.size() == 4 &&
              system.students.at(0)->id == "001", "batch preflight prevents partial deletion");
        CHECK(system.removeRoom(0, 1) == -1, "invalid room");
        CHECK(system.pending.cancel("1"), "cancel active task");
        CHECK(system.removeRoom(3, 2) == 2 && system.students.at(0)->id == "003", "batch removal after cancellation");
        CHECK(system.removeStudent("004") && !system.removeStudent("999"), "guarded single removal");
    } else if (group == "summary") {
        auto summary = system.summary();
        CHECK(summary.students == 4 && summary.deliveries == 0 && summary.helpScore == 0 &&
              summary.pending == 0 && summary.topCount == 0, "initial summary");
        CHECK(tryDeliver(system.students, "001", "002").status == DeliveryStatus::Delivered, "first delivery");
        CHECK(tryDeliver(system.students, "003", "002").status == DeliveryStatus::Delivered, "second delivery");
        CHECK(system.pending.append({"1", "004", "002"}, system.students), "pending included");
        summary = system.summary();
        CHECK(summary.deliveries == 2 && summary.helpScore == 28 && summary.pending == 1 &&
              summary.topCount == 2 && summary.topIndices[0] == 0 && summary.topIndices[1] == 2, "derived totals/ties");
        CHECK(system.summary().helpScore == 28 && system.students.at(0)->stamina == 93, "summary is read-only");
        CHECK(system.removeStudent("001"), "remove unreferenced former helper");
        summary = system.summary();
        CHECK(summary.students == 3 && summary.deliveries == 1 && summary.helpScore == 14 &&
              summary.topIndices[0] == 1, "summary uses current roster and current indices");
    } else if (group == "flow") {
        CHECK(system.pending.append({"1", "001", "002"}, system.students) &&
              system.pending.append({"2", "003", "002"}, system.students), "two real pending tasks");
        CHECK(system.students.update("002", "Chen", 5, 8), "move room before execution");
        CHECK(system.pending.processOnce(system.students) == 2, "execute upstream student code");
        const auto summary = system.summary();
        CHECK(summary.helpScore == 36 && summary.deliveries == 2 && summary.pending == 0, "full composition totals");
        CHECK(system.students.at(0)->stamina == 87 && system.students.at(2)->stamina == 87, "actual cost applied");
        CHECK(system.removeStudent("002") && system.pending.invariantHolds(), "remove receiver after completion");
        CHECK(system.pending.processOnce(system.students) == 0 && system.summary().helpScore == 36, "no double settlement");
    } else if (group == "input") {
        std::istringstream input(
            "ADD 01 \"Xiao Lin\" 3 2\n"
            "ADD 02 \"Chen\" 1 1 trailing\n"
            "UPDATE 01 \"Changed\" 999999999999999999999 1\n"
            "ERASE 01 extra\n"
            "LIST extra\n"
            "ADD 03 \"Missing quote 1 1\n"
            "UNKNOWN\n"
            "FIND 01\n"
            "NAME \"Xiao Lin\"\n"
            "SUMMARY\nQUIT\nERASE 01\n");
        std::ostringstream output;
        CHECK(runSession(input, output) == 0, "session exits normally");
        CHECK(output.str() ==
              "OK ADD\nERROR INPUT\nERROR INPUT\nERROR INPUT\nERROR INPUT\nERROR INPUT\nERROR COMMAND\n"
              "STUDENT 01 \"Xiao Lin\" 3 2 100 0 0\nMATCHES 1\n"
              "STUDENT 01 \"Xiao Lin\" 3 2 100 0 0\nSUMMARY 1 0 0 0\nTOP 0\nBYE\n",
              "malformed input is atomic, names preserve spaces, QUIT stops execution");
    } else CHECK(false, "unknown group");
}
