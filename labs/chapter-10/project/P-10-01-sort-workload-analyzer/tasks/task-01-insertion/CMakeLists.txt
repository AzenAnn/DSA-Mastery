set(INSERTION_SOURCE student/insertion.cpp)
if(LAB_USE_SOLUTION)
  set(INSERTION_SOURCE solution/insertion.cpp)
endif()

add_library(insertion_sort STATIC ${INSERTION_SOURCE})
target_include_directories(insertion_sort PUBLIC ${PROJECT_SOURCE_DIR}/contracts)

add_executable(insertion_tests tests/insertion_tests.cpp)
target_link_libraries(insertion_tests PRIVATE insertion_sort)

add_test(NAME insertion-correctness COMMAND insertion_tests correctness)
add_test(NAME insertion-stability COMMAND insertion_tests stability)
add_test(NAME insertion-counts COMMAND insertion_tests counts)
