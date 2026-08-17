set(HUFFMAN_SOURCE student/huffman.cpp)
if(LAB_USE_SOLUTION)
  set(HUFFMAN_SOURCE solution/huffman.cpp)
endif()

add_library(huffman_codec STATIC ${HUFFMAN_SOURCE})
target_include_directories(huffman_codec PUBLIC ${PROJECT_SOURCE_DIR}/contracts)

add_executable(huffman_tests tests/huffman_tests.cpp)
target_link_libraries(huffman_tests PRIVATE huffman_codec)

add_test(NAME codec-round-trip COMMAND huffman_tests round-trip)
add_test(NAME codec-edge-cases COMMAND huffman_tests edge-cases)
add_test(NAME codec-prefix-property COMMAND huffman_tests prefix-property)
