#include "dorm_system.hpp"
#include <iomanip>
#include <istream>
#include <ostream>
#include <sstream>

namespace dorm105 {
namespace {
bool finished(std::istringstream& line) {
    line >> std::ws;
    return line.eof();
}
void printStudent(std::ostream& out, const Student& student) {
    out << "STUDENT " << student.id << ' ' << std::quoted(student.name) << ' '
        << student.floor << ' ' << student.room << ' ' << student.stamina << ' '
        << student.helpScore << ' ' << student.delivered << '\n';
}
void printRequest(std::ostream& out, const Request& request) {
    out << "REQUEST " << request.id << ' ' << request.helperId << ' '
        << request.receiverId << '\n';
}
void reply(std::ostream& out, bool ok, const std::string& command) {
    out << (ok ? "OK " : "ERROR ") << command << '\n';
}
} // namespace

int runSession(std::istream& input, std::ostream& output) {
    DormSystem system;
    std::string text;
    while (std::getline(input, text)) {
        std::istringstream line(text);
        std::string command;
        if (!(line >> command) || command.front() == '#') continue;
        if (command == "QUIT" || command == "HELP" || command == "LIST" ||
            command == "PENDING" || command == "PROCESS" || command == "SUMMARY") {
            if (!finished(line)) { output << "ERROR INPUT\n"; continue; }
            if (command == "QUIT") { output << "BYE\n"; return 0; }
            if (command == "HELP") {
                output << "ADD id \"name\" floor room | UPDATE id \"name\" floor room\n"
                       << "FIND id | NAME \"name\" | LIST | ERASE id | ERASE_ROOM floor room\n"
                       << "DELIVER helper receiver | REQUEST task helper receiver\n"
                       << "AFTER existing task helper receiver | CANCEL task | PENDING\n"
                       << "PROCESS | SUMMARY | QUIT\n";
            } else if (command == "LIST") {
                output << "STUDENTS " << system.students.size() << '\n';
                for (int i = 0; i < system.students.size(); ++i)
                    printStudent(output, *system.students.at(i));
            } else if (command == "PENDING") {
                output << "PENDING " << system.pending.size() << '\n';
                for (int i = 0; i < system.pending.size(); ++i)
                    printRequest(output, *system.pending.at(i));
            } else if (command == "PROCESS") {
                const int completed = system.pending.processOnce(system.students);
                output << "PROCESSED " << completed << ' ' << system.pending.size() << '\n';
            } else {
                const auto summary = system.summary();
                output << "SUMMARY " << summary.students << ' ' << summary.deliveries
                       << ' ' << summary.helpScore << ' ' << summary.pending << '\n';
                output << "TOP " << summary.topCount << '\n';
                for (int i = 0; i < summary.topCount; ++i) {
                    const Student& leader = *system.students.at(summary.topIndices[i]);
                    output << "LEADER " << leader.id << ' ' << leader.helpScore << '\n';
                }
            }
        } else if (command == "ADD" || command == "UPDATE") {
            std::string id, name;
            int floor = 0, room = 0;
            if (!(line >> id >> std::quoted(name) >> floor >> room) || !finished(line)) {
                output << "ERROR INPUT\n"; continue;
            }
            reply(output, command == "ADD" ? system.students.add(id, name, floor, room)
                                           : system.students.update(id, name, floor, room), command);
        } else if (command == "FIND" || command == "NAME" || command == "ERASE" ||
                   command == "CANCEL") {
            std::string key;
            if (!(line >> std::quoted(key)) || !finished(line)) {
                output << "ERROR INPUT\n"; continue;
            }
            if (command == "FIND") {
                const Student* found = system.students.at(system.students.findIndex(key));
                if (found) printStudent(output, *found);
                else output << "NOT_FOUND\n";
            } else if (command == "NAME") {
                int indices[kStudentCapacity]{};
                const int count = system.students.findByName(key, indices);
                output << "MATCHES " << count << '\n';
                for (int i = 0; i < count; ++i)
                    printStudent(output, *system.students.at(indices[i]));
            } else {
                reply(output, command == "ERASE" ? system.removeStudent(key)
                                                 : system.pending.cancel(key), command);
            }
        } else if (command == "ERASE_ROOM") {
            int floor = 0, room = 0;
            if (!(line >> floor >> room) || !finished(line)) {
                output << "ERROR INPUT\n"; continue;
            }
            const int removed = system.removeRoom(floor, room);
            if (removed < 0) output << "ERROR ERASE_ROOM\n";
            else output << "REMOVED " << removed << '\n';
        } else if (command == "DELIVER") {
            std::string helper, receiver;
            if (!(line >> helper >> receiver) || !finished(line)) {
                output << "ERROR INPUT\n"; continue;
            }
            const auto result = tryDeliver(system.students, helper, receiver);
            output << statusName(result.status) << ' ' << result.cost << ' '
                   << result.reward << '\n';
        } else if (command == "REQUEST" || command == "AFTER") {
            std::string after;
            Request request;
            if ((command == "AFTER" && !(line >> after)) ||
                !(line >> request.id >> request.helperId >> request.receiverId) ||
                !finished(line)) {
                output << "ERROR INPUT\n"; continue;
            }
            reply(output, command == "REQUEST" ? system.pending.append(request, system.students)
                : system.pending.insertAfter(after, request, system.students), command);
        } else {
            output << "ERROR COMMAND\n";
        }
    }
    return 0;
}
} // namespace dorm105
