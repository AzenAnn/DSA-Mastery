import assert from "node:assert/strict";
import test from "node:test";
import { remapEventKeys, remapRecordKeys } from "../src/progressKeys.ts";

test("merges legacy and current directory records under one stable ID", () => {
  const source = {
    "01E01": { attempts: 2 },
    "E-01-01-sequential-list": { attempts: 3 },
    "lab-01-06-sequential-list": { attempts: 4 },
  };
  const aliases = [
    { id: "01E01", name: "E-01-01-sequential-list" },
    { id: "01E01", name: "lab-01-06-sequential-list" },
  ];

  const migrated = remapRecordKeys(source, aliases, (stable, legacy) => ({
    attempts: stable.attempts + legacy.attempts,
  }));

  assert.equal(migrated.changed, true);
  assert.deepEqual(migrated.records, { "01E01": { attempts: 9 } });
  assert.deepEqual(source, {
    "01E01": { attempts: 2 },
    "E-01-01-sequential-list": { attempts: 3 },
    "lab-01-06-sequential-list": { attempts: 4 },
  });
});

test("rewrites legacy activity keys without changing event order or payload", () => {
  const events = [
    { labName: "lab-01-06-sequential-list", kind: "submit" },
    { labName: "01E01", kind: "pass" },
  ];

  const migrated = remapEventKeys(events, [{ id: "01E01", name: "lab-01-06-sequential-list" }]);

  assert.equal(migrated.changed, true);
  assert.deepEqual(migrated.events, [
    { labName: "01E01", kind: "submit" },
    { labName: "01E01", kind: "pass" },
  ]);
});
