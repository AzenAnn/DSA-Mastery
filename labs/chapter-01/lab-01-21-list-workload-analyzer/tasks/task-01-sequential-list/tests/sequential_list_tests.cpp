#include "sequential_list.hpp"

#include <iostream>
#include <stdexcept>
#include <string>
#include <type_traits>
#include <vector>

namespace {

using listlab::SequentialList;
static_assert(!std::is_copy_constructible<SequentialList>::value,
              "sequential list must not copy owned storage");
static_assert(!std::is_move_constructible<SequentialList>::value,
              "move semantics are outside this task's ownership contract");

template <typename Action> bool throwsOutOfRange(const Action &action) {
  try {
    action();
  } catch (const std::out_of_range &) {
    return true;
  }
  return false;
}

int contract() {
  SequentialList list;
  list.insert(0, 10);
  list.insert(1, 30);
  list.insert(1, 20);
  if (list.snapshot() != std::vector<int>({10, 20, 30}))
    return 1;
  list.set(1, 25);
  if (list.at(1) != 25 || list.find(30) != 2 || list.find(99) != -1)
    return 1;
  if (list.checksum() != 65 || list.erase(1) != 25)
    return 1;
  return list.snapshot() == std::vector<int>({10, 30}) ? 0 : 1;
}

int boundaries() {
  SequentialList list;
  if (!list.empty() || list.size() != 0)
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
  return list.snapshot() == std::vector<int>({5, 5}) ? 0 : 1;
}

int resize() {
  SequentialList list;
  for (int value = 0; value < 8; ++value)
    list.insert(list.size(), value);
  list.resetMetrics();
  list.insert(list.size(), 8);
  if (list.capacity() != 16)
    return 1;
  auto metrics = list.metrics();
  if (metrics.elementMoves != 8 || metrics.bufferReallocations != 1)
    return 1;
  while (list.size() > 4)
    (void)list.erase(list.size() - 1);
  if (list.capacity() != 8)
    return 1;
  metrics = list.metrics();
  if (metrics.elementMoves != 12 || metrics.bufferReallocations != 2)
    return 1;

  list.clear();
  for (int value = 0; value < 8; ++value)
    list.insert(list.size(), value);
  list.resetMetrics();
  for (int round = 0; round < 4; ++round) {
    list.insert(list.size(), round);
    (void)list.erase(list.size() - 1);
  }
  if (list.metrics().bufferReallocations != 1 || list.capacity() != 16)
    return 1;

  list.resetMetrics();
  if (list.find(7) != 7 || list.find(99) != -1)
    return 1;
  return list.metrics().valueComparisons == 16 ? 0 : 1;
}

int invariants() {
  SequentialList list;
  for (int value = 0; value < 40; ++value) {
    list.insert(list.size() / 2, value);
    if (!list.invariantHolds())
      return 1;
  }
  while (!list.empty()) {
    (void)list.erase(list.size() / 2);
    if (!list.invariantHolds())
      return 1;
  }
  for (int value = 0; value < 40; ++value)
    list.insert(list.size(), value);
  const std::size_t retainedCapacity = list.capacity();
  list.resetMetrics();
  list.clear();
  if (!list.empty() || list.capacity() != retainedCapacity ||
      list.metrics().bufferReallocations != 0)
    return 1;
  list.insert(0, 7);
  return list.invariantHolds() && list.at(0) == 7 ? 0 : 1;
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
  if (name == "resize")
    return resize();
  if (name == "invariants")
    return invariants();
  std::cerr << "unknown sequential-list test\n";
  return 2;
}
