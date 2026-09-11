add_library(expr_evaluator STATIC ${LAB_IMPL}/evaluator.cpp ${PROJECT_SOURCE_DIR}/src/errors.cpp)
target_link_libraries(expr_evaluator PUBLIC expr_postfix expr_stack)
add_executable(expression_cli ${PROJECT_SOURCE_DIR}/src/main.cpp)
target_link_libraries(expression_cli PRIVATE expr_evaluator)
add_executable(expr_final_tests tests/final_tests.cpp)
target_link_libraries(expr_final_tests PRIVATE expr_evaluator)
foreach(group normal boundary errors)
  add_test(NAME final-${group} COMMAND expr_final_tests ${group})
endforeach()
add_test(NAME final-cli COMMAND ${CMAKE_COMMAND}
  "-DCLI=$<TARGET_FILE:expression_cli>"
  "-DCASES=${CMAKE_CURRENT_SOURCE_DIR}/tests"
  -P "${CMAKE_CURRENT_SOURCE_DIR}/tests/cli_test.cmake")
