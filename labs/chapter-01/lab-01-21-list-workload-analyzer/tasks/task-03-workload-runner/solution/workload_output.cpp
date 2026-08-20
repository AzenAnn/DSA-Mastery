#include "workload.hpp"

#include <sstream>

namespace listlab {
namespace {

void appendMetricsJson(std::ostringstream &output, const CostMetrics &metrics) {
  output << "{\"elementMoves\":" << metrics.elementMoves
         << ",\"nodeHops\":" << metrics.nodeHops
         << ",\"bufferReallocations\":" << metrics.bufferReallocations
         << ",\"nodeAllocations\":" << metrics.nodeAllocations
         << ",\"nodeDeallocations\":" << metrics.nodeDeallocations
         << ",\"linkWrites\":" << metrics.linkWrites
         << ",\"valueComparisons\":" << metrics.valueComparisons << '}';
}

void appendResultJson(std::ostringstream &output,
                      const ImplementationResult &result) {
  output << "{\"name\":\"" << result.name
         << "\",\"medianNs\":" << result.medianNs << ",\"timingsNs\":[";
  for (std::size_t index = 0; index < result.timingsNs.size(); ++index) {
    if (index != 0)
      output << ',';
    output << result.timingsNs[index];
  }
  output << "],\"estimatedStorageBytes\":" << result.estimatedStorageBytes
         << ",\"checksum\":" << result.checksum
         << ",\"observedValueSum\":" << result.observedValueSum
         << ",\"metrics\":";
  appendMetricsJson(output, result.metrics);
  output << '}';
}

} // namespace

std::string formatJson(const WorkloadReport &report) {
  std::ostringstream output;
  output << "{\"reportVersion\":1,\"profile\":\""
         << profileName(report.config.profile)
         << "\",\"config\":{\"initialSize\":" << report.config.initialSize
         << ",\"operations\":" << report.config.operations
         << ",\"seed\":" << report.config.seed
         << ",\"warmup\":" << report.config.warmup
         << ",\"repetitions\":" << report.config.repetitions
         << "},\"equivalent\":" << (report.equivalent ? "true" : "false")
         << ",\"implementations\":[";
  appendResultJson(output, report.sequential);
  output << ',';
  appendResultJson(output, report.linked);
  output << "]}";
  return output.str();
}

} // namespace listlab
