add_library(dorm_final STATIC ${LAB_IMPL}/dorm_system.cpp ${PROJECT_SOURCE_DIR}/src/command_loop.cpp)
target_link_libraries(dorm_final PUBLIC dorm_pending)
add_executable(dorm105_cli ${PROJECT_SOURCE_DIR}/src/main.cpp)
target_link_libraries(dorm105_cli PRIVATE dorm_final)
add_executable(dorm_final_tests tests/final_tests.cpp)
target_link_libraries(dorm_final_tests PRIVATE dorm_final)
foreach(group guards summary flow input)
  add_test(NAME final-${group} COMMAND dorm_final_tests ${group})
endforeach()
add_test(NAME final-cli COMMAND ${CMAKE_COMMAND}
  "-DCLI=$<TARGET_FILE:dorm105_cli>"
  "-DCASES=${CMAKE_CURRENT_SOURCE_DIR}/tests"
  -P "${CMAKE_CURRENT_SOURCE_DIR}/tests/cli_test.cmake")
