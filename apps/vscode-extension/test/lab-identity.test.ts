import { expect, it } from "vitest";
import { readStableLabId, shortLabTitle } from "../src/labIdentity.ts";

it("accepts a PR#122 stable ID and falls back for missing or malformed metadata", () => {
  expect(readStableLabId("01E01", "E-01-01-demo")).toBe("01E01");
  expect(readStableLabId(" 01T02 ", "T-01-02-demo")).toBe("01T02");
  expect(readStableLabId(undefined, "lab-01-02-demo")).toBe("lab-01-02-demo");
  expect(readStableLabId("01X01", "lab-01-02-demo")).toBe("lab-01-02-demo");
});

it("removes both legacy and PR#122 number prefixes from sidebar titles", () => {
  expect(shortLabTitle("Lab 01-E-01：有序顺序表去重")).toBe("有序顺序表去重");
  expect(shortLabTitle("Lab 01E01:有序顺序表去重")).toBe("有序顺序表去重");
  expect(shortLabTitle("没有编号的题目")).toBe("没有编号的题目");
});
