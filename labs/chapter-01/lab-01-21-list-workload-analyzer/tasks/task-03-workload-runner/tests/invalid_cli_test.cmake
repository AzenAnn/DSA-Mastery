execute_process(
  COMMAND "${UNIT_TEST}" validation
  RESULT_VARIABLE UNIT_RESULT
  OUTPUT_VARIABLE UNIT_OUTPUT
  ERROR_VARIABLE UNIT_ERROR
)
if(NOT UNIT_RESULT EQUAL 0)
  message(FATAL_ERROR "Argument/output unit checks failed: ${UNIT_OUTPUT}${UNIT_ERROR}")
endif()

foreach(BAD_ARGUMENTS IN ITEMS "--size;0" "--profile;unknown" "--ops" "--seed;bad" "--operations;10000001")
  execute_process(
    COMMAND "${CLI}" ${BAD_ARGUMENTS}
    RESULT_VARIABLE CLI_RESULT
    OUTPUT_VARIABLE CLI_OUTPUT
    ERROR_VARIABLE CLI_ERROR
  )
  if(CLI_RESULT EQUAL 0)
    message(FATAL_ERROR "Invalid arguments unexpectedly succeeded: ${BAD_ARGUMENTS}")
  endif()
  if(NOT CLI_ERROR MATCHES "^error:")
    message(FATAL_ERROR "Invalid arguments need an error diagnostic: ${CLI_ERROR}")
  endif()
endforeach()

execute_process(
  COMMAND "${CLI}" --profile head-churn --size 4 --operations 2 --warmup 0 --repetitions 1 --json
  RESULT_VARIABLE JSON_RESULT
  OUTPUT_VARIABLE JSON_OUTPUT
  ERROR_VARIABLE JSON_ERROR
)
if(NOT JSON_RESULT EQUAL 0)
  message(FATAL_ERROR "Valid JSON run failed: ${JSON_ERROR}")
endif()
string(JSON REPORT_VERSION ERROR_VARIABLE JSON_PARSE_ERROR GET "${JSON_OUTPUT}" reportVersion)
if(JSON_PARSE_ERROR OR NOT REPORT_VERSION EQUAL 1)
  message(FATAL_ERROR "CLI did not emit valid versioned JSON: ${JSON_OUTPUT}")
endif()
