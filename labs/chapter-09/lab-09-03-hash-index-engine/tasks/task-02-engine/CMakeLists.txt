set(HASH_INDEX_SOURCE student/hash_index.cpp)
if(LAB_USE_SOLUTION)
  set(HASH_INDEX_SOURCE solution/hash_index.cpp)
endif()

add_library(hash_index STATIC ${HASH_INDEX_SOURCE})
target_include_directories(hash_index PUBLIC ${PROJECT_SOURCE_DIR}/contracts)

add_executable(hash_index_tests tests/hash_index_tests.cpp)
target_link_libraries(hash_index_tests PRIVATE hash_index)

add_test(NAME engine-chaining COMMAND hash_index_tests chaining)
add_test(NAME engine-open-addressing COMMAND hash_index_tests open-addressing)
add_test(NAME engine-probe-counts COMMAND hash_index_tests probe-counts)
