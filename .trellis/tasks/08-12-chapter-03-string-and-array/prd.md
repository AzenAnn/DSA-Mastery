# PRD：第 3 章 字符串与数组

## 目标

串的存储与匹配、KMP 算法、数组寻址与特殊矩阵压缩。

## 内容分工

- 01-string：串的存储表示、朴素匹配与复杂度；
- 02-kmp：KMP 思路、next 数组递推与复杂度论证；
- 03-matrix：多维数组寻址公式、对称/三角矩阵压缩、稀疏矩阵三元组。

## 配套 Labs

- 字符串匹配工具（朴素 vs KMP 对比）；
- 稀疏矩阵三元组表示与转置。

## 依赖

无强依赖，可与第 4 章并行调研。建议作为第 2 章之后的第一个验证章，完整走一遍 Owner/Review 轮换流程。

## 验收标准

- 参考 `.trellis/spec/content/frontmatter-and-routing.md` 与 `labs.md`；
- `pnpm run validate:content`、`build`、`check:site` 通过；
- 至少一处 `$$...$$` 推导（如 next 数组递推或 KMP 复杂度）。

## 归属

- Chapter Owner：xy3（轮换表第 3 章）；Review Owner：Azen。
