import type { SiteArtifact } from "@dsa/course-index";
import { readFile } from "node:fs/promises";
import { setTimeout as sleep } from "node:timers/promises";
import { normalizeBase, readSiteArtifact } from "@dsa/course-index";
import { inject } from "vitest";
import { REPO_ROOT } from "./repo.ts";

const DEADLINE_MS = 15 * 60_000;

let pending: Promise<SiteArtifact> | undefined;

/** 等后台那次 VitePress 构建落地，然后读一次产物清单给所有站点测试共用。 */
export function siteArtifact(): Promise<SiteArtifact> {
  pending ??= (async () => {
    const { root, base, doneFile } = inject("siteArtifact");
    const deadline = Date.now() + DEADLINE_MS;
    for (;;) {
      let outcome: { ok: boolean; code: number | null; log: string } | undefined;
      try {
        outcome = JSON.parse(await readFile(doneFile, "utf8")) as { ok: boolean; code: number | null; log: string };
      } catch {
        if (Date.now() > deadline) throw new Error("等待 VitePress 构建超时");
        await sleep(500);
        continue;
      }
      if (!outcome.ok) throw new Error(`VitePress 构建失败（exit ${outcome.code}）：\n${outcome.log}`);

      return readSiteArtifact(REPO_ROOT, root, normalizeBase(base));
    }
  })();

  return pending;
}
