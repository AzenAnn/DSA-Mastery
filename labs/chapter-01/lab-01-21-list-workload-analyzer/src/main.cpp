#include "workload.hpp"

#include <exception>
#include <iostream>

int main(int argc, char **argv) {
  try {
    const listlab::WorkloadConfig config = listlab::parseArguments(argc, argv);
    const listlab::WorkloadReport report = listlab::runWorkload(config);
    std::cout << (config.json ? listlab::formatJson(report)
                              : listlab::formatHuman(report))
              << '\n';
    return report.equivalent ? 0 : 1;
  } catch (const std::exception &error) {
    std::cerr << "error: " << error.what() << '\n';
    return 2;
  }
}
