set(SEQUENTIAL_SOURCE student/sequential_list.cpp)
if(LAB_USE_SOLUTION)
  set(SEQUENTIAL_SOURCE solution/sequential_list.cpp)
endif()

add_library(sequential_list STATIC ${SEQUENTIAL_SOURCE})
target_include_directories(sequential_list PUBLIC ${PROJECT_SOURCE_DIR}/contracts)

add_executable(sequential_list_tests tests/sequential_list_tests.cpp)
target_link_libraries(sequential_list_tests PRIVATE sequential_list)

add_test(NAME sequential-contract COMMAND sequential_list_tests contract)
add_test(NAME sequential-boundaries COMMAND sequential_list_tests boundaries)
add_test(NAME sequential-resize COMMAND sequential_list_tests resize)
add_test(NAME sequential-invariants COMMAND sequential_list_tests invariants)
