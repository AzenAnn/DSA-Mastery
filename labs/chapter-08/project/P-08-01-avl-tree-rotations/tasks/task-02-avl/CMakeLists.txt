set(AVL_SOURCE student/avl.cpp)
if(LAB_USE_SOLUTION)
  set(AVL_SOURCE solution/avl.cpp)
endif()

add_library(avl_tree STATIC ${AVL_SOURCE})
target_include_directories(avl_tree PUBLIC ${PROJECT_SOURCE_DIR}/contracts)

add_executable(avl_tests tests/avl_tests.cpp)
target_link_libraries(avl_tests PRIVATE avl_tree)

add_test(NAME avl-insert-rotations COMMAND avl_tests insert-rotations)
add_test(NAME avl-delete-rebalance COMMAND avl_tests delete-rebalance)
add_test(NAME avl-balanced-height COMMAND avl_tests balanced-height)
