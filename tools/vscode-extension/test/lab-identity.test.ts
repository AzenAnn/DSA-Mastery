import assert from "node:assert/strict";
import test from "node:test";
import { readStableLabId } from "../src/labIdentity.ts";

test("VS Code reads stable IDs and keeps a legacy directory fallback", () => {
  assert.equal(readStableLabId("02E01", "lab-02-03-old"), "02E01");
  assert.equal(readStableLabId(undefined, "lab-02-03-old"), "lab-02-03-old");
  assert.equal(readStableLabId("bad-id", "lab-02-03-old"), "lab-02-03-old");
});
