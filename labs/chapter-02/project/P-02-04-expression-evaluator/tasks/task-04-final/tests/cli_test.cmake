execute_process(COMMAND "${CLI}" INPUT_FILE "${CASES}/cli.in"
  OUTPUT_VARIABLE actual ERROR_VARIABLE diagnostic RESULT_VARIABLE status TIMEOUT 10)
file(READ "${CASES}/cli.out" expected)
string(REPLACE "\r\n" "\n" actual "${actual}")
string(REPLACE "\r\n" "\n" expected "${expected}")
if(NOT status EQUAL 0 OR NOT actual STREQUAL expected)
  message(FATAL_ERROR "Final executable integration failed (exit ${status}). Modules: tokenizer, postfix, stack, evaluator.\nExpected:\n${expected}\nActual:\n${actual}\nStderr:\n${diagnostic}\nInput: ${CASES}/cli.in")
endif()
