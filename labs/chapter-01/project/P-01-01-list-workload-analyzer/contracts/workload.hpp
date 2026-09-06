#pragma once

#include "int_list.hpp"

#include <cstddef>
#include <cstdint>
#include <string>
#include <vector>

namespace listlab {

enum class WorkloadProfile {
  RandomRead,
  HeadChurn,
  MiddleChurn,
  TailChurn,
  LinearScan
};

struct WorkloadConfig {
  WorkloadProfile profile{WorkloadProfile::RandomRead};
  std::size_t initialSize{4096};
  std::size_t operations{2000};
  std::uint32_t seed{42};
  std::size_t warmup{1};
  std::size_t repetitions{7};
  bool json{};
};

struct ImplementationResult {
  std::string name;
  CostMetrics metrics{};
  std::size_t estimatedStorageBytes{};
  long long checksum{};
  long long observedValueSum{};
  std::vector<long long> timingsNs;
  long long medianNs{};
  std::vector<int> finalValues;
};

struct WorkloadReport {
  WorkloadConfig config{};
  bool equivalent{};
  ImplementationResult sequential;
  ImplementationResult linked;
};

std::string profileName(WorkloadProfile profile);
WorkloadProfile parseProfile(const std::string &name);
WorkloadConfig parseArguments(int argc, char **argv);
WorkloadReport runWorkload(const WorkloadConfig &config);
std::string formatHuman(const WorkloadReport &report);
std::string formatJson(const WorkloadReport &report);

} // namespace listlab
