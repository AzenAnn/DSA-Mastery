#include "linked_list.hpp"

#include <iostream>
#include <stdexcept>
#include <string>
#include <type_traits>
#include <vector>

namespace {

using listlab::LinkedList;
static_assert(!std::is_copy_constructible<LinkedList>::value,
              "linked list must not shallow-copy nodes");

template <typename Action> bool throwsOutOfRange(const Action &action) {
  try {
    action();
  } catch (const std::out_of_range &) {
    return true;
  }
  return false;
}

int contract() {
  LinkedList list;
  list.insert(0, 10);
  list.insert(1, 30);
  list.insert(1, 20);
  if (list.snapshot() != std::vector<int>({10, 20, 30}))
    return 1;
  list.set(1, 25);
  if (list.at(1) != 25 || list.find(30) != 2 || list.find(99) != -1)
    return 1;
  if (list.erase(1) != 25 || list.checksum() != 40)
    return 1;
  return list.snapshot() == std::vector<int>({10, 30}) ? 0 : 1;
}

int boundaries() {
  LinkedList list;
  if (!list.empty() || !list.invariantHolds())
    return 1;
  if (!throwsOutOfRange([&] { (void)list.at(0); }))
    return 1;
  if (!throwsOutOfRange([&] { (void)list.erase(0); }))
    return 1;
  if (!throwsOutOfRange([&] { list.insert(1, 7); }))
    return 1;
  list.insert(0, 5);
  list.insert(1, 5);
  if (list.find(5) != 0 || !throwsOutOfRange([&] { list.set(2, 1); }))
    return 1;
  return list.invariantHolds() && list.snapshot() == std::vector<int>({5, 5})
             ? 0
             : 1;
}

int bidirectionalLinks() {
  LinkedList list;
  list.resetMetrics();
  list.insert(0, 10);
  list.insert(1, 30);
  list.insert(1, 20);
  if (!list.invariantHolds())
    return 1;
  if (list.reverseSnapshot() != std::vector<int>({30, 20, 10}))
    return 1;
  if (list.erase(1) != 20 || !list.invariantHolds())
    return 1;
  const auto metrics = list.metrics();
  if (metrics.nodeAllocations != 3 || metrics.nodeDeallocations != 1)
    return 1;
  if (metrics.linkWrites != 14 || metrics.nodeHops != 1)
    return 1;
  if (list.reverseSnapshot() != std::vector<int>({30, 10}))
    return 1;

  list.resetMetrics();
  if (list.find(30) != 1 || list.find(99) != -1)
    return 1;
  const auto searchMetrics = list.metrics();
  return searchMetrics.valueComparisons == 4 && searchMetrics.nodeHops == 3 ? 0
                                                                            : 1;
}

int clearAndReuse() {
  LinkedList list;
  for (int value = 0; value < 40; ++value)
    list.insert(list.size() / 2, value);
  if (!list.invariantHolds())
    return 1;
  list.resetMetrics();
  list.clear();
  if (!list.empty() || !list.invariantHolds())
    return 1;
  if (list.metrics().nodeDeallocations != 40 || list.metrics().linkWrites != 80)
    return 1;
  list.insert(0, 7);
  return list.at(0) == 7 && list.invariantHolds() ? 0 : 1;
}

} // namespace

int main(int argc, char **argv) {
  if (argc != 2)
    return 2;
  const std::string name = argv[1];
  if (name == "contract")
    return contract();
  if (name == "boundaries")
    return boundaries();
  if (name == "bidirectional-links")
    return bidirectionalLinks();
  if (name == "clear-and-reuse")
    return clearAndReuse();
  std::cerr << "unknown linked-list test\n";
  return 2;
}
