#include <iostream>
using namespace std;
struct Node {
  long long value{};
  Node *next = nullptr;
};

Node *reverselink(Node *head) {
  // TODO: 逆置单链表 head，返回新头节点。
  // 要求：O(n) 时间，O(1) 额外空间，迭代实现（prev/curr/next 三指针）。
  return head;
}

int main() {
  // TODO: 读入链表，逆置后输出。
  // 要求：O(n) 时间，O(1) 额外空间，迭代实现。
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
      tail = n;
    }
  }
  Node *newnode = reverselink(head);
  while (newnode != nullptr) {
    cout << newnode->value;
    if (newnode->next != nullptr) {
      cout << ' ';
    }
    newnode = newnode->next;
  }
  cout << endl;
  return 0;
}
