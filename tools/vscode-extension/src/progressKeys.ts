export interface LabKeyAlias {
  id: string;
  name: string;
}

export function remapRecordKeys<T>(
  source: Record<string, T>,
  aliases: readonly LabKeyAlias[],
  merge: (stable: T, legacy: T) => T,
): { records: Record<string, T>; changed: boolean } {
  const records = { ...source };
  let changed = false;
  for (const alias of aliases) {
    if (alias.id === alias.name || records[alias.name] === undefined) continue;
    records[alias.id] = records[alias.id] === undefined
      ? records[alias.name]
      : merge(records[alias.id], records[alias.name]);
    delete records[alias.name];
    changed = true;
  }
  return { records, changed };
}

export function remapEventKeys<T extends { labName: string }>(
  source: readonly T[],
  aliases: readonly LabKeyAlias[],
): { events: T[]; changed: boolean } {
  const byName = new Map(aliases.map((alias) => [alias.name, alias.id]));
  let changed = false;
  const events = source.map((event) => {
    const id = byName.get(event.labName);
    if (!id || id === event.labName) return event;
    changed = true;
    return { ...event, labName: id };
  });
  return { events, changed };
}
