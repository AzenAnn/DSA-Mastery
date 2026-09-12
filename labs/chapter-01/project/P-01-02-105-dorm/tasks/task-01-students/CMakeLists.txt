add_library(dorm_students STATIC ${LAB_IMPL}/student_table.cpp
  ${PROJECT_SOURCE_DIR}/src/table_support.cpp ${PROJECT_SOURCE_DIR}/src/model.cpp)
target_include_directories(dorm_students PUBLIC ${PROJECT_SOURCE_DIR}/contracts)
add_executable(dorm_students_tests tests/student_table_tests.cpp)
target_link_libraries(dorm_students_tests PRIVATE dorm_students)
foreach(group empty crud names compact capacity model)
  add_test(NAME students-${group} COMMAND dorm_students_tests ${group})
endforeach()
