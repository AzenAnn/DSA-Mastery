import assert from "node:assert/strict";
import test from "node:test";
import { remapEventKeys, remapRecordKeys } from "../src/progressKeys.ts";

test("legacy directory progress keys migrate to stable Lab IDs", () => {
  const aliases = [{ id: "01E04", name: "lab-01-09-singly-linked-list-reverse" }];
  const single = remapRecordKeys(
    { "lab-01-09-singly-linked-list-reverse": { attempts: 3 } },
    aliases,
    (stable, legacy) => ({ attempts: stable.attempts + legacy.attempts }),
  );
  assert.equal(single.changed, true);
  assert.deepEqual(single.records, { "01E04": { attempts: 3 } });

  const collision = remapRecordKeys(
    {
      "01E04": { attempts: 2 },
      "lab-01-09-singly-linked-list-reverse": { attempts: 3 },
    },
    aliases,
    (stable, legacy) => ({ attempts: stable.attempts + legacy.attempts }),
  );
  assert.deepEqual(collision.records, { "01E04": { attempts: 5 } });
});

test("activity events keep their history while replacing legacy keys", () => {
  const migrated = remapEventKeys(
    [
      { labName: "lab-01-09-singly-linked-list-reverse", kind: "submit" },
      { labName: "01T01", kind: "pass" },
    ],
    [{ id: "01E04", name: "lab-01-09-singly-linked-list-reverse" }],
  );
  assert.equal(migrated.changed, true);
  assert.deepEqual(migrated.events.map((event) => event.labName), ["01E04", "01T01"]);
});
