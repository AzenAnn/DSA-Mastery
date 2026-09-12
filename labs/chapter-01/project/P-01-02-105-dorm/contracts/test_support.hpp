#pragma once
#include "student_table.hpp"
#include <cstdlib>
#include <iostream>
#include <string>
#include <vector>

namespace dorm105_test {
inline void check(bool ok, const char* message, const char* file, int line) {
    if (!ok) {
        std::cerr << file << ':' << line << ": " << message << '\n';
        std::exit(1);
    }
}
inline bool same(const dorm105::Student& a, const dorm105::Student& b) {
    return a.id == b.id && a.name == b.name && a.floor == b.floor && a.room == b.room &&
           a.stamina == b.stamina && a.helpScore == b.helpScore && a.delivered == b.delivered;
}
inline std::vector<dorm105::Student> snapshot(const dorm105::StudentTable& table) {
    std::vector<dorm105::Student> result;
    for (int i = 0; i < table.size(); ++i) result.push_back(*table.at(i));
    return result;
}
} // namespace dorm105_test
#define CHECK(condition, message) \
    ::dorm105_test::check(static_cast<bool>(condition), message, __FILE__, __LINE__)

inline dorm105::StudentTable exampleStudents() {
    dorm105::StudentTable students;
    CHECK(students.add("001", "Lin", 2, 1), "fixture: add Lin");
    CHECK(students.add("002", "Chen", 3, 2), "fixture: add Chen");
    CHECK(students.add("003", "Li", 10, 3), "fixture: add Li");
    CHECK(students.add("004", "Lin", 1, 1), "fixture: add second Lin");
    return students;
}
