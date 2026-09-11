#pragma once

#include <cstddef>
#include <vector>

namespace sortlab {

// 排序的载荷：key 决定比较次序，tag 是卫星数据（通常是原始序号）。
// 稳定排序会保持 key 相同的元素的相对顺序，因此 tag 可用于观测稳定性。
struct Record {
    int key;
    int tag;
};

// 算法自身统计的确定性指标，用于对比四种基础排序的代价。
// 这两个计数的单位不同，只能分别解释，不能直接相加比较。
struct SortMetrics {
    std::size_t comparisons = 0;  // 对 Record::key 执行的大小比较次数
    std::size_t moves = 0;        // 把某个 Record 写入数组位置的赋值次数
};

// 希尔排序的增量序列策略：Shell(1959) 的 n/2 折半，或 Hibbard 的 2^k - 1。
enum class GapSequence { Shell, Hibbard };

// 排序器公共契约。sort() 对 [0, n) 按 key 排序并累计 comparisons / moves；
// resetMetrics() 清零计数，metrics() 读取当前累计值。
// 注意：sort() 会修改计数，因此不是 const；metrics() 只读。
class Sorter {
public:
    virtual ~Sorter() = default;
    virtual const char* name() const = 0;
    virtual bool isStable() const noexcept = 0;
    virtual void sort(std::vector<Record>& a) = 0;
    virtual SortMetrics metrics() const = 0;
    virtual void resetMetrics() = 0;
};

class InsertionSorter final : public Sorter {
public:
    const char* name() const override;
    bool isStable() const noexcept override;
    void sort(std::vector<Record>& a) override;
    SortMetrics metrics() const override;
    void resetMetrics() override;

private:
    SortMetrics metrics_;
};

class SelectionSorter final : public Sorter {
public:
    const char* name() const override;
    bool isStable() const noexcept override;
    void sort(std::vector<Record>& a) override;
    SortMetrics metrics() const override;
    void resetMetrics() override;

private:
    SortMetrics metrics_;
};

class BubbleSorter final : public Sorter {
public:
    const char* name() const override;
    bool isStable() const noexcept override;
    void sort(std::vector<Record>& a) override;
    SortMetrics metrics() const override;
    void resetMetrics() override;

private:
    SortMetrics metrics_;
};

class ShellSorter final : public Sorter {
public:
    explicit ShellSorter(GapSequence policy = GapSequence::Shell);

    const char* name() const override;
    bool isStable() const noexcept override;
    void sort(std::vector<Record>& a) override;
    SortMetrics metrics() const override;
    void resetMetrics() override;

    const char* gapName() const;  // "shell" 或 "hibbard"

private:
    GapSequence policy_;
    SortMetrics metrics_;
};

}  // namespace sortlab
