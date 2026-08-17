#pragma once

#include <map>
#include <string>

namespace huffman {

using CodeTable = std::map<char, std::string>;

CodeTable build_codes(const std::string& text);
std::string encode(const std::string& text, const CodeTable& codes);
std::string decode(const std::string& bits, const CodeTable& codes);

}  // namespace huffman
