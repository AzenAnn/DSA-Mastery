import { expect, it } from "vitest";
import { remapEventKeys, remapRecordKeys } from "../src/progressKeys.ts";

it("merges legacy and current directory records under one stable ID", () => {
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

  expect(migrated.changed).toBe(true);
  expect(migrated.records).toStrictEqual({ "01E01": { attempts: 9 } });
  expect(source).toStrictEqual({
    "01E01": { attempts: 2 },
    "E-01-01-sequential-list": { attempts: 3 },
    "lab-01-06-sequential-list": { attempts: 4 },
  });
});

it("rewrites legacy activity keys without changing event order or payload", () => {
  const events = [
    { labName: "lab-01-06-sequential-list", kind: "submit" },
    { labName: "01E01", kind: "pass" },
  ];

  const migrated = remapEventKeys(events, [{ id: "01E01", name: "lab-01-06-sequential-list" }]);

  expect(migrated.changed).toBe(true);
  expect(migrated.events).toStrictEqual([
    { labName: "01E01", kind: "submit" },
    { labName: "01E01", kind: "pass" },
  ]);
});

it("new category directory keys and old flat directory keys converge on one stable ID", () => {
  const aliases = [
    { id: "01E04", name: "E-01-04-singly-linked-list-reverse" },
    { id: "01E04", name: "lab-01-09-singly-linked-list-reverse" },
  ];
  const migrated = remapRecordKeys(
    {
      "E-01-04-singly-linked-list-reverse": { attempts: 2 },
      "lab-01-09-singly-linked-list-reverse": { attempts: 3 },
    },
    aliases,
    (stable, legacy) => ({ attempts: stable.attempts + legacy.attempts }),
  );
  expect(migrated.records).toStrictEqual({ "01E04": { attempts: 5 } });
});
