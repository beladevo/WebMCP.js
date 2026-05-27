import type { ToolCondition } from "./types.js";

export function condition(
  check: () => boolean | Promise<boolean>,
  reason: string
): ToolCondition {
  return { check, reason };
}
