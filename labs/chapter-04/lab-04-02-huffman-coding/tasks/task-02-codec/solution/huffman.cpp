#include "huffman.hpp"

#include <memory>
#include <queue>
#include <stdexcept>
#include <unordered_map>
#include <utility>
#include <vector>

namespace huffman {
namespace {

struct Node {
    char symbol{};
    std::size_t frequency{};
    char minimum_symbol{};
    std::shared_ptr<Node> left;
    std::shared_ptr<Node> right;

    bool leaf() const { return !left && !right; }
};

struct Later {
    bool operator()(const std::shared_ptr<Node>& first, const std::shared_ptr<Node>& second) const {
        if (first->frequency != second->frequency) return first->frequency > second->frequency;
        return first->minimum_symbol > second->minimum_symbol;
    }
};

void collect(const std::shared_ptr<Node>& node, std::string prefix, CodeTable& codes) {
    if (node->leaf()) {
        codes[node->symbol] = prefix.empty() ? "0" : std::move(prefix);
        return;
    }
    collect(node->left, prefix + '0', codes);
    collect(node->right, prefix + '1', codes);
}

}  // namespace

CodeTable build_codes(const std::string& text) {
    std::map<char, std::size_t> frequencies;
    for (char symbol : text) ++frequencies[symbol];
    std::priority_queue<std::shared_ptr<Node>, std::vector<std::shared_ptr<Node>>, Later> queue;
    for (const auto& [symbol, frequency] : frequencies) {
        queue.push(std::make_shared<Node>(Node{symbol, frequency, symbol, nullptr, nullptr}));
    }
    if (queue.empty()) return {};
    while (queue.size() > 1) {
        auto left = queue.top();
        queue.pop();
        auto right = queue.top();
        queue.pop();
        queue.push(std::make_shared<Node>(Node{
            {}, left->frequency + right->frequency,
            std::min(left->minimum_symbol, right->minimum_symbol), left, right,
        }));
    }
    CodeTable codes;
    collect(queue.top(), "", codes);
    return codes;
}

std::string encode(const std::string& text, const CodeTable& codes) {
    std::string bits;
    for (char symbol : text) {
        const auto found = codes.find(symbol);
        if (found == codes.end()) throw std::invalid_argument("missing symbol in code table");
        bits += found->second;
    }
    return bits;
}

std::string decode(const std::string& bits, const CodeTable& codes) {
    std::unordered_map<std::string, char> symbols;
    for (const auto& [symbol, code] : codes) symbols.emplace(code, symbol);
    std::string text;
    std::string current;
    for (char bit : bits) {
        if (bit != '0' && bit != '1') throw std::invalid_argument("encoded data must contain only 0 and 1");
        current += bit;
        if (const auto found = symbols.find(current); found != symbols.end()) {
            text += found->second;
            current.clear();
        }
    }
    if (!current.empty()) throw std::invalid_argument("truncated encoded data");
    return text;
}

}  // namespace huffman
