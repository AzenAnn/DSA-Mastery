import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const packagePath = path.join(projectRoot, "node_modules", "vinext", "package.json");
const prerenderPath = path.join(
  projectRoot,
  "node_modules",
  "vinext",
  "dist",
  "build",
  "prerender.js",
);

const vinextPackage = JSON.parse(await readFile(packagePath, "utf8"));
if (vinextPackage.version !== "1.0.0-beta.5") {
  throw new Error(
    `Unsupported vinext version ${vinextPackage.version}. Review the Pages compatibility patch before upgrading.`,
  );
}

const patches = [
  {
    name: "basePath-aware HTML prerender request",
    before: '\t\t\t\tconst htmlRequest = new Request(`http://localhost${urlPath}`, { headers: htmlHeaders });',
    after: [
      '\t\t\t\tconst routedPath = config.trailingSlash && urlPath !== "/" ? `${urlPath}/` : urlPath;',
      "\t\t\t\tconst requestPath = config.basePath",
      '\t\t\t\t\t? routedPath === "/" ? `${config.basePath}/` : `${config.basePath}${routedPath}`',
      "\t\t\t\t\t: routedPath;",
      '\t\t\t\tconst htmlRequest = new Request(`http://localhost${requestPath}`, { headers: htmlHeaders });',
    ].join("\n"),
  },
  {
    name: "basePath-aware RSC prerender request",
    before: '\t\t\t\t\tconst rscRequest = new Request(`http://localhost${urlPath}`, { headers: rscHeaders });',
    after: '\t\t\t\t\tconst rscRequest = new Request(`http://localhost${requestPath}`, { headers: rscHeaders });',
  },
  {
    name: "basePath-aware not-found prerender request",
    before: '\t\t\tconst notFoundRequest = new Request(`http://localhost${NOT_FOUND_SENTINEL_PATH}`);',
    after: [
      '\t\t\tconst notFoundRoute = config.trailingSlash ? `${NOT_FOUND_SENTINEL_PATH}/` : NOT_FOUND_SENTINEL_PATH;',
      '\t\t\tconst notFoundPath = config.basePath ? `${config.basePath}${notFoundRoute}` : notFoundRoute;',
      '\t\t\tconst notFoundRequest = new Request(`http://localhost${notFoundPath}`);',
    ].join("\n"),
  },
];

let source = await readFile(prerenderPath, "utf8");
let applied = 0;

for (const patch of patches) {
  if (source.includes(patch.after)) continue;
  if (!source.includes(patch.before)) {
    throw new Error(`Could not apply ${patch.name}; vinext internals changed.`);
  }
  source = source.replace(patch.before, patch.after);
  applied += 1;
}

if (applied > 0) await writeFile(prerenderPath, source, "utf8");
console.log(applied > 0
  ? `Applied ${applied} vinext GitHub Pages compatibility patches.`
  : "vinext GitHub Pages compatibility patches are already applied.");
