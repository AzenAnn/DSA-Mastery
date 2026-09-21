export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** WebView 的 CSP 只放行带本次 nonce 的内联脚本，每次渲染都要换一个。 */
export function nonce(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
