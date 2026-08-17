#include "huffman.hpp"

#include <iostream>
#include <string>

namespace {

bool prefix_free(const huffman::CodeTable& codes) {
    for (const auto& [left_symbol, left] : codes) {
        for (const auto& [right_symbol, right] : codes) {
            if (left_symbol != right_symbol && right.rfind(left, 0) == 0) return false;
        }
    }
    return true;
}

int round_trip() {
    const std::string text = "banana bandana";
    const auto codes = huffman::build_codes(text);
    return !codes.empty() && huffman::decode(huffman::encode(text, codes), codes) == text ? 0 : 1;
}

int edge_cases() {
    const auto empty = huffman::build_codes("");
    if (!empty.empty() || !huffman::encode("", empty).empty() || !huffman::decode("", empty).empty()) return 1;
    const std::string repeated = "zzzzz";
    const auto single = huffman::build_codes(repeated);
    if (single.size() != 1 || single.at('z') != "0") return 1;
    return huffman::decode(huffman::encode(repeated, single), single) == repeated ? 0 : 1;
}

int prefix_property() {
    const auto codes = huffman::build_codes("aaaaabbbccd");
    if (!prefix_free(codes) || codes.size() != 4) return 1;
    return codes.at('a').size() <= codes.at('d').size() ? 0 : 1;
}

}  // namespace

int main(int argc, char** argv) {
    if (argc != 2) return 2;
    const std::string test = argv[1];
    if (test == "round-trip") return round_trip();
    if (test == "edge-cases") return edge_cases();
    if (test == "prefix-property") return prefix_property();
    std::cerr << "unknown test\n";
    return 2;
}
