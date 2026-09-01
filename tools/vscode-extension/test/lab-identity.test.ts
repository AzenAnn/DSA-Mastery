import assert from "node:assert/strict";
import test from "node:test";
import { readStableLabId, shortLabTitle } from "../src/labIdentity.ts";

test("accepts a PR#122 stable ID and falls back for missing or malformed metadata", () => {
  assert.equal(readStableLabId("01E01", "E-01-01-demo"), "01E01");
  assert.equal(readStableLabId(" 01T02 ", "T-01-02-demo"), "01T02");
  assert.equal(readStableLabId(undefined, "lab-01-02-demo"), "lab-01-02-demo");
  assert.equal(readStableLabId("01X01", "lab-01-02-demo"), "lab-01-02-demo");
});

test("removes both legacy and PR#122 number prefixes from sidebar titles", () => {
  assert.equal(shortLabTitle("Lab 01-E-01：有序顺序表去重"), "有序顺序表去重");
  assert.equal(shortLabTitle("Lab 01E01:有序顺序表去重"), "有序顺序表去重");
  assert.equal(shortLabTitle("没有编号的题目"), "没有编号的题目");
});
