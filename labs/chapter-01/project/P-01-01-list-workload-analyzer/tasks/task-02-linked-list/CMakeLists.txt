set(LINKED_SOURCE student/linked_list.cpp)
if(LAB_USE_SOLUTION)
  set(LINKED_SOURCE solution/linked_list.cpp)
endif()

add_library(linked_list STATIC ${LINKED_SOURCE})
target_include_directories(linked_list PUBLIC ${PROJECT_SOURCE_DIR}/contracts)

add_executable(linked_list_tests tests/linked_list_tests.cpp)
target_link_libraries(linked_list_tests PRIVATE linked_list)

add_test(NAME linked-contract COMMAND linked_list_tests contract)
add_test(NAME linked-boundaries COMMAND linked_list_tests boundaries)
add_test(NAME linked-bidirectional-links COMMAND linked_list_tests bidirectional-links)
add_test(NAME linked-clear-and-reuse COMMAND linked_list_tests clear-and-reuse)
