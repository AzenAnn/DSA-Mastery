import type { RunOptions, Runner } from "@dsa/lab-core";
import { runProcess } from "@dsa/lab-core";

export interface CommandExistsOptions extends RunOptions {
  args?: string[];
  runner?: Runner;
}

export async function commandExists(command: string, options: CommandExistsOptions = {}): Promise<boolean> {
  const { args, runner = runProcess, ...rest } = options;
  const result = await runner(command, args ?? ["--version"], {
    ...rest,
    timeMs: rest.timeMs ?? 5000,
    outputKb: rest.outputKb ?? 256,
  });

  return !result.spawnError && result.code === 0;
}

export function commandText(command: string, args: readonly unknown[] = []): string {
  return [command, ...args]
    .map((part) => {
      const value = String(part);

      return /[\s"']/u.test(value) ? JSON.stringify(value) : value;
    })
    .join(" ");
}
