import { auditPages } from "@dsa/course-index";
import { expect, it } from "vitest";
import { siteArtifact } from "../../support/site-artifact.ts";

it("产物包含全部课程页面，且内部链接与 H1 都成立", async () => {
  await expect(auditPages(await siteArtifact())).resolves.toBeUndefined();
});
