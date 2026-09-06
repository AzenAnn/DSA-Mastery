#pragma once

#include "int_list.hpp"

#include <cstddef>

namespace listlab {

class LinkedList final : public InstrumentedList {
public:
  LinkedList();
  ~LinkedList() override;
  LinkedList(const LinkedList &) = delete;
  LinkedList &operator=(const LinkedList &) = delete;
  LinkedList(LinkedList &&) = delete;
  LinkedList &operator=(LinkedList &&) = delete;

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

  std::vector<int> reverseSnapshot() const;
  bool invariantHolds() const noexcept;

private:
  struct Node {
    int value{};
    Node *prev{};
    Node *next{};
  };

  Node *nodeAt(std::size_t index);
  const Node *nodeAt(std::size_t index) const;
  void requireExisting(std::size_t index) const;
  void requireInsertPosition(std::size_t index) const;
  void linkBetween(Node *left, Node *right, int value);
  int unlink(Node *target) noexcept;
  void destroyAll(bool recordMetrics) noexcept;

  Node sentinel_{};
  std::size_t size_{};
  mutable CostMetrics metrics_{};
};

} // namespace listlab
