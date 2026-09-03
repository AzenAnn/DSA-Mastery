set(WORKLOAD_OUTPUT_SOURCE student/workload_output.cpp)
if(LAB_USE_SOLUTION)
  set(WORKLOAD_OUTPUT_SOURCE solution/workload_output.cpp)
endif()

add_library(workload_runner STATIC
  common/workload_core.cpp
  ${WORKLOAD_OUTPUT_SOURCE}
)
target_include_directories(workload_runner PUBLIC ${PROJECT_SOURCE_DIR}/contracts)
target_link_libraries(workload_runner PUBLIC sequential_list linked_list)

add_executable(list_workload ${PROJECT_SOURCE_DIR}/src/main.cpp)
target_link_libraries(list_workload PRIVATE workload_runner)

add_executable(workload_runner_tests tests/workload_runner_tests.cpp)
target_link_libraries(workload_runner_tests PRIVATE workload_runner)

add_test(NAME runner-semantic-equivalence COMMAND workload_runner_tests semantic)
add_test(NAME runner-cost-accounting COMMAND workload_runner_tests accounting)
add_test(
  NAME runner-invalid-input
  COMMAND ${CMAKE_COMMAND}
    "-DUNIT_TEST=$<TARGET_FILE:workload_runner_tests>"
    "-DCLI=$<TARGET_FILE:list_workload>"
    -P "${CMAKE_CURRENT_SOURCE_DIR}/tests/invalid_cli_test.cmake"
)
