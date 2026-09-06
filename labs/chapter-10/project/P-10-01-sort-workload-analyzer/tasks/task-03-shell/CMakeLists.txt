set(SHELL_SOURCE student/shell.cpp)
if(LAB_USE_SOLUTION)
  set(SHELL_SOURCE solution/shell.cpp)
endif()

add_library(shell_sort STATIC ${SHELL_SOURCE})
target_include_directories(shell_sort PUBLIC ${PROJECT_SOURCE_DIR}/contracts)

add_executable(shell_tests tests/shell_tests.cpp)
target_link_libraries(shell_tests PRIVATE shell_sort)

add_test(NAME shell-correctness COMMAND shell_tests correctness)
add_test(NAME shell-hibbard-gaps COMMAND shell_tests hibbard-gaps)
add_test(NAME shell-counts COMMAND shell_tests counts)
