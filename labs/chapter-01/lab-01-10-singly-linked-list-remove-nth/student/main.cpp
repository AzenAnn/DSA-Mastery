#include <iostream>
using namespace std;

struct Node {
  long long value{};
  Node *next = nullptr;
};

Node *deletekth(Node *head, int k) {
  // TODO: 删除单链表 head 的倒数第 k 个节点，返回新头节点。
  // 要求：只遍历一次链表，O(1) 额外空间（dummy 头 + fast/slow 双指针）。
  (void)k;
  return head;
}

int main() {
  // TODO: 读入链表和 k，删除倒数第 k 个节点后输出。
  // 要求：只遍历一次链表，O(1) 额外空间。
  int n;
  cin >> n;
  Node *head = nullptr;
  Node *tail = nullptr;
  for (int i = 0; i < n; i++) {
    int a;
    cin >> a;
    Node *n = new Node{a, nullptr};
    if (head == nullptr) {
      head = n;
      tail = n;
    } else {
      tail->next = n;
      tail = tail->next;
    }
  }
  int k;
  cin >> k;
  Node *nh = deletekth(head, k);
  while (nh != nullptr) {
    cout << nh->value;
    if (nh->next != nullptr) {
      cout << ' ';
    }
    nh = nh->next;
  }
  cout << endl;
  return 0;
}
