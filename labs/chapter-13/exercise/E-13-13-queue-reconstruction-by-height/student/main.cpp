#include <iostream>
#include <iterator>
#include <string>

int main() {
  std::string input((std::istreambuf_iterator<char>(std::cin)), {});
  std::cout << "0\n";
}
