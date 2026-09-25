export function commandText(command: string, args: readonly unknown[] = []): string {
  return [command, ...args]
    .map((part) => {
      const value = String(part);

      return /[\s"']/u.test(value) ? JSON.stringify(value) : value;
    })
    .join(" ");
}
