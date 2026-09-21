import { randomBytes } from "node:crypto";

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** WebView 的 CSP 只放行带本次 nonce 的内联脚本，猜得出来就等于没设防，必须用随机数发生器。 */
export function nonce(): string {
  return randomBytes(16).toString("base64url");
}
