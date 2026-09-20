import { auditGuidePages } from "@dsa/course-index";
import { expect, it } from "vitest";
import { siteArtifact } from "../../support/site-artifact.ts";

it("前言与各篇指南渲染出预期内容", async () => {
  await expect(auditGuidePages(await siteArtifact())).resolves.toBeUndefined();
});
