import { auditCurriculum } from "@dsa/course-index";
import { expect, it } from "vitest";
import { siteArtifact } from "../../support/site-artifact.ts";

it("课程框架、侧栏与本地搜索产物符合预期", async () => {
  await expect(auditCurriculum(await siteArtifact())).resolves.toBeUndefined();
});
