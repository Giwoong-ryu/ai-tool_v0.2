declare global {
  interface Window {
    gtag?: (...a: any[]) => void;
  }
}
export function track(
  event: string,
  params: Record<string, any> = {},
  debug = false
) {
  if (!window.gtag) return;
  const safe = event.replace(/[^a-zA-Z0-9_]/g, "_"); // GA4 규칙
  window.gtag("event", safe, { ...params, debug_mode: debug });
}
// 사용: track('compile_prompt', { template_id: 'summary.weekly_report', mode: 'simple' }, true);
