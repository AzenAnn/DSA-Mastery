#include "workload.hpp"

#include <cstdint>
#include <string_view>

namespace dsa {

namespace {

std::uint32_t xorshift32(std::uint32_t& state) {
    state ^= state << 13;
    state ^= state >> 17;
    state ^= state << 5;
    return state;
}

std::size_t max_one(std::size_t value) {
    return value < 1 ? 1 : value;
}

}  // namespace

WorkloadSpec make_workload(WorkloadProfile profile, std::size_t size, std::uint32_t seed) {
    std::uint32_t state = seed;
    WorkloadSpec spec;
    switch (profile) {
        case WorkloadProfile::RandomText: {
            constexpr std::string_view alphabet = "abcdefgh";
            spec.text.reserve(size);
            for (std::size_t i = 0; i < size; ++i) {
                spec.text.push_back(alphabet[xorshift32(state) % alphabet.size()]);
            }
            spec.pattern = "bcd";
            break;
        }
        case WorkloadProfile::RepeatedPrefix: {
            const std::size_t m = max_one(size / 4);
            spec.text.assign(size, 'a');
            if (!spec.text.empty()) spec.text.back() = 'b';
            spec.pattern.assign(m, 'a');
            spec.pattern.back() = 'b';
            break;
        }
        case WorkloadProfile::WorstCase: {
            const std::size_t m = max_one(size / 8);
            spec.text.assign(size, '0');
            if (!spec.text.empty()) spec.text.back() = '1';
            spec.pattern.assign(m, '0');
            spec.pattern.back() = '1';
            break;
        }
        case WorkloadProfile::Realistic:
        case WorkloadProfile::Stream: {
            constexpr std::string_view sentence = "the quick brown fox jumps over the lazy dog ";
            while (spec.text.size() < size) spec.text.append(sentence);
            spec.text.resize(size);
            spec.pattern = "brown fox";
            break;
        }
    }
    return spec;
}

}  // namespace dsa
