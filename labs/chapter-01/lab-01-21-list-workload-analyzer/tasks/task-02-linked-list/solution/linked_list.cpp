#include "linked_list.hpp"

#include <stdexcept>

namespace listlab {

LinkedList::LinkedList() {
  sentinel_.next = &sentinel_;
  sentinel_.prev = &sentinel_;
}

LinkedList::~LinkedList() { destroyAll(false); }
std::size_t LinkedList::size() const noexcept { return size_; }
bool LinkedList::empty() const noexcept { return size_ == 0; }

void LinkedList::requireExisting(std::size_t index) const {
  if (index >= size_)
    throw std::out_of_range("list index out of range");
}

void LinkedList::requireInsertPosition(std::size_t index) const {
  if (index > size_)
    throw std::out_of_range("list insert position out of range");
}

const LinkedList::Node *LinkedList::nodeAt(std::size_t index) const {
  requireExisting(index);
  if (index < size_ / 2) {
    const Node *cursor = sentinel_.next;
    for (std::size_t position = 0; position < index; ++position) {
      cursor = cursor->next;
      ++metrics_.nodeHops;
    }
    return cursor;
  }
  const Node *cursor = sentinel_.prev;
  for (std::size_t position = size_ - 1; position > index; --position) {
    cursor = cursor->prev;
    ++metrics_.nodeHops;
  }
  return cursor;
}

LinkedList::Node *LinkedList::nodeAt(std::size_t index) {
  return const_cast<Node *>(
      static_cast<const LinkedList *>(this)->nodeAt(index));
}

int LinkedList::at(std::size_t index) const { return nodeAt(index)->value; }
void LinkedList::set(std::size_t index, int value) {
  nodeAt(index)->value = value;
}

void LinkedList::linkBetween(Node *left, Node *right, int value) {
  Node *node = new Node{value, left, right};
  ++metrics_.nodeAllocations;
  metrics_.linkWrites += 2;
  left->next = node;
  right->prev = node;
  metrics_.linkWrites += 2;
  ++size_;
}

void LinkedList::insert(std::size_t index, int value) {
  requireInsertPosition(index);
  Node *right = index == size_ ? &sentinel_ : nodeAt(index);
  linkBetween(right->prev, right, value);
}

int LinkedList::unlink(Node *target) noexcept {
  const int removed = target->value;
  target->prev->next = target->next;
  target->next->prev = target->prev;
  metrics_.linkWrites += 2;
  delete target;
  ++metrics_.nodeDeallocations;
  --size_;
  return removed;
}

int LinkedList::erase(std::size_t index) {
  requireExisting(index);
  return unlink(nodeAt(index));
}

int LinkedList::find(int value) const noexcept {
  const Node *cursor = sentinel_.next;
  std::size_t index = 0;
  while (cursor != &sentinel_) {
    ++metrics_.valueComparisons;
    if (cursor->value == value)
      return static_cast<int>(index);
    cursor = cursor->next;
    ++metrics_.nodeHops;
    ++index;
  }
  return -1;
}

long long LinkedList::checksum() const noexcept {
  long long total = 0;
  const Node *cursor = sentinel_.next;
  while (cursor != &sentinel_) {
    total += cursor->value;
    cursor = cursor->next;
    ++metrics_.nodeHops;
  }
  return total;
}

void LinkedList::destroyAll(bool recordMetrics) noexcept {
  if (recordMetrics) {
    while (size_ != 0)
      (void)unlink(sentinel_.next);
    return;
  }
  Node *cursor = sentinel_.next;
  while (cursor != &sentinel_) {
    Node *next = cursor->next;
    delete cursor;
    cursor = next;
  }
  sentinel_.next = &sentinel_;
  sentinel_.prev = &sentinel_;
  size_ = 0;
}

void LinkedList::clear() noexcept { destroyAll(true); }
CostMetrics LinkedList::metrics() const noexcept { return metrics_; }
void LinkedList::resetMetrics() noexcept { metrics_ = {}; }
std::size_t LinkedList::estimatedStorageBytes() const noexcept {
  return sizeof(LinkedList) + size_ * sizeof(Node);
}

std::vector<int> LinkedList::snapshot() const {
  std::vector<int> values;
  values.reserve(size_);
  for (const Node *cursor = sentinel_.next; cursor != &sentinel_;
       cursor = cursor->next)
    values.push_back(cursor->value);
  return values;
}

std::vector<int> LinkedList::reverseSnapshot() const {
  std::vector<int> values;
  values.reserve(size_);
  for (const Node *cursor = sentinel_.prev; cursor != &sentinel_;
       cursor = cursor->prev)
    values.push_back(cursor->value);
  return values;
}

bool LinkedList::invariantHolds() const noexcept {
  if (sentinel_.next == nullptr || sentinel_.prev == nullptr)
    return false;
  if (sentinel_.next->prev != &sentinel_ || sentinel_.prev->next != &sentinel_)
    return false;
  std::size_t forward = 0;
  for (const Node *cursor = sentinel_.next; cursor != &sentinel_;
       cursor = cursor->next) {
    if (cursor == nullptr || cursor->next == nullptr || cursor->prev == nullptr)
      return false;
    if (cursor->next->prev != cursor || cursor->prev->next != cursor)
      return false;
    if (++forward > size_)
      return false;
  }
  std::size_t backward = 0;
  for (const Node *cursor = sentinel_.prev; cursor != &sentinel_;
       cursor = cursor->prev) {
    if (++backward > size_)
      return false;
  }
  return forward == size_ && backward == size_;
}

} // namespace listlab
