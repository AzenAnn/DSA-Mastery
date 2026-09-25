import { loadContentCorpus } from "@dsa/course-index";
import { expect, it } from "vitest";
import { REPO_ROOT } from "../support/repo.ts";

const corpus = await loadContentCorpus(REPO_ROOT);

it("教材与 Lab 之间的相对 .md 链接都指向真实文件", () => {
  expect(corpus.of("links")).toEqual([]);
});
