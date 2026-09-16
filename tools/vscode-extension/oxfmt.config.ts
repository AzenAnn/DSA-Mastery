import { oxfmt } from "@mzwing/oxc-config";

// 与仓库根一致：分号、双引号、单参数箭头函数带括号。
export default oxfmt({
  arrowParens: "always",
  semi: true,
  singleQuote: false,
  ignores: ["dist/**", "out/**", "media/**", "**/*.md"],
});
