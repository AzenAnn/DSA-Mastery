import { loadContentCorpus } from "@dsa/course-index";
import { describe, expect, it } from "vitest";
import { REPO_ROOT } from "../support/repo.ts";

// 整份语料只解析一次，下面每条规则各自断言，一次报完所有出问题的文件。
const corpus = await loadContentCorpus(REPO_ROOT);

describe.concurrent("教材与 Lab 的 frontmatter 契约", () => {
  it("每页都声明了必填字段", () => {
    expect(corpus.of("required-fields")).toEqual([]);
  });

  it("status 只能是 draft、review 或 published", () => {
    expect(corpus.of("status-enum")).toEqual([]);
  });

  it("updated 使用 YYYY-MM-DD", () => {
    expect(corpus.of("updated-format")).toEqual([]);
  });

  it("order 是非负整数", () => {
    expect(corpus.of("order-format")).toEqual([]);
  });

  it("chapter 是非负整数或受支持的 preface", () => {
    expect(corpus.of("chapter-format")).toEqual([]);
  });

  it("教材路径符合 chapter-NN/NN-slug.md", () => {
    expect(corpus.of("lesson-path")).toEqual([]);
  });

  it("chapter + order 在同类文档内唯一", () => {
    expect(corpus.of("order-unique")).toEqual([]);
  });

  it("语料非空", () => {
    expect(corpus.lessonCount).toBeGreaterThan(0);
    expect(corpus.labCount).toBeGreaterThan(0);
  });
});
