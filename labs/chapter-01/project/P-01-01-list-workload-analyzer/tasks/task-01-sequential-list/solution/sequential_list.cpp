#include "sequential_list.hpp"

#include <stdexcept>

namespace listlab {

SequentialList::SequentialList()
    : data_(std::make_unique<int[]>(kMinimumCapacity)) {}

std::size_t SequentialList::size() const noexcept { return size_; }
bool SequentialList::empty() const noexcept { return size_ == 0; }

void SequentialList::requireExisting(std::size_t index) const {
  if (index >= size_)
    throw std::out_of_range("list index out of range");
}

void SequentialList::requireInsertPosition(std::size_t index) const {
  if (index > size_)
    throw std::out_of_range("list insert position out of range");
}

int SequentialList::at(std::size_t index) const {
  requireExisting(index);
  return data_[index];
}

void SequentialList::set(std::size_t index, int value) {
  requireExisting(index);
  data_[index] = value;
}

void SequentialList::reallocate(std::size_t newCapacity) {
  auto replacement = std::make_unique<int[]>(newCapacity);
  for (std::size_t index = 0; index < size_; ++index) {
    replacement[index] = data_[index];
    ++metrics_.elementMoves;
  }
  data_ = std::move(replacement);
  capacity_ = newCapacity;
  ++metrics_.bufferReallocations;
}

void SequentialList::growIfFull() {
  if (size_ == capacity_)
    reallocate(capacity_ * 2);
}

void SequentialList::shrinkIfSparse() {
  if (capacity_ > kMinimumCapacity && size_ <= capacity_ / 4) {
    reallocate(capacity_ / 2);
  }
}

void SequentialList::insert(std::size_t index, int value) {
  requireInsertPosition(index);
  growIfFull();
  for (std::size_t cursor = size_; cursor > index; --cursor) {
    data_[cursor] = data_[cursor - 1];
    ++metrics_.elementMoves;
  }
  data_[index] = value;
  ++size_;
}

int SequentialList::erase(std::size_t index) {
  requireExisting(index);
  const int removed = data_[index];
  for (std::size_t cursor = index + 1; cursor < size_; ++cursor) {
    data_[cursor - 1] = data_[cursor];
    ++metrics_.elementMoves;
  }
  --size_;
  shrinkIfSparse();
  return removed;
}

int SequentialList::find(int value) const noexcept {
  for (std::size_t index = 0; index < size_; ++index) {
    ++metrics_.valueComparisons;
    if (data_[index] == value)
      return static_cast<int>(index);
  }
  return -1;
}

long long SequentialList::checksum() const noexcept {
  long long total = 0;
  for (std::size_t index = 0; index < size_; ++index)
    total += data_[index];
  return total;
}

void SequentialList::clear() noexcept { size_ = 0; }

CostMetrics SequentialList::metrics() const noexcept { return metrics_; }
void SequentialList::resetMetrics() noexcept { metrics_ = {}; }
std::size_t SequentialList::estimatedStorageBytes() const noexcept {
  return sizeof(SequentialList) + capacity_ * sizeof(int);
}

std::vector<int> SequentialList::snapshot() const {
  return std::vector<int>(data_.get(), data_.get() + size_);
}

std::size_t SequentialList::capacity() const noexcept { return capacity_; }

bool SequentialList::invariantHolds() const noexcept {
  return data_ != nullptr && capacity_ >= kMinimumCapacity &&
         size_ <= capacity_;
}

} // namespace listlab
