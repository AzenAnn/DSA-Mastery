#include "workload.hpp"

#include <cstdlib>
#include <iostream>
#include <stdexcept>
#include <string>
#include <vector>

namespace {

void require(bool condition, const char *message) {
  if (!condition)
    throw std::runtime_error(message);
}

template <typename Function>
void requireThrows(Function function, const char *message) {
  try {
    function();
  } catch (const std::invalid_argument &) {
    return;
  }
  throw std::runtime_error(message);
}

listlab::WorkloadConfig smallConfig(listlab::WorkloadProfile profile) {
  listlab::WorkloadConfig config;
  config.profile = profile;
  config.initialSize = 8;
  config.operations = 6;
  config.seed = 42;
  config.warmup = 0;
  config.repetitions = 2;
  return config;
}

void semanticTest() {
  const std::vector<listlab::WorkloadProfile> profiles{
      listlab::WorkloadProfile::RandomRead,
      listlab::WorkloadProfile::HeadChurn,
      listlab::WorkloadProfile::MiddleChurn,
      listlab::WorkloadProfile::TailChurn,
      listlab::WorkloadProfile::LinearScan,
  };

  for (const auto profile : profiles) {
    const auto first = listlab::runWorkload(smallConfig(profile));
    const auto second = listlab::runWorkload(smallConfig(profile));
    require(first.equivalent,
            "implementations must remain semantically equivalent");
    require(first.sequential.finalValues.size() == 8,
            "churn profiles must preserve size");
    require(first.sequential.timingsNs.size() == 2,
            "all measured repetitions must be recorded");
    require(first.sequential.checksum == second.sequential.checksum,
            "same seed must reproduce checksum");
    require(first.sequential.observedValueSum ==
                second.sequential.observedValueSum,
            "same seed must reproduce the observed values");
  }
}

void accountingTest() {
  auto config = smallConfig(listlab::WorkloadProfile::HeadChurn);
  config.initialSize = 4;
  config.operations = 2;
  config.repetitions = 1;
  const auto head = listlab::runWorkload(config);

  require(head.equivalent, "head churn outcomes must match");
  require(head.sequential.metrics.elementMoves == 16,
          "head churn must count sequential shifts for insert and erase");
  require(head.sequential.metrics.bufferReallocations == 0,
          "head churn must not reallocate when spare capacity exists");
  require(head.linked.metrics.nodeAllocations == 2,
          "linked insertions must count allocations");
  require(head.linked.metrics.nodeDeallocations == 2,
          "linked erases must count deallocations");
  require(head.linked.metrics.linkWrites == 12,
          "linked churn must count all pointer rewrites");
  require(head.linked.metrics.nodeHops == 0,
          "head operations must not traverse nodes");

  config.profile = listlab::WorkloadProfile::LinearScan;
  config.operations = 3;
  const auto scan = listlab::runWorkload(config);
  require(scan.sequential.metrics.nodeHops == 0,
          "array scans do not follow links");
  require(scan.linked.metrics.nodeHops == 12,
          "linked scans must count one hop per visited node");
}

void validationTest() {
  char program[] = "list_workload";
  char profileFlag[] = "--profile";
  char profileValue[] = "head-churn";
  char sizeFlag[] = "--size";
  char sizeValue[] = "4";
  char operationsFlag[] = "--operations";
  char operationsValue[] = "3";
  char jsonFlag[] = "--json";
  char *validArguments[]{program,   profileFlag,    profileValue,    sizeFlag,
                         sizeValue, operationsFlag, operationsValue, jsonFlag};
  const auto parsed = listlab::parseArguments(8, validArguments);
  require(parsed.profile == listlab::WorkloadProfile::HeadChurn,
          "profile must be parsed");
  require(parsed.initialSize == 4 && parsed.operations == 3 && parsed.json,
          "numeric and boolean options must be parsed");

  char zeroValue[] = "0";
  char *invalidSize[]{program, sizeFlag, zeroValue};
  requireThrows([&] { listlab::parseArguments(3, invalidSize); },
                "zero size must be rejected");

  char unknownFlag[] = "--mystery";
  char unknownValue[] = "1";
  char *invalidOption[]{program, unknownFlag, unknownValue};
  requireThrows([&] { listlab::parseArguments(3, invalidOption); },
                "unknown options must be rejected");

  auto oversized = smallConfig(listlab::WorkloadProfile::RandomRead);
  oversized.operations = 10000001;
  requireThrows([&] { listlab::runWorkload(oversized); },
                "programmatic configurations must enforce CLI limits");

  auto config = smallConfig(listlab::WorkloadProfile::HeadChurn);
  config.repetitions = 1;
  const std::string json = listlab::formatJson(listlab::runWorkload(config));
  require(json.find("\"reportVersion\":1") != std::string::npos,
          "JSON must be versioned");
  require(json.find("\"profile\":\"head-churn\"") != std::string::npos,
          "JSON must name the profile");
  require(json.find("\"equivalent\":true") != std::string::npos,
          "JSON must expose equivalence");
  require(json.find("\"elementMoves\"") != std::string::npos,
          "JSON must expose logical costs");
  require(json.find("\"estimatedStorageBytes\"") != std::string::npos,
          "JSON must expose the storage estimate");
}

} // namespace

int main(int argc, char **argv) {
  try {
    if (argc != 2)
      throw std::invalid_argument("expected one test group");
    const std::string group = argv[1];
    if (group == "semantic")
      semanticTest();
    else if (group == "accounting")
      accountingTest();
    else if (group == "validation")
      validationTest();
    else
      throw std::invalid_argument("unknown test group");
    return EXIT_SUCCESS;
  } catch (const std::exception &error) {
    std::cerr << error.what() << '\n';
    return EXIT_FAILURE;
  }
}
