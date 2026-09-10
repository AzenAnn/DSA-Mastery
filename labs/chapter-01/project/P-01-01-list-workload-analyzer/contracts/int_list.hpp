#pragma once

#include <cstddef>
#include <cstdint>
#include <vector>

namespace listlab {

struct CostMetrics {
  std::uint64_t elementMoves{};
  std::uint64_t nodeHops{};
  std::uint64_t bufferReallocations{};
  std::uint64_t nodeAllocations{};
  std::uint64_t nodeDeallocations{};
  std::uint64_t linkWrites{};
  std::uint64_t valueComparisons{};
};

class IntList {
public:
  virtual ~IntList() = default;
  virtual std::size_t size() const noexcept = 0;
  virtual bool empty() const noexcept = 0;
  virtual int at(std::size_t index) const = 0;
  virtual void set(std::size_t index, int value) = 0;
  virtual void insert(std::size_t index, int value) = 0;
  virtual int erase(std::size_t index) = 0;
  virtual int find(int value) const noexcept = 0;
  virtual long long checksum() const noexcept = 0;
  virtual void clear() noexcept = 0;
};

class InstrumentedList : public IntList {
public:
  virtual CostMetrics metrics() const noexcept = 0;
  virtual void resetMetrics() noexcept = 0;
  virtual std::size_t estimatedStorageBytes() const noexcept = 0;
  virtual std::vector<int> snapshot() const = 0;
};

} // namespace listlab
