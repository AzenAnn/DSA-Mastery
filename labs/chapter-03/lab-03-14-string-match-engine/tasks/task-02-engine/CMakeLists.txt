set(MATCHER_SOURCE
  student/matcher.cpp
  student/engine.cpp
  ${PROJECT_SOURCE_DIR}/src/workload.cpp
)
if(LAB_USE_SOLUTION)
  set(MATCHER_SOURCE
    solution/matcher.cpp
    solution/engine.cpp
    ${PROJECT_SOURCE_DIR}/src/workload.cpp
  )
endif()

add_library(match_engine STATIC ${MATCHER_SOURCE})
target_include_directories(match_engine PUBLIC ${PROJECT_SOURCE_DIR}/contracts)

add_executable(engine_tests tests/engine_tests.cpp)
target_link_libraries(engine_tests PRIVATE match_engine)

add_executable(match_engine_cli ${PROJECT_SOURCE_DIR}/src/engine_cli.cpp)
target_link_libraries(match_engine_cli PRIVATE match_engine)

add_test(NAME engine-semantic-equivalence COMMAND engine_tests semantic)
add_test(NAME engine-next-and-nextval COMMAND engine_tests next)
add_test(NAME engine-text-ops-and-utf8 COMMAND engine_tests textops)
add_test(NAME engine-cost-accounting COMMAND engine_tests cost)
add_test(NAME engine-workload-determinism COMMAND engine_tests workload)
