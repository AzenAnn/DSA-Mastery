import { loadContentCorpus } from "@dsa/course-index";
import { describe, expect, it } from "vitest";
import { REPO_ROOT } from "../support/repo.ts";

const corpus = await loadContentCorpus(REPO_ROOT);

describe.concurrent("Lab 目录布局与稳定编号", () => {
  it("每章保留三个分类目录且命名规范", () => {
    expect(corpus.of("lab-layout")).toEqual([]);
  });

  it("Lab 声明了 lab、difficulty、duration 与分类", () => {
    expect(corpus.of("lab-fields")).toEqual([]);
  });

  it("labId 规范、唯一，且与章节和分类一致", () => {
    expect(corpus.of("lab-id")).toEqual([]);
  });

  it("目录编号与 labId 一致", () => {
    expect(corpus.of("lab-directory")).toEqual([]);
  });

  it("标题与 H1 带规范的 Lab 编号前缀", () => {
    expect(corpus.of("lab-title")).toEqual([]);
  });

  it("每个 lab.json 都通过完整 manifest 校验", () => {
    expect(corpus.of("manifest")).toEqual([]);
    expect(corpus.manifestCount).toBeGreaterThan(0);
  });

  it("交互 Quiz 的题面与题库满足合同", () => {
    expect(corpus.of("quiz")).toEqual([]);
    expect(corpus.interactiveQuizCount).toBeGreaterThan(0);
  });
});
