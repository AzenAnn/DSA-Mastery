#include <iostream>
using namespace std;

struct Node {
  long long value{};
  Node *next = nullptr;
};

Node *deletekth(Node *head, int k) {
  Node dummy = Node{0, head};
  Node *fast = &dummy;
  Node *slow = &dummy;

  for (int i = 0; i < k; i++) {
    fast = fast->next;
  }

  while (fast->next != nullptr) {
    slow = slow->next;
    fast = fast->next;
  }
  Node *temp = slow->next;
  slow->next = slow->next->next;
  delete temp;
  /*if(cur->next!=nullptr){
      nxt=cur->next;

  }*/
  return dummy.next;
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
