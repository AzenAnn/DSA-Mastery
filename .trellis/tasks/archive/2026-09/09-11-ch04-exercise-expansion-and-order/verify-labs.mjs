import { execFile } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { promisify } from "node:util";

const execute = promisify(execFile);
const mapping = JSON.parse(await readFile(new URL("mapping.json", import.meta.url), "utf8"));
const selected = process.argv.slice(2).map(Number);
const results = selected.length ? JSON.parse(await readFile(new URL("lab-verification.json", import.meta.url), "utf8")).filter((row) => !selected.includes(row.number)) : [];
for (const row of mapping.filter((row) => !selected.length || selected.includes(row.number))) {
  const dir = `labs/chapter-04/exercise/E-04-${String(row.number).padStart(2, "0")}-${row.slug}`;
  try {
    const { stdout } = await execute(process.execPath, ["tools/lab/cli.mjs", "verify", dir, "--json"], { maxBuffer: 16 * 1024 * 1024 });
    const report = JSON.parse(stdout);
    results.push({ number: row.number, report });
    console.log(`${row.number}: PASS ${row.slug}`);
  } catch (error) {
    results.push({ number: row.number, failure: error.stdout || error.message });
    console.error(`${row.number}: FAIL ${error.stdout || error.message}`);
  }
  await writeFile(new URL("lab-verification.json", import.meta.url), JSON.stringify(results, null, 2) + "\n");
}
if (results.some((result) => result.failure)) process.exitCode = 1;
