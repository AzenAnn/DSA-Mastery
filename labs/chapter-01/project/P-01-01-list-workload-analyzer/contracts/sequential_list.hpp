#pragma once

#include "int_list.hpp"

#include <cstddef>
#include <memory>

namespace listlab {

class SequentialList final : public InstrumentedList {
public:
  static constexpr std::size_t kMinimumCapacity = 8;

  SequentialList();
  ~SequentialList() override = default;
  SequentialList(const SequentialList &) = delete;
  SequentialList &operator=(const SequentialList &) = delete;
  SequentialList(SequentialList &&) = delete;
  SequentialList &operator=(SequentialList &&) = delete;

  std::size_t size() const noexcept override;
  bool empty() const noexcept override;
  int at(std::size_t index) const override;
  void set(std::size_t index, int value) override;
  void insert(std::size_t index, int value) override;
  int erase(std::size_t index) override;
  int find(int value) const noexcept override;
  long long checksum() const noexcept override;
  void clear() noexcept override;
  CostMetrics metrics() const noexcept override;
  void resetMetrics() noexcept override;
  std::size_t estimatedStorageBytes() const noexcept override;
  std::vector<int> snapshot() const override;

  std::size_t capacity() const noexcept;
  bool invariantHolds() const noexcept;

private:
  void requireExisting(std::size_t index) const;
  void requireInsertPosition(std::size_t index) const;
  void reallocate(std::size_t newCapacity);
  void growIfFull();
  void shrinkIfSparse();

  std::unique_ptr<int[]> data_;
  std::size_t size_{};
  std::size_t capacity_{kMinimumCapacity};
  mutable CostMetrics metrics_{};
};

} // namespace listlab
