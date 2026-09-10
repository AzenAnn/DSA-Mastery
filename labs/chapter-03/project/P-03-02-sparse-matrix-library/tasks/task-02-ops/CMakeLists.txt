set(SPARSE_SOURCE
  student/sparse_matrix.cpp
)
if(LAB_USE_SOLUTION)
  set(SPARSE_SOURCE
    solution/sparse_matrix.cpp
  )
endif()

add_library(sparse_ops STATIC ${SPARSE_SOURCE})
target_include_directories(sparse_ops PUBLIC ${PROJECT_SOURCE_DIR}/contracts)

add_executable(ops_tests tests/ops_tests.cpp)
target_link_libraries(ops_tests PRIVATE sparse_ops)

add_test(NAME ops-transpose COMMAND ops_tests transpose)
add_test(NAME ops-add COMMAND ops_tests add)
add_test(NAME ops-multiply COMMAND ops_tests multiply)
add_test(NAME ops-boundary COMMAND ops_tests boundary)
