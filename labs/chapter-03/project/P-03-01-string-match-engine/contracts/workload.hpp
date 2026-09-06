#ifndef DSA_LAB_WORKLOAD_HPP
#define DSA_LAB_WORKLOAD_HPP

#include <cstddef>
#include <cstdint>
#include <string>

namespace dsa {

// 五类可复现工作负载（设计见 Lab README 的“工作负载”一节）。
enum class WorkloadProfile { RandomText, RepeatedPrefix, WorstCase, Realistic, Stream };

struct WorkloadSpec {
    std::string text;
    std::string pattern;
};

// 固定算法（xorshift32） + 固定 seed 生成，不依赖标准库分布器实现细节。
WorkloadSpec make_workload(WorkloadProfile profile, std::size_t size, std::uint32_t seed);

}  // namespace dsa

#endif  // DSA_LAB_WORKLOAD_HPP
