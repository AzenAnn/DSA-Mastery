import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import MarkdownIt from "markdown-it";

const root = process.cwd();
const output = path.join(root, ".lab-cache", "ch0-teaching-verification");
await mkdir(output, { recursive: true });
const parser = new MarkdownIt();
const snippets = new Map();
for (const file of [
  "content/chapter-00-introduction/01-data-structure-basics.md",
  "content/chapter-00-introduction/02-time-and-space-complexity.md",
  "labs/chapter-00/exercise/E-00-01-operation-counter/README.md",
]) {
  for (const token of parser.parse(await readFile(path.join(root, file), "utf8"), {})) {
    if (token.type !== "fence") continue;
    const name = token.info.match(/\[([\w-]+\.cpp)\]$/)?.[1];
    if (name) {
      assert(!snippets.has(name), `Duplicate snippet: ${name}`);
      snippets.set(name, token.content);
    }
  }
}
const snippet = (name) => {
  assert(snippets.has(name), `Missing source snippet ${name}`);
  return snippets.get(name);
};
const run = (command, args) => {
  const result = spawnSync(command, args, { encoding: "utf8", timeout: 120000 });
  assert.equal(result.status, 0, `${command}: ${result.error ?? ""}\n${result.stdout}\n${result.stderr}`);
  return result.stdout;
};

for (const name of ["sequential-storage.cpp", "linked-storage.cpp", "student-list-interface.cpp"]) {
  const file = path.join(output, name);
  await writeFile(file, snippet(name));
  run("g++", ["-std=c++17", "-Wall", "-Wextra", "-pedantic", "-fsyntax-only", file]);
}

const wrappers = [
  ["rectangle-count.cpp", "rectangle", "count"],
  ["geometric-count.cpp", "geometric", "count"],
  ["reset-pointer.cpp", "reset_pointer", "count"],
  ["shared-pointer.cpp", "shared_pointer", "count"],
  ["accumulated-stop.cpp", "accumulated", "rounds"],
].map(([file, name, result]) => `long long ${name}(long long n) {\n${snippet(file)}\nreturn ${result};\n}`);

// Instrument the published comparison and actual recursive calls, without changing their control flow.
const duplicate = snippet("duplicate-pairs.cpp").replace(
  "if (ids[i] == ids[j])", "++comparisons; if (ids[i] == ids[j])",
);
const recursive = ["recursive-sum.cpp", "split-calls.cpp"].map((file) =>
  snippet(file).replace(/(long long \w+\([^\n]+\) \{)/, "$1\n    CallFrame frame;"),
).join("\n");
const quiz = JSON.parse(await readFile(path.join(root, "labs/chapter-00/theory/T-00-02-complexity-quiz/quiz.json"), "utf8"));
assert.equal(quiz.length, 19);
assert.equal(new Set(quiz.map((question) => question.id)).size, 19);
const quizWrappers = [];
for (const id of ["q1", "q3", "q5", "q6", "q7", "q13", "q15", "q18", "q19"]) {
  let code = quiz.find((question) => question.id === id).code;
  const replacements = {
    q1: ["x = 2 * x;", "{ x = 2 * x; ++ops; }"],
    q5: ["x = x + 1;", "{ x = x + 1; ++ops; }"],
    q15: ["S;", "++ops;"],
    q18: ["i = i * 3;", "{ i = i * 3; ++ops; }"],
    q19: ["i = i / 2;", "{ i = i / 2; ++ops; }"],
  };
  if (replacements[id]) {
    const [before, after] = replacements[id];
    assert(code.includes(before));
    code = code.replace(before, after);
  }
  const value = ["q3", "q7", "q13"].includes(id) ? "count" : id === "q6" ? "sum" : "ops";
  quizWrappers.push(`long long ${id}(long long n) {
    long long x=0, i=0, j=0, k=0, ops=0;
    ${id === "q3" ? "long long count=0;" : ""}
    ${code}
    return ${value};
  }`);
}
const source = `
#include <algorithm>
#include <cassert>
#include <cmath>
#include <iostream>
#include <numeric>
#include <vector>
long long comparisons=0, calls=0, active=0, peak=0;
struct CallFrame {
    CallFrame() { ++calls; ++active; peak=std::max(peak, active); }
    ~CallFrame() { --active; }
};
${duplicate}
${recursive}
${snippet("range-sum.cpp")}
${wrappers.join("\n")}
${quizWrappers.join("\n")}
${["q2", "q4", "q14"].map(id => quiz.find(question => question.id === id).code).join("\n")}
long long mixed(int n, std::vector<long long>& memo) {
    if(n<6) return 1;
    if(memo[n]) return memo[n];
    return memo[n]=3*mixed(n/4,memo)+2*mixed(n/6,memo)+1LL*n*n;
}
int main() {
    for (long long n=0; n<=4096; ++n) {
        if(n<=128) {
            assert(rectangle(n)==n*n);
            assert(reset_pointer(n)==n*(n-1)/2);
        }
        assert(shared_pointer(n)==std::max(0LL,n-1));
        long long rounds=accumulated(n);
        assert(func(static_cast<int>(n))==rounds);
        assert(rounds*(rounds+1)/2>=n);
        assert(rounds==0 || (rounds-1)*rounds/2<n);
        long long m=n<=1?0:static_cast<long long>(std::ceil(std::log2(n)));
        long long expected=(1LL<<m)-1;
        assert(geometric(n)==expected);
        assert(q6(n)==expected);
        assert(q3(n)==(n? n*(static_cast<long long>(std::floor(std::log2(n)))+1):0));
        assert(q5(n)==static_cast<long long>(std::floor(std::sqrt(n))));
        long long rows=static_cast<long long>(std::ceil(std::sqrt(n)));
        assert(q7(n)==rows*(rows-1)/2);
        long long t=n/2;
        assert(q1(n)==(t<=2?0:static_cast<long long>(std::ceil(std::log2(t/2.0)))));
        t=n/3;
        // The inequality avoids floating rounding at exact powers of three.
        long long k=q18(n), power=2;
        for(long long r=0;r<k;++r) power*=3;
        assert(power>=t && (k==0 || power/3<t));
        if(n) {
            assert(q19(n)==static_cast<long long>(std::floor(std::log2(n*n))));
            long long value=n*n, to_zero=0;
            while(value!=0) { value/=2; ++to_zero; }
            assert(to_zero==q19(n)+1);
            assert(q13(n)>=n && q13(n)<2*n);
        } else assert(q13(n)==0);
        if(n>2 && n<=128) assert(q15(n)==(n+3)*(n-2)/2);
    }
    for(long long n : {255,256,257,1023,1024,1025}) {
        assert(rectangle(n)==n*n);
        assert(reset_pointer(n)==n*(n-1)/2);
        assert(q15(n)==(n+3)*(n-2)/2);
    }
    std::cout << "PASS: published loop/quiz counts n=0..4096; quadratic loops 0..128 plus power boundaries; q19 n>=1\\n";
    for(int n=0;n<=64;++n) {
        std::vector<int> same(n,7), distinct(n);
        std::iota(distinct.begin(),distinct.end(),0);
        comparisons=0;
        assert(duplicate_pairs(same)==1LL*n*(n-1)/2);
        assert(comparisons==1LL*n*(n-1)/2);
        comparisons=0;
        assert(duplicate_pairs(distinct)==0);
        assert(comparisons==1LL*n*(n-1)/2);
        calls=active=peak=0;
        assert(recursive_sum(distinct,n)==1LL*n*(n-1)/2);
        assert(calls==n+1 && peak==n+1 && active==0);
        calls=active=peak=0;
        assert(split_calls(n)==fun(n));
        int h=n?static_cast<int>(std::floor(std::log2(n))):0;
        assert(calls==(1LL<<(h+1))-1 && peak==h+1 && active==0);
    }
    std::cout << "PASS: duplicate comparisons, recursion calls and live frames for n=0..64\\n";
    long long factorial=1;
    for(int n=0;n<=12;++n) {
        if(n>0) factorial*=n;
        assert(fact(n)==factorial);
    }
    for(int n=0;n<=50;++n) {
        std::vector<int> a(n);
        for(int i=0;i<n;++i) a[i]=(i*7)%19-9;
        const auto p=build_prefix(a);
        for(int l=0;l<=n;++l) for(int r=l;r<=n;++r)
            assert(range_sum(p,l,r)==std::accumulate(a.begin()+l,a.begin()+r,0LL));
        for(auto range : std::vector<std::pair<int,int>>{{-1,0},{1,0},{0,n+1}}) {
            bool rejected=false;
            try { range_sum(p,range.first,range.second); }
            catch(const std::out_of_range&) { rejected=true; }
            assert(rejected);
        }
    }
    auto p=build_prefix({3,1,4,1,5});
    assert(range_sum(p,0,3)==8 && range_sum(p,1,5)==11 && range_sum(p,2,4)==5);
    assert(range_sum(p,1,2)==1);
    assert(range_sum(build_prefix({3,7,4,1,5}),1,2)==7);
    std::cout << "PASS: prefix queries, empty/invalid ranges, negatives and stale-data boundary\\n";
    std::vector<long long> memo(100001);
    for(int n=6;n<=100000;++n) {
        const auto cost=mixed(n,memo);
        assert(cost>=1LL*n*n && cost<=2LL*n*n);
    }
    std::cout << "PASS: mixed recurrence n=6..100000 stays between n^2 and 2n^2\\n";
    std::cout << "n triangle geometric rectangle shared rounds\\n";
    for(long long n : {0,1,2,7,8,9})
        std::cout<<n<<' '<<reset_pointer(n)<<' '<<geometric(n)<<' '<<rectangle(n)<<' '<<shared_pointer(n)<<' '<<accumulated(n)<<'\\n';
}
`;
const main = path.join(output, "verify-counts.cpp");
const exe = path.join(output, "verify-counts.exe");
await writeFile(main, source);
run("g++", ["-std=c++17", "-O0", main, "-o", exe]);
const result = run(exe, []);
const counter = path.join(output, "counter.cpp");
await writeFile(counter, snippet("counter.cpp"));
const counterExe = path.join(output, "counter.exe");
run("g++", ["-std=c++17", "-O2", counter, "-o", counterExe]);
const counterResult = run(counterExe, []);
assert.deepEqual(counterResult.trim().split(/\r?\n/).slice(1).map((line) => line.trim().split(/\s+/).map(Number)), [
  [10,1,10,100,3], [100,1,100,10000,6], [1000,1,1000,1000000,9],
]);
const report = `${run("g++", ["--version"]).split(/\r?\n/)[0]}\n${result}\nPASS: original Lab counter output\n${counterResult}`;
await writeFile(path.join(output, "counts.txt"), report);
console.log(report);
