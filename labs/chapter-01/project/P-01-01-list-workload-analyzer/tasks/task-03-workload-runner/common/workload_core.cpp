#include "workload.hpp"

#include "linked_list.hpp"
#include "sequential_list.hpp"

#include <algorithm>
#include <chrono>
#include <cstdint>
#include <limits>
#include <sstream>
#include <stdexcept>
#include <string>

namespace listlab {
namespace {

constexpr std::size_t kMaximumInitialSize = 1000000;
constexpr std::size_t kMaximumOperations = 10000000;
constexpr std::size_t kMaximumWarmup = 100;
constexpr std::size_t kMaximumRepetitions = 100;

class XorShift32 {
public:
  explicit XorShift32(std::uint32_t seed)
      : state_(seed == 0 ? 0x9e3779b9U : seed) {}

  std::uint32_t next() noexcept {
    state_ ^= state_ << 13U;
    state_ ^= state_ >> 17U;
    state_ ^= state_ << 5U;
    return state_;
  }

private:
  std::uint32_t state_;
};

std::size_t parseSize(const std::string &text, const char *option,
                      std::size_t maximum) {
  if (text.empty() || text.front() == '-') {
    throw std::invalid_argument(std::string(option) +
                                " expects a non-negative integer");
  }
  std::size_t consumed = 0;
  unsigned long long value = 0;
  try {
    value = std::stoull(text, &consumed);
  } catch (const std::exception &) {
    throw std::invalid_argument(std::string(option) + " expects an integer");
  }
  if (consumed != text.size() || value > maximum) {
    throw std::invalid_argument(std::string(option) +
                                " is outside the supported range");
  }
  return static_cast<std::size_t>(value);
}

void validateConfig(const WorkloadConfig &config) {
  if (config.initialSize == 0 || config.initialSize > kMaximumInitialSize) {
    throw std::invalid_argument("--size must be between 1 and 1000000");
  }
  if (config.operations == 0 || config.operations > kMaximumOperations) {
    throw std::invalid_argument("--operations must be between 1 and 10000000");
  }
  if (config.warmup > kMaximumWarmup) {
    throw std::invalid_argument("--warmup must be between 0 and 100");
  }
  if (config.repetitions == 0 || config.repetitions > kMaximumRepetitions) {
    throw std::invalid_argument("--repetitions must be between 1 and 100");
  }
}

long long sumValues(const std::vector<int> &values) noexcept {
  long long total = 0;
  for (int value : values) {
    total += value;
  }
  return total;
}

long long median(std::vector<long long> values) {
  std::sort(values.begin(), values.end());
  const std::size_t middle = values.size() / 2;
  if (values.size() % 2 == 1) {
    return values[middle];
  }
  return values[middle - 1] + (values[middle] - values[middle - 1]) / 2;
}

long long executeProfile(InstrumentedList &list, const WorkloadConfig &config,
                         std::uint32_t seed) {
  XorShift32 random(seed);
  long long observed = 0;

  for (std::size_t operation = 0; operation < config.operations; ++operation) {
    const int value = static_cast<int>(random.next() & 0x7fffffffU);
    switch (config.profile) {
    case WorkloadProfile::RandomRead: {
      const std::size_t index = random.next() % list.size();
      observed += list.at(index);
      break;
    }
    case WorkloadProfile::HeadChurn:
      list.insert(0, value);
      observed += list.erase(0);
      break;
    case WorkloadProfile::MiddleChurn: {
      const std::size_t index = list.size() / 2;
      list.insert(index, value);
      observed += list.erase(index);
      break;
    }
    case WorkloadProfile::TailChurn:
      list.insert(list.size(), value);
      observed += list.erase(list.size() - 1);
      break;
    case WorkloadProfile::LinearScan:
      observed += list.checksum();
      break;
    }
  }
  return observed;
}

bool validateLockstep(const WorkloadConfig &config, std::uint32_t seed) {
  SequentialList sequential;
  LinkedList linked;
  for (std::size_t index = 0; index < config.initialSize; ++index) {
    sequential.insert(sequential.size(), static_cast<int>(index));
    linked.insert(linked.size(), static_cast<int>(index));
  }

  XorShift32 random(seed);
  for (std::size_t operation = 0; operation < config.operations; ++operation) {
    const int value = static_cast<int>(random.next() & 0x7fffffffU);
    switch (config.profile) {
    case WorkloadProfile::RandomRead: {
      const std::size_t index = random.next() % sequential.size();
      if (sequential.at(index) != linked.at(index))
        return false;
      break;
    }
    case WorkloadProfile::HeadChurn:
      sequential.insert(0, value);
      linked.insert(0, value);
      if (sequential.erase(0) != linked.erase(0))
        return false;
      break;
    case WorkloadProfile::MiddleChurn: {
      const std::size_t index = sequential.size() / 2;
      sequential.insert(index, value);
      linked.insert(index, value);
      if (sequential.erase(index) != linked.erase(index))
        return false;
      break;
    }
    case WorkloadProfile::TailChurn:
      sequential.insert(sequential.size(), value);
      linked.insert(linked.size(), value);
      if (sequential.erase(sequential.size() - 1) !=
          linked.erase(linked.size() - 1))
        return false;
      break;
    case WorkloadProfile::LinearScan:
      if (sequential.checksum() != linked.checksum())
        return false;
      break;
    }
    if (sequential.size() != linked.size())
      return false;
  }
  return sequential.snapshot() == linked.snapshot();
}

template <typename List>
ImplementationResult runImplementation(const char *name,
                                       const WorkloadConfig &config) {
  ImplementationResult result;
  result.name = name;
  const std::size_t totalRuns = config.warmup + config.repetitions;

  for (std::size_t run = 0; run < totalRuns; ++run) {
    List list;
    for (std::size_t index = 0; index < config.initialSize; ++index) {
      list.insert(list.size(), static_cast<int>(index));
    }
    list.resetMetrics();

    const auto start = std::chrono::steady_clock::now();
    const long long observed = executeProfile(list, config, config.seed);
    const auto finish = std::chrono::steady_clock::now();

    if (run < config.warmup) {
      continue;
    }

    const long long elapsed =
        std::chrono::duration_cast<std::chrono::nanoseconds>(finish - start)
            .count();
    result.timingsNs.push_back(elapsed);
    if (result.timingsNs.size() == 1) {
      result.metrics = list.metrics();
      result.estimatedStorageBytes = list.estimatedStorageBytes();
      result.observedValueSum = observed;
      result.finalValues = list.snapshot();
      result.checksum = sumValues(result.finalValues);
    }
  }

  result.medianNs = median(result.timingsNs);
  return result;
}

bool sameOutcome(const ImplementationResult &left,
                 const ImplementationResult &right) {
  return left.checksum == right.checksum &&
         left.observedValueSum == right.observedValueSum &&
         left.finalValues == right.finalValues;
}

void appendMetrics(std::ostringstream &output, const CostMetrics &metrics) {
  output << "moves=" << metrics.elementMoves << ", hops=" << metrics.nodeHops
         << ", reallocations=" << metrics.bufferReallocations
         << ", allocations=" << metrics.nodeAllocations
         << ", deallocations=" << metrics.nodeDeallocations
         << ", link-writes=" << metrics.linkWrites
         << ", comparisons=" << metrics.valueComparisons;
}

} // namespace

std::string profileName(WorkloadProfile profile) {
  switch (profile) {
  case WorkloadProfile::RandomRead:
    return "random-read";
  case WorkloadProfile::HeadChurn:
    return "head-churn";
  case WorkloadProfile::MiddleChurn:
    return "middle-churn";
  case WorkloadProfile::TailChurn:
    return "tail-churn";
  case WorkloadProfile::LinearScan:
    return "linear-scan";
  }
  throw std::invalid_argument("unknown workload profile");
}

WorkloadProfile parseProfile(const std::string &name) {
  if (name == "random-read")
    return WorkloadProfile::RandomRead;
  if (name == "head-churn")
    return WorkloadProfile::HeadChurn;
  if (name == "middle-churn")
    return WorkloadProfile::MiddleChurn;
  if (name == "tail-churn")
    return WorkloadProfile::TailChurn;
  if (name == "linear-scan")
    return WorkloadProfile::LinearScan;
  throw std::invalid_argument("unknown profile: " + name);
}

WorkloadConfig parseArguments(int argc, char **argv) {
  WorkloadConfig config;
  for (int index = 1; index < argc; ++index) {
    const std::string option = argv[index];
    if (option == "--json") {
      config.json = true;
      continue;
    }
    if (index + 1 >= argc) {
      throw std::invalid_argument("missing value for " + option);
    }
    const std::string value = argv[++index];
    if (option == "--profile") {
      config.profile = parseProfile(value);
    } else if (option == "--size") {
      config.initialSize = parseSize(value, "--size", kMaximumInitialSize);
    } else if (option == "--operations" || option == "--ops") {
      config.operations = parseSize(value, "--operations", kMaximumOperations);
    } else if (option == "--seed") {
      config.seed = static_cast<std::uint32_t>(parseSize(
          value, "--seed", std::numeric_limits<std::uint32_t>::max()));
    } else if (option == "--warmup") {
      config.warmup = parseSize(value, "--warmup", kMaximumWarmup);
    } else if (option == "--repetitions") {
      config.repetitions =
          parseSize(value, "--repetitions", kMaximumRepetitions);
    } else {
      throw std::invalid_argument("unknown option: " + option);
    }
  }

  validateConfig(config);
  return config;
}

WorkloadReport runWorkload(const WorkloadConfig &config) {
  validateConfig(config);

  WorkloadReport report;
  report.config = config;
  report.sequential =
      runImplementation<SequentialList>("sequential-list", config);
  report.linked = runImplementation<LinkedList>("linked-list", config);
  // Keep correctness validation outside the measured interval and compare every
  // observable result.
  report.equivalent = sameOutcome(report.sequential, report.linked) &&
                      validateLockstep(config, config.seed);
  return report;
}

std::string formatHuman(const WorkloadReport &report) {
  std::ostringstream output;
  output << "Profile: " << profileName(report.config.profile)
         << " | size=" << report.config.initialSize
         << " | operations=" << report.config.operations
         << " | seed=" << report.config.seed
         << " | repetitions=" << report.config.repetitions << '\n';
  output << "Semantic equivalence: " << (report.equivalent ? "PASS" : "FAIL")
         << "\n\n";

  for (const ImplementationResult *result :
       {&report.sequential, &report.linked}) {
    output << result->name << '\n';
    output << "  median: " << result->medianNs << " ns\n";
    output << "  estimated storage: " << result->estimatedStorageBytes
           << " bytes\n";
    output << "  logical cost: ";
    appendMetrics(output, result->metrics);
    output << "\n  checksum: " << result->checksum
           << " | observed sum: " << result->observedValueSum << "\n";
  }
  return output.str();
}

} // namespace listlab
